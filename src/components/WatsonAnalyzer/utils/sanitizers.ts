// src/components/WatsonAnalyzer/utils/sanitizers.ts
// Sanitization and validation utilities for Amazon content generation

/**
 * Content Sanitization Utilities
 * 
 * @author Filippo Danesi
 * @created 2025
 * @description Post-processing utilities for AI-generated content.
 *              Ensures consistent formatting, policy compliance,
 *              and quality standards for Amazon product content.
 * 
 * Key Features:
 * - Bullet point normalization (exactly 5 bullets)
 * - A+ short content length enforcement (≤300 chars)
 * - Description cleaning and formatting
 * - Policy violation detection
 * - Duplicate content removal
 * - Markdown and formatting cleanup
 */

/**
 * Sanitizes AI-generated bullet points to ensure exactly 5 clean bullets
 * @param raw - Raw AI output string
 * @returns Array of exactly 5 bullet points
 */
export function sanitizeBulletsOutputToArray(raw: string): string[] {
  if (!raw) return [];
  // Normalize newlines
  let txt = String(raw).replace(/\r\n|\r/g, '\n').trim();

  // Remove accidental headings/labels
  txt = txt.replace(/^\s*(bullets?:|bullet points?:)\s*/i, '');

  // If model returned a single line with separators, try to split
  let lines = txt.split('\n').map(s => s.trim()).filter(Boolean);
  if (lines.length === 1) {
    const one = lines[0];
    const splitters = [/\s•\s+/, /\s-\s+/, /\s–\s+/, /\s—\s+/, /\s\|\s+/, /;\s+/];
    for (const rx of splitters) {
      const parts = one.split(rx).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) { lines = parts; break; }
    }
  }

  // Strip numbering/symbols
  lines = lines.map(l => l.replace(/^\s*(?:[-–—•]|(\d+)[\.\)]\s*)\s*/,'').trim());

  // Filter empty, de-dup, cut to 5
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of lines) {
    if (!l) continue;
    const key = l.toLowerCase();
    if (seen.has(key)) continue;
    out.push(l);
    seen.add(key);
    if (out.length === 5) break;
  }

  // Pad if fewer than 5
  while (out.length < 5) out.push('—');
  return out;
}

export function sanitizeAplusShort(raw: string): string {
  if (!raw) return '';
  let s = String(raw)
    .replace(/^\s*(bullets?:|a\+?\s*short:)\s*/i, '') // drop labels
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  // Hard cap 300
  if (s.length > 300) s = s.slice(0, 300).trim();
  return s;
}

export function sanitizeDescription(raw: string): string {
  if (!raw) return '';
  return String(raw)
    .replace(/^\s*(description:)\s*/i, '')
    .replace(/[*_`#>-]/g, (m) => m === '-' ? '' : '') // very light markdown strip (keep text)
    .replace(/\s+/g, ' ')
    .trim();
}

const POLICY_RX = /\b(best|heals?|cures?|100%\s*(?:eco|sustainable))\b/i;

export function detectPolicyIssues(text: string): string[] {
  const hits: string[] = [];
  if (!text) return hits;
  let m;
  const rx = new RegExp(POLICY_RX, 'gi');
  while ((m = rx.exec(text)) !== null) hits.push(m[0]);
  return hits;
}

export function hasPolicyIssues(...texts: (string|undefined)[]): boolean {
  return texts.some(t => detectPolicyIssues(t || '').length > 0);
}
