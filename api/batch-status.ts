/**
 * POST /api/batch-status
 *
 * Checks the status of an Anthropic Message Batch and updates the run's progress.
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
    // 1. Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const jwt = authHeader.slice(7);
    const user = await verifyUserJwt(jwt);

    // 2. Parse request body
    const { batchId, runId } = req.body as { batchId: string; runId: string };
    if (!batchId || !runId) {
      return res.status(400).json({ error: 'Missing batchId or runId' });
    }

    // 3. Get user's Anthropic API key
    const keys = await getUserApiKeys(user.id);
    const apiKey = keys.anthropic_key;
    if (!apiKey) {
      return res.status(400).json({ error: 'No Anthropic API key configured for user' });
    }

    // 4. Retrieve batch status from Anthropic
    const client = new Anthropic({ apiKey });
    const batch = await client.messages.batches.retrieve(batchId);

    // 5. Update run's processed_count based on succeeded requests
    const succeededCount = batch.request_counts?.succeeded ?? 0;
    await supabaseAdmin.from('runs').update({
      processed_count: succeededCount,
      updated_at: new Date().toISOString(),
    }).eq('id', runId);

    return res.status(200).json({
      batchId: batch.id,
      status: batch.processing_status,
      request_counts: batch.request_counts,
      created_at: batch.created_at,
      ended_at: batch.ended_at,
    });
  } catch (err: any) {
    console.error('batch-status error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
