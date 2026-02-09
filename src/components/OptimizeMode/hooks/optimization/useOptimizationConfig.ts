import { useState, useEffect } from 'react';
import { OPENAI_API_KEY, ANTHROPIC_API_KEY } from '@/config/env';

// Define the AI provider type
export type AIProvider = "openai" | "anthropic";

/**
 * Hook for managing optimization configuration
 */
export const useOptimizationConfig = () => {
  // AI configuration
  const [apiKey, setApiKey] = useState(() => {
    return sessionStorage.getItem('ai_api_key') || "";
  });
  
  const [openAIKey, setOpenAIKey] = useState(() => {
    return sessionStorage.getItem('openai_api_key') || OPENAI_API_KEY || "";
  });
  
  const [anthropicKey, setAnthropicKey] = useState(() => {
    return sessionStorage.getItem('anthropic_api_key') || ANTHROPIC_API_KEY || "";
  });
  
  const [aiModel, setAiModel] = useState(() => {
    const savedModel = sessionStorage.getItem('ai_model') || "o4-mini";
    // Update to Claude 4 Sonnet if using Claude
    if (savedModel.startsWith("claude")) {
      return "claude-sonnet-4-0";
    }
    return savedModel;
  });
  
  const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
    const savedModel = sessionStorage.getItem('ai_model') || "o4-mini";
    return savedModel.startsWith("claude") ? "anthropic" : "openai";
  });

  // Effect to manage provider-specific API keys
  useEffect(() => {
    if (aiProvider === "openai") {
      setApiKey(openAIKey);
    } else {
      setApiKey(anthropicKey);
    }
  }, [aiProvider, openAIKey, anthropicKey]);

  // Effect to set initial API key on mount
  useEffect(() => {
    if (aiProvider === "openai" && openAIKey) {
      setApiKey(openAIKey);
    } else if (aiProvider === "anthropic" && anthropicKey) {
      setApiKey(anthropicKey);
    }
  }, []);

  // CORS proxy configuration
  const [corsProxyUrl, setCorsProxyUrl] = useState(() => {
    return sessionStorage.getItem('cors_proxy_url') || "";
  });

  // Update corsProxyUrl when it changes in sessionStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newProxyUrl = sessionStorage.getItem('cors_proxy_url') || "";
      setCorsProxyUrl(newProxyUrl);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save to sessionStorage when values change
  const storeApiKey = (key: string) => {
    if (key) {
      if (aiProvider === "openai") {
        sessionStorage.setItem('openai_api_key', key);
        setOpenAIKey(key);
      } else {
        sessionStorage.setItem('anthropic_api_key', key);
        setAnthropicKey(key);
      }
      sessionStorage.setItem('ai_api_key', key);
    }
    setApiKey(key);
  };

  const storeAiModel = (model: string) => {
    if (model) sessionStorage.setItem('ai_model', model);
    setAiModel(model);
    // Update provider based on model
    const newProvider = model.startsWith("claude") ? "anthropic" : "openai";
    setAiProvider(newProvider);
    
    // Switch to the appropriate API key for the selected provider
    if (newProvider === "openai") {
      setApiKey(openAIKey);
    } else {
      setApiKey(anthropicKey);
    }
  };

  return {
    apiKey,
    setApiKey: storeApiKey,
    aiModel,
    setAiModel: storeAiModel,
    aiProvider,
    setAiProvider,
    corsProxyUrl,
    setCorsProxyUrl,
    openAIKey,
    anthropicKey,
  };
};
