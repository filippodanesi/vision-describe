/**
 * 
 * @author Filippo Danesi
 * @created September 30, 2025
 * @description Core processing logic for Partoo store descriptions.
 *              Handles AI-powered content generation for Triumph retail store
 *              listings including short and long descriptions.
 * 
 * Key Features:
 * - Processes Partoo store data from Excel/CSV files
 * - Generates localized short descriptions (max 80 characters)
 * - Generates localized long descriptions (max 750 characters)
 * - Automatic language detection from country code
 * - Special handling for Switzerland (multi-lingual)
 * - Handles permanently closed stores
 * - Brand Tone of Voice compliance (Triumph)
 * - Overwrite policy support (fill-only vs fill-improve)
 * - Optional business ID filtering for selective processing
 */

import { Model } from '@/lib/models';
import { optimizeTextWithAI } from '../utils/optimizationUtils';
import { PARTOO_SYSTEM_PROMPT, PARTOO_ABOUT_SYSTEM_PROMPT } from '../utils/prompts/partooSystemPrompt';
import {
  buildPartooStorePrompt,
  parsePartooResponse,
  buildPartooAboutPrompt,
  parsePartooAboutResponse,
  detectLanguage,
  isStoreClosed,
  isGenericDescription,
  getClosedStoreMessage,
  type PartooStoreData,
} from '../utils/prompts/partooTasks';

export interface PartooMapping {
  businessId?: string;
  name?: string;
  address?: string;
  city?: string;
  zipcode?: string;
  country?: string;
  status?: string;
  shortDescription?: string;
  longDescription?: string;
  businessOpeningDate?: string;
  about?: string;
  groups?: string;
  mainCategory?: string;
  secondaryCategories?: string;
  inStoreServices?: string;
  bookAFitting?: string;
  triumphOutlets?: string;
}

/**
 * Column patterns to SKIP (administrative/technical fields)
 * Note: "Business identification" is NOT skipped - it's used as the store ID
 */
const SKIP_COLUMNS = [
  /^Business Id$/i,  // Alternative ID field (not used)
  /^Code$/i,
  /^Local or global$/i,
  /^Creation date$/i,
  /^Closed date$/i,
  /^SIRET$/i,
  /^Address complement$/i,
  /^Unnamed:/i,
];

/**
 * Check if a column should be skipped
 */
function shouldSkipColumn(columnName: string): boolean {
  return SKIP_COLUMNS.some(pattern => pattern.test(columnName));
}

/**
 * Processes Partoo store rows and generates optimized descriptions
 * 
 * @param rows - Array of store data rows from Excel/CSV
 * @param model - AI model configuration (OpenAI or Anthropic)
 * @param apiKey - API key for the selected model
 * @param mapping - Column mapping configuration for Partoo fields
 * @param overwritePolicy - 'fill-only' or 'fill-improve'
 * @param addLog - Optional logging function for progress tracking
 * @param costTracker - Optional cost tracking utility
 * @param businessIdsFilter - Optional Set of business IDs to process (if provided, only these will be processed)
 * @returns Promise<any[]> - Processed rows with generated descriptions
 * 
 * Processing Flow:
 * 1. Extract store data using column mapping
 * 2. [NEW] Check if business ID is in filter (if filter provided)
 * 3. Detect language from country code (with special handling for CH)
 * 4. Check if store is permanently closed
 * 5. Generate or improve short description (max 80 characters)
 * 6. Generate or improve long description (max 750 characters)
 * 7. Validate output format (plain text, no HTML/emojis)
 * 8. Return enhanced store data
 */
export async function processPartooRows(
  rows: any[],
  model: Model,
  apiKey: string,
  mapping: PartooMapping,
  overwritePolicy: 'fill-only' | 'fill-improve' = 'fill-improve',
  addLog?: (msg: string) => void,
  costTracker?: any,
  businessIdsFilter?: Set<string> | null
): Promise<any[]> {
  const out: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const processed = { ...row } as any;

    // Extract static mapping keys (these may be overridden dynamically per row for short/long description)
    const businessIdKey = mapping.businessId || 'Business identification';
    const nameKey = mapping.name || 'Name';
    const addressKey = mapping.address || 'Address';
    const cityKey = mapping.city || 'City';
    const zipcodeKey = mapping.zipcode || 'Zipcode';
    const countryKey = mapping.country || 'Country';
    const statusKey = mapping.status || 'Status';
    const mappingShortKey = mapping.shortDescription || 'Short description';
    const mappingLongKey = mapping.longDescription || 'Long description';
    const openingDateKey = mapping.businessOpeningDate || 'business_opening_date';
    const aboutKey = mapping.about || 'About';
    const groupsKey = mapping.groups || 'Groupes';
    const mainCategoryKey = mapping.mainCategory || 'Catégorie principale';
    const secondaryCategoriesKey = mapping.secondaryCategories || 'Catégories additionnelles';
    const inStoreServicesKey = mapping.inStoreServices || 'In Store Services';
    const bookAFittingKey = mapping.bookAFitting || 'Book a Fitting';
    const triumphOutletsKey = mapping.triumphOutlets || 'Triumph Outlets';

    const name = String(row[nameKey] ?? '').trim();
    const businessId = String(row[businessIdKey] ?? (name || `row-${i + 1}`));

    // ============================================================================
    // BUSINESS ID FILTER - Skip processing if not in filter list
    // ============================================================================
    if (businessIdsFilter && businessIdsFilter.size > 0) {
      if (!businessIdsFilter.has(businessId)) {
        // Business ID not in filter list - skip processing and keep original values
        addLog?.(`${businessId} | partoo | SKIP: Not in filter list (keeping original values)`);
        out.push(processed);
        continue;
      }
      // Business ID is in filter list - proceed with processing
      addLog?.(`${businessId} | partoo | ✓ In filter list - will process`);
    }
    // ============================================================================
    // END BUSINESS ID FILTER
    // ============================================================================

    const address = String(row[addressKey] ?? '').trim();
    const city = String(row[cityKey] ?? '').trim();
    const zipcode = String(row[zipcodeKey] ?? '').trim();
    const country = String(row[countryKey] ?? '').trim();
    const status = String(row[statusKey] ?? 'open').trim();
    // Helper to derive language priority codes (e.g. 'de-CH' => ['de-ch','de','ch'])
    const deriveLangCodes = (lang: string): string[] => {
      if (!lang) return [];
      const lower = lang.toLowerCase();
      const parts = lower.split(/[-_]/g);
      const codes: string[] = [lower];
      if (parts.length > 0) codes.push(parts[0]);
      if (parts.length > 1) codes.push(parts[1]);
      return [...new Set(codes.filter(Boolean))];
    };

    // Detect language early (needed to pick correct column variant) – fallback to country-based detection first
    const preLanguage = detectLanguage(country || '', city || '');
    const langCodes = deriveLangCodes(preLanguage); // e.g. ['de-ch','de','ch']

    // Dynamic picker for description columns when mapping key not present exactly
    const pickDescriptionColumn = (type: 'short' | 'long'): string => {
      const baseProvided = type === 'short' ? mappingShortKey : mappingLongKey;
      // If provided key exists in row, keep it
      if (baseProvided in row) return baseProvided;
      // Collect candidates
      const cols = Object.keys(row);
      const regex = type === 'short' ? /short\s+description/i : /long\s+description/i;
      const candidates = cols.filter(c => regex.test(c));
      if (candidates.length === 0) return baseProvided; // fallback – will create a new column later
      // Try exact language code matches in order
      for (const code of langCodes) {
        const codeRegex = new RegExp(`(^|\s|[_-])${code}(\s|$)`, 'i');
        const hit = candidates.find(c => codeRegex.test(c.toLowerCase()));
        if (hit) return hit;
      }
      // Prefer the one without extra suffix (shortest)
      const sorted = [...candidates].sort((a, b) => a.length - b.length);
      return sorted[0];
    };

    const shortDescKey = pickDescriptionColumn('short');
    const longDescKey = pickDescriptionColumn('long');

    const existingShort = String(row[shortDescKey] ?? '').trim() || undefined;
    const existingLong = String(row[longDescKey] ?? '').trim() || undefined;
    const openingDate = String(row[openingDateKey] ?? '').trim() || undefined;
    const existingAbout = String(row[aboutKey] ?? '').trim() || undefined;
    const groups = String(row[groupsKey] ?? '').trim() || undefined;
    const mainCategory = String(row[mainCategoryKey] ?? '').trim() || undefined;
    const secondaryCategories = String(row[secondaryCategoriesKey] ?? '').trim() || undefined;
    const inStoreServicesRaw = String(row[inStoreServicesKey] ?? '').trim().toUpperCase();
    const bookAFittingRaw = String(row[bookAFittingKey] ?? '').trim();
    const triumphOutletsRaw = String(row[triumphOutletsKey] ?? '').trim().toUpperCase();
    const hasAboutColumn = aboutKey in row || Object.keys(row).some(k => /^about$/i.test(k));

    // Validate required fields
    if (!name || !city || !country) {
      addLog?.(`${businessId} | partoo | SKIP: Missing required fields (name/city/country)`);
      // Keep original values unchanged
      out.push(processed);
      continue;
    }

  // Use previously detected language (preLanguage) to avoid recomputation (still recompute if needed)
  const language = preLanguage || detectLanguage(country, city);
    const closed = isStoreClosed(status);

    addLog?.(`${businessId} | partoo | ${name} | ${city} | lang=${language} | closed=${closed}`);

    // If store is closed, return standardized closure message
    if (closed) {
      const closureMsg = getClosedStoreMessage(language, city);
      // Update the ORIGINAL columns directly
      processed[shortDescKey] = closureMsg.short;
      processed[longDescKey] = closureMsg.long;
      addLog?.(`${businessId} | partoo | CLOSED: Using standard closure message`);
      out.push(processed);
      continue;
    }

    // Check if we need to generate/improve descriptions
    let needsShort = !existingShort;
    let needsLong = !existingLong;

    if (overwritePolicy === 'fill-improve') {
      if (existingShort && isGenericDescription(existingShort, city)) {
        needsShort = true;
        addLog?.(`${businessId} | partoo | SHORT: Existing is generic, will improve`);
      }
      if (existingLong && isGenericDescription(existingLong, city)) {
        needsLong = true;
        addLog?.(`${businessId} | partoo | LONG: Existing is generic, will improve`);
      }
    }

    // Check if About needs generation
    let needsAbout = false;
    if (hasAboutColumn) {
      if (!existingAbout) {
        needsAbout = true;
      } else if (overwritePolicy === 'fill-improve' && isGenericDescription(existingAbout, city)) {
        needsAbout = true;
        addLog?.(`${businessId} | partoo | ABOUT: Existing is generic, will improve`);
      }
    }

    // If we don't need to generate anything, skip AI call
    if (!needsShort && !needsLong && !needsAbout) {
      // Keep original values unchanged
      addLog?.(`${businessId} | partoo | SKIP: Existing descriptions are adequate`);
      out.push(processed);
      continue;
    }

    // Prepare store data
    const storeData: PartooStoreData = {
      name,
      address,
      city,
      zipcode,
      country,
      status,
      existingShort,
      existingLong,
      businessOpeningDate: openingDate,
      existingAbout,
      groups,
      mainCategory,
      secondaryCategories,
      hasInStoreServices: inStoreServicesRaw === 'TRUE',
      hasBookAFitting: !!bookAFittingRaw && bookAFittingRaw.toLowerCase() !== 'false',
      isOutlet: triumphOutletsRaw === 'TRUE',
    };

    // ── Short + Long description generation ──
    if (needsShort || needsLong) {
      const userPrompt = buildPartooStorePrompt(storeData, overwritePolicy);

      try {
        addLog?.(`${businessId} | partoo | Calling AI for short/long (${model.name})...`);

        const rawResponse = await optimizeTextWithAI(
          userPrompt,
          [], // no keywords for Partoo
          {}, // no analysis results
          model,
          apiKey,
          PARTOO_SYSTEM_PROMPT
        );

        // Track cost with actual tokens from API response
        if (costTracker && rawResponse.tokens) {
          const costRecord = costTracker.trackOperation(
            model.id,
            userPrompt,
            rawResponse.content || '',
            {
              inputTokens: rawResponse.tokens.inputTokens,
              outputTokens: rawResponse.tokens.outputTokens
            }
          );

          if (costRecord) {
            const cost = costRecord.actualCost || costRecord.estimatedCost;
            const totalTokens = rawResponse.tokens.inputTokens + rawResponse.tokens.outputTokens;
            const costType = costRecord.actualCost ? 'ACTUAL' : 'ESTIMATED';
            addLog?.(`${businessId} | partoo | COST(short/long): $${cost.toFixed(2)} (${costType}: ${rawResponse.tokens.inputTokens}→${rawResponse.tokens.outputTokens} = ${totalTokens} tokens)`);
          }
        }

        const responseText = rawResponse.content || '';
        const parsed = parsePartooResponse(responseText);

        if (!parsed) {
          addLog?.(`${businessId} | partoo | ERROR: Could not parse AI response`);
          processed.gen_error = 'Failed to parse AI response';
        } else {
          const shortChars = parsed.short.length;
          const longChars = parsed.long.length;

          if (shortChars > 80) {
            addLog?.(`${businessId} | partoo | WARN: Short description ${shortChars} chars (max 80)`);
          }
          if (longChars > 750) {
            addLog?.(`${businessId} | partoo | WARN: Long description ${longChars} chars (max 750)`);
          }

          const cleanShort = stripMarkdown(parsed.short);
          const cleanLong = stripMarkdown(parsed.long);

          if (needsShort) {
            processed[shortDescKey] = cleanShort;
          }
          if (needsLong) {
            processed[longDescKey] = cleanLong;
          }

          if (!(mapping.shortDescription && mapping.shortDescription === shortDescKey)) {
            addLog?.(`${businessId} | partoo | MAP(short)->${shortDescKey}`);
          }
          if (!(mapping.longDescription && mapping.longDescription === longDescKey)) {
            addLog?.(`${businessId} | partoo | MAP(long)->${longDescKey}`);
          }

          addLog?.(`${businessId} | partoo | SUCCESS: Generated short=${shortChars}ch, long=${longChars}ch`);
        }
      } catch (error) {
        addLog?.(`${businessId} | partoo | ERROR(short/long): ${error}`);
        processed.gen_error = String(error);
      }
    }

    // ── About field generation (separate AI call, Markdown preserved) ──
    if (needsAbout) {
      const aboutPrompt = buildPartooAboutPrompt(storeData, overwritePolicy);

      try {
        addLog?.(`${businessId} | partoo | Calling AI for About (${model.name})...`);

        const aboutRawResponse = await optimizeTextWithAI(
          aboutPrompt,
          [],
          {},
          model,
          apiKey,
          PARTOO_ABOUT_SYSTEM_PROMPT
        );

        if (costTracker && aboutRawResponse.tokens) {
          const costRecord = costTracker.trackOperation(
            model.id,
            aboutPrompt,
            aboutRawResponse.content || '',
            {
              inputTokens: aboutRawResponse.tokens.inputTokens,
              outputTokens: aboutRawResponse.tokens.outputTokens
            }
          );

          if (costRecord) {
            const cost = costRecord.actualCost || costRecord.estimatedCost;
            const totalTokens = aboutRawResponse.tokens.inputTokens + aboutRawResponse.tokens.outputTokens;
            const costType = costRecord.actualCost ? 'ACTUAL' : 'ESTIMATED';
            addLog?.(`${businessId} | partoo | COST(about): $${cost.toFixed(2)} (${costType}: ${aboutRawResponse.tokens.inputTokens}→${aboutRawResponse.tokens.outputTokens} = ${totalTokens} tokens)`);
          }
        }

        const aboutResponseText = aboutRawResponse.content || '';
        const parsedAbout = parsePartooAboutResponse(aboutResponseText);

        if (!parsedAbout) {
          addLog?.(`${businessId} | partoo | ERROR: Could not parse About AI response`);
        } else {
          const aboutChars = parsedAbout.length;
          if (aboutChars > 500) {
            addLog?.(`${businessId} | partoo | WARN: About ${aboutChars} chars (max 500)`);
          }

          // Write directly to the About column — do NOT strip Markdown
          processed[aboutKey] = parsedAbout;
          addLog?.(`${businessId} | partoo | SUCCESS(about): Generated about=${aboutChars}ch`);
        }
      } catch (error) {
        addLog?.(`${businessId} | partoo | ERROR(about): ${error}`);
      }
    }

    out.push(processed);
  }

  return out;
}

/**
 * Strip markdown and HTML from text
 */
function stripMarkdown(s: string): string {
  if (!s) return s;
  let t = s.replace(/<[^>]+>/g, ' '); // strip HTML
  t = t.replace(/\*\*(.*?)\*\*/g, '$1'); // bold
  t = t.replace(/\*(.*?)\*/g, '$1'); // italics
  t = t.replace(/`([^`]+)`/g, '$1'); // code
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // links
  t = t.replace(/#{1,6}\s/g, ''); // headings
  t = t.replace(/\s+/g, ' '); // normalize whitespace
  return t.trim();
}

/**
 * Validate Partoo output row
 */
export function validatePartooOutput(row: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const short = row.gen_short_description || '';
  const long = row.gen_long_description || '';

  // Check for HTML/markdown
  if (/<[^>]+>/.test(short) || /<[^>]+>/.test(long)) {
    errors.push('Contains HTML tags');
  }

  // Check for emojis (basic check)
  const emojiPattern = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  if (emojiPattern.test(short) || emojiPattern.test(long)) {
    errors.push('Contains emojis');
  }

  // Check for links
  if (/https?:\/\//.test(short) || /https?:\/\//.test(long)) {
    errors.push('Contains URLs');
  }

  // Check character counts
  const shortChars = short.length;
  const longChars = long.length;

  if (shortChars > 80) {
    errors.push(`Short description: ${shortChars} characters (max 80)`);
  }
  if (longChars > 750) {
    errors.push(`Long description: ${longChars} characters (max 750)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}