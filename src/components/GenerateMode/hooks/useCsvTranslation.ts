import { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { Workbook } from 'exceljs';
import type { CSVFormat, CSVProduct, TranslatedProduct, TranslationProgress } from '../types';
import { CsvTranslationStep, LANGUAGE_MAPPING } from '../types';
import { CSV_TRANSLATION_PROMPT, BELDONA_TRANSLATION_PROMPT } from '../prompts/csvTranslationPrompt';
import { translateWithClaude, translateWithOpenAI } from '../utils/visionApiUtils';
import { processTextWithTerminology } from '../utils/terminology';

function cleanMarkdownFormatting(text: string): string {
  let cleaned = text.replace(/^```[a-z]*\n?/gm, '').replace(/\n?```$/gm, '');
  return cleaned.trim();
}

function detectCSVFormat(headers: string[]): CSVFormat {
  const headerSet = new Set(headers.map(h => h.toLowerCase().trim()));

  const triumphRequired = [
    'materialsapmaterialno',
    'materialmaterialdescription',
    'materialseriesname',
    'materialbrand',
    'materialsubbrand',
    'materialb2cseriesdescription_en',
    'materialb2cstyledescription_en',
    'materialb2cusps_en',
  ];

  const sloggiRequired = [
    'materialsapmaterialno',
    'materialmaterialdescription_en',
    'materialbrand',
    'materialsubbrand',
    'materialb2cseriesdescription_en',
    'materialb2cstyledescription_en',
    'materialb2cusps_en',
  ];

  const beldonaRequired = [
    'sub-brand',
    'material',
    'material description',
    'colour',
    'colour name',
    'images',
    'descriptions',
  ];

  if (triumphRequired.every(field => headerSet.has(field))) {
    return { type: 'triumph', headers, requiredFields: triumphRequired };
  } else if (sloggiRequired.every(field => headerSet.has(field))) {
    return { type: 'sloggi', headers, requiredFields: sloggiRequired };
  } else if (beldonaRequired.every(field => headerSet.has(field))) {
    return { type: 'beldona', headers, requiredFields: beldonaRequired };
  }

  return { type: 'unknown', headers, requiredFields: [] };
}

function parseHTMLTable(htmlContent: string): { headers: string[]; rows: string[][] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const table = doc.querySelector('table');

  if (!table) throw new Error('No table found in HTML content');

  const allRows = table.querySelectorAll('tr');
  const headers: string[] = [];
  const firstRow = allRows[0];
  if (firstRow) {
    firstRow.querySelectorAll('td, th').forEach((cell) => {
      headers.push((cell as HTMLElement).innerText?.trim() || cell.textContent?.trim() || '');
    });
  }

  const rows: string[][] = [];
  for (let i = 1; i < allRows.length; i++) {
    const row: string[] = [];
    allRows[i].querySelectorAll('td, th').forEach((cell) => {
      row.push((cell as HTMLElement).innerText?.trim() || cell.textContent?.trim() || '');
    });
    if (row.length > 0 && row.some(c => c !== '')) {
      rows.push(row);
    }
  }

  return { headers, rows };
}

function extractProducts(data: Record<string, any>[], format: CSVFormat): CSVProduct[] {
  return data.map((row, index) => {
    if (format.type === 'beldona') {
      return {
        rowIndex: index,
        materialNumber: row['Material'] || '',
        productName: row['Material Description'] || '',
        series: '',
        brand: row['Sub-Brand'] || 'Beldona',
        subBrand: row['Sub-Brand'] || '',
        originalContent: row['Descriptions'] || '',
        rawRow: row,
      };
    } else if (format.type === 'sloggi') {
      const seriesDesc = row['MaterialB2CSeriesDescription_en'] || '';
      const styleDesc = row['MaterialB2CStyleDescription_en'] || '';
      return {
        rowIndex: index,
        materialNumber: row['MaterialSAPMaterialNo'] || '',
        productName: row['MaterialMaterialDescription_en'] || '',
        series: '',
        brand: row['MaterialBrand'] || '',
        subBrand: row['MaterialSubBrand'] || '',
        originalContent: [seriesDesc, styleDesc].filter(t => t.trim()).join('\n\n'),
        rawRow: row,
      };
    } else {
      // Triumph
      const seriesDesc = row['MaterialB2CSeriesDescription_en'] || '';
      const styleDesc = row['MaterialB2CStyleDescription_en'] || '';
      return {
        rowIndex: index,
        materialNumber: row['MaterialSAPMaterialNo'] || '',
        productName: row['MaterialMaterialDescription'] || '',
        series: row['MaterialSeriesName'] || '',
        brand: row['MaterialBrand'] || '',
        subBrand: row['MaterialSubBrand'] || '',
        originalContent: [seriesDesc, styleDesc].filter(t => t.trim()).join('\n\n'),
        rawRow: row,
      };
    }
  }).filter(p => p.originalContent.trim() !== '');
}

export function useCsvTranslation() {
  const [step, setStep] = useState<CsvTranslationStep>(CsvTranslationStep.UPLOAD);
  const [file, setFile] = useState<File | null>(null);
  const [products, setProducts] = useState<CSVProduct[]>([]);
  const [format, setFormat] = useState<CSVFormat | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<TranslationProgress>({ current: 0, total: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<TranslatedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const parseFile = useCallback(async (uploadedFile: File) => {
    setFile(uploadedFile);
    setError(null);

    try {
      const text = await uploadedFile.text();

      // Check if HTML table (Beldona format)
      if (text.includes('<table') && text.includes('</table>')) {
        const { headers, rows } = parseHTMLTable(text);
        const detectedFormat = detectCSVFormat(headers);
        setFormat(detectedFormat);

        const data = rows.map(row => {
          const obj: Record<string, any> = {};
          headers.forEach((h, i) => { obj[h] = row[i] || ''; });
          return obj;
        });

        const prods = extractProducts(data, detectedFormat);
        setProducts(prods);
        addLog(`Parsed HTML table: ${prods.length} products, format: ${detectedFormat.type}`);
        setStep(CsvTranslationStep.FORMAT_DETECT);
        return;
      }

      // Try Excel format
      if (/\.(xlsx?|xlsm)$/i.test(uploadedFile.name)) {
        const buffer = await uploadedFile.arrayBuffer();
        const workbook = new Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];

        if (!worksheet) throw new Error('No worksheet found');

        const headers: string[] = [];
        const firstRow = worksheet.getRow(1);
        firstRow.eachCell((cell, colNumber) => {
          headers[colNumber - 1] = String(cell.value || '').trim();
        });

        const data: Record<string, any>[] = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const obj: Record<string, any> = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) obj[header] = String(cell.value || '').trim();
          });
          if (Object.keys(obj).length > 0) data.push(obj);
        });

        const detectedFormat = detectCSVFormat(headers);
        setFormat(detectedFormat);
        const prods = extractProducts(data, detectedFormat);
        setProducts(prods);
        addLog(`Parsed Excel: ${prods.length} products, format: ${detectedFormat.type}`);
        setStep(CsvTranslationStep.FORMAT_DETECT);
        return;
      }

      // CSV parsing
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const detectedFormat = detectCSVFormat(headers);
          setFormat(detectedFormat);
          const prods = extractProducts(results.data as Record<string, any>[], detectedFormat);
          setProducts(prods);
          addLog(`Parsed CSV: ${prods.length} products, format: ${detectedFormat.type}`);
          setStep(CsvTranslationStep.FORMAT_DETECT);
        },
        error: (err) => {
          setError(`CSV parsing error: ${err.message}`);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  }, [addLog]);

  const startTranslation = useCallback(async (modelId: string, apiKey: string) => {
    if (products.length === 0 || selectedLanguages.length === 0) return;

    cancelRef.current = false;
    setIsProcessing(true);
    setError(null);
    setResults([]);
    setStep(CsvTranslationStep.PROCESSING);

    const totalOps = products.length * selectedLanguages.length;
    setProgress({ current: 0, total: totalOps });
    addLog(`Starting translation: ${products.length} products × ${selectedLanguages.length} languages = ${totalOps} operations`);

    const isAnthropic = modelId.startsWith('claude');
    const translateFn = isAnthropic ? translateWithClaude : translateWithOpenAI;
    const translatedProducts: TranslatedProduct[] = [];
    let completed = 0;

    // Process in batches of 3
    const BATCH_SIZE = 3;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      if (cancelRef.current) {
        addLog('Translation cancelled by user');
        break;
      }

      const batch = products.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (product) => {
        const translations: Record<string, string> = {};
        const errors: string[] = [];

        for (const langCode of selectedLanguages) {
          if (cancelRef.current) break;

          const langName = LANGUAGE_MAPPING[langCode] || langCode;
          const isBeldona = format?.type === 'beldona';

          const prompt = isBeldona
            ? BELDONA_TRANSLATION_PROMPT(langName, {
                materialNumber: product.materialNumber,
                productName: product.productName,
                brand: product.brand,
                subBrand: product.subBrand,
              }, product.originalContent, langCode)
            : CSV_TRANSLATION_PROMPT(langName, {
                materialNumber: product.materialNumber,
                productName: product.productName,
                series: product.series,
                brand: product.brand,
                subBrand: product.subBrand,
              }, product.originalContent, langCode);

          try {
            const response = await translateFn(prompt, apiKey, modelId);
            let translated = cleanMarkdownFormatting(response.content);
            translated = processTextWithTerminology(translated, langCode);
            translations[langCode] = translated;
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Translation failed';
            errors.push(`${langCode}: ${errMsg}`);
            addLog(`Error translating ${product.materialNumber} to ${langCode}: ${errMsg}`);
          }

          completed++;
          setProgress({ current: completed, total: totalOps });
        }

        return { product, translations, errors: errors.length > 0 ? errors : undefined };
      });

      const batchResults = await Promise.all(batchPromises);
      translatedProducts.push(...batchResults);
      setResults([...translatedProducts]);
      addLog(`Batch completed: ${Math.min(i + BATCH_SIZE, products.length)}/${products.length} products`);
    }

    addLog(`Translation complete: ${translatedProducts.length} products translated`);
    setIsProcessing(false);
    setStep(CsvTranslationStep.RESULT);
  }, [products, selectedLanguages, format, addLog]);

  const cancelTranslation = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const exportResults = useCallback(async (): Promise<Blob> => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Translations');

    if (results.length > 0) {
      const langCols = selectedLanguages.map(l => `Translation_${l}`);
      const headers = ['MaterialNumber', 'ProductName', 'Brand', 'Original', ...langCols];
      worksheet.addRow(headers);

      results.forEach(({ product, translations }) => {
        const row = [
          product.materialNumber,
          product.productName,
          product.brand,
          product.originalContent,
          ...selectedLanguages.map(l => translations[l] || ''),
        ];
        worksheet.addRow(row);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }, [results, selectedLanguages]);

  const reset = useCallback(() => {
    setStep(CsvTranslationStep.UPLOAD);
    setFile(null);
    setProducts([]);
    setFormat(null);
    setSelectedLanguages([]);
    setIsProcessing(false);
    setProgress({ current: 0, total: 0 });
    setLogs([]);
    setResults([]);
    setError(null);
    cancelRef.current = false;
  }, []);

  return {
    step,
    setStep,
    file,
    products,
    format,
    selectedLanguages,
    setSelectedLanguages,
    isProcessing,
    progress,
    logs,
    results,
    error,
    parseFile,
    startTranslation,
    cancelTranslation,
    exportResults,
    reset,
  };
}
