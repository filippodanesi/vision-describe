/**
 * Vision API utilities — Client-side vision API calls for Claude and OpenAI
 * Reuses existing SDK patterns from claudeUtils.ts and openAiUtils.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import type { VisionApiResponse, ImageFile } from '../types';

/**
 * Call Claude with vision (images + text prompt)
 */
export async function analyzeWithClaude(
  prompt: string,
  images: ImageFile[],
  apiKey: string,
  model: string = 'claude-sonnet-4-5-20250929'
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
    (block) => 'type' in block && block.type === 'text' && 'text' in block
  );

  if (!textBlock || !('text' in textBlock)) {
    throw new Error('No valid text content in Claude response');
  }

  return {
    content: (textBlock as { type: 'text'; text: string }).text.trim(),
    tokens: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
    },
  };
}

/**
 * Call OpenAI with vision (images + text prompt)
 */
export async function analyzeWithOpenAI(
  prompt: string,
  images: ImageFile[],
  apiKey: string,
  model: string = 'gpt-5.2'
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
 * Call Claude for text-only translation (CSV translation mode)
 */
export async function translateWithClaude(
  prompt: string,
  apiKey: string,
  model: string = 'claude-sonnet-4-5-20250929'
): Promise<VisionApiResponse> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(
    (block) => 'type' in block && block.type === 'text' && 'text' in block
  );

  if (!textBlock || !('text' in textBlock)) {
    throw new Error('No valid text content in Claude response');
  }

  return {
    content: (textBlock as { type: 'text'; text: string }).text.trim(),
    tokens: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
    },
  };
}

/**
 * Call OpenAI for text-only translation (CSV translation mode)
 */
export async function translateWithOpenAI(
  prompt: string,
  apiKey: string,
  model: string = 'gpt-5.2'
): Promise<VisionApiResponse> {
  const isNewModel = model.includes('o3') || model.includes('o4') || model.includes('gpt-5') || model.startsWith('o-');

  const body: Record<string, any> = {
    model,
    messages: [
      { role: 'user', content: prompt },
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
