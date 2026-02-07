import React from 'react';
import { Loader2 } from 'lucide-react';
import { useImageAnalysis } from '../../hooks/useImageAnalysis';
import { ImageAnalysisStep } from '../../types';
import { ProductSettingsForm } from './ProductSettingsForm';
import { ImageUploadZone } from './ImageUploadZone';
import { GenerationResult } from './GenerationResult';
import ModelSelector from '@/components/WatsonAnalyzer/components/ModelSelector';
import { ANTHROPIC_API_KEY, OPENAI_API_KEY } from '@/config/env';
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
          <div className="text-center mb-4">
            <h2 className="text-lg font-medium mb-2 tracking-tight">Choose AI Model</h2>
            <p className="text-sm text-muted-foreground">
              Select the model for image analysis
            </p>
          </div>
          <ModelSelector
            onModelSelected={(modelId) => handleModelSelected(modelId)}
            useCase="ecommerce"
            providerFilter="openai"
          />
          {error && (
            <p className="text-sm text-destructive text-center mt-4">{error}</p>
          )}
        </div>
      )}

      {step === ImageAnalysisStep.PROCESSING && (
        <div className="max-w-md mx-auto text-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground tracking-tight">Analyzing images...</h3>
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
