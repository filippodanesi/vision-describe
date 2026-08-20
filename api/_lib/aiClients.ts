/**
 * Server-side Anthropic Claude client wrapper.
 * No browser dependencies (no CORS proxy, no toast, no dangerouslyAllowBrowser).
 *
 * The app is Anthropic-only. Adaptive thinking at high effort, matching the
 * client-side calls in visionApiUtils.ts.
 */
import Anthropic from '@anthropic-ai/sdk';

export interface AiResponse {
  content: string;
  tokens: {
    inputTokens: number;
    outputTokens: number;
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

  // `thinking`/`output_config` are honoured by the API; cast at call time
  // because the installed SDK (0.50.4) predates the adaptive-thinking types.
  const requestParams: Record<string, unknown> = {
    model: modelId,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  };

  const response = await client.messages.create(requestParams as any);

  const textBlock = response.content.find(
    (block: any) => block.type === 'text' && 'text' in block
  );
  if (!textBlock || !('text' in textBlock)) {
    // Opus 5 can end a turn with stop_reason 'refusal' (HTTP 200, no text
    // block). Name it, so a declined row is not mistaken for a parsing bug.
    // stop_details is not typed by the installed SDK (0.50.4).
    const stopSignals = response as {
      stop_reason?: string | null;
      stop_details?: { category?: string | null } | null;
    };
    const stopReason = stopSignals.stop_reason;
    const category = stopSignals.stop_details?.category;
    const detail =
      stopReason === 'refusal'
        ? `Claude declined this request${category ? ` (${category})` : ''}`
        : `No text content in Anthropic response${stopReason ? ` (stop_reason: ${stopReason})` : ''}`;
    throw new Error(`${detail} for model ${modelId}`);
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
 * Unified AI call dispatcher. The app is Anthropic-only.
 */
export async function callAI(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  userPrompt: string
): Promise<AiResponse> {
  return callAnthropic(apiKey, modelId, systemPrompt, userPrompt);
}
