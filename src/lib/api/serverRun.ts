/**
 * Client-side API for server-side run management.
 *
 * startServerRun  — uploads file data + config, returns runId
 * cancelServerRun — cancels a running server-side run
 */
import { supabase } from '../supabase';

export interface ServerRunConfig {
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

/**
 * Start a server-side processing run.
 *
 * For files > 4 MB: upload directly to Supabase Storage first,
 * then pass `fileStoragePath`. Otherwise rows are sent inline.
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

  const response = await fetch('/api/start-run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      rows,
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
