import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Review Translations
        </CardTitle>
        <CardDescription>
          Review and adjust color{isNext ? ' and size' : ''} translations before processing.
          These mappings will be applied deterministically to your data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value="colors" className="gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Color Translation
            </TabsTrigger>
            {isNext && (
              <TabsTrigger value="sizes" className="gap-1.5">
                <Ruler className="h-3.5 w-3.5" />
                Size Translation (EU → GB)
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

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <Button onClick={onConfirm}>
            Confirm & Continue
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
