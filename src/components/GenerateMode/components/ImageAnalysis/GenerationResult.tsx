import React, { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Block tags the model is allowed to emit. Inline `<br>` is also kept so the
// \n → <br> step below can preserve paragraph breaks in plain-text portions.
const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'div', 'span', 'blockquote',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'strong', 'em', 'b', 'i', 'u', 'code',
  'h1', 'h2', 'h3', 'h4',
];

// No attributes from model output are trusted. Forbidding everything also
// kills `style`, event handlers, `href`, `src`, etc. in a single rule.
const PURIFY_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR: [] as string[],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'a', 'img'],
  KEEP_CONTENT: true,
} as const;

/**
 * Convert \n to <br> in plain-text portions while preserving HTML block
 * elements, then sanitize the whole string via DOMPurify with a strict
 * allowlist. The model output is user-influenced (via prompts, image content)
 * and must never reach the DOM unsanitized.
 */
function formatForDisplay(raw: string): string {
  const withBreaks = raw
    .split(/(<(?:ul|ol|div|table|blockquote)[\s\S]*?<\/(?:ul|ol|div|table|blockquote)>)/gi)
    .map(part =>
      part.match(/^<(?:ul|ol|div|table|blockquote)/i) ? part : part.replace(/\n/g, '<br>'),
    )
    .join('');
  return DOMPurify.sanitize(withBreaks, PURIFY_CONFIG);
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
      toast.error('Failed to copy');
    }
  };

  return (
    <section className=" space-y-6">
      <div>
        <p className="label-mono">
          <span
            className="inline-block size-1.5 rounded-full bg-foreground mr-2 align-middle"
            aria-hidden="true"
          />
          Complete
        </p>
        <h2 className="mt-1 text-base font-semibold tracking-tightest text-foreground">
          Generated description
        </h2>
      </div>

      <div className="border border-border bg-card">
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {tokens.input.toLocaleString()} in · {tokens.output.toLocaleString()} out
          </span>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <div
          className="prose prose-sm max-w-none text-foreground p-5"
          dangerouslySetInnerHTML={{ __html: displayHtml }}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" onClick={onGenerateAgain}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate again
        </Button>
        <Button variant="ghost" onClick={onReset}>
          Start over
        </Button>
      </div>
    </section>
  );
};
