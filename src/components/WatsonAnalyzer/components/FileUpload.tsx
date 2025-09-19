import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { File, HelpCircle, Upload, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import * as ExcelJS from 'exceljs';
// @ts-ignore
import XlsxParserWorker from '../workers/xlsxParser.worker.ts?worker';
import Papa from 'papaparse';

interface FileUploadProps {
  onFileUploaded: (data: { rows: any[]; columns: string[]; meta?: any }) => void;
  useCase?: 'ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next';
}

/**
 * Excel and CSV file uploader that converts the first worksheet/CSV into JSON and
 * returns both the rows and the header columns via the callback supplied by
 * the parent. Uses safer alternatives to xlsx: exceljs for Excel files and papaparse for CSV.
 */
const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, useCase = 'ecommerce' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [skipSampleRow, setSkipSampleRow] = React.useState(true);
  const [isParsing, setIsParsing] = React.useState(false);
  const [parsingProgress, setParsingProgress] = React.useState<{ current: number; total: number } | null>(null);
  const workerRef = React.useRef<Worker | null>(null);
  const [error, setError] = React.useState<{ type: 'FILE_TOO_LARGE' | 'INVALID_FORMAT' | 'PARSE_ERROR' | 'WORKER_ERROR'; message: string } | null>(null);
  const [preview, setPreview] = React.useState<{ rows: number; columns: string[] } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const handleSelectFile = () => {
    if (isParsing) return;
    inputRef.current?.click();
  };

  const processFile = async (file: File) => {
    if (!file) return;
    setError(null);
    setPreview(null);

    if (file.size > MAX_FILE_SIZE) {
      setError({ type: 'FILE_TOO_LARGE', message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` });
      return;
    }

    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        // Handle CSV files with papaparse
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data as any[];
            const columns = results.meta.fields || [];
            onFileUploaded({ rows, columns });
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            alert('Error parsing CSV file. Please check the file format.');
          }
        });
      } else {
        // Offload Excel parsing to worker to avoid blocking the UI
        const arrayBuffer = await file.arrayBuffer();
        const worker: Worker = new XlsxParserWorker();
        setIsParsing(true);
        setParsingProgress(null);
        workerRef.current = worker;
        worker.onmessage = (msg: MessageEvent) => {
          const data = msg.data || {};
          if (data.type === 'progress') {
            if (typeof data.current === 'number' && typeof data.total === 'number') {
              console.debug('[Worker] progress', data.current, '/', data.total);
              setParsingProgress({ current: data.current, total: data.total });
            }
            return;
          }
          if (data.type === 'done') {
            const { success, result, error } = data;
            worker.terminate();
            workerRef.current = null;
            setIsParsing(false);
            setParsingProgress(null);
            if (!success) {
              console.error('Worker parse error:', error);
              setError({ type: 'PARSE_ERROR', message: 'Error parsing Excel file.' });
              return;
            }
            try {
              console.debug('[Worker] done meta', {
                worksheet: result?.meta?.worksheetName,
                headerRowIndex: result?.meta?.headerRowIndex,
                dataStartRow: result?.meta?.dataStartRow,
                useCase,
                rows: result?.rows?.length,
                cols: result?.columns?.length,
              });
            } catch {}
            setPreview({ rows: result.rows?.length || 0, columns: (result.columns || []).slice(0, 5) });
            onFileUploaded({ rows: result.rows, columns: result.columns, meta: result.meta });
          }
        };
        worker.postMessage({ arrayBuffer, useCase, skipSampleRow, config: { maxRows: 250000, progressEvery: 1000, trimValues: true } });
      }
    } catch (error) {
      console.error('File processing error:', error);
      setError({ type: 'WORKER_ERROR', message: 'Error processing file. Please check the file format and try again.' });
    }
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // Cleanup worker on unmount
  React.useEffect(() => {
    return () => {
      if (workerRef.current) {
        try { workerRef.current.terminate(); } catch {}
        workerRef.current = null;
      }
    };
  }, []);

  const handleCancel = () => {
    if (workerRef.current) {
      try { workerRef.current.terminate(); } catch {}
      workerRef.current = null;
    }
    setIsParsing(false);
    setParsingProgress(null);
  };

  const handleRetry = () => {
    setError(null);
    inputRef.current?.click();
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && /\.(xlsx?|xlsm|csv)$/i.test(file.name)) {
      await processFile(file);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-6">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={isDragging ? 'w-full p-1 rounded bg-blue-50' : 'w-full'}
      >
      <input
        type="file"
        accept=".xlsx,.xls,.xlsm,.csv"
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
      />
        
      <Button 
          variant="outline" 
          onClick={handleSelectFile}
          disabled={isParsing}
          className="border-dashed border-2 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isParsing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {isParsing ? 'Parsing…' : 'Choose File'}
      </Button>
      </div>

      {isParsing && (
        <Button variant="ghost" size="sm" onClick={handleCancel} className="mt-1">Cancel</Button>
      )}

      {isParsing && parsingProgress && (
        <div className="w-full">
          <Progress value={parsingProgress.total ? Math.min(100, Math.round((parsingProgress.current / parsingProgress.total) * 100)) : 0} />
          <div className="mt-1 text-xs text-gray-500">
            Parsing {parsingProgress.current}/{parsingProgress.total} rows
          </div>
        </div>
      )}

      {preview && !isParsing && (
        <div className="w-full text-xs text-gray-600">
          ✓ Loaded {preview.rows} rows. Columns: {preview.columns.join(', ')}{preview.rows > 0 && (preview.columns.length < 5 ? '' : ' ...')}
        </div>
      )}

      {error && (
        <div className="w-full bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
          {error.message}
          <Button size="sm" variant="link" onClick={handleRetry} className="ml-2 p-0 h-auto">Retry</Button>
        </div>
      )}
        
        {useCase === 'amazon' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground w-full justify-between">
            <div className="flex items-center gap-2">
              <span>Excel (.xlsx, .xls, .xlsm) or CSV</span>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Amazon Template headers:</p>
                    <ul className="text-xs space-y-0.5">
                      <li>• Detect technical key row (e.g., bullet_point#1.value)</li>
                      <li>• Skip requiredness row; optionally skip sample row</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={skipSampleRow} onChange={(e) => setSkipSampleRow(e.target.checked)} />
              <span>Skip sample row</span>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Skip the first row if it contains sample data or headers instead of actual product information</p>
                </TooltipContent>
              </Tooltip>
            </label>
          </div>
        )}
        {useCase !== 'amazon' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
            <span>Excel (.xlsx, .xls) or CSV</span>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="text-xs font-medium">Required columns:</p>
                <ul className="text-xs space-y-0.5">
                  <li>• ColorSAPMaterialNo</li>
                  <li>• ColorMaterialLongDescriptionEcom_[lang] or</li>
                  <li>• MaterialLongDescriptionEcom_[lang]</li>
                  <li>• Short description [lang]</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        )}
    </div>
    </TooltipProvider>
  );
};

export default FileUpload; 