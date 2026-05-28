import React from 'react';
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
    <section>
      <div className="mb-4">
        <p className="label-mono mb-1">Step 03 / Languages</p>
        <h2 className="text-base font-semibold tracking-tightest text-foreground">
          Select output languages
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          English is generated first as the master, the other locales are
          localised from it.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-5">
        <Button variant="outline" size="sm" onClick={selectAll}>
          Select all (12)
        </Button>
        <Button variant="outline" size="sm" onClick={enOnly}>
          EN master only
        </Button>
        <Button variant="outline" size="sm" onClick={deselectAll}>
          Deselect all
        </Button>
        <span className="label-mono-sm ml-auto tabular-nums">
          {selectedLanguages.length} / 12 selected
        </span>
      </div>

      <div className="border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          {INRIVER_LANGUAGES.map(({ code, name }) => (
            <div key={code} className="flex items-center gap-2.5">
              <Checkbox
                id={`metadata-lang-${code}`}
                checked={selectedLanguages.includes(code)}
                onCheckedChange={() => toggleLanguage(code)}
              />
              <label
                htmlFor={`metadata-lang-${code}`}
                className="text-sm cursor-pointer flex-1 flex items-baseline justify-between gap-2"
              >
                <span className="text-foreground">{name}</span>
                <span className="font-mono text-[10px] uppercase tracking-caps-sm text-muted-foreground/70">
                  {code}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {!enSelected && (
        <p className="mt-3 text-xs text-muted-foreground">
          English will be generated as an intermediate master and discarded.
        </p>
      )}

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
