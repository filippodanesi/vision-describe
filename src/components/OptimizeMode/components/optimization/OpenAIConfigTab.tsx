import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface OpenAIConfigTabProps {
  aiModel: string;
  setAiModel: (model: string) => void;
  tempOpenAIKey: string;
  setTempOpenAIKey: (key: string) => void;
  openAIKeyWarning: string | null;
}

const OpenAIConfigTab: React.FC<OpenAIConfigTabProps> = ({
  aiModel,
  setAiModel,
  tempOpenAIKey,
  setTempOpenAIKey,
  openAIKeyWarning
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ai-model-openai">AI Model</Label>
        <Select 
          value={aiModel.startsWith("o3") || aiModel.startsWith("o4") ? aiModel : "o4-mini"} 
          onValueChange={setAiModel}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="o4-mini">o4-mini</SelectItem>
            <SelectItem value="o3">o3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-key-openai">API Key</Label>
        <Input
          id="api-key-openai"
          type="password"
          placeholder="Loaded from .env.local"
          value={tempOpenAIKey}
          onChange={(e) => setTempOpenAIKey(e.target.value)}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Your key is loaded from your account Settings. You can override it here.
        </p>
        {openAIKeyWarning && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{openAIKeyWarning}</p>
        )}
      </div>
    </div>
  );
};

export default OpenAIConfigTab;
