import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

/** Convert \n to <br> in plain-text portions while preserving HTML block elements */
function formatForDisplay(raw: string): string {
  return raw
    .split(/(<(?:ul|ol|div|table|blockquote)[\s\S]*?<\/(?:ul|ol|div|table|blockquote)>)/gi)
    .map(part =>
      part.match(/^<(?:ul|ol|div|table|blockquote)/i) ? part : part.replace(/\n/g, '<br>')
    )
    .join('');
}

interface GenerationResultProps {
  result: string;
  tokens: { input: number; output: number };
  onGenerateAgain: () => void;
  onReset: () => void;
}

export const GenerationResult: React.FC<GenerationResultProps> = ({
  result,
  tokens,
  onGenerateAgain,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);
  const displayHtml = useMemo(() => formatForDisplay(result), [result]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Failed to copy', {
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' },
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Generated Description</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-mono">
              {tokens.input.toLocaleString()} in / {tokens.output.toLocaleString()} out
            </Badge>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: displayHtml }}
          />
        </CardContent>
        <CardFooter className="flex items-center gap-3 pt-4">
          <Button variant="outline" onClick={onGenerateAgain}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Again
          </Button>
          <Button variant="ghost" onClick={onReset}>
            Start Over
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
