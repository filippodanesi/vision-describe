import React, { useState } from 'react';
import { GenerateSubMode } from './types';
import { SubModeSelector } from './components/SubModeSelector';
import { ImageAnalysisFlow } from './components/ImageAnalysis/ImageAnalysisFlow';
import { CsvTranslationFlow } from './components/CsvTranslation/CsvTranslationFlow';
import { MetadataGenerationFlow } from './components/MetadataGeneration/MetadataGenerationFlow';
import { PageHeader } from '@/components/ui/page-header';

const SUB_MODE_LABELS: Record<GenerateSubMode, string> = {
  [GenerateSubMode.SELECT]: '',
  [GenerateSubMode.IMAGE_ANALYSIS]: 'Image Analysis',
  [GenerateSubMode.CSV_TRANSLATION]: 'CSV Translation',
  [GenerateSubMode.METADATA_GENERATION]: 'Metadata Generation',
};

export const GenerateMode: React.FC = () => {
  const [subMode, setSubMode] = useState<GenerateSubMode>(GenerateSubMode.SELECT);

  const handleBack = () => setSubMode(GenerateSubMode.SELECT);

  const activeSubLabel = SUB_MODE_LABELS[subMode];
  const title = activeSubLabel ? `Generate / ${activeSubLabel}` : 'Generate';
  const description =
    subMode === GenerateSubMode.SELECT
      ? 'Analyze product images, translate CSV content, or generate descriptions from product metadata.'
      : undefined;

  return (
    <div className="animate-in fade-in-0 duration-300">
      <PageHeader
        index="GEN"
        title={title}
        description={description}
        status={{ label: 'Ready' }}
      />

      <div className="space-y-6">
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
    </div>
  );
};
