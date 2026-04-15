const buildLangPatterns = (base: string, lang: string, langUpper: string): string[] => [
  ` ${lang}$`,
  ` ${langUpper}$`,
  `\\[${lang}\\]`,
  `\\[${langUpper}\\]`,
  `_${lang}$`,
  `_${langUpper}$`,
  ` ${lang} `,
  ` ${langUpper} `,
];

export const findMatchingShortDescriptionColumn = (
  columnNames: string[],
  targetLanguage: string,
): string => {
  const lang = targetLanguage.toLowerCase();
  const langUpper = lang.toUpperCase();

  for (const key of columnNames) {
    const lower = key.toLowerCase();
    if (
      lower.includes('short description') ||
      lower.startsWith('sc') ||
      lower.startsWith('materialalternativestyle_')
    ) {
      for (const pattern of buildLangPatterns('short description', lang, langUpper)) {
        const regex = new RegExp(pattern);
        if (regex.test(lower) || regex.test(key)) {
          return key;
        }
      }
      if (/^sc$/i.test(key) || new RegExp(`^sc[_\\s-]?${lang}$`, 'i').test(key)) {
        return key;
      }
      if (new RegExp(`^materialalternativestyle_${lang}$`, 'i').test(key)) {
        return key;
      }
    }
  }

  for (const key of columnNames) {
    const lower = key.toLowerCase();
    if (lower.includes('short descriptions')) {
      for (const pattern of buildLangPatterns('short descriptions', lang, langUpper)) {
        const regex = new RegExp(pattern);
        if (regex.test(lower) || regex.test(key)) {
          return key;
        }
      }
    }
  }

  return '';
};
