// Validation and post-processing utilities for Amazon content generation

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AmazonContentValidation {
  bullets: {
    count: number;
    emptyCount: number;
    hasForbiddenWords: boolean;
    forbiddenWords: string[];
  };
  aplusShort: {
    length: number;
    hasPrefixes: boolean;
    prefixes: string[];
    hasForbiddenWords: boolean;
    forbiddenWords: string[];
  };
  description: {
    hasForbiddenWords: boolean;
    forbiddenWords: string[];
  };
}

// Forbidden words and patterns
const FORBIDDEN_WORDS = [
  'best', 'heals', 'healing', 'healed', 'medizinisch', 'price', 'shipping', 'competitor',
  '100% eco', '100% organic', 'guaranteed', 'promise', 'miracle', 'instant', 'immediate'
];

const FORBIDDEN_PATTERNS = [
  /\b(best)\b/gi,
  /\bheal(s|ing|ed)?\b/gi,
  /medizinisch/gi,
  /price|shipping|competitor/gi,
  /100%\s*(eco|organic)/gi,
  /\b(guaranteed|promise|miracle|instant|immediate)\b/gi
];

// Prefixes that should be removed from A+ Short
const A_PLUS_PREFIXES = [
  /^\s*\*\*?\s*BULLETS?\s*:\s*\*\*/i,
  /^\s*\*\*?\s*Bullets?\s*:\s*\*\*/i,
  /^\s*BULLETS?\s*:\s*/i,
  /^\s*Bullets?\s*:\s*/i,
  /^\s*\*\*?\s*A\+\s*Short\s*:\s*\*\*/i,
  /^\s*A\+\s*Short\s*:\s*/i
];

/**
 * Clean A+ Short content by removing prefixes and limiting length
 */
export function cleanAplusShort(content: string, maxLength: number = 300): string {
  if (!content) return '';
  
  let cleaned = content.trim();
  
  // Remove prefixes
  for (const prefix of A_PLUS_PREFIXES) {
    cleaned = cleaned.replace(prefix, '').trim();
  }
  
  // Remove bullet markers
  cleaned = cleaned.replace(/^\s*[•\-\–\—\*]\s+/, '').trim();
  
  // Get first sentence if too long
  if (cleaned.length > maxLength) {
    const firstSentenceMatch = cleaned.match(/^[\s\S]*?[\.!?](?:\s|$)/);
    const firstSentence = firstSentenceMatch ? firstSentenceMatch[0].trim() : cleaned;
    
    if (firstSentence.length <= maxLength) {
      cleaned = firstSentence;
    } else {
      // Truncate at word boundary
      const truncated = cleaned.slice(0, maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      cleaned = lastSpace > maxLength * 0.8 ? truncated.slice(0, lastSpace) + '...' : truncated + '...';
    }
  }
  
  return cleaned;
}

/**
 * Clean bullet content by removing prefixes and formatting
 */
export function cleanBullet(content: string): string {
  if (!content) return '';
  
  let cleaned = content.trim();
  
  // Remove bullet markers
  cleaned = cleaned.replace(/^\s*[•\-\–\—\*]\s+/, '');
  cleaned = cleaned.replace(/^\s*\d+[\.)]\s+/, '');
  
  // Remove BULLETS: prefix
  cleaned = cleaned.replace(/^\s*(bullets?:)\s*/i, '');
  
  return cleaned.trim();
}

/**
 * Check for forbidden words in content
 */
export function hasForbiddenWords(content: string): { hasForbidden: boolean; words: string[] } {
  if (!content) return { hasForbidden: false, words: [] };
  
  const foundWords: string[] = [];
  
  // Check forbidden words
  for (const word of FORBIDDEN_WORDS) {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(content)) {
      foundWords.push(word);
    }
  }
  
  // Check forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      foundWords.push(pattern.source);
    }
  }
  
  return {
    hasForbidden: foundWords.length > 0,
    words: foundWords
  };
}

/**
 * Remove forbidden words from content
 */
export function removeForbiddenWords(content: string): string {
  if (!content) return '';
  
  let cleaned = content;
  
  // Remove forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    cleaned = cleaned.replace(pattern, '').replace(/\s{2,}/g, ' ').trim();
  }
  
  return cleaned;
}

/**
 * Validate Amazon content generation results
 */
export function validateAmazonContent(result: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check bullets
  const bullets = [
    result.gen_bullet_1,
    result.gen_bullet_2,
    result.gen_bullet_3,
    result.gen_bullet_4,
    result.gen_bullet_5
  ];
  
  const emptyBullets = bullets.filter(b => !b || b.trim() === '' || b === '—').length;
  if (emptyBullets > 0) {
    errors.push(`${emptyBullets} bullet points are empty`);
  }
  
  // Check bullet forbidden words
  bullets.forEach((bullet, index) => {
    if (bullet && bullet !== '—') {
      const forbidden = hasForbiddenWords(bullet);
      if (forbidden.hasForbidden) {
        warnings.push(`Bullet ${index + 1} contains forbidden words: ${forbidden.words.join(', ')}`);
      }
    }
  });
  
  // Check A+ Short
  const aplusShort = result.gen_aplus_short;
  if (aplusShort) {
    if (aplusShort.length > 300) {
      errors.push(`A+ Short is ${aplusShort.length} characters (max 300)`);
    }
    
    // Check for prefixes
    const hasPrefix = A_PLUS_PREFIXES.some(prefix => prefix.test(aplusShort));
    if (hasPrefix) {
      warnings.push('A+ Short contains unwanted prefixes (BULLETS:, etc.)');
    }
    
    // Check forbidden words
    const forbidden = hasForbiddenWords(aplusShort);
    if (forbidden.hasForbidden) {
      warnings.push(`A+ Short contains forbidden words: ${forbidden.words.join(', ')}`);
    }
  }
  
  // Check description
  const description = result.gen_description;
  if (description) {
    const forbidden = hasForbiddenWords(description);
    if (forbidden.hasForbidden) {
      warnings.push(`Description contains forbidden words: ${forbidden.words.join(', ')}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Post-process Amazon content to fix common issues
 */
export function postProcessAmazonContent(result: any): any {
  const processed = { ...result };
  
  // Clean bullets
  for (let i = 1; i <= 5; i++) {
    const bulletKey = `gen_bullet_${i}` as keyof typeof processed;
    if (processed[bulletKey]) {
      processed[bulletKey] = cleanBullet(String(processed[bulletKey]));
      processed[bulletKey] = removeForbiddenWords(String(processed[bulletKey]));
    }
  }
  
  // Clean A+ Short
  if (processed.gen_aplus_short) {
    processed.gen_aplus_short = cleanAplusShort(String(processed.gen_aplus_short), 300);
    processed.gen_aplus_short = removeForbiddenWords(String(processed.gen_aplus_short));
  }
  
  // Clean description
  if (processed.gen_description) {
    processed.gen_description = removeForbiddenWords(String(processed.gen_description));
  }
  
  return processed;
}
