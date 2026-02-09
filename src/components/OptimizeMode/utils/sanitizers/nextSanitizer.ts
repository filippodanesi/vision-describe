/**
 * Sanitization utilities for NEXT output content.
 */

const FORBIDDEN_RX = /\b(best|perfect|ultimate|heals?|cures?|100%\s*(?:eco|sustainable|natural))\b/i;

function stripMarkdown(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')             // HTML tags
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Markdown links
    .replace(/[*_~`#]+/g, '')            // Markdown formatting
    .replace(/\n+/g, ' ')               // Newlines to spaces
    .replace(/\s{2,}/g, ' ')            // Collapse whitespace
    .trim();
}

export function sanitizeProductTitle(text: string): string {
  let clean = stripMarkdown(text);
  if (clean.length > 100) clean = clean.slice(0, 100).trim();
  return clean;
}

export function sanitizeCopyDesignFeatures(text: string): string {
  let clean = stripMarkdown(text);
  if (clean.length > 1000) clean = clean.slice(0, 1000).trim();
  return clean;
}

export interface NextValidation {
  productTitle: { length: number; hasForbiddenWords: boolean; forbiddenWords: string[] };
  copyDesignFeatures: { length: number; hasForbiddenWords: boolean; forbiddenWords: string[] };
}

export function validateNextOutput(
  productTitle: string,
  copyDesignFeatures: string,
): NextValidation {
  const findForbidden = (text: string): string[] => {
    const matches = text.match(new RegExp(FORBIDDEN_RX.source, 'gi'));
    return matches ? [...new Set(matches.map((m) => m.toLowerCase()))] : [];
  };

  return {
    productTitle: {
      length: productTitle.length,
      hasForbiddenWords: FORBIDDEN_RX.test(productTitle),
      forbiddenWords: findForbidden(productTitle),
    },
    copyDesignFeatures: {
      length: copyDesignFeatures.length,
      hasForbiddenWords: FORBIDDEN_RX.test(copyDesignFeatures),
      forbiddenWords: findForbidden(copyDesignFeatures),
    },
  };
}
