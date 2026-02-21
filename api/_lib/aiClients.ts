/**
 * Server-side AI client wrappers for OpenAI and Anthropic.
 * No browser dependencies (no CORS proxy, no toast, no dangerouslyAllowBrowser).
 */
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface AiResponse {
  content: string;
  tokens: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Call OpenAI chat completions API (server-side).
 */
export async function callOpenAI(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  userPrompt: string
): Promise<AiResponse> {
  const client = new OpenAI({ apiKey });

  const isNewModel = modelId.includes('o3') || modelId.includes('o4') || modelId.includes('gpt-5') || modelId.startsWith('o-');
  const defaultMaxTokens = modelId.includes('gpt-5') ? 8000 : 4000;

  const params: Record<string, unknown> = {
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  if (isNewModel) {
    params.max_completion_tokens = defaultMaxTokens;
    if (modelId.includes('gpt-5')) {
      params.reasoning_effort = 'low';
      params.verbosity = 'low';
    }
  } else {
    params.temperature = 0.7;
    params.max_tokens = 4000;
  }

  const response = await client.chat.completions.create(params as any);
  const content = response.choices?.[0]?.message?.content;
  if (!content || content.trim() === '') {
    throw new Error(`Empty response from OpenAI model ${modelId}`);
  }

  return {
    content,
    tokens: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
  };
}

/**
 * Call Anthropic Claude API (server-side).
 */
export async function callAnthropic(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  userPrompt: string
): Promise<AiResponse> {
  const client = new Anthropic({ apiKey });

  const isSonnet45 = modelId.includes('sonnet-4-5');

  const requestParams: Record<string, unknown> = {
    model: modelId,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
    max_tokens: isSonnet45 ? 16000 : 2000,
  };

  if (isSonnet45) {
    requestParams.thinking = { type: 'enabled', budget_tokens: 5000 };
  }

  const response = await client.messages.create(requestParams as any);

  const textBlock = response.content.find(
    (block: any) => block.type === 'text' && 'text' in block
  );
  if (!textBlock || !('text' in textBlock)) {
    throw new Error(`No text content in Anthropic response for model ${modelId}`);
  }

  return {
    content: (textBlock as any).text.trim(),
    tokens: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
    },
  };
}

/**
 * Unified AI call dispatcher based on model provider.
 */
export async function callAI(
  apiKey: string,
  modelId: string,
  provider: 'openai' | 'anthropic',
  systemPrompt: string,
  userPrompt: string
): Promise<AiResponse> {
  if (provider === 'openai') {
    return callOpenAI(apiKey, modelId, systemPrompt, userPrompt);
  }
  return callAnthropic(apiKey, modelId, systemPrompt, userPrompt);
}
