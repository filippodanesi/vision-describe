export enum GenerateSubMode {
  SELECT = 'select',
  IMAGE_ANALYSIS = 'image_analysis',
  CSV_TRANSLATION = 'csv_translation',
}

export enum ImageAnalysisStep {
  SETTINGS = 'settings',
  UPLOAD = 'upload',
  MODEL = 'model',
  PROCESSING = 'processing',
  RESULT = 'result',
}

export enum CsvTranslationStep {
  UPLOAD = 'upload',
  FORMAT_DETECT = 'format_detect',
  LANGUAGES = 'languages',
  MODEL = 'model',
  PROCESSING = 'processing',
  RESULT = 'result',
}

export interface ImageFile {
  base64: string;
  mimeType: string;
  preview: string;
  name: string;
  size: number;
}

export interface ProductSettings {
  language: string;
  category: string;
  certifications: string;
}

export interface VisionApiResponse {
  content: string;
  tokens: {
    inputTokens: number;
    outputTokens: number;
  };
}

// CSV Translation types
export type CSVFormatType = 'triumph' | 'sloggi' | 'beldona' | 'unknown';

export interface CSVFormat {
  type: CSVFormatType;
  headers: string[];
  requiredFields: string[];
}

export interface CSVProduct {
  rowIndex: number;
  materialNumber: string;
  productName: string;
  series: string;
  brand: string;
  subBrand: string;
  originalContent: string;
  rawRow: Record<string, any>;
}

export interface TranslatedProduct {
  product: CSVProduct;
  translations: Record<string, string>;
  errors?: string[];
}

export interface TranslationProgress {
  current: number;
  total: number;
}

export const AVAILABLE_LANGUAGES = [
  { code: 'uk', name: 'English (UK)' },
  { code: 'de', name: 'German (Deutschland)' },
  { code: 'fr', name: 'French (France)' },
  { code: 'it', name: 'Italian (Italia)' },
  { code: 'es', name: 'Spanish (España)' },
  { code: 'nl', name: 'Dutch (Nederland)' },
  { code: 'pt', name: 'Portuguese (Portugal)' },
  { code: 'pl', name: 'Polish (Polska)' },
  { code: 'cz', name: 'Czech (Česká republika)' },
  { code: 'hu', name: 'Hungarian (Magyarország)' },
  { code: 'dk', name: 'Danish (Danmark)' },
  { code: 'se', name: 'Swedish (Sverige)' },
  { code: 'at', name: 'German (Österreich)' },
  { code: 'ch-de', name: 'German (Schweiz)' },
  { code: 'ch-fr', name: 'French (Suisse)' },
  { code: 'ch-it', name: 'Italian (Svizzera)' },
  { code: 'be-fr', name: 'French (Belgique)' },
  { code: 'be-nl', name: 'Dutch (België)' },
] as const;

export const CERTIFICATION_OPTIONS = [
  'OEKO-TEX® Standard 100',
  'GOTS (Global Organic Textile Standard)',
  'Better Cotton Initiative (BCI)',
  'Fair Trade Certified',
  'bluesign®',
] as const;

export const LANGUAGE_MAPPING: Record<string, string> = {
  'cs': 'Czech (Česká republika)',
  'da': 'Danish (Danmark)',
  'nl': 'Dutch (Nederland)',
  'en': 'English',
  'fr': 'French (France)',
  'de': 'German (Deutschland)',
  'hu': 'Hungarian (Magyarország)',
  'it': 'Italian (Italia)',
  'pl': 'Polish (Polska)',
  'pt': 'Portuguese - Portugal',
  'pt-PT': 'Portuguese - Portugal',
  'pt-BR': 'Portuguese - Brazil',
  'es': 'Spanish (España)',
  'sv': 'Swedish (Sverige)',
};
