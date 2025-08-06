
/**
 * Utility functions for keyword analysis and matching
 */

/**
 * Checks if a target keyword is in top positions
 */
export const isKeywordInTopPositions = (
  targetKeyword: string,
  keywords: any[],
  topN: number = 3
): boolean => {
  if (!keywords || keywords.length === 0 || !targetKeyword) return false;
  
  // Check if the keyword is among the top N positions
  const topKeywords = keywords.slice(0, topN);
  return topKeywords.some(kw => 
    kw.text.toLowerCase().trim().includes(targetKeyword.toLowerCase().trim())
  );
};

/**
 * Checks if there's an exact keyword match
 * Fixed to properly handle case insensitivity
 */
export const isExactKeywordMatch = (
  text: string,
  targetKeyword: string
): boolean => {
  if (!text || !targetKeyword) return false;
  
  // Convert both to lowercase for case-insensitive comparison
  // and trim whitespace for more accurate matching
  const lowerText = text.toLowerCase().trim();
  const lowerKeyword = targetKeyword.toLowerCase().trim();
  
  console.log(`Exact match check: "${lowerText}" === "${lowerKeyword}" -> ${lowerText === lowerKeyword}`);
  return lowerText === lowerKeyword;
};

/**
 * Checks if there's a partial keyword match
 * Fixed to properly handle partial matching
 */
export const isPartialKeywordMatch = (
  text: string,
  targetKeyword: string
): boolean => {
  if (!text || !targetKeyword) return false;
  
  // Convert both to lowercase for case-insensitive comparison
  const lowerText = text.toLowerCase().trim();
  const lowerKeyword = targetKeyword.toLowerCase().trim();
  
  // Return true if the text includes the keyword but is not an exact match
  const isPartial = lowerText.includes(lowerKeyword) && lowerText !== lowerKeyword;
  console.log(`Partial match check: "${lowerText}" includes "${lowerKeyword}" -> ${isPartial}`);
  return isPartial;
};
