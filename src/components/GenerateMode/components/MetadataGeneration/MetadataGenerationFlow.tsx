import React, { useRef, useMemo, useCallback } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { StepIndicator, type StepDef } from '@/components/ui/step-indicator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useMetadataGeneration } from '../../hooks/useMetadataGeneration';
import { MetadataGenerationStep, METADATA_GENERATION_MODEL } from '../../types';
import { MetadataLanguageMultiSelect } from './MetadataLanguageMultiSelect';
import { GenerationResult } from './GenerationResult';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { toast } from 'sonner';

function SpecRow({
  label,
  value,
  mono = false,
  truncate = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="label-mono-sm shrink-0">{label}</dt>
      <dd
        className={cn(
          'text-foreground text-right min-w-0',
          mono && 'font-mono text-xs tabular-nums',
          truncate && 'truncate',
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

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
    startGeneration(anthropicKey);
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
    <div className="">
      <StepIndicator steps={STEP_DEFS} currentStep={step} />

      {step === MetadataGenerationStep.UPLOAD && (
        <section className="">
          <div className="mb-4">
            <p className="label-mono mb-1">Step 01 / Input</p>
            <h2 className="text-base font-semibold tracking-tightest text-foreground">
              Upload product metadata file
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Excel file with product metadata for new SKUs. AW26 compact and
              B2C standard formats supported; multi-sheet workbooks are read in
              full.
            </p>
          </div>

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
            className="flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-card p-12 cursor-pointer transition-colors hover:border-foreground/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2"
          >
            <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <div className="text-center">
              <p className="label-mono mb-1">Drop file or click to browse</p>
              <p className="text-xs text-muted-foreground font-mono">
                .xlsx · .xls · .xlsm
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={onBack}
              className="label-mono-sm hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2"
            >
              ← Back to mode selection
            </button>
          </div>
        </section>
      )}

      {step === MetadataGenerationStep.FORMAT_DETECT && format && (
        <section className="">
          <div className="mb-4">
            <p className="label-mono mb-1">Step 02 / Detect</p>
            <h2 className="text-base font-semibold tracking-tightest text-foreground">
              File detected
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Confirm the format, scope the queue by brand, and exclude any SKUs
              that should not enter the batch.
            </p>
          </div>

          <dl className="border border-border divide-y divide-border bg-card text-sm">
            <SpecRow label="Format" value={format.type} mono />
            <SpecRow label="Products" value={String(products.length)} mono />
            <SpecRow
              label="Sheets"
              value={format.sheetNames.join(', ')}
              mono
              truncate
            />
            <SpecRow label="File" value={file?.name ?? ''} truncate />
          </dl>

          {brandBreakdown.length > 0 && (
            <div className="mt-6 space-y-5">
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <p className="label-mono">Brand filter</p>
                  <p className="label-mono-sm normal-case tracking-normal">
                    click to include / exclude
                  </p>
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
                        className={cn(
                          'inline-flex items-center border px-2.5 py-1 text-xs font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2',
                          on
                            ? 'border-signal bg-signal/10 text-signal'
                            : 'border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                        )}
                      >
                        <span className={cn(on && 'text-signal')}>{b}</span>
                        <span
                          className={cn(
                            'ml-1.5 tabular-nums',
                            on ? 'text-signal/70' : 'text-muted-foreground/70',
                          )}
                        >
                          × {n}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedBrands.length === 0 && (
                  <p className="mt-2 text-xs text-destructive">
                    Select at least one brand to proceed.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <Label htmlFor="sku-exclusion" className="label-mono">
                    Exclude SKUs
                  </Label>
                  <span className="label-mono-sm normal-case tracking-normal tabular-nums">
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
                <p className="mt-2 text-xs text-muted-foreground">
                  Material Numbers listed here are dropped from the queue after
                  the brand filter.
                </p>
              </div>
            </div>
          )}

          {format.type === 'unknown' && (
            <div className="mt-4 flex items-center gap-2 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              Unknown format — make sure the file has either AW26 compact
              headers or B2C standard headers.
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
            <Button variant="ghost" onClick={() => reset()}>
              Upload different file
            </Button>
            <Button
              onClick={() => setStep(MetadataGenerationStep.LANGUAGES)}
              disabled={products.length === 0 || selectedBrands.length === 0}
            >
              Next: Select languages
              {selectedBrands.length > 0 && queuedProducts.length !== products.length ? (
                <span className="ml-2 font-mono text-xs tabular-nums opacity-70">
                  ({queuedProducts.length}/{products.length})
                </span>
              ) : null}
            </Button>
          </div>
        </section>
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
        <section className="">
          <div className="mb-5">
            <div className="flex items-baseline justify-between gap-4 mb-2">
              <p className="label-mono">
                <span className="status-dot animate-pulse mr-2 align-middle" />
                Processing
              </p>
              <p className="font-mono text-xs tabular-nums text-muted-foreground">
                {progress.current.toString().padStart(3, '0')} /{' '}
                {progress.total.toString().padStart(3, '0')}
              </p>
            </div>
            <h2 className="text-base font-semibold tracking-tightest text-foreground">
              Generating descriptions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Running {METADATA_GENERATION_MODEL} on the queued products. Do
              not close the tab.
            </p>
          </div>

          <Progress
            value={
              progress.total > 0 ? (progress.current / progress.total) * 100 : 0
            }
            className="h-1"
          />

          {logs.length > 0 && (
            <ScrollArea className="h-40 mt-5 border border-border bg-card p-3">
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

          <div className="mt-6 flex flex-col items-start gap-1">
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
        </section>
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
