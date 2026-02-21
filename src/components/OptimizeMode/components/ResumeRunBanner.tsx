import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Cloud, Play, X } from 'lucide-react';
import type { RunRecord } from '@/lib/runPersistence';

interface ResumeRunBannerProps {
  runs: RunRecord[];
  onResume: (run: RunRecord) => void;
  onDismiss: (run: RunRecord) => void;
}

const ResumeRunBanner: React.FC<ResumeRunBannerProps> = ({ runs, onResume, onDismiss }) => {
  if (runs.length === 0) return null;

  return (
    <div className="space-y-3">
      {runs.map((run) => {
        const date = new Date(run.created_at).toLocaleString();
        const isServer = run.processing_mode === 'server';
        const isRunning = run.status === 'running';
        const isInterrupted = run.status === 'interrupted';

        // Server-side run still running → informational banner
        if (isServer && isRunning) {
          return (
            <Card key={run.id} className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-3">
                  <Cloud className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Processing in progress on server
                    </p>
                    <div className="mt-1.5 text-xs text-muted-foreground space-y-0.5">
                      <p>
                        <span className="font-medium">Use case:</span> {run.use_case}
                        {' '}&middot;{' '}
                        <span className="font-medium">Model:</span> {run.model_id}
                      </p>
                      {run.file_name && (
                        <p>
                          <span className="font-medium">File:</span> {run.file_name}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Progress:</span> {run.processed_count || 0}/{run.total_rows} rows
                        {' '}&middot;{' '}
                        <span className="font-medium">Started:</span> {date}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }

        // Server-side run interrupted → offer retry
        if (isServer && isInterrupted) {
          return (
            <Card key={run.id} className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Server run interrupted
                    </p>
                    <div className="mt-1.5 text-xs text-muted-foreground space-y-0.5">
                      <p>
                        <span className="font-medium">Use case:</span> {run.use_case}
                        {' '}&middot;{' '}
                        <span className="font-medium">Model:</span> {run.model_id}
                      </p>
                      {run.file_name && (
                        <p>
                          <span className="font-medium">File:</span> {run.file_name}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Progress:</span> {run.processed_count || 0}/{run.total_rows} rows
                        {run.error_message && (
                          <>
                            {' '}&middot;{' '}
                            <span className="font-medium">Error:</span> {run.error_message}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" onClick={() => onResume(run)}>
                        <Play className="h-3.5 w-3.5 mr-1.5" />
                        Retry on server
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDismiss(run)}>
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }

        // Client-side interrupted run → existing behavior
        return (
          <Card key={run.id} className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <CardContent className="py-4 px-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Interrupted run detected
                  </p>
                  <div className="mt-1.5 text-xs text-muted-foreground space-y-0.5">
                    <p>
                      <span className="font-medium">Use case:</span> {run.use_case}
                      {' '}&middot;{' '}
                      <span className="font-medium">Model:</span> {run.model_id}
                    </p>
                    {run.file_name && (
                      <p>
                        <span className="font-medium">File:</span> {run.file_name}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Rows:</span> {run.total_rows}
                      {' '}&middot;{' '}
                      <span className="font-medium">Started:</span> {date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" onClick={() => onResume(run)}>
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                      Resume
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDismiss(run)}>
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ResumeRunBanner;
