import { useState, useCallback, useMemo, useRef } from 'react';
import { Workbook } from 'exceljs';
import type {
  MetadataFormat,
  MetadataFormatType,
  MetadataProduct,
  GeneratedProduct,
  GenerationProgress,
} from '../types';
import { MetadataGenerationStep, INRIVER_LANGUAGES } from '../types';
import {
  buildEnMasterGenerationPrompt,
  buildLocalisationPrompt,
} from '../prompts/metadataGenerationPrompt';
import { translateWithClaude, translateWithOpenAI } from '../utils/visionApiUtils';
import { processTextWithTerminology } from '../utils/terminology';

const BATCH_SIZE = 3;

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

  return 'unknown';
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

      if (p && hasUsableMetadata(p)) products.push(p);
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
            'File format not recognised. Expected AW26-compact, sloggi-B2C or Triumph-B2C headers.'
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
    async (modelId: string, apiKey: string) => {
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

      const isAnthropic = modelId.startsWith('claude');
      const callApi = isAnthropic ? translateWithClaude : translateWithOpenAI;
      const accumulated: GeneratedProduct[] = [];
      let completed = 0;

      try {
        for (let i = 0; i < queue.length; i += BATCH_SIZE) {
          if (signal.aborted) break;

          const batch = queue.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map(async (product) => {
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

            // Step 1 — generate EN master
            try {
              const enPrompt = buildEnMasterGenerationPrompt({
                materialNumber: product.materialNumber,
                productName: product.productName,
                brand: product.brand,
                productLine: product.productLine,
                shortDescription: product.shortDescription,
                seriesUsp: product.seriesUsp,
                styleUsp: product.styleUsp,
                styleDescription: product.styleDescription,
              });
              const enResponse = await callApi(enPrompt, apiKey, modelId, signal);
              enMaster = cleanMarkdownFormatting(enResponse.content);
              enMaster = processTextWithTerminology(enMaster, 'en');
              if (includesEn) translations['en'] = enMaster;
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
                const langName = langDef?.name || langCode;

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
                  const locResponse = await callApi(
                    locPrompt,
                    apiKey,
                    modelId,
                    signal
                  );
                  let localised = cleanMarkdownFormatting(locResponse.content);
                  localised = processTextWithTerminology(localised, langCode);
                  translations[langCode] = localised;
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
          });

          const batchResults = await Promise.all(batchPromises);
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
          addLog('Generation cancelled — no further API calls.');
        } else {
          addLog(`Generation complete: ${accumulated.length} product(s) processed`);
        }
        setIsProcessing(false);
        setStep(MetadataGenerationStep.RESULT);
      }
    },
    [products, selectedBrands, selectedLanguages, addLog]
  );

  const cancelGeneration = useCallback(() => {
    const ctrl = abortRef.current;
    if (ctrl && !ctrl.signal.aborted) {
      ctrl.abort();
      addLog('Cancel requested — aborting in-flight API calls…');
    }
  }, [addLog]);

  /**
   * Export: rebuilds the original workbook (preserving sheets and all original
   * columns) and fills the MaterialLongDescriptionEcom_<lang> column for every
   * selected language with the generated/localised content.
   */
  const exportResults = useCallback(async (): Promise<Blob> => {
    const workbook = new Workbook();
    const resultByMatNo = new Map<string, GeneratedProduct>();
    for (const r of results) {
      resultByMatNo.set(String(r.product.materialNumber), r);
    }

    for (const sheet of sheets) {
      const ws = workbook.addWorksheet(sheet.name || 'Sheet1');

      // Ensure every selected language has a target column in the output
      const headers = [...sheet.headers];
      for (const lang of selectedLanguages) {
        const col = targetColumnFor(lang);
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
          if (h.startsWith('MaterialLongDescriptionEcom_')) {
            const lang = h.replace('MaterialLongDescriptionEcom_', '');
            if (generated && generated.translations[lang]) {
              rowOut.push(generated.translations[lang]);
            } else {
              rowOut.push(row[h] ?? '');
            }
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
  }, [results, sheets, selectedLanguages]);

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
    parseFile,
    startGeneration,
    cancelGeneration,
    exportResults,
    reset,
  };
}
