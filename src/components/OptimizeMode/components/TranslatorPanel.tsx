import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Palette, Ruler, ArrowLeft, ArrowRight } from 'lucide-react';
import { ColorTranslatorTab } from './ColorTranslatorTab';
import { SizeTranslatorTab } from './SizeTranslatorTab';
import { type ColorMapping } from '../utils/translations/colorTranslations';
import { type SizeMapping } from '../utils/translations/sizeTranslations';

interface TranslatorPanelProps {
  useCase: 'aboutyou' | 'next';
  colorMappings: ColorMapping[];
  onColorMappingsChange: (mappings: ColorMapping[]) => void;
  sizeMappings?: SizeMapping[];
  onSizeMappingsChange?: (mappings: SizeMapping[]) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const TranslatorPanel: React.FC<TranslatorPanelProps> = ({
  useCase,
  colorMappings,
  onColorMappingsChange,
  sizeMappings,
  onSizeMappingsChange,
  onConfirm,
  onBack,
}) => {
  const isNext = useCase === 'next';
  const defaultTab = 'colors';

  return (
    <section className="">
      <div className="mb-5">
        <p className="label-mono mb-1">Step 03 / Translations</p>
        <h2 className="text-base font-semibold tracking-tightest text-foreground">
          Review translations
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Adjust color{isNext ? ' and size' : ''} translations before processing. These
          mappings are applied deterministically to your data.
        </p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="colors" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" aria-hidden="true" />
            Color translation
          </TabsTrigger>
          {isNext && (
            <TabsTrigger value="sizes" className="gap-1.5">
              <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
              Size translation (EU → GB)
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="colors" className="mt-4">
          <ColorTranslatorTab
            mappings={colorMappings}
            onChange={onColorMappingsChange}
          />
        </TabsContent>

        {isNext && sizeMappings && onSizeMappingsChange && (
          <TabsContent value="sizes" className="mt-4">
            <SizeTranslatorTab
              mappings={sizeMappings}
              onChange={onSizeMappingsChange}
            />
          </TabsContent>
        )}
      </Tabs>

      <div className="flex justify-between pt-6 mt-6 border-t border-border">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
        <Button onClick={onConfirm}>
          Confirm &amp; continue
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </div>
    </section>
  );
};
