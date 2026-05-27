import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { USECASE_PROFILES } from '../usecases';
import { findMatchingShortDescriptionColumn } from '../utils/columnMatching';

interface ColumnMapping {
  longDescColumn: string;
  language: string;
  matchedShortDescColumn: string;
  availableShortDescColumns: string[];
}

interface ColumnConfirmationProps {
  fileData: { rows: any[]; columns: string[] };
  selectedColumns: string[];
  useCase?: 'ecommerce' | 'sloggi-ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next' | 'partoo';
  onConfirm: (mappings: ColumnMapping[]) => void;
  onBack: () => void;
}

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
      setMappings([]);
      return;
    }

    const langs = Array.from(new Set(
      fileData.columns
        .map(c => c.match(/MaterialLongDescriptionEcom_([a-z]{2})$/i)?.[1]?.toLowerCase())
        .filter(Boolean) as string[]
    ));
    setAvailableLangs(langs);
    setSelectedLangs(langs);

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
    const actualValue = newShortDescColumn === '__NONE__' ? '' : newShortDescColumn;
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

  const allMappingsValid =
    useCase === 'amazon'
      ? Boolean(amazonMapping.productId && (amazonMapping.descriptionIn || amazonMapping.bullets.some(Boolean)))
      : mappings.length > 0;
  const hasAutoMatches = mappings.some(mapping => mapping.matchedShortDescColumn);
  const hasFailedMatches = mappings.some(mapping => !mapping.matchedShortDescColumn);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="label-mono mb-1">Step 03 / Confirm</p>
        <h2 className="text-base font-semibold tracking-tightest text-foreground">
          Confirm column mappings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {useCase === 'amazon'
            ? 'Map Amazon columns such as vendor_sku#1.value, item_name#1.value, rtip_product_description#1.value, bullet_point#*.value.'
            : 'Verify that each Long Description column is paired with the correct Short Description for keyword extraction.'}
        </p>
      </div>

      {useCase !== 'amazon' && hasAutoMatches && (
        <div className="flex items-start gap-2 border border-border bg-card p-3 text-sm">
          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-foreground" aria-hidden="true" />
          <p className="text-muted-foreground">
            Automatic matching found{' '}
            <span className="font-mono tabular-nums text-foreground">
              {mappings.filter(m => m.matchedShortDescColumn).length} / {mappings.length}
            </span>{' '}
            Short Description columns.
          </p>
        </div>
      )}

      {useCase !== 'amazon' && hasFailedMatches && (
        <div className="flex items-start gap-2 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            Could not automatically match some columns. Please select the Short
            Description columns manually below.
          </p>
        </div>
      )}

      {(useCase === 'ecommerce' || useCase === 'sloggi-ecommerce') && availableLangs.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <p className="label-mono">Content languages</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Select which languages to process (input = output).
              </p>
            </div>
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
              {selectedLangs.length === availableLangs.length ? 'Deselect all' : 'Select all'}
            </Button>
          </div>

          <div className="border border-border bg-card p-4">
            <div className="flex flex-wrap gap-2">
              {availableLangs.map(lang => {
                const on = selectedLangs.includes(lang);
                return (
                  <label
                    key={lang}
                    className={cn(
                      'flex items-center gap-2 cursor-pointer border px-3 py-1.5 transition-colors',
                      on
                        ? 'border-signal bg-signal/[0.04]'
                        : 'border-border hover:border-foreground/40',
                    )}
                  >
                    <Checkbox
                      checked={on}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLangs(prev => [...prev, lang]);
                        } else {
                          setSelectedLangs(prev => prev.filter(l => l !== lang));
                        }
                      }}
                    />
                    <span className="font-mono text-xs uppercase tracking-caps-sm">{lang}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-3 label-mono-sm tabular-nums">
              {selectedLangs.length} / {availableLangs.length} selected
            </p>
          </div>
        </section>
      )}

      {useCase === 'amazon' ? (
        <section>
          <p className="label-mono mb-3">Amazon field mapping</p>
          <div className="border border-border bg-card p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {([
                ['Product ID', 'productId'],
                ['Title', 'title'],
                ['Description In', 'descriptionIn'],
              ] as const).map(([label, key]) => (
                <div key={key} className="space-y-1.5">
                  <div className="label-mono-sm">{label}</div>
                  <Select
                    value={(amazonMapping as any)[key] || ''}
                    onValueChange={(v) => setAmazonMapping(prev => ({ ...prev, [key]: v }))}
                  >
                    <SelectTrigger
                      className={cn(
                        'w-full',
                        !((amazonMapping as any)[key]) && (key === 'productId' || key === 'descriptionIn') && 'border-destructive/60',
                      )}
                    >
                      <SelectValue placeholder={`Select ${label} column…`} />
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
                <div className="label-mono-sm">Bullets In (up to 5)</div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {amazonMapping.bullets.map((b, i) => (
                    <Select
                      key={i}
                      value={b || ''}
                      onValueChange={(v) =>
                        setAmazonMapping(prev => {
                          const next = [...prev.bullets];
                          next[i] = v;
                          return { ...prev, bullets: next };
                        })
                      }
                    >
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
          </div>
        </section>
      ) : (
        <section>
          <p className="label-mono mb-3">Long ↔ Short mapping</p>
          <div className="border border-border divide-y divide-border bg-card">
            {mappings.map((mapping, index) => (
              <div key={mapping.longDescColumn} className="p-5">
                <div className="flex items-baseline gap-3 mb-3">
                  <span
                    className="font-mono text-xs tabular-nums text-muted-foreground/70 shrink-0"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold tracking-tightest text-foreground text-sm truncate">
                      {mapping.longDescColumn}
                    </h3>
                    <p className="label-mono-sm mt-0.5">Long description column to optimize</p>
                  </div>
                </div>

                <div className="space-y-3 pl-8">
                  <div>
                    <label className="label-mono-sm mb-2 block">
                      Short Description source (for keywords)
                    </label>
                    <Select
                      value={mapping.matchedShortDescColumn || '__NONE__'}
                      onValueChange={(value) => handleShortDescChange(index, value)}
                    >
                      <SelectTrigger
                        className={cn(
                          'w-full',
                          !mapping.matchedShortDescColumn && 'border-destructive/60',
                        )}
                      >
                        <SelectValue placeholder="Select Short Description column…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__NONE__">No Short Description (skip keywords)</SelectItem>
                        {mapping.availableShortDescColumns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {mapping.matchedShortDescColumn && (
                    <div className="border border-border bg-background p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <p className="text-muted-foreground leading-relaxed">
                          Keywords extracted from{' '}
                          <span className="font-mono text-foreground">{mapping.matchedShortDescColumn}</span>
                          {' '}→ applied to{' '}
                          <span className="font-mono text-foreground">{mapping.longDescColumn}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex justify-between pt-6 border-t border-border">
        <Button variant="outline" onClick={onBack}>
          Back to column selection
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!allMappingsValid}
          className="min-w-[120px]"
        >
          Continue to model selection
        </Button>
      </div>
    </div>
  );
};

export default ColumnConfirmation;
