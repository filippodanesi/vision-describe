import React, { useState } from 'react';
import { GenerateSubMode } from './types';
import { SubModeSelector } from './components/SubModeSelector';
import { ImageAnalysisFlow } from './components/ImageAnalysis/ImageAnalysisFlow';
import { CsvTranslationFlow } from './components/CsvTranslation/CsvTranslationFlow';
import { MetadataGenerationFlow } from './components/MetadataGeneration/MetadataGenerationFlow';

export const GenerateMode: React.FC = () => {
  const [subMode, setSubMode] = useState<GenerateSubMode>(GenerateSubMode.SELECT);

  const handleBack = () => setSubMode(GenerateSubMode.SELECT);

  return (
    <div className="animate-in fade-in-0 duration-300 space-y-6">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Generate</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analyze product images, translate CSV content, or generate descriptions
          from product metadata.
        </p>
      </div>

      {subMode === GenerateSubMode.SELECT && (
        <SubModeSelector onSelect={setSubMode} />
      )}

      {subMode === GenerateSubMode.IMAGE_ANALYSIS && (
        <ImageAnalysisFlow onBack={handleBack} />
      )}

      {subMode === GenerateSubMode.CSV_TRANSLATION && (
        <CsvTranslationFlow onBack={handleBack} />
      )}

      {subMode === GenerateSubMode.METADATA_GENERATION && (
        <MetadataGenerationFlow onBack={handleBack} />
      )}
    </div>
  );
};
