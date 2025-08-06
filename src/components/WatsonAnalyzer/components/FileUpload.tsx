import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { File, HelpCircle, Upload } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as ExcelJS from 'exceljs';
import Papa from 'papaparse';

interface FileUploadProps {
  onFileUploaded: (data: { rows: any[]; columns: string[] }) => void;
}

/**
 * Excel and CSV file uploader that converts the first worksheet/CSV into JSON and
 * returns both the rows and the header columns via the callback supplied by
 * the parent. Uses safer alternatives to xlsx: exceljs for Excel files and papaparse for CSV.
 */
const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        // Handle CSV files with papaparse
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data as any[];
            const columns = results.meta.fields || [];
            onFileUploaded({ rows, columns });
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            alert('Error parsing CSV file. Please check the file format.');
          }
        });
      } else {
        // Handle Excel files with exceljs
        const arrayBuffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        
        const firstWorksheet = workbook.worksheets[0];
        if (!firstWorksheet) {
          alert('No worksheets found in the Excel file.');
          return;
        }

        const rows: any[] = [];
        const columns: string[] = [];
        
        // Get headers from first row
        const headerRow = firstWorksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
          columns.push(cell.value?.toString() || `Column${colNumber}`);
        });

        // Get data rows
        firstWorksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            const columnName = columns[colNumber - 1];
            rowData[columnName] = cell.value || '';
          });
          rows.push(rowData);
        });

      onFileUploaded({ rows, columns });
      }
    } catch (error) {
      console.error('File processing error:', error);
      alert('Error processing file. Please check the file format and try again.');
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-6">
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
      />
        
                <Button 
          variant="outline" 
          onClick={handleSelectFile}
          className="border-dashed border-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <Upload className="h-4 w-4 mr-2" /> 
          Choose File
      </Button>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Excel (.xlsx, .xls) or CSV</span>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="text-xs font-medium">Required columns:</p>
                <ul className="text-xs space-y-0.5">
                  <li>• ColorSAPMaterialNo</li>
                  <li>• ColorMaterialLongDescriptionEcom_[lang] or</li>
                  <li>• MaterialLongDescriptionEcom_[lang]</li>
                  <li>• Short description [lang]</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
    </div>
    </TooltipProvider>
  );
};

export default FileUpload; 