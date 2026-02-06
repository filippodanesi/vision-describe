import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { LANGUAGE_MAPPING } from '../../types';

interface LanguageMultiSelectProps {
  selectedLanguages: string[];
  onSelectionChange: (languages: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const TRANSLATION_LANGUAGES = Object.entries(LANGUAGE_MAPPING).filter(
  ([code]) => code !== 'en' && code !== 'pt-PT' && code !== 'pt-BR'
);

export const LanguageMultiSelect: React.FC<LanguageMultiSelectProps> = ({
  selectedLanguages,
  onSelectionChange,
  onNext,
  onBack,
}) => {
  const toggleLanguage = (code: string) => {
    onSelectionChange(
      selectedLanguages.includes(code)
        ? selectedLanguages.filter(l => l !== code)
        : [...selectedLanguages, code]
    );
  };

  const selectAll = () => {
    onSelectionChange(TRANSLATION_LANGUAGES.map(([code]) => code));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Select Target Languages</CardTitle>
        <CardDescription>
          Choose which languages to translate the product descriptions into
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Deselect All
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">
            {selectedLanguages.length} selected
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {TRANSLATION_LANGUAGES.map(([code, name]) => (
            <div key={code} className="flex items-center space-x-2">
              <Checkbox
                id={`lang-${code}`}
                checked={selectedLanguages.includes(code)}
                onCheckedChange={() => toggleLanguage(code)}
              />
              <label
                htmlFor={`lang-${code}`}
                className="text-sm cursor-pointer"
              >
                {name}
              </label>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={onBack}>Back</Button>
          <Button onClick={onNext} disabled={selectedLanguages.length === 0}>
            Next: Select Model
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
