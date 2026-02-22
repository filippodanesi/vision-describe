import { useState, useRef, useCallback, useEffect } from 'react';
import { useCostTracker } from './useCostTracker';
import { Model } from '@/lib/models';
import {
  createProcessingChunks,
  ProcessingChunk,
  ProcessingResult
} from '@/lib/api/serverProcessing';
import { startServerRun, cancelServerRun } from '@/lib/api/serverRun';
import { optimizeTextWithAI } from '../utils/optimizationUtils';
import { processAmazonRows } from '../processing/processAmazon';
import {
  createRun,
  saveRowResult,
  updateRunStatus,
  heartbeat as runHeartbeat,
  getRunResults,
  type RunRecord,
} from '@/lib/runPersistence';
import { supabase } from '@/lib/supabase';

// Utility function to find matching short description column
const findMatchingShortDescriptionColumn = (columnNames: string[], targetLanguage: string): string => {
  const lang = targetLanguage.toLowerCase();
  const langUpper = lang.toUpperCase();

  // First priority: exact language match with strict patterns
  for (const key of columnNames) {
    const lower = key.toLowerCase();
    if (lower.includes('short description')) {
      const patterns = [
        ` ${lang}$`, ` ${langUpper}$`,
        `\[${lang}\]`, `\[${langUpper}\]`,
        `_${lang}$`, `_${langUpper}$`,
        ` ${lang} `, ` ${langUpper} `
      ];
      for (const pattern of patterns) {
        const regex = new RegExp(pattern);
        if (regex.test(lower) || regex.test(key)) return key;
      }
    }
  }

  // Second priority: plural form
  for (const key of columnNames) {
    const lower = key.toLowerCase();
    if (lower.includes('short descriptions')) {
      const patterns = [
        ` ${lang}$`, ` ${langUpper}$`,
        `\[${lang}\]`, `\[${langUpper}\]`,
        `_${lang}$`, `_${langUpper}$`,
        ` ${lang} `, ` ${langUpper} `
      ];
      for (const pattern of patterns) {
        const regex = new RegExp(pattern);
        if (regex.test(lower) || regex.test(key)) return key;
      }
    }
  }

  return '';
};

export interface HybridProcessingHook {
  isProcessing: boolean;
  progress: number;
  totalRows: number;
  processedRows: number;
  logs: string[];
  estimatedTimeRemaining: string;
  processingMode: 'server' | 'client' | 'checking';
  costTracker: ReturnType<typeof useCostTracker>;
  currentRunId: string | null;
  processFile: (
    rows: any[],
    columns: string[],
    model: Model,
    apiKey: string,
    context?: {
      useCase?: 'ecommerce' | 'amazon' | 'partoo' | 'aboutyou' | 'next';
      mappings?: any;
      lang?: string;
      dryRun?: boolean;
      businessIdsFilter?: Set<string> | null;
      storeTypeFilter?: Set<string> | null;
      colorMappings?: any[];
      sizeMappings?: any[];
      fileName?: string;
      resumeRunId?: string;
      skipIndices?: Set<number>;
      existingResults?: any[];
      projectId?: string;
    },
    costTracker?: any
  ) => Promise<any[]>;
  cancelProcessing: () => void;
  reconnectToRun: (run: RunRecord) => Promise<any[]>;
}

export const useHybridProcessing = (): HybridProcessingHook => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');
  const [processingMode, setProcessingMode] = useState<'server' | 'client' | 'checking'>('checking');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  const costTracker = useCostTracker();
  const cancelRequested = useRef(false);
  const startTimeRef = useRef<number>(0);
  const runIdRef = useRef<string | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  // Cleanup Realtime subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  // beforeunload handler — only mark as interrupted for client-side runs
  useEffect(() => {
    const handleBeforeUnload = () => {
      const rid = runIdRef.current;
      if (!rid) return;
      // For server-side runs, don't mark as interrupted — the server continues
      if (processingMode === 'server') return;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) return;
      const url = `${supabaseUrl}/rest/v1/runs?id=eq.${rid}`;
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${document.cookie.match(/sb-.*-auth-token=([^;]+)/)?.[1] || supabaseKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ status: 'interrupted' }),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [processingMode]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const cancelProcessing = useCallback(async () => {
    cancelRequested.current = true;
    addLog('Cancellation requested by user');

    // For server-side runs, also call the cancel API
    const rid = runIdRef.current;
    if (rid && processingMode === 'server') {
      try {
        await cancelServerRun(rid);
        addLog('Server-side cancellation sent');
      } catch (err) {
        console.error('Failed to cancel server run:', err);
      }
    }
  }, [processingMode, addLog]);

  // Subscribe to Supabase Realtime for a server-side run
  const subscribeToRunUpdates = useCallback((runId: string, totalRowCount: number) => {
    // Clean up previous subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel(`run-${runId}`)
      // Listen to run status/progress updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'runs',
          filter: `id=eq.${runId}`,
        },
        (payload: any) => {
          const updated = payload.new;
          if (!updated) return;

          const count = updated.processed_count || 0;
          setProcessedRows(count);
          if (totalRowCount > 0) {
            setProgress(Math.round((count / totalRowCount) * 100));
          }

          if (updated.status === 'completed') {
            addLog(`Server processing completed (${count} rows)`);
            setProgress(100);
          } else if (updated.status === 'cancelled') {
            addLog('Run cancelled');
          } else if (updated.status === 'interrupted') {
            addLog(`Run interrupted: ${updated.error_message || 'unknown error'}`);
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [addLog]);

  // --- Server-side processing path ---
  const processWithServer = async (
    rows: any[],
    selectedColumns: string[],
    model: Model,
    context?: any
  ): Promise<{ runId: string }> => {
    const config = {
      useCase: context?.useCase || 'ecommerce',
      modelId: model.id,
      selectedColumns,
      mappings: context?.mappings,
      lang: context?.lang,
      dryRun: context?.dryRun,
      businessIdsFilter: context?.businessIdsFilter
        ? Array.from(context.businessIdsFilter)
        : undefined,
      storeTypeFilter: context?.storeTypeFilter
        ? Array.from(context.storeTypeFilter)
        : undefined,
      colorMappings: context?.colorMappings,
      sizeMappings: context?.sizeMappings,
      projectId: context?.projectId,
    };

    const { runId } = await startServerRun(rows, context?.fileName || 'file.xlsx', config);
    return { runId };
  };

  // --- Client-side processing fallback ---
  const processChunkClientSide = async (
    chunk: ProcessingChunk,
    globalRowOffset: number = 0,
    totalGlobalRows: number = 0,
    costTracker?: any
  ): Promise<ProcessingResult> => {
    const { rows, selectedColumns, model, apiKey } = chunk;
    const processedRows: any[] = [];
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const row of rows) {
      if (cancelRequested.current) break;

      const processedRow = { ...row };
      const productId = row['MaterialSAPMaterialNo'] || row['ColorSAPMaterialNo'] || row['ProductID'] || row['ID'] || `Row ${processedRows.length + 1}`;

      for (const column of selectedColumns) {
        const original = row[column];
        if (!original || typeof original !== 'string') continue;

        const langMatch = column.match(/_([a-z]{2})$/i);
        const language = langMatch ? langMatch[1].toUpperCase() : 'UNK';

        try {
          let targetKeywords: string[] = [];
          if (langMatch) {
            const lang = langMatch[1].toLowerCase();
            const columnNames = Object.keys(row);
            const matchingShortDescKey = findMatchingShortDescriptionColumn(columnNames, lang);
            if (matchingShortDescKey) {
              const cellValue = row[matchingShortDescKey];
              let value = '';
              if (typeof cellValue === 'object' && cellValue !== null) {
                value = String(cellValue.result || cellValue.v || cellValue.value || cellValue).trim();
              } else {
                value = String(cellValue).trim();
              }
              if (value && value !== '[object Object]') {
                targetKeywords = [value];
              }
            }
          }

          const keywordText = targetKeywords.length > 0 ? targetKeywords[0] : 'no category';
          addLog(`${productId} | ${language.toLowerCase()} | ${keywordText}`);

          const result = await optimizeTextWithAI(original, targetKeywords, {}, model, apiKey);
          processedRow[column] = result.content;

          let costRecord = null;
          if (costTracker) {
            costRecord = costTracker.trackOperation(model.id, original, result.content, {
              inputTokens: result.tokens.inputTokens,
              outputTokens: result.tokens.outputTokens
            });
          }
          const cost = costRecord?.actualCost || costRecord?.estimatedCost || 0;
          totalCost += cost;
          totalInputTokens += result.tokens.inputTokens;
          totalOutputTokens += result.tokens.outputTokens;
        } catch (error) {
          console.error(`Error processing column ${column}:`, error);
          processedRow[column] = original;
        }
      }

      processedRows.push(processedRow);
      const globalProcessedRows = globalRowOffset + processedRows.length;
      if (totalGlobalRows > 0) {
        setProgress(Math.round((globalProcessedRows / totalGlobalRows) * 100));
      }
    }

    return {
      success: true,
      processedRows,
      cost: { totalCost, tokenUsage: { input: totalInputTokens, output: totalOutputTokens } },
      chunkIndex: chunk.chunkIndex
    };
  };

  const processFile = async (
    rows: any[],
    selectedColumns: string[],
    model: Model,
    apiKey: string,
    context?: {
      useCase?: 'ecommerce' | 'amazon' | 'partoo' | 'aboutyou' | 'next';
      mappings?: any;
      lang?: string;
      dryRun?: boolean;
      businessIdsFilter?: Set<string> | null;
      storeTypeFilter?: Set<string> | null;
      colorMappings?: any[];
      sizeMappings?: any[];
      fileName?: string;
      resumeRunId?: string;
      skipIndices?: Set<number>;
      existingResults?: any[];
      projectId?: string;
    },
    costTracker?: any
  ): Promise<any[]> => {
    setIsProcessing(true);
    setProgress(0);
    const effectiveRows = context?.dryRun ? rows.slice(0, 10) : rows;
    setTotalRows(effectiveRows.length);
    setProcessedRows(context?.existingResults?.length || 0);
    setLogs([]);
    setEstimatedTimeRemaining('');
    cancelRequested.current = false;
    startTimeRef.current = Date.now();

    // --- Try server-side processing first ---
    // Skip server-side for resume runs (they already have a run record)
    if (!context?.resumeRunId) {
      try {
        setProcessingMode('checking');
        addLog('Starting server-side processing...');

        const { runId } = await processWithServer(effectiveRows, selectedColumns, model, context);

        setProcessingMode('server');
        runIdRef.current = runId;
        setCurrentRunId(runId);
        addLog(`Server run ${runId.substring(0, 8)}... started — you can safely close this tab`);

        // Subscribe to Realtime updates
        subscribeToRunUpdates(runId, effectiveRows.length);

        // Poll until run is finished (Realtime updates the UI, but we need to wait for completion)
        const results = await waitForServerCompletion(runId, effectiveRows.length);

        runIdRef.current = null;
        setIsProcessing(false);
        return results;
      } catch (serverError) {
        console.warn('Server-side processing failed, falling back to client:', serverError);
        addLog('Server unavailable — falling back to client-side processing');
        // Clean up Realtime subscription
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
      }
    }

    // --- Fallback: client-side processing ---
    let activeRunId = context?.resumeRunId || null;
    if (!activeRunId) {
      activeRunId = await createRun({
        useCase: context?.useCase || 'ecommerce',
        modelId: model.id,
        fileName: context?.fileName,
        totalRows: effectiveRows.length,
        config: { useCase: context?.useCase, dryRun: context?.dryRun },
        projectId: context?.projectId,
      });
    }
    runIdRef.current = activeRunId;
    setCurrentRunId(activeRunId);
    setProcessingMode('client');

    if (activeRunId) {
      addLog(`Run ${activeRunId.substring(0, 8)}... created (client-side)`);
    }

    const heartbeatInterval = activeRunId
      ? setInterval(() => { if (activeRunId) runHeartbeat(activeRunId); }, 30000)
      : null;

    try {
      const results = await processWithClient(
        effectiveRows, selectedColumns, model, apiKey, context, activeRunId
      );

      if (activeRunId) {
        const stats = costTracker?.getSessionStats?.();
        await updateRunStatus(activeRunId, 'completed', stats ? {
          totalCost: stats.totalActualCost,
          tokensIn: stats.totalTokensInput,
          tokensOut: stats.totalTokensOutput,
        } : undefined);
      }
      runIdRef.current = null;
      return results;
    } catch (error) {
      if (activeRunId) {
        await updateRunStatus(activeRunId, 'interrupted');
      }
      runIdRef.current = null;
      console.error('Processing error:', error);
      throw error;
    } finally {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      setIsProcessing(false);
    }
  };

  /** Wait for a server-side run to complete by polling.
   *  Also fetches new run_results each cycle to populate the activity log
   *  (does not depend on Realtime). */
  const waitForServerCompletion = async (runId: string, totalRowCount: number): Promise<any[]> => {
    const POLL_INTERVAL = 3000; // 3 seconds
    const loggedIndices = new Set<number>();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const { data: run, error } = await supabase
            .from('runs')
            .select('status, processed_count, error_message, chain_count')
            .eq('id', runId)
            .single();

          if (error) {
            reject(new Error('Failed to check run status'));
            return;
          }

          // Update progress
          const count = run.processed_count ?? 0;
          setProcessedRows(count);
          if (totalRowCount > 0) {
            setProgress(Math.round((count / totalRowCount) * 100));
          }

          // Fetch new run_results we haven't logged yet
          if (count > loggedIndices.size) {
            const { data: newResults } = await supabase
              .from('run_results')
              .select('row_index, result_data, cost, tokens_in, tokens_out')
              .eq('run_id', runId)
              .order('row_index', { ascending: true });

            if (newResults) {
              for (const r of newResults) {
                if (loggedIndices.has(r.row_index)) continue;
                loggedIndices.add(r.row_index);

                const data = (r.result_data || {}) as Record<string, unknown>;
                const cost = r.cost || 0;
                const tokIn = r.tokens_in || 0;
                const tokOut = r.tokens_out || 0;

                const label =
                  data['Business identification'] || data['Business ID'] ||
                  data['vendor_sku#1.value'] || data['item_name#1.value'] ||
                  data['Next Supplier Code'] || data['Manufacturers Style No'] ||
                  data['Style No supplier'] || data['Style name supplier'] ||
                  data['MaterialSAPMaterialNo'] || data['ColorSAPMaterialNo'] ||
                  data['ProductID'] || data['ID'] ||
                  `Row ${r.row_index + 1}`;

                const fields = Array.isArray(data._optimizedFields) ? data._optimizedFields as string[] : [];
                const fieldsStr = fields.length > 0 ? ` → ${fields.join(', ')}` : '';
                const hasError = '_error' in data;

                if (hasError) {
                  addLog(`Row ${r.row_index + 1} (${label}): error — ${data._error}`);
                } else if (tokIn === 0 && tokOut === 0 && fields.length === 0) {
                  addLog(`Row ${r.row_index + 1} (${label}): skipped`);
                } else {
                  const costStr = cost > 0 ? ` | $${cost.toFixed(4)}` : '';
                  const tokStr = tokIn + tokOut > 0 ? ` ${tokIn + tokOut} tok` : '';
                  addLog(`Row ${r.row_index + 1} (${label}):${fieldsStr}${tokStr}${costStr}`);
                }
              }
            }
          }

          if (run.status === 'completed') {
            addLog(`Server processing completed (${count} rows)`);
            setProgress(100);
            const results = await getRunResults(runId);
            resolve(results.map(r => r.result_data) as any[]);
            return;
          }

          if (run.status === 'cancelled') {
            addLog('Run cancelled');
            const results = await getRunResults(runId);
            resolve(results.map(r => r.result_data) as any[]);
            return;
          }

          if (run.status === 'interrupted') {
            addLog(`Run interrupted: ${run.error_message || 'unknown error'}`);
            reject(new Error(run.error_message || 'Server processing was interrupted'));
            return;
          }

          // Still running — keep polling
          setTimeout(poll, POLL_INTERVAL);
        } catch (err) {
          reject(err);
        }
      };

      poll();
    });
  };

  const processWithClient = async (
    rows: any[],
    selectedColumns: string[],
    model: Model,
    apiKey: string,
    context?: {
      useCase?: 'ecommerce' | 'amazon' | 'partoo' | 'aboutyou' | 'next';
      mappings?: any;
      lang?: string;
      dryRun?: boolean;
      businessIdsFilter?: Set<string> | null;
      storeTypeFilter?: Set<string> | null;
      colorMappings?: any[];
      sizeMappings?: any[];
      fileName?: string;
      resumeRunId?: string;
      skipIndices?: Set<number>;
      existingResults?: any[];
    },
    activeRunId?: string | null
  ): Promise<any[]> => {
    const skipIndices = context?.skipIndices || new Set<number>();
    const chunks = createProcessingChunks(rows, selectedColumns, model, apiKey, 1);
    let allProcessedRows: any[] = context?.existingResults ? [...context.existingResults] : [];

    if (skipIndices.size > 0) {
      addLog(`Resuming: skipping ${skipIndices.size} already-completed rows`);
    }

    const keepAliveInterval = setInterval(() => {
      if (isProcessing) {
        fetch('/favicon.ico', { method: 'HEAD' }).catch(() => {});
      }
    }, 30000);

    try {
      for (let i = 0; i < chunks.length; i++) {
        if (cancelRequested.current) {
          if (activeRunId) {
            const stats = costTracker?.getSessionStats?.();
            await updateRunStatus(activeRunId, 'cancelled', stats ? {
              totalCost: stats.totalActualCost,
              tokensIn: stats.totalTokensInput,
              tokensOut: stats.totalTokensOutput,
            } : undefined);
            runIdRef.current = null;
          }
          break;
        }

        if (skipIndices.has(i)) continue;

        const chunk = chunks[i];
        const globalRowOffset = allProcessedRows.length;

        if (context?.useCase === 'amazon') {
          const mapped = context.mappings?.mapping || {};
          const targetLanguage = context.lang || 'en';
          const processed = await processAmazonRows(chunk.rows, model, apiKey, mapped, targetLanguage, (m) => addLog(m));
          allProcessedRows.push(...processed);
          if (activeRunId && processed.length > 0) {
            saveRowResult(activeRunId, i, processed[0] as Record<string, unknown>);
          }
          const processedCount = Math.min(allProcessedRows.length, rows.length);
          setProcessedRows(processedCount);
          setProgress(Math.round((processedCount / rows.length) * 100));
          continue;
        } else if (context?.useCase === 'partoo') {
          const { processPartooRows } = await import('../processing/processPartoo');
          const mapped = context.mappings?.mapping || {};
          const businessIdsFilter = context.businessIdsFilter || null;
          const storeTypeFilter = context.storeTypeFilter || null;

          if (i === 0 || (skipIndices.size > 0 && !skipIndices.has(i))) {
            if (businessIdsFilter && businessIdsFilter.size > 0) {
              addLog(`FILTER ACTIVE: Processing only ${businessIdsFilter.size} business IDs`);
            } else if (i === 0) {
              addLog(`NO FILTER: Processing all ${chunk.rows.length} rows`);
            }
            if (storeTypeFilter && storeTypeFilter.size > 0) {
              addLog(`STORE TYPE FILTER: ${Array.from(storeTypeFilter).join(', ')}`);
            }
          }

          const processed = await processPartooRows(
            chunk.rows, model, apiKey, mapped, 'fill-improve',
            (m) => addLog(m), costTracker, businessIdsFilter, storeTypeFilter
          );
          allProcessedRows.push(...processed);
          if (activeRunId && processed.length > 0) {
            saveRowResult(activeRunId, i, processed[0] as Record<string, unknown>);
          }
          const processedCount = Math.min(allProcessedRows.length, rows.length);
          setProcessedRows(processedCount);
          setProgress(Math.round((processedCount / rows.length) * 100));
          continue;
        } else if (context?.useCase === 'next') {
          const { processNextRows } = await import('../processing/processNext');
          const { COLOR_TRANSLATIONS } = await import('../utils/translations/colorTranslations');
          const { SIZE_TRANSLATION_TABLE } = await import('../utils/translations/sizeTranslations');
          const processed = await processNextRows(
            chunk.rows, model, apiKey, {},
            context.colorMappings || COLOR_TRANSLATIONS,
            context.sizeMappings || SIZE_TRANSLATION_TABLE,
            (m) => addLog(m), costTracker
          );
          allProcessedRows.push(...processed);
          if (activeRunId && processed.length > 0) {
            saveRowResult(activeRunId, i, processed[0] as Record<string, unknown>);
          }
          const processedCount = Math.min(allProcessedRows.length, rows.length);
          setProcessedRows(processedCount);
          setProgress(Math.round((processedCount / rows.length) * 100));
          continue;
        } else if (context?.useCase === 'aboutyou') {
          const { processAboutYouRows } = await import('../processing/processAboutYou');
          const { COLOR_TRANSLATIONS } = await import('../utils/translations/colorTranslations');
          const processed = await processAboutYouRows(
            chunk.rows, model, apiKey, {},
            context.colorMappings || COLOR_TRANSLATIONS,
            (m) => addLog(m), costTracker
          );
          allProcessedRows.push(...processed);
          if (activeRunId && processed.length > 0) {
            saveRowResult(activeRunId, i, processed[0] as Record<string, unknown>);
          }
          const processedCount = Math.min(allProcessedRows.length, rows.length);
          setProcessedRows(processedCount);
          setProgress(Math.round((processedCount / rows.length) * 100));
          continue;
        }

        const result = await processChunkClientSide(chunk, globalRowOffset, rows.length, costTracker);
        allProcessedRows.push(...result.processedRows);
        if (activeRunId && result.processedRows.length > 0) {
          saveRowResult(activeRunId, i, result.processedRows[0] as Record<string, unknown>, result.cost?.totalCost, result.cost?.tokenUsage?.input, result.cost?.tokenUsage?.output);
        }
        const processedCount = Math.min(allProcessedRows.length, rows.length);
        setProcessedRows(processedCount);
        setProgress(Math.round((processedCount / rows.length) * 100));
      }

      return allProcessedRows;
    } finally {
      clearInterval(keepAliveInterval);
    }
  };

  /** Reconnect to a running server-side run (e.g. after navigating away and back) */
  const reconnectToRun = useCallback(async (run: RunRecord): Promise<any[]> => {
    setIsProcessing(true);
    setProcessingMode('server');
    setTotalRows(run.total_rows);
    setProcessedRows(run.processed_count || 0);
    setProgress(run.total_rows > 0 ? Math.round(((run.processed_count || 0) / run.total_rows) * 100) : 0);
    setLogs([]);
    cancelRequested.current = false;
    runIdRef.current = run.id;
    setCurrentRunId(run.id);

    addLog(`Reconnected to server run ${run.id.substring(0, 8)}...`);
    addLog(`Progress: ${run.processed_count || 0}/${run.total_rows} rows`);

    // Subscribe to Realtime updates
    subscribeToRunUpdates(run.id, run.total_rows);

    try {
      // Wait for completion
      const results = await waitForServerCompletion(run.id, run.total_rows);
      runIdRef.current = null;
      setIsProcessing(false);
      return results;
    } catch (err) {
      runIdRef.current = null;
      setIsProcessing(false);
      throw err;
    }
  }, [addLog, subscribeToRunUpdates]);

  return {
    isProcessing,
    progress,
    totalRows,
    processedRows,
    logs,
    estimatedTimeRemaining,
    processingMode,
    costTracker,
    currentRunId,
    processFile,
    cancelProcessing,
    reconnectToRun,
  };
};
