import { useState, useCallback } from 'react';
import type { ImageFile, ProductSettings, VisionApiResponse } from '../types';
import { ImageAnalysisStep, IMAGE_ANALYSIS_MODEL } from '../types';
import { IMAGE_ANALYSIS_PROMPT } from '../prompts/imageAnalysisPrompt';
import { analyzeWithClaude } from '../utils/visionApiUtils';

export function useImageAnalysis() {
  const [step, setStep] = useState<ImageAnalysisStep>(ImageAnalysisStep.SETTINGS);
  const [settings, setSettings] = useState<ProductSettings>({
    language: 'uk',
    category: '',
    certifications: '',
  });
  const [images, setImages] = useState<ImageFile[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [tokens, setTokens] = useState<{ input: number; output: number }>({ input: 0, output: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (apiKey: string) => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setStep(ImageAnalysisStep.PROCESSING);

    try {
      const prompt = images.length > 1
        ? IMAGE_ANALYSIS_PROMPT.MULTIPLE_IMAGES(
            images.length,
            settings.category,
            settings.language,
            settings.certifications
          )
        : IMAGE_ANALYSIS_PROMPT.SINGLE_IMAGE(
            settings.category,
            settings.language,
            settings.certifications
          );

      const response: VisionApiResponse = await analyzeWithClaude(
        prompt,
        images,
        apiKey,
        IMAGE_ANALYSIS_MODEL,
      );

      setResult(response.content);
      setTokens({ input: response.tokens.inputTokens, output: response.tokens.outputTokens });
      setStep(ImageAnalysisStep.RESULT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      // Drop back to the upload step so the user can retry without losing
      // the images already in memory.
      setStep(ImageAnalysisStep.UPLOAD);
    } finally {
      setIsProcessing(false);
    }
  }, [images, settings]);

  const reset = useCallback(() => {
    setStep(ImageAnalysisStep.SETTINGS);
    setSettings({ language: 'uk', category: '', certifications: '' });
    setImages([]);
    setResult(null);
    setTokens({ input: 0, output: 0 });
    setError(null);
  }, []);

  const addImages = useCallback((newImages: ImageFile[]) => {
    setImages(prev => [...prev, ...newImages].slice(0, 10));
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
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
  };
}
