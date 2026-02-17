import { useState, useRef, useCallback } from 'react';
import { useCostTracker } from './useCostTracker';
import { Model } from '@/lib/models';
import {
  createProcessingChunks,
  ProcessingChunk,
  ProcessingResult
} from '@/lib/api/serverProcessing';
import { optimizeTextWithAI } from '../utils/optimizationUtils';
import { processAmazonRows } from '../processing/processAmazon';

// Utility function to find matching short description column
const findMatchingShortDescriptionColumn = (columnNames: string[], targetLanguage: string): string => {
  const lang = targetLanguage.toLowerCase();
  const langUpper = lang.toUpperCase();
  
  console.log(`🔍 Looking for Short description column matching language: ${langUpper}`);
  
  // First priority: exact language match with strict patterns
  for (const key of columnNames) {
    const lower = key.toLowerCase();
    if (lower.includes('short description')) {
      console.log(`  📝 Checking column: "${key}"`);
      
      // Be more strict about exact matches - check for exact language codes
      const patterns = [
        ` ${lang}$`,           // "Short description de" (end of string)
        ` ${langUpper}$`,      // "Short description DE" (end of string)
        `\[${lang}\]`,       // "Short description [de]" (escaped brackets)
        `\[${langUpper}\]`,  // "Short description [DE]" (escaped brackets)
        `_${lang}$`,          // "Short description_de" (end of string)
        `_${langUpper}$`,     // "Short description_DE" (end of string)
        ` ${lang} `,          // "Short description de " (with space after)
        ` ${langUpper} `      // "Short description DE " (with space after)
      ];
      
      for (const pattern of patterns) {
        const regex = new RegExp(pattern);
        if (regex.test(lower) || regex.test(key)) {
          console.log(`  ✅ Found exact match with pattern "${pattern}": "${key}"`);
          return key;
        }
      }
      
      console.log(`  ❌ No exact match for "${key}"`);
    }
  }
  
  // Second priority: Look for "Short descriptions" plural form with same strict patterns
  for (const key of columnNames) {
    const lower = key.toLowerCase();
    if (lower.includes('short descriptions')) {
      console.log(`  📝 Checking plural column: "${key}"`);
      
      const patterns = [
        ` ${lang}$`,           // "Short descriptions de" (end of string)
        ` ${langUpper}$`,      // "Short descriptions DE" (end of string)
        `\[${lang}\]`,       // "Short descriptions [de]" (escaped brackets)
        `\[${langUpper}\]`,  // "Short descriptions [DE]" (escaped brackets)
        `_${lang}$`,          // "Short descriptions_de" (end of string)
        `_${langUpper}$`,     // "Short descriptions_DE" (end of string)
        ` ${lang} `,          // "Short descriptions de " (with space after)
        ` ${langUpper} `      // "Short descriptions DE " (with space after)
      ];
      
      for (const pattern of patterns) {
        const regex = new RegExp(pattern);
        if (regex.test(lower) || regex.test(key)) {
          console.log(`  ✅ Found exact match (plural) with pattern "${pattern}": "${key}"`);
          return key;
        }
      }
      
      console.log(`  ❌ No exact match for plural "${key}"`);
    }
  }
  
  // Debug: log what we found to help troubleshoot
  console.log(`❌ No exact match found for language ${langUpper}`);
  const shortDescColumns = columnNames.filter(name => 
    name.toLowerCase().includes('short') && name.toLowerCase().includes('description')
  );
  if (shortDescColumns.length > 0) {
    console.log(`📋 Available short description columns:`, shortDescColumns);
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
    },
    costTracker?: any
  ) => Promise<any[]>;
  cancelProcessing: () => void;
}

export const useHybridProcessing = (): HybridProcessingHook => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');
  const [processingMode, setProcessingMode] = useState<'server' | 'client' | 'checking'>('checking');
  
  const costTracker = useCostTracker();
  const cancelRequested = useRef(false);
  const startTimeRef = useRef<number>(0);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const cancelProcessing = () => {
    cancelRequested.current = true;
    addLog('⚠ Cancellation requested by user');
  };

  // Client-side processing fallback (simplified version)
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
      
      // Extract product ID for logging
      const productId = row['MaterialSAPMaterialNo'] || row['ColorSAPMaterialNo'] || row['ProductID'] || row['ID'] || `Row ${processedRows.length + 1}`;

      for (const column of selectedColumns) {
        const original = row[column];
        if (!original || typeof original !== 'string') continue;

        // Extract language from column for logging
        const langMatch = column.match(/_([a-z]{2})$/i);
        const language = langMatch ? langMatch[1].toUpperCase() : 'UNK';

        try {
          // Extract target keywords (simplified)
          let targetKeywords: string[] = [];
          
          if (langMatch) {
            const lang = langMatch[1].toLowerCase();
            const columnNames = Object.keys(row);
            
            // Use the improved language matching function
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
                console.log(`Found Short description column: "${matchingShortDescKey}" with value: "${value}"`);
              }
            }
          }

          // Log simple format: ID | language | keyword
          const keywordText = targetKeywords.length > 0 ? targetKeywords[0] : 'no category';
          addLog(`${productId} | ${language.toLowerCase()} | ${keywordText}`);

          const result = await optimizeTextWithAI(
            original,
            targetKeywords,
            {},
            model,
            apiKey
          );

          processedRow[column] = result.content;
          
          // Track cost
          let costRecord = null;
          if (costTracker) {
            costRecord = costTracker.trackOperation(
              model.id,
              original,
              result.content,
              {
                inputTokens: result.tokens.inputTokens,
                outputTokens: result.tokens.outputTokens
              }
            );
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
      
      // Update progress smoothly for each row
      const globalProcessedRows = globalRowOffset + processedRows.length;
      if (totalGlobalRows > 0) {
        setProgress(Math.round((globalProcessedRows / totalGlobalRows) * 100));
      }
    }

    return {
      success: true,
      processedRows,
      cost: {
        totalCost,
        tokenUsage: {
          input: totalInputTokens,
          output: totalOutputTokens
        }
      },
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
    },
    costTracker?: any
  ): Promise<any[]> => {
    setIsProcessing(true);
    setProgress(0);
    const effectiveRows = context?.dryRun ? rows.slice(0, 10) : rows;
    setTotalRows(effectiveRows.length);
    setProcessedRows(0);
    setLogs([]);
    setEstimatedTimeRemaining('');
    cancelRequested.current = false;
    startTimeRef.current = Date.now();

    try {
      // All processing is client-side (no backend server)
      setProcessingMode('client');
      return await processWithClient(effectiveRows, selectedColumns, model, apiKey, context);

    } catch (error) {
      console.error('Processing error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
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
    }
  ): Promise<any[]> => {
    // Use client-side keep-alive mechanism
    // Smaller chunks to surface per-row progress smoothly in UI
    const chunks = createProcessingChunks(rows, selectedColumns, model, apiKey, 1);
    let allProcessedRows: any[] = [];
    
    // Simple keep-alive interval
    const keepAliveInterval = setInterval(() => {
      if (isProcessing) {
        fetch('/favicon.ico', { method: 'HEAD' }).catch(() => {});
      }
    }, 30000);

    try {
      for (let i = 0; i < chunks.length; i++) {
        if (cancelRequested.current) break;

        const chunk = chunks[i];
        const globalRowOffset = allProcessedRows.length;

        if (context?.useCase === 'amazon') {
          const mapped = context.mappings?.mapping || {};
          const targetLanguage = context.lang || 'en';
          const processed = await processAmazonRows(chunk.rows, model, apiKey, mapped, targetLanguage, (m) => addLog(m));
          allProcessedRows.push(...processed);
          const processedCount = Math.min(allProcessedRows.length, rows.length);
          setProcessedRows(processedCount);
          setProgress(Math.round((processedCount / rows.length) * 100));
          continue;
        } else if (context?.useCase === 'partoo') {
          const { processPartooRows } = await import('../processing/processPartoo');
          const mapped = context.mappings?.mapping || {};
          
          // ============================================================================
          // ✨ BUSINESS ID FILTER - Extract and log filter status
          // ============================================================================
          const businessIdsFilter = context.businessIdsFilter || null;
          const storeTypeFilter = context.storeTypeFilter || null;

          if (businessIdsFilter && businessIdsFilter.size > 0) {
            addLog(`📋 FILTER ACTIVE: Processing only ${businessIdsFilter.size} business IDs`);
          } else {
            addLog(`📋 NO FILTER: Processing all ${chunk.rows.length} rows`);
          }
          if (storeTypeFilter && storeTypeFilter.size > 0) {
            addLog(`🏪 STORE TYPE FILTER: ${Array.from(storeTypeFilter).join(', ')}`);
          }
          // ============================================================================

          const processed = await processPartooRows(
            chunk.rows,
            model,
            apiKey,
            mapped,
            'fill-improve',
            (m) => addLog(m),
            costTracker,
            businessIdsFilter,
            storeTypeFilter
          );
          allProcessedRows.push(...processed);
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
          const processedCount = Math.min(allProcessedRows.length, rows.length);
          setProcessedRows(processedCount);
          setProgress(Math.round((processedCount / rows.length) * 100));
          continue;
        }

        const result = await processChunkClientSide(chunk, globalRowOffset, rows.length, costTracker);
        allProcessedRows.push(...result.processedRows);
        // Ensure progress jumps one row at a time even when chunk size is 1
        const processedCount = Math.min(allProcessedRows.length, rows.length);
        setProcessedRows(processedCount);
        setProgress(Math.round((processedCount / rows.length) * 100));

        // Progress is already updated in processChunkClientSide for each individual row
        // No need to update here as it would overwrite the more granular progress
      }

      return allProcessedRows;
    } finally {
      clearInterval(keepAliveInterval);
    }
  };

  return {
    isProcessing,
    progress,
    totalRows,
    processedRows,
    logs,
    estimatedTimeRemaining,
    processingMode,
    costTracker,
    processFile,
    cancelProcessing,
  };
};