import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { models } from '@/lib/models';
import { Brain, Zap, HelpCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ModelSelectorProps {
  onModelSelected: (modelId: string, options?: { dryRun?: boolean; targetLanguage?: string }) => void;
  useCase?: 'ecommerce' | 'sloggi-ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next' | 'partoo';
  providerFilter?: 'openai' | 'anthropic';
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelSelected, useCase = 'ecommerce', providerFilter }) => {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [dryRun, setDryRun] = useState<boolean>(false);
  const filteredModels = providerFilter ? models.filter(m => m.provider === providerFilter) : models;

  const handleConfirm = () => {
    if (selectedModel) onModelSelected(selectedModel, { dryRun });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredModels.map((m) => {
            const isSelected = selectedModel === m.id;
            const ProviderIcon = m.provider === 'openai' ? Zap : Brain;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    'group w-full text-left border bg-card p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2',
                    isSelected
                      ? 'border-signal bg-signal/[0.04]'
                      : 'border-border hover:border-foreground/40',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <ProviderIcon
                      className={cn(
                        'h-4 w-4 mt-1 shrink-0 transition-colors',
                        isSelected ? 'text-signal' : 'text-muted-foreground',
                      )}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-sm tracking-tightest text-foreground truncate">
                          {m.name}
                        </span>
                        <span className="label-mono-sm shrink-0">{m.provider}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {m.description}
                      </p>
                      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 label-mono-sm">
                        <div className="flex items-baseline gap-1.5">
                          <dt className="text-muted-foreground/60">Speed</dt>
                          <dd className="text-foreground/80 normal-case tracking-normal font-mono">{m.speed}</dd>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <dt className="text-muted-foreground/60">Cost</dt>
                          <dd className="text-foreground/80 normal-case tracking-normal font-mono">{m.cost}</dd>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <dt className="text-muted-foreground/60">Quality</dt>
                          <dd className="text-foreground/80 normal-case tracking-normal font-mono">{m.quality}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-4 pt-2">
          <Button
            onClick={handleConfirm}
            disabled={!selectedModel}
            className="flex-1"
          >
            Start processing
          </Button>
          <div className="flex items-center gap-2">
            <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
            <Label htmlFor="dry-run" className="text-xs text-muted-foreground cursor-pointer">
              Dry run (10 rows)
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Process only the first 10 rows to test the configuration without consuming full API credits.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ModelSelector;
