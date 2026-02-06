/**
 * Language-Specific Localization Instructions
 *
 * This module provides detailed localization guidelines for each supported language,
 * including vocabulary mappings, tone of voice rules, and cultural adaptation notes.
 *
 * Ported from vision-describe/server/services/prompts/languageInstructions.ts
 */

// Portuguese Vocabulary Mapping (PT-PT vs PT-BR)
export const PORTUGUESE_VOCABULARY = {
  'pt': {
    mobile: 'telemóvel',
    padding: 'acolchoamento',
    bra: 'soutien',
    bus: 'autocarro',
    train: 'comboio',
    underwear: 'roupa interior',
    panties: 'cuecas',
    computer: 'computador',
    screenshot: 'captura de ecrã',
    app: 'aplicação',
    email: 'correio eletrónico',
    sleepwear: 'roupa de dormir',
    nightshirt: 'camisa de dormir',
    shorts: 'calções',
    robe: 'roupão',
    tankTop: 'top de alças',
    relaxedTankTop: 'top de alças com corte descontraído',
    fullLength: 'comprido',
    cottonJersey: 'malha de algodão',
    delicateEdges: 'rebordos delicados',
    softLining: 'forro suave',
    unpadded: 'não almofadado',
    fullyLinedCups: 'copas totalmente forradas',
    cup: 'copa',
  },
  'pt-PT': {
    mobile: 'telemóvel',
    padding: 'acolchoamento',
    bra: 'soutien',
    bus: 'autocarro',
    train: 'comboio',
    underwear: 'roupa interior',
    panties: 'cuecas',
    computer: 'computador',
    screenshot: 'captura de ecrã',
    app: 'aplicação',
    email: 'correio eletrónico',
    sleepwear: 'roupa de dormir',
    nightshirt: 'camisa de dormir',
    shorts: 'calções',
    robe: 'roupão',
    tankTop: 'top de alças',
    relaxedTankTop: 'top de alças com corte descontraído',
    fullLength: 'comprido',
    cottonJersey: 'malha de algodão',
    delicateEdges: 'rebordos delicados',
    softLining: 'forro suave',
    unpadded: 'não almofadado',
    fullyLinedCups: 'copas totalmente forradas',
    cup: 'copa',
  },
  'pt-BR': {
    mobile: 'celular',
    padding: 'enchimento',
    bra: 'sutiã',
    bus: 'ônibus',
    train: 'trem',
    underwear: 'roupa íntima',
    panties: 'calcinha',
    computer: 'computador',
    screenshot: 'captura de tela',
    app: 'aplicativo',
    email: 'e-mail',
  },
};

// Language-Specific Localization Guidelines
export const LOCALIZATION_GUIDELINES: Record<string, {
  name: string;
  instructions: string;
  examples: { wrong: string; right: string };
}> = {
  'pt': {
    name: 'Portuguese - Portugal',
    instructions: `
LOCALIZATION RULES FOR PORTUGUESE (PORTUGAL):
- Use European Portuguese vocabulary (NOT Brazilian)
- Use "telemóvel" NEVER "celular"
- Use "acolchoamento" NEVER "enchimento"
- Use "soutien" NEVER "sutiã"
- Use "autocarro" NEVER "ônibus"
- Use formal "você" or "tu" forms appropriately
- Avoid Brazilian colloquialisms
- Maintain sophisticated, premium tone
- Use Portuguese-specific expressions

SLEEPWEAR & LINGERIE SPECIFIC TERMS:
- "sleepwear" → "roupa de dormir" (NOT "Roupa de dormir")
- "night shirt" → "camisa de dormir" (NOT "camisa de noite")
- "shorts" → "calções" (NOT "shorts")
- "robe" → "roupão"
- "tank top" → "top de alças"
- "relaxed tank top" → "top de alças com corte descontraído"
- "sleeveless top" → "top" (in PT, "top" already implies sleeveless)
- "full-length" → "comprido" or "comprida" (NOT "comprimento total")
- "cotton jersey" → "malha de algodão" (NOT "jersey de algodão")
- "delicate edges" → "rebordos delicados" (NOT "bordas delicadas")
- "soft lining that contacts skin" → "forro suave" (NOT "Forro suave ao contacto com a pele")
- "unpadded bra" → "soutien não almofadado"
- "fully lined cups" → "copas totalmente forradas"
- "cup line" → "borda interior da copa" (NOT "copo")

SERIES NAME RULES:
- Remove "O-" prefix from series names (e.g., "O - Light Paonette" → "Light Paonette")
- For series ending in "T" (e.g., "Ladyform Soft T"), use without the T (e.g., "Ladyform Soft")
- ALWAYS specify "a série [name]" rather than just the name (e.g., "a série Nightdresses" NOT "O-Nightdresses collection")
`,
    examples: {
      wrong: 'Este sutiã tem enchimento e é perfeito para usar com seu celular.',
      right: 'Este soutien tem acolchoamento e é perfeito para usar com o seu telemóvel.',
    },
  },
  'pt-PT': {
    name: 'Portuguese - Portugal',
    instructions: `
LOCALIZATION RULES FOR PORTUGUESE (PORTUGAL):
- Use European Portuguese vocabulary (NOT Brazilian)
- Use "telemóvel" NEVER "celular"
- Use "acolchoamento" NEVER "enchimento"
- Use "soutien" NEVER "sutiã"
- Use "autocarro" NEVER "ônibus"
- Use formal "você" or "tu" forms appropriately
- Avoid Brazilian colloquialisms
- Maintain sophisticated, premium tone
- Use Portuguese-specific expressions

SLEEPWEAR & LINGERIE SPECIFIC TERMS:
- "sleepwear" → "roupa de dormir" (NOT "Roupa de dormir")
- "night shirt" → "camisa de dormir" (NOT "camisa de noite")
- "shorts" → "calções" (NOT "shorts")
- "robe" → "roupão"
- "tank top" → "top de alças"
- "relaxed tank top" → "top de alças com corte descontraído"
- "sleeveless top" → "top" (in PT, "top" already implies sleeveless)
- "full-length" → "comprido" or "comprida" (NOT "comprimento total")
- "cotton jersey" → "malha de algodão" (NOT "jersey de algodão")
- "delicate edges" → "rebordos delicados" (NOT "bordas delicadas")
- "soft lining that contacts skin" → "forro suave" (NOT "Forro suave ao contacto com a pele")
- "unpadded bra" → "soutien não almofadado"
- "fully lined cups" → "copas totalmente forradas"
- "cup line" → "borda interior da copa" (NOT "copo")
- "from city streets to seaside moments" → "das ruas da cidade aos momentos à beira-mar"
- "as an elegant layering piece" → "como uma peça elegante para conjugar em camadas"

SERIES NAME RULES:
- Remove "O-" prefix from series names (e.g., "O - Light Paonette" → "Light Paonette")
- For series ending in "T" (e.g., "Ladyform Soft T"), use without the T (e.g., "Ladyform Soft")
- ALWAYS specify "a série [name]" rather than just the name
- Format: "a série [SeriesName]" for Portuguese (Portugal)
`,
    examples: {
      wrong: 'Este sutiã tem enchimento e é perfeito para usar com seu celular.',
      right: 'Este soutien tem acolchoamento e é perfeito para usar com o seu telemóvel.',
    },
  },
  'pt-BR': {
    name: 'Portuguese - Brazil',
    instructions: `
LOCALIZATION RULES FOR PORTUGUESE (BRAZIL):
- Use Brazilian Portuguese vocabulary (NOT European)
- Use "celular" NEVER "telemóvel"
- Use "enchimento" for padding/filling
- Use "sutiã" NEVER "soutien"
- Use "ônibus" NEVER "autocarro"
- Use Brazilian colloquialisms naturally
- Maintain warm, accessible tone
- Use Brazilian-specific expressions
`,
    examples: {
      wrong: 'Este soutien tem acolchoamento e é perfeito para o telemóvel.',
      right: 'Este sutiã tem enchimento e é perfeito para usar com o celular.',
    },
  },
  'es': {
    name: 'Spanish - Spain',
    instructions: `
LOCALIZATION RULES FOR SPANISH:
- AVOID literal word-for-word translation from English
- Use natural Spanish sentence structure
- Use idiomatic expressions, NOT English calques
- Maintain sophisticated, premium tone
- Use "vosotros" forms for Spain (NOT "ustedes" exclusively)
- Adapt metaphors and cultural references
- Think: "How would a Spanish copywriter write this?"
`,
    examples: {
      wrong: 'Este producto es muy cómodo y tiene mucho soporte.',
      right: 'Esta prenda destaca por su comodidad excepcional y sujeción óptima.',
    },
  },
  'de': {
    name: 'German - Germany',
    instructions: `
LOCALIZATION RULES FOR GERMAN:
- Use formal "Sie" unless context requires "du"
- Maintain German sentence structure (verb positioning)
- Use compound nouns naturally
- Avoid anglicisms where German equivalents exist
- Maintain premium, quality-focused tone
- Use German-specific idioms
`,
    examples: {
      wrong: 'Dieses Produkt ist comfortable und hat guten Support.',
      right: 'Dieses Produkt überzeugt durch außergewöhnlichen Tragekomfort und optimalen Halt.',
    },
  },
  'fr': {
    name: 'French - France',
    instructions: `
LOCALIZATION RULES FOR FRENCH:
- Use formal "vous" unless context requires "tu"
- Maintain French syntax and sentence flow
- Use French idioms, NOT English translations
- Avoid anglicisms (use French equivalents)
- Maintain elegant, sophisticated tone
- Use gender-appropriate agreements
`,
    examples: {
      wrong: 'Ce produit est très comfortable et supporte bien.',
      right: 'Ce produit se distingue par son confort exceptionnel et son maintien optimal.',
    },
  },
  'it': {
    name: 'Italian - Italy',
    instructions: `
LOCALIZATION RULES FOR ITALIAN:
- Use formal "Lei" or informal "tu" as appropriate
- Maintain Italian sentence structure
- Use Italian idioms naturally
- Avoid anglicisms where Italian exists
- Maintain warm, elegant tone
- Use appropriate gender agreements
`,
    examples: {
      wrong: 'Questo prodotto è molto comfortable e ha buon supporto.',
      right: 'Questo prodotto si distingue per il comfort eccezionale e il sostegno ottimale.',
    },
  },
};

// Brand Tone of Voice Guidelines
export const BRAND_TOV_GUIDELINES: Record<string, {
  name: string;
  tone: string;
  rules: string[];
  avoid: string[];
}> = {
  triumph: {
    name: 'Triumph',
    tone: 'Premium, sophisticated, confident, empowering',
    rules: [
      'Use sophisticated vocabulary',
      'Emphasize quality and craftsmanship',
      'Highlight innovation and technology',
      'Maintain aspirational yet accessible tone',
      'Focus on empowerment and confidence',
      'FORMAL TONE REQUIRED: For Portuguese (PT/PT-PT), always use formal "você" form (never informal "tu")',
      'FORMAL TONE REQUIRED: For French (FR), always use formal "vous" form (never informal "tu")',
    ],
    avoid: [
      'Overly casual language',
      'Technical jargon without explanation',
      'Generic product descriptions',
      'Cheap or discount-focused messaging',
      'Informal address (tu/toi in FR, tu in PT) - use formal forms only',
    ],
  },
  sloggi: {
    name: 'sloggi',
    tone: 'Comfortable, approachable, everyday, practical',
    rules: [
      'Use simple, clear language',
      'Emphasize comfort and practicality',
      'Highlight everyday wearability',
      'Maintain friendly, accessible tone',
      'Focus on ease and convenience',
    ],
    avoid: [
      'Overly technical terminology',
      'Pretentious language',
      'Complex sentence structures',
      'Luxury-focused messaging',
    ],
  },
  beldona: {
    name: 'Beldona',
    tone: 'Swiss quality, reliable, trustworthy, accessible',
    rules: [
      'Emphasize Swiss quality standards',
      'Highlight reliability and durability',
      'Use clear, straightforward language',
      'Maintain trustworthy, professional tone',
      'Focus on value and quality',
    ],
    avoid: [
      'Overly promotional language',
      'Unsubstantiated claims',
      'Casual or slang expressions',
      'Overly complex descriptions',
    ],
  },
};

export function getLanguageInstructions(languageCode: string): string {
  const guidelines = LOCALIZATION_GUIDELINES[languageCode];

  if (!guidelines) {
    return `
GENERAL LOCALIZATION RULES:
- DO NOT translate word-for-word from English
- LOCALIZE (adapt) the message to sound natural
- Use idiomatic expressions native to the target language
- Maintain brand's sophisticated tone
- Think: "How would a native copywriter write this?"
`;
  }

  return guidelines.instructions;
}

export function getBrandTOVGuidelines(brand: string): string {
  let brandLower = brand.toLowerCase();

  const brandMapping: Record<string, string> = {
    'ti': 'triumph',
    'sg': 'sloggi',
    'bd': 'beldona',
  };

  if (brandMapping[brandLower]) {
    brandLower = brandMapping[brandLower];
  }

  const tov = BRAND_TOV_GUIDELINES[brandLower];

  if (!tov) {
    return `
BRAND TONE: Professional, quality-focused, customer-centric
- Maintain premium quality positioning
- Use clear, sophisticated language
- Focus on product benefits and features
- Maintain consistent brand voice
`;
  }

  return `
BRAND: ${tov.name}
TONE: ${tov.tone}

DO:
${tov.rules.map(rule => `- ${rule}`).join('\n')}

AVOID:
${tov.avoid.map(rule => `- ${rule}`).join('\n')}
`;
}

export function getPortugueseVocabularyNotes(variant: 'pt' | 'pt-PT' | 'pt-BR'): string {
  const normalizedVariant = variant === 'pt' ? 'pt-PT' : variant;
  const vocab = PORTUGUESE_VOCABULARY[normalizedVariant] as Record<string, string>;
  const otherVariant = normalizedVariant === 'pt-PT' ? 'pt-BR' : 'pt-PT';
  const otherVocab = PORTUGUESE_VOCABULARY[otherVariant] as Record<string, string>;

  return `
CRITICAL VOCABULARY FOR ${normalizedVariant}:
${Object.entries(vocab).map(([key, value]) =>
  `- Use "${value}" NOT "${otherVocab[key] || value}"`
).join('\n')}
`;
}

export function getCompleteLocalizationContext(
  languageCode: string,
  brand?: string
): string {
  let context = getLanguageInstructions(languageCode);

  if (languageCode === 'pt' || languageCode === 'pt-PT' || languageCode === 'pt-BR') {
    context += '\n' + getPortugueseVocabularyNotes(languageCode as 'pt' | 'pt-PT' | 'pt-BR');
  }

  if (brand) {
    context += '\n' + getBrandTOVGuidelines(brand);
  }

  return context;
}

// Language mapping for consistency across all services
export const LANGUAGE_MAPPING = {
  'cs': 'Czech (Česká republika)',
  'da': 'Danish (Danmark)',
  'nl': 'Dutch (Nederland)',
  'en': 'English',
  'fr': 'French (France)',
  'de': 'German (Deutschland)',
  'hu': 'Hungarian (Magyarország)',
  'it': 'Italian (Italia)',
  'pl': 'Polish (Polska)',
  'pt': 'Portuguese - Portugal',
  'pt-PT': 'Portuguese - Portugal',
  'pt-BR': 'Portuguese - Brazil',
  'es': 'Spanish (España)',
  'sv': 'Swedish (Sverige)',
} as const;

export type SupportedLanguage = keyof typeof LANGUAGE_MAPPING;
