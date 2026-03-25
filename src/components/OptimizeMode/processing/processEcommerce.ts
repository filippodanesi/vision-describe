import { Model } from '@/lib/models';
import { optimizeTextWithAI } from '../utils/optimizationUtils';
import { ECOMMERCE_SYSTEM_PROMPT, SLOGGI_ECOMMERCE_SYSTEM_PROMPT } from '../utils/prompts/ecommerceSystemPrompt';
import { buildEcomOptimizePrompt } from '../utils/prompts/ecommerceTasks';

/** Detect whether a row belongs to sloggi based on MaterialBrand column. */
function isSloggiBrand(row: Record<string, unknown>): boolean {
  const brand = String(row['MaterialBrand'] ?? row['MaterialMasterBrand'] ?? '').trim().toLowerCase();
  return brand === 'sloggi' || brand === 'sg';
}

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
    const shortHintKey = Object.keys(row).find(k => {
      const lower = k.toLowerCase();
      const hasLang = new RegExp(`(^|[ _-])${lang}($|[ _-])`, 'i').test(k);
      const isShortDesc = /short description/i.test(k) && hasLang;
      const isSC = /^sc(\b|[_\s-][a-z]{2}$|$)/i.test(k) && new RegExp(`${lang}$`, 'i').test(k);
      const isAltStyle = new RegExp(`^materialalternativestyle_${lang}$`, 'i').test(k);
      return isShortDesc || isSC || isAltStyle;
    });
    const shortHint = shortHintKey ? String(row[shortHintKey] ?? '') : '';

    // Title: AlternativeStyle_<lang> or MaterialSeriesName
    const altTitleKey = `MaterialAlternativeStyle_${lang}`;
    const title = String(row[altTitleKey] ?? row['MaterialSeriesName'] ?? '');

    // Wiring and Padding info - check multiple possible column names
    const wiringInfo = String(
      row['Wiring Info'] ??
      row['WiringInfo'] ??
      row['MaterialProductWiringTypeAI_en'] ??
      row['Wiring'] ??
      ''
    ).trim();

    const paddingInfo = String(
      row['Padding info'] ??
      row['PaddingInfo'] ??
      row['MaterialProductLiningLevelTypeAI_en'] ??
      row['Padding'] ??
      ''
    ).trim();

    // Product group for swimwear/beachwear handling
    const productGroup = String(
      row['Product Group'] ??
      row['MaterialProductGroup'] ??
      ''
    ).trim();

    // Additional context fields
    const usps = String(row['MaterialB2CUSPs_en'] ?? '').trim();
    const seriesDescription = String(row['MaterialB2CSeriesDescription_en'] ?? '').trim();
    const styleDescription = String(row['MaterialB2CStyleDescription_en'] ?? '').trim();

    const sloggi = isSloggiBrand(row);
    addLog?.(`${id} | ecom:${lang} | brand=${sloggi ? 'sloggi' : 'triumph'} | wiring=${wiringInfo || 'N/A'} | padding=${paddingInfo || 'N/A'}`);

    if (!description) {
      out.push(processed);
      continue;
    }

    const systemPrompt = sloggi ? SLOGGI_ECOMMERCE_SYSTEM_PROMPT : ECOMMERCE_SYSTEM_PROMPT;

    const res = await optimizeTextWithAI(
      buildEcomOptimizePrompt({
        title,
        description,
        shortHint,
        language: lang,
        wiringInfo: wiringInfo || undefined,
        paddingInfo: paddingInfo || undefined,
        productGroup: productGroup || undefined,
        usps: usps || undefined,
        seriesDescription: seriesDescription || undefined,
        styleDescription: styleDescription || undefined
      }),
      [],
      null,
      model,
      apiKey,
      systemPrompt
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


