// Web Worker: Heavy XLSX/XLSM parsing off the main thread
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Workers run in a different context
import * as ExcelJS from 'exceljs';

type UseCase = 'ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next' | 'partoo';

interface ParseConfig {
  maxRows?: number;
  progressEvery?: number;
  trimValues?: boolean;
}

interface ParseRequest {
  arrayBuffer: ArrayBuffer;
  useCase: UseCase;
  skipSampleRow: boolean;
  config?: ParseConfig;
}

interface RowData {
  [key: string]: string | number | boolean | Date | null;
}

interface ParseResult {
  rows: any[];
  columns: string[];
  meta: {
    worksheetName: string;
    useCase: UseCase;
    arrayBuffer?: ArrayBuffer; // not returned to save memory
    headerRowIndex: number;
    dataStartRow: number;
    fileType: 'xlsx' | 'xlsm';
    sheet1?: { columns: string[]; rows: any[] };
  };
}

type WorkerMessage =
  | { type: 'progress'; current: number; total: number }
  | { type: 'done'; success: true; result: ParseResult }
  | { type: 'done'; success: false; error: string };

// Minimal GlobalScope type for TS without DOM lib
type DWGS = { postMessage: (msg: WorkerMessage) => void };

const normalizeValue = (val: unknown, trimValues: boolean): string | number => {
  if (val == null) return '';
  // ExcelJS formula cell structure may have .formula and .result
  if (typeof val === 'object' && val !== null && 'formula' in (val as any)) {
    const formulaResult = (val as any).result;
    if (formulaResult instanceof Date) return formulaResult.toISOString();
    return (trimValues && typeof formulaResult === 'string') ? (formulaResult as string).trim() : (formulaResult ?? '');
  }
  if (val instanceof Date) return val.toISOString();
  const s = String((val as any)?.result ?? (val as any)?.text ?? (val as any)?.value ?? val);
  return trimValues ? s.trim() : s;
};

const getRowValues = (ws: ExcelJS.Worksheet, rowIndex: number, trimValues: boolean): string[] => {
  const r = ws.getRow(rowIndex);
  const vals: string[] = [];
  r.eachCell((cell, colNumber) => {
    vals[colNumber - 1] = String(normalizeValue(cell.value, trimValues));
  });
  return vals;
};

const detectAmazonHeader = (ws: ExcelJS.Worksheet, maxScan: number = 8, trimValues: boolean): number | null => {
  const sig = [/vendor_sku#1\.value/i, /item_name#1\.value/i, /brand#1\.value/i, /bullet_point#1\.value/i, /rtip_product_description#1\.value/i];
  const limit = Math.min(ws.rowCount, maxScan);
  for (let r = 1; r <= limit; r++) {
    const line = getRowValues(ws, r, trimValues).join(' ');
    if (sig.every(rx => rx.test(line))) return r;
  }
  return null;
};

self.onmessage = async (ev: MessageEvent<ParseRequest>) => {
  const { arrayBuffer, useCase, skipSampleRow, config } = ev.data;
  try {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Invalid or empty file');
    }
    const maxRows = config?.maxRows ?? 200000;
    const progressEvery = config?.progressEvery ?? 1000;
    const trimValues = config?.trimValues ?? true;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    // Pick the correct worksheet per use case
    let firstWorksheet = workbook.worksheets[0];
    if (!firstWorksheet) throw new Error('No worksheets found');
    if (useCase === 'ecommerce') {
      const material = workbook.worksheets.find(ws => ws.name.toLowerCase() === 'material');
      if (material) firstWorksheet = material;
    } else if (useCase === 'amazon') {
      const withKeys = workbook.worksheets.find(ws => !!detectAmazonHeader(ws, 8, trimValues));
      if (withKeys) firstWorksheet = withKeys;
    }

    let columns: string[] = [];
    let dataStartRow = 2;
    let headerRowIndex = 1;

    if (useCase === 'amazon') {
      const keyRow = detectAmazonHeader(firstWorksheet, 8, trimValues);
      if (keyRow) {
        columns = getRowValues(firstWorksheet, keyRow, trimValues);
        dataStartRow = keyRow + (skipSampleRow ? 3 : 2);
        headerRowIndex = keyRow;
      }
    } else if (useCase === 'partoo') {
      // Partoo files have a specific structure:
      // Row 1: Sample data ("business default en", etc.)
      // Row 2: Technical IDs ("siret", "country", "description_long")
      // Row 3: Display names ("SIRET", "Country", "Long description") ← USE THIS
      // Row 4: Field descriptions ("Requires 14 digits...", "Read only", etc.)
      // Row 5+: Actual data
      columns = getRowValues(firstWorksheet, 3, trimValues);
      dataStartRow = 5; // Skip first 4 rows
      headerRowIndex = 3;
    }
    
    if (columns.length === 0) {
      columns = getRowValues(firstWorksheet, 1, trimValues);
      dataStartRow = 2;
      headerRowIndex = 1;
    }

    const totalRows = Math.min(firstWorksheet.rowCount, Math.max(dataStartRow - 1, maxRows + dataStartRow - 1));
    const totalToProcess = Math.max(0, totalRows - (dataStartRow - 1));
    // progress: initial
    (self as unknown as DWGS).postMessage({ type: 'progress', current: 0, total: totalToProcess });

    const rows: RowData[] = [];
    for (let r = dataStartRow; r <= totalRows; r++) {
      const rowObj: RowData = {};
      const row = firstWorksheet.getRow(r);
      if (!row || row.cellCount === 0) continue;
      row.eachCell((cell, colNumber) => {
        try {
          const colName = columns[colNumber - 1] || `Column${colNumber}`;
          const val = normalizeValue(cell.value, trimValues);
          rowObj[colName] = val as any;
        } catch (cellError) {
          const colName = columns[colNumber - 1] || `Column${colNumber}`;
          rowObj[colName] = '';
          // eslint-disable-next-line no-console
          console.warn(`Cell parse error [r=${r},c=${colNumber}]`, cellError);
        }
      });
      if (Object.values(rowObj).some(v => String(v ?? '').trim() !== '')) rows.push(rowObj);
      const processedCount = (r - dataStartRow + 1);
      if (processedCount % progressEvery === 0 || processedCount === totalToProcess) {
        (self as unknown as DWGS).postMessage({ type: 'progress', current: processedCount, total: totalToProcess });
      }
    }

    // Capture Sheet1 for e-commerce joins
    let sheet1: { columns: string[]; rows: any[] } | undefined;
    if (useCase === 'ecommerce') {
      const s1 = workbook.worksheets.find(ws => ws.name.toLowerCase() === 'sheet1');
      if (s1) {
        const s1Columns: string[] = [];
        const s1Header = s1.getRow(1);
        s1Header.eachCell((cell, idx) => s1Columns[idx - 1] = String(normalizeValue(cell.value, trimValues)));
        const s1Rows: any[] = [];
        const s1Limit = Math.min(s1.rowCount, maxRows);
        for (let r = 2; r <= s1Limit; r++) {
          const rObj: any = {};
          const rr = s1.getRow(r);
          rr.eachCell((cell, idx) => {
            rObj[s1Columns[idx - 1]] = normalizeValue(cell.value, trimValues);
          });
          if (Object.values(rObj).some(v => String(v ?? '').trim() !== '')) s1Rows.push(rObj);
        }
        sheet1 = { columns: s1Columns, rows: s1Rows };
      }
    }

    const meta: ParseResult['meta'] = {
      worksheetName: firstWorksheet.name,
      useCase,
      headerRowIndex,
      dataStartRow,
      fileType: 'xlsx',
      sheet1,
    };

    const result: ParseResult = { rows, columns, meta };
    (self as unknown as DWGS).postMessage({ type: 'done', success: true, result });

    // Attempt to free memory references aggressively
    try {
      // @ts-ignore
      meta.sheet1 = undefined;
      const ids = (workbook.worksheets || []).map(ws => ws.id);
      ids.forEach(id => {
        try { workbook.removeWorksheet(id as any); } catch { /* ignore */ }
      });
      // @ts-ignore
      (workbook as any).model = null;
    } catch {
      // ignore cleanup errors
    }
  } catch (error: any) {
    (self as unknown as DWGS).postMessage({ type: 'done', success: false, error: error?.message || 'Worker parse error' });
  }
};


