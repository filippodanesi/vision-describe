
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TextInputSectionProps {
  text: string;
  setText: (text: string) => void;
}

const TextInputSection: React.FC<TextInputSectionProps> = ({
  text,
  setText
}) => {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Text copied",
      description: "Text has been copied to your clipboard",
      duration: 2000,
    });
  };

  return (
    <div className="relative">
      <Textarea 
        placeholder="Enter text to analyze" 
        className="min-h-[200px] font-mono text-sm pr-10"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {text && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-70 hover:opacity-100 bg-background"
          onClick={copyToClipboard}
          title="Copy text"
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default TextInputSection;
