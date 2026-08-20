import { useState, useCallback, useMemo, useRef } from 'react';
import { Workbook } from 'exceljs';
import type {
  MetadataFormat,
  MetadataFormatType,
  MetadataProduct,
  GeneratedProduct,
  GenerationProgress,
} from '../types';
import {
  MetadataGenerationStep,
  INRIVER_LANGUAGES,
  LANGUAGE_MAPPING,
  METADATA_GENERATION_MODEL,
} from '../types';
import {
  buildEnMasterGenerationPrompt,
  buildLocalisationPrompt,
  buildRewritePrompt,
} from '../prompts/metadataGenerationPrompt';
import { translateWithClaude } from '../utils/visionApiUtils';
import { processTextWithTerminology } from '../utils/terminology';
import {
  PIM_LOCALES,
  PIM_LONG_DESC_PREFIX,
  SFCC_IMPORT_HEADERS,
  SFCC_IMPORT_SHEET_NAME,
  findLocaleMismatches,
  pimLanguageCodesFromHeaders,
  pimLocaleByCode,
  pimLocaleByLocale,
  pimLocalesFromHeaders,
  pimLongDescColumn,
  type LocaleMismatch,
} from '../utils/pimLocales';

const BATCH_SIZE = 3;

// Minimum character length for a MaterialLongDescriptionEcom_<lang> cell to
// count as a rewrite source in the 'longdesc-rework' flow. Below this a cell is
// an admin note or a certification fragment, not a description.
const REWORK_MIN_SOURCE_LEN = 120;

function cleanMarkdownFormatting(text: string): string {
  return text.replace(/^```[a-z]*\n?/gm, '').replace(/\n?```$/gm, '').trim();
}

function normaliseHeader(h: string): string {
  return h.toLowerCase().trim();
}

function detectFormat(headers: string[]): MetadataFormatType {
  const set = new Set(headers.map(normaliseHeader));

  // AW26 compact format (the one Nadzeya sends for new-product batches)
  const aw26Required = [
    'material number',
    'brand',
    'material description',
    'series usp',
    'style usp',
    'style description',
  ];
  if (aw26Required.every((h) => set.has(h))) return 'aw26-compact';

  // sloggi B2C standard (Inriver export)
  const sloggiB2cRequired = [
    'materialsapmaterialno',
    'materialmaterialdescription_en',
    'materialbrand',
    'materialb2cseriesdescription_en',
    'materialb2cstyledescription_en',
    'materialb2cusps_en',
  ];
  if (sloggiB2cRequired.every((h) => set.has(h))) return 'sloggi-b2c';

  // Triumph B2C standard
  const triumphB2cRequired = [
    'materialsapmaterialno',
    'materialmaterialdescription',
    'materialseriesname',
    'materialbrand',
    'materialsubbrand',
    'materialb2cseriesdescription_en',
    'materialb2cstyledescription_en',
    'materialb2cusps_en',
  ];
  if (triumphB2cRequired.every((h) => set.has(h))) return 'triumph-b2c';

  // PIM long-description export: 'Material Number' + 'Material Description'
  // plus one 'Ecom Long Desc_<locale>' column per locale. This is the export
  // Masterdata pulls out of the PIM for a rewrite round-trip; the matching
  // upload goes back as the SFCC import template.
  if (
    set.has('material number') &&
    set.has('material description') &&
    pimLocalesFromHeaders(headers).length > 0
  ) {
    return 'pim-longdesc';
  }

  // Long-description rework: a material number, an EN product name and at
  // least one existing MaterialLongDescriptionEcom_<lang> column, but none of
  // the structured B2C source fields (those would have matched above). This is
  // the "current assortment" export — rewrite the existing copy in place.
  const hasMatNo = set.has('materialsapmaterialno') || set.has('material number');
  const hasEnName =
    set.has('materialmaterialdescription_en') || set.has('materialmaterialdescription');
  const hasLongDescCol = headers.some((h) =>
    /^materiallongdescriptionecom_/i.test(h.trim())
  );
  if (hasMatNo && hasEnName && hasLongDescCol) return 'longdesc-rework';

  return 'unknown';
}

/** Inriver locale codes present as MaterialLongDescriptionEcom_<code> columns. */
function longDescLangsFromHeaders(headers: string[]): string[] {
  return headers
    .map((h) => h.trim())
    .filter((h) => /^MaterialLongDescriptionEcom_/i.test(h))
    .map((h) => h.replace(/^MaterialLongDescriptionEcom_/i, ''));
}

interface ParsedSheet {
  name: string;
  headers: string[];
  data: Record<string, any>[];
}

async function parseExcelAllSheets(file: File): Promise<ParsedSheet[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer);
  const sheets: ParsedSheet[] = [];

  workbook.worksheets.forEach((ws) => {
    const headers: string[] = [];
    const firstRow = ws.getRow(1);
    firstRow.eachCell((cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value ?? '').trim();
    });

    const data: Record<string, any>[] = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const obj: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) obj[header] = String(cell.value ?? '').trim();
      });
      if (Object.values(obj).some((v) => v && String(v).length > 0)) {
        data.push(obj);
      }
    });

    sheets.push({ name: ws.name, headers, data });
  });

  return sheets;
}

function extractProducts(
  format: MetadataFormatType,
  sheets: ParsedSheet[]
): MetadataProduct[] {
  const products: MetadataProduct[] = [];

  for (const sheet of sheets) {
    sheet.data.forEach((row, index) => {
      let p: MetadataProduct | null = null;

      if (format === 'aw26-compact') {
        const matNo = row['Material Number'] || row['MaterialSAPMaterialNo'] || '';
        if (!matNo) return;
        p = {
          sheetName: sheet.name,
          rowIndex: index,
          materialNumber: String(matNo),
          productName: String(row['Material Description'] || ''),
          brand: String(row['Brand'] || ''),
          productLine: row['Product Line'] ? String(row['Product Line']) : undefined,
          shortDescription: row['Short description']
            ? String(row['Short description'])
            : undefined,
          seriesUsp: row['Series USP'] ? String(row['Series USP']) : undefined,
          styleUsp: row['Style USP'] ? String(row['Style USP']) : undefined,
          styleDescription: row['Style Description']
            ? String(row['Style Description'])
            : undefined,
          rawRow: row,
        };
      } else if (format === 'longdesc-rework') {
        const matNo = row['MaterialSAPMaterialNo'] || row['Material Number'] || '';
        if (!matNo) return;
        const name = String(
          row['MaterialMaterialDescription_en'] ||
            row['MaterialMaterialDescription'] ||
            ''
        );
        // Brand isn't a column in this export; infer it from the product name.
        const brand = /sloggi/i.test(name) ? 'sloggi' : 'Triumph';
        // Pick the rewrite source: existing EN copy, else the first populated
        // locale (so the 25 EN-empty rows still have a source to rewrite from).
        const langCols = longDescLangsFromHeaders(sheet.headers);
        const sourcePref = [
          'en', 'de', 'fr', 'it', 'es', 'nl', 'pl', 'cs', 'hu', 'da', 'sv', 'pt',
        ].filter((l) => langCols.includes(l));
        let existingDescription: string | undefined;
        let existingSourceLang: string | undefined;
        for (const lc of sourcePref) {
          const val = row[`MaterialLongDescriptionEcom_${lc}`];
          // Real copy (prose or HTML) runs 400+ chars. The 120-char floor skips
          // admin notes ("Long descriptions is online, however not in Inriver")
          // and standalone certification fragments that share these columns.
          if (val && String(val).trim().length >= REWORK_MIN_SOURCE_LEN) {
            existingDescription = String(val).trim();
            existingSourceLang = lc;
            break;
          }
        }
        p = {
          sheetName: sheet.name,
          rowIndex: index,
          materialNumber: String(matNo),
          productName: name,
          brand,
          existingDescription,
          existingSourceLang,
          rawRow: row,
        };
      } else if (format === 'pim-longdesc') {
        const matNo = row['Material Number'] || '';
        if (!matNo) return;
        const name = String(row['Material Description'] || '');
        // No brand column in this export; infer it from the product name the
        // same way the rework flow does.
        const brand = /sloggi/i.test(name) ? 'sloggi' : 'Triumph';

        // Pick the rewrite source: existing EN copy, else the first populated
        // locale, so rows with an empty EN column still have something to work
        // from. Same 120-char floor as the rework flow.
        const locales = pimLocalesFromHeaders(sheet.headers);
        const preferred = ['en_GB', ...locales.filter((l) => l !== 'en_GB')];
        let existingDescription: string | undefined;
        let existingSourceLang: string | undefined;
        for (const locale of preferred) {
          if (!locales.includes(locale)) continue;
          const val = row[pimLongDescColumn(locale)];
          if (val && String(val).trim().length >= REWORK_MIN_SOURCE_LEN) {
            existingDescription = String(val).trim();
            existingSourceLang = pimLocaleByLocale(locale)?.code ?? locale;
            break;
          }
        }
        p = {
          sheetName: sheet.name,
          rowIndex: index,
          materialNumber: String(matNo),
          productName: name,
          brand,
          existingDescription,
          existingSourceLang,
          rawRow: row,
        };
      } else if (format === 'sloggi-b2c' || format === 'triumph-b2c') {
        const matNo = row['MaterialSAPMaterialNo'] || '';
        if (!matNo) return;
        const name =
          row['MaterialMaterialDescription_en'] ||
          row['MaterialMaterialDescription'] ||
          '';
        p = {
          sheetName: sheet.name,
          rowIndex: index,
          materialNumber: String(matNo),
          productName: String(name),
          brand: String(row['MaterialBrand'] || ''),
          productLine: row['MaterialSeriesName']
            ? String(row['MaterialSeriesName'])
            : undefined,
          shortDescription: row['MaterialB2CShortDescription_en']
            ? String(row['MaterialB2CShortDescription_en'])
            : undefined,
          seriesUsp: row['MaterialB2CSeriesDescription_en']
            ? String(row['MaterialB2CSeriesDescription_en'])
            : undefined,
          styleUsp: row['MaterialB2CUSPs_en']
            ? String(row['MaterialB2CUSPs_en'])
            : undefined,
          styleDescription: row['MaterialB2CStyleDescription_en']
            ? String(row['MaterialB2CStyleDescription_en'])
            : undefined,
          rawRow: row,
        };
      }

      // Rework rows are always usable: they have a product name and either an
      // existing description to rewrite or (for the few fully-empty rows) the
      // name as a best-effort source. USP-based formats keep the stricter gate.
      const usable =
        format === 'longdesc-rework' || format === 'pim-longdesc'
          ? Boolean(p && p.productName.trim())
          : Boolean(p && hasUsableMetadata(p));
      if (p && usable) products.push(p);
    });
  }

  return products;
}

function hasUsableMetadata(p: MetadataProduct): boolean {
  return Boolean(
    (p.shortDescription && p.shortDescription.trim()) ||
      (p.seriesUsp && p.seriesUsp.trim()) ||
      (p.styleUsp && p.styleUsp.trim()) ||
      (p.styleDescription && p.styleDescription.trim())
  );
}

function targetColumnFor(langCode: string): string {
  return `MaterialLongDescriptionEcom_${langCode}`;
}

/**
 * Language code a long-description column targets, for either naming
 * convention: 'MaterialLongDescriptionEcom_de' and 'Ecom Long Desc_de_DE' both
 * resolve to 'de'. Returns undefined for any other column.
 */
function languageCodeForColumn(header: string): string | undefined {
  const h = header.trim();

  if (/^MaterialLongDescriptionEcom_/i.test(h)) {
    return h.replace(/^MaterialLongDescriptionEcom_/i, '');
  }

  if (h.toLowerCase().startsWith(PIM_LONG_DESC_PREFIX.toLowerCase())) {
    const locale = h.slice(PIM_LONG_DESC_PREFIX.length);
    return pimLocaleByLocale(locale)?.code;
  }

  return undefined;
}

function isAbortError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  if (typeof err === 'object' && err !== null) {
    const e = err as { name?: string; message?: string };
    if (e.name === 'AbortError') return true;
    if (typeof e.message === 'string' && /aborted|abort/i.test(e.message)) return true;
  }
  return false;
}

export function useMetadataGeneration() {
  const [step, setStep] = useState<MetadataGenerationStep>(
    MetadataGenerationStep.UPLOAD
  );
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [products, setProducts] = useState<MetadataProduct[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [exclusionInput, setExclusionInput] = useState<string>('');
  const [format, setFormat] = useState<MetadataFormat | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    INRIVER_LANGUAGES.map((l) => l.code)
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    current: 0,
    total: 0,
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<GeneratedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [localeMismatches, setLocaleMismatches] = useState<LocaleMismatch[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const parseFile = useCallback(
    async (uploadedFile: File) => {
      setFile(uploadedFile);
      setError(null);

      try {
        if (!/\.(xlsx?|xlsm)$/i.test(uploadedFile.name)) {
          throw new Error('Only Excel files (.xlsx, .xls, .xlsm) are supported in this mode.');
        }

        const parsed = await parseExcelAllSheets(uploadedFile);
        setSheets(parsed);

        // Union of headers across all sheets to drive format detection
        const allHeaders = Array.from(
          new Set(parsed.flatMap((s) => s.headers))
        );
        const detected = detectFormat(allHeaders);

        const fmt: MetadataFormat = {
          type: detected,
          headers: allHeaders,
          sheetNames: parsed.map((s) => s.name),
        };
        setFormat(fmt);

        if (detected === 'unknown') {
          setError(
            'File format not recognised. Expected AW26-compact, sloggi-B2C, Triumph-B2C, or a PIM long-description export (Material Number + Ecom Long Desc_<locale> columns).'
          );
          setProducts([]);
          setStep(MetadataGenerationStep.FORMAT_DETECT);
          return;
        }

        const prods = extractProducts(detected, parsed);
        setProducts(prods);
        const brands = Array.from(
          new Set(prods.map((p) => (p.brand || 'unknown').trim()))
        );
        setSelectedBrands(brands);

        // For the rework format, regenerate exactly the locale columns already
        // present in the file (e.g. the current assortment ships 'pt', not
        // 'pt-PT'), so the output overwrites them in place rather than adding
        // parallel columns.
        if (detected === 'longdesc-rework') {
          const fileLangs = longDescLangsFromHeaders(allHeaders);
          if (fileLangs.length > 0) setSelectedLanguages(fileLangs);
          const withSource = prods.filter((p) => p.existingDescription).length;
          addLog(
            `Rework mode: ${prods.length} SKU(s), ${withSource} with an existing description to rewrite, ${prods.length - withSource} from product name only. Languages preset from file: ${fileLangs.join(', ')}.`
          );
        }

        if (detected === 'pim-longdesc') {
          const fileLangs = pimLanguageCodesFromHeaders(allHeaders);
          if (fileLangs.length > 0) setSelectedLanguages(fileLangs);
          const withSource = prods.filter((p) => p.existingDescription).length;
          addLog(
            `PIM rework mode: ${prods.length} SKU(s), ${withSource} with an existing description to rewrite, ${prods.length - withSource} from product name only. Locales preset from file: ${pimLocalesFromHeaders(allHeaders).join(', ')}.`
          );

          // A PIM export can ship a locale column holding another locale's text.
          // Rewriting from the wrong source language would be invisible in the
          // output, so surface it here instead.
          const mismatches = parsed.flatMap((s) =>
            findLocaleMismatches(s.data, s.headers, 'Material Number', 'Material Description')
          );
          setLocaleMismatches(mismatches);
          if (mismatches.length > 0) {
            const skus = new Set(mismatches.map((m) => m.materialNumber));
            addLog(
              `Warning: ${mismatches.length} cell(s) across ${skus.size} SKU(s) hold text in a different language than their column claims. Check these before generating.`
            );
          }
        }

        addLog(
          `Parsed ${prods.length} product(s) across ${parsed.length} sheet(s); format: ${detected}`
        );
        setStep(MetadataGenerationStep.FORMAT_DETECT);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
      }
    },
    [addLog]
  );

  const startGeneration = useCallback(
    async (apiKey: string) => {
      const modelId = METADATA_GENERATION_MODEL;
      const queue = products.filter((p) =>
        selectedBrands.includes((p.brand || 'unknown').trim())
      );
      if (queue.length === 0 || selectedLanguages.length === 0) return;

      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      setIsProcessing(true);
      setError(null);
      setResults([]);
      setStep(MetadataGenerationStep.PROCESSING);

      const includesEn = selectedLanguages.includes('en');
      const nonEnLangs = selectedLanguages.filter((l) => l !== 'en');
      const opsPerProduct = 1 + nonEnLangs.length;
      const totalOps = queue.length * opsPerProduct;
      setProgress({ current: 0, total: totalOps });
      addLog(
        `Starting: ${queue.length} product(s) × (1 EN master + ${nonEnLangs.length} localisations) = ${totalOps} operations`
      );

      const accumulated: GeneratedProduct[] = [];
      let completed = 0;
      let cacheReadTokens = 0;
      let cacheCreationTokens = 0;

      /**
       * Process a single product end-to-end: generate EN master then localise
       * into each non-EN target. Returns a GeneratedProduct shaped record.
       * Extracted from the batch loop so the warmup call can reuse it.
       */
      const processOneProduct = async (
        product: MetadataProduct,
      ): Promise<GeneratedProduct> => {
        const translations: Record<string, string> = {};
        const errors: string[] = [];
        let enMaster: string | undefined;

        if (signal.aborted) {
          return {
            product,
            enMaster: undefined,
            translations: {},
            errors: undefined,
          } as GeneratedProduct;
        }

        // Step 1 — produce the EN master.
        // Rework format with an existing description → rewrite it. Otherwise
        // (USP-based formats, or rework rows with no source copy) → generate
        // from the structured inputs / product name.
        try {
          const isRework =
            format?.type === 'longdesc-rework' || format?.type === 'pim-longdesc';
          const enPrompt =
            isRework && product.existingDescription
              ? buildRewritePrompt({
                  materialNumber: product.materialNumber,
                  productName: product.productName,
                  brand: product.brand,
                  existingDescription: product.existingDescription,
                  existingSourceLang: product.existingSourceLang,
                })
              : buildEnMasterGenerationPrompt({
                  materialNumber: product.materialNumber,
                  productName: product.productName,
                  brand: product.brand,
                  productLine: product.productLine,
                  shortDescription: product.shortDescription,
                  seriesUsp: product.seriesUsp,
                  styleUsp: product.styleUsp,
                  styleDescription: product.styleDescription,
                });
          const enResponse = await translateWithClaude(enPrompt, apiKey, modelId, signal);
          enMaster = cleanMarkdownFormatting(enResponse.content);
          enMaster = processTextWithTerminology(enMaster, 'en');
          if (includesEn) translations['en'] = enMaster;
          cacheReadTokens += enResponse.tokens.cacheReadTokens ?? 0;
          cacheCreationTokens += enResponse.tokens.cacheCreationTokens ?? 0;
        } catch (err) {
          if (isAbortError(err) || signal.aborted) {
            return {
              product,
              enMaster: undefined,
              translations: {},
              errors: undefined,
            } as GeneratedProduct;
          }
          const msg = err instanceof Error ? err.message : 'EN generation failed';
          errors.push(`en: ${msg}`);
          addLog(`Error generating EN for ${product.materialNumber}: ${msg}`);
        }
        completed++;
        setProgress({ current: completed, total: totalOps });

        // Step 2 — localise into non-EN locales
        if (enMaster && !signal.aborted) {
          for (const langCode of nonEnLangs) {
            if (signal.aborted) break;
            const langDef = INRIVER_LANGUAGES.find((l) => l.code === langCode);
            const langName = langDef?.name || LANGUAGE_MAPPING[langCode] || langCode;

            try {
              const locPrompt = buildLocalisationPrompt(
                enMaster,
                langCode,
                langName,
                {
                  materialNumber: product.materialNumber,
                  productName: product.productName,
                  brand: product.brand,
                  productLine: product.productLine,
                }
              );
              const locResponse = await translateWithClaude(
                locPrompt,
                apiKey,
                modelId,
                signal
              );
              let localised = cleanMarkdownFormatting(locResponse.content);
              localised = processTextWithTerminology(localised, langCode);
              translations[langCode] = localised;
              cacheReadTokens += locResponse.tokens.cacheReadTokens ?? 0;
              cacheCreationTokens += locResponse.tokens.cacheCreationTokens ?? 0;
            } catch (err) {
              if (isAbortError(err) || signal.aborted) break;
              const msg =
                err instanceof Error ? err.message : 'Localisation failed';
              errors.push(`${langCode}: ${msg}`);
              addLog(
                `Error localising ${product.materialNumber} to ${langCode}: ${msg}`
              );
            }
            completed++;
            setProgress({ current: completed, total: totalOps });
          }
        } else if (!enMaster) {
          completed += nonEnLangs.length;
          setProgress({ current: completed, total: totalOps });
        }

        return {
          product,
          enMaster,
          translations,
          errors: errors.length > 0 ? errors : undefined,
        } as GeneratedProduct;
      };

      try {
        // Warmup — with ≥ 2 products, process the first SKU on its own so the
        // prompt cache is written before the parallel batch fires. Without
        // this, the first BATCH_SIZE concurrent requests all pay the
        // cache-write premium (none can read what the others are still
        // writing). See shared/prompt-caching.md → Concurrent-request timing.
        let startIndex = 0;
        if (queue.length >= 2) {
          const warm = queue[0];
          const warmResult = await processOneProduct(warm);
          accumulated.push(warmResult);
          setResults([...accumulated]);
          addLog(
            `Cache primed on first SKU (${warm.materialNumber}); running remaining ${queue.length - 1} in parallel batches of ${BATCH_SIZE}.`
          );
          startIndex = 1;
          if (signal.aborted) {
            // Skip the batch loop entirely if cancelled during warmup
            return;
          }
        }

        for (let i = startIndex; i < queue.length; i += BATCH_SIZE) {
          if (signal.aborted) break;

          const batch = queue.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(batch.map(processOneProduct));
          accumulated.push(...batchResults);
          setResults([...accumulated]);
          addLog(
            `Batch completed: ${Math.min(i + BATCH_SIZE, queue.length)}/${queue.length} product(s)`
          );

          if (signal.aborted) break;
        }
      } finally {
        abortRef.current = null;
        if (signal.aborted) {
          addLog('Generation cancelled. No further API calls.');
        } else {
          addLog(`Generation complete: ${accumulated.length} product(s) processed`);
        }
        if (cacheReadTokens > 0 || cacheCreationTokens > 0) {
          const totalCached = cacheReadTokens + cacheCreationTokens;
          const hitRate = totalCached > 0
            ? Math.round((cacheReadTokens / totalCached) * 100)
            : 0;
          addLog(
            `Prompt cache: ${cacheReadTokens.toLocaleString()} read + ${cacheCreationTokens.toLocaleString()} written tokens (${hitRate}% hit rate)`
          );
        }
        setIsProcessing(false);
        setStep(MetadataGenerationStep.RESULT);
      }
    },
    [products, selectedBrands, selectedLanguages, format, addLog]
  );

  const cancelGeneration = useCallback(() => {
    const ctrl = abortRef.current;
    if (ctrl && !ctrl.signal.aborted) {
      ctrl.abort();
      addLog('Cancel requested. Aborting in-flight API calls…');
    }
  }, [addLog]);

  /**
   * Export: rebuilds the original workbook (preserving sheets and all original
   * columns) and fills the long-description column for every selected language
   * with the generated/localised content.
   *
   * Two column conventions are in play — the Inriver 'MaterialLongDescriptionEcom_<lang>'
   * one and the PIM export's 'Ecom Long Desc_<locale>' one — so the target
   * column follows whichever the source file uses.
   */
  const exportResults = useCallback(async (): Promise<Blob> => {
    const workbook = new Workbook();
    const isPim = format?.type === 'pim-longdesc';
    const resultByMatNo = new Map<string, GeneratedProduct>();
    for (const r of results) {
      resultByMatNo.set(String(r.product.materialNumber), r);
    }

    for (const sheet of sheets) {
      const ws = workbook.addWorksheet(sheet.name || 'Sheet1');

      // Ensure every selected language has a target column in the output
      const headers = [...sheet.headers];
      for (const lang of selectedLanguages) {
        const locale = pimLocaleByCode(lang)?.locale;
        const col = isPim && locale ? pimLongDescColumn(locale) : targetColumnFor(lang);
        if (!headers.includes(col)) headers.push(col);
      }
      ws.addRow(headers);

      // Compute material-number column for this sheet
      const matCol = headers.find(
        (h) =>
          h === 'Material Number' ||
          h.toLowerCase() === 'materialsapmaterialno'
      );

      for (const row of sheet.data) {
        const rowOut: any[] = [];
        const matNo = matCol ? String(row[matCol] ?? '') : '';
        const generated = matNo ? resultByMatNo.get(matNo) : undefined;

        for (const h of headers) {
          const lang = languageCodeForColumn(h);
          if (lang && generated && generated.translations[lang]) {
            rowOut.push(generated.translations[lang]);
          } else {
            rowOut.push(row[h] ?? '');
          }
        }
        ws.addRow(rowOut);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }, [results, sheets, selectedLanguages, format]);

  /**
   * Export: the SFCC upload template Masterdata feeds back into the PIM — one
   * row per product and locale, keyed by numeric LanguageID.
   *
   * Only generated content is written. A locale that produced nothing for a SKU
   * is left out rather than uploaded empty, which would blank the live copy.
   */
  const exportSfccImport = useCallback(async (): Promise<Blob> => {
    const workbook = new Workbook();
    const ws = workbook.addWorksheet(SFCC_IMPORT_SHEET_NAME);
    ws.addRow([...SFCC_IMPORT_HEADERS]);

    // Grouped by locale, then by product, matching the files Masterdata sends.
    for (const locale of PIM_LOCALES) {
      if (!selectedLanguages.includes(locale.code)) continue;
      for (const r of results) {
        const description = r.translations[locale.code];
        if (!description || !description.trim()) continue;
        ws.addRow([
          locale.languageId,
          String(r.product.materialNumber),
          description,
          '',
        ]);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }, [results, selectedLanguages]);

  const reset = useCallback(() => {
    if (abortRef.current && !abortRef.current.signal.aborted) {
      abortRef.current.abort();
    }
    abortRef.current = null;
    setStep(MetadataGenerationStep.UPLOAD);
    setFile(null);
    setSheets([]);
    setProducts([]);
    setSelectedBrands([]);
    setExclusionInput('');
    setFormat(null);
    setSelectedLanguages(INRIVER_LANGUAGES.map((l) => l.code));
    setIsProcessing(false);
    setProgress({ current: 0, total: 0 });
    setLogs([]);
    setResults([]);
    setError(null);
    setLocaleMismatches([]);
  }, []);

  const excludedSkus = useMemo(
    () =>
      exclusionInput
        .split(/[\s,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [exclusionInput]
  );

  const queuedProducts = useMemo(() => {
    const excluded = new Set(excludedSkus);
    return products.filter(
      (p) =>
        selectedBrands.includes((p.brand || 'unknown').trim()) &&
        !excluded.has(String(p.materialNumber).trim())
    );
  }, [products, selectedBrands, excludedSkus]);

  return {
    step,
    setStep,
    file,
    products,
    queuedProducts,
    selectedBrands,
    setSelectedBrands,
    exclusionInput,
    setExclusionInput,
    excludedSkus,
    format,
    selectedLanguages,
    setSelectedLanguages,
    isProcessing,
    progress,
    logs,
    results,
    error,
    localeMismatches,
    parseFile,
    startGeneration,
    cancelGeneration,
    exportResults,
    exportSfccImport,
    reset,
  };
}
