import { getLanguageInstructions, getShortLanguageInstruction } from './languageInstructions';

export interface AmazonPromptCtx {
  title?: string;
  brand?: string;
  description?: string;
  bullets?: string[];
  attributes?: Record<string, string | number | boolean>;
  materials?: string[];
  care?: string;
  color?: string;
  size?: string;
  language?: string;            // e.g., "de", "en", "it", "pt-PT", "pt-BR"
  primaryKeyword?: string;
  secondaryKeywords?: string[];
}

const safe = (v?: string) => (v ?? '').trim();

export const buildBulletsPrompt = (ctx: AmazonPromptCtx) => {
  const lang = safe(ctx.language) || 'en';
  const pkw  = safe(ctx.primaryKeyword);
  const skw  = (ctx.secondaryKeywords || []).filter(Boolean).join(', ');
  const existingBullets = (ctx.bullets || []).filter(Boolean).join(' | ');

  return `
TASK: Write EXACTLY 5 bullets for an Amazon PDP.

LOCALIZATION: If the input content is in a different language, LOCALIZE (not just translate) to ${getShortLanguageInstruction(lang)}.
${getLanguageInstructions(lang)}

CONTEXT:
- Title: ${safe(ctx.title)}
- Brand: ${safe(ctx.brand)}
- Existing description (may be empty): ${safe(ctx.description)}
- Existing bullets (may be empty): ${existingBullets}
- Attributes: ${JSON.stringify(ctx.attributes || {})}
- Materials: ${(ctx.materials || []).join(', ')}
- Care: ${safe(ctx.care)}
- Color: ${safe(ctx.color)}  Size: ${safe(ctx.size)}

SEO:
- Primary keyword: ${pkw || '(none)'}
- Secondary keywords: ${skw || '(none)'}
- Use the primary keyword ONCE in the FIRST bullet (if provided). Use secondary keywords at most once.

FORMAT:
- Output ONLY 5 lines. No numbering, no symbols, no labels.
- Sound natural and native in the target language.
`;
};

export const buildDescriptionPrompt = (ctx: AmazonPromptCtx) => {
  const lang = safe(ctx.language) || 'en';
  const pkw  = safe(ctx.primaryKeyword);
  const skw  = (ctx.secondaryKeywords || []).filter(Boolean).join(', ');
  const existingBullets = (ctx.bullets || []).filter(Boolean).join(' | ');

  return `
TASK: Write ONE paragraph (3–6 sentences) Amazon PDP long description.

LOCALIZATION: If the input content is in a different language, LOCALIZE (not just translate) to ${getShortLanguageInstruction(lang)}.
${getLanguageInstructions(lang)}

CONTEXT:
- Title: ${safe(ctx.title)}
- Brand: ${safe(ctx.brand)}
- Existing description (may be empty): ${safe(ctx.description)}
- Bullets (may be empty): ${existingBullets}
- Attributes: ${JSON.stringify(ctx.attributes || {})}
- Materials: ${(ctx.materials || []).join(', ')}
- Care: ${safe(ctx.care)}
- Color: ${safe(ctx.color)}  Size: ${safe(ctx.size)}

SEO:
- Primary keyword: ${pkw || '(none)'} → Use it ONCE in the FIRST sentence.
- Secondary keywords: ${skw || '(none)'} → At most once overall.

FORMAT:
- Output ONLY the paragraph. No labels, no headings, no bullets, no HTML/markdown.
- Sound natural and native in the target language.
`;
};

export const buildAplusPrompt = (ctx: AmazonPromptCtx & { sourceDescription?: string }) => {
  const lang = safe(ctx.language) || 'en';
  const pkw  = safe(ctx.primaryKeyword);

  return `
TASK: Write ONE sentence (<= 300 chars) for Amazon A+ content (between two images).

LOCALIZATION: If the source content is in a different language, LOCALIZE (not just translate) to ${getShortLanguageInstruction(lang)}.
${getLanguageInstructions(lang)}

SOURCE:
- Use this description as source: ${safe(ctx.sourceDescription) || safe(ctx.description)}

SEO:
- Include the primary keyword ONCE if provided: ${pkw || '(none)'}.

FORMAT:
- Output ONLY the sentence. No labels, no headings, no line breaks.
- Strictly <= 300 characters.
- Sound natural and native in the target language.
`;
};


