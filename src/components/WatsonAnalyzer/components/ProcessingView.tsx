import React from 'react';
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

const ProcessingView: React.FC<ProcessingViewProps> = ({ 
  progress, 
  totalRows, 
  processedRows, 
  logs, 
  estimatedTimeRemaining, 
  processingMode = 'checking',
  onCancel 
}) => {

  return (
    <div className="space-y-6">

      <div>
        <Progress value={progress} />
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-muted-foreground">
            {processedRows}/{totalRows} rows processed ({progress}%)
          </p>
          {estimatedTimeRemaining && (
            <p className="text-sm font-medium text-blue-600">
              {estimatedTimeRemaining}
            </p>
          )}
        </div>
      </div>

      {logs.length > 0 && (
        <div className="max-h-60 overflow-y-auto border rounded-lg p-4 text-sm bg-black text-green-400 font-mono">
          {logs.map((log, idx) => (
            <div key={idx} className="mb-1 leading-relaxed">
              {log}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="destructive" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
};

export default ProcessingView; 