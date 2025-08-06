
// Generate CSV content from results with better organization
export const generateCsvContent = (results: any): string => {
  if (!results) return "";
  
  let csvContent = "";
  
  // Add metadata section header
  csvContent += "## METADATA ##\n";
  csvContent += "Language," + (results.language || "unknown") + "\n";
  csvContent += "Timestamp," + new Date().toISOString() + "\n";
  csvContent += "Version,1.0.0\n\n";
  
  // Add analyzed text section
  csvContent += "## ANALYZED TEXT ##\n";
  const analyzedText = results.analyzedText || results.text || "";
  csvContent += `"${analyzedText.replace(/"/g, '""')}"\n\n`;
  
  // Add keyword section if available
  if (results.keywords && results.keywords.length > 0) {
    csvContent += "## KEYWORDS ##\n";
    csvContent += "Text,Relevance,Sentiment Score,Sentiment Label\n";
    
    results.keywords.forEach((keyword: any) => {
      const sentimentScore = keyword.sentiment ? keyword.sentiment.score : "";
      const sentimentLabel = keyword.sentiment ? keyword.sentiment.label : "";
      const row = [
        `"${keyword.text.replace(/"/g, '""')}"`, 
        keyword.relevance,
        sentimentScore,
        sentimentLabel
      ];
      csvContent += row.join(",") + "\n";
    });
    csvContent += "\n";
  }

  // Add entity section if available
  if (results.entities && results.entities.length > 0) {
    csvContent += "## ENTITIES ##\n";
    csvContent += "Text,Type,Relevance,Confidence,Sentiment Score,Sentiment Label\n";
    
    results.entities.forEach((entity: any) => {
      const sentimentScore = entity.sentiment ? entity.sentiment.score : "";
      const sentimentLabel = entity.sentiment ? entity.sentiment.label : "";
      const row = [
        `"${entity.text.replace(/"/g, '""')}"`,
        entity.type,
        entity.relevance,
        entity.confidence,
        sentimentScore,
        sentimentLabel
      ];
      csvContent += row.join(",") + "\n";
    });
    csvContent += "\n";
  }

  // Add concepts section if available
  if (results.concepts && results.concepts.length > 0) {
    csvContent += "## CONCEPTS ##\n";
    csvContent += "Text,Relevance,DBpedia Resource\n";
    
    results.concepts.forEach((concept: any) => {
      const row = [
        `"${concept.text.replace(/"/g, '""')}"`,
        concept.relevance,
        `"${concept.dbpedia_resource}"`
      ];
      csvContent += row.join(",") + "\n";
    });
    csvContent += "\n";
  }

  // Add categories section if available
  if (results.categories && results.categories.length > 0) {
    csvContent += "## CATEGORIES ##\n";
    csvContent += "Label,Score,Explanation\n";
    
    results.categories.forEach((category: any) => {
      const row = [
        `"${category.label.replace(/"/g, '""')}"`,
        category.score,
        `"${category.explanation?.replace(/"/g, '""') || ""}"`
      ];
      csvContent += row.join(",") + "\n";
    });
    csvContent += "\n";
  }

  // Add classifications/tone section if available
  if (results.classifications && results.classifications.length > 0) {
    csvContent += "## TONE ANALYSIS ##\n";
    csvContent += "Class Name,Confidence\n";
    
    results.classifications.forEach((classification: any) => {
      const row = [
        `"${classification.class_name.replace(/"/g, '""')}"`,
        classification.confidence
      ];
      csvContent += row.join(",") + "\n";
    });
  }

  return csvContent;
};
