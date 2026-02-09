/**
 * Amazon Product Processing Module
 * 
 * @author Filippo Danesi
 * @created 2025
 * @description Core processing logic for Amazon product descriptions.
 *              Handles AI-powered content generation for Amazon listings including
 *              bullet points, descriptions, and A+ content.
 * 
 * Key Features:
 * - Processes Amazon product data from Excel/CSV files
 * - Generates 5 optimized bullet points
 * - Creates long-form product descriptions
 * - Generates A+ short content (≤300 chars)
 * - Multi-language support with automatic translation
 * - Policy compliance checking
 * - Quality assurance and validation
 */

import { Model } from '@/lib/models';
import { optimizeTextWithAI } from '../utils/optimizationUtils';
import amazonSystemPrompt from '../utils/prompts/amazonSystemPrompt';
import { buildAplusPrompt, buildBulletsPrompt, buildDescriptionPrompt, AmazonPromptCtx } from '../utils/prompts/amazonTasks';
import { sanitizeBulletsOutputToArray, sanitizeAplusShort, sanitizeDescription, hasPolicyIssues } from '../utils/sanitizers';

export interface AmazonMapping {
  productId?: string;
  title?: string;
  descriptionIn?: string;
  bullets: (string | undefined)[];
}

/**
 * Processes Amazon product rows and generates optimized content
 * 
 * @param rows - Array of product data rows from Excel/CSV
 * @param model - AI model configuration (OpenAI or Anthropic)
 * @param apiKey - API key for the selected model
 * @param mapping - Column mapping configuration for Amazon fields
 * @param targetLanguage - Target language for generated content (e.g., 'en', 'de', 'it')
 * @param addLog - Optional logging function for progress tracking
 * @returns Promise<any[]> - Processed rows with generated content
 * 
 * Processing Flow:
 * 1. Extract product data using column mapping
 * 2. Generate 5 bullet points using AI
 * 3. Generate long description using AI
 * 4. Generate A+ short content using AI
 * 5. Sanitize and validate all generated content
 * 6. Check for policy compliance issues
 * 7. Return enhanced product data
 */
export async function processAmazonRows(
  rows: any[],
  model: Model,
  apiKey: string,
  mapping: AmazonMapping,
  targetLanguage: string = 'en',
  addLog?: (msg: string) => void
): Promise<any[]> {
  const out: any[] = [];

  const stripMarkdown = (s: string): string => {
    if (!s) return s;
    let t = s.replace(/<[^>]+>/g, ' '); // strip HTML
    t = t.replace(/\*\*(.*?)\*\*/g, '$1'); // bold
    t = t.replace(/\*(.*?)\*/g, '$1'); // italics
    t = t.replace(/`([^`]+)`/g, '$1'); // code
    t = t.replace(/\s+/g, ' ');
    return t.trim();
  };


  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const processed = { ...row } as any;

    const idKey = mapping.productId || 'vendor_sku#1.value';
    const titleKey = mapping.title || 'item_name#1.value';
    const descKey = mapping.descriptionIn || 'rtip_product_description#1.value';
    const bulletKeys = mapping.bullets?.filter(Boolean) as string[];

    const productId = String(row[idKey] ?? `row-${i + 1}`);
    const title = String(row[titleKey] ?? '');
    const descriptionIn = String(row[descKey] ?? '');
    const bulletsIn = bulletKeys
      .map((k) => String(row[k] ?? '').trim())
      .filter((b) => b.length > 0);

    // Use the target language selected by the user
    const language = targetLanguage;

    addLog?.(`${productId} | amazon | input bullets=${bulletsIn.length} target_lang=${language}`);

    // 1) Bullets (always 5 lines)
    const primaryKeyword = String(row['generic_keyword#1.value'] ?? title ?? '').toString().trim() || undefined;

    const ctx: AmazonPromptCtx = {
      title,
      language,
      description: descriptionIn,
      bullets: bulletsIn,
      primaryKeyword
    };

    const bulletsRes = await optimizeTextWithAI(
      buildBulletsPrompt(ctx),
      [],
      null,
      model,
      apiKey,
      amazonSystemPrompt
    );
    const bullets = sanitizeBulletsOutputToArray(bulletsRes.content || '');

    processed['gen_bullet_1'] = bullets[0] || '—';
    processed['gen_bullet_2'] = bullets[1] || '—';
    processed['gen_bullet_3'] = bullets[2] || '—';
    processed['gen_bullet_4'] = bullets[3] || '—';
    processed['gen_bullet_5'] = bullets[4] || '—';

    // 2) Long description (one paragraph)
    const descRes = await optimizeTextWithAI(
      buildDescriptionPrompt({ ...ctx, bullets }),
      [],
      null,
      model,
      apiKey,
      amazonSystemPrompt
    );
    const genDescription = sanitizeDescription(descRes.content || '');
    processed['gen_description'] = genDescription;

    // 3) A+ short (<= 300 chars)
    const aplusRes = await optimizeTextWithAI(
      buildAplusPrompt({ ...ctx, sourceDescription: genDescription }),
      [],
      null,
      model,
      apiKey,
      amazonSystemPrompt
    );
    const aplus = sanitizeAplusShort(aplusRes.content || '');
    processed['gen_aplus_short'] = aplus;

    // Policy guard (soft): segnala righe a rischio (non fermare il batch)
    const policyFlag = hasPolicyIssues(
      processed['gen_bullet_1'], processed['gen_bullet_2'], processed['gen_bullet_3'], 
      processed['gen_bullet_4'], processed['gen_bullet_5'],
      processed['gen_description'], processed['gen_aplus_short']
    );
    if (policyFlag) {
      processed['gen_warnings'] = (processed['gen_warnings'] ? processed['gen_warnings'] + '; ' : '') + 'PolicyTermsDetected';
      addLog?.(`⚠️ ${productId} | policy terms detected`);
    }


    out.push(processed);

    addLog?.(`✓ ${productId} | amazon | bullets=5 a+=${processed.gen_aplus_short.length}`);
  }

  return out;
}


