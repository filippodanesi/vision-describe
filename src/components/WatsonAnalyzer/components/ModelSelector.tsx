import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { models } from '@/lib/models';
import { Brain, Zap, DollarSign, Clock, HelpCircle, Globe } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModelSelectorProps {
  onModelSelected: (modelId: string, options?: { dryRun?: boolean; targetLanguage?: string }) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelSelected }) => {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [dryRun, setDryRun] = useState<boolean>(false);
  
  const handleConfirm = () => {
    if (selectedModel) onModelSelected(selectedModel, { dryRun, targetLanguage });
  };

  const getModelInfo = (modelId: string) => {
    const modelInfo: { [key: string]: { speed: string; cost: string; quality: string; description: string } } = {
      'o4-mini': {
        speed: 'Fast',
        cost: 'Low',
        quality: 'Very Good',
        description: 'A fast and efficient model that offers excellent value for most tasks.'
      },
      'o3': {
        speed: 'Slow',
        cost: 'High',
        quality: 'Excellent',
        description: 'OpenAI\'s most advanced model, ideal for complex tasks and in-depth analysis.'
      },
      'claude-opus-4-0': {
        speed: 'Medium',
        cost: 'High',
        quality: 'Excellent',
        description: 'Anthropic\'s most capable model, excellent for complex reasoning and creativity.'
      },
      'claude-sonnet-4-0': {
        speed: 'Fast',
        cost: 'Medium',
        quality: 'Very Good',
        description: 'Balanced performance between quality and efficiency, ideal for general use.'
      }
    };
    return modelInfo[modelId] || { speed: 'Unknown', cost: 'Unknown', quality: 'Unknown', description: 'Nessuna informazione disponibile.' };
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <RadioGroup value={selectedModel} onValueChange={setSelectedModel} className="space-y-4">
          {models.map((m) => {
            const info = getModelInfo(m.id);
            return (
              <div key={m.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
            <RadioGroupItem value={m.id} id={m.id} />
                  <label htmlFor={m.id} className="text-sm font-medium cursor-pointer flex-1">
                    {m.name}
            </label>
                  <span className="text-xs text-gray-500">
                    {m.provider}
                  </span>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{info.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
          </div>
            );
          })}
      </RadioGroup>
        
        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
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

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedModel}
            className="flex-1"
          >
            Start Processing
          </Button>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Dry run (10 rows)
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Process only the first 10 rows to test the configuration without consuming full API credits</p>
              </TooltipContent>
            </Tooltip>
          </label>
        </div>
    </div>
    </TooltipProvider>
  );
};

export default ModelSelector; 
