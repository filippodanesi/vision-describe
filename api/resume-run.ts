/**
 * POST /api/resume-run
 *
 * Re-invokes /api/process-run for a stalled server-side run.
 * Called by the client when polling detects that processed_count
 * hasn't changed for a while (server function died or 508'd).
 *
 * maxDuration: 10s
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
import { supabaseAdmin, verifyUserJwt } from './_lib/supabaseAdmin';

export const config = { maxDuration: 10 };

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

    const { runId } = req.body;
    if (!runId) {
      return res.status(400).json({ error: 'Missing runId' });
    }

    // 2. Validate run exists and belongs to user
    const { data: run, error: runError } = await supabaseAdmin
      .from('runs')
      .select('id, user_id, status, processing_mode, updated_at')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    if (run.user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (run.status !== 'running') {
      return res.status(400).json({ error: `Run is not running (status=${run.status})` });
    }

    // 3. Check if run is actually stale (no update in last 60s)
    const updatedAt = new Date(run.updated_at).getTime();
    const staleSince = Date.now() - updatedAt;
    if (staleSince < 60_000) {
      return res.status(200).json({ resumed: false, reason: 'Run is still active' });
    }

    // 4. Return immediately, invoke process-run in background
    res.status(200).json({ resumed: true });

    const chainingSecret = process.env.CHAINING_SECRET;
    const vercelUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

    waitUntil(
      fetch(`${vercelUrl}/api/process-run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-chaining-secret': chainingSecret || '',
        },
        body: JSON.stringify({ runId }),
      })
        .then((r) => console.log(`resume-run: process-run invoked for ${runId}, status=${r.status}`))
        .catch((err) => console.error(`resume-run: failed to invoke process-run for ${runId}:`, err))
    );
  } catch (err: any) {
    console.error('resume-run error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
