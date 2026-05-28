import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useImageAnalysis } from '../../hooks/useImageAnalysis';
import { ImageAnalysisStep, IMAGE_ANALYSIS_MODEL } from '../../types';
import { ProductSettingsForm } from './ProductSettingsForm';
import { ImageUploadZone } from './ImageUploadZone';
import { GenerationResult } from './GenerationResult';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StepIndicator, type StepDef } from '@/components/ui/step-indicator';

interface ImageAnalysisFlowProps {
  onBack: () => void;
}

const STEP_DEFS: StepDef<ImageAnalysisStep>[] = [
  { key: ImageAnalysisStep.SETTINGS, label: 'Settings' },
  { key: ImageAnalysisStep.UPLOAD, label: 'Upload' },
  { key: ImageAnalysisStep.PROCESSING, label: 'Processing' },
  { key: ImageAnalysisStep.RESULT, label: 'Result' },
];

export const ImageAnalysisFlow: React.FC<ImageAnalysisFlowProps> = ({ onBack }) => {
  const { anthropicKey } = useApiKeys();

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

  const handleStart = () => {
    if (!anthropicKey) {
      toast.error('Anthropic API Key Missing', {
        description: `This flow uses ${IMAGE_ANALYSIS_MODEL}. Configure your Anthropic key in Settings.`,
      });
      return;
    }
    analyze(anthropicKey);
  };

  return (
    <div className="">
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
            onNext={handleStart}
            onBack={() => setStep(ImageAnalysisStep.SETTINGS)}
          />
          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </div>
      )}

      {step === ImageAnalysisStep.PROCESSING && (
        <section className="">
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
            Running <span className="font-mono">{IMAGE_ANALYSIS_MODEL}</span> on{' '}
            {images.length} {images.length === 1 ? 'image' : 'images'}. Do not close the tab.
          </p>
        </section>
      )}

      {step === ImageAnalysisStep.RESULT && result && (
        <GenerationResult
          result={result}
          tokens={tokens}
          onGenerateAgain={handleStart}
          onReset={reset}
        />
      )}

      {step !== ImageAnalysisStep.PROCESSING && step !== ImageAnalysisStep.RESULT && (
        <div className="mt-6 flex items-center pt-4 border-t border-border">
          {step === ImageAnalysisStep.SETTINGS && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to mode selection
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
