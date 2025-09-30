/**
 * Language-Specific Localization Instructions
 * 
 * @author Filippo Danesi
 * @created 2025-09-30
 * @description Provides language-specific instructions for AI models
 *              to ensure proper localization (not just translation)
 * 
 * Purpose:
 * - Fix PT-BR vs PT-PT confusion
 * - Improve translation quality (avoid literal 1:1 translations)
 * - Maintain brand tone of voice across languages
 */

export interface LanguageInstruction {
  code: string;
  name: string;
  instructions: string;
  vocabulary?: Record<string, string>; // EN term -> Localized term
  brandTone: string;
}

/**
 * Language-specific instructions for AI localization
 */
export const LANGUAGE_INSTRUCTIONS: Record<string, LanguageInstruction> = {
  'en': {
    code: 'en',
    name: 'English',
    instructions: 'Write in natural, fluent English.',
    brandTone: 'Sophisticated, empowering, quality-focused'
  },
  
  'pt-PT': {
    code: 'pt-PT',
    name: 'European Portuguese (Portugal)',
    instructions: `
CRITICAL: Write in EUROPEAN PORTUGUESE (Portugal), NOT Brazilian Portuguese.
- Use Portuguese vocabulary: "telemóvel" (not "celular"), "autocarro" (not "ônibus")
- Use "tu" form, not "você"
- European Portuguese spelling and grammar
- Natural Portuguese sentence structure (not translated from English)
- Maintain sophisticated, premium tone appropriate for European market
    `.trim(),
    vocabulary: {
      'mobile phone': 'telemóvel',
      'bus': 'autocarro',
      'shirt': 'camisola',
      'comfortable': 'confortável',
      'padding': 'acolchoamento',
      'support': 'suporte',
      'adjustable': 'ajustável'
    },
    brandTone: 'Sofisticado, elegante, de qualidade premium'
  },
  
  'pt-BR': {
    code: 'pt-BR',
    name: 'Brazilian Portuguese (Brazil)',
    instructions: `
Write in BRAZILIAN PORTUGUESE (Brazil).
- Use Brazilian vocabulary: "celular", "ônibus", "camisa"
- Brazilian Portuguese spelling and expressions
- Natural Brazilian sentence structure
- Warm, accessible tone appropriate for Brazilian market
    `.trim(),
    vocabulary: {
      'mobile phone': 'celular',
      'bus': 'ônibus',
      'shirt': 'camisa',
      'comfortable': 'confortável',
      'padding': 'enchimento',
      'support': 'suporte'
    },
    brandTone: 'Acessível, confortável, confiável'
  },
  
  'es': {
    code: 'es',
    name: 'Spanish (Español)',
    instructions: `
Write in natural, fluent SPANISH.
- DO NOT translate word-for-word from English
- Use Spanish idiomatic expressions and sentence structure
- Example: "features" → "ofrece" or "cuenta con" (context-dependent), not always "presenta"
- Example: "supportive padding" → "acolchado que proporciona soporte" not "relleno de soporte"
- Natural Spanish flow, not English structure translated
- Maintain sophisticated tone with Spanish elegance
    `.trim(),
    vocabulary: {
      'features': 'ofrece / cuenta con',
      'supportive': 'que proporciona soporte',
      'comfortable': 'cómodo',
      'adjustable': 'ajustable'
    },
    brandTone: 'Sofisticado, elegante, empoderador'
  },
  
  'de': {
    code: 'de',
    name: 'German (Deutsch)',
    instructions: `
Write in natural, fluent GERMAN.
- Use German sentence structure (verb positioning)
- Use compound words where appropriate (German style)
- Use "Sie" form for formal addressing
- Natural German expressions, not English translated literally
- Maintain quality-focused, precise German tone
    `.trim(),
    vocabulary: {
      'comfortable': 'bequem',
      'support': 'Halt / Unterstützung',
      'adjustable': 'verstellbar',
      'padding': 'Polsterung'
    },
    brandTone: 'Präzise, qualitätsbewusst, elegant'
  },
  
  'fr': {
    code: 'fr',
    name: 'French (Français)',
    instructions: `
Write in natural, fluent FRENCH.
- Use French sentence structure and flow
- French elegance in expression
- Natural French idioms, not English translated
- Maintain sophisticated French tone
- Use "vous" form for formal addressing
    `.trim(),
    vocabulary: {
      'comfortable': 'confortable',
      'support': 'soutien',
      'adjustable': 'ajustable',
      'features': 'offre / présente'
    },
    brandTone: 'Élégant, sophistiqué, raffiné'
  },
  
  'it': {
    code: 'it',
    name: 'Italian (Italiano)',
    instructions: `
Write in natural, fluent ITALIAN.
- Use Italian sentence structure and expressiveness
- Italian natural flow, not English structure
- Maintain elegant, quality-focused Italian tone
- Use formal addressing where appropriate
    `.trim(),
    vocabulary: {
      'comfortable': 'comodo',
      'support': 'supporto',
      'adjustable': 'regolabile',
      'features': 'offre / presenta'
    },
    brandTone: 'Elegante, sofisticato, di qualità'
  }
};

/**
 * Get detailed localization instructions for a given language code
 */
export const getLanguageInstructions = (langCode: string): string => {
  const lang = LANGUAGE_INSTRUCTIONS[langCode];
  
  if (!lang) {
    return `Write in ${langCode.toUpperCase()} with natural, fluent expression.`;
  }
  
  return `
TARGET LANGUAGE: ${lang.name}

LOCALIZATION INSTRUCTIONS:
${lang.instructions}

BRAND TONE for ${lang.name}:
${lang.brandTone}

CRITICAL RULES:
- DO NOT translate literally word-for-word from English
- ADAPT the message to sound natural and native in ${lang.name}
- THINK: "How would a native ${lang.name} copywriter write this?"
- Use idiomatic expressions native to ${lang.name}
- Maintain brand's sophisticated, quality-focused tone
  `.trim();
};

/**
 * Get concise language instruction for short prompts
 */
export const getShortLanguageInstruction = (langCode: string): string => {
  const lang = LANGUAGE_INSTRUCTIONS[langCode];
  if (!lang) return langCode.toUpperCase();
  
  return `${lang.name} (natural, not literal translation)`;
};

/**
 * Brand-specific tone of voice guidelines
 */
export const BRAND_TOV = {
  triumph: {
    tone: 'Sophisticated, empowering, confident',
    keywords: ['elegance', 'quality', 'innovation', 'perfect fit', 'feminine power'],
    style: 'Premium but accessible, inspirational',
    avoid: ['too casual', 'overly technical', 'cold/clinical']
  },
  
  sloggi: {
    tone: 'Comfortable, easy-going, reliable',
    keywords: ['comfort', 'everyday', 'simple', 'practical', 'feel-good'],
    style: 'Friendly, approachable, unpretentious',
    avoid: ['too formal', 'complicated', 'fashion-focused']
  }
};

export default {
  LANGUAGE_INSTRUCTIONS,
  getLanguageInstructions,
  getShortLanguageInstruction,
  BRAND_TOV
};
