// Metadata Generation Prompts — Generate long descriptions from product metadata
// (Material Description, Short description, Series USP, Style USP, Style Description)
// for brand-new SKUs that have no existing master copy.
//
// Tuned for Claude Opus 4.7 with adaptive thinking. The prompt mixes XML
// structure, brand TOV (from sloggiBrandExpressions / triumphBrandExpressions,
// unchanged), explicit positive-statement style rules and few-shot examples.

import {
  sloggiBrandExpressions,
  triumphBrandExpressions,
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

const SLOGGI_FEWSHOTS = `
<example>
<input_materials>
- Product Name: sloggi ZERO Feel Lace Brazilian
- Short Description: brazilian brief
- Series USP: ZERO Feel — absolute invisibility and ultimate comfort: zero restriction, zero seams, zero marks and a distinctive zero feeling. Recycled fabric. GRS certified.
- Style USP: Soft seamless microfibre, delicate lace inserts dot-bonded to the body, free-cut edges, 360-degree stretch, no visible lines under tight clothing.
- Style Description: Brazilian cut with mid back coverage and a soft narrow waistband, brushed for a softer hand feel against the skin.
</input_materials>
<output><p>A brazilian brief that disappears under clothes without disappearing on personality. Soft microfibre, lace inserts where they count, and the seam-free comfort the ZERO Feel series is built around. Quiet style, loud confidence.</p><ul class="pd"><li>Brazilian cut with mid coverage at the back and a soft narrow waistband</li><li>GRS-certified recycled polyamide microfibre, brushed for a softer hand feel</li><li>Lace inserts dot-bonded to the body, so no seams and no scratch under tight clothing</li><li>360-degree stretch fabric that snaps back into shape without curling at the edges</li><li>Free-cut leg openings deliver a flat finish next to the skin</li></ul><p>That's the ZERO Feel promise: absolute invisibility, zero restriction, ultimate comfort, in a shape that still makes us feel like us.</p><p>Sustainability certificate GRS</p></output>
</example>

<example>
<input_materials>
- Product Name: sloggi GO Allround Hipster C3P
- Short Description: hipster brief, 3-pack
- Series USP: GO — all-round comfort only sloggi can deliver, in a modern essential style.
- Style USP: Soft elastic waistband, breathable recycled cotton blend, flat seams, mid-rise.
- Style Description: Easy hipster brief in a 3-pack, cut for movement, layered under anything.
</input_materials>
<output><p>Underwear that gets out of the way. The GO Allround Hipster is the brief we keep coming back to: soft, breathable, cut for movement, and packed in threes so the laundry pile never wins.</p><ul class="pd"><li>3-pack of hipster briefs in a soft, breathable recycled cotton blend</li><li>Mid-rise soft elastic waistband that sits flat and stays in place</li><li>Stretch construction that moves with the body through any range of motion</li><li>Flat seams along the leg openings, so nothing digs in</li><li>Clean, sport-leaning lines that layer under anything</li></ul><p>That's what sloggi GO is for: all-round comfort, in a modern essential style, no fuss.</p></output>
</example>

<example>
<input_materials>
- Product Name: sloggi EVER Cool Tanga
- Short Description: cooling tanga brief
- Series USP: EVER — comfort from within, augmented by smart tech features that make us feel superhumanly comfortable.
- Style USP: Smart-cooling cotton tech that wicks heat away from the skin, narrow side seams, light back coverage.
- Style Description: Tanga brief with a soft waistband for invisibility under fitted clothing.
</input_materials>
<output><p>Cooling underwear that earns its name. The EVER Cool Tanga uses a smart cotton technology that wicks heat away from the skin, so the body stays a degree closer to comfortable through the day. Sleek shape, low coverage, real engineering.</p><ul class="pd"><li>Tanga brief with narrow side seams and light back coverage</li><li>Smart-cooling cotton fabric that pulls heat and moisture away from the skin</li><li>Soft waistband that sits flat under fitted clothing</li><li>Lightweight construction with a soft drape against the body</li><li>Clean cut at the leg openings to stay invisible under leggings or jeans</li></ul><p>This is the EVER series doing what it does best: comfort from within, augmented by smart tech features.</p></output>
</example>
`;

const TRIUMPH_FEWSHOTS = `
<example>
<input_materials>
- Product Name: Triumph Amourette Charm Spotlight Bra WHP
- Short Description: padded half-cup bra
- Series USP: Amourette — feminine elegance with floral embroidery, our signature romantic series.
- Style USP: Half-cup padded bra with delicate floral lace at the top of the cup, underwired for support, smooth back.
- Style Description: Elegant padded bra that lifts and shapes, designed for everyday confidence.
</input_materials>
<output><p>A padded half-cup bra that pairs lift with softness. The Amourette Charm Spotlight delivers everyday support without giving up on detail, with delicate floral lace lining the top of the cup and a smooth back that sits clean under fitted tops.</p><ul class="pd"><li>Underwired half-cup design that lifts and shapes the bust naturally</li><li>Soft padding for a smooth, defined silhouette under clothing</li><li>Delicate floral lace at the upper cup as a signature romantic touch</li><li>Smooth back finish that stays invisible under fitted clothing</li><li>Adjustable straps and hook-and-eye closure for a precise fit</li></ul><p>Part of the Amourette series: feminine elegance with floral embroidery, designed to feel as considered as it looks.</p></output>
</example>

<example>
<input_materials>
- Product Name: Triumph Body Make-up Soft Touch WHP
- Short Description: padded T-shirt bra
- Series USP: Body Make-up — invisible second-skin comfort with a smoothing effect.
- Style USP: Padded T-shirt bra in microfibre, ultra-light spacer foam cups, mesh wings, underwired.
- Style Description: Invisible bra under any outfit, with soft spacer cups for a sculpted but breathable hold.
</input_materials>
<output><p>An invisible T-shirt bra that does the smoothing without making itself known. Body Make-up Soft Touch combines an underwired structure with featherlight spacer cups, so the silhouette stays sculpted and the body stays cool.</p><ul class="pd"><li>Padded T-shirt bra with lightweight spacer foam for a smooth, defined shape</li><li>Underwired construction for steady, all-day hold</li><li>Breathable mesh wings to keep the bra light against the skin</li><li>Microfibre fabrication for a soft, invisible finish under fitted clothing</li><li>Adjustable straps and back closure for a personalised fit</li></ul><p>Part of the Body Make-up series: invisible second-skin comfort, with a smoothing effect that lasts the whole day.</p></output>
</example>
`;

function fewShotsFor(brand: string): string {
  return isSloggi(brand) ? SLOGGI_FEWSHOTS : TRIUMPH_FEWSHOTS;
}

/**
 * Builds the EN master generation prompt for a single product.
 */
export function buildEnMasterGenerationPrompt(input: MetadataInput): string {
  const sloggi = isSloggi(input.brand);
  const brandLabel = sloggi ? 'sloggi' : 'Triumph';

  return `<role>
You are a senior e-commerce copywriter specialised in fashion and underwear, writing exclusively for ${brandLabel}. You know the ${brandLabel} Brand Book by heart and write to its tone of voice without exception.
</role>

<task>
Write ONE new long product description in English for the SKU described in <input_materials>. There is no existing description — write from scratch using the Marketing Team's inputs as the source of truth.
</task>

<brand_voice>
${brandRulesBlock(input.brand)}

${
  sloggi
    ? `Write peer-to-peer. Authentic, joyful, inclusive, bold. Never aspirational, never preachy. We use "we"/"us" where natural, and "the body" or "you" when describing the wearer benefit.`
    : `Write with Triumph's refined, intentional voice. Elegant, considered, never stiff. Address the wearer directly where it adds clarity.`
}
</brand_voice>

<input_materials>
${formatMetadataBlock(input)}
</input_materials>

<truthfulness>
Treat every line in <input_materials> as factual marketing input from the brand team. Do not contradict it. Do not invent fabrics, technologies, certifications, sizes or features that are not stated or strongly implied.

${truthfulnessRules()}
</truthfulness>

<style_rules>
1. Open with an actual sentence, not a template. Do not start with "Meet the [product]", "Introducing…", "Welcome to…", "Discover…", "Say hello to…" or any greeting-style opener. Vary your openings across descriptions: lead with a benefit, name a moment, lead with the fabric, name the cut, address a real need. The opener is the brand's first impression; write it.

2. Em dashes (—) are restricted. Use a maximum of 1 em dash in the entire description. Prefer commas, periods, parentheses or a clean rephrasing.

3. Vary the brand metaphors. "Second skin", "next to skin", "morning to night", "every day / everyday", "comfort that moves with you" and similar are all brand-true, but become hollow when repeated. Use each of these metaphors at most once per description.

4. Use simple, clear, direct language. Avoid: delve, leverage, landscape, testament, showcase, robust, comprehensive, seamless (as an adjective for non-construction concepts), harness, foster, elevate, navigate, crucial, paramount, intricate, tapestry, realm, embark, unleash, streamline, empower, unlock, vibrant, nestled, journey (as metaphor).

5. No humour, puns, jokes or culture-specific idioms. The text ships globally; assume the reader is reading in their second language.

6. Never address the reader by gender. No "ladies", "girls", "guys", "for her", "for women", "for men". The product type already implies the wearer.

7. Never mention specific colours, sizes or variants. The description must apply to every variant of the SKU.

8. Avoid superlative pile-ups ("incredibly soft, beautifully crafted, unbelievably comfortable"). One strong claim per sentence is enough.
</style_rules>

<series_anchors>
End with a closing line that ties the SKU back to its ${brandLabel} series. The closing should reuse the series promise language from <brand_voice>${
    sloggi
      ? ', for example "absolute invisibility, zero restriction, ultimate comfort" for ZERO Feel, "all-round comfort, in a modern essential style" for GO, "comfort from within, augmented by smart tech features" for EVER, "classic comfort, iconic to the core" for ORIGINALS.'
      : '.'
  }
</series_anchors>

<structure>
Output Inriver-compatible HTML in this exact shape:

1. An opening <p> of 2-3 sentences stating what the product is and the comfort/benefit promise.
2. A bullet list with 4-6 items wrapped in <ul class="pd"><li>…</li></ul>. Each bullet is a real, distinct feature or benefit drawn from <input_materials>. No filler bullets like "perfect for everyday wear" or "great for any occasion".
3. A closing <p> of 1-2 sentences anchoring back to the series promise (see <series_anchors>). No CTA, no "shop now".

Target length: 200-300 words total. Stay inside this range. If the inputs are sparse, write tighter rather than padding.
</structure>

<additional_rules>
${sustainabilityHandling()}

${wiringAndPaddingRules()}

${seriesNameRules()}
</additional_rules>

<examples>
The examples below show the voice, opener variety and structure we want. Do not copy them; learn the pattern.
${fewShotsFor(input.brand)}
</examples>

<output_format>
Return only the HTML. Start directly with <p>. No preamble, no markdown code blocks, no commentary, no explanation.

Use <p> and <ul class="pd"><li>…</li></ul> exclusively. Do not use <strong>, <b>, <em>, <i>, headings or any other tag.

Before returning, silently verify:
- The opening sentence does NOT start with "Meet the…", "Introducing…", "Welcome to…", "Discover…", "Say hello to…" or any greeting opener.
- Em dash count is 0 or 1.
- No banned style words.
- No mention of colour, size or variant.
- All technical claims trace back to <input_materials>.
- Total length is between 200 and 300 words.
- HTML structure is exactly: <p>intro</p><ul class="pd"><li>…</li></ul><p>closing</p> (plus the sustainability line if applicable).

Write the description now.
</output_format>`;
}

/**
 * Builds the localisation prompt that renders the freshly generated EN master
 * into the target Inriver locale. Brand-aware.
 */
export function buildLocalisationPrompt(
  enMaster: string,
  langCode: string,
  langName: string,
  input: MetadataInput
): string {
  const sloggi = isSloggi(input.brand);
  const brandLabel = sloggi ? 'sloggi' : 'Triumph';

  return `<role>
You are a senior copywriter and localiser, native in ${langName}, writing for ${brandLabel} and faithful to the ${brandLabel} Brand Book.
</role>

<task>
Localise the English master in <source> into ${langName}. Localise, do not translate word-for-word: write as a native ${langName} ${brandLabel} copywriter would.
</task>

<brand_voice>
${brandRulesBlock(input.brand)}
</brand_voice>

<product_context>
- Material Number: ${input.materialNumber}
- Product Name: ${input.productName}
- Brand: ${input.brand}
${input.productLine ? `- Product Line: ${input.productLine}\n` : ''}</product_context>

<source>
${enMaster}
</source>

<localisation_context>
${getCompleteLocalizationContext(langCode, input.brand)}
</localisation_context>

<rules>
1. Preserve the structure exactly: same paragraph count, same number of bullets, same HTML tags as <source>.
2. Keep all ${brandLabel} product and series names in their original English form. Never translate "sloggi ZERO Feel", "S by sloggi", "Triumph Amourette", or any series identifier.
3. Keep sustainability certifications verbatim (GRS, OEKO-TEX, GOTS, BCI, bluesign®).
4. Use em dashes sparingly. Maximum 1 em dash in the whole description.
5. Never use gendered group address. No "hey ladies", "ragazze", "señoras", "mesdames", "Damen" or any equivalent, regardless of source-language defaults.
6. No humour, puns or culture-specific idioms.
7. No mention of colours, sizes or variants.
8. Use idiomatic, fluent ${langName}. The reader should not feel they are reading a translation.
9. Avoid AI-style words in their ${langName} equivalents: no "delve / approfondire eccessivamente / sumergirse" filler, no "showcase / mettere in mostra" filler, no "realm / regno" metaphor.
</rules>

<terminology>
Use correct fashion and underwear terminology in ${langName}:
- Portuguese (PT-PT): "soutien" (not "sutiã"), "cuecas"
- Spanish: "sujetador" (not "bra"), "braguita"
- Italian: "reggiseno", "mutandine" or "slip"
- French: "soutien-gorge", "culotte"
- German: "BH", "Slip"
- Polish: "biustonosz", "majtki"
- Czech: "podprsenka", "kalhotky"
- Hungarian: "melltartó", "bugyi"
- Danish: "bh", "trusser"
- Swedish: "bh", "trosor"
- Dutch: "bh", "slip"

Do not include product codes (WHP, W01, NDK, etc.) inside body copy. Use the product type name.
</terminology>

<output_format>
Return only the localised HTML. Start directly with <p>. No markdown code blocks, no commentary.

Use the same tags as <source>: <p> and <ul class="pd"><li>…</li></ul>. No <strong>, <b>, <em>, <i> or any other formatting.

Write the localised description now.
</output_format>`;
}
