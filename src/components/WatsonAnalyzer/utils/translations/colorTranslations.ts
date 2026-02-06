/**
 * Color Translation Mappings: Triumph internal colors → Platform standard colors.
 * Shared between AboutYou and NEXT use cases.
 * Source: "Content Input for AI Tool Training.pdf"
 */

export interface ColorMapping {
  code: string;
  triumphName: string;
  standardColor: string;
}

export const COLOR_TRANSLATIONS: ColorMapping[] = [
  { code: 'M010', triumphName: 'GREEN - DARK COMBINATION', standardColor: 'Green' },
  { code: '3595', triumphName: 'LILAC', standardColor: 'Purple' },
  { code: '7855', triumphName: 'OLIVE GOLD', standardColor: 'Green' },
  { code: '0040', triumphName: 'PORCELAIN', standardColor: 'Nude' },
  { code: '3880', triumphName: 'WILD ROSE', standardColor: 'Pink' },
  { code: '1141', triumphName: 'CACAO', standardColor: 'Brown' },
  { code: '3602', triumphName: 'CHROME', standardColor: 'Grey' },
  { code: '1588', triumphName: 'FLORAL PINK', standardColor: 'Pink' },
  { code: '00KY', triumphName: 'LIGHT BLUE', standardColor: 'Blue' },
  { code: '00CM', triumphName: 'NOSTALGIC BROWN', standardColor: 'Brown' },
  { code: '00DM', triumphName: 'PUFF PINK', standardColor: 'Pink' },
  { code: '00GZ', triumphName: 'SILK WHITE', standardColor: 'White' },
  { code: '0003', triumphName: 'WHITE', standardColor: 'White' },
  { code: '0004', triumphName: 'BLACK', standardColor: 'Black' },
  { code: '00SA', triumphName: 'ICE', standardColor: 'Blue' },
  { code: 'M007', triumphName: 'BLUE - LIGHT COMBINATION', standardColor: 'Blue' },
  { code: 'V013', triumphName: 'MULTIPLE COLOURS 13', standardColor: 'Purple' },
  { code: 'V014', triumphName: 'MULTIPLE COLOURS 14', standardColor: 'Purple' },
  { code: 'V019', triumphName: 'MULTIPLE COLOURS 19', standardColor: 'Blue' },
  { code: 'V002', triumphName: 'MULTIPLE COLOURS 2', standardColor: 'Purple' },
  { code: 'V020', triumphName: 'MULTIPLE COLOURS 20', standardColor: 'Blue' },
  { code: '00LZ', triumphName: 'NEW BEIGE', standardColor: 'Nude' },
  { code: '00HJ', triumphName: 'PURPLE', standardColor: 'Purple' },
  { code: 'M008', triumphName: 'BLUE - DARK COMBINATION', standardColor: 'Blue' },
  { code: '00TS', triumphName: 'PRUSSIAN BLUE', standardColor: 'Blue' },
  { code: '00ZE', triumphName: 'CHOCOLATE MOUSSE', standardColor: 'Brown' },
  { code: '0049', triumphName: 'FLOWER PURPLE', standardColor: 'Purple' },
  { code: 'V004', triumphName: 'MULTIPLE COLOURS 4', standardColor: 'Blue' },
  { code: '00NZ', triumphName: 'NUDE BEIGE', standardColor: 'Nude' },
  { code: 'M019', triumphName: 'PINK - LIGHT COMBINATION', standardColor: 'Red' },
  { code: '00EH', triumphName: 'ROYAL PURPLE', standardColor: 'Purple' },
  { code: '1991', triumphName: 'SILENCE', standardColor: 'Blue' },
  { code: '6926', triumphName: 'SWEET MARSALA', standardColor: 'Red' },
  { code: '00JO', triumphName: 'INK GRAY', standardColor: 'Grey' },
  { code: 'M034', triumphName: 'DARK GREY MELANGE', standardColor: 'Grey' },
  { code: '6653', triumphName: 'FLASHY PINK', standardColor: 'Pink' },
  { code: 'M013', triumphName: 'GREY COMBINATION', standardColor: 'Blue' },
  { code: '3557', triumphName: 'GREY SHADOW', standardColor: 'Grey' },
  { code: 'M032', triumphName: 'LIGHT GREY MELANGE', standardColor: 'Cream' },
  { code: '00EP', triumphName: 'NEUTRAL BEIGE', standardColor: 'Nude' },
  { code: '6901', triumphName: 'TOASTED ALMOND', standardColor: 'Natural' },
  { code: '00QF', triumphName: 'VINTAGE DENIM', standardColor: 'Blue' },
  { code: '0035', triumphName: 'RED COMBINATION', standardColor: 'Red' },
  { code: '00FZ', triumphName: 'SHANGHAI RED', standardColor: 'Red' },
  { code: '00YQ', triumphName: 'BRANDY', standardColor: 'Purple' },
  { code: 'M006', triumphName: 'RED - DARK COMBINATION', standardColor: 'Red' },
];

/**
 * Look up the standard color for a Triumph color name or code.
 * Tries matching by name first, then by code. Case-insensitive.
 * Returns the original value as passthrough if no match found.
 */
export function translateColor(
  triumphColorOrCode: string,
  mappings: ColorMapping[] = COLOR_TRANSLATIONS,
): string {
  if (!triumphColorOrCode) return '';
  const needle = triumphColorOrCode.trim().toUpperCase();

  // Match by name first (most common in template data)
  const byName = mappings.find(
    (m) => m.triumphName.toUpperCase() === needle,
  );
  if (byName) return byName.standardColor;

  // Match by code
  const byCode = mappings.find(
    (m) => m.code.toUpperCase() === needle,
  );
  if (byCode) return byCode.standardColor;

  // Passthrough if no match
  return triumphColorOrCode;
}
