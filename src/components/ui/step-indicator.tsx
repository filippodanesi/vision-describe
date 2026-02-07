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

  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((step, idx) => {
        const isPast = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        return (
          <React.Fragment key={step.key}>
            {idx > 0 && (
              <div
                className={cn(
                  'h-px w-10 sm:w-14 transition-colors duration-300',
                  isPast ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center text-xs font-normal transition-all duration-300',
                  isPast && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  !isPast && !isCurrent && 'bg-muted text-muted-foreground'
                )}
              >
                {isPast ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-[11px] font-normal transition-colors duration-300',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
