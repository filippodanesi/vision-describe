import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import * as ExcelJS from 'exceljs';
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

const XlsxExportButton: React.FC<XlsxExportButtonProps> = ({ originalMeta, useCase = 'ecommerce', results, isDisabled }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!results || results.length === 0) return;
    setIsExporting(true);
    try {
      let workbook: ExcelJS.Workbook;
      let worksheet: ExcelJS.Worksheet;

      if (originalMeta?.arrayBuffer && useCase === 'partoo') {
        // Partoo: preserve original file structure (multi-row headers) and write back by Business ID
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(originalMeta.arrayBuffer);
        const wsName = originalMeta.worksheetName || (workbook.worksheets[0]?.name || 'Sheet1');
        worksheet = workbook.getWorksheet(wsName) || workbook.worksheets[0];

        const headerRowIndex = originalMeta.headerRowIndex || 1;
        const headerRow = worksheet.getRow(headerRowIndex);

        // Build column name → column index map from the header row
        const colMap = new Map<string, number>();
        headerRow.eachCell((cell, colIdx) => {
          const name = String(cell.value ?? '').trim();
          if (name) colMap.set(name, colIdx);
        });

        // Find the Business ID column
        const bizIdColIdx = colMap.get('Business identification') || colMap.get('Business Id') || 0;
        if (!bizIdColIdx) {
          console.warn('Partoo export: could not find Business ID column');
        }

        // Build a lookup: Business ID → processed row
        const resultsByBizId = new Map<string, Record<string, any>>();
        for (const row of results) {
          const bizId = String(row['Business identification'] ?? row['Business Id'] ?? '').trim();
          if (bizId) resultsByBizId.set(bizId, row);
        }

        // Iterate data rows and overwrite cells from processed results
        const startDataRow = originalMeta.dataStartRow || (headerRowIndex + 1);
        const lastRow = worksheet.rowCount;
        for (let r = startDataRow; r <= lastRow; r++) {
          const wsRow = worksheet.getRow(r);
          if (!bizIdColIdx) break;
          const cellBizId = String(wsRow.getCell(bizIdColIdx).value ?? '').trim();
          if (!cellBizId) continue;
          const processed = resultsByBizId.get(cellBizId);
          if (!processed) continue; // row was filtered out — leave original values

          // Write all columns from the processed row into the original cells
          for (const [colName, colIdx] of colMap) {
            if (colName in processed) {
              wsRow.getCell(colIdx).value = processed[colName] ?? '';
            }
          }
          wsRow.commit();
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = generateFileName('optimized', useCase, 'xlsx');
        downloadBuffer(buffer, fileName);
      } else if (originalMeta?.arrayBuffer) {
        // Clone original workbook structure (ecommerce/amazon)
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(originalMeta.arrayBuffer);
        const wsName = originalMeta.worksheetName || (workbook.worksheets[0]?.name || 'Sheet1');
        worksheet = workbook.getWorksheet(wsName) || workbook.worksheets[0];

        // Ensure gen_* columns exist; append if missing
        const existingHeaders: string[] = [];
        const headerRowIndex = (originalMeta?.headerRowIndex || 1);
        const headerRow = worksheet.getRow(headerRowIndex);
        headerRow.eachCell((cell, idx) => { existingHeaders[idx - 1] = String(cell.value ?? `Column${idx}`); });

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

        // Write rows aligned by index
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

        // Download as XLSX
        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = generateFileName('optimized', useCase, 'xlsx');
        downloadBuffer(buffer, fileName);
      } else {
        // Create a new workbook from results
        workbook = new ExcelJS.Workbook();
        worksheet = workbook.addWorksheet('Results');
        const headers = Object.keys(results[0]);
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


