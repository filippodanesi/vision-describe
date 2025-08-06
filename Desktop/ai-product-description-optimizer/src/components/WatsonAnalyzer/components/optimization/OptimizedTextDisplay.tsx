
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface OptimizedTextDisplayProps {
  originalText: string;
  optimizedText: string;
}

/**
 * Displays the original and optimized text in a tabbed interface
 */
const OptimizedTextDisplay: React.FC<OptimizedTextDisplayProps> = ({ originalText, optimizedText }) => {
  const { toast } = useToast();
  
  // Return null only if both texts are empty or undefined
  if (!originalText && !optimizedText) return null;
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type} text copied`,
      description: `${type} text has been copied to your clipboard`,
      duration: 2000,
    });
  };
  
  return (
    <Tabs defaultValue={optimizedText ? "optimized" : "original"}>
      <TabsList className="grid grid-cols-2 mb-2">
        <TabsTrigger value="original">Original Text</TabsTrigger>
        <TabsTrigger value="optimized">Optimized Text</TabsTrigger>
      </TabsList>
      <TabsContent value="original">
        <div className="relative">
          <Textarea 
            readOnly
            value={originalText || ""}
            className="min-h-[200px] font-mono text-sm pr-10"
          />
          {originalText && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-70 hover:opacity-100 bg-background"
              onClick={() => copyToClipboard(originalText, "Original")}
              title="Copy original text"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TabsContent>
      <TabsContent value="optimized">
        {optimizedText ? (
          <div className="relative">
            <Textarea 
              readOnly
              value={optimizedText}
              className="min-h-[200px] font-mono text-sm bg-green-50 text-green-900 pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-70 hover:opacity-100 bg-green-50"
              onClick={() => copyToClipboard(optimizedText, "Optimized")}
              title="Copy optimized text"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>No optimized text yet</AlertTitle>
            <AlertDescription>
              Click the "Optimize Text" button to generate optimized content with your target keywords.
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default OptimizedTextDisplay;
