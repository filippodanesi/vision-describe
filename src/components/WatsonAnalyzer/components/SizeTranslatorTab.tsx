import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RotateCcw, Search } from 'lucide-react';
import {
  type SizeMapping,
  SIZE_TRANSLATION_TABLE,
} from '../utils/translations/sizeTranslations';

interface SizeTranslatorTabProps {
  mappings: SizeMapping[];
  onChange: (mappings: SizeMapping[]) => void;
}

export const SizeTranslatorTab: React.FC<SizeTranslatorTabProps> = ({ mappings, onChange }) => {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter.trim()) return mappings;
    const q = filter.toLowerCase();
    return mappings.filter(
      (m) => m.euSize.toLowerCase().includes(q) || m.gbSize.toLowerCase().includes(q),
    );
  }, [mappings, filter]);

  // Group by band (first two digits) for visual separation
  const grouped = useMemo(() => {
    const groups: { band: string; items: SizeMapping[] }[] = [];
    let currentBand = '';
    for (const m of filtered) {
      const band = m.euSize.replace(/[A-Za-z]+/g, '');
      if (band !== currentBand) {
        groups.push({ band, items: [] });
        currentBand = band;
      }
      groups[groups.length - 1].items.push(m);
    }
    return groups;
  }, [filtered]);

  const handleGbSizeChange = (euSize: string, newValue: string) => {
    const updated = mappings.map((m) =>
      m.euSize === euSize ? { ...m, gbSize: newValue } : m,
    );
    onChange(updated);
  };

  const handleReset = () => {
    onChange([...SIZE_TRANSLATION_TABLE]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by EU or GB size..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{mappings.length} sizes</Badge>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset
        </Button>
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">EU Size</TableHead>
              <TableHead className="w-[200px]">GB Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map((group, idx) => (
              <React.Fragment key={`${group.band}-${idx}`}>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={2} className="py-1.5 text-xs font-semibold text-muted-foreground">
                    Band {group.band}
                  </TableCell>
                </TableRow>
                {group.items.map((m) => (
                  <TableRow key={m.euSize}>
                    <TableCell className="font-mono text-sm">{m.euSize}</TableCell>
                    <TableCell>
                      <Input
                        value={m.gbSize}
                        onChange={(e) => handleGbSizeChange(m.euSize, e.target.value)}
                        className="h-8 text-sm w-[120px]"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  No sizes match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
