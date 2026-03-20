/**
 * Extracted ecommerce prompts and prompt-building helpers.
 * Shared between processors.ts (server-side row-by-row) and batch-create.ts (batch API).
 */

export function wiringAndPaddingCompact(): string {
  return `WIRING & PADDING (FOR BRA PRODUCTS):
- When wiring/padding info is provided, include as FIRST bullet point
- Format: "[Wiring], [padding] bra for [benefit]"
- Examples: "Non-wired, padded bra for everyday comfort" / "Wired, non-padded bra for natural shaping"
- SWIMWEAR: Skip wiring for one-pieces, mention padding only if relevant
- BEACHWEAR: Do NOT include wiring/padding info`;
}

export function seriesNameRules(): string {
  return `SERIES NAME FORMATTING:
- ALWAYS remove the "O-" or "O -" prefix from series names
- For series ending in "T" (e.g., "Ladyform Soft T"), use the name without "T"
- ALWAYS refer to series as "the [Series Name] series" for clarity`;
}

export function truthfulnessRules(): string {
  return `TRUTHFULNESS & ANTI-INFERENCE (CRITICAL):
- NEVER add technical specifications not explicitly stated in the input
- NEVER infer product features from generic terms
- Stay STRICTLY within the information provided in the source material
- When translating technical terms, use NEUTRAL language unless specifics are provided`;
}

export const ECOMMERCE_SYSTEM_PROMPT = `
You optimize e-commerce long descriptions. Return ONLY plain text.
- Keep facts, improve readability and flow.
- 1–3 paragraphs, no pricing/shipping/competitor references.
- Maintain brand-safe tone.

${wiringAndPaddingCompact()}

${seriesNameRules()}

${truthfulnessRules()}

PRE-FLIGHT VERIFICATION (internal only — do NOT include in output):
Silently verify before returning:
1. Every technical claim exists explicitly in the input source — remove any that do not
2. Replace inferred details with neutral language
3. No assumptions or invented specs in the output
`;

/**
 * Build the user prompt for ecommerce row optimization.
 * Mirrors the logic from processEcommerceRow in processors.ts.
 */
export function buildEcommerceUserPrompt(
  row: Record<string, unknown>,
  language: string
): string {
  const descKey = `MaterialLongDescriptionEcom_${language}`;
  const description = String(row[descKey] ?? '');

  // Optional short hint (dynamic column lookup)
  const shortHintKey = Object.keys(row).find((k) => {
    const hasLang = new RegExp(`(^|[ _-])${language}($|[ _-])`, 'i').test(k);
    const isShortDesc = /short description/i.test(k) && hasLang;
    const isSC =
      /^sc(\b|[_\s-][a-z]{2}$|$)/i.test(k) &&
      new RegExp(`${language}$`, 'i').test(k);
    const isAltStyle = new RegExp(
      `^materialalternativestyle_${language}$`,
      'i'
    ).test(k);
    return isShortDesc || isSC || isAltStyle;
  });
  const shortHint = shortHintKey ? String(row[shortHintKey] ?? '') : '';
  const altTitleKey = `MaterialAlternativeStyle_${language}`;
  const title = String(
    row[altTitleKey] ?? row['MaterialSeriesName'] ?? ''
  );
  const wiringInfo = String(
    row['Wiring Info'] ??
      row['WiringInfo'] ??
      row['MaterialProductWiringTypeAI_en'] ??
      row['Wiring'] ??
      ''
  ).trim();
  const paddingInfo = String(
    row['Padding info'] ??
      row['PaddingInfo'] ??
      row['MaterialProductLiningLevelTypeAI_en'] ??
      row['Padding'] ??
      ''
  ).trim();
  const productGroup = String(
    row['Product Group'] ?? row['MaterialProductGroup'] ?? ''
  ).trim();
  const usps = String(row['MaterialB2CUSPs_en'] ?? '').trim();
  const seriesDescription = String(
    row['MaterialB2CSeriesDescription_en'] ?? ''
  ).trim();
  const styleDescription = String(
    row['MaterialB2CStyleDescription_en'] ?? ''
  ).trim();

  let prompt =
    'TASK: Optimize the long description for e-commerce (1–3 paragraphs), plain text.\nCONTEXT:\n';
  if (title) prompt += `- Title/Series: ${title}\n`;
  if (seriesDescription) prompt += `- Series Description: ${seriesDescription}\n`;
  if (styleDescription) prompt += `- Style Description: ${styleDescription}\n`;
  if (usps) prompt += `- USPs: ${usps}\n`;
  if (shortHint) prompt += `- Short hint: ${shortHint}\n`;
  if (description) prompt += `- Long description: ${description}\n`;
  if (wiringInfo) prompt += `- Wiring Type: ${wiringInfo}\n`;
  if (paddingInfo) prompt += `- Padding Type: ${paddingInfo}\n`;
  if (productGroup) prompt += `- Product Group: ${productGroup}\n`;
  prompt += `LANGUAGE: ${language}\n\nIMPORTANT: If Wiring Type and/or Padding Type are provided, include them as the FIRST bullet point in the format: "[Wiring], [padding] bra for [benefit]"\nReturn ONLY the optimized description.`;

  return prompt;
}
