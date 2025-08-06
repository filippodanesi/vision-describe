
import { KeywordStatus } from '../useTextOptimization';
import { isKeywordInTopPositions, isExactKeywordMatch, isPartialKeywordMatch } from '../../utils/keywordUtils';

/**
 * Hook for analyzing keywords in text
 */
export const useKeywordAnalysis = (results: any) => {
  // Keywords statuses
  const checkKeywordStatus = (keyword: string, resultsToUse = results): KeywordStatus => {
    if (!resultsToUse || !resultsToUse.keywords || !keyword) return "missing";
    
    // Log the results we're using to check keywords
    console.log("Checking keyword status for:", keyword);
    
    // Check for exact match in text (for more accurate detection)
    const lowerKeyword = keyword.toLowerCase().trim();
    const optimizedText = resultsToUse.optimizedText || "";
    
    // Direct text search for product-type keywords (more reliable than relying on Watson results)
    if (optimizedText && lowerKeyword.includes('bras') && 
        new RegExp(`\\b${lowerKeyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(optimizedText.toLowerCase())) {
      console.log(`Found direct text match for product keyword "${keyword}"`);
      return "exact";
    }
    
    // Look for exact match in the keywords array
    if (resultsToUse.keywords.some((k: any) => isExactKeywordMatch(k.text, keyword))) {
      // Found an exact match in the keywords
      console.log(`Found exact match for keyword "${keyword}" in keywords array`);
      return "exact";
    }
    
    // Look for partial match in the keywords array
    if (resultsToUse.keywords.some((k: any) => isPartialKeywordMatch(k.text, keyword))) {
      // Found a partial match in the keywords
      console.log(`Found partial match for keyword "${keyword}" in keywords array`);
      return "partial";
    }
    
    // Additional check - look for the keyword as a substring (case insensitive)
    if (resultsToUse.keywords.some((k: any) => 
      k.text.toLowerCase().trim().includes(lowerKeyword) || 
      lowerKeyword.includes(k.text.toLowerCase().trim())
    )) {
      console.log(`Found substring match for keyword "${keyword}"`);
      return "partial";
    }
    
    // Check if keyword is in relevant top positions
    if (isKeywordInTopPositions(keyword, resultsToUse.keywords, 10)) {
      console.log(`Found relevant match for keyword "${keyword}"`);
      return "relevant";
    }
    
    // Check for the keyword in entities (product detection)
    if (resultsToUse.entities && resultsToUse.entities.length > 0) {
      const entityMatch = resultsToUse.entities.some((entity: any) => 
        entity.text.toLowerCase().includes(lowerKeyword) || 
        lowerKeyword.includes(entity.text.toLowerCase())
      );
      
      if (entityMatch) {
        console.log(`Found entity match for keyword "${keyword}"`);
        return "exact";
      }
    }
    
    console.log(`No match found for keyword "${keyword}"`);
    return "missing";
  };
  
  // Mock analysis for optimized text to check keywords
  const mockAnalysisForKeywords = (optimizedContent: string, targetKeywords: string[]) => {
    // Create a simple mock result with keywords from the text
    // This helps us visually show the keywords in the optimized text
    const mockResults = { ...results, optimizedText: optimizedContent };
    
    // Extract all phrases from the optimized content
    const words = optimizedContent.split(/\s+/);
    const mockKeywords = [];
    const mockEntities = [];

    // Process target keywords first to ensure they're included with high relevance
    for (const keyword of targetKeywords) {
      const lowerKeyword = keyword.toLowerCase().trim();
      const lowerContent = optimizedContent.toLowerCase();
      
      // Check for exact matches
      let exactMatch = false;
      // This regex checks for word boundaries or start/end of string
      const exactRegex = new RegExp(`(^|\\s|[,.;!?])${lowerKeyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}($|\\s|[,.;!?])`, 'i');
      exactMatch = exactRegex.test(lowerContent);
      
      if (exactMatch) {
        // Found an exact match
        mockKeywords.push({
          text: keyword,
          relevance: 0.95,
          count: 1
        });
        console.log(`Mock analysis: Exact match for "${keyword}"`);
        
        // If it's a product type (contains "bras"), add it as an entity
        if (keyword.toLowerCase().includes('bras')) {
          mockEntities.push({
            type: "ProductType",
            text: keyword,
            relevance: 0.95,
            confidence: 0.9,
            count: 1
          });
          console.log(`Added product entity: ${keyword}`);
        }
      } else if (lowerContent.includes(lowerKeyword)) {
        // Found a partial match
        mockKeywords.push({
          text: keyword + " (partial)",  // Mark as partial
          relevance: 0.8,
          count: 1
        });
        console.log(`Mock analysis: Partial match for "${keyword}"`);
      } else {
        console.log(`Mock analysis: No match for "${keyword}"`);
      }
    }
    
    // Now add other potential keywords from the text
    for (let i = 0; i < words.length; i++) {
      // Create 1-3 word phrases
      for (let j = 1; j <= 3; j++) {
        if (i + j <= words.length) {
          const phrase = words.slice(i, i + j).join(" ");
          
          // Skip very short phrases and those we already added
          if (phrase.length < 3 || mockKeywords.some(k => k.text.toLowerCase() === phrase.toLowerCase())) {
            continue;
          }
          
          // Add as keyword
          mockKeywords.push({
            text: phrase,
            relevance: 0.7 - (0.1 * j), // Longer phrases get slightly lower relevance
            count: 1
          });
          
          // Check if it's a potential product entity (contains "bras")
          if (phrase.toLowerCase().includes('bras') && 
              !mockEntities.some(e => e.text.toLowerCase() === phrase.toLowerCase())) {
            mockEntities.push({
              type: "ProductType",
              text: phrase,
              relevance: 0.7,
              confidence: 0.8,
              count: 1
            });
          }
        }
      }
    }
    
    // Sort by relevance and take top 15
    mockResults.keywords = mockKeywords
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 15);
    
    // Add entities from original results if any
    if (results.entities && results.entities.length > 0) {
      mockResults.entities = [...mockEntities, ...results.entities];
    } else {
      mockResults.entities = mockEntities;
    }
    
    return mockResults;
  };

  return {
    checkKeywordStatus,
    mockAnalysisForKeywords
  };
};
