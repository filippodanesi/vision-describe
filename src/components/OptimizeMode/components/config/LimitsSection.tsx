import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';

interface LimitsSectionProps {
  onConfigUpdate?: (config: ProcessingConfig) => void;
}

export interface ProcessingConfig {
  requestsPerMinute: number;
  minDelayMs: number;
  saveProgressEvery: number;
  enableRecovery: boolean;
  largeFileMode: boolean;
}

const LimitsSection: React.FC<LimitsSectionProps> = ({ onConfigUpdate }) => {
  const [config, setConfig] = useState<ProcessingConfig>({
    requestsPerMinute: 30,
    minDelayMs: 2000,
    saveProgressEvery: 100,
    enableRecovery: true,
    largeFileMode: false,
  });

  const updateConfig = (updates: Partial<ProcessingConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigUpdate?.(newConfig);
  };

  const handleLargeFileModeToggle = (enabled: boolean) => {
    if (enabled) {
      updateConfig({
        largeFileMode: true,
        requestsPerMinute: 20,
        minDelayMs: 3000,
        saveProgressEvery: 50,
      });
    } else {
      updateConfig({
        largeFileMode: false,
        requestsPerMinute: 30,
        minDelayMs: 2000,
        saveProgressEvery: 100,
      });
    }
  };

  const estimateProcessingTime = () => {
    const requestsPerSecond = config.requestsPerMinute / 60;
    const effectiveRequestsPerSecond = Math.min(requestsPerSecond, 1000 / config.minDelayMs);

    const estimateFor1000 = Math.ceil(1000 / effectiveRequestsPerSecond / 60);
    const estimateFor7000 = Math.ceil(7000 / effectiveRequestsPerSecond / 60);

    return {
      for1000:
        estimateFor1000 > 60
          ? `${Math.round(estimateFor1000 / 60)}h ${estimateFor1000 % 60}m`
          : `${estimateFor1000}m`,
      for7000:
        estimateFor7000 > 60
          ? `${Math.round(estimateFor7000 / 60)}h ${estimateFor7000 % 60}m`
          : `${estimateFor7000}m`,
    };
  };

  const estimates = estimateProcessingTime();

  return (
    <section className="max-w-3xl">
      <div className="mb-4">
        <p className="label-mono mb-1">Processing limits</p>
        <h2 className="text-base font-semibold tracking-tightest text-foreground">
          Rate limiting &amp; recovery
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Configure rate limiting and recovery options for large files (recommended for 1000+ rows).
        </p>
      </div>

      <div className="border border-border bg-card divide-y divide-border">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="space-y-1 min-w-0">
            <Label htmlFor="large-file-mode" className="text-sm font-medium text-foreground">
              Large file mode
            </Label>
            <p className="text-xs text-muted-foreground">
              Optimised settings for processing 1000+ rows.
            </p>
          </div>
          <Switch
            id="large-file-mode"
            checked={config.largeFileMode}
            onCheckedChange={handleLargeFileModeToggle}
          />
        </div>

        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="requests-per-minute" className="label-mono">Requests / min</Label>
            <Input
              id="requests-per-minute"
              type="number"
              min="5"
              max="60"
              value={config.requestsPerMinute}
              onChange={(e) =>
                updateConfig({ requestsPerMinute: parseInt(e.target.value) || 30 })
              }
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Lower = safer but slower.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-delay" className="label-mono">Minimum delay (ms)</Label>
            <Input
              id="min-delay"
              type="number"
              min="1000"
              max="10000"
              step="500"
              value={config.minDelayMs}
              onChange={(e) =>
                updateConfig({ minDelayMs: parseInt(e.target.value) || 2000 })
              }
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Delay between requests.</p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-2">
          <Label htmlFor="save-interval" className="label-mono">Save progress every N rows</Label>
          <Input
            id="save-interval"
            type="number"
            min="10"
            max="500"
            value={config.saveProgressEvery}
            onChange={(e) =>
              updateConfig({ saveProgressEvery: parseInt(e.target.value) || 100 })
            }
            className="font-mono max-w-xs"
          />
          <p className="text-xs text-muted-foreground">
            Automatic backup every N processed rows.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="space-y-1 min-w-0">
            <Label htmlFor="enable-recovery" className="text-sm font-medium text-foreground">
              Auto-recovery
            </Label>
            <p className="text-xs text-muted-foreground">
              Resume processing from the last saved progress.
            </p>
          </div>
          <Switch
            id="enable-recovery"
            checked={config.enableRecovery}
            onCheckedChange={(enabled) => updateConfig({ enableRecovery: enabled })}
          />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 border border-border bg-card px-4 py-3 text-sm">
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">
          <span className="label-mono-sm normal-case tracking-normal text-foreground/80">
            Estimated processing times
          </span>
          <span className="ml-2 font-mono tabular-nums text-foreground/90">
            1,000 rows ≈ {estimates.for1000} · 7,000 rows ≈ {estimates.for7000}
          </span>
        </p>
      </div>

      {config.requestsPerMinute > 40 && (
        <div className="mt-3 flex items-start gap-2 border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p>High request rates may trigger API rate limits. Consider reducing for large files.</p>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            updateConfig({
              requestsPerMinute: 20,
              minDelayMs: 3000,
              saveProgressEvery: 50,
              largeFileMode: true,
            })
          }
        >
          Conservative
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            updateConfig({
              requestsPerMinute: 30,
              minDelayMs: 2000,
              saveProgressEvery: 100,
              largeFileMode: false,
            })
          }
        >
          Balanced (default)
        </Button>
      </div>
    </section>
  );
};

export default LimitsSection;
