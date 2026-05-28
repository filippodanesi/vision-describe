import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepDef<K extends string = string> {
  key: K;
  label: string;
}

interface StepIndicatorProps<K extends string = string> {
  steps: StepDef<K>[];
  currentStep: K;
}

export function StepIndicator<K extends string>({ steps, currentStep }: StepIndicatorProps<K>) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);
  const currentLabel = currentIndex >= 0 ? steps[currentIndex].label : '';

  return (
    <div className="mb-6">
      {/* Tracks + circles. Connectors use flex-1 so the row scales from 320px
          up without horizontal overflow even with 6 steps. */}
      <div className="flex items-center justify-between gap-1 px-2 sm:px-0 sm:gap-0 sm:justify-center">
        {steps.map((step, idx) => {
          const isPast = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <React.Fragment key={step.key}>
              {idx > 0 && (
                <div
                  className={cn(
                    'h-px flex-1 sm:flex-none sm:w-14 min-w-3 transition-colors duration-300',
                    isPast ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center text-xs font-normal transition-all duration-300',
                    isPast && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/10',
                    !isPast && !isCurrent && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isPast ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    'hidden sm:inline-block text-[11px] font-normal transition-colors duration-300 whitespace-nowrap',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile-only progress sentence. Replaces per-step labels below 640px
          where 4–6 inline labels would otherwise overflow or wrap awkwardly. */}
      <p className="sm:hidden mt-3 text-center text-[11px] font-normal text-muted-foreground">
        <span className="font-mono tabular-nums">
          {String(currentIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
        </span>
        <span className="mx-2 text-border" aria-hidden="true">·</span>
        <span className="text-foreground">{currentLabel}</span>
      </p>
    </div>
  );
}
