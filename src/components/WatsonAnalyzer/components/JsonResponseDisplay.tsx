
import React from 'react';
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface JsonResponseDisplayProps {
  results: any;
}

const JsonResponseDisplay: React.FC<JsonResponseDisplayProps> = ({ results }) => {
  const { toast } = useToast();

  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    toast({
      title: "Copied to clipboard",
      description: "JSON response has been copied to your clipboard",
    });
  };

  return (
    <div className="relative">
      <pre className="bg-secondary/30 p-4 rounded-md overflow-auto text-xs font-mono h-[300px]">
        {JSON.stringify(results, null, 2)}
      </pre>
      <Button 
        size="sm" 
        variant="outline" 
        className="absolute top-2 right-2 h-8 flex items-center gap-1"
        onClick={copyJsonToClipboard}
      >
        <Copy className="h-3.5 w-3.5" />
        Copy
      </Button>
    </div>
  );
};

export default JsonResponseDisplay;
