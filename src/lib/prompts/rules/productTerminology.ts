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
Some terms are part of the product, not words to translate. These appear in their English form in the approved copy for every market, so keep them unchanged in EVERY locale:
- Cut and shape names: "T-Shirt", "Push-up", "Bralette", "Maxi", "Midi", "Mini", "Hipster", "Tai", "String"
- Materials and technologies: "Dot-Bonding", "LYCRA® FREEF!T® X-MOVE", "TENCEL™", "Supima"
- Certifications: "GRS", "OEKO-TEX"
- Series and product names: "sloggi ZERO Feel", "GO Daily", "EVER", "ADAPT", "THE UP", "S by sloggi", "Triumph Amourette"

"Dot-Bonding" in particular is never "Punktverschweißung", "punktverschweißt", "Punktverschweiß-Technologie" or any other welding wording — welding language describes metal, not underwear.

German garment names, with the only accepted forms:
- "T-Shirt Bra" → "T-Shirt-BH". Never "Hemd-BH" or "T-Hemd-BH": a "Hemd" is a buttoned shirt and the wording is wrong
- "Tank top" → "Tanktop"; "T-shirt" → "T-Shirt"
- "High Waist" stays "High Waist" — never "Hochgeschnittener Miederslip", "Miederslip" or other girdle wording, which reads dated. (In French, Italian, Spanish, Portuguese and Polish the approved copy describes the high-rise fit in natural prose instead, which is correct there.)

WHEN A TERM IS NOT IN THE GLOSSARY:
- Do not coin a translation for a technical or material term you are unsure of. Leave it in English instead — an untranslated term is a wording choice someone can review, an invented one reads as fact and ships
- This is exactly how "Dot-Bonding" reached the German site as "Punktverschweiß-Technologie": a plausible-sounding coinage that no one had approved
- The same applies to a term whose target-language form you are only inferring from its shape. Fluency is not evidence of correctness

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
- Keep in English in EVERY locale: cut names ("T-Shirt", "Push-up", "Bralette", "Maxi", "Midi", "Mini", "Hipster", "Tai", "String"), technologies ("Dot-Bonding" — never "Punktverschweißung"/"punktverschweißt", "LYCRA® FREEF!T® X-MOVE", "TENCEL™", "Supima"), certifications ("GRS", "OEKO-TEX"), and all series/product names
- German: "T-Shirt Bra" → "T-Shirt-BH", never "Hemd-BH" / "T-Hemd-BH"; "T-shirt" → "T-Shirt"; "High Waist" stays "High Waist", never "Miederslip"
- Sleeved garment = T-Shirt, sleeveless = Tanktop. Never swap the garment type given in the input
- Unsure of a technical term? Leave it in English rather than coining one. An untranslated term can be reviewed; an invented one ships as fact

FEATURE ATTRIBUTION:
- Keep every construction detail on the component the input assigns it to — Dot-Bonding finishes edges and seams, not straps
- Never add "adjustable" / "removable" / "detachable" to a component the input does not describe that way
- Cups are fixed unless the input says removable

SUPPORT LEVEL:
- Match the source level exactly: "strong lift up support" is never "sanfte Formgebung"
- No support level given → neutral wording ("Halt", "Unterstützung")`;
}
