import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { TranslatedProduct } from '../../types';

interface TranslationResultProps {
  results: TranslatedProduct[];
  selectedLanguages: string[];
  onExport: () => Promise<Blob>;
  onReset: () => void;
}

export const TranslationResult: React.FC<TranslationResultProps> = ({
  results,
  selectedLanguages,
  onExport,
  onReset,
}) => {
  const totalTranslations = results.reduce(
    (sum, r) => sum + Object.keys(r.translations).length,
    0
  );
  const totalErrors = results.reduce(
    (sum, r) => sum + (r.errors?.length || 0),
    0
  );

  const handleExport = async () => {
    try {
      const blob = await onExport();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `translations_${timestamp}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast('File exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className=" space-y-6">
      <section>
        <div className="mb-3">
          <p className="label-mono">
            <span
              className="inline-block size-1.5 rounded-full bg-foreground mr-2 align-middle"
              aria-hidden="true"
            />
            Complete
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tightest text-foreground">
            Translation complete
          </h2>
        </div>

        <div className="border border-border bg-card">
          <div className="grid grid-cols-3 divide-x divide-border">
            <StatCell label="Products" value={results.length} />
            <StatCell label="Translations" value={totalTranslations} />
            <StatCell
              label="Errors"
              value={totalErrors}
              tone={totalErrors > 0 ? 'destructive' : 'foreground'}
            />
          </div>
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={onReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Translate another file
            </Button>
          </div>
        </div>
      </section>

      {results.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <p className="label-mono">Preview · first 10 rows</p>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {Math.min(10, results.length)} / {results.length}
            </span>
          </div>

          <div className="border border-border overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                    <TableHead className="label-mono">Material No</TableHead>
                    <TableHead className="label-mono">Product</TableHead>
                    {selectedLanguages.slice(0, 3).map(lang => (
                      <TableHead key={lang} className="label-mono">
                        {lang.toUpperCase()}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.slice(0, 10).map((r, idx) => (
                    <TableRow
                      key={idx}
                      className="hover:bg-muted/20 border-b border-border last:border-b-0"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                        {r.product.materialNumber}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {r.product.productName}
                      </TableCell>
                      {selectedLanguages.slice(0, 3).map(lang => (
                        <TableCell key={lang} className="text-xs text-muted-foreground max-w-[200px]">
                          <div className="truncate" title={r.translations[lang] || undefined}>
                            {r.translations[lang]
                              || (r.errors?.find(e => e.startsWith(lang)) ? '(error)' : '-')}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

function StatCell({
  label,
  value,
  tone = 'foreground',
}: {
  label: string;
  value: number;
  tone?: 'foreground' | 'destructive';
}) {
  return (
    <div className="p-5">
      <p className="label-mono-sm">{label}</p>
      <p
        className={cn(
          'mt-2 text-2xl font-mono tracking-tightest tabular-nums',
          tone === 'destructive' ? 'text-destructive' : 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  );
}
