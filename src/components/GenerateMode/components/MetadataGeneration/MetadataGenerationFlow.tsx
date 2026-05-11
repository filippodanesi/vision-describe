import React, { useRef, useMemo, useCallback } from 'react';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { StepIndicator, type StepDef } from '@/components/ui/step-indicator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMetadataGeneration } from '../../hooks/useMetadataGeneration';
import { MetadataGenerationStep, METADATA_GENERATION_MODEL } from '../../types';
import { MetadataLanguageMultiSelect } from './MetadataLanguageMultiSelect';
import { GenerationResult } from './GenerationResult';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { toast } from 'sonner';

interface MetadataGenerationFlowProps {
  onBack: () => void;
}

const STEP_DEFS: StepDef<MetadataGenerationStep>[] = [
  { key: MetadataGenerationStep.UPLOAD, label: 'Upload' },
  { key: MetadataGenerationStep.FORMAT_DETECT, label: 'Detect' },
  { key: MetadataGenerationStep.LANGUAGES, label: 'Languages' },
  { key: MetadataGenerationStep.PROCESSING, label: 'Processing' },
  { key: MetadataGenerationStep.RESULT, label: 'Result' },
];

export const MetadataGenerationFlow: React.FC<MetadataGenerationFlowProps> = ({
  onBack,
}) => {
  const { anthropicKey } = useApiKeys();

  const {
    step,
    setStep,
    file,
    products,
    queuedProducts,
    selectedBrands,
    setSelectedBrands,
    exclusionInput,
    setExclusionInput,
    excludedSkus,
    format,
    selectedLanguages,
    setSelectedLanguages,
    isProcessing,
    progress,
    logs,
    results,
    error,
    parseFile,
    startGeneration,
    cancelGeneration,
    exportResults,
    reset,
  } = useMetadataGeneration();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const f = e.target.files?.[0];
    if (f) await parseFile(f);
  };

  const handleDrop: React.DragEventHandler = async (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) await parseFile(f);
  };

  const handleStart = () => {
    if (!anthropicKey) {
      toast.error('Anthropic API Key Missing', {
        description: `This flow uses ${METADATA_GENERATION_MODEL}. Configure your Anthropic key in Settings.`,
      });
      return;
    }
    startGeneration(METADATA_GENERATION_MODEL, anthropicKey);
  };

  const brandBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const b = (p.brand || 'unknown').trim();
      counts.set(b, (counts.get(b) || 0) + 1);
    }
    return Array.from(counts.entries());
  }, [products]);

  const opsPerProduct =
    selectedLanguages.length === 0
      ? 0
      : selectedLanguages.includes('en')
      ? selectedLanguages.length
      : selectedLanguages.length + 1;

  const toggleBrand = useCallback(
    (brand: string) => {
      setSelectedBrands((prev) =>
        prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
      );
    },
    [setSelectedBrands]
  );

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleDropZoneKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (
    e
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator steps={STEP_DEFS} currentStep={step} />

      {step === MetadataGenerationStep.UPLOAD && (
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Upload Product Metadata File</CardTitle>
            <CardDescription>
              Excel file with product metadata for new SKUs. AW26 compact and
              B2C standard formats supported; multi-sheet workbooks are read in
              full.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept=".xlsx,.xls,.xlsm"
              className="hidden"
              ref={inputRef}
              onChange={handleFileChange}
            />

            <div
              role="button"
              tabIndex={0}
              aria-label="Drag and drop product metadata file or click to browse"
              onClick={openFilePicker}
              onKeyDown={handleDropZoneKeyDown}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed p-10 cursor-pointer transition-colors border-muted-foreground/25 hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Drag & drop or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  .xlsx / .xls / .xlsm
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              >
                ← Back to mode selection
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === MetadataGenerationStep.FORMAT_DETECT && format && (
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>File Detected</CardTitle>
            <CardDescription>
              Format and products recognised from your file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format</span>
                <span className="font-mono text-xs">{format.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Products</span>
                <span className="font-mono">{products.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sheets</span>
                <span className="font-mono text-xs text-right truncate max-w-[200px]">
                  {format.sheetNames.join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">File</span>
                <span className="text-xs truncate max-w-[200px]">
                  {file?.name}
                </span>
              </div>
            </div>

            {brandBreakdown.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Brands</span>
                  <span className="text-xs text-muted-foreground">
                    click to include / exclude
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {brandBreakdown.map(([b, n]) => {
                    const on = selectedBrands.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${b}, ${n} products, ${on ? 'included' : 'excluded'}`}
                        onClick={() => toggleBrand(b)}
                        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          on
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                        }`}
                      >
                        {b}
                        <span
                          className={`ml-1.5 ${
                            on
                              ? 'text-background/70'
                              : 'text-muted-foreground'
                          }`}
                        >
                          × {n}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedBrands.length === 0 && (
                  <p className="text-xs text-destructive">
                    Select at least one brand to proceed.
                  </p>
                )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <Label
                      htmlFor="sku-exclusion"
                      className="text-sm text-muted-foreground font-normal"
                    >
                      Exclude SKUs
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {excludedSkus.length > 0
                        ? `${excludedSkus.length} excluded`
                        : 'optional'}
                    </span>
                  </div>
                  <Textarea
                    id="sku-exclusion"
                    value={exclusionInput}
                    onChange={(e) => setExclusionInput(e.target.value)}
                    placeholder="e.g. 10228663, 10228693, 10228698 — separated by comma, space or newline"
                    rows={2}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Material Numbers listed here are dropped from the queue
                    after the brand filter.
                  </p>
                </div>
              </div>
            )}

            {format.type === 'unknown' && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                Unknown format — make sure the file has either AW26 compact
                headers or B2C standard headers.
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => reset()}>
                Upload Different File
              </Button>
              <Button
                onClick={() => setStep(MetadataGenerationStep.LANGUAGES)}
                disabled={products.length === 0 || selectedBrands.length === 0}
              >
                Next: Select Languages
                {selectedBrands.length > 0 && queuedProducts.length !== products.length ? (
                  <span className="ml-2 font-mono text-xs opacity-70">
                    ({queuedProducts.length}/{products.length})
                  </span>
                ) : null}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === MetadataGenerationStep.LANGUAGES && (
        <MetadataLanguageMultiSelect
          selectedLanguages={selectedLanguages}
          onSelectionChange={setSelectedLanguages}
          onNext={handleStart}
          onBack={() => setStep(MetadataGenerationStep.FORMAT_DETECT)}
          summary={
            <p className="text-xs text-muted-foreground text-center">
              {queuedProducts.length} products × {opsPerProduct} ={' '}
              <span className="font-mono">
                {queuedProducts.length * opsPerProduct}
              </span>{' '}
              calls on{' '}
              <span className="font-mono">{METADATA_GENERATION_MODEL}</span>
            </p>
          }
          nextLabel="Start generation"
        />
      )}

      {step === MetadataGenerationStep.PROCESSING && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">
              Generating…
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {progress.current} / {progress.total} operations completed
            </p>
          </div>

          <Progress
            value={
              progress.total > 0 ? (progress.current / progress.total) * 100 : 0
            }
          />

          {logs.length > 0 && (
            <ScrollArea className="h-40 rounded-md border p-3">
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <p
                    key={i}
                    className="text-xs text-muted-foreground font-mono"
                  >
                    {log}
                  </p>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="flex flex-col items-center gap-1">
            <Button
              variant="destructive"
              size="sm"
              onClick={cancelGeneration}
              disabled={!isProcessing}
            >
              Cancel & abort in-flight calls
            </Button>
            <p className="text-xs text-muted-foreground">
              Aborts all pending API calls immediately. Partial results are kept.
            </p>
          </div>
        </div>
      )}

      {step === MetadataGenerationStep.RESULT && (
        <GenerationResult
          results={results}
          selectedLanguages={selectedLanguages}
          onExport={exportResults}
          onReset={reset}
        />
      )}
    </div>
  );
};
