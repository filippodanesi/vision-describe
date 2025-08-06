
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { CheckCircle } from "lucide-react";

interface QuickCredentialsInputProps {
  setApiKey: (key: string) => void;
  setUrl: (url: string) => void;
  setRegion: (region: string) => void;
  setInstanceId: (id: string) => void;
  credentialsFileExists?: boolean;
  setCredentialsFileExists?: (exists: boolean) => void;
}

export const QuickCredentialsInput: React.FC<QuickCredentialsInputProps> = ({
  setApiKey,
  setUrl,
  setRegion,
  setInstanceId,
  credentialsFileExists = false,
  setCredentialsFileExists
}) => {
  const [quickInput, setQuickInput] = useState("");

  const handleQuickInput = () => {
    try {
      // Try to parse as JSON first
      const data = JSON.parse(quickInput);
      if (data.apikey) setApiKey(data.apikey);
      if (data.url) {
        const url = new URL(data.url);
        const region = url.hostname.split('.')[1];
        setRegion(region);
        setUrl(data.url);
      }
      if (data.instance_id) setInstanceId(data.instance_id);
      toast.success("Credentials imported successfully");
    } catch {
      // If not JSON, try to parse as URL
      try {
        const url = new URL(quickInput);
        if (url.hostname.includes('natural-language-understanding')) {
          const region = url.hostname.split('.')[1];
          setRegion(region);
          setUrl(quickInput);
          toast.success("URL imported successfully");
        }
      } catch {
        toast.error("Invalid input format");
      }
    }
    setQuickInput("");
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      
      let apiKey = '';
      let url = '';
      
      lines.forEach(line => {
        if (line.startsWith('NATURAL_LANGUAGE_UNDERSTANDING_APIKEY=')) {
          apiKey = line.split('=')[1].trim();
        }
        if (line.startsWith('NATURAL_LANGUAGE_UNDERSTANDING_URL=')) {
          url = line.split('=')[1].trim();
        }
      });

      if (apiKey && url) {
        setApiKey(apiKey);
        const urlObj = new URL(url);
        const region = urlObj.hostname.split('.')[1];
        setRegion(region);
        setUrl(url);
        setInstanceId(url.split('/').pop() || '');
        
        // Aggiorna lo stato per indicare che un file di credenziali è stato caricato con successo
        if (setCredentialsFileExists) {
          setCredentialsFileExists(true);
        }
        
        toast.success("Credentials imported successfully");
      } else {
        toast.error("Invalid .env file format");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Quick Input</span>
        <div className="flex items-center gap-2">
          {credentialsFileExists && (
            <div className="flex items-center text-green-500">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">Credentials loaded</span>
            </div>
          )}
          <div className="relative">
            <input
              type="file"
              accept=".env"
              onChange={handleFileUpload}
              className="hidden"
              id="env-upload"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById('env-upload')?.click()}
              className="h-8"
            >
              <Upload className="h-4 w-4 mr-1" />
              <span className="text-xs">Import .env</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Input
          placeholder="Paste JSON credentials or URL"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
        />
        <Button onClick={handleQuickInput} disabled={!quickInput}>
          Import
        </Button>
      </div>
    </div>
  );
};
