/**
 * BusinessIdFilterUpload Component
 * 
 * @author Filippo Danesi
 * @created October 28, 2025
 * @description Component for uploading and managing business ID filters for Partoo processing.
 *              Allows users to upload a CSV/TXT file with a list of business IDs to process
 *              only those specific stores instead of all stores in the main file.
 * 
 * Features:
 * - CSV/TXT file upload with business IDs
 * - Automatic parsing and validation
 * - Visual feedback (count of loaded IDs)
 * - Clear filter option
 * - Only one column required (business_id or similar)
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Filter } from 'lucide-react';
import { toast } from 'sonner';
import * as ExcelJS from 'exceljs';

interface BusinessIdFilterUploadProps {
  onFilterLoaded: (ids: Set<string>) => void;
  onFilterCleared: () => void;
  disabled?: boolean;
}

const BusinessIdFilterUpload: React.FC<BusinessIdFilterUploadProps> = ({
  onFilterLoaded,
  onFilterCleared,
  disabled = false,
}) => {
  const [filterLoaded, setFilterLoaded] = useState(false);
  const [filterCount, setFilterCount] = useState(0);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Parse uploaded file and extract business IDs
   */
  const parseBusinessIds = (fileContent: string): Set<string> => {
    const ids = new Set<string>();
    
    // Split by lines and trim
    const lines = fileContent.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    
    // Check if first line is a header (contains common header keywords)
    const firstLine = lines[0]?.toLowerCase() || '';
    const isHeader = /business.?id|store.?id|id|identifier/i.test(firstLine);
    
    // Start from line 1 if header detected, otherwise line 0
    const startIndex = isHeader ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle CSV with commas - take first column
      if (line.includes(',')) {
        const firstColumn = line.split(',')[0].trim();
        if (firstColumn) {
          ids.add(firstColumn);
        }
      } else {
        // Plain text - one ID per line
        if (line) {
          ids.add(line);
        }
      }
    }
    
    return ids;
  };

  /**
   * Parse Excel file and extract business IDs from first column
   */
  const parseExcelFile = async (arrayBuffer: ArrayBuffer): Promise<Set<string>> => {
    const ids = new Set<string>();
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return ids;
    }
    
    // Check if first row is a header
    const firstRow = worksheet.getRow(1);
    const firstCellValue = firstRow.getCell(1).value;
    const isHeader = firstCellValue && 
      typeof firstCellValue === 'string' && 
      /business.?id|store.?id|id|identifier/i.test(firstCellValue.toLowerCase());
    
    // Start from row 2 if header detected, otherwise row 1
    const startRow = isHeader ? 2 : 1;
    
    // Iterate through rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < startRow) return;
      
      const cellValue = row.getCell(1).value;
      if (cellValue) {
        const stringValue = String(cellValue).trim();
        if (stringValue) {
          ids.add(stringValue);
        }
      }
    });
    
    return ids;
  };

  /**
   * Handle file upload
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !['csv', 'txt', 'xlsx', 'xls'].includes(fileExtension)) {
        toast('Invalid file type', {
          description: 'Please upload a CSV, TXT, or Excel file with business IDs',
          style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
        });
        return;
      }

      let businessIds: Set<string>;

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Handle Excel files
        const arrayBuffer = await file.arrayBuffer();
        businessIds = await parseExcelFile(arrayBuffer);
      } else {
        // Handle CSV/TXT files
        const text = await file.text();
        businessIds = parseBusinessIds(text);
      }

      if (businessIds.size === 0) {
        toast('No business IDs found', {
          description: 'The file appears to be empty or invalid. Make sure it contains one business ID per line.',
          style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
        });
        return;
      }

      // Success - load filter
      setFilterLoaded(true);
      setFilterCount(businessIds.size);
      setFileName(file.name);
      onFilterLoaded(businessIds);

      toast('Filter loaded successfully', {
        description: `${businessIds.size} business IDs will be processed. All other stores will keep their original values.`,
      });

    } catch (error) {
      console.error('Error reading filter file:', error);
      toast('Error reading file', {
        description: 'Could not read the filter file. Please check the format and try again.',
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle clear filter
   */
  const handleClearFilter = () => {
    setFilterLoaded(false);
    setFilterCount(0);
    setFileName('');
    onFilterCleared();
    
    toast('Filter cleared', {
      description: 'All stores will now be processed.',
    });
  };

  /**
   * Trigger file input click
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Filter className="w-5 h-5 text-blue-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            Business ID Filter (Optional)
          </h3>
          <p className="text-xs text-blue-700 mb-3">
            Upload a file with specific business IDs to process only those stores. 
            All other stores will keep their original descriptions unchanged.
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {!filterLoaded ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                  disabled={disabled}
                  className="bg-white hover:bg-blue-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Filter File
                </Button>
                <span className="text-xs text-blue-600">
                  (CSV, TXT, or Excel with business IDs)
                </span>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-white rounded-md px-3 py-2 border border-blue-300">
                <FileText className="w-4 h-4 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 truncate">
                    {fileName}
                  </p>
                  <p className="text-xs text-blue-600">
                    {filterCount} business ID{filterCount !== 1 ? 's' : ''} loaded
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilter}
                  disabled={disabled}
                  className="h-8 w-8 p-0 hover:bg-red-50"
                >
                  <X className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />

          {/* Format help */}
          {!filterLoaded && (
            <div className="mt-3 text-xs text-blue-600 space-y-1">
              <p className="font-medium">Accepted formats:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>CSV with business IDs in first column</li>
                <li>TXT with one business ID per line</li>
                <li>Excel (.xlsx/.xls) with business IDs in first column</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessIdFilterUpload;