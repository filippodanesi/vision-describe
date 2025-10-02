import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { USECASE_PROFILES } from '../usecases';

interface ColumnSelectorProps {
  columns: string[];
  onColumnsSelected: (columns: string[]) => void;
  useCase?: 'ecommerce' | 'amazon' | 'zalando' | 'aboutyou' | 'next' | 'partoo';
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ columns, onColumnsSelected, useCase = 'ecommerce' }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [notices, setNotices] = useState<{ type: 'error' | 'info'; text: string }[]>([]);

  // Auto-select for Amazon based on detectors
  useEffect(() => {
    if (useCase !== 'amazon') return;
    if (!columns || columns.length === 0) return;
    // Avoid overwriting manual selections
    if (selected.length > 0) return;
    const prof = USECASE_PROFILES.amazon;
    const pick = (rxs: RegExp[]) => columns.find(c => rxs.some(rx => rx.test(c)));
    const initial: string[] = [];
    const pushIf = (v?: string) => { if (v && !initial.includes(v)) initial.push(v); };
    pushIf(pick(prof.detectors.productId));
    pushIf(pick(prof.detectors.title));
    pushIf(pick(prof.detectors.descriptionIn));
    pushIf(pick(prof.detectors.bulletIn1));
    pushIf(pick(prof.detectors.bulletIn2));
    pushIf(pick(prof.detectors.bulletIn3));
    pushIf(pick(prof.detectors.bulletIn4));
    pushIf(pick(prof.detectors.bulletIn5));
    // Optional brand
    const brand = columns.find(c => /brand#1\.value/i.test(c));
    pushIf(brand);
    if (initial.length > 0) setSelected(initial);

    const errs: { type: 'error' | 'info'; text: string }[] = [];
    if (!pick(prof.detectors.productId)) errs.push({ type: 'error', text: 'Missing required: vendor_sku#1.value' });
    const hasDesc = Boolean(pick(prof.detectors.descriptionIn));
    const hasAnyBullet = [prof.detectors.bulletIn1, prof.detectors.bulletIn2, prof.detectors.bulletIn3, prof.detectors.bulletIn4, prof.detectors.bulletIn5].some(rxs => Boolean(pick(rxs)));
    if (!hasDesc && !hasAnyBullet) errs.push({ type: 'error', text: 'Missing required: rtip_product_description#1.value or any bullet_point#*.value' });
    if (!brand) errs.push({ type: 'info', text: 'Optional not found: brand#1.value' });
    setNotices(errs);
  }, [useCase, columns]);

  const toggleColumn = (col: string) => {
    setSelected((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
  };

  const sortedColumns = (() => {
    if (useCase === 'amazon') {
      const pri = /(bullet|item_name|brand|vendor_sku|external_product_id|language|rtip_product_description)/i;
      return [...columns].sort((a, b) => Number(pri.test(b)) - Number(pri.test(a)) || a.localeCompare(b));
    }
    // ecommerce priority
    const score = (c: string) => {
      if (/^MaterialSAPMaterialNo$/i.test(c)) return 100;
      if (/^MaterialSeriesName$/i.test(c)) return 90;
      if (/^MaterialLongDescriptionEcom_/i.test(c)) return 80;
      if (/^Short description/i.test(c)) return 70;
      return 0;
    };
    return [...columns].sort((a, b) => score(b) - score(a) || a.localeCompare(b));
  })();

  return (
    <div className="space-y-4">
      {useCase === 'amazon' && notices.length > 0 && (
        <div className="space-y-2">
          {notices.map((n, idx) => (
            <Alert key={idx} variant={n.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{n.text}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-3 rounded-md">
        {sortedColumns.map((col) => (
          <label key={col} className="flex items-center space-x-2 text-sm">
            <Checkbox id={col} checked={selected.includes(col)} onCheckedChange={() => toggleColumn(col)} />
            <span>{col}</span>
          </label>
        ))}
      </div>
      <Button onClick={() => onColumnsSelected(selected)} disabled={selected.length === 0}>
        Confirm ({selected.length})
      </Button>
    </div>
  );
};

export default ColumnSelector; 