import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCostTracker } from '../hooks/useCostTracker';
import type { AIProvider } from '../hooks/useTextOptimization';
import OpenAIConfigTab from './optimization/OpenAIConfigTab';
import AnthropicConfigTab from './optimization/AnthropicConfigTab';
import BudgetConfigSection from './optimization/BudgetConfigSection';
import { validateApiKey } from './optimization/apiKeyUtils';

interface AIOptimizationConfigProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  aiModel: string;
  setAiModel: (model: string) => void;
  aiProvider?: AIProvider;
  setAiProvider?: (provider: AIProvider) => void;
  openAIKey?: string;
  anthropicKey?: string;
}

const AIOptimizationConfig: React.FC<AIOptimizationConfigProps> = ({
  apiKey,
  setApiKey,
  aiModel,
  setAiModel,
  aiProvider = "openai",
  setAiProvider,
  openAIKey = "",
  anthropicKey = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<AIProvider>(aiProvider);
  
  // Add cost tracker
  const costTracker = useCostTracker();
  
  // Initialize with provider-specific keys when available
  const [tempOpenAIKey, setTempOpenAIKey] = useState(openAIKey || (aiProvider === "openai" ? apiKey : ""));
  const [tempAnthropicKey, setTempAnthropicKey] = useState(anthropicKey || (aiProvider === "anthropic" ? apiKey : ""));

  // Update temp keys when the props change
  useEffect(() => {
    if (openAIKey) setTempOpenAIKey(openAIKey);
    if (anthropicKey) setTempAnthropicKey(anthropicKey);
  }, [openAIKey, anthropicKey]);

  const handleSave = () => {
    // Save the current provider's API key
    if (activeProvider === "openai") {
      setApiKey(tempOpenAIKey);
    } else {
      setApiKey(tempAnthropicKey);
    }
    setIsOpen(false);
  };

  const handleProviderChange = (provider: AIProvider) => {
    setActiveProvider(provider);
    if (setAiProvider) {
      setAiProvider(provider);
    }
    // Set a default model for the selected provider
    if (provider === "openai" && aiModel.startsWith("claude")) {
      setAiModel("o4-mini");
          } else if (provider === "anthropic" && !aiModel.startsWith("claude")) {
        setAiModel("claude-sonnet-4-0");
    }
  };

  const openAIKeyWarning = validateApiKey(tempOpenAIKey, "openai");
  const anthropicKeyWarning = validateApiKey(tempAnthropicKey, "anthropic");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Key className="h-4 w-4" />
          Configure AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Optimization Configuration</DialogTitle>
          <DialogDescription>
            Configure API keys, models, and budget for AI-powered text optimization
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Tabs 
            defaultValue={activeProvider} 
            onValueChange={(value) => handleProviderChange(value as AIProvider)}
            value={activeProvider}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="anthropic">Anthropic (Claude)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="openai" className="space-y-4">
              <OpenAIConfigTab 
                aiModel={aiModel}
                setAiModel={setAiModel}
                tempOpenAIKey={tempOpenAIKey}
                setTempOpenAIKey={setTempOpenAIKey}
                openAIKeyWarning={openAIKeyWarning}
              />
              <BudgetConfigSection 
                costTracker={costTracker}
                activeProvider="openai"
              />
            </TabsContent>
            
            <TabsContent value="anthropic" className="space-y-4">
              <AnthropicConfigTab 
                aiModel={aiModel}
                setAiModel={setAiModel}
                tempAnthropicKey={tempAnthropicKey}
                setTempAnthropicKey={setTempAnthropicKey}
                anthropicKeyWarning={anthropicKeyWarning}
              />
              <BudgetConfigSection 
                costTracker={costTracker}
                activeProvider="anthropic"
              />
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} className="w-full">
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIOptimizationConfig;
