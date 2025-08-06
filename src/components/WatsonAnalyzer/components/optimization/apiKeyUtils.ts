
import type { AIProvider } from '../../hooks/optimization/useOptimizationConfig';

/**
 * Validates API key format for better user feedback
 */
export const validateApiKey = (key: string, provider: AIProvider): string | null => {
  if (!key || key.trim() === "") return null;
  
  if (provider === "anthropic" && !key.startsWith("sk-ant-") && !key.startsWith("sk-")) {
    return "Claude API keys typically start with 'sk-ant-'";
  }
  
  if (provider === "openai" && !key.startsWith("sk-")) {
    return "OpenAI API keys typically start with 'sk-'";
  }
  
  return null;
};
