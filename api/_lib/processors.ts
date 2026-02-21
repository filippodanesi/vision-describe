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

// ---------------------------------------------------------------------------
// Partoo processor
// The client-side processPartooRows builds a specific prompt per row with
// store data (name, city, address, etc.) and sends it to the AI with
// PARTOO_SYSTEM_PROMPT. The row data passed to the server already contains
// all original fields. We need to replicate the prompt building here.
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

  // Extract store fields using mapping or defaults (must match Partoo Excel column names)
  const nameKey = mapping.name || 'Name';
  const cityKey = mapping.city || 'City';
  const countryKey = mapping.country || 'Country';
  const addressKey = mapping.address || 'Address';
  const zipcodeKey = mapping.zipcode || 'Zipcode';
  const statusKey = mapping.status || 'Status';
  const shortDescKey = mapping.shortDescription || 'Short description';
  const longDescKey = mapping.longDescription || 'Long description';

  const name = String(row[nameKey] ?? '');
  const city = String(row[cityKey] ?? '');
  const country = String(row[countryKey] ?? '');
  const address = String(row[addressKey] ?? '');
  const zipcode = String(row[zipcodeKey] ?? '');
  const status = String(row[statusKey] ?? 'open').toLowerCase();
  const existingShort = String(row[shortDescKey] ?? '');
  const existingLong = String(row[longDescKey] ?? '');

  // Determine language from country code
  const langMap: Record<string, string> = {
    IT: 'it-IT', DE: 'de-DE', FR: 'fr-FR', ES: 'es-ES', PT: 'pt-PT',
    GB: 'en-GB', US: 'en-US', NL: 'nl-NL', BE: 'nl-BE', AT: 'de-AT',
    CH: 'de-CH', PL: 'pl-PL', CZ: 'cs-CZ', HU: 'hu-HU', RO: 'ro-RO',
    BG: 'bg-BG', HR: 'hr-HR', SK: 'sk-SK', SI: 'sl-SI', SE: 'sv-SE',
    DK: 'da-DK', FI: 'fi-FI', NO: 'nb-NO', IE: 'en-IE', GR: 'el-GR',
  };
  const lang = langMap[country.toUpperCase()] || config.lang || 'en-GB';

  // Build the prompt (replicates client-side Partoo logic)
  const prompt = `Language: ${lang}

Use ONLY these details. Do not invent or infer missing information.

INPUTS:
- Name: ${name}
- City: ${city}
- Country: ${country}
- Status: ${status}
- Address: ${address}
- Zipcode: ${zipcode}

${existingShort || existingLong ? `EXISTING DESCRIPTIONS:
- Short: ${existingShort}
- Long: ${existingLong}` : ''}

Return JSON ONLY (no other text):

{
  "short_description": "<max 80 characters, plain text>",
  "long_description": "<max 750 characters, plain text>"
}

CRITICAL REQUIREMENTS:
- Write in ${lang}. Do not use any other language.
- ALWAYS mention ${city} naturally in both descriptions.
${address ? `- Mention ${address} if it fits naturally.` : ''}
- Short description: max 80 characters. Long description: AIM for 600-750 characters.
- Count characters BEFORE responding and ensure both fields are within limits.
- Use ONLY information from Inputs above. Do not invent details.
- Focus on: expert bra fitting, lingerie for everyday comfort, coordinated sets.
- Write naturally to answer local search intents.
- NO company history, global stats, corporate background, certifications, or mission statements.
- NO prices, hours, phone, email, directions, promotions, or loyalty programs.
- Plain text only - no HTML, markdown, links, emojis.`;

  // Use the system prompt from config if available, otherwise use a default
  const systemPrompt = (config as any).systemPrompt ||
    'You are a professional copywriter creating localized store descriptions. Output JSON ONLY with "short_description" and "long_description" keys.';

  const res = await serverOptimize(prompt, model, apiKey, systemPrompt);
  totalIn += res.tokens.inputTokens;
  totalOut += res.tokens.outputTokens;

  // Parse the AI response (should be JSON with short_description and long_description)
  try {
    // Extract JSON from response (may have markdown code fences)
    let jsonStr = res.content;
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const parsed = JSON.parse(jsonStr);
    if (parsed.short_description) processed[shortDescKey] = parsed.short_description;
    if (parsed.long_description) processed[longDescKey] = parsed.long_description;
  } catch {
    // If JSON parsing fails, store raw response
    processed[longDescKey] = res.content;
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
