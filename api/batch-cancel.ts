/**
 * POST /api/batch-cancel
 *
 * Cancels an Anthropic Message Batch. This prevents any remaining
 * un-processed requests from being executed.
 *
 * maxDuration: 10s
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin, verifyUserJwt, getUserApiKeys } from './_lib/supabaseAdmin';

export const config = { maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const jwt = authHeader.slice(7);
    const user = await verifyUserJwt(jwt);

    const { batchId, runId } = req.body as { batchId: string; runId: string };
    if (!batchId) {
      return res.status(400).json({ error: 'Missing batchId' });
    }

    const keys = await getUserApiKeys(user.id);
    const apiKey = keys.anthropic_key;
    if (!apiKey) {
      return res.status(400).json({ error: 'No Anthropic API key configured for user' });
    }

    const client = new Anthropic({ apiKey });
    const batch = await client.messages.batches.cancel(batchId);

    // Update run record
    if (runId) {
      await supabaseAdmin.from('runs').update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('id', runId);
    }

    return res.status(200).json({
      batchId: batch.id,
      status: batch.processing_status,
    });
  } catch (err: any) {
    console.error('batch-cancel error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
