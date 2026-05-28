import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { LANGUAGE_MAPPING } from '../../types';

interface LanguageMultiSelectProps {
  selectedLanguages: string[];
  onSelectionChange: (languages: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  summary?: React.ReactNode;
  nextLabel?: string;
}

const TRANSLATION_LANGUAGES = Object.entries(LANGUAGE_MAPPING).filter(
  ([code]) => code !== 'en' && code !== 'pt-PT' && code !== 'pt-BR'
);

export const LanguageMultiSelect: React.FC<LanguageMultiSelectProps> = ({
  selectedLanguages,
  onSelectionChange,
  onNext,
  onBack,
  summary,
  nextLabel = 'Next: Select model',
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
    <section className="">
      <div className="mb-4">
        <p className="label-mono mb-1">Step 03 / Languages</p>
        <h2 className="text-base font-semibold tracking-tightest text-foreground">
          Select target languages
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Choose which languages the product descriptions will be translated into.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-5">
        <Button variant="outline" size="sm" onClick={selectAll}>
          Select all
        </Button>
        <Button variant="outline" size="sm" onClick={deselectAll}>
          Deselect all
        </Button>
        <span className="label-mono-sm ml-auto tabular-nums">
          {selectedLanguages.length} / {TRANSLATION_LANGUAGES.length} selected
        </span>
      </div>

      <div className="border border-border bg-card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5">
          {TRANSLATION_LANGUAGES.map(([code, name]) => (
            <div key={code} className="flex items-center gap-2.5">
              <Checkbox
                id={`lang-${code}`}
                checked={selectedLanguages.includes(code)}
                onCheckedChange={() => toggleLanguage(code)}
              />
              <label
                htmlFor={`lang-${code}`}
                className="text-sm cursor-pointer flex-1 flex items-baseline justify-between gap-2"
              >
                <span className="text-foreground truncate">{name}</span>
                <span className="font-mono text-[10px] uppercase tracking-caps-sm text-muted-foreground/70 shrink-0">
                  {code}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {summary && <div className="mt-4">{summary}</div>}

      <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={selectedLanguages.length === 0}>
          {nextLabel}
        </Button>
      </div>
    </section>
  );
};
