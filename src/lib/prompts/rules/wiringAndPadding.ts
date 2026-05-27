/**
 * Wiring & padding rules for bra/swimwear products.
 */

/** Full version — used by the default system prompt. */
export function wiringAndPaddingRules(): string {
  return `CRITICAL RULE FOR BRA PRODUCTS:
When wiring and/or padding information is provided in the input data, you MUST include it as the FIRST bullet point in the description.

FORMAT FOR FIRST BULLET POINT:
- Use this exact format: "[Wiring status], [padding status] bra for [benefit]"
- Examples:
  • "Non-wired, padded bra for comfortable everyday support"
  • "Wired, non-padded bra for natural shaping"
  • "Non-wired, push-up bra for enhanced cleavage"
  • "Wired bra with removable padding for customizable coverage"

CUP CLASSIFICATION (FOR BRAS, BRA-SHIRTS, TOPS WITH INTEGRATED BRA, BODIES):
When the input data (Style USP or Style Description) contains an explicit cup classification line, you MUST include it as a dedicated FIRST bullet point, reusing the source wording with minimal rewording. Do not paraphrase it away into a generic "padded" / "non-padded" line. The brand team relies on the literal classification for product compliance.

Recognised classifications:
- "Integrated fixed cups for perfect hold" → cups are sewn into the garment, non-removable
- "Removable cups" / "Padded with removable cups" → cups can be taken out
- "Non-padded" / "non padded" → no cup padding at all

When a cup classification line is present alongside wiring/padding info, combine them in ONE first bullet rather than producing two redundant bullets:
- Example: "Non-wired T-shirt bra with integrated fixed cups for perfect hold"
- Example: "Wired soft bra, non-padded for natural shaping"
- Example: "Non-wired bra with removable cups for customisable coverage"

SWIMWEAR HANDLING:
- For SWIM TOPS with cup support: Include wiring/padding info as usual
- For ONE-PIECE SWIMSUITS: Skip wiring info, only mention padding where relevant
  • Example: "Removable padding for customizable coverage"
  • Example: "Padded cups for comfortable support"
- For BEACHWEAR (kaftans, cover-ups, etc.): Do NOT include wiring/padding info`;
}

/** Compact version — used by amazon, ecommerce. */
export function wiringAndPaddingCompact(): string {
  return `WIRING & PADDING (FOR BRA PRODUCTS):
- When wiring/padding info is provided, include as FIRST bullet point
- Format: "[Wiring], [padding] bra for [benefit]"
- Examples: "Non-wired, padded bra for everyday comfort" / "Wired, non-padded bra for natural shaping"

CUP CLASSIFICATION (BRAS, BRA-SHIRTS, TOPS WITH INTEGRATED BRA, BODIES):
- If input has explicit cup state ("Integrated fixed cups", "Removable cups", "Non-padded"), reuse it verbatim (or with minimal rewording) in the FIRST bullet
- Do not paraphrase to a generic "padded" / "non-padded"
- If combined with wiring/padding, merge into one first bullet: e.g. "Non-wired T-shirt bra with integrated fixed cups for perfect hold"

SWIMWEAR: Skip wiring for one-pieces, mention padding only if relevant
BEACHWEAR: Do NOT include wiring/padding info`;
}
