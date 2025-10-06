import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { optimizeTextWithAI } from '../utils/optimizationUtils';
import { useCostTracker } from './useCostTracker';
import type { Model } from '@/lib/models';

// Keep alive functions for continuous processing

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
        `\\[${lang}\\]`,       // "Short description [de]" (escaped brackets)
        `\\[${langUpper}\\]`,  // "Short description [DE]" (escaped brackets)
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
        `\\[${lang}\\]`,       // "Short descriptions [de]" (escaped brackets)
        `\\[${langUpper}\\]`,  // "Short descriptions [DE]" (escaped brackets)
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

interface UseFileProcessingReturn {
  isProcessing: boolean;
  progress: number;
  totalRows: number;
  processedRows: number;
  logs: string[];
  estimatedTimeRemaining: string;
  costTracker: any;
  processFile: (
    rows: any[],
    selectedColumns: string[],
    model: Model,
    apiKey: string
  ) => Promise<any[]>;
  cancelProcessing: () => void;
}

/**
 * A hook that processes spreadsheet rows by sending each selected column to the
 * optimizeTextWithAI helper. While the file is being processed it exposes
 * useful state such as overall progress and a cancellable flag so that the
 * caller can interrupt the operation.
 */
export const useFileProcessing = (): UseFileProcessingReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');

  // Cost tracking
  const costTracker = useCostTracker();

  // A mutable ref that allows us to break out of the async loop when the user
  // decides to cancel the operation.
  const cancelRequested = useRef(false);
  
  // Rate limiting per gestire grandi volumi
  const lastRequestTime = useRef(0);
  const requestCount = useRef(0);
  const REQUESTS_PER_MINUTE = 30; // Limite conservativo
  const MIN_DELAY_MS = 2000; // 2 secondi tra richieste per sicurezza
  
  // Tracking per stima tempi
  const startTimeRef = useRef<number>(0);
  const avgProcessingTime = useRef(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep-alive mechanism to prevent interruptions
  const startKeepAlive = () => {
    // Prevent page unload during processing
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing) {
        e.preventDefault();
        e.returnValue = 'Processing is in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    // Keep the tab active with periodic pings
    keepAliveIntervalRef.current = setInterval(() => {
      if (isProcessing) {
        // Send a small ping to keep connection alive
        fetch('/favicon.ico', { method: 'HEAD' }).catch(() => {});
        console.log('Keep-alive ping sent');
      }
    }, 30000); // Every 30 seconds

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
    };
  };

  const stopKeepAlive = () => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  };

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  /**
   * Cancels an in-flight processing operation. The currently executing request
   * will be allowed to finish, but subsequent rows will be skipped.
   */
  const cancelProcessing = () => {
    if (isProcessing) {
      cancelRequested.current = true;
      toast('Cancelling…');
    }
  };

  /**
   * Rate limiting intelligente per evitare di superare i limiti API
   */
  const waitForRateLimit = async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    
    // Reset counter every minute
    if (timeSinceLastRequest > 60000) {
      requestCount.current = 0;
    }
    
    // If we have reached the limit per minute, wait
    if (requestCount.current >= REQUESTS_PER_MINUTE) {
      const waitTime = 60000 - (timeSinceLastRequest % 60000);
      console.log(`Rate limit reached, waiting ${Math.round(waitTime/1000)}s...`);
      addLog(`⧗ Rate limit reached, waiting ${Math.round(waitTime/1000)}s`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      requestCount.current = 0;
    }
    
    // Ensure a minimum delay between requests
    if (timeSinceLastRequest < MIN_DELAY_MS) {
      const waitTime = MIN_DELAY_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastRequestTime.current = Date.now();
    requestCount.current++;
  };

  /**
   * Save intermediate progress every N rows
   */
  const saveIntermediateProgress = (updatedRows: any[], currentRowIndex: number) => {
    const SAVE_INTERVAL = 100; // Save every 100 rows
    
    if ((currentRowIndex + 1) % SAVE_INTERVAL === 0) {
      try {
        const progressData = {
          rows: updatedRows,
          currentRow: currentRowIndex,
          timestamp: Date.now()
        };
        localStorage.setItem('file_processing_progress', JSON.stringify(progressData));
        addLog(`▲ Progress saved at row ${currentRowIndex + 1}`);
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  };

  /**
   * Processes each row in sequence. For every selected column we invoke the AI
   * optimizer and replace the column value with the result.
   */
  const processFile = async (
    rows: any[],
    selectedColumns: string[],
    model: Model,
    apiKey: string
  ): Promise<any[]> => {
    setIsProcessing(true);
    setProgress(0);
    setTotalRows(rows.length);
    setProcessedRows(0);
    setLogs([]);
    setEstimatedTimeRemaining('');
    cancelRequested.current = false;
    startTimeRef.current = Date.now();

    // Start keep-alive mechanism to prevent interruptions
    const cleanupKeepAlive = startKeepAlive();
    addLog('🚀 Processing started - keep-alive enabled to prevent interruptions');

    // Check if there is saved progress to resume
    let updatedRows: any[] = [];
    let startFromRow = 0;
    
    try {
      const savedProgress = localStorage.getItem('file_processing_progress');
      if (savedProgress) {
        const progressData = JSON.parse(savedProgress);
        const timeSinceSave = Date.now() - progressData.timestamp;
        
        // Only if the save is recent (less than 1 hour)
        if (timeSinceSave < 3600000) {
          updatedRows = progressData.rows || [];
          startFromRow = (progressData.currentRow || 0) + 1;
          setProcessedRows(startFromRow);
          setProgress(Math.round((startFromRow / rows.length) * 100));
          addLog(`▲ Resuming from row ${startFromRow + 1} (${updatedRows.length} processed)`);
          
          // Ensure updatedRows has the correct length
          if (updatedRows.length < startFromRow) {
            updatedRows = rows.slice(0, startFromRow);
          }
        } else {
          localStorage.removeItem('file_processing_progress');
          addLog('⚠ Previous progress too old, starting fresh');
        }
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
      addLog('⨯ Error loading saved progress, starting fresh');
      localStorage.removeItem('file_processing_progress');
    }

    try {
      for (let rowIndex = startFromRow; rowIndex < rows.length; rowIndex++) {
        if (cancelRequested.current) {
          addLog('⚠ Processing cancelled by user');
          break;
        }

        const row = { ...rows[rowIndex] };

        // Extract product ID for logging
        const productId = row['MaterialSAPMaterialNo'] || row['ColorSAPMaterialNo'] || row['ProductID'] || row['ID'] || `Row ${rowIndex + 1}`;

        for (const column of selectedColumns) {
          const original = row[column];
          if (!original || typeof original !== 'string') continue;

          // Extract language from column for logging
          const langMatch = column.match(/_([a-z]{2})$/i);
          const language = langMatch ? langMatch[1].toUpperCase() : 'UNK';

          try {
            // Build a contextual object containing useful descriptive columns
            const contextColumns = Object.keys(row).filter((key) => {
              const lower = key.toLowerCase();
              return (
                lower.includes('short description') ||
                lower.includes('short descriptions')
              );
            });

            const context: Record<string, any> = {};
            contextColumns.forEach((colName) => {
              context[colName] = row[colName];
            });

            // Match language suffix (e.g. "_en") from the column we are optimizing
            let targetKeywords: string[] = [];

            if (langMatch) {
              const lang = langMatch[1].toLowerCase();
              
              // Get all column names as an array
              const columnNames = Object.keys(row);
              
              // Enhanced debug logging
              console.log(`\n=== DEBUGGING ROW ${rowIndex + 1} ===`);
              console.log(`Processing column: "${column}"`);
              console.log(`Extracted language: "${lang}"`);
              console.log(`All available columns:`, columnNames);
              
              // Use the improved language matching function
              const matchingShortDescKey = findMatchingShortDescriptionColumn(columnNames, lang);
              
              console.log(`Selected short description column: "${matchingShortDescKey}"`);
              if (matchingShortDescKey) {
                console.log(`Value in selected column: "${row[matchingShortDescKey]}"`);
              }

              if (matchingShortDescKey) {
                const cellValue = row[matchingShortDescKey];
                let value = '';
                
                // Handle Excel formula objects with result property
                if (typeof cellValue === 'object' && cellValue !== null) {
                  if (cellValue.result) {
                    value = String(cellValue.result).trim();
                  } else if (cellValue.v) {
                    // Alternative Excel cell value property
                    value = String(cellValue.v).trim();
                  } else if (cellValue.value) {
                    value = String(cellValue.value).trim();
                  } else {
                    // Fallback to string conversion
                    value = String(cellValue).trim();
                  }
                } else {
                  value = String(cellValue).trim();
                }
                
                if (value && value !== '[object Object]') {
                  targetKeywords = [value];
                  console.log(`Extracted target keyword: "${value}" from column "${matchingShortDescKey}"`);
                }
              }
            }

            // Log simple format: ID | language | keyword
            const keywordText = targetKeywords.length > 0 ? targetKeywords[0] : 'no category';
            addLog(`${productId} | ${language.toLowerCase()} | ${keywordText}`);

            // Applica rate limiting prima della chiamata API
            await waitForRateLimit();
            
            const optimizationResult = await optimizeTextWithAI(
              original,
              targetKeywords,
              context,
              model,
              apiKey
            );
            
            row[column] = optimizationResult.content;
            
            // Track cost with actual tokens
            const costRecord = costTracker.trackOperation(
              model.id,
              original,
              optimizationResult.content,
              optimizationResult.tokens
            );
            
            // Log success with simple format
            const cost = costRecord?.actualCost || costRecord?.estimatedCost || 0;
            addLog(`✓ ${productId} | ${language.toLowerCase()} | optimized | $${cost.toFixed(2)}`);
          } catch (err: any) {
            console.error('Optimization error for row', rowIndex, column, err);
            addLog(`⨯ ${productId} | ${language.toLowerCase()} | failed: ${err?.message || 'unknown error'}`);
            // Keep the original text if optimization fails
          }
        }

        updatedRows.push(row);

        // Save intermediate progress
        saveIntermediateProgress(updatedRows, rowIndex);

        // Update progress and estimate time
        const processed = rowIndex + 1;
        setProcessedRows(processed);
        setProgress(Math.round((processed / rows.length) * 100));
        
        // Calculate remaining time
        if (processed > startFromRow + 3) { // Start estimation after a few rows
          const elapsed = Date.now() - startTimeRef.current;
          avgProcessingTime.current = elapsed / (processed - startFromRow);
          const remaining = rows.length - processed;
          const estimatedMs = remaining * avgProcessingTime.current;
          
          const hours = Math.floor(estimatedMs / 3600000);
          const minutes = Math.floor((estimatedMs % 3600000) / 60000);
          
          if (hours > 0) {
            setEstimatedTimeRemaining(`~${hours}h ${minutes}m remaining`);
          } else if (minutes > 0) {
            setEstimatedTimeRemaining(`~${minutes}m remaining`);
          } else {
            setEstimatedTimeRemaining('Almost done');
          }
        }
      }

      if (cancelRequested.current) {
        toast('Processing cancelled');
        addLog(`⚠ Processing cancelled after ${updatedRows.length} rows`);
      } else {
        // Calculate session statistics for final summary
        const sessionStats = costTracker.getSessionStats();
        const provider = model.provider === 'openai' ? 'openai' : 'anthropic';
        
        toast('Processing complete', {
          description: `${updatedRows.length} rows processed | $${sessionStats.totalActualCost.toFixed(5)} total | ${sessionStats.totalTokens.toLocaleString()} tokens`,
          duration: 10000,
        });
        
        addLog(`✓ Successfully processed all ${updatedRows.length} rows`);
        addLog(`💰 Total cost: $${sessionStats.totalActualCost.toFixed(5)}`);
        addLog(`🔢 Total tokens: ${sessionStats.totalTokens.toLocaleString()} (${sessionStats.totalTokensInput.toLocaleString()} input + ${sessionStats.totalTokensOutput.toLocaleString()} output)`);
        addLog(`📊 Average cost per row: $${(sessionStats.totalActualCost / updatedRows.length).toFixed(5)}`);
        
        // Clear intermediate save at completion
        localStorage.removeItem('file_processing_progress');
      }

      return updatedRows;
    } finally {
      setIsProcessing(false);
      // Cleanup keep-alive mechanism
      cleanupKeepAlive();
      stopKeepAlive();
      addLog('🛑 Processing finished - keep-alive disabled');
      // Reset rate limiting counters
      requestCount.current = 0;
      lastRequestTime.current = 0;
    }
  };

  return {
    isProcessing,
    progress,
    totalRows,
    processedRows,
    logs,
    estimatedTimeRemaining,
    costTracker,
    processFile,
    cancelProcessing,
  };
}; 
