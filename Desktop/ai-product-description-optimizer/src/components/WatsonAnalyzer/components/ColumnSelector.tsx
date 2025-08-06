import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface ColumnSelectorProps {
  columns: string[];
  onColumnsSelected: (columns: string[]) => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ columns, onColumnsSelected }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleColumn = (col: string) => {
    setSelected((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-3 rounded-md">
        {columns.map((col) => (
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