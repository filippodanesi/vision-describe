// Environment variable helper utilities for VisionDescribe

// Vite exposes env variables prefixed with VITE_ via import.meta.env
// For local development a .env[.local] file can be used.

export const OPENAI_API_KEY: string | undefined = import.meta.env.VITE_OPENAI_API_KEY;
export const ANTHROPIC_API_KEY: string | undefined = import.meta.env.VITE_ANTHROPIC_API_KEY;

/**
 * Simple runtime check ensuring at least one API key is present.
 */
export const validateEnv = (): boolean => {
  return Boolean(OPENAI_API_KEY || ANTHROPIC_API_KEY);
}; 