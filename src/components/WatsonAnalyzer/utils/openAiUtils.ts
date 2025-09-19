/**
 * Utility functions for OpenAI API integration
 */
import openAISystemPrompt from './prompts/openaiSystemPrompt';

export interface OpenAIResponse {
  content: string;
  tokens: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface OpenAIRequestOptions {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  retryAttempts?: number;
  retryBaseDelayMs?: number;
}

export const enum OpenAIModelId {
  O4_MINI = 'o4-mini',
  O3 = 'o3',
}

/**
 * Optimizes text using OpenAI GPT API
 */
export const optimizeWithOpenAI = async (
  prompt: string, 
  apiKey: string,
  model: string = OpenAIModelId.O4_MINI,
  systemPrompt?: string,
  options: OpenAIRequestOptions = {}
): Promise<OpenAIResponse> => {
  const defaultSystemPrompt = openAISystemPrompt;

  // Log the model being used to debug o4-mini issues
  console.log(`Using OpenAI model: ${model}`);
  
  // Handle specific models parameters differently
  const isO4MiniModel = model === OpenAIModelId.O4_MINI;
  const isNewModel = model.includes('o3') || model.includes('o4');
  
  // Configure API request body based on model type
  const requestBody = {
    model: model,
    messages: [
      {
        role: "system",
        content: systemPrompt || defaultSystemPrompt
      },
      {
        role: "user",
        content: prompt
      }
    ],
    // Model-specific parameters
    ...(isNewModel ? { 
      max_completion_tokens: options.maxTokens ?? 4000
    } : { 
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000 
    })
  };

  console.log("OpenAI API request body:", JSON.stringify(requestBody, null, 2));

  // Retry with exponential backoff and timeout
  const retryAttempts = Math.max(0, options.retryAttempts ?? 2);
  const baseDelay = Math.max(100, options.retryBaseDelayMs ?? 300);
  const timeoutMs = Math.max(0, options.timeoutMs ?? 30000);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const fetchWithTimeout = async (resource: string, init: RequestInit, timeout: number) => {
    if (!timeout) return fetch(resource, init);
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(resource, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  };

  let lastError: any;
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        },
        timeoutMs
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("OpenAI API error:", errorData || response.statusText);
        const message = errorData?.error?.message || response.statusText || 'Unknown error';
        const status = (response as any).status as number | undefined;

        if (isO4MiniModel && errorData?.error?.message?.includes("max_tokens")) {
          throw new Error("o4-mini requires 'max_completion_tokens' instead of 'max_tokens'. The system has made this change but the API call failed. Please try again.");
        }

        if (status === 401 || status === 403) {
          throw new Error(`Authentication/Authorization error (${status}): ${message}`);
        }
        if (status === 429) {
          lastError = new Error(`Rate limited (429): ${message}`);
        } else if (status && status >= 500) {
          lastError = new Error(`Server error (${status}): ${message}`);
        } else {
          throw new Error(`OpenAI API error: ${status ?? 'n/a'} ${message}`);
        }
      } else {
        const data = await response.json();
        console.log("OpenAI API response:", JSON.stringify(data, null, 2));
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
          console.error("Unexpected API response format:", data);
          throw new Error("Invalid response format from OpenAI API");
        }
        const usage = data.usage;
        const inputTokens = usage?.prompt_tokens || 0;
        const outputTokens = usage?.completion_tokens || 0;
        console.log(`OpenAI token usage: ${inputTokens} input + ${outputTokens} output = ${inputTokens + outputTokens} total tokens`);
        return {
          content: data.choices[0].message.content,
          tokens: {
            inputTokens,
            outputTokens,
          },
        };
      }
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err);
      if (/auth|unauthoriz|forbidden|api key|invalid/i.test(msg)) {
        break;
      }
    }
    const delay = baseDelay * Math.pow(2, attempt);
    await sleep(delay);
  }
  console.error("OpenAI API call failed after retries:", lastError);
  throw lastError instanceof Error ? lastError : new Error('OpenAI request failed');
};
