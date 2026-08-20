// Long-description columns come in two naming conventions, and both are live:
//
//   MaterialLongDescriptionEcom_<lang>   the Inriver exports (de, fr, pt-PT)
//   Ecom Long Desc_<locale>              the PIM exports        (de_DE, fr_FR)
//
// OptimizeMode was written against the first one only, so a PIM export left
// the column selector empty with no explanation. Everything that has to
// recognise, match or build one of these column names goes through here.

import { PIM_LOCALES, pimLocaleByCode, pimLocaleByLocale } from '@/lib/pimLocales';

export const INRIVER_PREFIX = 'MaterialLongDescriptionEcom_';
export const PIM_PREFIX = 'Ecom Long Desc_';

/** True for a long-description column in either convention. */
export function isLongDescriptionColumn(column: string): boolean {
  const c = column.trim().toLowerCase();
  return (
    c.startsWith(INRIVER_PREFIX.toLowerCase()) ||
    c.startsWith('colormateriallongdescriptionecom') ||
    c.startsWith(PIM_PREFIX.toLowerCase())
  );
}

/** Language code a long-description column targets, or undefined. */
export function langCodeFromColumn(column: string): string | undefined {
  const c = column.trim();

  const inriver = c.match(/^(?:Color)?MaterialLongDescriptionEcom_(.+)$/i);
  if (inriver) {
    // Normalise to the canonical code so both conventions agree: the Inriver
    // suffix is lowercase ('pt-pt') where the locale table says 'pt-PT'.
    const raw = inriver[1];
    return pimLocaleByCode(raw)?.code ?? raw.toLowerCase();
  }

  if (c.toLowerCase().startsWith(PIM_PREFIX.toLowerCase())) {
    return pimLocaleByLocale(c.slice(PIM_PREFIX.length))?.code;
  }

  return undefined;
}

/**
 * The column holding a language's copy, picked from what the file actually has.
 * Falls back to the Inriver name so callers always get a usable key.
 */
export function longDescriptionColumnFor(
  lang: string,
  availableColumns: Iterable<string>
): string {
  const columns = Array.from(availableColumns);
  const inriver = `${INRIVER_PREFIX}${lang}`;
  if (columns.includes(inriver)) return inriver;

  const locale = pimLocaleByCode(lang)?.locale;
  if (locale) {
    const pim = `${PIM_PREFIX}${locale}`;
    if (columns.includes(pim)) return pim;
  }

  // Case-insensitive second pass: exports are not consistent about casing.
  const wanted = new Set([inriver.toLowerCase()]);
  if (locale) wanted.add(`${PIM_PREFIX}${locale}`.toLowerCase());
  const hit = columns.find((c) => wanted.has(c.trim().toLowerCase()));
  return hit ?? inriver;
}

/** Every language code the file carries a long description for. */
export function langCodesFromColumns(columns: Iterable<string>): string[] {
  const codes = Array.from(columns)
    .map(langCodeFromColumn)
    .filter((c): c is string => Boolean(c));
  return Array.from(new Set(codes));
}

export { PIM_LOCALES };
