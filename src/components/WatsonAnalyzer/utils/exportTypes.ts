
// Type definitions for export data
export interface ExportData {
  metadata: {
    language: string;
    timestamp: string;
    version: string;
  };
  statistics: Record<string, any>;
  analysis: {
    analyzedText?: string;
    keywords?: Array<{
      text: string;
      relevance: number;
      sentiment?: {
        score: number;
        label: string;
      } | null;
    }>;
    entities?: Array<{
      text: string;
      type: string;
      relevance: number;
      confidence: number;
      sentiment?: {
        score: number;
        label: string;
      } | null;
    }>;
    concepts?: Array<{
      text: string;
      relevance: number;
      dbpedia_resource: string;
    }>;
    categories?: Array<{
      label: string;
      score: number;
      explanation: string;
    }>;
    classifications?: Array<{
      class_name: string;
      confidence: number;
    }>;
  };
}
