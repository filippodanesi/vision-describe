import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, Monitor, Search } from 'lucide-react';

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
  const getModeIcon = () => {
    switch (processingMode) {
      case 'server': return <Server className="h-3 w-3" />;
      case 'client': return <Monitor className="h-3 w-3" />;
      case 'checking': return <Search className="h-3 w-3" />;
    }
  };

  const getModeColor = () => {
    switch (processingMode) {
      case 'server': return 'bg-green-100 text-green-800 border-green-200';
      case 'client': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checking': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getModeText = () => {
    switch (processingMode) {
      case 'server': return 'Server';
      case 'client': return 'Client';
      case 'checking': return 'Checking...';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge className={`text-xs hover:bg-transparent ${getModeColor()}`}>
          {getModeIcon()}
          <span className="ml-1">{getModeText()}</span>
        </Badge>
      </div>

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