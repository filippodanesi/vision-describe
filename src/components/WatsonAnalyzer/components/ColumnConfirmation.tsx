import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ColumnMapping {
  longDescColumn: string;
  language: string;
  matchedShortDescColumn: string;
  availableShortDescColumns: string[];
}

interface ColumnConfirmationProps {
  fileData: { rows: any[]; columns: string[] };
  selectedColumns: string[];
  onConfirm: (mappings: ColumnMapping[]) => void;
  onBack: () => void;
}

// Utility function to find matching short description column (same as in hooks)
const findMatchingShortDescriptionColumn = (columnNames: string[], targetLanguage: string): string => {
  const lang = targetLanguage.toLowerCase();
  const langUpper = lang.toUpperCase();
  
  // First priority: exact language match with strict patterns
  for (const key of columnNames) {
    const lower = key.toLowerCase();
    if (lower.includes('short description')) {
      const patterns = [
        ` ${lang}$`,           // "Short description de" (end of string)
        ` ${langUpper}$`,      // "Short description DE" (end of string)
        `\\[${lang}\\]`,       // "Short description [de]" (escaped brackets)
        `\\[${langUpper}\\]`,  // "Short description [DE]" (escaped brackets)
        `_${lang}$`,          // "Short description_de" (end of string)
        `_${langUpper}$`,     // "Short description_DE" (end of string)
        ` ${lang} `,          // "Short description de " (with space after)
        ` ${langUpper} `      // "Short description DE " (with space after)
      ];
      
      for (const pattern of patterns) {
        const regex = new RegExp(pattern);
        if (regex.test(lower) || regex.test(key)) {
          return key;
        }
      }
    }
  }
  
  // Second priority: Look for "Short descriptions" plural form
  for (const key of columnNames) {
    const lower = key.toLowerCase();
    if (lower.includes('short descriptions')) {
      const patterns = [
        ` ${lang}$`,           // "Short descriptions de" (end of string)
        ` ${langUpper}$`,      // "Short descriptions DE" (end of string)
        `\\[${lang}\\]`,       // "Short descriptions [de]" (escaped brackets)
        `\\[${langUpper}\\]`,  // "Short descriptions [DE]" (escaped brackets)
        `_${lang}$`,          // "Short descriptions_de" (end of string)
        `_${langUpper}$`,     // "Short descriptions_DE" (end of string)
        ` ${lang} `,          // "Short descriptions de " (with space after)
        ` ${langUpper} `      // "Short descriptions DE " (with space after)
      ];
      
      for (const pattern of patterns) {
        const regex = new RegExp(pattern);
        if (regex.test(lower) || regex.test(key)) {
          return key;
        }
      }
    }
  }
  
  return '';
};

const ColumnConfirmation: React.FC<ColumnConfirmationProps> = ({
  fileData,
  selectedColumns,
  onConfirm,
  onBack,
}) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);

  useEffect(() => {
    // Generate initial mappings
    const initialMappings: ColumnMapping[] = selectedColumns.map(column => {
      // Extract language from column name
      const langMatch = column.match(/_([a-z]{2})$/i);
      const language = langMatch ? langMatch[1].toUpperCase() : 'UNK';
      
      // Find all short description columns
      const availableShortDescColumns = fileData.columns.filter(col => 
        col.toLowerCase().includes('short description')
      );
      
      // Find the best match
      const matchedShortDescColumn = langMatch 
        ? findMatchingShortDescriptionColumn(fileData.columns, langMatch[1])
        : '';

      return {
        longDescColumn: column,
        language,
        matchedShortDescColumn,
        availableShortDescColumns,
      };
    });

    setMappings(initialMappings);
  }, [selectedColumns, fileData.columns]);

  const handleShortDescChange = (index: number, newShortDescColumn: string) => {
    // Convert special value back to empty string
    const actualValue = newShortDescColumn === "__NONE__" ? "" : newShortDescColumn;
    setMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, matchedShortDescColumn: actualValue } : mapping
    ));
  };

  const handleConfirm = () => {
    onConfirm(mappings);
  };

  const allMappingsValid = mappings.length > 0; // Always valid now since user can choose no short description
  const hasAutoMatches = mappings.some(mapping => mapping.matchedShortDescColumn);
  const hasFailedMatches = mappings.some(mapping => !mapping.matchedShortDescColumn);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Confirm Column Mappings</h2>
        <p className="text-gray-600">
          Verify that each Long Description column is paired with the correct Short Description for keyword extraction
        </p>
      </div>

      {hasAutoMatches && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Automatic matching found {mappings.filter(m => m.matchedShortDescColumn).length} of {mappings.length} Short Description columns.
          </AlertDescription>
        </Alert>
      )}

      {hasFailedMatches && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Could not automatically match some columns. Please select the Short Description columns manually.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {mappings.map((mapping, index) => (
          <Card key={mapping.longDescColumn}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                  {mapping.language}
                </span>
                {mapping.longDescColumn}
              </CardTitle>
              <CardDescription>
                Long Description column to optimize
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Short Description Source (for keywords):
                  </label>
                  <Select 
                    value={mapping.matchedShortDescColumn || "__NONE__"} 
                    onValueChange={(value) => handleShortDescChange(index, value)}
                  >
                    <SelectTrigger className={`w-full ${!mapping.matchedShortDescColumn ? 'border-red-300' : ''}`}>
                      <SelectValue placeholder="Select Short Description column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">No Short Description (skip keywords)</SelectItem>
                      {mapping.availableShortDescColumns.map(col => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {mapping.matchedShortDescColumn && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800">Preview:</p>
                        <p className="text-green-700 mt-1">
                          Keywords will be extracted from "<strong>{mapping.matchedShortDescColumn}</strong>" 
                          to optimize "<strong>{mapping.longDescColumn}</strong>"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back to Column Selection
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!allMappingsValid}
          className="min-w-[120px]"
        >
          Continue to Model Selection
        </Button>
      </div>
    </div>
  );
};

export default ColumnConfirmation;