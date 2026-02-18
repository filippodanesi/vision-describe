import { useState, useEffect } from 'react';

// Define the AI provider type
export type AIProvider = "openai" | "anthropic";

/**
 * Hook for managing optimization configuration.
 * API keys are now provided externally via ApiKeysContext —
 * this hook only manages model/provider selection and CORS proxy.
 */
export const useOptimizationConfig = (externalOpenAIKey?: string, externalAnthropicKey?: string) => {
  const [openAIKey, setOpenAIKey] = useState(externalOpenAIKey || '');
  const [anthropicKey, setAnthropicKey] = useState(externalAnthropicKey || '');

  // Sync with external keys when they change
  useEffect(() => {
    if (externalOpenAIKey !== undefined) setOpenAIKey(externalOpenAIKey);
  }, [externalOpenAIKey]);
  useEffect(() => {
    if (externalAnthropicKey !== undefined) setAnthropicKey(externalAnthropicKey);
  }, [externalAnthropicKey]);

  const [aiModel, setAiModel] = useState(() => {
    const savedModel = sessionStorage.getItem('ai_model') || "o4-mini";
    if (savedModel.startsWith("claude")) {
      return "claude-sonnet-4-0";
    }
    return savedModel;
  });

  const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
    const savedModel = sessionStorage.getItem('ai_model') || "o4-mini";
    return savedModel.startsWith("claude") ? "anthropic" : "openai";
  });

  const [apiKey, setApiKeyState] = useState(() => {
    const savedModel = sessionStorage.getItem('ai_model') || "o4-mini";
    return savedModel.startsWith("claude") ? (externalAnthropicKey || '') : (externalOpenAIKey || '');
  });

  // Effect to manage provider-specific API keys
  useEffect(() => {
    if (aiProvider === "openai") {
      setApiKeyState(openAIKey);
    } else {
      setApiKeyState(anthropicKey);
    }
  }, [aiProvider, openAIKey, anthropicKey]);

  // CORS proxy configuration
  const [corsProxyUrl, setCorsProxyUrl] = useState(() => {
    return sessionStorage.getItem('cors_proxy_url') || "";
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const newProxyUrl = sessionStorage.getItem('cors_proxy_url') || "";
      setCorsProxyUrl(newProxyUrl);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const storeApiKey = (key: string) => {
    setApiKeyState(key);
  };

  const storeAiModel = (model: string) => {
    if (model) sessionStorage.setItem('ai_model', model);
    setAiModel(model);
    const newProvider = model.startsWith("claude") ? "anthropic" : "openai";
    setAiProvider(newProvider);

    if (newProvider === "openai") {
      setApiKeyState(openAIKey);
    } else {
      setApiKeyState(anthropicKey);
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
