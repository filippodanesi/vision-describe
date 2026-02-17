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
  existingAbout?: string;
  groups?: string;
  mainCategory?: string;
  secondaryCategories?: string;
  hasInStoreServices?: boolean;
  hasBookAFitting?: boolean;
  isOutlet?: boolean;
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
    /\d+\s*anni/i,                           // "130 anni", "oltre 130 anni" (IT)
    /\d+\s*years/i,                          // "130 years" (EN)
    /\d+\s*jahren/i,                         // "130 Jahren" (DE)
    /\d+\s*ans/i,                            // "130 ans" (FR)
    /dal\s*\d{4}/i,                          // "Dal 1886" (IT)
    /since\s*\d{4}/i,                        // "Since 1886" (EN)
    /seit\s*\d{4}/i,                         // "Seit 1886" (DE)
    /depuis\s*\d{4}/i,                       // "Depuis 1886" (FR)
    /desde\s*\d{4}/i,                        // "Desde 1886" (ES/PT)
    /\d{2,}'?\d{3}\s*(negozi|stores|magasins|geschäfte|tiendas|lojas)/i, // "4'050 negozi"
    /\d{2,}\s*(paesi|countries|länder|pays|países)/i, // "120 paesi/countries/länder"
    /triumph international/i,                // Corporate name
    /business social compliance initiative/i, // BSCI certification
    /globally|globalmente|à l'échelle mondiale|weltweit/i, // Global scale
    /worldwide|in tutto il mondo|dans le monde entier|auf der ganzen welt/i, // Worldwide
    /auf der ganzen welt|frauen auf der ganzen welt/i, // "donne in tutto il mondo" (DE)
    /handwerksqualität|qualità artigianale|craftsmanship quality/i, // Generic quality claims
    /già\s+dal|bereits\s+seit|déjà\s+depuis/i, // "Già dal/Bereits seit/Déjà depuis" + year
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
  
  // Build inputs section
  let prompt = `Language: ${language}

Use ONLY these details. Do not invent or infer missing information.

INPUTS:
- Name: ${storeData.name}
- City: ${storeData.city}
- Country: ${storeData.country}
- Status: ${storeData.status}`;

  // Add optional fields only if provided
  if (storeData.address) {
    prompt += `\n- Address: ${storeData.address}`;
  }
  
  if (storeData.zipcode) {
    prompt += `\n- Zipcode: ${storeData.zipcode}`;
  }

  // Check if existing descriptions are generic
  const shortIsGeneric = overwritePolicy === 'fill-improve' && isGenericDescription(storeData.existingShort, storeData.city);
  const longIsGeneric = overwritePolicy === 'fill-improve' && isGenericDescription(storeData.existingLong, storeData.city);

  // Only include existing text if it's NOT generic (for reference/improvement)
  // If generic, we completely IGNORE it and write fresh content
  if (storeData.existingShort && !shortIsGeneric) {
    prompt += `\n- Existing short (for reference): ${storeData.existingShort}`;
  }
  
  if (storeData.existingLong && !longIsGeneric) {
    prompt += `\n- Existing long (for reference): ${storeData.existingLong}`;
  }

  // Add explicit note if we're replacing generic text
  if (shortIsGeneric || longIsGeneric) {
    prompt += `\n\n⚠️ IMPORTANT: Previous description was GENERIC corporate text (company history, global stats).
Write COMPLETELY NEW content using ONLY the store details above.
DO NOT reference or copy any corporate history, founding dates, global statistics, or brand background.`;
  }

  // Output format
  prompt += `\n\nReturn JSON ONLY (no other text):

{
  "short_description": "<max 80 characters, plain text>",
  "long_description": "<max 750 characters, plain text>"
}

CRITICAL REQUIREMENTS:
- Write in ${language}. Do not use any other language.
- ALWAYS mention ${storeData.city} naturally in both descriptions.
- ${storeData.address ? `Mention ${storeData.address} if it fits naturally.` : 'Address not provided - do not invent one.'}
- Short description: max 80 characters. Long description: AIM for 600-750 characters — use the full budget for a rich, informative text.
- Count characters BEFORE responding and ensure both fields are within limits.
- Use ONLY information from Inputs above. Do not invent details.
- Focus on: expert bra fitting, lingerie for everyday comfort, coordinated sets.
- Write naturally to answer local search intents (e.g. "lingerie store in ${storeData.city}", "Triumph near me"). Describe the in-store experience.
- NO company history, global stats, corporate background, certifications, or mission statements.
- NO prices, hours, phone, email, directions, promotions, or loyalty programs.
- Plain text only - no HTML, markdown, links, emojis.`;

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

/**
 * Build the user prompt for About field generation (store locator page)
 */
export function buildPartooAboutPrompt(storeData: PartooStoreData, overwritePolicy: 'fill-only' | 'fill-improve' = 'fill-improve'): string {
  const language = detectLanguage(storeData.country, storeData.city);

  // Determine store type from groups (same logic as categorizeStoreType)
  const entries = (storeData.groups || '').split(';').map(s => s.trim().toLowerCase());
  const isPartner = entries.some(e => /partner\s+stores/.test(e));
  const isOwnStore = !isPartner && entries.some(e => /triumph\s+stores/.test(e));

  let prompt = `Language: ${language}

Use ONLY these details. Do not invent or infer missing information.

INPUTS:
- Name: ${storeData.name}
- City: ${storeData.city}
- Country: ${storeData.country}`;

  if (storeData.address) {
    prompt += `\n- Address: ${storeData.address}`;
  }
  if (storeData.zipcode) {
    prompt += `\n- Zipcode: ${storeData.zipcode}`;
  }
  if (storeData.mainCategory) {
    prompt += `\n- Category: ${storeData.mainCategory.replace(/_/g, ' ')}`;
  }
  if (storeData.secondaryCategories) {
    prompt += `\n- Additional categories: ${storeData.secondaryCategories.replace(/_/g, ' ')}`;
  }

  // Store type
  if (isOwnStore) {
    prompt += `\n- Store type: Official Triumph store`;
  } else if (isPartner) {
    prompt += `\n- Store type: Authorized retailer / partner`;
  }

  // Services
  const services: string[] = [];
  if (storeData.hasInStoreServices) services.push('in-store fitting service');
  if (storeData.hasBookAFitting) services.push('online fitting appointment booking');
  if (services.length > 0) {
    prompt += `\n- Available services: ${services.join(', ')}`;
  }

  if (storeData.isOutlet) {
    prompt += `\n- Outlet store: yes`;
  }

  // Existing About for reference
  const aboutIsGeneric = overwritePolicy === 'fill-improve' && isGenericDescription(storeData.existingAbout, storeData.city);
  if (storeData.existingAbout && !aboutIsGeneric) {
    prompt += `\n- Existing About (for reference): ${storeData.existingAbout}`;
  }

  prompt += `

TASK: Write an "About" text for this store's page on the Triumph store locator website.
This text appears on the individual store page and should help local SEO and AI-powered local search results.

CRITICAL REQUIREMENTS:
- Write in ${language}. Do not use any other language.
- Maximum 500 characters.
- ALWAYS mention ${storeData.city} naturally.
- Light Markdown is allowed: **bold** for emphasis, bullet lists with - for services.
- Make the text UNIQUE to this specific location using the details provided.
- Focus on: why visit this store, what services are available, what makes it special locally.
- This is NOT a product description — it is a presentation of the physical store location.
- NO company history, global stats, founding dates, corporate background.
- NO prices, opening hours, phone, email, directions, promotions, loyalty programs.
- NO HTML, emojis, links, or headings (#).

Return ONLY the About text (plain Markdown string, NOT JSON). No extra commentary.`;

  return prompt;
}

/**
 * Parse the AI response for About field
 */
export function parsePartooAboutResponse(response: string): string | null {
  if (!response || !response.trim()) return null;

  let text = response.trim();

  // Remove markdown code fences if present
  text = text.replace(/^```(?:markdown|md)?\s*\n?/i, '');
  text = text.replace(/\n?```\s*$/i, '');
  text = text.trim();

  // Remove surrounding quotes if present
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
  }

  // Validate length
  if (text.length === 0) return null;
  if (text.length > 500) {
    // Truncate at last complete sentence within 500 chars
    const truncated = text.substring(0, 500);
    const lastPeriod = truncated.lastIndexOf('.');
    if (lastPeriod > 300) {
      text = truncated.substring(0, lastPeriod + 1);
    } else {
      text = truncated;
    }
  }

  return text;
}
