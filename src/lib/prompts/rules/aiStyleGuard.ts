/**
 * AI style-guard rules.
 * Bans overused AI-signature phrases, generic style words, formulaic openers,
 * em-dash abuse and gendered group address. Keeps the original "23./24."
 * numbering so the long sloggi/system prompts that consume this helper
 * preserve their existing numbered sequence.
 */

export function aiBannedPhrases(): string {
  return `23. DO NOT use overused AI-signature phrases:
    "Indeed", "Furthermore", "However", "Notably", "In terms of", "Moreover", "Unlock the potential of", "Delve into the world of", "Pave the way for", "At the forefront of", "Embark on a journey", "Spearhead the initiative", "Navigate the complexities", "It is worth mentioning"

24. Avoid generic AI-generated style words. NEVER use: delve, leverage, landscape, testament, showcase, robust, comprehensive, seamless (as a generic intensifier), harness, foster, elevate, navigate, crucial, paramount, intricate, tapestry, realm, embark, unleash, streamline, empower, unlock, vibrant, nestled, journey (as metaphor).

25. NEVER open a description with a template greeting. Banned openers: "Meet the [product]", "Introducing…", "Welcome to…", "Discover…", "Say hello to…", "Get to know…". Vary every opener: lead with a benefit, name a moment, lead with the fabric, name the cut, address a real need.

26. Em dash (—) usage is restricted. Maximum 1 em dash per description. Prefer commas, periods, parentheses or rephrasing.

27. Brand metaphors should not stack. Use each of these at most once per description: "second skin" / "next to skin", "morning to night" / "morning after morning", "every day" / "everyday", "comfort that moves with you", "feel like nothing".

28. NEVER use gendered group address. No "ladies", "girls", "guys", "for her", "for women", "for men", or their language-specific equivalents (ragazze, señoras, mesdames, Damen).

29. NEVER use humour, puns, jokes or culture-specific idioms. The text ships globally; assume the reader is reading in their second language.`;
}

/**
 * Compact, non-numbered version of the anti-AI rules for short prompts that
 * don't keep a global numbered sequence (ECOMMERCE_SYSTEM_PROMPT,
 * SLOGGI_ECOMMERCE_SYSTEM_PROMPT and similar).
 */
export function aiBannedPhrasesCompact(): string {
  return `Style rules:
- Avoid generic AI words: delve, leverage, landscape, testament, showcase, robust, comprehensive, seamless (as intensifier), harness, foster, elevate, navigate, crucial, intricate, tapestry, realm, embark, vibrant, nestled, journey (as metaphor).
- Maximum 1 em dash (—) per description. Prefer commas, periods, parentheses or rephrasing.
- Never open with template greetings ("Meet the…", "Introducing…", "Welcome to…", "Discover…", "Say hello to…", "Get to know…"). Vary every opener.
- Each brand metaphor at most once per description: "second skin" / "next to skin", "morning to night", "every day" / "everyday", "comfort that moves with you", "feel like nothing".
- No gendered group address ("ladies", "girls", "guys" or their equivalents in any language).
- No humour, puns or culture-specific idioms.`;
}
