import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GeneratedProduct } from '../../types';

interface GenerationResultProps {
  results: GeneratedProduct[];
  selectedLanguages: string[];
  onExport: () => Promise<Blob>;
  onReset: () => void;
}

export const GenerationResult: React.FC<GenerationResultProps> = ({
  results,
  selectedLanguages,
  onExport,
  onReset,
}) => {
  const totalDescriptions = results.reduce(
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
      link.download = `metadata-generated_${timestamp}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast('File exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Generation Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Products</span>
              <span className="font-mono font-medium">{results.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Descriptions</span>
              <span className="font-mono font-medium">{totalDescriptions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Errors</span>
              <Badge
                variant="secondary"
                className={`font-mono ${
                  totalErrors > 0
                    ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {totalErrors}
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-center gap-4 pt-4">
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Process Another File
          </Button>
        </CardFooter>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              Preview (first 10 rows)
            </h4>
            <span className="text-xs text-muted-foreground">
              Showing {Math.min(10, results.length)} of {results.length} products
            </span>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-medium text-foreground text-xs">
                      Material No
                    </TableHead>
                    <TableHead className="font-medium text-foreground text-xs">
                      Product
                    </TableHead>
                    <TableHead className="font-medium text-foreground text-xs">
                      Brand
                    </TableHead>
                    {selectedLanguages.slice(0, 3).map((lang) => (
                      <TableHead
                        key={lang}
                        className="font-medium text-foreground text-xs"
                      >
                        {lang.toUpperCase()}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.slice(0, 10).map((r, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.product.materialNumber}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {r.product.productName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.product.brand}
                      </TableCell>
                      {selectedLanguages.slice(0, 3).map((lang) => (
                        <TableCell
                          key={lang}
                          className="text-xs text-muted-foreground max-w-[200px]"
                        >
                          <div className="truncate">
                            {r.translations[lang]
                              ? r.translations[lang]
                                  .replace(/<[^>]+>/g, ' ')
                                  .substring(0, 80) + '…'
                              : r.errors?.find((e) => e.startsWith(lang))
                              ? '(error)'
                              : '—'}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
