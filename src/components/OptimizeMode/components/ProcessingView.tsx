import React, { useRef, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Cloud, Monitor } from 'lucide-react';

interface ProcessingViewProps {
  progress: number;
  totalRows: number;
  processedRows: number;
  logs: string[];
  estimatedTimeRemaining?: string;
  processingMode?: 'server' | 'client' | 'batch' | 'checking';
  onCancel: () => void;
}

const getLogClass = (log: string): string => {
  const lower = log.toLowerCase();
  if (lower.includes('error') || lower.includes('failed')) return 'text-destructive';
  if (lower.includes('retry') || lower.includes('warning')) return 'text-amber-600';
  return 'text-muted-foreground';
};

const ProcessingView: React.FC<ProcessingViewProps> = ({
  progress,
  totalRows,
  processedRows,
  logs,
  estimatedTimeRemaining,
  processingMode = 'checking',
  onCancel
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Server-side processing indicator */}
      {processingMode === 'server' && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/30">
          <Cloud className="h-4 w-4 text-blue-500 shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Processing on server — you can close this tab safely
          </p>
        </div>
      )}
      {processingMode === 'client' && (
        <div className="flex items-center gap-2 rounded-lg border border-muted px-4 py-3">
          <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Processing in your browser — keep this tab open
          </p>
        </div>
      )}
      {processingMode === 'batch' && (
        <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 dark:border-purple-900 dark:bg-purple-950/30">
          <Cloud className="h-4 w-4 text-purple-500 shrink-0" />
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Batch processing on Anthropic servers — 50% cost savings — you can close this tab
          </p>
        </div>
      )}

      <div>
        <Progress value={progress} />
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-muted-foreground">
            {processedRows}/{totalRows} rows processed ({progress}%)
          </p>
          {estimatedTimeRemaining && (
            <p className="text-sm font-medium text-primary">
              {estimatedTimeRemaining}
            </p>
          )}
        </div>
      </div>

      {logs.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Activity Log</p>
          <div className="max-h-60 overflow-y-auto bg-muted/30 border rounded-xl p-4 font-mono text-xs">
            {logs.map((log, idx) => (
              <div key={idx} className={`mb-1 leading-relaxed ${getLogClass(log)}`}>
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};

export default ProcessingView;
