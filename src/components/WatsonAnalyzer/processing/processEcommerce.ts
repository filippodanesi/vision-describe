import { Model } from '@/lib/models';
import { optimizeTextWithAI } from '../utils/optimizationUtils';
import { ECOMMERCE_SYSTEM_PROMPT } from '../utils/prompts/ecommerceSystemPrompt';
import { buildEcomOptimizePrompt } from '../utils/prompts/ecommerceTasks';

export async function processEcommerceRows(
  rows: any[],
  model: Model,
  apiKey: string,
  lang: string,
  addLog?: (msg: string) => void
): Promise<any[]> {
  const out: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const processed = { ...row } as any;

    const id = String(row['MaterialSAPMaterialNo'] ?? row['ColorSAPMaterialNo'] ?? `row-${i + 1}`);
    const descKey = `MaterialLongDescriptionEcom_${lang}`;
    const description = String(row[descKey] ?? '');

    // Optional short hint mapping names vary; attempt broad match
    const shortHintKey = Object.keys(row).find(k => /short description/i.test(k) && new RegExp(`\b${lang}\b`, 'i').test(k));
    const shortHint = shortHintKey ? String(row[shortHintKey] ?? '') : '';

    // Title: AlternativeStyle_${lang} or MaterialSeriesName
    const altTitleKey = `MaterialAlternativeStyle_${lang}`;
    const title = String(row[altTitleKey] ?? row['MaterialSeriesName'] ?? '');

    addLog?.(`${id} | ecom:${lang} | shortHint=${Boolean(shortHint)}`);

    if (!description) {
      out.push(processed);
      continue;
    }

    const res = await optimizeTextWithAI(
      buildEcomOptimizePrompt({ title, description, shortHint, language: lang }),
      [],
      null,
      model,
      apiKey,
      ECOMMERCE_SYSTEM_PROMPT
    );
    let gen = (res.content || '').trim();
    // Basic validations: strip links/emails/prices, normalize spacing
    gen = gen
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/gi, '')
      .replace(/\b(?:EUR|USD|CHF|GBP)?\s?\d+[\.,]?\d*\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (!gen) gen = (description || title || '').toString().trim();
    processed['gen_description'] = gen;

    out.push(processed);
  }

  return out;
}


