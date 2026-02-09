/**
 * Sanitization utilities for About You output content.
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

export function sanitizeStyleName(text: string): string {
  let clean = stripMarkdown(text);
  if (clean.length > 80) clean = clean.slice(0, 80).trim();
  return clean;
}

export function sanitizeLongDescription(text: string): string {
  let clean = stripMarkdown(text);
  if (clean.length > 500) clean = clean.slice(0, 500).trim();
  return clean;
}

export interface AboutYouValidation {
  styleName: { length: number; hasForbiddenWords: boolean; forbiddenWords: string[] };
  longDescription: { length: number; hasForbiddenWords: boolean; forbiddenWords: string[] };
}

export function validateAboutYouOutput(
  styleName: string,
  longDescription: string,
): AboutYouValidation {
  const findForbidden = (text: string): string[] => {
    const matches = text.match(new RegExp(FORBIDDEN_RX.source, 'gi'));
    return matches ? [...new Set(matches.map((m) => m.toLowerCase()))] : [];
  };

  return {
    styleName: {
      length: styleName.length,
      hasForbiddenWords: FORBIDDEN_RX.test(styleName),
      forbiddenWords: findForbidden(styleName),
    },
    longDescription: {
      length: longDescription.length,
      hasForbiddenWords: FORBIDDEN_RX.test(longDescription),
      forbiddenWords: findForbidden(longDescription),
    },
  };
}
