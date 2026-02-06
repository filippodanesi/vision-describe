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
import { type ColorMapping, COLOR_TRANSLATIONS } from '../utils/translations/colorTranslations';

interface ColorTranslatorTabProps {
  mappings: ColorMapping[];
  onChange: (mappings: ColorMapping[]) => void;
}

export const ColorTranslatorTab: React.FC<ColorTranslatorTabProps> = ({ mappings, onChange }) => {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter.trim()) return mappings;
    const q = filter.toLowerCase();
    return mappings.filter(
      (m) =>
        m.code.toLowerCase().includes(q) ||
        m.triumphName.toLowerCase().includes(q) ||
        m.standardColor.toLowerCase().includes(q),
    );
  }, [mappings, filter]);

  const unmappedCount = mappings.filter((m) => !m.standardColor).length;

  const handleStandardColorChange = (code: string, newValue: string) => {
    const updated = mappings.map((m) =>
      m.code === code ? { ...m, standardColor: newValue } : m,
    );
    onChange(updated);
  };

  const handleReset = () => {
    onChange([...COLOR_TRANSLATIONS]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code, name or standard color..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{mappings.length} colors</Badge>
        {unmappedCount > 0 && (
          <Badge variant="destructive">{unmappedCount} unmapped</Badge>
        )}
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset
        </Button>
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead>Triumph Name</TableHead>
              <TableHead className="w-[200px]">Standard Color</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.code}>
                <TableCell className="font-mono text-xs">{m.code}</TableCell>
                <TableCell className="text-sm">{m.triumphName}</TableCell>
                <TableCell>
                  <Input
                    value={m.standardColor}
                    onChange={(e) => handleStandardColorChange(m.code, e.target.value)}
                    className="h-8 text-sm"
                  />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No colors match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
