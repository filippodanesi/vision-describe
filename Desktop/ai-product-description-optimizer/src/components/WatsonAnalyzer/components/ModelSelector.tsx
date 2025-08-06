import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { models } from '@/lib/models';
import { Brain, Zap, DollarSign, Clock, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModelSelectorProps {
  onModelSelected: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelSelected }) => {
  const [selectedModel, setSelectedModel] = useState<string>('');

  const handleConfirm = () => {
    if (selectedModel) onModelSelected(selectedModel);
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
        

        
        <Button 
          onClick={handleConfirm} 
          disabled={!selectedModel}
          className="w-full"
        >
          Start Processing
        </Button>
    </div>
    </TooltipProvider>
  );
};

export default ModelSelector; 
