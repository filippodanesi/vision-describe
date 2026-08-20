/**
 * Long-description column naming, server side.
 *
 * Two conventions are live: 'MaterialLongDescriptionEcom_<lang>' from the
 * Inriver exports and 'Ecom Long Desc_<locale>' from the PIM exports. Building
 * the key from the language code alone only ever found the first one, so a PIM
 * export produced empty reads and silently generated nothing.
 *
 * Kept in sync by hand with src/lib/pimLocales.ts: this file runs as a Vercel
 * function and cannot resolve the '@/' alias.
 */

const LOCALE_BY_CODE: Record<string, string> = {
  cs: 'cs_CZ',
  da: 'da_DK',
  nl: 'nl_NL',
  en: 'en_GB',
  fr: 'fr_FR',
  de: 'de_DE',
  hu: 'hu_HU',
  it: 'it_IT',
  pl: 'pl_PL',
  'pt-pt': 'pt_PT',
  pt: 'pt_PT',
  es: 'es_ES',
  sv: 'sv_SE',
};

export const INRIVER_PREFIX = 'MaterialLongDescriptionEcom_';
export const PIM_PREFIX = 'Ecom Long Desc_';

/**
 * The column holding this language's copy in the given row. Falls back to the
 * Inriver name so writers always have a key to write to.
 */
export function longDescColumnFor(row: Record<string, unknown>, lang: string): string {
  const inriver = `${INRIVER_PREFIX}${lang}`;
  if (row[inriver] !== undefined) return inriver;

  const locale = LOCALE_BY_CODE[lang.toLowerCase()];
  if (locale) {
    const pim = `${PIM_PREFIX}${locale}`;
    if (row[pim] !== undefined) return pim;
  }

  // Exports are inconsistent about casing; try once more case-insensitively.
  const wanted = new Set([inriver.toLowerCase()]);
  if (locale) wanted.add(`${PIM_PREFIX}${locale}`.toLowerCase());
  const hit = Object.keys(row).find((k) => wanted.has(k.trim().toLowerCase()));
  return hit ?? inriver;
}
