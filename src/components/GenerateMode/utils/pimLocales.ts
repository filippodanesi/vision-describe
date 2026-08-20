// PIM locale table for the SFCC round-trip used by Masterdata.
//
// Two file shapes are involved and they do not share a locale notation:
//
//   EXPORT from PIM  — one row per product, one column per locale, named
//                      "Ecom Long Desc_<locale>" (e.g. "Ecom Long Desc_de_DE").
//   IMPORT into PIM  — one row per product AND locale, keyed by a numeric
//                      LanguageID, in the SFCC_Product_info_template columns
//                      LanguageID | Material Number | Long Description.
//
// The LanguageID values below were recovered by matching every description in
// a real import file against the export it came from; all twelve matched on
// every sampled row, so the table is derived from the data rather than guessed.

import { franc } from 'franc-min';

export interface PimLocale {
  /** Numeric id the SFCC import template expects. */
  languageId: number;
  /** Locale suffix used by the PIM export columns, e.g. 'de_DE'. */
  locale: string;
  /** Language code used internally and by INRIVER_LANGUAGES, e.g. 'de'. */
  code: string;
  /** ISO 639-3 code, for language detection. */
  iso3: string;
}

export const PIM_LOCALES: readonly PimLocale[] = [
  { languageId: 50, locale: 'cs_CZ', code: 'cs', iso3: 'ces' },
  { languageId: 41, locale: 'da_DK', code: 'da', iso3: 'dan' },
  { languageId: 55, locale: 'nl_NL', code: 'nl', iso3: 'nld' },
  { languageId: 1, locale: 'en_GB', code: 'en', iso3: 'eng' },
  { languageId: 38, locale: 'fr_FR', code: 'fr', iso3: 'fra' },
  { languageId: 32, locale: 'de_DE', code: 'de', iso3: 'deu' },
  { languageId: 52, locale: 'hu_HU', code: 'hu', iso3: 'hun' },
  { languageId: 53, locale: 'it_IT', code: 'it', iso3: 'ita' },
  { languageId: 54, locale: 'pl_PL', code: 'pl', iso3: 'pol' },
  { languageId: 57, locale: 'pt_PT', code: 'pt-PT', iso3: 'por' },
  { languageId: 40, locale: 'es_ES', code: 'es', iso3: 'spa' },
  { languageId: 62, locale: 'sv_SE', code: 'sv', iso3: 'swe' },
] as const;

export const PIM_LONG_DESC_PREFIX = 'Ecom Long Desc_';

/** SFCC import template header row, including the unnamed trailing column. */
export const SFCC_IMPORT_HEADERS = [
  'LanguageID',
  'Material Number',
  'Long Description',
  '',
] as const;

export const SFCC_IMPORT_SHEET_NAME = 'Sheet1';

const byLocale = new Map(PIM_LOCALES.map((l) => [l.locale.toLowerCase(), l]));
const byCode = new Map(PIM_LOCALES.map((l) => [l.code.toLowerCase(), l]));

export function pimLocaleByLocale(locale: string): PimLocale | undefined {
  return byLocale.get(locale.trim().toLowerCase());
}

export function pimLocaleByCode(code: string): PimLocale | undefined {
  const hit = byCode.get(code.trim().toLowerCase());
  if (hit) return hit;
  // The current assortment ships 'pt' where the table holds 'pt-PT'.
  if (/^pt\b/i.test(code.trim())) return byCode.get('pt-pt');
  return undefined;
}

/** Column name a PIM export uses for a locale, e.g. 'Ecom Long Desc_de_DE'. */
export function pimLongDescColumn(locale: string): string {
  return `${PIM_LONG_DESC_PREFIX}${locale}`;
}

/** Locale suffixes present as 'Ecom Long Desc_<locale>' columns. */
export function pimLocalesFromHeaders(headers: string[]): string[] {
  const prefix = PIM_LONG_DESC_PREFIX.toLowerCase();
  return headers
    .map((h) => h.trim())
    .filter((h) => h.toLowerCase().startsWith(prefix))
    .map((h) => h.slice(PIM_LONG_DESC_PREFIX.length));
}

/** Language codes for the 'Ecom Long Desc_<locale>' columns a file carries. */
export function pimLanguageCodesFromHeaders(headers: string[]): string[] {
  const codes = pimLocalesFromHeaders(headers)
    .map((locale) => pimLocaleByLocale(locale)?.code)
    .filter((c): c is string => Boolean(c));
  return Array.from(new Set(codes));
}

export function htmlToPlainText(html: string): string {
  return String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// franc-min ships a reduced trigram model. On this corpus it identified every
// language in the table except Danish, which it reported as Swedish, Dutch or
// German on all 329 sampled cells. Detection is therefore skipped for Danish
// rather than drowning the real findings in false positives.
const UNRELIABLE_ISO3 = new Set(['dan']);

/** Minimum plain-text length before detection is meaningful. */
const MIN_DETECT_LEN = 60;

export interface LocaleMismatch {
  materialNumber: string;
  productName: string;
  /** Locale the column claims. */
  declaredLocale: string;
  /** Locale whose language the text is actually written in, when identifiable. */
  detectedLocale?: string;
}

/**
 * Flags PIM export cells whose text is not in the language its column claims.
 *
 * Real exports do drift: in the AW26 file six locale columns (de, fr, es, pt,
 * pl, nl) were rotated against each other on 26 products, so the German column
 * held French. Rewriting from the wrong source language would be invisible in
 * the output, hence the up-front check.
 */
export function findLocaleMismatches(
  rows: Array<Record<string, unknown>>,
  headers: string[],
  materialNumberColumn: string,
  productNameColumn: string
): LocaleMismatch[] {
  const locales = pimLocalesFromHeaders(headers)
    .map((locale) => pimLocaleByLocale(locale))
    .filter((l): l is PimLocale => Boolean(l));

  const checkable = locales.filter((l) => !UNRELIABLE_ISO3.has(l.iso3));
  if (checkable.length < 2) return [];

  const only = checkable.map((l) => l.iso3);
  const isoToLocale = new Map(checkable.map((l) => [l.iso3, l.locale]));
  const mismatches: LocaleMismatch[] = [];

  for (const row of rows) {
    for (const entry of checkable) {
      const text = htmlToPlainText(String(row[pimLongDescColumn(entry.locale)] ?? ''));
      if (text.length < MIN_DETECT_LEN) continue;

      const detected = franc(text, { only });
      if (detected === entry.iso3 || detected === 'und') continue;

      mismatches.push({
        materialNumber: String(row[materialNumberColumn] ?? '').trim(),
        productName: String(row[productNameColumn] ?? '').trim(),
        declaredLocale: entry.locale,
        detectedLocale: isoToLocale.get(detected),
      });
    }
  }

  return mismatches;
}
