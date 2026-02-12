/**
 * Triumph product abbreviation lookup table.
 * Single source of truth used by About You, NEXT, and any future use case
 * that needs to expand style-name abbreviations.
 */

export const PRODUCT_ABBREVIATIONS = new Map<string, string>([
  ['B', 'Balconette Bra'],
  ['BS', 'Soft Body (Non-Wired Body)'],
  ['BSW', 'Wired Body'],
  ['BSWP', 'Wired Padded Body'],
  ['BV', 'Bra Camisole'],
  ['EX', 'Global Line Produced for Europe'],
  ['F', 'Front Closure Bra'],
  ['HW Short', 'High-Waist Short'],
  ['L02', 'Longline Bra'],
  ['LSL', 'Long Sleeve'],
  ['Minimizer WP', 'Minimizer Wired Padded Bra'],
  ['N', 'Non-Wired Bra'],
  ['N01', 'Non-Wired Bra'],
  ['NDK', 'Nightdress (Knit)'],
  ['NDW', 'Nightdress (Woven)'],
  ['NSL', 'Sleeveless'],
  ['P', 'Padded Bra'],
  ['P01', 'Padded Bra'],
  ['Panty L', 'Long Leg Panty'],
  ['PK', 'Pyjama (Knit)'],
  ['PSW', 'Pyjama (Short, Woven)'],
  ['SSL', 'Short Sleeve'],
  ['Super HW Mid-Thigh', 'Super High-Waist Mid-Thigh Panty'],
  ['Super HW Panty', 'Super High-Waist Shaping Panty'],
  ['W', 'Wired Bra'],
  ['W01', 'Minimizer Wired Bra'],
  ['WDP', 'Wired Padded Bra with Detachable Straps'],
  ['WH', 'Wired Half Cup Bra'],
  ['WHP', 'Wired Half Padded Bra'],
  ['WHP01', 'Wired Half Padded Bra'],
  ['WHPM', 'Wired Half Padded Multiway Bra'],
  ['WHU', 'Wired Half Cup Push-Up Bra'],
  ['WHUF', 'Wired Half Cup Push-Up Front Closure Bra'],
  ['WHUM', 'Wired Half Cup Push-Up Multiway Bra'],
  ['WP', 'Wired Padded Bra'],
]);

/** Direct lookup — returns the full name or `undefined`. */
export function expandAbbreviation(code: string): string | undefined {
  return PRODUCT_ABBREVIATIONS.get(code);
}

/**
 * Render the full abbreviation list as a prompt-ready string.
 *
 * Output example:
 * ```
 * - B = Balconette Bra
 * - BS = Soft Body (Non-Wired Body)
 * ```
 */
export function formatAbbreviationsForPrompt(): string {
  return Array.from(PRODUCT_ABBREVIATIONS.entries())
    .map(([code, name]) => `- ${code} = ${name}`)
    .join('\n');
}
