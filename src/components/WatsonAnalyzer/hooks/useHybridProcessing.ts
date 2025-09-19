import { useState, useRef, useCallback } from 'react';
import { useCostTracker } from './useCostTracker';
import { Model } from '@/lib/models';
import { toast } from 'sonner';
import { 
  isServerProcessingAvailable, 
  processChunkOnServer, 
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
    context?: { useCase?: 'ecommerce' | 'amazon'; mappings?: any; lang?: string; dryRun?: boolean },
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
              result.tokens
            );
          }
          
          totalCost += costRecord?.actualCost || costRecord?.estimatedCost || 0;
          totalInputTokens += result.tokens.inputTokens;
          totalOutputTokens += result.tokens.outputTokens;

          // Log success with simple format
          const cost = costRecord?.actualCost || costRecord?.estimatedCost || 0;
          addLog(`✓ ${productId} | ${language.toLowerCase()} | optimized | $${cost.toFixed(4)}`);

        } catch (error: any) {
          console.error('Client-side optimization error:', error);
          addLog(`⨯ ${productId} | ${language.toLowerCase()} | failed: ${error?.message || 'unknown error'}`);
          // Keep original text on error
        }
      }

      processedRows.push(processedRow);
      
      // Update progress after each row using global count
      const globalProcessedRows = globalRowOffset + processedRows.length;
      setProcessedRows(globalProcessedRows);
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
    context?: { useCase?: 'ecommerce' | 'amazon'; mappings?: any; lang?: string; dryRun?: boolean },
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
      // Step 1: Check server availability
      setProcessingMode('checking');
      
      const serverAvailable = await isServerProcessingAvailable();
      
      // For Amazon, run client-side specialized processing for now
      if (context?.useCase === 'amazon') {
        setProcessingMode('client');
        return await processWithClient(effectiveRows, selectedColumns, model, apiKey, context);
      }

      if (serverAvailable) {
        setProcessingMode('server');
        return await processWithServer(effectiveRows, selectedColumns, model, apiKey);
      } else {
        setProcessingMode('client');
        return await processWithClient(effectiveRows, selectedColumns, model, apiKey, context);
      }

    } catch (error) {
      console.error('Processing error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const processWithServer = async (
    rows: any[],
    selectedColumns: string[],
    model: Model,
    apiKey: string
  ): Promise<any[]> => {
    // Use 1-row chunks to reflect per-row progress even on full runs
    const chunks = createProcessingChunks(rows, selectedColumns, model, apiKey, 1);
    let allProcessedRows: any[] = [];
    let totalCost = 0;

    for (let i = 0; i < chunks.length; i++) {
      if (cancelRequested.current) {
        addLog('⚠ Processing cancelled');
        break;
      }

      const chunk = chunks[i];

      try {
        const response = await processChunkOnServer(chunk);

        if (response.shouldFallbackToClient) {
          setProcessingMode('client');
          return await processWithClient(rows, selectedColumns, model, apiKey);
        }

        if (!response.success || !response.result) {
          throw new Error(response.error || 'Server processing failed');
        }

        const result = response.result;
        
        // Add server processing logs for visibility
        for (const row of result.processedRows) {
          const idxFallback = typeof processedRows === 'number' ? processedRows : 0;
          const productId = row['MaterialSAPMaterialNo'] || row['ColorSAPMaterialNo'] || row['ProductID'] || row['ID'] || `Row ${idxFallback + 1}`;
          addLog(`✓ ${productId} | server batch | optimized | $${(result.cost.totalCost / result.processedRows.length).toFixed(4)}`);
        }
        
        allProcessedRows.push(...result.processedRows);
        totalCost += result.cost.totalCost;

        const processed = (i + 1) * chunk.rows.length;
        setProcessedRows(Math.min(processed, rows.length));
        setProgress(Math.round((processed / rows.length) * 100));

        // Estimate remaining time
        if (i > 0) {
          const elapsed = Date.now() - startTimeRef.current;
          const avgTimePerChunk = elapsed / (i + 1);
          const remainingChunks = chunks.length - (i + 1);
          const estimatedMs = remainingChunks * avgTimePerChunk;
          
          const minutes = Math.floor(estimatedMs / 60000);
          if (minutes > 0) {
            setEstimatedTimeRemaining(`~${minutes}m remaining`);
          } else {
            setEstimatedTimeRemaining('Almost done');
          }
        }

      } catch (error) {
        console.error('Server chunk processing error:', error);
        setProcessingMode('client');
        return await processWithClient(rows, selectedColumns, model, apiKey);
      }
    }

    return allProcessedRows;
  };

  const processWithClient = async (
    rows: any[],
    selectedColumns: string[],
    model: Model,
    apiKey: string,
    context?: { useCase?: 'ecommerce' | 'amazon'; mappings?: any; lang?: string; dryRun?: boolean }
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
