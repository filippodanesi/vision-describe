/**
 * Partoo Store Processing Module
 * 
 * @author Filippo Danesi
 * @created September 30, 2025
 * @description Core processing logic for Partoo store descriptions.
 *              Handles AI-powered content generation for Triumph retail store
 *              listings including short and long descriptions.
 * 
 * Key Features:
 * - Processes Partoo store data from Excel/CSV files
 * - Generates localized short descriptions (35-50 words)
 * - Generates localized long descriptions (90-140 words)
 * - Automatic language detection from country code
 * - Special handling for Switzerland (multi-lingual)
 * - Handles permanently closed stores
 * - Brand Tone of Voice compliance (Triumph)
 * - Overwrite policy support (fill-only vs fill-improve)
 */

import { Model } from '@/lib/models';
import { optimizeTextWithAI } from '../utils/optimizationUtils';
import { PARTOO_SYSTEM_PROMPT } from '../utils/prompts/partooSystemPrompt';
import {
  buildPartooStorePrompt,
  parsePartooResponse,
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
 * @returns Promise<any[]> - Processed rows with generated descriptions
 * 
 * Processing Flow:
 * 1. Extract store data using column mapping
 * 2. Detect language from country code (with special handling for CH)
 * 3. Check if store is permanently closed
 * 4. Generate or improve short description (35-50 words)
 * 5. Generate or improve long description (90-140 words)
 * 6. Validate output format (plain text, no HTML/emojis)
 * 7. Return enhanced store data
 */
export async function processPartooRows(
  rows: any[],
  model: Model,
  apiKey: string,
  mapping: PartooMapping,
  overwritePolicy: 'fill-only' | 'fill-improve' = 'fill-improve',
  addLog?: (msg: string) => void
): Promise<any[]> {
  const out: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const processed = { ...row } as any;

    // Extract fields using mapping
    const businessIdKey = mapping.businessId || 'Business identification';
    const nameKey = mapping.name || 'Name';
    const addressKey = mapping.address || 'Address';
    const cityKey = mapping.city || 'City';
    const zipcodeKey = mapping.zipcode || 'Zipcode';
    const countryKey = mapping.country || 'Country';
    const statusKey = mapping.status || 'Status';
    const shortDescKey = mapping.shortDescription || 'Short description';
    const longDescKey = mapping.longDescription || 'Long description';
    const openingDateKey = mapping.businessOpeningDate || 'business_opening_date';

    const businessId = String(row[businessIdKey] ?? `store-${i + 1}`);
    const name = String(row[nameKey] ?? '').trim();
    const address = String(row[addressKey] ?? '').trim();
    const city = String(row[cityKey] ?? '').trim();
    const zipcode = String(row[zipcodeKey] ?? '').trim();
    const country = String(row[countryKey] ?? '').trim();
    const status = String(row[statusKey] ?? 'open').trim();
    const existingShort = String(row[shortDescKey] ?? '').trim() || undefined;
    const existingLong = String(row[longDescKey] ?? '').trim() || undefined;
    const openingDate = String(row[openingDateKey] ?? '').trim() || undefined;

    // Validate required fields
    if (!name || !city || !country) {
      addLog?.(`${businessId} | partoo | SKIP: Missing required fields (name/city/country)`);
      // Keep original values unchanged
      out.push(processed);
      continue;
    }

    // Detect language
    const language = detectLanguage(country, city);
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

    // If we don't need to generate anything, skip AI call
    if (!needsShort && !needsLong) {
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
    };

    // Build prompt
    const userPrompt = buildPartooStorePrompt(storeData, overwritePolicy);

    // Call AI
    try {
      addLog?.(`${businessId} | partoo | Calling AI (${model.name})...`);
      
      const rawResponse = await optimizeTextWithAI(
        userPrompt,
        [], // no keywords for Partoo
        {}, // no analysis results
        model,
        apiKey,
        PARTOO_SYSTEM_PROMPT
      );

      // Parse response - extract content from OptimizationResult
      const responseText = rawResponse.content || '';
      const parsed = parsePartooResponse(responseText);

      if (!parsed) {
        addLog?.(`${businessId} | partoo | ERROR: Could not parse AI response`);
        // Keep original values unchanged
        processed.gen_error = 'Failed to parse AI response';
      } else {
        // Validate word counts
        const shortWords = parsed.short.split(/\s+/).length;
        const longWords = parsed.long.split(/\s+/).length;

        if (shortWords < 35 || shortWords > 50) {
          addLog?.(`${businessId} | partoo | WARN: Short description ${shortWords} words (target 35-50)`);
        }
        if (longWords < 90 || longWords > 140) {
          addLog?.(`${businessId} | partoo | WARN: Long description ${longWords} words (target 90-140)`);
        }

        // Clean output (remove any accidental HTML/markdown)
        const cleanShort = stripMarkdown(parsed.short);
        const cleanLong = stripMarkdown(parsed.long);

        // Update the ORIGINAL columns directly (only if we need to)
        if (needsShort) {
          processed[shortDescKey] = cleanShort;
        }
        if (needsLong) {
          processed[longDescKey] = cleanLong;
        }

        addLog?.(`${businessId} | partoo | SUCCESS: Generated short=${shortWords}w, long=${longWords}w`);
      }
    } catch (error) {
      addLog?.(`${businessId} | partoo | ERROR: ${error}`);
      // Keep original values unchanged
      processed.gen_error = String(error);
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

  // Check word counts
  const shortWords = short.split(/\s+/).filter(Boolean).length;
  const longWords = long.split(/\s+/).filter(Boolean).length;

  if (shortWords > 0 && (shortWords < 35 || shortWords > 50)) {
    errors.push(`Short description: ${shortWords} words (target 35-50)`);
  }
  if (longWords > 0 && (longWords < 90 || longWords > 140)) {
    errors.push(`Long description: ${longWords} words (target 90-140)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
