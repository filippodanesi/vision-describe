// Image Analysis Prompt — Generates an e-commerce long description from
// product photos. Vision-only flow: no metadata, no brand context. The model
// must derive everything it claims from what it can see.
//
// Tuned for parity with the Metadata Generation prompt (commit 8b85664d):
// XML structure, the shared aiBannedPhrases() / truthfulnessRules() /
// wiringAndPaddingRules() rule blocks, 200-300 word target, no
// rule-of-three / promotional-AI vocabulary in the instruction text itself.
//
// SINGLE_IMAGE and MULTIPLE_IMAGES were near-duplicates of each other (only
// the noun "this image" vs "the images" differed) plus a 220-line repeated
// language code table. Both collapsed into one builder that branches on the
// number of images and pulls the locale brief from getCompleteLocalizationContext.

import { getCompleteLocalizationContext } from './languageInstructions';
import {
  aiBannedPhrases,
  truthfulnessRules,
  wiringAndPaddingRules,
} from '@/lib/prompts/rules';

interface ImageAnalysisPromptInput {
  imageCount: number;
  category: string;
  language: string;
  certifications: string;
}

/**
 * Builds the image analysis prompt. Returns a single string because
 * analyzeWithClaude in visionApiUtils.ts still takes a flat prompt;
 * switching it to {system, user} is a separate refactor.
 *
 * The shape mirrors buildEnMasterGenerationPrompt: <role>, <task>,
 * <visual_analysis>, <truthfulness>, <style_rules>, <structure>,
 * <localisation_context>, <additional_rules>, <output_format>.
 */
export function buildImageAnalysisPrompt(input: ImageAnalysisPromptInput): string {
  const { imageCount, category, language, certifications } = input;
  const imageNoun = imageCount > 1 ? `${imageCount} product images` : 'product image';
  const imageRef = imageCount > 1 ? 'the images' : 'the image';

  return `<role>
You are a senior e-commerce copywriter for premium lingerie and intimate apparel. You write product descriptions that hold up against the brand-book standards used by Triumph, sloggi and equivalent labels.
</role>

<task>
Write ONE long product description in the locale specified in <localisation_context>, based on what you can see in the ${imageNoun} attached to this message. There are no metadata inputs; ${imageRef} ${imageCount > 1 ? 'are' : 'is'} the only source of truth.

Product category (provided by the user): ${category}
</task>

<visual_analysis>
Before writing, identify the following from ${imageRef}:
- Product type and silhouette (cut, coverage, support level)
- Materials and surface textures you can actually see (microfibre, lace, mesh, tulle, jersey, modal, cotton, etc.)
- Construction details (seams, dot-bonding, underwiring, padding, hooks, straps, closures)
- Trims and embellishments (scalloped edges, embroidery, bows, lace insets)
- Logos, labels or certification marks visible on the garment

Do not write anything you cannot point to in ${imageRef}.
</visual_analysis>

<truthfulness>
${truthfulnessRules()}

If ${imageRef} ${imageCount > 1 ? 'do' : 'does'} not show a feature, do not mention it. No assumed colours, fabrics, technologies, certifications or sizes.
</truthfulness>

<style_rules>
1. Open with an actual sentence, not a template. Do not start with "Meet the [product]", "Introducing", "Welcome to", "Discover", "Say hello to" or any greeting-style opener. Vary the opener across descriptions: lead with a benefit, name a moment, lead with the fabric, name the cut, address a real need.

2. Em dashes are restricted. Use at most one em dash in the entire description.

3. Use simple, direct language. No promotional AI vocabulary.

4. No humour, puns or culture-specific idioms.

5. Never address the reader by gender. No "ladies", "girls", "guys", "for her", "for women".

6. Never mention specific colours, sizes or variants. The description applies to every variant of the SKU.

7. No superlative pile-ups ("incredibly soft, beautifully crafted, unbelievably comfortable"). One strong claim per sentence.

${aiBannedPhrases()}
</style_rules>

<structure>
Output Inriver-compatible HTML in this exact shape:

1. An opening <p> of 2-3 sentences stating what the product is and the comfort or benefit promise visible in ${imageRef}.
2. A bullet list with 4-6 items wrapped in <ul class="pd"><li>...</li></ul>. Each bullet is a real, distinct feature drawn from ${imageRef}. No filler bullets like "perfect for everyday wear" or "great for any occasion".
3. A closing <p> of 1-2 sentences. No CTA, no "shop now".

Target length: 200-300 words total. If ${imageRef} ${imageCount > 1 ? 'show' : 'shows'} limited detail, write tighter rather than padding with generic claims.

Match the grammatical number of the category exactly: if "${category}" is singular, use singular articles; if plural, use plural articles. Do not switch based on what is depicted.
</structure>

<localisation_context>
Target language code: ${language}

${getCompleteLocalizationContext(language)}

Write idiomatically in the target language from the start. Do not translate word-for-word from English. For PT-PT use European Portuguese (telemóvel, soutien, acolchoamento); for PT-BR use Brazilian Portuguese (celular, sutiã, enchimento).
</localisation_context>

<additional_rules>
${wiringAndPaddingRules()}
</additional_rules>

<output_format>
Return only the HTML. Start directly with <p>. No preamble, no markdown code blocks, no commentary.

Use <p> and <ul class="pd"><li>...</li></ul> exclusively. No <strong>, <b>, <em>, <i>, headings or other tags.

${certifications.trim() ? `End with a single line listing these certifications verbatim: ${certifications}` : 'Do not add any certification line.'}

Before returning, silently verify:
- The opening sentence does not start with "Meet the", "Introducing", "Welcome to", "Discover", "Say hello to".
- Em dash count is 0 or 1.
- No banned style words (see <style_rules>).
- No mention of colour, size or variant.
- Every technical claim is supported by something visible in ${imageRef}.
- Total length is between 200 and 300 words.
- HTML structure is exactly: <p>intro</p><ul class="pd"><li>...</li></ul><p>closing</p> (plus the certification line if applicable).

Write the description now.
</output_format>`;
}

/**
 * Backward-compatible facade. useImageAnalysis previously branched on
 * images.length and called IMAGE_ANALYSIS_PROMPT.SINGLE_IMAGE() /
 * .MULTIPLE_IMAGES() — keep the same surface so the hook doesn't need to
 * change just to pick up the rewritten prompt.
 */
export const IMAGE_ANALYSIS_PROMPT = {
  SINGLE_IMAGE: (category: string, language: string, certifications: string) =>
    buildImageAnalysisPrompt({ imageCount: 1, category, language, certifications }),
  MULTIPLE_IMAGES: (
    imageCount: number,
    category: string,
    language: string,
    certifications: string,
  ) =>
    buildImageAnalysisPrompt({ imageCount, category, language, certifications }),
};
