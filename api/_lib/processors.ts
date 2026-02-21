/**
 * Server-side processor wrappers.
 *
 * Fully self-contained — no imports from src/ to avoid ESM/CJS conflicts
 * on Vercel. System prompts and row data come from the run config stored in DB.
 */
import { callAI, AiResponse } from './aiClients';
import { RunConfig } from './types';

/** Helper to determine provider from model id */
function getProvider(modelId: string): 'openai' | 'anthropic' {
  if (modelId.includes('claude') || modelId.includes('anthropic')) return 'anthropic';
  return 'openai';
}

interface ModelLike {
  id: string;
  provider: 'openai' | 'anthropic';
}

async function serverOptimize(
  userPrompt: string,
  model: ModelLike,
  apiKey: string,
  systemPrompt: string
): Promise<AiResponse> {
  return callAI(apiKey, model.id, model.provider, systemPrompt, userPrompt);
}

// ---------------------------------------------------------------------------
// Dispatcher: process a single row based on use case
// ---------------------------------------------------------------------------
export async function processRow(
  row: Record<string, unknown>,
  rowIndex: number,
  apiKey: string,
  config: RunConfig
): Promise<{ result: Record<string, unknown>; cost: number; tokensIn: number; tokensOut: number }> {
  const model: ModelLike = { id: config.modelId, provider: getProvider(config.modelId) };

  // The client-side processors build a prompt per row and call the AI.
  // On the server, we replicate that: extract the relevant text from the row,
  // build a prompt, call the AI, and store the result back in the row.
  //
  // The system prompt is embedded in the config or we use the row content
  // which already contains the full prompt built by the client-side code.

  switch (config.useCase) {
    case 'partoo':
      return processPartooRow(row, rowIndex, model, apiKey, config);
    case 'amazon':
      return processAmazonRow(row, rowIndex, model, apiKey, config);
    default:
      return processGenericRow(row, rowIndex, model, apiKey, config);
  }
}

// ===========================================================================
// Partoo helpers — inlined from src/ to keep server bundle self-contained
// ===========================================================================

interface PartooStoreData {
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

const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  IT: 'it-IT', FR: 'fr-FR', PT: 'pt-PT', DE: 'de-DE', AT: 'de-AT',
  ES: 'es-ES', NL: 'nl-NL', BE: 'nl-BE', LU: 'fr-LU', UK: 'en-GB',
  GB: 'en-GB', IE: 'en-IE', US: 'en-US', CH: 'de-CH', HU: 'hu-HU',
  PL: 'pl-PL', CZ: 'cs-CZ', SK: 'sk-SK', RO: 'ro-RO', BG: 'bg-BG',
  HR: 'hr-HR', SI: 'sl-SI', GR: 'el-GR', SE: 'sv-SE', NO: 'no-NO',
  DK: 'da-DK', FI: 'fi-FI',
};

const SWISS_CITY_LANGUAGES: Record<string, string> = {
  'zürich': 'de-CH', 'zurich': 'de-CH', 'basel': 'de-CH', 'bern': 'de-CH',
  'luzern': 'de-CH', 'lucerne': 'de-CH', 'winterthur': 'de-CH',
  'st. gallen': 'de-CH', 'st gallen': 'de-CH',
  'genève': 'fr-CH', 'geneva': 'fr-CH', 'lausanne': 'fr-CH',
  'neuchâtel': 'fr-CH', 'neuchatel': 'fr-CH', 'fribourg': 'fr-CH', 'sion': 'fr-CH',
  'lugano': 'it-CH', 'bellinzona': 'it-CH', 'locarno': 'it-CH',
};

function detectLanguage(country: string, city: string): string {
  const cu = country.toUpperCase();
  if (cu === 'CH' || cu === 'SWITZERLAND') {
    return SWISS_CITY_LANGUAGES[city.toLowerCase().trim()] || 'en-GB';
  }
  return COUNTRY_TO_LANGUAGE[cu] || 'en-GB';
}

function isStoreClosed(status: string): boolean {
  const s = status.toLowerCase();
  return s.includes('permanently closed') || s.includes('closed permanently') ||
    s.includes('definitively closed') || s.includes('chiuso definitivamente') ||
    s.includes('fermé définitivement');
}

const CLOSED_STORE_MESSAGES: Record<string, { short: string; long: string }> = {
  'it-IT': { short: 'Il negozio Triumph di {city} è chiuso definitivamente. Visita il sito del brand per trovare altri punti vendita.', long: 'Il negozio Triumph di {city} è chiuso definitivamente. Visita il sito del brand per trovare altri punti vendita.' },
  'fr-FR': { short: 'Le magasin Triumph de {city} est fermé définitivement. Veuillez consulter le site de la marque pour trouver d\'autres points de vente.', long: 'Le magasin Triumph de {city} est fermé définitivement. Veuillez consulter le site de la marque pour trouver d\'autres points de vente.' },
  'de-DE': { short: 'Das Triumph-Geschäft in {city} ist dauerhaft geschlossen. Besuchen Sie die Website der Marke, um weitere Standorte zu finden.', long: 'Das Triumph-Geschäft in {city} ist dauerhaft geschlossen. Besuchen Sie die Website der Marke, um weitere Standorte zu finden.' },
  'de-AT': { short: 'Das Triumph-Geschäft in {city} ist dauerhaft geschlossen. Besuchen Sie die Website der Marke, um weitere Standorte zu finden.', long: 'Das Triumph-Geschäft in {city} ist dauerhaft geschlossen. Besuchen Sie die Website der Marke, um weitere Standorte zu finden.' },
  'de-CH': { short: 'Das Triumph-Geschäft in {city} ist dauerhaft geschlossen. Besuchen Sie die Website der Marke, um weitere Standorte zu finden.', long: 'Das Triumph-Geschäft in {city} ist dauerhaft geschlossen. Besuchen Sie die Website der Marke, um weitere Standorte zu finden.' },
  'fr-CH': { short: 'Le magasin Triumph de {city} est fermé définitivement. Veuillez consulter le site de la marque pour trouver d\'autres points de vente.', long: 'Le magasin Triumph de {city} est fermé définitivement. Veuillez consulter le site de la marque pour trouver d\'autres points de vente.' },
  'it-CH': { short: 'Il negozio Triumph di {city} è chiuso definitivamente. Visita il sito del brand per trovare altri punti vendita.', long: 'Il negozio Triumph di {city} è chiuso definitivamente. Visita il sito del brand per trovare altri punti vendita.' },
  'pt-PT': { short: 'A loja Triumph em {city} está encerrada permanentemente. Visite o site da marca para encontrar outras localizações.', long: 'A loja Triumph em {city} está encerrada permanentemente. Visite o site da marca para encontrar outras localizações.' },
  'es-ES': { short: 'La tienda Triumph de {city} está cerrada permanentemente. Visite el sitio web de la marca para encontrar otras ubicaciones.', long: 'La tienda Triumph de {city} está cerrada permanentemente. Visite el sitio web de la marca para encontrar otras ubicaciones.' },
  'nl-NL': { short: 'De Triumph-winkel in {city} is permanent gesloten. Bezoek de merkwebsite om andere locaties te vinden.', long: 'De Triumph-winkel in {city} is permanent gesloten. Bezoek de merkwebsite om andere locaties te vinden.' },
  'en-GB': { short: 'The Triumph store in {city} is permanently closed. Please visit the brand website for other locations.', long: 'The Triumph store in {city} is permanently closed. Please visit the brand website for other locations.' },
  'en-IE': { short: 'The Triumph store in {city} is permanently closed. Please visit the brand website for other locations.', long: 'The Triumph store in {city} is permanently closed. Please visit the brand website for other locations.' },
  'en-US': { short: 'The Triumph store in {city} is permanently closed. Please visit the brand website for other locations.', long: 'The Triumph store in {city} is permanently closed. Please visit the brand website for other locations.' },
};

function getClosedStoreMessage(language: string, city: string): { short: string; long: string } {
  const m = CLOSED_STORE_MESSAGES[language] || CLOSED_STORE_MESSAGES['en-GB'];
  return { short: m.short.replace('{city}', city), long: m.long.replace('{city}', city) };
}

function isGenericDescription(text: string | undefined, city: string): boolean {
  if (!text || text.trim().length === 0) return true;
  if (text.length < 40) return true;
  const boilerplate = [/welcome to our store/i, /benvenuti nel nostro/i, /bienvenue dans notre/i, /willkommen in unserem/i, /bienvenido a nuestra/i, /welkom in onze/i];
  for (const p of boilerplate) { if (p.test(text)) return true; }
  const corporate = [
    /\d+\s*anni/i, /\d+\s*years/i, /\d+\s*jahren/i, /\d+\s*ans/i,
    /dal\s*\d{4}/i, /since\s*\d{4}/i, /seit\s*\d{4}/i, /depuis\s*\d{4}/i, /desde\s*\d{4}/i,
    /\d{2,}'?\d{3}\s*(negozi|stores|magasins|geschäfte|tiendas|lojas)/i,
    /\d{2,}\s*(paesi|countries|länder|pays|países)/i,
    /triumph international/i, /business social compliance initiative/i,
    /globally|globalmente|à l'échelle mondiale|weltweit/i,
    /worldwide|in tutto il mondo|dans le monde entier|auf der ganzen welt/i,
    /handwerksqualität|qualità artigianale|craftsmanship quality/i,
    /già\s+dal|bereits\s+seit|déjà\s+depuis/i,
  ];
  let cc = 0;
  for (const p of corporate) { if (p.test(text)) cc++; }
  if (cc >= 2) return true;
  const cityLower = city.toLowerCase();
  const textLower = text.toLowerCase();
  const hasCity = textLower.includes(cityLower);
  const hasCat = /lingerie|fitting|reggiseni|intimo|soutien|bra/i.test(text);
  if (!hasCity && !hasCat) return true;
  if (cc >= 1 && !hasCity) return true;
  return false;
}

function categorizeStoreType(groups: string | undefined | null): string {
  if (!groups) return 'Other';
  const entries = groups.split(';').map(s => s.trim().toLowerCase());
  if (entries.some(e => /partner\s+stores/.test(e))) return 'Partner Stores';
  if (entries.some(e => /triumph\s+stores/.test(e))) return 'Triumph Stores';
  return 'Other';
}

function stripMarkdown(s: string): string {
  if (!s) return s;
  let t = s.replace(/<[^>]+>/g, ' ');
  t = t.replace(/\*\*(.*?)\*\*/g, '$1');
  t = t.replace(/\*(.*?)\*/g, '$1');
  t = t.replace(/`([^`]+)`/g, '$1');
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  t = t.replace(/#{1,6}\s/g, '');
  t = t.replace(/\s+/g, ' ');
  return t.trim();
}

function buildPartooStorePrompt(storeData: PartooStoreData, overwritePolicy: 'fill-only' | 'fill-improve' = 'fill-improve'): string {
  const language = detectLanguage(storeData.country, storeData.city);
  let prompt = `Language: ${language}\n\nUse ONLY these details. Do not invent or infer missing information.\n\nINPUTS:\n- Name: ${storeData.name}\n- City: ${storeData.city}\n- Country: ${storeData.country}\n- Status: ${storeData.status}`;
  if (storeData.address) prompt += `\n- Address: ${storeData.address}`;
  if (storeData.zipcode) prompt += `\n- Zipcode: ${storeData.zipcode}`;
  const shortIsGeneric = overwritePolicy === 'fill-improve' && isGenericDescription(storeData.existingShort, storeData.city);
  const longIsGeneric = overwritePolicy === 'fill-improve' && isGenericDescription(storeData.existingLong, storeData.city);
  if (storeData.existingShort && !shortIsGeneric) prompt += `\n- Existing short (for reference): ${storeData.existingShort}`;
  if (storeData.existingLong && !longIsGeneric) prompt += `\n- Existing long (for reference): ${storeData.existingLong}`;
  if (shortIsGeneric || longIsGeneric) {
    prompt += `\n\n⚠️ IMPORTANT: Previous description was GENERIC corporate text (company history, global stats).\nWrite COMPLETELY NEW content using ONLY the store details above.\nDO NOT reference or copy any corporate history, founding dates, global statistics, or brand background.`;
  }
  prompt += `\n\nReturn JSON ONLY (no other text):\n\n{\n  "short_description": "<max 80 characters, plain text>",\n  "long_description": "<max 750 characters, plain text>"\n}\n\nCRITICAL REQUIREMENTS:\n- Write in ${language}. Do not use any other language.\n- ALWAYS mention ${storeData.city} naturally in both descriptions.\n- ${storeData.address ? `Mention ${storeData.address} if it fits naturally.` : 'Address not provided - do not invent one.'}\n- Short description: max 80 characters. Long description: AIM for 600-750 characters — use the full budget for a rich, informative text.\n- Count characters BEFORE responding and ensure both fields are within limits.\n- Use ONLY information from Inputs above. Do not invent details.\n- Focus on: expert bra fitting, lingerie for everyday comfort, coordinated sets.\n- Write naturally to answer local search intents (e.g. "lingerie store in ${storeData.city}", "Triumph near me"). Describe the in-store experience.\n- NO company history, global stats, corporate background, certifications, or mission statements.\n- NO prices, hours, phone, email, directions, promotions, or loyalty programs.\n- Plain text only - no HTML, markdown, links, emojis.`;
  return prompt;
}

function parsePartooResponse(response: string): { short: string; long: string } | null {
  try {
    let c = response.trim();
    c = c.replace(/^```(?:json)?\s*\n?/i, '');
    c = c.replace(/\n?```\s*$/i, '');
    c = c.trim();
    const parsed = JSON.parse(c);
    if (parsed.short_description && parsed.long_description) {
      return { short: parsed.short_description.trim(), long: parsed.long_description.trim() };
    }
    return null;
  } catch { return null; }
}

function buildPartooAboutPrompt(storeData: PartooStoreData, overwritePolicy: 'fill-only' | 'fill-improve' = 'fill-improve'): string {
  const language = detectLanguage(storeData.country, storeData.city);
  const entries = (storeData.groups || '').split(';').map(s => s.trim().toLowerCase());
  const isPartner = entries.some(e => /partner\s+stores/.test(e));
  const isOwnStore = !isPartner && entries.some(e => /triumph\s+stores/.test(e));
  let prompt = `Language: ${language}\n\nUse ONLY these details. Do not invent or infer missing information.\n\nINPUTS:\n- Name: ${storeData.name}\n- City: ${storeData.city}\n- Country: ${storeData.country}`;
  if (storeData.address) prompt += `\n- Address: ${storeData.address}`;
  if (storeData.zipcode) prompt += `\n- Zipcode: ${storeData.zipcode}`;
  if (storeData.mainCategory) prompt += `\n- Category: ${storeData.mainCategory.replace(/_/g, ' ')}`;
  if (storeData.secondaryCategories) prompt += `\n- Additional categories: ${storeData.secondaryCategories.replace(/_/g, ' ')}`;
  if (isOwnStore) prompt += `\n- Store type: Official Triumph store`;
  else if (isPartner) prompt += `\n- Store type: Authorized retailer / partner`;
  const services: string[] = [];
  if (storeData.hasInStoreServices) services.push('in-store fitting service');
  if (storeData.hasBookAFitting) services.push('online fitting appointment booking');
  if (services.length > 0) prompt += `\n- Available services: ${services.join(', ')}`;
  if (storeData.isOutlet) prompt += `\n- Outlet store: yes`;
  const aboutIsGeneric = overwritePolicy === 'fill-improve' && isGenericDescription(storeData.existingAbout, storeData.city);
  if (storeData.existingAbout && !aboutIsGeneric) prompt += `\n- Existing About (for reference): ${storeData.existingAbout}`;
  prompt += `\n\nTASK: Write an "About" text for this store's page on the Triumph store locator website.\nThis text appears on the individual store page and should help local SEO and AI-powered local search results.\n\nCRITICAL REQUIREMENTS:\n- Write in ${language}. Do not use any other language.\n- Maximum 500 characters.\n- ALWAYS mention ${storeData.city} naturally.\n- Light Markdown is allowed: **bold** for emphasis, bullet lists with - for services.\n- Make the text UNIQUE to this specific location using the details provided.\n- Focus on: why visit this store, what services are available, what makes it special locally.\n- This is NOT a product description — it is a presentation of the physical store location.\n- NO company history, global stats, founding dates, corporate background.\n- NO prices, opening hours, phone, email, directions, promotions, loyalty programs.\n- NO HTML, emojis, links, or headings (#).\n\nReturn ONLY the About text (plain Markdown string, NOT JSON). No extra commentary.`;
  return prompt;
}

function parsePartooAboutResponse(response: string): string | null {
  if (!response || !response.trim()) return null;
  let text = response.trim();
  text = text.replace(/^```(?:markdown|md)?\s*\n?/i, '');
  text = text.replace(/\n?```\s*$/i, '');
  text = text.trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
  }
  if (text.length === 0) return null;
  if (text.length > 500) {
    const truncated = text.substring(0, 500);
    const lastPeriod = truncated.lastIndexOf('.');
    text = lastPeriod > 300 ? truncated.substring(0, lastPeriod + 1) : truncated;
  }
  return text;
}

// System prompts (inlined from partooSystemPrompt.ts)
const PARTOO_SYSTEM_PROMPT = `You are a professional copywriter creating localized store descriptions for Triumph retail locations.

LANGUAGE:
- Write in the language specified in the user prompt. Do not use any other language or mix languages.
- French (FR): use formal "vous" form
- Portuguese (PT): use formal tone
- All other languages: professional but warm tone

TONE OF VOICE (Triumph Brand):
- Direct, intentional, earnest, and personal
- Honest and confident; never salesy or preachy
- Elegant and respectful language
- Balance between aspirational and empathetic
- Avoid paternalism, preaching, hyperbole, jokes, or puns
- Focus on SOLUTIONS (comfort, expert bra fitting) rather than empty slogans
- Simple, confident language without being pompous

BRAND VALUES & PERSONALITY:
- Empathy, intuition, dynamism
- Courageous, dedicated, open-minded
- These emerge in HOW we speak; do NOT list them as labels

CONTENT SCOPE:
- Describe ONLY the specific store and its local context
- ALWAYS mention the CITY naturally
- Mention the ADDRESS only if it is provided in Inputs
- Highlight EXPERT BRA FITTING as a key service
- Focus on LINGERIE FOR EVERYDAY COMFORT
- Mention COORDINATED SETS when appropriate
- Use ONLY the information provided in Inputs. If something is missing, omit it gracefully; do NOT invent or infer details.

AI DISCOVERABILITY (for AI Overviews and local recommendation engines):
- Write in natural, conversational sentences that answer common local search intents
- Naturally weave in the store name, city, neighborhood/address, and key services
- Describe the in-store EXPERIENCE rather than just listing facts
- Use varied, specific language
- Prioritize clarity and informativeness

STRICT EXCLUSIONS:
- NO links, HTML/markdown, emojis, or special characters
- NO promotions, discounts, loyalty programs, awards, unverifiable claims, or superlatives
- NO company history, founding dates, years of experience, global statistics
- NO corporate background, certifications, brand mission statements
- NO prices, phone numbers, email addresses, opening hours, or directions UNLESS explicitly provided in Inputs
- Write as if describing a LOCAL BOUTIQUE, not a global corporation
- NEVER copy or reference corporate boilerplate text

NATURAL WRITING — avoid robotic AI patterns:
- BANNED phrases: "in the heart of" / "nel cuore di" / "au cœur de" / "im Herzen von", "nestled", "vibrant", "boasts", "showcasing", "testament", "tapestry", "pivotal", "fostering", "renowned", "a benchmark", "commitment to"
- BANNED structures: "Not only... but also...", three-adjective triads, em-dash dramatic clauses, trailing "-ing" phrases
- USE simple copulatives: prefer "is" / "è" / "ist" / "est" over inflated synonyms
- VARY sentence openings
- Write like a local shop owner would speak

OVERWRITE POLICY:
- If existing text is GENERIC (shorter than 40 characters, boilerplate, or missing both city and lingerie category), REWRITE FULLY
- Otherwise, IMPROVE clarity and local specificity while keeping all constraints

LENGTH & FORMAT:
- Short description: maximum 80 characters
- Long description: AIM for 600-750 characters
- COUNT characters and ensure BOTH fields are within limits BEFORE responding
- Output JSON ONLY with these exact keys: "short_description", "long_description"

PERMANENTLY CLOSED STORES:
- If Inputs indicate the store is permanently closed, return closure message translated in the appropriate language

FAIL-SAFE:
- If you cannot comply with these constraints, return a minimal compliant JSON with empty strings for both fields`;

const PARTOO_ABOUT_SYSTEM_PROMPT = `You are a professional copywriter specializing in local SEO content for store locator pages.
You write unique "About" texts for individual Triumph retail store pages that improve local search visibility.

LANGUAGE:
- Write in the language specified in the user prompt. Do not use any other language or mix languages.
- French (FR): use formal "vous" form
- Portuguese (PT): use formal tone
- All other languages: professional but warm tone

TONE OF VOICE (Triumph Brand):
- Direct, intentional, earnest, and personal
- Honest and confident; never salesy or preachy
- Simple, confident language without being pompous

CONTENT SCOPE:
- Present THIS SPECIFIC STORE LOCATION — not the Triumph brand globally
- ALWAYS mention the CITY naturally for local SEO
- Highlight available services (fitting, booking, outlet) when provided
- Differentiate between official Triumph stores and authorized retailers
- Focus on: why someone nearby should visit, what they will find, what services are available
- Use ONLY the information provided in Inputs.

STRICT EXCLUSIONS:
- NO company history, founding dates, years of experience, global statistics
- NO corporate background, certifications, brand mission statements
- NO prices, phone numbers, email addresses, opening hours, or directions
- NO promotions, discounts, loyalty programs, awards, or superlatives
- NO links, HTML tags, emojis, or headings

NATURAL WRITING — avoid robotic AI patterns:
- BANNED phrases: "in the heart of", "nestled", "vibrant", "boasts", "showcasing", "testament", "renowned", "commitment to"
- BANNED structures: "Not only... but also...", three-adjective triads, em-dash dramatic clauses
- Use **bold** sparingly — maximum 2 bold phrases; never bold the city name or brand name
- Write like a local shop owner would speak

FORMAT:
- Maximum 500 characters
- Light Markdown is ALLOWED: **bold** for emphasis (max 2 uses), bullet lists with - for key services
- Output ONLY the About text as a plain Markdown string
- Do NOT wrap in JSON, code blocks, or quotes

FAIL-SAFE:
- If you cannot comply, return a minimal one-sentence description mentioning the city and store type`;

// ---------------------------------------------------------------------------
// Partoo processor — full port of client-side logic
// ---------------------------------------------------------------------------
async function processPartooRow(
  row: Record<string, unknown>,
  rowIndex: number,
  model: ModelLike,
  apiKey: string,
  config: RunConfig
): Promise<{ result: Record<string, unknown>; cost: number; tokensIn: number; tokensOut: number }> {
  const processed = { ...row } as any;
  let totalIn = 0;
  let totalOut = 0;

  const mapping = config.mappings?.mapping as Record<string, string> || config.mappings as Record<string, string> || {};
  const overwritePolicy = (config as any).overwritePolicy || 'fill-improve';

  // Column keys from mapping or Partoo Excel defaults
  const nameKey = mapping.name || 'Name';
  const cityKey = mapping.city || 'City';
  const countryKey = mapping.country || 'Country';
  const addressKey = mapping.address || 'Address';
  const zipcodeKey = mapping.zipcode || 'Zipcode';
  const statusKey = mapping.status || 'Status';
  const mappingShortKey = mapping.shortDescription || 'Short description';
  const mappingLongKey = mapping.longDescription || 'Long description';
  const aboutKey = mapping.about || 'About';
  const groupsKey = mapping.groups || 'Groupes';
  const mainCategoryKey = mapping.mainCategory || 'Catégorie principale';
  const secondaryCategoriesKey = mapping.secondaryCategories || 'Catégories additionnelles';
  const inStoreServicesKey = mapping.inStoreServices || 'In Store Services';
  const bookAFittingKey = mapping.bookAFitting || 'Book a Fitting';
  const triumphOutletsKey = mapping.triumphOutlets || 'Triumph Outlets';

  const name = String(row[nameKey] ?? '').trim();
  const city = String(row[cityKey] ?? '').trim();
  const country = String(row[countryKey] ?? '').trim();
  const address = String(row[addressKey] ?? '').trim();
  const zipcode = String(row[zipcodeKey] ?? '').trim();
  const status = String(row[statusKey] ?? 'open').trim();

  // Dynamic column picking for language-specific description columns
  const language = detectLanguage(country, city);
  const deriveLangCodes = (lang: string): string[] => {
    if (!lang) return [];
    const lower = lang.toLowerCase();
    const parts = lower.split(/[-_]/g);
    const codes: string[] = [lower];
    if (parts.length > 0) codes.push(parts[0]);
    if (parts.length > 1) codes.push(parts[1]);
    return [...new Set(codes.filter(Boolean))];
  };
  const langCodes = deriveLangCodes(language);

  const pickDescriptionColumn = (type: 'short' | 'long'): string => {
    const baseProvided = type === 'short' ? mappingShortKey : mappingLongKey;
    if (baseProvided in row) return baseProvided;
    const cols = Object.keys(row);
    const regex = type === 'short' ? /short\s+description/i : /long\s+description/i;
    const candidates = cols.filter(c => regex.test(c));
    if (candidates.length === 0) return baseProvided;
    for (const code of langCodes) {
      const codeRegex = new RegExp(`(^|\\s|[_-])${code}(\\s|$)`, 'i');
      const hit = candidates.find(c => codeRegex.test(c.toLowerCase()));
      if (hit) return hit;
    }
    const sorted = [...candidates].sort((a, b) => a.length - b.length);
    return sorted[0];
  };

  const shortDescKey = pickDescriptionColumn('short');
  const longDescKey = pickDescriptionColumn('long');

  const existingShort = String(row[shortDescKey] ?? '').trim() || undefined;
  const existingLong = String(row[longDescKey] ?? '').trim() || undefined;
  const existingAbout = String(row[aboutKey] ?? '').trim() || undefined;
  const groups = String(row[groupsKey] ?? '').trim() || undefined;
  const mainCategory = String(row[mainCategoryKey] ?? '').trim() || undefined;
  const secondaryCategories = String(row[secondaryCategoriesKey] ?? '').trim() || undefined;
  const inStoreServicesRaw = String(row[inStoreServicesKey] ?? '').trim().toUpperCase();
  const bookAFittingRaw = String(row[bookAFittingKey] ?? '').trim();
  const triumphOutletsRaw = String(row[triumphOutletsKey] ?? '').trim().toUpperCase();
  const hasAboutColumn = aboutKey in row || Object.keys(row).some(k => /^about$/i.test(k));

  // Skip if missing required fields
  if (!name || !city || !country) {
    return { result: processed, cost: 0, tokensIn: 0, tokensOut: 0 };
  }

  // Handle permanently closed stores
  if (isStoreClosed(status)) {
    const closureMsg = getClosedStoreMessage(language, city);
    processed[shortDescKey] = closureMsg.short;
    processed[longDescKey] = closureMsg.long;
    return { result: processed, cost: 0, tokensIn: 0, tokensOut: 0 };
  }

  // Check what needs generation
  let needsShort = !existingShort;
  let needsLong = !existingLong;
  if (overwritePolicy === 'fill-improve') {
    if (existingShort && isGenericDescription(existingShort, city)) needsShort = true;
    if (existingLong && isGenericDescription(existingLong, city)) needsLong = true;
  }

  let needsAbout = false;
  if (hasAboutColumn) {
    if (!existingAbout) {
      needsAbout = true;
    } else if (overwritePolicy === 'fill-improve' && isGenericDescription(existingAbout, city)) {
      needsAbout = true;
    }
  }

  // If nothing to generate, skip
  if (!needsShort && !needsLong && !needsAbout) {
    return { result: processed, cost: 0, tokensIn: 0, tokensOut: 0 };
  }

  // Build store data
  const storeData: PartooStoreData = {
    name, address, city, zipcode, country, status,
    existingShort, existingLong, existingAbout, groups, mainCategory, secondaryCategories,
    hasInStoreServices: inStoreServicesRaw === 'TRUE',
    hasBookAFitting: !!bookAFittingRaw && bookAFittingRaw.toLowerCase() !== 'false',
    isOutlet: triumphOutletsRaw === 'TRUE',
  };

  // Short + Long description generation
  if (needsShort || needsLong) {
    const userPrompt = buildPartooStorePrompt(storeData, overwritePolicy);
    const res = await serverOptimize(userPrompt, model, apiKey, PARTOO_SYSTEM_PROMPT);
    totalIn += res.tokens.inputTokens;
    totalOut += res.tokens.outputTokens;

    const parsed = parsePartooResponse(res.content);
    if (parsed) {
      if (needsShort) processed[shortDescKey] = stripMarkdown(parsed.short);
      if (needsLong) processed[longDescKey] = stripMarkdown(parsed.long);
    } else {
      // Fallback: store raw response
      processed[longDescKey] = res.content;
    }
  }

  // About field generation (separate AI call, Markdown preserved)
  if (needsAbout) {
    const aboutPrompt = buildPartooAboutPrompt(storeData, overwritePolicy);
    const aboutRes = await serverOptimize(aboutPrompt, model, apiKey, PARTOO_ABOUT_SYSTEM_PROMPT);
    totalIn += aboutRes.tokens.inputTokens;
    totalOut += aboutRes.tokens.outputTokens;

    const parsedAbout = parsePartooAboutResponse(aboutRes.content);
    if (parsedAbout) {
      processed[aboutKey] = parsedAbout;
    }
  }

  return { result: processed, cost: 0, tokensIn: totalIn, tokensOut: totalOut };
}

// ---------------------------------------------------------------------------
// Amazon processor (simplified server-side version)
// ---------------------------------------------------------------------------
async function processAmazonRow(
  row: Record<string, unknown>,
  rowIndex: number,
  model: ModelLike,
  apiKey: string,
  config: RunConfig
): Promise<{ result: Record<string, unknown>; cost: number; tokensIn: number; tokensOut: number }> {
  const processed = { ...row } as any;
  const mapping = config.mappings?.mapping as Record<string, any> || config.mappings as Record<string, any> || {};
  let totalIn = 0;
  let totalOut = 0;

  const titleKey = mapping.title || 'item_name#1.value';
  const descKey = mapping.descriptionIn || 'rtip_product_description#1.value';
  const title = String(row[titleKey] ?? '');
  const descriptionIn = String(row[descKey] ?? '');
  const language = config.lang || 'en';

  const systemPrompt = 'You are an Amazon product listing specialist. Write compelling, compliant product content.';

  // 1) Bullets
  const bulletsPrompt = `Generate exactly 5 bullet points for this Amazon product listing.
Title: ${title}
Description: ${descriptionIn}
Language: ${language}

Return ONLY the 5 bullet points, one per line, without numbering or bullet markers.`;

  const bulletsRes = await serverOptimize(bulletsPrompt, model, apiKey, systemPrompt);
  totalIn += bulletsRes.tokens.inputTokens;
  totalOut += bulletsRes.tokens.outputTokens;
  const bullets = bulletsRes.content.split('\n').map(b => b.trim()).filter(Boolean).slice(0, 5);
  processed.gen_bullet_1 = bullets[0] || '—';
  processed.gen_bullet_2 = bullets[1] || '—';
  processed.gen_bullet_3 = bullets[2] || '—';
  processed.gen_bullet_4 = bullets[3] || '—';
  processed.gen_bullet_5 = bullets[4] || '—';

  // 2) Description
  const descPrompt = `Write a product description paragraph for this Amazon listing.
Title: ${title}
Bullet points: ${bullets.join('; ')}
Language: ${language}

Return ONLY the description paragraph, no formatting.`;

  const descRes = await serverOptimize(descPrompt, model, apiKey, systemPrompt);
  totalIn += descRes.tokens.inputTokens;
  totalOut += descRes.tokens.outputTokens;
  processed.gen_description = descRes.content;

  // 3) A+ short (max 300 chars)
  const aplusPrompt = `Write A+ short content (max 300 characters) for this Amazon product.
Title: ${title}
Description: ${processed.gen_description}
Language: ${language}

Return ONLY the short text, max 300 characters.`;

  const aplusRes = await serverOptimize(aplusPrompt, model, apiKey, systemPrompt);
  totalIn += aplusRes.tokens.inputTokens;
  totalOut += aplusRes.tokens.outputTokens;
  processed.gen_aplus_short = aplusRes.content.slice(0, 300);

  return { result: processed, cost: 0, tokensIn: totalIn, tokensOut: totalOut };
}

// ---------------------------------------------------------------------------
// Generic row processor (ecommerce, next, aboutyou, etc.)
// ---------------------------------------------------------------------------
async function processGenericRow(
  row: Record<string, unknown>,
  rowIndex: number,
  model: ModelLike,
  apiKey: string,
  config: RunConfig
): Promise<{ result: Record<string, unknown>; cost: number; tokensIn: number; tokensOut: number }> {
  const processed = { ...row } as any;
  let totalIn = 0;
  let totalOut = 0;

  const columns = config.selectedColumns || [];
  const systemPrompt = 'You are a professional copywriter specializing in e-commerce product descriptions. Optimize the given text for clarity and engagement.';

  for (const column of columns) {
    const original = row[column];
    if (!original || typeof original !== 'string') continue;

    const userPrompt = `Optimize this product description:\n\n"${original}"`;
    const res = await serverOptimize(userPrompt, model, apiKey, systemPrompt);
    totalIn += res.tokens.inputTokens;
    totalOut += res.tokens.outputTokens;
    processed[column] = res.content;
  }

  return { result: processed, cost: 0, tokensIn: totalIn, tokensOut: totalOut };
}
