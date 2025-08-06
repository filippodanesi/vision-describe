
import { ExportData } from './exportTypes';

// Prepare data for export in JSON format
export const prepareExportData = (results: any): string => {
  if (!results) return "";

  const exportData: ExportData = {
    metadata: {
      language: results.language || "unknown",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    },
    statistics: {},
    analysis: {
      analyzedText: results.analyzedText || results.text || ""
    }
  };

  // Extract keywords data if available
  if (results.keywords && results.keywords.length > 0) {
    exportData.analysis.keywords = results.keywords.map((keyword: any) => ({
      text: keyword.text,
      relevance: keyword.relevance,
      sentiment: keyword.sentiment ? {
        score: keyword.sentiment.score,
        label: keyword.sentiment.label
      } : null
    }));
  }

  // Extract entities data if available
  if (results.entities && results.entities.length > 0) {
    exportData.analysis.entities = results.entities.map((entity: any) => ({
      text: entity.text,
      type: entity.type,
      relevance: entity.relevance,
      confidence: entity.confidence,
      sentiment: entity.sentiment ? {
        score: entity.sentiment.score,
        label: entity.sentiment.label
      } : null
    }));
  }

  // Extract concepts data if available
  if (results.concepts && results.concepts.length > 0) {
    exportData.analysis.concepts = results.concepts.map((concept: any) => ({
      text: concept.text,
      relevance: concept.relevance,
      dbpedia_resource: concept.dbpedia_resource
    }));
  }

  // Extract categories data if available
  if (results.categories && results.categories.length > 0) {
    exportData.analysis.categories = results.categories.map((category: any) => ({
      label: category.label,
      score: category.score,
      explanation: category.explanation
    }));
  }

  // Extract classifications/tone data if available
  if (results.classifications && results.classifications.length > 0) {
    exportData.analysis.classifications = results.classifications.map((classification: any) => ({
      class_name: classification.class_name,
      confidence: classification.confidence
    }));
  }

  return JSON.stringify(exportData, null, 2);
};
