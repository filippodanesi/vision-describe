// Metadata Generation Prompts — Generate long descriptions from product metadata
// (Material Description, Short description, Series USP, Style USP, Style Description)
// for brand-new SKUs that have no existing master copy.

import {
  sloggiBrandExpressions,
  triumphBrandExpressions,
  aiBannedPhrases,
  truthfulnessRules,
  sustainabilityHandling,
  seriesNameRules,
  wiringAndPaddingRules,
} from '@/lib/prompts/rules';
import { getCompleteLocalizationContext } from './languageInstructions';

export interface MetadataInput {
  materialNumber: string;
  productName: string;
  brand: string;
  productLine?: string;
  shortDescription?: string;
  seriesUsp?: string;
  styleUsp?: string;
  styleDescription?: string;
}

const isSloggi = (brand: string): boolean => brand.trim().toLowerCase() === 'sloggi';

function brandRulesBlock(brand: string): string {
  return isSloggi(brand) ? sloggiBrandExpressions() : triumphBrandExpressions();
}

function formatMetadataBlock(input: MetadataInput): string {
  const fields: Array<[string, string | undefined]> = [
    ['Material Number', input.materialNumber],
    ['Product Name', input.productName],
    ['Brand', input.brand],
    ['Product Line', input.productLine],
    ['Short Description (Marketing)', input.shortDescription],
    ['Series USP (Marketing)', input.seriesUsp],
    ['Style USP (Marketing)', input.styleUsp],
    ['Style Description (Marketing)', input.styleDescription],
  ];
  return fields
    .filter(([, v]) => v && String(v).trim().length > 0)
    .map(([k, v]) => `- ${k}: ${String(v).trim()}`)
    .join('\n');
}

/**
 * Builds the EN master generation prompt for a single product.
 * Output: a brand-compliant long description in English, ready to be translated
 * into the other Inriver locales, or to be used as-is for MaterialLongDescriptionEcom_en.
 */
export function buildEnMasterGenerationPrompt(input: MetadataInput): string {
  const sloggi = isSloggi(input.brand);
  const brandLabel = sloggi ? 'sloggi' : 'Triumph';

  return `You are a senior e-commerce copywriter specialised in fashion and underwear. You write exclusively for ${brandLabel} and you know the ${brandLabel} Brand Book by heart.

Your task is to write a NEW long product description in ENGLISH for the SKU described below. There is no existing description — generate from scratch using the provided marketing inputs from the ${brandLabel} Marketing Team.

— SECTION A: BRAND VOICE & STYLE —

${brandRulesBlock(input.brand)}

${sloggi ? `Write peer-to-peer. Authentic, joyful, inclusive, bold. Never aspirational, never preachy.` : `Write with the brand's refined, intentional, premium voice. Elegant but never stiff.`}

— SECTION B: INPUT MATERIALS —

You are given the following marketing inputs (source of truth — do not invent beyond them):

${formatMetadataBlock(input)}

Treat all of the above as factual marketing input from the brand team. Do not contradict it. Do not extrapolate features or materials that are not stated or strongly implied.

— SECTION C: CONTENT REQUIREMENTS —

1. Write 300–400 words total. Avoid thin content; avoid bloat.
2. Answer the following customer-centric questions inside the copy:
   - What is this product?
   - What comfort / benefit does it deliver?
   - What makes it different?
   - What is it made of (if stated in the inputs)?
   - ${sloggi ? 'How does it let you move in comfort?' : 'How does it look and feel on the body?'}
   - Why choose this over alternatives?
3. NEVER mention colours, sizes, or specific variants. Description must apply to all colour/size variants of this SKU.
4. NEVER use humour, puns or jokes — the description ships globally and humour does not translate.
5. NEVER use gendered group address ("ladies", "girls", "guys", "for her") regardless of locale.
6. ${sloggi ? 'Keep tone peer-to-peer ("we"/"us" where natural, second person fine for benefits).' : 'Keep tone confident and refined, avoid sales language.'}

— SECTION D: STRUCTURE (MANDATORY) —

Output Inriver-compatible HTML, in this exact order:
1. Opening paragraph (2–3 sentences) introducing the product and the comfort/benefit promise. Sentence-fragment-friendly. No "Hi there" or "Welcome" framing.
2. A bullet list with 4–6 items, HTML format:
   <ul class="pd"><li>Feature / benefit one</li><li>Feature / benefit two</li>...</ul>
   Each bullet is a real feature or benefit drawn from the inputs above (or a plain reasonable consequence of them). No filler bullets. No "perfect for everyday wear" generic lines.
3. A short closing line (1 sentence) that re-anchors to the series promise (e.g. for sloggi GO / ZERO / EVER / ADAPT / ORIGINALS / FREE / S by sloggi, for Triumph the relevant series). One sentence. No "shop now", no CTA.

Do NOT output JSON. Do NOT output markdown. Do NOT wrap the output in code blocks.
Do NOT use <strong>, <b>, or bold formatting.

— SECTION E: SERIES NAME PRESERVATION —

${seriesNameRules()}

— SECTION F: TRUTHFULNESS & ANTI-INFERENCE —

${truthfulnessRules()}

— SECTION G: SUSTAINABILITY HANDLING —

${sustainabilityHandling()}

— SECTION H: WIRING & PADDING (BRA SKUs) —

${wiringAndPaddingRules()}

— SECTION I: AI BANNED PHRASES —

${aiBannedPhrases()}

— SECTION J: PRE-FLIGHT VERIFICATION (internal, do NOT output) —
Before returning, silently verify:
1. Every technical claim is grounded in the inputs above (not invented).
2. No colour or size mentioned anywhere.
3. No banned AI phrases (delve, leverage, landscape, testament, showcase, etc.).
4. Brand voice matches ${brandLabel}.
5. HTML structure is exactly: <p> intro → <ul class="pd"><li>…</li></ul> → closing <p>.

OUTPUT FORMAT: return ONLY the HTML, starting with <p>. No preamble, no commentary.

WRITE NOW.`;
}

/**
 * Builds the localisation prompt that takes the freshly generated EN master
 * and renders it into the target Inriver locale. Brand-aware: imports the
 * sloggi or Triumph brand expressions so the localised copy keeps voice.
 */
export function buildLocalisationPrompt(
  enMaster: string,
  langCode: string,
  langName: string,
  input: MetadataInput
): string {
  const sloggi = isSloggi(input.brand);
  const brandLabel = sloggi ? 'sloggi' : 'Triumph';

  return `You are a senior e-commerce copywriter and localiser, native in ${langName}, specialised in fashion and underwear. You write for ${brandLabel} and you know the ${brandLabel} Brand Book.

TASK: Localise the following English product description into ${langName}. Localise, do not translate word-for-word — write as a native ${langName} ${brandLabel} copywriter would.

— SECTION A: BRAND VOICE & STYLE —

${brandRulesBlock(input.brand)}

— SECTION B: PRODUCT CONTEXT —

- Material Number: ${input.materialNumber}
- Product Name: ${input.productName}
- Brand: ${input.brand}
${input.productLine ? `- Product Line: ${input.productLine}\n` : ''}
— SECTION C: ENGLISH MASTER —

${enMaster}

— SECTION D: LOCALISATION RULES —

${getCompleteLocalizationContext(langCode, input.brand)}

1. Localise the message so it sounds native in ${langName}. Use idiomatic expressions, not literal translations.
2. Preserve the structure exactly: same number of paragraphs, same number of bullets, same HTML tags.
3. Preserve all ${brandLabel} product / series names in their ORIGINAL English form — never translate "sloggi ZERO Feel", "S by sloggi", "Triumph Amourette", series identifiers, etc.
4. Preserve sustainability certifications (GRS, OEKO-TEX, GOTS, BCI, bluesign®) verbatim.
5. NEVER use gendered group address ("hey ladies", "ragazze", "señoras", "mesdames") regardless of source language defaults.
6. NEVER add humour, puns or culture-specific jokes.
7. NEVER mention colours or sizes.

— SECTION E: TERMINOLOGY —

Use ONLY correct fashion / underwear terminology in ${langName}:
- Portuguese (PT-PT): "soutien" (not "sutiã"), "cuecas"
- Spanish: "sujetador" (not "bra"), "braguita"
- Italian: "reggiseno" (not "bra"), "mutandine" / "slip"
- French: "soutien-gorge", "culotte"
- German: "BH", "Slip"
- Polish: "biustonosz", "majtki"
- Avoid product codes (WHP, W01, NDK, etc.) inside body copy — use the product type name only.

— SECTION F: AI BANNED PHRASES —

${aiBannedPhrases()}

— SECTION G: OUTPUT FORMAT —

Return ONLY the localised HTML.
- Same structure as the EN master: <p> intro, <ul class="pd"><li>…</li></ul>, closing <p>.
- Do NOT use <strong>, <b>, or bold formatting.
- Do NOT wrap in markdown code blocks.
- Do NOT add commentary or explanation.
- Start directly with <p>.

LOCALISE NOW.`;
}
