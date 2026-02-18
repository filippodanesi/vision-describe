// Environment variable helper utilities for VisionDescribe

// Vite exposes env variables prefixed with VITE_ via import.meta.env
// For local development a .env[.local] file can be used.

export const SUPABASE_URL: string | undefined = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;
