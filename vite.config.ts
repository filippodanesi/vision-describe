import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from 'fs';
import dotenv from 'dotenv';

// Define the type for our environment variables
interface EnvVariables {
  NATURAL_LANGUAGE_UNDERSTANDING_APIKEY?: string;
  NATURAL_LANGUAGE_UNDERSTANDING_URL?: string;
  NATURAL_LANGUAGE_UNDERSTANDING_AUTH_TYPE?: string;
  [key: string]: string | undefined;
}

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '') as EnvVariables;
  
  // Try to load from ibm-credentials.env if it exists
  let ibmCredentials: EnvVariables = {};
  if (fs.existsSync('./ibm-credentials.env')) {
    ibmCredentials = dotenv.parse(fs.readFileSync('./ibm-credentials.env')) as EnvVariables;
  }
  
  // Merge environment variables (Vercel env vars take precedence)
  const finalEnv: EnvVariables = {
    ...ibmCredentials,
    ...env
  };
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    esbuild: {
      // Strip debug logs from prod bundles. console.error / console.warn stay
      // because they back our toast-based error reporting.
      pure: mode === 'production'
        ? ['console.log', 'console.info', 'console.debug', 'console.trace']
        : [],
    },
    build: {
      target: 'es2020',
      sourcemap: false,
      rollupOptions: {
        output: {
          // Vite 8 (rolldown) only accepts the function form of manualChunks
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (/node_modules\/(react|react-dom|react-router-dom)\//.test(id)) return 'vendor-react';
            if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-query';
            if (id.includes('node_modules/@radix-ui/')) return 'vendor-radix';
            if (/node_modules\/(xlsx|exceljs|papaparse)\//.test(id)) return 'vendor-sheets';
            if (id.includes('node_modules/@anthropic-ai/sdk')) return 'vendor-ai';
          },
        },
      },
    },
    define: {
      // Support both formats
      'import.meta.env.NATURAL_LANGUAGE_UNDERSTANDING_APIKEY': JSON.stringify(finalEnv.NATURAL_LANGUAGE_UNDERSTANDING_APIKEY),
      'import.meta.env.NATURAL_LANGUAGE_UNDERSTANDING_URL': JSON.stringify(finalEnv.NATURAL_LANGUAGE_UNDERSTANDING_URL),
      'import.meta.env.NATURAL_LANGUAGE_UNDERSTANDING_AUTH_TYPE': JSON.stringify(finalEnv.NATURAL_LANGUAGE_UNDERSTANDING_AUTH_TYPE || 'iam'),
      // VITE_ prefixed versions
      'import.meta.env.VITE_NATURAL_LANGUAGE_UNDERSTANDING_APIKEY': JSON.stringify(finalEnv.NATURAL_LANGUAGE_UNDERSTANDING_APIKEY),
      'import.meta.env.VITE_NATURAL_LANGUAGE_UNDERSTANDING_URL': JSON.stringify(finalEnv.NATURAL_LANGUAGE_UNDERSTANDING_URL),
      'import.meta.env.VITE_NATURAL_LANGUAGE_UNDERSTANDING_AUTH_TYPE': JSON.stringify(finalEnv.NATURAL_LANGUAGE_UNDERSTANDING_AUTH_TYPE || 'iam'),
    },
  };
});
