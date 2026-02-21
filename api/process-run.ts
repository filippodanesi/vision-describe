/**
 * POST /api/process-run
 *
 * The core processing worker. Processes rows one by one, saves results,
 * and self-chains when approaching the time limit.
 *
 * Authenticated via x-chaining-secret (not callable from browser).
 *
 * maxDuration: 800s (Vercel Pro)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, getUserApiKeys } from './_lib/supabaseAdmin';
import { processRow } from './_lib/processors';
import type { ProcessRunPayload, RunDbRecord, RunConfig } from './_lib/types';

export const config = { maxDuration: 800 };

/** Time limit for self-chaining (720s = 12 min), leaving 80s buffer */
const CHAIN_THRESHOLD_MS = 720 * 1000;
/** Check for cancellation every N rows */
const CANCEL_CHECK_INTERVAL = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Authenticate via chaining secret
  const chainingSecret = process.env.CHAINING_SECRET;
  if (!chainingSecret || req.headers['x-chaining-secret'] !== chainingSecret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { runId } = req.body as ProcessRunPayload;
  if (!runId) {
    return res.status(400).json({ error: 'Missing runId' });
  }

  // Respond immediately to the caller (fire-and-forget pattern)
  res.status(202).json({ accepted: true, runId });

  const startTime = Date.now();

  try {
    // 2. Load run record
    const { data: run, error: runError } = await supabaseAdmin
      .from('runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError || !run) {
      console.error('Run not found:', runId, runError);
      return;
    }

    const runRecord = run as RunDbRecord;
    if (runRecord.status !== 'running') {
      console.log(`Run ${runId} is not running (status=${runRecord.status}), skipping`);
      return;
    }

    // 3. Load user API keys
    const keys = await getUserApiKeys(runRecord.user_id);
    const runConfig = runRecord.config as unknown as RunConfig;
    const provider = runConfig.modelId.includes('claude') || runConfig.modelId.includes('anthropic')
      ? 'anthropic'
      : 'openai';
    const apiKey = provider === 'openai' ? keys.openai_key : keys.anthropic_key;

    if (!apiKey) {
      await markError(runId, `No ${provider} API key configured for user`);
      return;
    }

    // 4. Download rows from Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('run-files')
      .download(runRecord.file_storage_path!);

    if (downloadError || !fileData) {
      await markError(runId, 'Failed to download file data from storage');
      return;
    }

    const rowsText = await fileData.text();
    const allRows: Record<string, unknown>[] = JSON.parse(rowsText);

    // 5. Get already-completed row indices
    const { data: completedData } = await supabaseAdmin
      .from('run_results')
      .select('row_index')
      .eq('run_id', runId);

    const completedIndices = new Set((completedData || []).map((r: any) => r.row_index));

    // 6. Processing loop
    let processedInThisChain = 0;
    let totalCost = runRecord.total_cost || 0;
    let totalTokensIn = runRecord.total_tokens_in || 0;
    let totalTokensOut = runRecord.total_tokens_out || 0;
    let currentProcessedCount = runRecord.processed_count || completedIndices.size;

    for (let i = 0; i < allRows.length; i++) {
      // Skip already-completed rows
      if (completedIndices.has(i)) continue;

      // Check for cancellation every N rows
      if (processedInThisChain > 0 && processedInThisChain % CANCEL_CHECK_INTERVAL === 0) {
        const { data: freshRun } = await supabaseAdmin
          .from('runs')
          .select('status')
          .eq('id', runId)
          .single();

        if (freshRun?.status === 'cancelled') {
          console.log(`Run ${runId} was cancelled`);
          return;
        }
      }

      // Check time limit for self-chaining
      const elapsed = Date.now() - startTime;
      if (elapsed > CHAIN_THRESHOLD_MS) {
        console.log(`Run ${runId}: time limit reached (${Math.round(elapsed / 1000)}s), self-chaining...`);
        await selfChain(runId, runRecord.chain_count, req);

        // Update cost summary before exiting
        await supabaseAdmin.from('runs').update({
          total_cost: totalCost,
          total_tokens_in: totalTokensIn,
          total_tokens_out: totalTokensOut,
          updated_at: new Date().toISOString(),
        }).eq('id', runId);

        return;
      }

      // Process the row
      try {
        const { result, cost, tokensIn, tokensOut } = await processRow(
          allRows[i],
          i,
          apiKey,
          runConfig
        );

        // Save result
        await supabaseAdmin.from('run_results').upsert(
          {
            run_id: runId,
            row_index: i,
            result_data: result,
            cost,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
          },
          { onConflict: 'run_id,row_index' }
        );

        totalCost += cost;
        totalTokensIn += tokensIn;
        totalTokensOut += tokensOut;
        currentProcessedCount++;
        processedInThisChain++;

        // Update processed_count (live progress) + heartbeat
        await supabaseAdmin.from('runs').update({
          processed_count: currentProcessedCount,
          updated_at: new Date().toISOString(),
        }).eq('id', runId);

      } catch (rowError: any) {
        console.error(`Run ${runId}: error processing row ${i}:`, rowError);
        // Save error but continue processing other rows
        await supabaseAdmin.from('run_results').upsert(
          {
            run_id: runId,
            row_index: i,
            result_data: { ...allRows[i], _error: rowError.message },
            cost: 0,
            tokens_in: 0,
            tokens_out: 0,
          },
          { onConflict: 'run_id,row_index' }
        );
        currentProcessedCount++;
        processedInThisChain++;

        await supabaseAdmin.from('runs').update({
          processed_count: currentProcessedCount,
          updated_at: new Date().toISOString(),
        }).eq('id', runId);
      }
    }

    // 7. All rows done — mark completed
    await supabaseAdmin.from('runs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      processed_count: currentProcessedCount,
      total_cost: totalCost,
      total_tokens_in: totalTokensIn,
      total_tokens_out: totalTokensOut,
      updated_at: new Date().toISOString(),
    }).eq('id', runId);

    console.log(`Run ${runId}: completed (${currentProcessedCount} rows, chain=${runRecord.chain_count})`);

  } catch (err: any) {
    console.error(`Run ${runId}: fatal error:`, err);
    await markError(runId, err.message || 'Unknown processing error');
  }
}

/** Mark a run as interrupted with an error message */
async function markError(runId: string, message: string) {
  await supabaseAdmin.from('runs').update({
    status: 'interrupted',
    error_message: message,
    updated_at: new Date().toISOString(),
  }).eq('id', runId);
}

/** Self-chain: invoke another instance of this function */
async function selfChain(runId: string, currentChainCount: number, req: VercelRequest) {
  const chainingSecret = process.env.CHAINING_SECRET;
  // Use the incoming request host (production domain) instead of VERCEL_URL
  // which points to the deployment-specific domain behind Deployment Protection.
  const vercelUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

  // Increment chain_count
  await supabaseAdmin.from('runs').update({
    chain_count: currentChainCount + 1,
    updated_at: new Date().toISOString(),
  }).eq('id', runId);

  try {
    await fetch(`${vercelUrl}/api/process-run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-chaining-secret': chainingSecret || '',
      },
      body: JSON.stringify({ runId }),
    });
    console.log(`Run ${runId}: self-chain invoked (chain #${currentChainCount + 1})`);
  } catch (err) {
    console.error(`Run ${runId}: self-chain failed:`, err);
    // If self-chain fails, the run will become stale and get marked interrupted
    // by the client-side markStaleRunsInterrupted logic
  }
}
