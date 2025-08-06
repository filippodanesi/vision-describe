/**
 * Utility functions for Claude API integration using the official Anthropic SDK
 */
import Anthropic from '@anthropic-ai/sdk';
import { toast } from "@/hooks/use-toast";
import { fetchWithCorsProxy } from './corsProxyUtils';

export interface ClaudeResponse {
  content: string;
  tokens: {
    inputTokens: number;
    outputTokens: number;
  };
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
  systemPrompt?: string
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
  systemPrompt?: string
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
    
    const defaultSystemPrompt = `You are a senior SEO content optimizer and linguistic stylist, specialized in fashion and lingerie. You work exclusively for Triumph and are deeply familiar with the Triumph Brand Book, tone of voice, and values.

    Your task is to optimize content for SEO while aligning strictly with the Triumph brand personality and preserving semantic structure.
    
    Follow these rules:
    
    1. Always respect Triumph's tone of voice: direct, intentional, earnest, and personal. Do not use humor, puns, or sales language.
    2. Preserve the authentic voice of the original text, including paragraph count, structure, tone, punctuation, and spacing. Do not reformat or restructure content.
    3. Enhance Named Entity Recognition (NER) using the following taxonomy: Brand, ProductType, Material, Feature, Benefit.
    4. Avoid generic one-word entities. Use rich, multi-word phrases (2–5 tokens) with high relevance to fashion and lifestyle contexts.
    5. Use all provided keywords verbatim in high-impact, natural positions. Optimize for SEO performance without keyword stuffing. If a keyword would disrupt tone or grammar, omit it gracefully.
    5a. KEYWORD PLACEMENT PRIORITY: When target keywords are provided, integrate the primary keyword naturally at the BEGINNING of the opening paragraph for maximum SEO impact.
    6. Where relevant, integrate semantically related terms (LSI keywords) to strengthen topical relevance. Use these terms naturally and unobtrusively within the content.
    7. NEVER use inappropriate or objectifying language (e.g. "sexy", "boobs", "tits"). Maintain elegant, refined, and respectful language at all times.
    8. Avoid verb-brand fusion at the start of sentences (e.g. write "Discover the Triumph Fit" not "DiscoverTriumphFit").
    9. When multiple interpretations of an entity are possible, prefer the fashion-related meaning using provided KNOWLEDGE SNIPPETS as guidance.
    10. Communicate benefits emotionally but concretely, using Triumph's brand attributes: empathy, intuition, dynamism, courage, dedication, and open-mindedness.
    11. Ensure every product description answers the following customer-centric questions:
        – What is this product?
        – What problems does it solve?
        – What makes it different from other products?
        – What is it made of?
        – Where does it come from?
        – How do I use this product?
        – Why should I buy this product?
    12. Product descriptions must be unique, informative, and between 200 to 500 words. Avoid thin content at all costs.
    13. Do not output JSON, explanations, markdown, or bullet points — only return the optimized plain text with correct punctuation and original formatting (no added line breaks or structural changes).
    14. Do NOT refer to colors or mention sizes. Descriptions must remain generic and suitable for use across all product variants.
    15. The optimized text should be between 100 and 150 words.
    16. Maintain the original language of the input content. Do not translate unless explicitly instructed.
    17. SUSTAINABILITY CERTIFICATES: If you find the acronyms "GRS" and/or "GOTS" in the Long Description text, you must:
       - In the intro paragraph and bullet points, replace mentions of these acronyms with descriptive terms like "sustainably certified", "eco-certified", "responsibly sourced", or similar sustainability-focused language that briefly indicates the sustainable nature of the materials
       - Add the corresponding sustainability certificate label at the end of the product description:
           - If only "GRS" is found: add "Sustainability certificate GRS"
           - If only "GOTS" is found: add "Sustainability certificate GOTS" 
           - If both "GRS" and "GOTS" are found: add "Sustainability certificate GOTS/GRS"
       - This certificate label should be placed naturally in the text, either as a separate line or before other certifications (e.g., before "OEKO-TEX® STANDARD 100, 93.0.3130 Hohenstein HTTI")
    
    — STRUCTURE RULES (MANDATORY) —
    
    During optimization, follow this precise output structure for Inriver compatibility:
    1. DO NOT add material composition at the beginning - this is managed elsewhere in the system.
    2. Start with a **slightly expanded paragraph introduction** (3 sentences), naturally extending the existing content without adding unnecessary details.
    3. Add a bulleted list using HTML format: <ul class="pd"><li>Feature 1</li> <li>Feature 2</li></ul>
    4. Finish with the certification line and Item Nr. (if present in the original). Do not omit these.
    
    CRITICAL: Always output in HTML format to maintain Inriver compatibility:
    - Use <ul class="pd"> for bullet lists
    - Use <li> for each bullet point (no en dashes)
    - Preserve HTML structure from the original input
    - Do NOT convert to plain text or markdown
    
    If the original text has HTML tags, preserve and optimize within that HTML structure.
    
    — HUMAN STYLE REQUIREMENTS (MANDATORY) —
    
    To reduce the appearance of AI-generated content:
    1. Vary sentence structure and length to improve natural rhythm (increase perplexity and burstiness).
    2. Avoid redundancy. Ensure clarity and engagement throughout.
    3. Do NOT use overused or "AI-signature" phrases such as: 
       "Indeed", "Furthermore", "However", "Notably", "In terms of", "Moreover", "Unlock the potential of", "Delve into the world of", "Pave the way for", "At the forefront of", "Embark on a journey", "Spearhead the initiative", "Navigate the complexities", "It is worth mentioning", etc.
    4. Avoid generic ChatGPT-style words such as "realm", "landscape", "testament", "showcase".
    5. Use direct, simple language. When appropriate, use first-person or conversational phrasing to enhance relatability, as long as tone guidelines are followed.
    6. Avoid formulaic transitions. Let ideas flow naturally and authentically.
    
    Always aim for a refined, confident, human voice and not generic or overly formal. Prioritize clarity and emotional connection over stylistic embellishment.`;

    const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

    console.log(`Starting optimization with ${claudeModel}`);

    // Log the request details for debugging (abbreviated for readability)
    console.log("Claude API request details:", JSON.stringify({
      model: claudeModel,
      system_prompt_length: finalSystemPrompt.length,
      user_prompt_preview: prompt.substring(0, 100) + "...",
      max_tokens: 2000
    }, null, 2));

    let response;

    try {
      // Try the official SDK with browser support
      console.log('🚀 Attempting Claude API call with official SDK (direct browser access)...');
      
      const client = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // Enable browser support
      });

      response = await client.messages.create({
        model: claudeModel,
        system: finalSystemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000
      });

      console.log('✅ Claude SDK call successful - no CORS proxy needed!');

    } catch (sdkError) {
      console.warn('❌ Claude SDK failed, this might indicate we still need CORS proxy:', sdkError);
      
      // Show specific error information
      if (sdkError instanceof Anthropic.AuthenticationError) {
        toast({
          title: "Authentication Failed",
          description: "Invalid Claude API key. Please check your API key in the AI Configuration.",
          variant: "destructive",
        });
        throw sdkError;
      } else if (sdkError instanceof Error && sdkError.message.includes('CORS')) {
        console.log('🔄 CORS error detected, falling back to proxy...');
        
        // Second attempt: Use CORS proxy
        try {
          response = await makeClaudeApiCallWithProxy(
            apiKey,
            claudeModel,
            finalSystemPrompt,
            prompt
          );
          console.log('✅ Claude CORS proxy call successful');
        } catch (proxyError) {
          console.error('❌ Both Claude SDK and CORS proxy failed:', proxyError);
          
          toast({
            title: "Claude API Error",
            description: "Both direct connection and CORS proxy failed. Please try again or use OpenAI instead.",
            variant: "destructive",
          });
          
          throw sdkError; // Throw the original SDK error
        }
      } else {
        // For non-CORS errors, don't try proxy
        toast({
          title: "Claude API Error",
          description: sdkError instanceof Error ? sdkError.message : "An error occurred during API call",
          variant: "destructive",
        });
        throw sdkError;
      }
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
            console.log(`📡 Processing request ${i + index + 1}/${requests.length} with direct SDK`);
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
              console.log(`🔄 Request ${i + index + 1} failed with SDK, trying CORS proxy...`);
              
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
          console.warn(`❌ Request ${i + index + 1} failed (attempt ${attempt + 1}):`, error);
          
          // If it's a rate limit error, wait longer
          if (error instanceof Error && error.message.includes('rate')) {
            const rateLimitDelay = Math.min(retryDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
            console.log(`⏳ Rate limit detected, waiting ${rateLimitDelay}ms...`);
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
  console.log(`📊 Batch processing complete: ${successful}/${requests.length} successful, ${proxied} used CORS proxy, ${failures} failed`);

  return results;
};
