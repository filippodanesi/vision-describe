/**
 * POST /api/cancel-run
 *
 * Cancels a running server-side processing run.
 * The worker checks for cancellation every ~10 rows.
 *
 * maxDuration: 10s
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, verifyUserJwt } from './_lib/supabaseAdmin';
import type { CancelRunRequest } from './_lib/types';

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

    // 2. Parse request
    const { runId } = req.body as CancelRunRequest;
    if (!runId) {
      return res.status(400).json({ error: 'Missing runId' });
    }

    // 3. Verify run belongs to user and is running
    const { data: run, error } = await supabaseAdmin
      .from('runs')
      .select('id, user_id, status')
      .eq('id', runId)
      .single();

    if (error || !run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    if (run.user_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this run' });
    }

    if (run.status !== 'running') {
      return res.status(400).json({ error: `Run is not running (status=${run.status})` });
    }

    // 4. Set status to cancelled
    const { error: updateError } = await supabaseAdmin
      .from('runs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to cancel run' });
    }

    return res.status(200).json({ success: true, runId });
  } catch (err: any) {
    console.error('cancel-run error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
