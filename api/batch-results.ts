/**
 * POST /api/batch-results
 *
 * Retrieves results from a completed Anthropic Message Batch, merges them
 * back into the original rows, and saves to the run_results table.
 *
 * maxDuration: 300s
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin, verifyUserJwt, getUserApiKeys } from './_lib/supabaseAdmin';

export const config = { maxDuration: 300 };

/** Sanitize generated text: remove URLs, emails, and prices */
function sanitizeGenerated(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/gi, '')
    .replace(/\b(?:EUR|USD|CHF|GBP)?\s?\d+[\.,]?\d*\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Parse custom_id format: row-{rowIndex}-lang-{lang} */
function parseCustomId(customId: string): { rowIndex: number; lang: string } | null {
  const match = customId.match(/^row-(\d+)-lang-(.+)$/);
  if (!match) return null;
  return { rowIndex: parseInt(match[1], 10), lang: match[2] };
}

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
    const { batchId, runId, rows, langs } = req.body as {
      batchId: string;
      runId: string;
      rows: Record<string, unknown>[];
      langs: string[];
    };

    if (!batchId || !runId) {
      return res.status(400).json({ error: 'Missing batchId or runId' });
    }
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Missing or empty rows array' });
    }
    if (!langs || !Array.isArray(langs) || langs.length === 0) {
      return res.status(400).json({ error: 'Missing or empty langs array' });
    }

    // 3. Get user's Anthropic API key
    const keys = await getUserApiKeys(user.id);
    const apiKey = keys.anthropic_key;
    if (!apiKey) {
      return res.status(400).json({ error: 'No Anthropic API key configured for user' });
    }

    // 4. Stream results from Anthropic batch
    const client = new Anthropic({ apiKey });
    const resultStream = await client.messages.batches.results(batchId);

    // 5. Build merged rows (deep copy)
    const mergedRows: Record<string, unknown>[] = rows.map((r) => ({ ...r }));

    let totalCost = 0;
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let succeededCount = 0;
    let errorCount = 0;

    // 6. Iterate over streamed results
    for await (const entry of resultStream) {
      const parsed = parseCustomId(entry.custom_id);
      if (!parsed) {
        console.warn(`batch-results: could not parse custom_id: ${entry.custom_id}`);
        continue;
      }

      const { rowIndex, lang } = parsed;
      if (rowIndex < 0 || rowIndex >= rows.length) {
        console.warn(`batch-results: rowIndex ${rowIndex} out of bounds`);
        continue;
      }

      if (entry.result.type === 'succeeded') {
        const message = entry.result.message;
        const tokensIn = message.usage?.input_tokens ?? 0;
        const tokensOut = message.usage?.output_tokens ?? 0;
        totalTokensIn += tokensIn;
        totalTokensOut += tokensOut;

        // Extract text from response
        const textBlock = message.content.find(
          (block: any) => block.type === 'text' && 'text' in block
        );
        if (textBlock && 'text' in textBlock) {
          let gen = sanitizeGenerated((textBlock as any).text.trim());

          // Fallback to original description or title if empty
          if (!gen) {
            const descKey = `MaterialLongDescriptionEcom_${lang}`;
            const altTitleKey = `MaterialAlternativeStyle_${lang}`;
            gen = String(
              rows[rowIndex][descKey] ??
              rows[rowIndex][altTitleKey] ??
              rows[rowIndex]['MaterialSeriesName'] ??
              ''
            ).trim();
          }

          mergedRows[rowIndex][`gen_MaterialLongDescriptionEcom_${lang}`] = gen;
        }

        succeededCount++;

        // Save individual result to run_results
        await supabaseAdmin.from('run_results').upsert(
          {
            run_id: runId,
            row_index: rowIndex,
            result_data: mergedRows[rowIndex],
            cost: 0,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
          },
          { onConflict: 'run_id,row_index' }
        );
      } else {
        // Error or expired result
        errorCount++;
        console.warn(
          `batch-results: ${entry.result.type} for ${entry.custom_id}:`,
          entry.result.type === 'errored' ? entry.result.error : 'expired'
        );
      }
    }

    // 7. Update run record as completed
    await supabaseAdmin.from('runs').update({
      status: 'completed',
      processed_count: succeededCount,
      total_cost: totalCost,
      total_tokens_in: totalTokensIn,
      total_tokens_out: totalTokensOut,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', runId);

    return res.status(200).json({
      rows: mergedRows,
      totalCost,
      totalTokensIn,
      totalTokensOut,
      succeededCount,
      errorCount,
    });
  } catch (err: any) {
    console.error('batch-results error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
