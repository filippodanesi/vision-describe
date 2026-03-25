import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { models } from '@/lib/models';
import { Brain, Zap, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModelSelectorProps {
  onModelSelected: (modelId: string, options?: { dryRun?: boolean; targetLanguage?: string }) => void;
  useCase?: 'ecommerce' | 'sloggi-ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next' | 'partoo';
  providerFilter?: 'openai' | 'anthropic';
}

const getBadgeClass = (_value: string) => {
  return 'bg-secondary text-secondary-foreground hover:bg-secondary';
};

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredModels.map((m) => {
            const isSelected = selectedModel === m.id;
            const ProviderIcon = m.provider === 'openai' ? Zap : Brain;
            return (
              <Card
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={cn(
                  'cursor-pointer p-4 transition-all',
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/[0.02] shadow-sm'
                    : 'hover:border-border hover:shadow-sm'
                )}
              >
                <div className="flex items-start gap-3">
                  <ProviderIcon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-foreground">{m.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{m.provider}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getBadgeClass(m.speed)}`}>
                        {m.speed}
                      </Badge>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getBadgeClass(m.cost)}`}>
                        {m.cost} cost
                      </Badge>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${getBadgeClass(m.quality)}`}>
                        {m.quality}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>


        <div className="flex items-center gap-3">
          <Button
            onClick={handleConfirm}
            disabled={!selectedModel}
            className="flex-1"
          >
            Start Processing
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
                <p className="text-xs">Process only the first 10 rows to test the configuration without consuming full API credits</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ModelSelector;
