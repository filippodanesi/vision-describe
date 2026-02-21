/**
 * POST /api/start-run
 *
 * Receives file data + config, creates a run record, uploads rows to Storage,
 * and fires off /api/process-run asynchronously.
 *
 * maxDuration: 30s (Vercel Pro)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, verifyUserJwt } from './_lib/supabaseAdmin';
import type { StartRunRequest, StartRunResponse } from './_lib/types';

export const config = { maxDuration: 30 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const jwt = authHeader.slice(7);
    const user = await verifyUserJwt(jwt);

    // 2. Parse request body
    const body = req.body as StartRunRequest;
    if (!body.config || !body.config.useCase || !body.config.modelId) {
      return res.status(400).json({ error: 'Missing required config fields (useCase, modelId)' });
    }
    if (!body.rows || body.rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided' });
    }

    const effectiveRows = body.config.dryRun ? body.rows.slice(0, 10) : body.rows;

    // 3. Create run record
    const runId = crypto.randomUUID();
    const storagePath = `${user.id}/${runId}.json`;

    const { error: runError } = await supabaseAdmin.from('runs').insert({
      id: runId,
      user_id: user.id,
      use_case: body.config.useCase,
      model_id: body.config.modelId,
      file_name: body.fileName || null,
      total_rows: effectiveRows.length,
      config: body.config as unknown as Record<string, unknown>,
      status: 'running',
      processing_mode: 'server',
      file_storage_path: storagePath,
      processed_count: 0,
      chain_count: 0,
      project_id: body.config.projectId || null,
    });

    if (runError) {
      console.error('Failed to create run:', runError);
      return res.status(500).json({ error: 'Failed to create run record' });
    }

    // 4. Upload rows to Supabase Storage
    const rowsJson = JSON.stringify(effectiveRows);
    const { error: uploadError } = await supabaseAdmin.storage
      .from('run-files')
      .upload(storagePath, rowsJson, {
        contentType: 'application/json',
        upsert: true,
      });

    if (uploadError) {
      console.error('Failed to upload rows:', uploadError);
      // Clean up the run record
      await supabaseAdmin.from('runs').delete().eq('id', runId);
      return res.status(500).json({ error: 'Failed to upload file data' });
    }

    // 5. Fire-and-forget: invoke /api/process-run
    const chainingSecret = process.env.CHAINING_SECRET;
    const vercelUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

    // Fire and forget — don't await
    fetch(`${vercelUrl}/api/process-run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-chaining-secret': chainingSecret || '',
      },
      body: JSON.stringify({ runId }),
    }).catch((err) => {
      console.error('Failed to invoke process-run:', err);
    });

    // 6. Return runId immediately
    const response: StartRunResponse = { runId };
    return res.status(200).json(response);
  } catch (err: any) {
    console.error('start-run error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
