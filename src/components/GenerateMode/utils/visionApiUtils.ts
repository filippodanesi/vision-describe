/**
 * Vision API utilities — Client-side Claude calls (text + vision).
 *
 * translateWithClaude accepts either a plain string prompt OR a
 * CachedPromptInput ({system, user}) which gets prompt caching via
 * cache_control on the system block. The ephemeral cache uses 1h TTL,
 * chosen because batch runs (21 SKU × 12 locales = 252 calls) routinely
 * take more than 5 minutes, the default ephemeral TTL.
 *
 * All four flows (Image Analysis, Metadata Generation, CSV Translation,
 * Optimize) are hardcoded to claude-opus-5 with adaptive thinking at high
 * effort. The OpenAI text and vision paths were removed once the
 * user-facing model selector was dropped.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { VisionApiResponse, ImageFile, CachedPromptInput } from '../types';
import { isQuotaError, emitQuotaExhausted } from '@/lib/api/anthropicErrors';

/**
 * Wrap a Claude SDK promise so a "tokens finished" failure (credit balance too
 * low, or a rate limit) raises the app-wide quota signal that opens the
 * reload-and-resume dialog. The error is still rethrown so callers keep their
 * existing handling.
 */
// Loosely typed (Promise<any>) to match the existing `as any` call sites so the
// inferred `response` type is unchanged.
function withQuotaDetection(p: Promise<any>): Promise<any> {
  return p.catch((err) => {
    if (isQuotaError(err)) emitQuotaExhausted();
    throw err;
  });
}

/**
 * Default model for the Claude path. Aligned with the hardcoded constants
 * exported from types.ts (IMAGE_ANALYSIS_MODEL, CSV_TRANSLATION_MODEL,
 * METADATA_GENERATION_MODEL) — single source of truth even though callers
 * always pass an explicit model.
 */
const DEFAULT_CLAUDE_MODEL = 'claude-opus-5';

/** Stop fields the installed SDK (0.50.4) does not type yet. */
interface StopSignals {
  stop_reason?: string | null;
  stop_details?: { category?: string | null } | null;
}

/**
 * Turn a response with no usable text into an error that says why.
 *
 * Opus 5 can end a turn with stop_reason 'refusal' (HTTP 200, a stop_details
 * category, and no text block). Without this, a declined SKU surfaced as the
 * generic "No valid text content" and looked like a parsing bug — easy to miss
 * in a batch of several hundred calls. 'max_tokens' gets the same treatment,
 * since a truncated description is also worth naming.
 */
function describeEmptyResponse(response: StopSignals): string {
  const stopReason = response?.stop_reason;

  if (stopReason === 'refusal') {
    const category = response?.stop_details?.category;
    return `Claude declined this request${category ? ` (${category})` : ''}. The source copy or product data likely tripped a safety classifier — check the input for this SKU.`;
  }

  if (stopReason === 'max_tokens') {
    return 'Response hit the max_tokens ceiling before producing any text. Raise max_tokens or shorten the input.';
  }

  return `No valid text content in Claude response${stopReason ? ` (stop_reason: ${stopReason})` : ''}`;
}

/**
 * Type guard — narrows the union returned by prompt builders. Old builders
 * returned plain strings; new ones return {system, user}.
 */
function isCachedPrompt(value: unknown): value is CachedPromptInput {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as CachedPromptInput).system === 'string' &&
    typeof (value as CachedPromptInput).user === 'string'
  );
}

/**
 * Call Claude with vision (images + text prompt). The instruction text is
 * sent as a cached prefix (cache_control) so repeated analyses with the same
 * settings re-read it at ~10% of the input price; the images vary and follow.
 */
export async function analyzeWithClaude(
  prompt: string,
  images: ImageFile[],
  apiKey: string,
  model: string = DEFAULT_CLAUDE_MODEL,
): Promise<VisionApiResponse> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const imageContent = images.map((img) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: img.mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
      data: img.base64,
    },
  }));

  // Adaptive thinking at high effort: this copy has to hold a terminology
  // contract, and high is the Opus 5 default for quality-sensitive work.
  // Cast to any: the installed @anthropic-ai/sdk (0.50.4) predates the
  // adaptive-thinking / output_config types, but the API honours the fields.
  const response = await withQuotaDetection(client.messages.create({
    model,
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt, cache_control: { type: 'ephemeral' } },
          ...imageContent,
        ],
      },
    ],
  } as any));

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  );

  if (!textBlock || !textBlock.text.trim()) {
    throw new Error(describeEmptyResponse(response));
  }

  return {
    content: textBlock.text.trim(),
    tokens: {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      cacheCreationTokens: response.usage?.cache_creation_input_tokens ?? 0,
      cacheReadTokens: response.usage?.cache_read_input_tokens ?? 0,
    },
  };
}

/**
 * Call Claude for text-only generation/translation.
 *
 * `prompt` accepts:
 * - `string` — sent as a single user message. No prompt caching applied
 *   (kept for backward compatibility with any caller still using flat
 *   strings).
 * - `CachedPromptInput` — `{system, user}`. The `system` block is sent
 *   with `cache_control: {type: 'ephemeral', ttl: '1h'}`, which makes
 *   every call after the first one in the batch a cache read at ~10% of
 *   the base input price. 1h TTL chosen because long batches (~252 calls
 *   for AW26) take more than the default 5 minutes.
 *
 * Used by useMetadataGeneration (EN master + localisations) and
 * useCsvTranslation (per-locale translations).
 */
export async function translateWithClaude(
  prompt: string | CachedPromptInput,
  apiKey: string,
  model: string = DEFAULT_CLAUDE_MODEL,
  signal?: AbortSignal,
): Promise<VisionApiResponse> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  // Adaptive thinking at high effort: this copy has to hold a terminology
  // contract, and high is the Opus 5 default for quality-sensitive work.
  // `as any`: SDK 0.50.4 predates these types; the API still honours them.
  const params: any = isCachedPrompt(prompt)
    ? {
        model,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'high' },
        system: [
          {
            type: 'text',
            text: prompt.system,
            cache_control: { type: 'ephemeral', ttl: '1h' },
          },
        ],
        messages: [{ role: 'user', content: prompt.user }],
      }
    : {
        model,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'high' },
        messages: [{ role: 'user', content: prompt }],
      };

  const response = await withQuotaDetection(client.messages.create(
    params as any,
    signal ? { signal } : undefined,
  ));

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  );

  if (!textBlock || !textBlock.text.trim()) {
    throw new Error(describeEmptyResponse(response));
  }

  return {
    content: textBlock.text.trim(),
    tokens: {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      cacheCreationTokens: response.usage?.cache_creation_input_tokens ?? 0,
      cacheReadTokens: response.usage?.cache_read_input_tokens ?? 0,
    },
  };
}

