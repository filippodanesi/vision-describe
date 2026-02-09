import React, { useRef, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface ProcessingViewProps {
  progress: number;
  totalRows: number;
  processedRows: number;
  logs: string[];
  estimatedTimeRemaining?: string;
  processingMode?: 'server' | 'client' | 'checking';
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
