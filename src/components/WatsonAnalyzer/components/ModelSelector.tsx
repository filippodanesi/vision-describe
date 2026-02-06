import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { models } from '@/lib/models';
import { Brain, Zap, Globe, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModelSelectorProps {
  onModelSelected: (modelId: string, options?: { dryRun?: boolean; targetLanguage?: string }) => void;
  useCase?: 'ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next' | 'partoo';
}

const getBadgeClass = (value: string) => {
  switch (value) {
    case 'Fast':
    case 'Low':
    case 'Excellent':
      return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
    case 'Medium':
      return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
    case 'Slow':
    case 'High':
      return 'bg-red-100 text-red-700 hover:bg-red-100';
    default:
      return '';
  }
};

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelSelected, useCase = 'ecommerce' }) => {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [dryRun, setDryRun] = useState<boolean>(false);

  const handleConfirm = () => {
    if (selectedModel) onModelSelected(selectedModel, { dryRun, targetLanguage });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {models.map((m) => {
            const isSelected = selectedModel === m.id;
            const ProviderIcon = m.provider === 'openai' ? Zap : Brain;
            return (
              <Card
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={`cursor-pointer p-4 transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <ProviderIcon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-foreground">{m.name}</span>
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

        {/* Language Selection - Only for E-commerce */}
        {useCase === 'ecommerce' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Target Language
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Select the language for the generated content. The AI will translate from the source language if needed.</p>
                </TooltipContent>
              </Tooltip>
            </label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select target language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

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
