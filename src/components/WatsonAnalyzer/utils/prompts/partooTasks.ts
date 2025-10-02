/**
 * Partoo Store Descriptions - Task Builder
 * 
 * @description Builds prompts for generating Partoo store descriptions
 * @author Filippo Danesi
 * @date September 30, 2025
 */

export interface PartooStoreData {
  name: string;
  address: string;
  city: string;
  zipcode: string;
  country: string;
  status: string;
  existingShort?: string;
  existingLong?: string;
  businessOpeningDate?: string;
}

export interface PartooLanguageMapping {
  [key: string]: string;
}

/**
 * Map country codes to language codes
 */
export const COUNTRY_TO_LANGUAGE: PartooLanguageMapping = {
  'IT': 'it-IT',
  'FR': 'fr-FR',
  'PT': 'pt-PT',
  'DE': 'de-DE',
  'AT': 'de-AT',
  'ES': 'es-ES',
  'NL': 'nl-NL',
  'BE': 'nl-BE', // Belgium (Dutch default, French also common)
  'LU': 'fr-LU', // Luxembourg (French default)
  'UK': 'en-GB',
  'GB': 'en-GB',
  'IE': 'en-IE',
  'US': 'en-US',
  'CH': 'de-CH', // Default for Switzerland, can be overridden by city detection
  'HU': 'hu-HU', // Hungary
  'PL': 'pl-PL', // Poland
  'CZ': 'cs-CZ', // Czech Republic
  'SK': 'sk-SK', // Slovakia
  'RO': 'ro-RO', // Romania
  'BG': 'bg-BG', // Bulgaria
  'HR': 'hr-HR', // Croatia
  'SI': 'sl-SI', // Slovenia
  'GR': 'el-GR', // Greece
  'SE': 'sv-SE', // Sweden
  'NO': 'no-NO', // Norway
  'DK': 'da-DK', // Denmark
  'FI': 'fi-FI', // Finland
};

/**
 * Swiss cities and their primary languages
 */
const SWISS_CITY_LANGUAGES: { [key: string]: string } = {
  // German-speaking cities
  'zürich': 'de-CH',
  'zurich': 'de-CH',
  'basel': 'de-CH',
  'bern': 'de-CH',
  'luzern': 'de-CH',
  'lucerne': 'de-CH',
  'winterthur': 'de-CH',
  'st. gallen': 'de-CH',
  'st gallen': 'de-CH',
  
  // French-speaking cities
  'genève': 'fr-CH',
  'geneva': 'fr-CH',
  'lausanne': 'fr-CH',
  'neuchâtel': 'fr-CH',
  'neuchatel': 'fr-CH',
  'fribourg': 'fr-CH',
  'sion': 'fr-CH',
  
  // Italian-speaking cities
  'lugano': 'it-CH',
  'bellinzona': 'it-CH',
  'locarno': 'it-CH',
};

/**
 * Detect language from country and city (special handling for Switzerland)
 */
export function detectLanguage(country: string, city: string): string {
  const countryUpper = country.toUpperCase();
  
  // Special handling for Switzerland
  if (countryUpper === 'CH' || countryUpper === 'SWITZERLAND') {
    const cityLower = city.toLowerCase().trim();
    const detectedLang = SWISS_CITY_LANGUAGES[cityLower];
    if (detectedLang) {
      return detectedLang;
    }
    // Default fallback for Switzerland
    return 'en-GB';
  }
  
  // Standard country-to-language mapping
  return COUNTRY_TO_LANGUAGE[countryUpper] || 'en-GB';
}

/**
 * Check if store is permanently closed
 */
export function isStoreClosed(status: string): boolean {
  const statusLower = status.toLowerCase();
  return statusLower.includes('permanently closed') ||
         statusLower.includes('closed permanently') ||
         statusLower.includes('definitively closed') ||
         statusLower.includes('chiuso definitivamente') ||
         statusLower.includes('fermé définitivement');
}

/**
 * Check if existing description is generic and needs rewriting
 */
export function isGenericDescription(text: string | undefined, city: string): boolean {
  if (!text || text.trim().length === 0) {
    return true; // Empty = generic
  }
  
  // Check if too short
  if (text.length < 40) {
    return true;
  }
  
  // Check for boilerplate phrases
  const boilerplatePatterns = [
    /welcome to our store/i,
    /benvenuti nel nostro/i,
    /bienvenue dans notre/i,
    /willkommen in unserem/i,
    /bienvenido a nuestra/i,
    /welkom in onze/i,
  ];
  
  for (const pattern of boilerplatePatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  // Check for corporate/brand history descriptions (VERY GENERIC)
  // These talk about the company history, global numbers, certifications
  // but NOT about the specific store location and services
  const corporatePatterns = [
    /\d+\s*anni/i,                           // "130 anni", "oltre 130 anni"
    /\d+\s*years/i,                          // "130 years"
    /dal\s*\d{4}/i,                          // "Dal 1886"
    /since\s*\d{4}/i,                        // "Since 1886"
    /depuis\s*\d{4}/i,                       // "Depuis 1886"
    /\d{2,}'?\d{3}\s*(negozi|stores|magasins|geschäfte)/i, // "4'050 negozi", "40'000 clienti"
    /\d{2,}\s*paesi/i,                       // "120 paesi"
    /\d{2,}\s*countries/i,                   // "120 countries"
    /triumph international/i,                // Corporate name
    /business social compliance initiative/i, // BSCI certification
    /globally|globalmente|à l'échelle mondiale/i, // Global scale references
    /worldwide|in tutto il mondo|dans le monde entier/i,
  ];
  
  let corporateMatchCount = 0;
  for (const pattern of corporatePatterns) {
    if (pattern.test(text)) {
      corporateMatchCount++;
    }
  }
  
  // If it has 2+ corporate indicators, it's definitely a generic brand description
  if (corporateMatchCount >= 2) {
    return true;
  }
  
  // Check if it lacks both city AND category references
  const cityLower = city.toLowerCase();
  const textLower = text.toLowerCase();
  
  const hasCityReference = textLower.includes(cityLower);
  const hasCategoryReference = (
    textLower.includes('lingerie') ||
    textLower.includes('fitting') ||
    textLower.includes('reggiseni') ||
    textLower.includes('intimo') ||
    textLower.includes('soutien') ||
    textLower.includes('bra')
  );
  
  // If missing BOTH city and category, it's too generic
  if (!hasCityReference && !hasCategoryReference) {
    return true;
  }
  
  // If it has corporate language AND no city reference, it's generic
  if (corporateMatchCount >= 1 && !hasCityReference) {
    return true;
  }
  
  return false;
}

/**
 * Build the user prompt for a specific store
 */
export function buildPartooStorePrompt(storeData: PartooStoreData, overwritePolicy: 'fill-only' | 'fill-improve' = 'fill-improve'): string {
  const language = detectLanguage(storeData.country, storeData.city);
  const isClosed = isStoreClosed(storeData.status);
  
  let prompt = `LANGUAGE: ${language}

INPUTS:
- Name: ${storeData.name}
- Address: ${storeData.address}, ${storeData.zipcode} ${storeData.city}, ${storeData.country}
- Status: ${storeData.status}`;

  if (storeData.existingShort) {
    prompt += `\n- Existing short description: ${storeData.existingShort}`;
  }
  
  if (storeData.existingLong) {
    prompt += `\n- Existing long description: ${storeData.existingLong}`;
  }

  prompt += `\n\nOUTPUT JSON ONLY:

{
  "short_description": "<35-50 words, plain text>",
  "long_description": "<90-140 words, plain text>"
}

RULES:

1. If Status indicates PERMANENTLY CLOSED:
   Return a neutral closure notice in the appropriate language stating that the Triumph store in ${storeData.city} is permanently closed and directing customers to the brand website for other locations.

2. Language must be ${language} (${language.startsWith('fr') || language.startsWith('pt') ? 'FORMAL' : 'professional but warm'}).

3. Overwrite policy: ${overwritePolicy === 'fill-only' ? 'FILL ONLY empty fields' : 'FILL empty fields + IMPROVE generic descriptions'}`;

  if (overwritePolicy === 'fill-improve') {
    const shortIsGeneric = isGenericDescription(storeData.existingShort, storeData.city);
    const longIsGeneric = isGenericDescription(storeData.existingLong, storeData.city);
    
    if (shortIsGeneric || longIsGeneric) {
      prompt += `\n   - Existing description is GENERIC (corporate/boilerplate text) → COMPLETELY REWRITE
   - DO NOT copy or reuse any corporate history, global statistics, or brand background
   - IGNORE existing text entirely - create fresh, location-specific content`;
    } else {
      prompt += `\n   - Existing description is adequate → IMPROVE clarity and local specificity`;
    }
  }

  prompt += `\n\n4. Content requirements:
   - Write ONLY about THIS SPECIFIC STORE in ${storeData.city}
   - Mention ${storeData.city} and the store location naturally
   - Highlight EXPERT BRA FITTING service offered at this location
   - Focus on LINGERIE FOR EVERYDAY COMFORT available in-store
   - Mention COORDINATED SETS and product selection
   - Keep tone direct, intentional, earnest, personal
   
5. What to AVOID (do NOT include):
   - NO company history (founding years, "since 1886", etc.)
   - NO global statistics (number of stores worldwide, countries, employees)
   - NO brand background (Triumph International, company size)
   - NO certifications or compliance initiatives (BSCI, etc.)
   - NO corporate slogans or mission statements
   - Write as if describing a local boutique, not a global corporation
   
6. Strict formatting constraints:
   - NO links, HTML, emojis, promotional language
   - NO awards, prizes, or unverifiable claims
   - NO superlatives (best, perfect, ultimate, etc.)
   - Output must be PLAIN TEXT only`;

  return prompt;
}

/**
 * Parse the AI response and extract descriptions
 */
export function parsePartooResponse(response: string): { short: string; long: string } | null {
  try {
    // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
    let cleanedResponse = response.trim();
    
    // Remove opening markdown fence (```json or ```)
    cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/i, '');
    
    // Remove closing markdown fence (```)
    cleanedResponse = cleanedResponse.replace(/\n?```\s*$/i, '');
    
    // Trim any remaining whitespace
    cleanedResponse = cleanedResponse.trim();
    
    // Try to parse as JSON
    const parsed = JSON.parse(cleanedResponse);
    
    if (parsed.short_description && parsed.long_description) {
      return {
        short: parsed.short_description.trim(),
        long: parsed.long_description.trim(),
      };
    }
    
    return null;
  } catch (error) {
    // If JSON parsing fails, try to extract from text
    console.error('Failed to parse Partoo response as JSON:', error);
    return null;
  }
}

/**
 * Closed store messages by language
 */
export const CLOSED_STORE_MESSAGES: { [key: string]: { short: string; long: string } } = {
  'it-IT': {
    short: 'Il negozio Triumph di {city} è chiuso definitivamente. Visita il sito del brand per trovare altri punti vendita.',
    long: 'Il negozio Triumph di {city} è chiuso definitivamente. Visita il sito del brand per trovare altri punti vendita.',
  },
  'fr-FR': {
    short: 'Le magasin Triumph de {city} est fermé définitivement. Veuillez consulter le site de la marque pour trouver d\'autres points de vente.',
    long: 'Le magasin Triumph de {city} est fermé définitivement. Veuillez consulter le site de la marque pour trouver d\'autres points de vente.',
  },
  'pt-PT': {
    short: 'A loja Triumph em {city} está encerrada permanentemente. Visite o site da marca para encontrar outras localizações.',
    long: 'A loja Triumph em {city} está encerrada permanentemente. Visite o site da marca para encontrar outras localizações.',
  },
  'de-DE': {
    short: 'Das Triumph-Geschäft in {city} ist dauerhaft geschlossen. Besuchen Sie die Website der Marke, um weitere Standorte zu finden.',
    long: 'Das Triumph-Geschäft in {city} ist dauerhaft geschlossen. Besuchen Sie die Website der Marke, um weitere Standorte zu finden.',
  },
  'de-AT': {
    short: 'Das Triumph-Geschäft in {city} ist dauerhaft geschlossen. Besuchen Sie die Website der Marke, um weitere Standorte zu finden.',
    long: 'Das Triumph-Geschäft in {city} ist dauerhaft geschlossen. Besuchen Sie die Website der Marke, um weitere Standorte zu finden.',
  },
  'de-CH': {
    short: 'Das Triumph-Geschäft in {city} ist dauerhaft geschlossen. Besuchen Sie die Website der Marke, um weitere Standorte zu finden.',
    long: 'Das Triumph-Geschäft in {city} ist dauerhaft geschlossen. Besuchen Sie die Website der Marke, um weitere Standorte zu finden.',
  },
  'fr-CH': {
    short: 'Le magasin Triumph de {city} est fermé définitivement. Veuillez consulter le site de la marque pour trouver d\'autres points de vente.',
    long: 'Le magasin Triumph de {city} est fermé définitivement. Veuillez consulter le site de la marque pour trouver d\'autres points de vente.',
  },
  'it-CH': {
    short: 'Il negozio Triumph di {city} è chiuso definitivamente. Visita il sito del brand per trovare altri punti vendita.',
    long: 'Il negozio Triumph di {city} è chiuso definitivamente. Visita il sito del brand per trovare altri punti vendita.',
  },
  'es-ES': {
    short: 'La tienda Triumph de {city} está cerrada permanentemente. Visite el sitio web de la marca para encontrar otras ubicaciones.',
    long: 'La tienda Triumph de {city} está cerrada permanentemente. Visite el sitio web de la marca para encontrar otras ubicaciones.',
  },
  'nl-NL': {
    short: 'De Triumph-winkel in {city} is permanent gesloten. Bezoek de merkwebsite om andere locaties te vinden.',
    long: 'De Triumph-winkel in {city} is permanent gesloten. Bezoek de merkwebsite om andere locaties te vinden.',
  },
  'en-GB': {
    short: 'The Triumph store in {city} is permanently closed. Please visit the brand website for other locations.',
    long: 'The Triumph store in {city} is permanently closed. Please visit the brand website for other locations.',
  },
  'en-IE': {
    short: 'The Triumph store in {city} is permanently closed. Please visit the brand website for other locations.',
    long: 'The Triumph store in {city} is permanently closed. Please visit the brand website for other locations.',
  },
  'en-US': {
    short: 'The Triumph store in {city} is permanently closed. Please visit the brand website for other locations.',
    long: 'The Triumph store in {city} is permanently closed. Please visit the brand website for other locations.',
  },
};

/**
 * Get closed store message for a specific language and city
 */
export function getClosedStoreMessage(language: string, city: string): { short: string; long: string } {
  const messages = CLOSED_STORE_MESSAGES[language] || CLOSED_STORE_MESSAGES['en-GB'];
  return {
    short: messages.short.replace('{city}', city),
    long: messages.long.replace('{city}', city),
  };
}
