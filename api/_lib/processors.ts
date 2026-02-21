/**
 * Server-side processor wrappers.
 *
 * Each function replicates the processing logic of its client-side counterpart
 * but uses the server-side AI client (no browser dependencies).
 *
 * Prompts, sanitizers, and translations are imported directly — they are pure
 * functions/data with no browser deps.
 */
import { callAI, AiResponse } from './aiClients';
import { RunConfig } from './types';

// --- Amazon imports ---
import amazonSystemPrompt from '../../src/components/OptimizeMode/utils/prompts/amazonSystemPrompt';
import {
  buildAplusPrompt,
  buildBulletsPrompt,
  buildDescriptionPrompt,
  AmazonPromptCtx,
} from '../../src/components/OptimizeMode/utils/prompts/amazonTasks';
import {
  sanitizeBulletsOutputToArray,
  sanitizeAplusShort,
  sanitizeDescription,
  hasPolicyIssues,
} from '../../src/components/OptimizeMode/utils/sanitizers';

// --- Partoo imports ---
import {
  PARTOO_SYSTEM_PROMPT,
  PARTOO_ABOUT_SYSTEM_PROMPT,
} from '../../src/components/OptimizeMode/utils/prompts/partooSystemPrompt';

// --- Next imports ---
import { NEXT_SYSTEM_PROMPT } from '../../src/components/OptimizeMode/utils/prompts/nextSystemPrompt';

// --- AboutYou imports ---
import { ABOUTYOU_SYSTEM_PROMPT } from '../../src/components/OptimizeMode/utils/prompts/aboutYouSystemPrompt';

// --- Ecommerce imports ---
import { ECOMMERCE_SYSTEM_PROMPT } from '../../src/components/OptimizeMode/utils/prompts/ecommerceSystemPrompt';
import { buildEcomOptimizePrompt } from '../../src/components/OptimizeMode/utils/prompts/ecommerceTasks';

// --- Translation imports ---
import { COLOR_TRANSLATIONS } from '../../src/components/OptimizeMode/utils/translations/colorTranslations';
import { SIZE_TRANSLATION_TABLE } from '../../src/components/OptimizeMode/utils/translations/sizeTranslations';

/** Helper to determine provider from model id */
function getProvider(modelId: string): 'openai' | 'anthropic' {
  if (modelId.includes('claude') || modelId.includes('anthropic')) return 'anthropic';
  return 'openai';
}

/** Lightweight model shape matching what processors expect */
interface ModelLike {
  id: string;
  provider: 'openai' | 'anthropic';
}

// ---------------------------------------------------------------------------
// Server-side optimizeTextWithAI replacement
// ---------------------------------------------------------------------------
async function serverOptimize(
  userPrompt: string,
  _keywords: string[],
  _analysis: unknown,
  model: ModelLike,
  apiKey: string,
  systemPrompt?: string
): Promise<AiResponse> {
  return callAI(
    apiKey,
    model.id,
    model.provider,
    systemPrompt || 'You are a helpful assistant that optimizes product descriptions.',
    userPrompt
  );
}

// ---------------------------------------------------------------------------
// Amazon processor (server-side)
// ---------------------------------------------------------------------------
export async function processAmazonRow(
  row: Record<string, unknown>,
  rowIndex: number,
  apiKey: string,
  modelId: string,
  mapping: Record<string, unknown>,
  targetLanguage: string
): Promise<{ result: Record<string, unknown>; cost: number; tokensIn: number; tokensOut: number }> {
  const model: ModelLike = { id: modelId, provider: getProvider(modelId) };
  const processed = { ...row } as any;

  const idKey = (mapping.productId as string) || 'vendor_sku#1.value';
  const titleKey = (mapping.title as string) || 'item_name#1.value';
  const descKey = (mapping.descriptionIn as string) || 'rtip_product_description#1.value';
  const bulletKeys = ((mapping.bullets as (string | undefined)[]) || []).filter(Boolean) as string[];

  const title = String(row[titleKey] ?? '');
  const descriptionIn = String(row[descKey] ?? '');
  const bulletsIn = bulletKeys.map((k) => String(row[k] ?? '').trim()).filter((b) => b.length > 0);
  const primaryKeyword = String(row['generic_keyword#1.value'] ?? title ?? '').trim() || undefined;

  const ctx: AmazonPromptCtx = { title, language: targetLanguage, description: descriptionIn, bullets: bulletsIn, primaryKeyword };

  let totalCost = 0;
  let totalIn = 0;
  let totalOut = 0;

  // 1) Bullets
  const bulletsRes = await serverOptimize(buildBulletsPrompt(ctx), [], null, model, apiKey, amazonSystemPrompt);
  totalIn += bulletsRes.tokens.inputTokens;
  totalOut += bulletsRes.tokens.outputTokens;
  const bullets = sanitizeBulletsOutputToArray(bulletsRes.content || '');
  processed.gen_bullet_1 = bullets[0] || '—';
  processed.gen_bullet_2 = bullets[1] || '—';
  processed.gen_bullet_3 = bullets[2] || '—';
  processed.gen_bullet_4 = bullets[3] || '—';
  processed.gen_bullet_5 = bullets[4] || '—';

  // 2) Description
  const descRes = await serverOptimize(buildDescriptionPrompt({ ...ctx, bullets }), [], null, model, apiKey, amazonSystemPrompt);
  totalIn += descRes.tokens.inputTokens;
  totalOut += descRes.tokens.outputTokens;
  const genDescription = sanitizeDescription(descRes.content || '');
  processed.gen_description = genDescription;

  // 3) A+ short
  const aplusRes = await serverOptimize(buildAplusPrompt({ ...ctx, sourceDescription: genDescription }), [], null, model, apiKey, amazonSystemPrompt);
  totalIn += aplusRes.tokens.inputTokens;
  totalOut += aplusRes.tokens.outputTokens;
  processed.gen_aplus_short = sanitizeAplusShort(aplusRes.content || '');

  // Policy check
  const policyFlag = hasPolicyIssues(
    processed.gen_bullet_1, processed.gen_bullet_2, processed.gen_bullet_3,
    processed.gen_bullet_4, processed.gen_bullet_5,
    processed.gen_description, processed.gen_aplus_short
  );
  if (policyFlag) {
    processed.gen_warnings = (processed.gen_warnings ? processed.gen_warnings + '; ' : '') + 'PolicyTermsDetected';
  }

  return { result: processed, cost: totalCost, tokensIn: totalIn, tokensOut: totalOut };
}

// ---------------------------------------------------------------------------
// Generic ecommerce processor (server-side)
// ---------------------------------------------------------------------------
export async function processEcommerceRow(
  row: Record<string, unknown>,
  rowIndex: number,
  apiKey: string,
  modelId: string,
  selectedColumns: string[],
  lang: string
): Promise<{ result: Record<string, unknown>; cost: number; tokensIn: number; tokensOut: number }> {
  const model: ModelLike = { id: modelId, provider: getProvider(modelId) };
  const processed = { ...row } as any;
  let totalIn = 0;
  let totalOut = 0;

  for (const column of selectedColumns) {
    const original = row[column];
    if (!original || typeof original !== 'string') continue;

    const userPrompt = buildEcomOptimizePrompt(original, lang);
    const res = await serverOptimize(userPrompt, [], null, model, apiKey, ECOMMERCE_SYSTEM_PROMPT);
    totalIn += res.tokens.inputTokens;
    totalOut += res.tokens.outputTokens;
    processed[column] = res.content;
  }

  return { result: processed, cost: 0, tokensIn: totalIn, tokensOut: totalOut };
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
  const { useCase, modelId, mappings, lang, selectedColumns } = config;

  switch (useCase) {
    case 'amazon':
      return processAmazonRow(row, rowIndex, apiKey, modelId, mappings || {}, lang || 'en');

    case 'ecommerce':
      return processEcommerceRow(row, rowIndex, apiKey, modelId, selectedColumns || [], lang || 'en');

    // For partoo, next, aboutyou — use dynamic imports to keep the bundle small.
    // These processors are more complex so we import their existing modules.
    // Since they call optimizeTextWithAI, we delegate to the same server-side pattern.
    case 'partoo':
      return processGenericRow(row, rowIndex, apiKey, config, PARTOO_SYSTEM_PROMPT);

    case 'next':
      return processGenericRow(row, rowIndex, apiKey, config, NEXT_SYSTEM_PROMPT);

    case 'aboutyou':
      return processGenericRow(row, rowIndex, apiKey, config, ABOUTYOU_SYSTEM_PROMPT);

    default:
      return processEcommerceRow(row, rowIndex, apiKey, modelId, selectedColumns || [], lang || 'en');
  }
}

/**
 * Generic row processor for use cases where we pass all row data + system prompt
 * to the AI and get back the processed row. The AI call structure is the same
 * for partoo/next/aboutyou — the differentiation is in the system prompt.
 */
async function processGenericRow(
  row: Record<string, unknown>,
  rowIndex: number,
  apiKey: string,
  config: RunConfig,
  systemPrompt: string
): Promise<{ result: Record<string, unknown>; cost: number; tokensIn: number; tokensOut: number }> {
  const model: ModelLike = { id: config.modelId, provider: getProvider(config.modelId) };
  const processed = { ...row } as any;
  let totalIn = 0;
  let totalOut = 0;

  const columns = config.selectedColumns || [];
  for (const column of columns) {
    const original = row[column];
    if (!original || typeof original !== 'string') continue;

    const userPrompt = `Optimize this content:\n\n"${original}"`;
    const res = await serverOptimize(userPrompt, [], null, model, apiKey, systemPrompt);
    totalIn += res.tokens.inputTokens;
    totalOut += res.tokens.outputTokens;
    processed[column] = res.content;
  }

  return { result: processed, cost: 0, tokensIn: totalIn, tokensOut: totalOut };
}
