import { Model } from '@/lib/models';

export interface ProcessingChunk {
  rows: any[];
  selectedColumns: string[];
  chunkIndex: number;
  totalChunks: number;
  model: Model;
  apiKey: string;
}

export interface ProcessingResult {
  success: boolean;
  processedRows: any[];
  cost: {
    totalCost: number;
    tokenUsage: {
      input: number;
      output: number;
    };
  };
  error?: string;
  chunkIndex: number;
}

export interface ServerProcessingResponse {
  success: boolean;
  isServerAvailable: boolean;
  result?: ProcessingResult;
  error?: string;
  shouldFallbackToClient?: boolean;
}

// Check if server-side processing is available
export async function isServerProcessingAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', { 
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5s timeout
    });
    return response.ok;
  } catch (error) {
    console.log('Server processing not available, will use client-side');
    return false;
  }
}

// Process a chunk on the server
export async function processChunkOnServer(chunk: ProcessingChunk): Promise<ServerProcessingResponse> {
  try {
    const response = await fetch('/api/process-chunk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
      signal: AbortSignal.timeout(300000), // 5 minutes timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          isServerAvailable: false,
          shouldFallbackToClient: true,
          error: 'Server processing not available'
        };
      }
      
      const errorText = await response.text();
      return {
        success: false,
        isServerAvailable: true,
        error: `Server error: ${errorText}`
      };
    }

    const result = await response.json();
    return {
      success: true,
      isServerAvailable: true,
      result
    };
  } catch (error) {
    console.error('Server processing error:', error);
    
    // Network errors or timeouts suggest server unavailable
    if (error instanceof TypeError || error instanceof DOMException) {
      return {
        success: false,
        isServerAvailable: false,
        shouldFallbackToClient: true,
        error: 'Network error or timeout'
      };
    }
    
    return {
      success: false,
      isServerAvailable: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Split data into optimally sized chunks
export function createProcessingChunks(
  rows: any[], 
  selectedColumns: string[], 
  model: Model, 
  apiKey: string,
  maxChunkSize: number = 10
): ProcessingChunk[] {
  const chunks: ProcessingChunk[] = [];
  
  for (let i = 0; i < rows.length; i += maxChunkSize) {
    const chunkRows = rows.slice(i, i + maxChunkSize);
    chunks.push({
      rows: chunkRows,
      selectedColumns,
      chunkIndex: Math.floor(i / maxChunkSize),
      totalChunks: Math.ceil(rows.length / maxChunkSize),
      model,
      apiKey
    });
  }
  
  return chunks;
} 