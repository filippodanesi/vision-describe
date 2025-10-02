/**
 * Utility functions for Claude API integration using the official Anthropic SDK
 * 
 * Claude Sonnet 4.5 Configuration:
 * - Extended thinking ENABLED for maximum performance on complex tasks
 * - Significantly better coding capabilities and reasoning
 * - Longer response times (60-120s) but highest quality output
 * - Budget: 10,000 thinking tokens per request
 */
import Anthropic from '@anthropic-ai/sdk';
import claudeSystemPrompt from './prompts/claudeSystemPrompt';
import { toast } from "@/hooks/use-toast";
import { fetchWithCorsProxy } from './corsProxyUtils';

export interface ClaudeResponse {
  content: string;
  tokens: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ClaudeRequestOptions {
  maxTokens?: number;
  timeoutMs?: number;
  retryAttempts?: number;
  retryBaseDelayMs?: number;
}

/**
 * TESTING: Simple version without CORS proxy to test if we really need it
 * Uncomment this function and comment out the complex one below to test
 */
/*
export const optimizeWithClaude = async (
  prompt: string, 
  apiKey: string,
  model: string = "claude-sonnet-4-20250514",
  systemPrompt?: string,
  options: ClaudeRequestOptions = {}
): Promise<ClaudeResponse> => {
  console.log('🧪 TESTING: Using simplified Claude implementation (no CORS proxy)');
  
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("Claude API key is missing");
  }

  const client = new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model: model,
    system: systemPrompt || "You are a helpful assistant.",
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000
  });

  const textContent = response.content.find(block => 
    'type' in block && block.type === 'text' && 'text' in block
  );

  if (!textContent || !('text' in textContent)) {
    throw new Error("No valid text content in response");
  }

  return {
    content: textContent.text.trim(),
    tokens: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0
    }
  };
};
*/

/**
 * Fallback message for when the Anthropic SDK encounters an error
 */
const getFallbackMessage = (prompt: string, error?: Error): string => {
  try {
    // Extract keywords for the fallback message
    let keywordsList = "unknown";
    try {
      const keywordMatch = prompt.match(/Target Keywords:\s*([^\n]+)/i);
      if (keywordMatch && keywordMatch[1]) {
        keywordsList = keywordMatch[1].trim();
      }
    } catch (err) {
      console.warn("Could not extract keywords from prompt:", err);
    }
    
    // If we have an authentication error, return a clear message
    if (error?.message?.includes("401") || 
        error?.message?.includes("auth") || 
        error?.toString().includes("invalid x-api-key")) {
      return `Authentication Failed: Your Claude API key appears to be invalid.

Please check the following:
1. Make sure your API key is correctly entered in the AI Configuration settings
2. Verify that your Claude API key is active and has not expired
3. Ensure your account has access to the Claude API

The original text has been preserved.`;
    }
    
    // Return a general fallback message
    return `I've attempted to optimize your text with the keywords: ${keywordsList}
    
Due to API connection issues, I couldn't display the AI-optimized result directly. 

Options to resolve this:
1. Check that your Claude API key is valid
2. Use OpenAI instead (GPT-4o) which may have fewer connection restrictions
3. Try again in a few moments

The original text is preserved.`;
  } catch (fallbackError) {
    console.error("Error creating fallback message:", fallbackError);
    return "Could not optimize the text due to API connection issues. Please try again later.";
  }
};

/**
 * Make a direct API call to Claude using CORS proxy
 */
const makeClaudeApiCallWithProxy = async (
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<any> => {
  const url = 'https://api.anthropic.com/v1/messages';
  
  const requestBody = {
    model: model,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ],
    max_tokens: 2000
  };

  console.log('Making Claude API call via CORS proxy...');
  
  const response = await fetchWithCorsProxy(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API error response:', errorText);
    throw new Error(`Claude API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Optimizes text using Anthropic Claude API via the official SDK
 */
export const optimizeWithClaude = async (
  prompt: string, 
  apiKey: string,
  model: string = "claude-sonnet-4-20250514",
  systemPrompt?: string,
  options: ClaudeRequestOptions = {}
): Promise<ClaudeResponse> => {
  try {
    // Validate API key first
    if (!apiKey || apiKey.trim() === "") {
      toast({
        title: "Missing API Key",
        description: "Please provide a valid Claude API key in the AI Configuration.",
        variant: "destructive",
      });
      throw new Error("Claude API key is missing");
    }

    // Check for likely invalid API key format
    if (!apiKey.startsWith("sk-ant-") && !apiKey.startsWith("sk-")) {
      console.warn("Claude API key appears to have invalid format. Should start with 'sk-ant-'");
      toast({
        title: "Invalid API Key Format",
        description: "Claude API keys typically start with 'sk-ant-'. Please check your key.",
        variant: "warning",
      });
    }
    
    // Use the specified Claude model or default to Claude 4 Sonnet
    const claudeModel = model || "claude-sonnet-4-20250514";
    console.log(`Using Claude model: ${claudeModel}`);
    
    // Get model name for display in toast
    const modelDisplayName = claudeModel.includes("4-") ? "Claude 4" : 
                             claudeModel.includes("3-haiku") ? "Claude 3 Haiku" : "Claude";
    
    const defaultSystemPrompt = claudeSystemPrompt;

    const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

    console.log(`Starting optimization with ${claudeModel}`);

    // Log the request details for debugging (abbreviated for readability)
    console.log("Claude API request details:", JSON.stringify({
      model: claudeModel,
      system_prompt_length: finalSystemPrompt.length,
      user_prompt_preview: prompt.substring(0, 100) + "...",
      max_tokens: options.maxTokens ?? 2000
    }, null, 2));

    // Retry/backoff helpers
    const retryAttempts = Math.max(0, options.retryAttempts ?? 2);
    const baseDelay = Math.max(100, options.retryBaseDelayMs ?? 300);
    // Claude Sonnet 4.5 with extended thinking can take up to 120s
    const isSonnet45 = claudeModel.includes('sonnet-4-5');
    const defaultTimeout = isSonnet45 ? 120000 : 30000; // 120s for Sonnet 4.5, 30s for others
    const timeoutMs = Math.max(0, options.timeoutMs ?? defaultTimeout);
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    
    if (isSonnet45) {
      console.log('⏳ Claude Sonnet 4.5 with extended thinking may take up to 120s. Please wait...');
    }

    const performOnce = async (): Promise<any> => {
      // Try the official SDK with browser support
      console.log('🚀 Attempting Claude API call with official SDK (direct browser access)...');

      const client = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      try {
        // Enable extended thinking for Sonnet 4.5 for maximum performance
        const isSonnet45 = claudeModel.includes('sonnet-4-5');
        const requestParams: any = {
          model: claudeModel,
          system: finalSystemPrompt,
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: options.maxTokens ?? (isSonnet45 ? 16000 : 2000)
        };

        // Add extended thinking for Sonnet 4.5
        if (isSonnet45) {
          requestParams.thinking = {
            type: "enabled",
            budget_tokens: 5000
          };
          console.log('🧠 Extended thinking enabled for Claude Sonnet 4.5 (budget: 5k tokens, max: 16k total)');
        }

        const sdkResponse = await client.messages.create(requestParams);
        console.log('✅ Claude SDK call successful - no CORS proxy needed!');
        return sdkResponse;
      } catch (sdkError: any) {
        console.warn('❌ Claude SDK failed:', sdkError);
        if (sdkError instanceof Anthropic.AuthenticationError) {
          toast({
            title: "Authentication Failed",
            description: "Invalid Claude API key. Please check your API key in the AI Configuration.",
            variant: "destructive",
          });
          throw sdkError;
        }
        if (sdkError instanceof Error && sdkError.message.includes('CORS')) {
          console.log('🔄 CORS error detected, falling back to proxy...');
          const proxyResponse = await makeClaudeApiCallWithProxy(
            apiKey,
            claudeModel,
            finalSystemPrompt,
            prompt
          );
          console.log('✅ Claude CORS proxy call successful');
          return proxyResponse;
        }
        throw sdkError;
      }
    };

    const executeWithTimeout = async (): Promise<any> => {
      if (!timeoutMs) return performOnce();
      return await Promise.race([
        performOnce(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Claude request timed out')), timeoutMs))
      ]);
    };

    let response: any;
    let lastError: any;
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        response = await executeWithTimeout();
        break;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        // Do not retry on obvious auth errors
        if (/auth|invalid\s*x-api-key|unauthoriz|forbidden/i.test(msg)) {
          throw err;
        }
        // For rate limits or network-ish errors, retry
        if (/429|rate|network|fetch|cors|timeout/i.test(msg)) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`⏳ Retrying Claude request (attempt ${attempt + 2}/${retryAttempts + 1}) after ${delay}ms due to: ${msg}`);
          await sleep(delay);
          continue;
        }
        // Other errors: don't retry
        throw err;
      }
    }
    if (!response && lastError) {
      throw lastError;
    }

    // Log the response for debugging
    console.log("Claude API response:", JSON.stringify({
      id: response.id,
      model: response.model,
      content_blocks: response.content?.length || 'unknown',
      usage: response.usage,
      stop_reason: response.stop_reason
    }, null, 2));

    // Extract token usage from response
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    
    console.log(`Claude token usage: ${inputTokens} input + ${outputTokens} output = ${inputTokens + outputTokens} total tokens`);

    // Check if there's content in the response and handle different content types properly
    if (response.content && response.content.length > 0) {
      // Find the first text block in the content array
      const textContent = response.content.find(block => 
        'type' in block && block.type === 'text' && 'text' in block
      );
      
      // Return the text if found, otherwise handle appropriately
      if (textContent && 'text' in textContent) {
        console.log(`${modelDisplayName} optimization successful, received text response:`, textContent.text.substring(0, 100) + "...");
        return {
          content: textContent.text.trim(),
          tokens: {
            inputTokens,
            outputTokens
          }
        };
      } else {
        console.warn(`No text content found in ${modelDisplayName} response:`, response);
        throw new Error(`${modelDisplayName} responded with an unexpected format. Please try again.`);
      }
    } else {
      console.warn("Claude returned empty response:", response);
      throw new Error(`${modelDisplayName} returned an empty response. Please try again.`);
    }
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }
};

/**
 * Utility for processing multiple Claude API calls with intelligent fallback and rate limiting
 */
export const processBatchClaudeRequests = async (
  requests: Array<{
    prompt: string;
    apiKey: string;
    model?: string;
    systemPrompt?: string;
  }>,
  options: {
    maxConcurrent?: number;
    retryAttempts?: number;
    retryDelay?: number;
    progressCallback?: (completed: number, total: number, failures: number) => void;
  } = {}
): Promise<Array<{ success: boolean; result?: ClaudeResponse; error?: string; usedProxy?: boolean }>> => {
  const {
    maxConcurrent = 5, // Limit concurrent requests to avoid rate limiting
    retryAttempts = 3,
    retryDelay = 1000,
    progressCallback
  } = options;

  const results: Array<{ success: boolean; result?: ClaudeResponse; error?: string; usedProxy?: boolean }> = [];
  let completed = 0;
  let failures = 0;

  // Process requests in chunks to respect rate limits
  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const chunk = requests.slice(i, i + maxConcurrent);
    
    const chunkPromises = chunk.map(async (request, index) => {
      let lastError: Error | null = null;
      let usedProxy = false;

      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          // Add delay between attempts
          if (attempt > 0) {
            const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`⏳ Retrying request ${i + index + 1} (attempt ${attempt + 1}) after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          // Try direct SDK first
          try {
            console.log(`Processing request ${i + index + 1}/${requests.length} with direct SDK`);
            const result = await optimizeWithClaude(
              request.prompt,
              request.apiKey,
              request.model,
              request.systemPrompt
            );
            
            completed++;
            progressCallback?.(completed, requests.length, failures);
            return { success: true, result, usedProxy: false };

          } catch (sdkError) {
            // If it's a CORS error, try proxy
            if (sdkError instanceof Error && (
              sdkError.message.includes('CORS') ||
              sdkError.message.includes('fetch') ||
              sdkError.message.includes('network')
            )) {
              console.log(`Request ${i + index + 1} failed with SDK, trying CORS proxy...`);
              
              const proxyResult = await makeClaudeApiCallWithProxy(
                request.apiKey,
                request.model || "claude-sonnet-4-20250514",
                request.systemPrompt || "You are a helpful assistant.",
                request.prompt
              );

              // Parse proxy response
              const textContent = proxyResult.content?.find((block: any) => 
                block.type === 'text'
              );

              if (textContent?.text) {
                usedProxy = true;
                completed++;
                progressCallback?.(completed, requests.length, failures);
                return { 
                  success: true, 
                  result: {
                    content: textContent.text.trim(),
                    tokens: {
                      inputTokens: proxyResult.usage?.input_tokens || 0,
                      outputTokens: proxyResult.usage?.output_tokens || 0
                    }
                  },
                  usedProxy: true 
                };
              }
            }
            
            throw sdkError;
          }

        } catch (error) {
          lastError = error as Error;
          console.warn(`Request ${i + index + 1} failed (attempt ${attempt + 1}):`, error);
          
          // If it's a rate limit error, wait longer
          if (error instanceof Error && error.message.includes('rate')) {
            const rateLimitDelay = Math.min(retryDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
            console.log(`Rate limit detected, waiting ${rateLimitDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
          }
        }
      }

      // All attempts failed
      failures++;
      completed++;
      progressCallback?.(completed, requests.length, failures);
      return { 
        success: false, 
        error: lastError?.message || 'Unknown error', 
        usedProxy 
      };
    });

    // Wait for current chunk to complete before starting next chunk
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);

    // Add small delay between chunks to be nice to the API
    if (i + maxConcurrent < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Log summary
  const successful = results.filter(r => r.success).length;
  const proxied = results.filter(r => r.usedProxy).length;
  console.log(`Batch processing complete: ${successful}/${requests.length} successful, ${proxied} used CORS proxy, ${failures} failed`);

  return results;
};
