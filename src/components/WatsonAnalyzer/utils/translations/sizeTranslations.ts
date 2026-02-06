/**
 * Size Translation Mappings: EU sizes → GB (UK) sizes.
 * Used by the NEXT use case. Source: "Content Input for AI Tool Training.pdf"
 */

export interface SizeMapping {
  euSize: string;
  gbSize: string;
}

/** EU band number → GB band number */
const BAND_MAP: Record<string, string> = {
  '70': '32',
  '75': '34',
  '80': '36',
  '85': '38',
  '90': '40',
  '95': '42',
};

/**
 * EU cup letter → GB cup letter.
 * E (EU) = DD (GB), F (EU) = E (GB), G (EU) = F (GB), H (EU) = G (GB).
 * A-D remain the same.
 */
const CUP_MAP: Record<string, string> = {
  'A': 'A',
  'B': 'B',
  'C': 'C',
  'D': 'D',
  'E': 'DD',
  'F': 'E',
  'G': 'F',
  'H': 'G',
};

/** EU standard (non-bra) size → GB dress size */
const DRESS_SIZE_MAP: Record<string, string> = {
  '36': '8',
  '38': '10',
  '40': '12',
  '42': '14',
  '44': '16',
  '46': '18',
  '48': '20',
};

/**
 * Complete explicit mapping table built from the PDF.
 * Covers both bra sizes (e.g. A70 → 32 A) and dress sizes (e.g. 36 → 8).
 */
export const SIZE_TRANSLATION_TABLE: SizeMapping[] = [
  // Dress / standard sizes (EU → GB)
  { euSize: '36', gbSize: '8' },
  { euSize: '38', gbSize: '10' },
  { euSize: '40', gbSize: '12' },
  { euSize: '42', gbSize: '14' },
  { euSize: '44', gbSize: '16' },
  { euSize: '46', gbSize: '18' },
  { euSize: '48', gbSize: '20' },
  // Band A
  { euSize: 'A70', gbSize: '32 A' },
  { euSize: 'A75', gbSize: '34 A' },
  { euSize: 'A80', gbSize: '36 A' },
  { euSize: 'A85', gbSize: '38 A' },
  { euSize: 'A90', gbSize: '40 A' },
  // Band B
  { euSize: 'B70', gbSize: '32 B' },
  { euSize: 'B75', gbSize: '34 B' },
  { euSize: 'B80', gbSize: '36 B' },
  { euSize: 'B85', gbSize: '38 B' },
  { euSize: 'B90', gbSize: '40 B' },
  // Band C
  { euSize: 'C70', gbSize: '32 C' },
  { euSize: 'C75', gbSize: '34 C' },
  { euSize: 'C80', gbSize: '36 C' },
  { euSize: 'C85', gbSize: '38 C' },
  { euSize: 'C90', gbSize: '40 C' },
  { euSize: 'C95', gbSize: '42 C' },
  // Band D
  { euSize: 'D70', gbSize: '32 D' },
  { euSize: 'D75', gbSize: '34 D' },
  { euSize: 'D80', gbSize: '36 D' },
  { euSize: 'D85', gbSize: '38 D' },
  { euSize: 'D90', gbSize: '40 D' },
  { euSize: 'D95', gbSize: '42 D' },
  // Band E → DD
  { euSize: 'E70', gbSize: '32 DD' },
  { euSize: 'E75', gbSize: '34 DD' },
  { euSize: 'E80', gbSize: '36 DD' },
  { euSize: 'E85', gbSize: '38 DD' },
  { euSize: 'E90', gbSize: '40 DD' },
  { euSize: 'E95', gbSize: '42 DD' },
  // Band F → E
  { euSize: 'F70', gbSize: '32 E' },
  { euSize: 'F75', gbSize: '34 E' },
  { euSize: 'F80', gbSize: '36 E' },
  { euSize: 'F85', gbSize: '38 E' },
  { euSize: 'F90', gbSize: '40 E' },
  { euSize: 'F95', gbSize: '42 E' },
  // Band G → F
  { euSize: 'G70', gbSize: '32 F' },
  { euSize: 'G75', gbSize: '34 F' },
  { euSize: 'G80', gbSize: '36 F' },
  { euSize: 'G85', gbSize: '38 F' },
  // Band H → G
  { euSize: 'H75', gbSize: '34 G' },
  { euSize: 'H80', gbSize: '36 G' },
  { euSize: 'H85', gbSize: '38 G' },
  { euSize: 'H90', gbSize: '40 G' },
];

/**
 * Translate a single EU size string to GB.
 * Handles bra sizes (e.g. "A70", "D80", "80D", "E95") and dress sizes (e.g. "36", "42").
 * Returns the original value as passthrough if no match found.
 */
export function translateSize(
  euSize: string,
  table: SizeMapping[] = SIZE_TRANSLATION_TABLE,
): string {
  if (!euSize) return '';
  const s = euSize.trim().toUpperCase();

  // 1) Direct lookup in the explicit table
  const direct = table.find((m) => m.euSize.toUpperCase() === s);
  if (direct) return direct.gbSize;

  // 2) Try parsing as bra size: CupBand (e.g. "D80") or BandCup (e.g. "80D")
  const cupBand = s.match(/^([A-H]{1,2})(\d{2,3})$/);
  if (cupBand) {
    const [, cup, band] = cupBand;
    const gbBand = BAND_MAP[band];
    const gbCup = CUP_MAP[cup];
    if (gbBand && gbCup) return `${gbBand} ${gbCup}`;
  }

  const bandCup = s.match(/^(\d{2,3})([A-H]{1,2})$/);
  if (bandCup) {
    const [, band, cup] = bandCup;
    const gbBand = BAND_MAP[band];
    const gbCup = CUP_MAP[cup];
    if (gbBand && gbCup) return `${gbBand} ${gbCup}`;
  }

  // 3) Try dress size
  const dressSize = DRESS_SIZE_MAP[s];
  if (dressSize) return dressSize;

  // Passthrough
  return euSize;
}
