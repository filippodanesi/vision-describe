import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { INRIVER_LANGUAGES } from '../../types';

interface MetadataLanguageMultiSelectProps {
  selectedLanguages: string[];
  onSelectionChange: (languages: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  summary?: React.ReactNode;
  nextLabel?: string;
}

export const MetadataLanguageMultiSelect: React.FC<MetadataLanguageMultiSelectProps> = ({
  selectedLanguages,
  onSelectionChange,
  onNext,
  onBack,
  summary,
  nextLabel = 'Next: Select Model',
}) => {
  const toggleLanguage = (code: string) => {
    onSelectionChange(
      selectedLanguages.includes(code)
        ? selectedLanguages.filter((l) => l !== code)
        : [...selectedLanguages, code]
    );
  };

  const selectAll = () =>
    onSelectionChange(INRIVER_LANGUAGES.map((l) => l.code));
  const deselectAll = () => onSelectionChange([]);
  const enOnly = () => onSelectionChange(['en']);

  const enSelected = selectedLanguages.includes('en');

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Select Output Languages</CardTitle>
        <CardDescription>
          English is generated first as the master, the other locales are
          localised from it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All (12)
          </Button>
          <Button variant="outline" size="sm" onClick={enOnly}>
            EN Master Only
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Deselect All
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">
            {selectedLanguages.length} selected
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {INRIVER_LANGUAGES.map(({ code, name }) => (
            <div key={code} className="flex items-center space-x-2">
              <Checkbox
                id={`metadata-lang-${code}`}
                checked={selectedLanguages.includes(code)}
                onCheckedChange={() => toggleLanguage(code)}
              />
              <label
                htmlFor={`metadata-lang-${code}`}
                className="text-sm cursor-pointer"
              >
                {name} <span className="text-xs text-muted-foreground">({code})</span>
              </label>
            </div>
          ))}
        </div>

        {!enSelected && (
          <p className="text-xs text-muted-foreground">
            English will be generated as an intermediate master and discarded.
          </p>
        )}

        {summary && <div className="pt-1">{summary}</div>}

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} disabled={selectedLanguages.length === 0}>
            {nextLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
