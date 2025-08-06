import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    largeFileMode: false
  });

  const updateConfig = (updates: Partial<ProcessingConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onConfigUpdate?.(newConfig);
  };

  const handleLargeFileModeToggle = (enabled: boolean) => {
    if (enabled) {
      // Optimize for large files
      updateConfig({
        largeFileMode: true,
        requestsPerMinute: 20, // More conservative
        minDelayMs: 3000,      // Longer delays
        saveProgressEvery: 50  // Save more frequently
      });
    } else {
      // Standard settings
      updateConfig({
        largeFileMode: false,
        requestsPerMinute: 30,
        minDelayMs: 2000,
        saveProgressEvery: 100
      });
    }
  };

  const estimateProcessingTime = () => {
    const requestsPerSecond = config.requestsPerMinute / 60;
    const effectiveRequestsPerSecond = Math.min(requestsPerSecond, 1000 / config.minDelayMs);
    
    const estimateFor1000 = Math.ceil(1000 / effectiveRequestsPerSecond / 60); // in minutes
    const estimateFor7000 = Math.ceil(7000 / effectiveRequestsPerSecond / 60); // in minutes
    
    return {
      for1000: estimateFor1000 > 60 ? `${Math.round(estimateFor1000/60)}h ${estimateFor1000%60}m` : `${estimateFor1000}m`,
      for7000: estimateFor7000 > 60 ? `${Math.round(estimateFor7000/60)}h ${estimateFor7000%60}m` : `${estimateFor7000}m`
    };
  };

  const estimates = estimateProcessingTime();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Processing Limits Configuration
        </CardTitle>
        <CardDescription>
          Configure rate limiting and processing options for large files (recommended for 1000+ rows)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Large File Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="large-file-mode">Large File Mode</Label>
            <p className="text-sm text-muted-foreground">
              Optimized settings for processing 1000+ rows
            </p>
          </div>
          <Switch 
            id="large-file-mode"
            checked={config.largeFileMode}
            onCheckedChange={handleLargeFileModeToggle}
          />
        </div>

        {/* Rate Limiting Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="requests-per-minute">Requests per Minute</Label>
            <Input
              id="requests-per-minute"
              type="number"
              min="5"
              max="60"
              value={config.requestsPerMinute}
              onChange={(e) => updateConfig({ requestsPerMinute: parseInt(e.target.value) || 30 })}
            />
            <p className="text-xs text-muted-foreground">
              Lower = safer but slower
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="min-delay">Minimum Delay (ms)</Label>
            <Input
              id="min-delay"
              type="number"
              min="1000"
              max="10000"
              step="500"
              value={config.minDelayMs}
              onChange={(e) => updateConfig({ minDelayMs: parseInt(e.target.value) || 2000 })}
            />
            <p className="text-xs text-muted-foreground">
              Delay between requests
            </p>
          </div>
          </div>
          
        {/* Progress Saving */}
        <div className="space-y-2">
          <Label htmlFor="save-interval">Save Progress Every N Rows</Label>
            <Input
            id="save-interval"
              type="number"
            min="10"
            max="500"
            value={config.saveProgressEvery}
            onChange={(e) => updateConfig({ saveProgressEvery: parseInt(e.target.value) || 100 })}
            />
          <p className="text-xs text-muted-foreground">
            Automatic backup every N processed rows
          </p>
          </div>
          
        {/* Recovery Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="enable-recovery">Enable Auto-Recovery</Label>
            <p className="text-sm text-muted-foreground">
              Resume processing from last saved progress
            </p>
          </div>
          <Switch 
            id="enable-recovery"
            checked={config.enableRecovery}
            onCheckedChange={(enabled) => updateConfig({ enableRecovery: enabled })}
          />
        </div>

        {/* Time Estimates */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Estimated processing times:</strong><br />
            • 1,000 rows: ~{estimates.for1000}<br />
            • 7,000 rows: ~{estimates.for7000}
          </AlertDescription>
        </Alert>

        {/* Warning for large files */}
        {config.requestsPerMinute > 40 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              High request rates may trigger API rate limits. Consider reducing for large files.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => updateConfig({
              requestsPerMinute: 20,
              minDelayMs: 3000,
              saveProgressEvery: 50,
              largeFileMode: true
            })}
          >
            Conservative (Safe)
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => updateConfig({
              requestsPerMinute: 30,
              minDelayMs: 2000,
              saveProgressEvery: 100,
              largeFileMode: false
            })}
          >
            Balanced (Default)
          </Button>
      </div>
      </CardContent>
    </Card>
  );
};

export default LimitsSection;
