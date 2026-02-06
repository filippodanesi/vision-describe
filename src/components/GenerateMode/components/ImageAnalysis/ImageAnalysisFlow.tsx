import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useImageAnalysis } from '../../hooks/useImageAnalysis';
import { ImageAnalysisStep } from '../../types';
import { ProductSettingsForm } from './ProductSettingsForm';
import { ImageUploadZone } from './ImageUploadZone';
import { GenerationResult } from './GenerationResult';
import ModelSelector from '@/components/WatsonAnalyzer/components/ModelSelector';
import { ANTHROPIC_API_KEY, OPENAI_API_KEY } from '@/config/env';
import { toast } from 'sonner';

interface ImageAnalysisFlowProps {
  onBack: () => void;
}

const STEP_DEFS = [
  { key: ImageAnalysisStep.SETTINGS, label: 'Settings' },
  { key: ImageAnalysisStep.UPLOAD, label: 'Upload' },
  { key: ImageAnalysisStep.MODEL, label: 'Model' },
  { key: ImageAnalysisStep.PROCESSING, label: 'Processing' },
  { key: ImageAnalysisStep.RESULT, label: 'Result' },
];

const StepIndicator: React.FC<{ currentStep: ImageAnalysisStep }> = ({ currentStep }) => {
  const currentIndex = STEP_DEFS.findIndex(s => s.key === currentStep);
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {STEP_DEFS.map((step, idx) => {
        const isPast = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        return (
          <React.Fragment key={step.key}>
            {idx > 0 && (
              <div className={`h-px w-8 sm:w-12 ${isPast ? 'bg-primary' : 'bg-border'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              {isPast ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  isCurrent ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                }`}>
                  {isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
              )}
              <span className={`text-[10px] font-medium ${
                isCurrent ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const ImageAnalysisFlow: React.FC<ImageAnalysisFlowProps> = ({ onBack }) => {
  const {
    step,
    setStep,
    settings,
    setSettings,
    images,
    addImages,
    removeImage,
    result,
    tokens,
    isProcessing,
    error,
    analyze,
    reset,
  } = useImageAnalysis();

  const handleModelSelected = (modelId: string) => {
    const isAnthropic = modelId.startsWith('claude');
    const apiKey = isAnthropic ? ANTHROPIC_API_KEY : OPENAI_API_KEY;

    if (!apiKey) {
      toast('API Key Missing', {
        description: `Missing ${isAnthropic ? 'VITE_ANTHROPIC_API_KEY' : 'VITE_OPENAI_API_KEY'} in your environment.`,
        style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' },
      });
      return;
    }

    analyze(modelId, apiKey);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator currentStep={step} />

      {step === ImageAnalysisStep.SETTINGS && (
        <ProductSettingsForm
          settings={settings}
          onSettingsChange={setSettings}
          onNext={() => setStep(ImageAnalysisStep.UPLOAD)}
        />
      )}

      {step === ImageAnalysisStep.UPLOAD && (
        <ImageUploadZone
          images={images}
          onAddImages={addImages}
          onRemoveImage={removeImage}
          onNext={() => setStep(ImageAnalysisStep.MODEL)}
          onBack={() => setStep(ImageAnalysisStep.SETTINGS)}
        />
      )}

      {step === ImageAnalysisStep.MODEL && (
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-lg font-medium mb-2">Choose AI Model</h2>
            <p className="text-sm text-muted-foreground">
              Select the model for image analysis
            </p>
          </div>
          <ModelSelector
            onModelSelected={(modelId) => handleModelSelected(modelId)}
            useCase="ecommerce"
          />
          {error && (
            <p className="text-sm text-destructive text-center mt-4">{error}</p>
          )}
        </div>
      )}

      {step === ImageAnalysisStep.PROCESSING && (
        <div className="max-w-md mx-auto text-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">Analyzing images...</h3>
          <p className="text-sm text-muted-foreground mt-1">
            This may take 30-60 seconds depending on the model
          </p>
        </div>
      )}

      {step === ImageAnalysisStep.RESULT && result && (
        <GenerationResult
          result={result}
          tokens={tokens}
          onGenerateAgain={() => setStep(ImageAnalysisStep.MODEL)}
          onReset={reset}
        />
      )}

      {step !== ImageAnalysisStep.PROCESSING && step !== ImageAnalysisStep.RESULT && (
        <div className="mt-6 flex items-center pt-4 border-t border-border">
          <button
            onClick={step === ImageAnalysisStep.SETTINGS ? onBack : undefined}
            className={`text-sm text-muted-foreground hover:text-foreground transition-colors ${
              step !== ImageAnalysisStep.SETTINGS ? 'invisible' : ''
            }`}
          >
            ← Back to mode selection
          </button>
        </div>
      )}
    </div>
  );
};
