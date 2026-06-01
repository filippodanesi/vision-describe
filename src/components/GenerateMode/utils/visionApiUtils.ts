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
 * Optimize) are hardcoded to claude-opus-4-8 with adaptive thinking at
 * medium effort. The OpenAI text and vision paths were removed once the
 * user-facing model selector was dropped.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { VisionApiResponse, ImageFile, CachedPromptInput } from '../types';

/**
 * Default model for the Claude path. Aligned with the hardcoded constants
 * exported from types.ts (IMAGE_ANALYSIS_MODEL, CSV_TRANSLATION_MODEL,
 * METADATA_GENERATION_MODEL) — single source of truth even though callers
 * always pass an explicit model.
 */
const DEFAULT_CLAUDE_MODEL = 'claude-opus-4-8';

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
 * Call Claude with vision (images + text prompt).
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

  // Adaptive thinking + medium effort per the Opus 4.8 migration guide.
  // Cast to any: the installed @anthropic-ai/sdk (0.50.4) predates the
  // adaptive-thinking / output_config types, but the API honours the fields.
  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageContent,
        ],
      },
    ],
  } as any);

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  );

  if (!textBlock) {
    throw new Error('No valid text content in Claude response');
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

  // Adaptive thinking + medium effort per the Opus 4.8 migration guide.
  // `as any`: SDK 0.50.4 predates these types; the API still honours them.
  const params: any = isCachedPrompt(prompt)
    ? {
        model,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium' },
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
        output_config: { effort: 'medium' },
        messages: [{ role: 'user', content: prompt }],
      };

  const response = await client.messages.create(
    params as any,
    signal ? { signal } : undefined,
  );

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  );

  if (!textBlock) {
    throw new Error('No valid text content in Claude response');
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

