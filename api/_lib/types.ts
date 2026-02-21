/** Shared types for server-side processing API */

export interface StartRunRequest {
  /** Base64-encoded file content (for small files) */
  fileBase64?: string;
  /** Storage path if file was uploaded directly to Supabase Storage */
  fileStoragePath?: string;
  /** Original file name */
  fileName: string;
  /** Parsed rows as JSON (when sent inline) */
  rows?: Record<string, unknown>[];
  /** Processing configuration */
  config: RunConfig;
}

export interface RunConfig {
  useCase: 'ecommerce' | 'amazon' | 'partoo' | 'next' | 'aboutyou';
  modelId: string;
  selectedColumns?: string[];
  mappings?: Record<string, unknown>;
  lang?: string;
  dryRun?: boolean;
  businessIdsFilter?: string[];
  storeTypeFilter?: string[];
  colorMappings?: unknown[];
  sizeMappings?: unknown[];
  projectId?: string;
}

export interface StartRunResponse {
  runId: string;
}

export interface ProcessRunPayload {
  runId: string;
}

export interface CancelRunRequest {
  runId: string;
}

export interface RunRow {
  index: number;
  data: Record<string, unknown>;
}

export interface RunDbRecord {
  id: string;
  user_id: string;
  use_case: string;
  model_id: string;
  file_name: string | null;
  total_rows: number;
  config: Record<string, unknown>;
  status: 'running' | 'completed' | 'interrupted' | 'cancelled';
  total_cost: number;
  total_tokens_in: number;
  total_tokens_out: number;
  processed_count: number;
  file_storage_path: string | null;
  processing_mode: 'client' | 'server';
  chain_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  project_id: string | null;
}

export interface UserSettings {
  openai_key: string | null;
  anthropic_key: string | null;
}
