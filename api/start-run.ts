/**
 * POST /api/start-run
 *
 * Receives config + either inline rows or a storage path to pre-uploaded rows.
 * Creates a run record and fires off /api/process-run asynchronously.
 *
 * maxDuration: 30s (Vercel Pro)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, verifyUserJwt } from './_lib/supabaseAdmin';
import type { StartRunResponse } from './_lib/types';

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
    const body = req.body;
    if (!body.config || !body.config.useCase || !body.config.modelId) {
      return res.status(400).json({ error: 'Missing required config fields (useCase, modelId)' });
    }

    // Accept either pre-uploaded storage path OR inline rows
    const hasStoragePath = Boolean(body.fileStoragePath);
    const hasInlineRows = Array.isArray(body.rows) && body.rows.length > 0;

    if (!hasStoragePath && !hasInlineRows) {
      return res.status(400).json({ error: 'Provide either fileStoragePath or rows' });
    }

    let storagePath: string;
    let totalRows: number;
    const runId = crypto.randomUUID();

    if (hasStoragePath) {
      // Rows already uploaded by client — just use the path
      storagePath = body.fileStoragePath;
      totalRows = body.totalRows || 0;

      // Validate the file exists in storage
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('run-files')
        .download(storagePath);

      if (downloadError || !fileData) {
        return res.status(400).json({ error: 'File not found at provided storage path' });
      }

      // If totalRows not provided, count from the file
      if (!totalRows) {
        const text = await fileData.text();
        const rows = JSON.parse(text);
        totalRows = body.config.dryRun ? Math.min(rows.length, 10) : rows.length;
      } else if (body.config.dryRun) {
        totalRows = Math.min(totalRows, 10);
      }
    } else {
      // Inline rows — upload to storage
      const effectiveRows = body.config.dryRun ? body.rows.slice(0, 10) : body.rows;
      totalRows = effectiveRows.length;
      storagePath = `${user.id}/${runId}.json`;

      const rowsJson = JSON.stringify(effectiveRows);
      const { error: uploadError } = await supabaseAdmin.storage
        .from('run-files')
        .upload(storagePath, rowsJson, {
          contentType: 'application/json',
          upsert: true,
        });

      if (uploadError) {
        console.error('Failed to upload rows:', uploadError);
        return res.status(500).json({ error: 'Failed to upload file data' });
      }
    }

    // 3. Create run record
    const { error: runError } = await supabaseAdmin.from('runs').insert({
      id: runId,
      user_id: user.id,
      use_case: body.config.useCase,
      model_id: body.config.modelId,
      file_name: body.fileName || null,
      total_rows: totalRows,
      config: body.config as Record<string, unknown>,
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

    // 4. Fire-and-forget: invoke /api/process-run
    const chainingSecret = process.env.CHAINING_SECRET;
    // Use the incoming request host (production domain) instead of VERCEL_URL
    // which points to the deployment-specific domain behind Deployment Protection.
    const vercelUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

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

    // 5. Return runId immediately
    const response: StartRunResponse = { runId };
    return res.status(200).json(response);
  } catch (err: any) {
    console.error('start-run error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
