// Web Worker: Fast XLSX/XLSM parsing off the main thread using SheetJS
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Workers run in a different context
import * as XLSX from 'xlsx';

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

/**
 * Read a single row from a SheetJS worksheet as an array of string values.
 * rowIndex is 0-based.
 */
const getRowValues = (ws: XLSX.WorkSheet, rowIndex: number, trimValues: boolean): string[] => {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const vals: string[] = [];
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: rowIndex, c });
    const cell = ws[addr];
    if (!cell) {
      vals.push('');
      continue;
    }
    // Use formatted value (w), or raw value (v)
    let v = cell.w ?? cell.v;
    if (v == null) { vals.push(''); continue; }
    if (v instanceof Date) { vals.push(v.toISOString()); continue; }
    const s = String(v);
    vals.push(trimValues ? s.trim() : s);
  }
  return vals;
};

/**
 * Detect Amazon header row by signature patterns.
 * Returns 0-based row index or null.
 */
const detectAmazonHeader = (ws: XLSX.WorkSheet, maxScan: number, trimValues: boolean): number | null => {
  const sig = [/vendor_sku#1\.value/i, /item_name#1\.value/i, /brand#1\.value/i, /bullet_point#1\.value/i, /rtip_product_description#1\.value/i];
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const limit = Math.min(range.e.r, maxScan - 1);
  for (let r = 0; r <= limit; r++) {
    const line = getRowValues(ws, r, trimValues).join(' ');
    if (sig.every(rx => rx.test(line))) return r;
  }
  return null;
};

/**
 * Convert a worksheet to an array of RowData objects given header columns.
 * dataStartRow and headerRow are 0-based.
 */
const sheetToRows = (
  ws: XLSX.WorkSheet,
  columns: string[],
  dataStartRow: number,
  maxRows: number,
  trimValues: boolean,
  progressEvery: number,
  post: (msg: WorkerMessage) => void
): RowData[] => {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const lastRow = Math.min(range.e.r, dataStartRow + maxRows - 1);
  const totalToProcess = Math.max(0, lastRow - dataStartRow + 1);

  post({ type: 'progress', current: 0, total: totalToProcess });

  const rows: RowData[] = [];
  for (let r = dataStartRow; r <= lastRow; r++) {
    const rowObj: RowData = {};
    let hasValue = false;

    for (let c = range.s.c; c <= range.e.c; c++) {
      const colName = columns[c] || `Column${c + 1}`;
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell) {
        // Keep key with empty string so `key in row` works (matches ExcelJS behavior)
        rowObj[colName] = '';
        continue;
      }

      let v = cell.w ?? cell.v;
      if (v == null) {
        rowObj[colName] = '';
        continue;
      }
      if (v instanceof Date) v = v.toISOString();
      const s = String(v);
      const val = trimValues ? s.trim() : s;
      if (val !== '') hasValue = true;
      rowObj[colName] = val;
    }

    if (hasValue) rows.push(rowObj);

    const processedCount = r - dataStartRow + 1;
    if (processedCount % progressEvery === 0 || processedCount === totalToProcess) {
      post({ type: 'progress', current: processedCount, total: totalToProcess });
    }
  }

  return rows;
};

self.onmessage = (ev: MessageEvent<ParseRequest>) => {
  const { arrayBuffer, useCase, skipSampleRow, config } = ev.data;
  const post = (msg: WorkerMessage) => (self as unknown as DWGS).postMessage(msg);

  try {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Invalid or empty file');
    }
    const maxRows = config?.maxRows ?? 200000;
    const progressEvery = config?.progressEvery ?? 1000;
    const trimValues = config?.trimValues ?? true;

    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array', cellDates: true, cellText: true });

    if (!workbook.SheetNames.length) throw new Error('No worksheets found');

    // Pick the correct worksheet per use case
    let sheetName = workbook.SheetNames[0];
    if (useCase === 'ecommerce') {
      const materialName = workbook.SheetNames.find(n => n.toLowerCase() === 'material');
      if (materialName) sheetName = materialName;
    } else if (useCase === 'amazon') {
      for (const sn of workbook.SheetNames) {
        if (detectAmazonHeader(workbook.Sheets[sn], 8, trimValues) !== null) {
          sheetName = sn;
          break;
        }
      }
    }

    const ws = workbook.Sheets[sheetName];
    if (!ws) throw new Error('Worksheet not found');

    let columns: string[] = [];
    // dataStartRow and headerRowIndex are 0-based internally
    let dataStartRow = 1;
    let headerRowIndex = 0;

    if (useCase === 'amazon') {
      const keyRow = detectAmazonHeader(ws, 8, trimValues);
      if (keyRow !== null) {
        columns = getRowValues(ws, keyRow, trimValues);
        // Skip: keyRow (headers), requiredness row, optionally sample row
        dataStartRow = keyRow + (skipSampleRow ? 3 : 2);
        headerRowIndex = keyRow;
      }
    } else if (useCase === 'partoo') {
      // Partoo files have a specific structure:
      // Row 1 (idx 0): Header groupings ("Business identification", "Address", "Descriptions")
      // Row 2 (idx 1): Sample data ("business default en" repeated)
      // Row 3 (idx 2): Technical IDs ("business_id", "name", "code", "status", etc.)
      // Row 4 (idx 3): Display names ("Business Id", "Name", "Code", "Status", etc.) ← USE THIS
      // Row 5 (idx 4): Field descriptions ("Do not delete", "Read only", etc.) ← SKIP
      // Row 6+ (idx 5+): Actual data
      columns = getRowValues(ws, 3, trimValues);
      dataStartRow = 5;
      headerRowIndex = 3;
    }

    if (columns.length === 0) {
      columns = getRowValues(ws, 0, trimValues);
      dataStartRow = 1;
      headerRowIndex = 0;
    }

    const rows = sheetToRows(ws, columns, dataStartRow, maxRows, trimValues, progressEvery, post);

    // Capture Sheet1 for e-commerce joins
    let sheet1: { columns: string[]; rows: any[] } | undefined;
    if (useCase === 'ecommerce') {
      const s1Name = workbook.SheetNames.find(n => n.toLowerCase() === 'sheet1');
      if (s1Name) {
        const s1ws = workbook.Sheets[s1Name];
        const s1Columns = getRowValues(s1ws, 0, trimValues);
        const s1Rows = sheetToRows(s1ws, s1Columns, 1, maxRows, trimValues, progressEvery, () => {});
        sheet1 = { columns: s1Columns, rows: s1Rows };
      }
    }

    // Convert to 1-based for output (matches original ExcelJS-based output contract)
    const meta: ParseResult['meta'] = {
      worksheetName: sheetName,
      useCase,
      headerRowIndex: headerRowIndex + 1,
      dataStartRow: dataStartRow + 1,
      fileType: 'xlsx',
      sheet1,
    };

    const result: ParseResult = { rows, columns, meta };
    post({ type: 'done', success: true, result });

  } catch (error: any) {
    post({ type: 'done', success: false, error: error?.message || 'Worker parse error' });
  }
};
