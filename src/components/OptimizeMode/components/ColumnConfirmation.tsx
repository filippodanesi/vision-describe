import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { USECASE_PROFILES } from '../usecases';

interface ColumnMapping {
  longDescColumn: string;
  language: string;
  matchedShortDescColumn: string;
  availableShortDescColumns: string[];
}

interface ColumnConfirmationProps {
  fileData: { rows: any[]; columns: string[] };
  selectedColumns: string[];
  useCase?: 'ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next' | 'partoo';
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
    if (lower.includes('short description') || lower.startsWith('sc') || lower.startsWith('materialalternativestyle_')) {
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
      // Direct exacts: SC or MaterialAlternativeStyle_<lang>
      if (/^sc$/i.test(key) || new RegExp(`^sc[_\s-]?${lang}$`, 'i').test(key)) {
        return key;
      }
      if (new RegExp(`^materialalternativestyle_${lang}$`, 'i').test(key)) {
        return key;
      }
    }
  }
  
  // Second priority: Look for the "Short descriptions" plural form
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
  useCase = 'ecommerce',
  onConfirm,
  onBack,
}) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const [amazonMapping, setAmazonMapping] = useState<{
    productId?: string;
    title?: string;
    descriptionIn?: string;
    bullets: (string | undefined)[];
  }>({ bullets: [] });

  useEffect(() => {
    if (useCase === 'amazon') {
      // Suggest mapping using detectors
      const cols = fileData.columns;
      const prof = USECASE_PROFILES.amazon;
      const pick = (rxs: RegExp[]) => cols.find(c => rxs.some(rx => rx.test(c)));
      setAmazonMapping({
        productId: pick(prof.detectors.productId),
        title: pick(prof.detectors.title),
        descriptionIn: pick(prof.detectors.descriptionIn),
        bullets: [
          pick(prof.detectors.bulletIn1),
          pick(prof.detectors.bulletIn2),
          pick(prof.detectors.bulletIn3),
          pick(prof.detectors.bulletIn4),
          pick(prof.detectors.bulletIn5),
        ],
      });
      setMappings([]); // not used for amazon
      return;
    }

    // E-commerce: derive languages from columns
    const langs = Array.from(new Set(
      fileData.columns
        .map(c => c.match(/MaterialLongDescriptionEcom_([a-z]{2})$/i)?.[1]?.toLowerCase())
        .filter(Boolean) as string[]
    ));
    setAvailableLangs(langs);
    // Default: ALL languages selected
    setSelectedLangs(langs);

    // Build mappings for ALL selected languages (all by default)
    const selectedForLangs = selectedColumns.filter(c =>
      langs.some(l => new RegExp(`MaterialLongDescriptionEcom_${l}$`, 'i').test(c))
    );
    const initialMappings: ColumnMapping[] = (selectedForLangs.length ? selectedForLangs : selectedColumns).map(column => {
      const langMatch = column.match(/_([a-z]{2})$/i);
      const language = langMatch ? langMatch[1].toUpperCase() : 'UNK';
      const availableShortDescColumns = fileData.columns.filter(col => {
        const lower = col.toLowerCase();
        const isShortDesc = lower.includes('short description');
        const isSC = /^sc(\b|[_\s-][a-z]{2}$|$)/i.test(col);
        const isAltStyle = /^materialalternativestyle_/i.test(col);
        return isShortDesc || isSC || isAltStyle;
      });
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
  }, [selectedColumns, fileData.columns, useCase]);

  // Rebuild mappings when selectedLangs changes (after initial load)
  useEffect(() => {
    if (useCase === 'amazon' || availableLangs.length === 0) return;

    const selectedForLangs = selectedColumns.filter(c =>
      selectedLangs.some(l => new RegExp(`MaterialLongDescriptionEcom_${l}$`, 'i').test(c))
    );
    const newMappings: ColumnMapping[] = (selectedForLangs.length ? selectedForLangs : []).map(column => {
      const langMatch = column.match(/_([a-z]{2})$/i);
      const language = langMatch ? langMatch[1].toUpperCase() : 'UNK';
      const availableShortDescColumns = fileData.columns.filter(col => {
        const lower = col.toLowerCase();
        const isShortDesc = lower.includes('short description');
        const isSC = /^sc(\b|[_\s-][a-z]{2}$|$)/i.test(col);
        const isAltStyle = /^materialalternativestyle_/i.test(col);
        return isShortDesc || isSC || isAltStyle;
      });
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

    setMappings(newMappings);
  }, [selectedLangs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShortDescChange = (index: number, newShortDescColumn: string) => {
    // Convert special value back to empty string
    const actualValue = newShortDescColumn === "__NONE__" ? "" : newShortDescColumn;
    setMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, matchedShortDescColumn: actualValue } : mapping
    ));
  };

  const handleConfirm = () => {
    if (useCase === 'amazon') {
      onConfirm({ useCase: 'amazon', mapping: amazonMapping } as any);
      return;
    }
    onConfirm({ useCase: 'ecommerce', workLangs: selectedLangs, mappings } as any);
  };


  const allMappingsValid = useCase === 'amazon' ? Boolean(amazonMapping.productId && (amazonMapping.descriptionIn || amazonMapping.bullets.some(Boolean))) : mappings.length > 0;
  const hasAutoMatches = mappings.some(mapping => mapping.matchedShortDescColumn);
  const hasFailedMatches = mappings.some(mapping => !mapping.matchedShortDescColumn);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-medium mb-2">Confirm Column Mappings</h2>
        {useCase === 'amazon' ? (
          <p className="text-gray-600">Map Amazon columns such as vendor_sku#1.value, item_name#1.value, rtip_product_description#1.value, bullet_point#*.value</p>
        ) : (
          <p className="text-gray-600">Verify that each Long Description column is paired with the correct Short Description for keyword extraction</p>
        )}
      </div>

      {useCase !== 'amazon' && hasAutoMatches && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Automatic matching found {mappings.filter(m => m.matchedShortDescColumn).length} of {mappings.length} Short Description columns.
          </AlertDescription>
        </Alert>
      )}

      {useCase !== 'amazon' && hasFailedMatches && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Could not automatically match some columns. Please select the Short Description columns manually.
          </AlertDescription>
        </Alert>
      )}

      {useCase === 'ecommerce' && availableLangs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Content Languages</CardTitle>
            <CardDescription>Select which languages to process (input = output)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{selectedLangs.length} of {availableLangs.length} selected</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedLangs.length === availableLangs.length) {
                    setSelectedLangs([]);
                  } else {
                    setSelectedLangs([...availableLangs]);
                  }
                }}
              >
                {selectedLangs.length === availableLangs.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              {availableLangs.map(lang => (
                <label key={lang} className="flex items-center gap-2 cursor-pointer rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50 transition-colors">
                  <Checkbox
                    checked={selectedLangs.includes(lang)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLangs(prev => [...prev, lang]);
                      } else {
                        setSelectedLangs(prev => prev.filter(l => l !== lang));
                      }
                    }}
                  />
                  <span className="text-sm font-mono font-medium uppercase">{lang}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">

        {useCase === 'amazon' ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Amazon Field Mapping</CardTitle>
              <CardDescription>Confirm or adjust detected columns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {([
                  ['Product ID', 'productId'],
                  ['Title', 'title'],
                  ['Description In', 'descriptionIn'],
                ] as const).map(([label, key]) => (
                  <div key={key} className="space-y-1">
                    <div className="text-gray-700 font-medium">{label}</div>
                    <Select value={(amazonMapping as any)[key] || ''} onValueChange={(v) => setAmazonMapping(prev => ({ ...prev, [key]: v }))}>
                      <SelectTrigger className={`w-full ${!((amazonMapping as any)[key]) && (key === 'productId' || key === 'descriptionIn') ? 'border-red-300' : ''}`}>
                        <SelectValue placeholder={`Select ${label} column...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {fileData.columns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <div className="md:col-span-2 space-y-2">
                  <div className="text-gray-700 font-medium">Bullets In (up to 5)</div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {amazonMapping.bullets.map((b, i) => (
                      <Select key={i} value={b || ''} onValueChange={(v) => setAmazonMapping(prev => { const next = [...prev.bullets]; next[i] = v; return { ...prev, bullets: next }; })}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={`bullet ${i + 1}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {fileData.columns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          mappings.map((mapping, index) => (
            <Card key={mapping.longDescColumn}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
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
          ))
        )}
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