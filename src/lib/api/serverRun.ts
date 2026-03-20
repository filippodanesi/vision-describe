/**
 * Client-side API for server-side run management.
 *
 * startServerRun  — uploads rows to Supabase Storage, then calls /api/start-run with the path
 * cancelServerRun — cancels a running server-side run
 */
import { supabase } from '../supabase';

export interface ServerRunConfig {
  useCase: 'ecommerce' | 'amazon' | 'partoo' | 'next' | 'aboutyou';
  modelId: string;
  selectedColumns?: string[];
  mappings?: Record<string, unknown>;
  lang?: string;
  langs?: string[];
  dryRun?: boolean;
  businessIdsFilter?: string[];
  storeTypeFilter?: string[];
  colorMappings?: unknown[];
  sizeMappings?: unknown[];
  projectId?: string;
}

/**
 * Start a server-side processing run.
 *
 * Always uploads rows to Supabase Storage first (avoids Vercel 4.5 MB body limit),
 * then passes only the storage path + config to /api/start-run.
 */
export async function startServerRun(
  rows: Record<string, unknown>[],
  fileName: string,
  config: ServerRunConfig
): Promise<{ runId: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // 1. Upload rows to Supabase Storage (bypasses Vercel body size limit)
  const tempId = crypto.randomUUID();
  const storagePath = `${user.id}/${tempId}.json`;
  const rowsJson = JSON.stringify(rows);

  const { error: uploadError } = await supabase.storage
    .from('run-files')
    .upload(storagePath, rowsJson, {
      contentType: 'application/json',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file data: ${uploadError.message}`);
  }

  // 2. Call /api/start-run with just the storage path (small payload)
  const response = await fetch('/api/start-run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      fileStoragePath: storagePath,
      totalRows: rows.length,
      fileName,
      config,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Resume a stalled server-side run.
 * Called when polling detects no progress for a while.
 * Returns true if the server accepted the resume, false if the run is still active.
 */
export async function resumeServerRun(runId: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/resume-run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ runId }),
  });

  if (!response.ok) return false;
  const data = await response.json();
  return data.resumed === true;
}

/**
 * Cancel a server-side processing run.
 */
export async function cancelServerRun(runId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/cancel-run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ runId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }
}

/**
 * Start a batch processing run on Anthropic's Batch API.
 */
export async function startBatchRun(
  rows: Record<string, unknown>[],
  fileName: string,
  config: ServerRunConfig,
  langs: string[]
): Promise<{ runId: string; batchId: string; totalRequests: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // 1. Upload rows to Supabase Storage (bypasses Vercel body size limit)
  const tempId = crypto.randomUUID();
  const storagePath = `${user.id}/${tempId}.json`;
  const rowsJson = JSON.stringify(rows);

  const { error: uploadError } = await supabase.storage
    .from('run-files')
    .upload(storagePath, rowsJson, {
      contentType: 'application/json',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload file data: ${uploadError.message}`);
  }

  // 2. Call /api/batch-create with storage path + config
  const response = await fetch('/api/batch-create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      fileStoragePath: storagePath,
      fileName,
      config,
      langs,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Poll the status of an Anthropic batch run.
 */
export async function pollBatchStatus(
  batchId: string,
  runId: string
): Promise<{ status: string; requestCounts: any }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/batch-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ batchId, runId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Download and merge results from a completed Anthropic batch.
 */
export async function downloadBatchResults(
  batchId: string,
  runId: string,
  rows: Record<string, unknown>[],
  langs: string[]
): Promise<any[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/batch-results', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ batchId, runId, rows, langs }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.results;
}
