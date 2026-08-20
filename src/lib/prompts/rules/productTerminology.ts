/**
 * Product terminology & feature-attribution rules.
 *
 * Written against defects found on the live DE product pages: technical terms
 * that were translated instead of kept in English, a construction detail moved
 * onto the wrong component, and a support level softened away from the one the
 * hangtag states.
 */

/** Full version — used by the default system prompt, image analysis, metadata generation. */
export function productTerminologyRules(): string {
  return `PRODUCT TERMINOLOGY (CRITICAL):
Some terms are part of the product, not words to translate. Keep them in English in EVERY locale, including German:
- "Dot-Bonding" — never "Punktverschweißung", "punktverschweißt", "Punktverschweiß-Technologie" or any welding wording. Welding language describes metal, not underwear.
- "High Waist" — never "Hochgeschnittener Miederslip", "Miederslip" or other girdle wording, which reads dated
- "Tanktop" — the German term for a sleeveless top
- Series and product names: "sloggi ZERO Feel", "S by sloggi", "THE UP", "Triumph Amourette"

German garment names that DO get translated, with the only accepted forms:
- "T-Shirt Bra" → "T-Shirt-BH". Never "Hemd-BH" or "T-Hemd-BH": a "Hemd" is a buttoned shirt and the wording is wrong
- "Tank top" → "Tanktop"; "T-shirt" → "T-Shirt"

GARMENT TYPE MUST MATCH THE GARMENT:
- A garment with sleeves is a T-Shirt, never a Tanktop; a sleeveless one is a Tanktop, never a T-Shirt
- Never restate the garment type as a different type from the one the input gives

FEATURE ATTRIBUTION (CRITICAL):
- A construction detail belongs to the component the input assigns it to. Never move it onto another part
- Dot-Bonding is an edge and seam finish. Straps do not have Dot-Bonding unless the input says so
- Never add "adjustable", "removable", "detachable" or "convertible" to a component the input does not describe that way
- Cups are fixed unless the input explicitly states they are removable. "Herausnehmbare Cups" for a garment with sewn-in cups is a factual error customers report back to us

SUPPORT LEVEL MUST MATCH THE SOURCE:
- Reproduce the support level the input states — never soften it, never intensify it
- A product sold as "strong lift up support" is not "sanfte Formgebung"; a product sold as "soft" is not "starker Halt"
- When no support level is given, use neutral wording ("Halt", "Unterstützung") rather than picking one

EXAMPLES:
WRONG:
- Input: "strong lift up support" → Output: "sanfte Formgebung" (contradicts the hangtag)
- Input: "dot-bonded edges" + "adjustable straps" → Output: "verstellbare Träger mit Dot-Bonding" (moves the finish onto the straps)
- Input: "integrated fixed cups" → Output: "herausnehmbare Cups" (invents removability)
CORRECT:
- Input: "strong lift up support" → Output: "starker Lift-Up-Halt"
- Input: "dot-bonded edges" + "adjustable straps" → Output: "Kanten mit Dot-Bonding" and, separately, "verstellbare Träger"
- Input: "integrated fixed cups" → Output: "fest integrierte Cups"`;
}

/** Compact version — used by amazon, ecommerce, csv translation. */
export function productTerminologyCompact(): string {
  return `PRODUCT TERMINOLOGY:
- Keep in English in EVERY locale: "Dot-Bonding" (never "Punktverschweißung"/"punktverschweißt"), "High Waist" (never "Miederslip"), "Tanktop", and all series/product names
- German: "T-Shirt Bra" → "T-Shirt-BH", never "Hemd-BH" / "T-Hemd-BH"; "T-shirt" → "T-Shirt"
- Sleeved garment = T-Shirt, sleeveless = Tanktop. Never swap the garment type given in the input

FEATURE ATTRIBUTION:
- Keep every construction detail on the component the input assigns it to — Dot-Bonding finishes edges and seams, not straps
- Never add "adjustable" / "removable" / "detachable" to a component the input does not describe that way
- Cups are fixed unless the input says removable

SUPPORT LEVEL:
- Match the source level exactly: "strong lift up support" is never "sanfte Formgebung"
- No support level given → neutral wording ("Halt", "Unterstützung")`;
}
