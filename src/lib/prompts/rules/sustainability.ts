/**
 * Sustainability certificate handling rules.
 */

export function sustainabilityHandling(): string {
  return `19. SUSTAINABILITY SECTION SEPARATION:
    - Do NOT include any sustainability certificates or eco labels (e.g., OEKO‑TEX®, OEKOTEX, OEKO TEX, bluesign, BCI, FSC, RDS, RWS, Fairtrade, etc.) in the Long Description prose or bullet points
    - Exception: See rule 20 for GRS/GOTS handling

20. GRS/GOTS CERTIFICATE HANDLING:
    If you find "GRS" and/or "GOTS" in the Long Description text:
    - Preserve explicit mentions of these acronyms exactly where present (e.g., "GOTS-certified")
    - Add localized certificate label at the end of the description:
      • German (de): use "Nachhaltigkeitszertifikat"
      • English/Other: use "Sustainability certificate"
    - Format:
      • If only GRS: add "Sustainability certificate GRS"
      • If only GOTS: add "Sustainability certificate GOTS"
      • If both: add "Sustainability certificate GRS/GOTS"
    - Place before other certifications (e.g., OEKO-TEX®)`;
}
