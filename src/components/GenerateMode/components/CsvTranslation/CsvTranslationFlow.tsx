import React, { useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { StepIndicator, type StepDef } from '@/components/ui/step-indicator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useCsvTranslation } from '../../hooks/useCsvTranslation';
import { CsvTranslationStep, CSV_TRANSLATION_MODEL } from '../../types';
import { LanguageMultiSelect } from './LanguageMultiSelect';
import { TranslationResult } from './TranslationResult';
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

interface CsvTranslationFlowProps {
  onBack: () => void;
}

const STEP_DEFS: StepDef<CsvTranslationStep>[] = [
  { key: CsvTranslationStep.UPLOAD, label: 'Upload' },
  { key: CsvTranslationStep.FORMAT_DETECT, label: 'Format' },
  { key: CsvTranslationStep.LANGUAGES, label: 'Languages' },
  { key: CsvTranslationStep.PROCESSING, label: 'Processing' },
  { key: CsvTranslationStep.RESULT, label: 'Result' },
];

export const CsvTranslationFlow: React.FC<CsvTranslationFlowProps> = ({ onBack }) => {
  const { anthropicKey } = useApiKeys();

  const {
    step,
    setStep,
    file,
    products,
    format,
    selectedLanguages,
    setSelectedLanguages,
    isProcessing,
    progress,
    logs,
    results,
    error,
    parseFile,
    startTranslation,
    cancelTranslation,
    exportResults,
    reset,
  } = useCsvTranslation();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
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
        description: `This flow uses ${CSV_TRANSLATION_MODEL}. Configure your Anthropic key in Settings.`,
      });
      return;
    }
    startTranslation(anthropicKey);
  };

  return (
    <div className="">
      <StepIndicator steps={STEP_DEFS} currentStep={step} />

      {step === CsvTranslationStep.UPLOAD && (
        <section className="">
          <div className="mb-4">
            <p className="label-mono mb-1">Step 01 / Input</p>
            <h2 className="text-base font-semibold tracking-tightest text-foreground">
              Upload product file
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              CSV, Excel or HTML file with product descriptions to translate.
              Triumph, sloggi and Beldona formats are auto-detected.
            </p>
          </div>

          <input
            type="file"
            accept=".csv,.xlsx,.xls,.xlsm,.html,.htm"
            className="hidden"
            ref={inputRef}
            onChange={handleFileChange}
          />

          <div
            role="button"
            tabIndex={0}
            aria-label="Drag and drop product file or click to browse"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-card p-12 cursor-pointer transition-colors hover:border-foreground/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2"
          >
            <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            <div className="text-center">
              <p className="label-mono mb-1">Drop file or click to browse</p>
              <p className="text-xs text-muted-foreground font-mono">
                .csv · .xlsx · .xls · .html
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

      {step === CsvTranslationStep.FORMAT_DETECT && format && (
        <section className="">
          <div className="mb-4">
            <p className="label-mono mb-1">Step 02 / Detect</p>
            <h2 className="text-base font-semibold tracking-tightest text-foreground">
              File detected
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Confirm the format before queuing translations.
            </p>
          </div>

          <dl className="border border-border divide-y divide-border bg-card text-sm">
            <SpecRow label="Format" value={format.type} mono />
            <SpecRow label="Products" value={String(products.length)} mono />
            <SpecRow label="File" value={file?.name ?? ''} truncate />
          </dl>

          {format.type === 'unknown' && (
            <div className="mt-4 flex items-center gap-2 border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              Unknown format: some features may not work correctly.
            </div>
          )}

          <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
            <Button variant="ghost" onClick={() => { reset(); }}>
              Upload different file
            </Button>
            <Button onClick={() => setStep(CsvTranslationStep.LANGUAGES)} disabled={products.length === 0}>
              Next: Select languages
            </Button>
          </div>
        </section>
      )}

      {step === CsvTranslationStep.LANGUAGES && (
        <LanguageMultiSelect
          selectedLanguages={selectedLanguages}
          onSelectionChange={setSelectedLanguages}
          onNext={handleStart}
          onBack={() => setStep(CsvTranslationStep.FORMAT_DETECT)}
          nextLabel="Start translation"
          summary={
            <p className="label-mono-sm normal-case tracking-normal text-center tabular-nums">
              {products.length} products × {selectedLanguages.length} languages ={' '}
              <span className="font-mono text-foreground">
                {products.length * selectedLanguages.length}
              </span>{' '}
              translations on{' '}
              <span className="font-mono text-foreground">{CSV_TRANSLATION_MODEL}</span>
            </p>
          }
        />
      )}

      {step === CsvTranslationStep.PROCESSING && (
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
              Translating
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Do not close the tab while translations are in progress.
            </p>
          </div>

          <Progress
            value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
            className="h-1"
          />

          {logs.length > 0 && (
            <ScrollArea className="h-40 mt-5 border border-border bg-card p-3">
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <p key={i} className="text-xs text-muted-foreground font-mono">{log}</p>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="mt-6">
            <Button variant="destructive" size="sm" onClick={cancelTranslation}>
              Cancel translation
            </Button>
          </div>
        </section>
      )}

      {step === CsvTranslationStep.RESULT && (
        <TranslationResult
          results={results}
          selectedLanguages={selectedLanguages}
          onExport={exportResults}
          onReset={reset}
        />
      )}
    </div>
  );
};
