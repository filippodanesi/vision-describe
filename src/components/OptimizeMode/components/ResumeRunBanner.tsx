import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Cloud, Play, X, Square, Eye } from 'lucide-react';
import { cancelServerRun } from '@/lib/api/serverRun';
import type { RunRecord } from '@/lib/runPersistence';

interface ResumeRunBannerProps {
  runs: RunRecord[];
  onResume: (run: RunRecord) => void;
  onDismiss: (run: RunRecord) => void;
  onReconnect?: (run: RunRecord) => void;
}

interface RunMetaLineProps {
  label: string;
  value: React.ReactNode;
}

function RunMetaLine({ label, value }: RunMetaLineProps) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="label-mono-sm normal-case tracking-normal text-muted-foreground/70">
        {label}
      </span>
      <span className="font-mono text-xs text-foreground/90">{value}</span>
    </span>
  );
}

const ResumeRunBanner: React.FC<ResumeRunBannerProps> = ({ runs, onResume, onDismiss, onReconnect }) => {
  if (runs.length === 0) return null;

  return (
    <div className="space-y-3">
      {runs.map((run) => {
        const date = new Date(run.created_at).toLocaleString();
        const isServer = run.processing_mode === 'server';
        const isRunning = run.status === 'running';
        const isInterrupted = run.status === 'interrupted';

        // Server-side run still running
        if (isServer && isRunning) {
          return (
            <div key={run.id} className="border border-border bg-muted/30 px-5 py-4">
              <div className="flex items-start gap-3">
                <Cloud className="h-4 w-4 text-signal mt-0.5 shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="label-mono">
                    <span className="status-dot animate-pulse mr-2 align-middle" />
                    Server run in progress
                  </p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                    <RunMetaLine label="Use case" value={run.use_case} />
                    <RunMetaLine label="Model" value={run.model_id} />
                    {run.file_name && <RunMetaLine label="File" value={run.file_name} />}
                    <RunMetaLine
                      label="Progress"
                      value={`${run.processed_count || 0} / ${run.total_rows}`}
                    />
                    <RunMetaLine label="Started" value={date} />
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    {onReconnect && (
                      <Button size="sm" variant="outline" onClick={() => onReconnect(run)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View progress
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await cancelServerRun(run.id);
                        } catch {
                          // If cancel API fails, just dismiss locally
                        }
                        onDismiss(run);
                      }}
                    >
                      <Square className="h-3.5 w-3.5 mr-1.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Server-side run interrupted
        if (isServer && isInterrupted) {
          return (
            <div key={run.id} className="border border-border bg-muted/30 px-5 py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="label-mono">Server run interrupted</p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                    <RunMetaLine label="Use case" value={run.use_case} />
                    <RunMetaLine label="Model" value={run.model_id} />
                    {run.file_name && <RunMetaLine label="File" value={run.file_name} />}
                    <RunMetaLine
                      label="Progress"
                      value={`${run.processed_count || 0} / ${run.total_rows}`}
                    />
                    {run.error_message && (
                      <RunMetaLine label="Error" value={run.error_message} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => onResume(run)}>
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
            </div>
          );
        }

        // Client-side interrupted run
        return (
          <div key={run.id} className="border border-border bg-muted/30 px-5 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="label-mono">Interrupted run detected</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                  <RunMetaLine label="Use case" value={run.use_case} />
                  <RunMetaLine label="Model" value={run.model_id} />
                  {run.file_name && <RunMetaLine label="File" value={run.file_name} />}
                  <RunMetaLine label="Rows" value={run.total_rows} />
                  <RunMetaLine label="Started" value={date} />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => onResume(run)}>
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
          </div>
        );
      })}
    </div>
  );
};

export default ResumeRunBanner;
