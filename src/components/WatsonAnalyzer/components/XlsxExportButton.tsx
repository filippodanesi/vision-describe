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
  useCase?: 'ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next';
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

      if (originalMeta?.arrayBuffer) {
        // Clone original workbook structure
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(originalMeta.arrayBuffer);
        const wsName = originalMeta.worksheetName || (workbook.worksheets[0]?.name || 'Sheet1');
        worksheet = workbook.getWorksheet(wsName) || workbook.worksheets[0];
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
        setIsExporting(false);
        return;
      }

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


