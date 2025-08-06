/**
 * Main optimization utilities that coordinate text optimization with AI
 */
import { Model } from '@/lib/models';
import { OPENAI_API_KEY, ANTHROPIC_API_KEY } from '@/config/env';
import { optimizeWithOpenAI, OpenAIResponse } from './openAiUtils';
import { optimizeWithClaude, ClaudeResponse } from './claudeUtils';

// Re-export keyword utilities for backward compatibility
export { 
  isKeywordInTopPositions, 
  isExactKeywordMatch, 
  isPartialKeywordMatch 
} from './keywordUtils';

export interface OptimizationResult {
  content: string;
  tokens: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Extracts and prepares entity information to improve optimization context
 */
const prepareEntityContext = (analysisResults: any): { 
  potentialIssues: string[],
  brandEntities: string[],
  productEntities: string[]
} => {
  const potentialIssues: string[] = [];
  const brandEntities: string[] = [];
  const productEntities: string[] = [];
  
  if (!analysisResults?.entities || analysisResults.entities.length === 0) {
    return { potentialIssues, brandEntities, productEntities };
  }

  // Process entities to identify different types and potential issues
  analysisResults.entities.forEach((entity: any) => {
    const text = entity.text || '';
    const type = entity.type || '';
    
    // Identify potential issues with entity recognition
    if (text.includes(' ') && ['Organization', 'Company', 'Brand'].includes(type)) {
      // Check if first word might be a verb/action (common sentence starters)
      const words = text.split(' ');
      const firstWord = words[0].toLowerCase();
      const commonVerbs = ['experience', 'discover', 'buy', 'shop', 'find', 'get', 'try'];
      
      if (commonVerbs.includes(firstWord)) {
        potentialIssues.push(`${entity.text} (${entity.type}) - may include verb "${firstWord}"`);
      }
    }
    
    // Categorize entities for better context
    if (['Organization', 'Company', 'Brand'].includes(type)) {
      brandEntities.push(text);
    } else if (['Product', 'ProductType'].includes(type)) {
      productEntities.push(text);
    }
  });

  return { potentialIssues, brandEntities, productEntities };
}

/**
 * Analyzes entities in text to help with optimization
 * This helps identify potential issues with entity recognition
 */
const analyzeEntitiesForOptimization = (analysisResults: any): string => {
  const { potentialIssues, brandEntities, productEntities } = prepareEntityContext(analysisResults);
  
  let analysisNotes = [];
  
  if (potentialIssues.length > 0) {
    analysisNotes.push(`Potential entity recognition issues: ${potentialIssues.join(', ')}`);
  }
  
  if (brandEntities.length > 0) {
    analysisNotes.push(`Identified brands: ${brandEntities.join(', ')}`);
  }
  
  if (productEntities.length > 0) {
    analysisNotes.push(`Identified products: ${productEntities.join(', ')}`);
  }
  
  return analysisNotes.length > 0 ? analysisNotes.join('\n') : "No obvious entity recognition issues";
}

/**
 * Optimizes text using an AI API
 */
export const optimizeTextWithAI = async (
  text: string,
  keywords: string[],
  analysisResults: any,
  model: Model,
  apiKey: string,
  systemPrompt?: string
): Promise<OptimizationResult> => {
  try {
    console.log('%c=== PROCESSING START ===', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
    console.log('%cColumn being examined:', 'font-weight: bold; color: #2196F3;');
    console.log(text);
    console.log('%cTarget keywords:', 'font-weight: bold; color: #2196F3;');
    console.log(keywords);

    // Create a more specific user prompt that works with the detailed system prompt
    const userPrompt = keywords.length > 0 
      ? `Optimize this product description text:

"${text}"

TARGET KEYWORDS FOR NATURAL INTEGRATION:
${keywords.map(keyword => `- ${keyword}`).join('\n')}

KEYWORD PLACEMENT INSTRUCTIONS:
- Integrate the main target keyword naturally at the BEGINNING of the opening paragraph
- Weave additional keywords throughout the text in contextually appropriate positions
- Ensure all keywords feel organic and support the product narrative
- Maintain the professional tone and Triumph brand voice

PARAGRAPH EXPANSION INSTRUCTIONS:
- Extend the opening paragraph to approximately 3 sentences by naturally expanding existing concepts
- Do NOT add new information or unnecessary details
- Simply elaborate on what's already mentioned in a more flowing way

${analysisResults ? `ANALYSIS CONTEXT: ${JSON.stringify(analysisResults)}` : ''}`
      : `Optimize this product description text for clarity, professionalism, and brand alignment:

"${text}"

PARAGRAPH EXPANSION INSTRUCTIONS:
- Extend the opening paragraph to approximately 3 sentences by naturally expanding existing concepts
- Do NOT add new information or unnecessary details
- Simply elaborate on what's already mentioned in a more flowing way

${analysisResults ? `ANALYSIS CONTEXT: ${JSON.stringify(analysisResults)}` : ''}`;

    console.log('%cUser prompt sent:', 'font-weight: bold; color: #2196F3;');
    console.log(userPrompt);
    if (systemPrompt) {
      console.log('%cSystem prompt sent:', 'font-weight: bold; color: #2196F3;');
      console.log(systemPrompt);
    }

    console.log('%cAPI Configuration:', 'font-weight: bold; color: #2196F3;');
    console.log('Provider:', model.provider);
    console.log('Model:', model.id);

    let response: OpenAIResponse | ClaudeResponse;
    if (model.provider === 'openai') {
      if (!apiKey) {
        console.error('%cERROR: OpenAI API Key missing', 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px;');
        throw new Error('OpenAI API key is required. Please enter your API key.');
      }
      console.log('%cCalling OpenAI API...', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;');
      try {
        response = await optimizeWithOpenAI(userPrompt, apiKey, model.id, systemPrompt);
        console.log('%cOpenAI API call successful', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
      } catch (apiError: any) {
        console.error('%cOpenAI API ERROR:', 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px;', {
          error: apiError,
          message: apiError.message,
          status: apiError.status,
          type: apiError.type
        });
        throw apiError;
      }
    } else if (model.provider === 'anthropic') {
      if (!apiKey) {
        console.error('%cERROR: Anthropic API Key missing', 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px;');
        throw new Error('Anthropic API key is required. Please enter your API key.');
      }
      console.log('%cCalling Claude API...', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;');
      try {
        response = await optimizeWithClaude(userPrompt, apiKey, model.id, systemPrompt);
        console.log('%cClaude API call successful', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
      } catch (apiError: any) {
        console.error('%cClaude API ERROR:', 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px;', {
          error: apiError,
          message: apiError.message,
          status: apiError.status,
          type: apiError.type
        });
        throw apiError;
      }
    } else {
      console.error('%cERROR: Unsupported provider', 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px;');
      throw new Error('Unsupported model provider');
    }

    console.log('%c=== OPTIMIZATION COMPLETE ===', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
    console.log('%cResult:', 'font-weight: bold; color: #2196F3;');
    console.log(response.content);
    console.log('%cToken usage:', 'font-weight: bold; color: #2196F3;');
    console.log(`Input tokens: ${response.tokens.inputTokens}, Output tokens: ${response.tokens.outputTokens}`);
    
    return {
      content: response.content,
      tokens: response.tokens
    };
  } catch (error: any) {
    console.error('%c=== OPTIMIZATION ERROR ===', 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px;');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: error.type,
      status: error.status
    });
    throw error;
  }
};
