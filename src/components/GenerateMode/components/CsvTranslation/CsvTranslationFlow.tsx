import React, { useRef } from 'react';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { StepIndicator, type StepDef } from '@/components/ui/step-indicator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCsvTranslation } from '../../hooks/useCsvTranslation';
import { CsvTranslationStep } from '../../types';
import { LanguageMultiSelect } from './LanguageMultiSelect';
import { TranslationResult } from './TranslationResult';
import ModelSelector from '@/components/OptimizeMode/components/ModelSelector';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { toast } from 'sonner';

interface CsvTranslationFlowProps {
  onBack: () => void;
}

const STEP_DEFS: StepDef<CsvTranslationStep>[] = [
  { key: CsvTranslationStep.UPLOAD, label: 'Upload' },
  { key: CsvTranslationStep.FORMAT_DETECT, label: 'Format' },
  { key: CsvTranslationStep.LANGUAGES, label: 'Languages' },
  { key: CsvTranslationStep.MODEL, label: 'Model' },
  { key: CsvTranslationStep.PROCESSING, label: 'Processing' },
  { key: CsvTranslationStep.RESULT, label: 'Result' },
];

export const CsvTranslationFlow: React.FC<CsvTranslationFlowProps> = ({ onBack }) => {
  const { openaiKey, anthropicKey } = useApiKeys();

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

  const handleModelSelected = (modelId: string) => {
    const isAnthropic = modelId.startsWith('claude');
    const apiKey = isAnthropic ? anthropicKey : openaiKey;

    if (!apiKey) {
      toast('API Key Missing', {
        description: 'Configure your API keys in Settings before processing.',
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' },
      });
      return;
    }

    startTranslation(modelId, apiKey);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator steps={STEP_DEFS} currentStep={step} />

      {step === CsvTranslationStep.UPLOAD && (
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>Upload Product File</CardTitle>
            <CardDescription>
              Upload a CSV, Excel, or HTML file with product descriptions to translate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm,.html,.htm"
              className="hidden"
              ref={inputRef}
              onChange={handleFileChange}
            />

            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 cursor-pointer transition-colors border-muted-foreground/25 hover:border-muted-foreground/40"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Drag & drop or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports Triumph, Sloggi, and Beldona formats
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
                onClick={onBack}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to mode selection
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === CsvTranslationStep.FORMAT_DETECT && format && (
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>File Detected</CardTitle>
            <CardDescription>
              Format and products recognized from your file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format</span>
                <Badge variant="secondary" className="capitalize">{format.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Products</span>
                <span className="font-mono font-normal">{products.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">File</span>
                <span className="text-xs truncate max-w-[150px]">{file?.name}</span>
              </div>
            </div>

            {format.type === 'unknown' && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                Unknown format — some features may not work correctly
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => { reset(); }}>
                Upload Different File
              </Button>
              <Button onClick={() => setStep(CsvTranslationStep.LANGUAGES)} disabled={products.length === 0}>
                Next: Select Languages
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === CsvTranslationStep.LANGUAGES && (
        <LanguageMultiSelect
          selectedLanguages={selectedLanguages}
          onSelectionChange={setSelectedLanguages}
          onNext={() => setStep(CsvTranslationStep.MODEL)}
          onBack={() => setStep(CsvTranslationStep.FORMAT_DETECT)}
        />
      )}

      {step === CsvTranslationStep.MODEL && (
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-lg font-medium mb-2 tracking-tight">Choose AI Model</h2>
            <p className="text-sm text-muted-foreground">
              {products.length} products × {selectedLanguages.length} languages = {products.length * selectedLanguages.length} translations
            </p>
          </div>
          <ModelSelector
            onModelSelected={(modelId) => handleModelSelected(modelId)}
            useCase="ecommerce"
          />
        </div>
      )}

      {step === CsvTranslationStep.PROCESSING && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">Translating...</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {progress.current} / {progress.total} translations completed
            </p>
          </div>

          <Progress
            value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
          />

          {logs.length > 0 && (
            <ScrollArea className="h-40 rounded-md border p-3">
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <p key={i} className="text-xs text-muted-foreground font-mono">{log}</p>
                ))}
              </div>
            </ScrollArea>
          )}

          <div className="text-center">
            <Button variant="outline" size="sm" onClick={cancelTranslation}>
              Cancel
            </Button>
          </div>
        </div>
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
