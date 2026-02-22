import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import * as ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { generateFileName } from '../utils/fileUtils';

interface XlsxExportButtonProps {
  originalMeta?: {
    arrayBuffer?: ArrayBuffer;
    worksheetName?: string;
    headerRowIndex?: number;
    dataStartRow?: number;
    fileType?: 'xlsx' | 'xlsm';
  };
  useCase?: 'ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next' | 'partoo';
  results: any[];
  isDisabled?: boolean;
}

/** Internal metadata fields added by server processors — must never appear in exports */
const isInternalField = (key: string) => key.startsWith('_');

const XlsxExportButton: React.FC<XlsxExportButtonProps> = ({ originalMeta, useCase = 'ecommerce', results, isDisabled }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!results || results.length === 0) return;
    setIsExporting(true);
    try {
      let workbook: ExcelJS.Workbook;
      let worksheet: ExcelJS.Worksheet;

      if (originalMeta?.arrayBuffer && useCase === 'partoo') {
        // Partoo: use SheetJS (same lib the worker uses) to preserve original structure
        const wb = XLSX.read(new Uint8Array(originalMeta.arrayBuffer), { type: 'array', cellDates: true, cellText: true });
        const wsName = originalMeta.worksheetName || wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        if (!ws || !ws['!ref']) throw new Error('Worksheet not found');

        const range = XLSX.utils.decode_range(ws['!ref']);
        // meta indices are 1-based; SheetJS is 0-based
        const headerRow0 = (originalMeta.headerRowIndex || 4) - 1;
        const dataStart0 = (originalMeta.dataStartRow || 6) - 1;

        // Build column name → 0-based column index map from the header row
        const colMap = new Map<string, number>();
        for (let c = range.s.c; c <= range.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r: headerRow0, c });
          const cell = ws[addr];
          const name = cell ? String(cell.w ?? cell.v ?? '').trim() : '';
          if (name) colMap.set(name, c);
        }

        // Find the Business ID column
        const bizIdCol = colMap.get('Business identification') ?? colMap.get('Business Id');
        if (bizIdCol == null) {
          console.warn('Partoo export: could not find Business ID column');
        }

        // Build a lookup: Business ID → processed row
        const resultsByBizId = new Map<string, Record<string, any>>();
        for (const row of results) {
          const bizId = String(row['Business identification'] ?? row['Business Id'] ?? '').trim();
          if (bizId) resultsByBizId.set(bizId, row);
        }

        // Iterate data rows and overwrite cells from processed results
        for (let r = dataStart0; r <= range.e.r; r++) {
          if (bizIdCol == null) break;
          const bizIdAddr = XLSX.utils.encode_cell({ r, c: bizIdCol });
          const bizIdCell = ws[bizIdAddr];
          const cellBizId = bizIdCell ? String(bizIdCell.w ?? bizIdCell.v ?? '').trim() : '';
          if (!cellBizId) continue;
          const processed = resultsByBizId.get(cellBizId);
          if (!processed) continue; // row was filtered out — leave original values

          // Write only original columns from the processed row (skip internal _* fields)
          for (const [colName, colIdx] of colMap) {
            if (colName in processed && !isInternalField(colName)) {
              const addr = XLSX.utils.encode_cell({ r, c: colIdx });
              const newVal = String(processed[colName] ?? '');
              const existing = ws[addr];
              if (existing) {
                existing.v = newVal;
                existing.t = 's';
                delete existing.w; // clear cached formatted value
              } else if (newVal) {
                ws[addr] = { t: 's', v: newVal };
              }
            }
          }
        }

        const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const fileName = generateFileName('optimized', useCase, 'xlsx');
        downloadBuffer(wbOut, fileName);
      } else if (originalMeta?.arrayBuffer) {
        // Clone original workbook structure (ecommerce/amazon/next/aboutyou)
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(originalMeta.arrayBuffer);
        const wsName = originalMeta.worksheetName || (workbook.worksheets[0]?.name || 'Sheet1');
        worksheet = workbook.getWorksheet(wsName) || workbook.worksheets[0];

        // Ensure gen_* columns exist; append if missing
        const existingHeaders: string[] = [];
        const headerRowIndex = (originalMeta?.headerRowIndex || 1);
        const headerRow = worksheet.getRow(headerRowIndex);
        headerRow.eachCell((cell, idx) => { existingHeaders[idx - 1] = String(cell.value ?? `Column${idx}`); });

        if (useCase === 'amazon' || useCase === 'ecommerce') {
          // Only add gen_* columns for use cases that produce them
          const genCols = useCase === 'amazon'
            ? ['gen_bullet_1','gen_bullet_2','gen_bullet_3','gen_bullet_4','gen_bullet_5','gen_description','gen_aplus_short']
            : ['gen_description'];

          const ensureHeader = (name: string) => {
            if (!existingHeaders.includes(name)) {
              existingHeaders.push(name);
              headerRow.getCell(existingHeaders.length).value = name;
            }
          };
          genCols.forEach(ensureHeader);
          headerRow.commit();

          // Write rows aligned by index — only gen_* columns
          const startDataRow = originalMeta?.dataStartRow || (headerRowIndex + 1);
          for (let i = 0; i < results.length; i++) {
            const excelRowIndex = startDataRow + i;
            const wsRow = worksheet.getRow(excelRowIndex);
            for (const name of genCols) {
              const colIndex = existingHeaders.indexOf(name) + 1;
              if (colIndex > 0) {
                wsRow.getCell(colIndex).value = results[i][name] ?? '';
              }
            }
            wsRow.commit();
          }
        } else {
          // NEXT / AboutYou: overwrite existing columns in-place (no gen_* columns)
          const startDataRow = originalMeta?.dataStartRow || (headerRowIndex + 1);
          for (let i = 0; i < results.length; i++) {
            const excelRowIndex = startDataRow + i;
            const wsRow = worksheet.getRow(excelRowIndex);
            for (let hIdx = 0; hIdx < existingHeaders.length; hIdx++) {
              const colName = existingHeaders[hIdx];
              if (colName && colName in results[i] && !isInternalField(colName)) {
                wsRow.getCell(hIdx + 1).value = results[i][colName] ?? '';
              }
            }
            wsRow.commit();
          }
        }

        // Download as XLSX
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = generateFileName('optimized', useCase, 'xlsx');
        downloadBuffer(buffer, fileName);
      } else {
        // Fallback: no original file available (e.g. reconnect scenario)
        // Create a new workbook but strip internal metadata fields
        workbook = new ExcelJS.Workbook();
        const sheetName = originalMeta?.worksheetName || 'Sheet1';
        worksheet = workbook.addWorksheet(sheetName);
        const headers = Object.keys(results[0]).filter(k => !isInternalField(k));
        worksheet.addRow(headers);
        results.forEach(row => worksheet.addRow(headers.map(h => row[h] ?? '')));
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = generateFileName('optimized', useCase, 'xlsx');
        downloadBuffer(buffer, fileName);
      }
    } catch (e) {
      console.error('Export error:', e);
      alert('Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadBuffer = (buffer: ArrayBuffer, filename: string) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleExport} disabled={isDisabled || isExporting}>
      {isExporting ? 'Exporting…' : 'Export XLSX'}
    </Button>
  );
};

export default XlsxExportButton;
