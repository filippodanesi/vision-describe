/**
 * AI style-guard rules.
 * Bans overused AI-signature phrases and generic style words.
 */

export function aiBannedPhrases(): string {
  return `23. DO NOT use overused AI-signature phrases:
    "Indeed", "Furthermore", "However", "Notably", "In terms of", "Moreover", "Unlock the potential of", "Delve into the world of", "Pave the way for", "At the forefront of", "Embark on a journey", "Spearhead the initiative", "Navigate the complexities", "It is worth mentioning"

24. Avoid generic AI-generated style words: "realm", "landscape", "testament", "showcase"`;
}
