import React from 'react';
import { useImageAnalysis } from '../../hooks/useImageAnalysis';
import { ImageAnalysisStep } from '../../types';
import { ProductSettingsForm } from './ProductSettingsForm';
import { ImageUploadZone } from './ImageUploadZone';
import { GenerationResult } from './GenerationResult';
import ModelSelector from '@/components/OptimizeMode/components/ModelSelector';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { toast } from 'sonner';
import { StepIndicator, type StepDef } from '@/components/ui/step-indicator';

interface ImageAnalysisFlowProps {
  onBack: () => void;
}

const STEP_DEFS: StepDef<ImageAnalysisStep>[] = [
  { key: ImageAnalysisStep.SETTINGS, label: 'Settings' },
  { key: ImageAnalysisStep.UPLOAD, label: 'Upload' },
  { key: ImageAnalysisStep.MODEL, label: 'Model' },
  { key: ImageAnalysisStep.PROCESSING, label: 'Processing' },
  { key: ImageAnalysisStep.RESULT, label: 'Result' },
];

export const ImageAnalysisFlow: React.FC<ImageAnalysisFlowProps> = ({ onBack }) => {
  const { openaiKey, anthropicKey } = useApiKeys();

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
    const apiKey = isAnthropic ? anthropicKey : openaiKey;

    if (!apiKey) {
      toast.error('API Key Missing', {
        description: 'Configure your API keys in Settings before processing.'
      });
      return;
    }

    analyze(modelId, apiKey);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator steps={STEP_DEFS} currentStep={step} />

      {step === ImageAnalysisStep.SETTINGS && (
        <div className="animate-fade-in">
          <ProductSettingsForm
            settings={settings}
            onSettingsChange={setSettings}
            onNext={() => setStep(ImageAnalysisStep.UPLOAD)}
          />
        </div>
      )}

      {step === ImageAnalysisStep.UPLOAD && (
        <div className="animate-fade-in">
          <ImageUploadZone
            images={images}
            onAddImages={addImages}
            onRemoveImage={removeImage}
            onNext={() => setStep(ImageAnalysisStep.MODEL)}
            onBack={() => setStep(ImageAnalysisStep.SETTINGS)}
          />
        </div>
      )}

      {step === ImageAnalysisStep.MODEL && (
        <div className="max-w-3xl mx-auto animate-fade-in">
          <div className="mb-4">
            <p className="label-mono mb-1">Step 03 / Model</p>
            <h2 className="text-base font-semibold tracking-tightest text-foreground">
              Choose AI model
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select the vision-capable model for image analysis.
            </p>
          </div>
          <ModelSelector
            onModelSelected={(modelId) => handleModelSelected(modelId)}
            useCase="ecommerce"
            providerFilter="openai"
          />
          {error && (
            <p className="text-sm text-destructive mt-4">{error}</p>
          )}
        </div>
      )}

      {step === ImageAnalysisStep.PROCESSING && (
        <section className="max-w-xl mx-auto">
          <div className="mb-2">
            <p className="label-mono">
              <span className="status-dot animate-pulse mr-2 align-middle" />
              Processing
            </p>
          </div>
          <h2 className="text-base font-semibold tracking-tightest text-foreground">
            Analyzing images
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This may take 30-60 seconds depending on the model. Do not close
            the tab.
          </p>
        </section>
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
