import React from 'react';
import { Camera, FileSpreadsheet, Wand2, ArrowRight } from 'lucide-react';
import { GenerateSubMode } from '../types';
import { cn } from '@/lib/utils';

interface SubModeSelectorProps {
  onSelect: (mode: GenerateSubMode) => void;
}

interface SubModeRow {
  id: GenerateSubMode;
  index: string;
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  input: string;
  output: string;
}

const ROWS: SubModeRow[] = [
  {
    id: GenerateSubMode.METADATA_GENERATION,
    index: '01',
    label: 'Metadata Generation',
    description:
      'Generate brand-compliant Inriver long descriptions from Marketing inputs (Short description, Series USP, Style USP). Produces EN master plus 11 locales in one run.',
    icon: Wand2,
    input: 'xlsx / metadata',
    output: '12 locales',
  },
  {
    id: GenerateSubMode.IMAGE_ANALYSIS,
    index: '02',
    label: 'Image Analysis',
    description:
      'Generate product descriptions from product photography. Vision-only flow; no metadata required.',
    icon: Camera,
    input: 'jpg / png',
    output: 'EN copy',
  },
  {
    id: GenerateSubMode.CSV_TRANSLATION,
    index: '03',
    label: 'CSV Translation',
    description:
      'Batch translate existing product descriptions into 20+ languages. Triumph, sloggi and Beldona formats auto-detected.',
    icon: FileSpreadsheet,
    input: 'csv / xlsx',
    output: '20+ locales',
  },
];

export const SubModeSelector: React.FC<SubModeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="max-w-3xl">
      <p className="label-mono mb-4">Choose a flow</p>
      <ul className="border border-border divide-y divide-border bg-card">
        {ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onSelect(row.id)}
                className={cn(
                  'group flex w-full items-start gap-5 p-5 text-left transition-colors',
                  'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                <span
                  className="font-mono text-xs tabular-nums text-muted-foreground/70 pt-1 shrink-0"
                  aria-hidden="true"
                >
                  {row.index}
                </span>
                <Icon
                  className="size-4 text-muted-foreground mt-1 shrink-0 transition-colors group-hover:text-foreground"
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold tracking-tightest text-foreground">
                    {row.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {row.description}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 label-mono-sm">
                    <span>
                      <span className="text-muted-foreground/60">In</span>{' '}
                      <span className="text-foreground/80">{row.input}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground/60">Out</span>{' '}
                      <span className="text-foreground/80">{row.output}</span>
                    </span>
                  </div>
                </div>
                <ArrowRight
                  className="size-4 text-muted-foreground/40 shrink-0 mt-1 transition-all duration-150 ease-out group-hover:text-signal group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
