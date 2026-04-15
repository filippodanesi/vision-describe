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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

interface AnthropicConfigTabProps {
  aiModel: string;
  setAiModel: (model: string) => void;
  tempAnthropicKey: string;
  setTempAnthropicKey: (key: string) => void;
  anthropicKeyWarning: string | null;
}

const AnthropicConfigTab: React.FC<AnthropicConfigTabProps> = ({
  aiModel,
  setAiModel,
  tempAnthropicKey,
  setTempAnthropicKey,
  anthropicKeyWarning
}) => {
  return (
    <div className="space-y-4">
      <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Claude models for advanced AI optimization
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="ai-model-claude">AI Model</Label>
        <Select 
          value={aiModel.startsWith("claude") ? aiModel : "claude-sonnet-4-0"} 
          onValueChange={setAiModel}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude-sonnet-4-0">Claude Sonnet 4</SelectItem>
            <SelectItem value="claude-opus-4-0">Claude Opus 4</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Prices shown as Input/Output per million tokens</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-key-claude">API Key</Label>
        <Input
          id="api-key-claude"
          type="password"
          placeholder="Loaded from .env.local"
          value={tempAnthropicKey}
          onChange={(e) => setTempAnthropicKey(e.target.value)}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Your key is loaded from your account Settings. You can override it here.
        </p>
        {anthropicKeyWarning && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{anthropicKeyWarning}</p>
        )}
      </div>
      
      <Alert variant="warning" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Claude API keys typically start with <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">sk-ant-</code>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AnthropicConfigTab;
