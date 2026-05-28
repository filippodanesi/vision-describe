/**
 * Vision API utilities — Client-side vision API calls for Claude and OpenAI.
 *
 * Both translateWithClaude and translateWithOpenAI accept either a plain
 * string prompt (legacy path, no caching) OR a CachedPromptInput
 * ({system, user}) which gets prompt caching via cache_control on the
 * system block. The Claude path uses ephemeral cache with 1h TTL — chosen
 * because batch runs (21 SKU × 12 locales = 252 calls) routinely take more
 * than 5 minutes, the default ephemeral TTL.
 *
 * Reuses existing SDK patterns from claudeUtils.ts and openAiUtils.ts.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { VisionApiResponse, ImageFile, CachedPromptInput } from '../types';

/**
 * Default model for the Claude text-only path. Aligned with the hardcoded
 * choice used by all current flows (Metadata Generation, CSV Translation,
 * Optimize) — keeps a single source of truth even though callers always
 * pass an explicit model.
 */
const DEFAULT_CLAUDE_MODEL = 'claude-opus-4-7';

/**
 * Default model for the OpenAI vision path. Kept distinct from the Claude
 * default; the vision-only Image Analysis flow uses OpenAI today.
 */
const DEFAULT_OPENAI_MODEL = 'gpt-5.2';

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

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageContent,
        ],
      },
    ],
  });

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
 * Call OpenAI with vision (images + text prompt).
 */
export async function analyzeWithOpenAI(
  prompt: string,
  images: ImageFile[],
  apiKey: string,
  model: string = DEFAULT_OPENAI_MODEL,
): Promise<VisionApiResponse> {
  const imageContent = images.map((img) => ({
    type: 'image_url' as const,
    image_url: {
      url: `data:${img.mimeType};base64,${img.base64}`,
    },
  }));

  const isNewModel = model.includes('o3') || model.includes('o4') || model.includes('gpt-5') || model.startsWith('o-');

  const body: Record<string, any> = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageContent,
        ],
      },
    ],
  };

  if (isNewModel) {
    body.max_completion_tokens = 4096;
  } else {
    body.max_tokens = 4096;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error: ${response.status} ${errorData?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return {
    content: content.trim(),
    tokens: {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
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

  const params: Anthropic.MessageCreateParams = isCachedPrompt(prompt)
    ? {
        model,
        max_tokens: 4096,
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
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      };

  const response = await client.messages.create(
    params,
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

/**
 * Call OpenAI for text-only generation/translation.
 *
 * Same shape as translateWithClaude: accepts string OR {system, user}.
 * No explicit cache_control — OpenAI handles prompt caching automatically
 * for the responses API when the same prefix is detected.
 */
export async function translateWithOpenAI(
  prompt: string | CachedPromptInput,
  apiKey: string,
  model: string = DEFAULT_OPENAI_MODEL,
  signal?: AbortSignal,
): Promise<VisionApiResponse> {
  const isNewModel = model.includes('o3') || model.includes('o4') || model.includes('gpt-5') || model.startsWith('o-');

  const messages = isCachedPrompt(prompt)
    ? [
        { role: 'system' as const, content: prompt.system },
        { role: 'user' as const, content: prompt.user },
      ]
    : [{ role: 'user' as const, content: prompt }];

  const body: Record<string, any> = {
    model,
    messages,
  };

  if (isNewModel) {
    body.max_completion_tokens = 4096;
  } else {
    body.max_tokens = 4096;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error: ${response.status} ${errorData?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return {
    content: content.trim(),
    tokens: {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    },
  };
}
