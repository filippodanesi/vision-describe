/**
 * Token Counter Component
 *
 * Real-time token usage and cost tracking. Renders session statistics,
 * cost breakdown, recent operations and a 100-product projection as a
 * single industrial-spec block.
 */

import React from 'react';
import { useCostTracker } from '../hooks/useCostTracker';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/utils';

interface TokenCounterProps {
  className?: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

export const TokenCounter: React.FC<TokenCounterProps> = ({ className }) => {
  const { costHistory, totalCost, remainingBudget, getSessionStats } = useCostTracker();
  const stats = getSessionStats();

  const avgCost = stats.totalOperations > 0 ? stats.totalActualCost / stats.totalOperations : 0;
  const avgTokens =
    stats.totalOperations > 0 ? Math.round(stats.totalTokens / stats.totalOperations) : 0;
  const projection100 = avgCost * 100;

  return (
    <div className={cn('space-y-10', className)}>
      <section>
        <SectionHeader index={1} title="Session statistics" />
        <div className="border border-border bg-card grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
          <StatCell label="Products" value={formatNumber(stats.totalOperations)} />
          <StatCell label="Total tokens" value={formatNumber(stats.totalTokens)} />
          <StatCell label="Input tokens" value={formatNumber(stats.totalTokensInput)} />
          <StatCell label="Output tokens" value={formatNumber(stats.totalTokensOutput)} />
        </div>
      </section>

      <section>
        <SectionHeader index={2} title="Cost breakdown" />
        <div className="border border-border bg-card divide-y divide-border">
          <ProviderRow
            label="Anthropic"
            spent={formatCurrency(totalCost.anthropic)}
            remaining={formatCurrency(remainingBudget.anthropic)}
          />
          <div className="flex items-center justify-between px-5 py-4 bg-muted/30">
            <span className="label-mono">Total session cost</span>
            <span className="font-mono text-base font-semibold tabular-nums text-foreground">
              {formatCurrency(stats.totalActualCost)}
            </span>
          </div>
        </div>
      </section>

      {costHistory.length > 0 && (
        <section>
          <SectionHeader index={3} title="Recent operations" />
          <div className="border border-border bg-card divide-y divide-border max-h-56 overflow-y-auto">
            {costHistory
              .slice(-5)
              .reverse()
              .map((record, index) => {
                const provider = record.model.startsWith('claude') ? 'anthropic' : 'openai';
                const cost =
                  record.actualCost !== undefined ? record.actualCost : record.estimatedCost;
                const inputTokens = record.actualInputTokens || record.estimatedInputTokens;
                const outputTokens = record.actualOutputTokens || record.estimatedOutputTokens;

                return (
                  <div
                    key={index}
                    className="flex items-baseline justify-between gap-4 px-5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <span className="label-mono-sm shrink-0">{provider}</span>
                        <span className="font-mono text-sm text-foreground truncate">
                          {record.model}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                        {formatNumber(inputTokens)} → {formatNumber(outputTokens)} tokens
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(cost)}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {stats.totalOperations > 0 && (
        <section>
          <SectionHeader index={4} title="Cost analysis" />
          <div className="border border-border bg-card">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <StatCell label="Avg cost / product" value={formatCurrency(avgCost)} small />
              <StatCell label="Avg tokens / product" value={formatNumber(avgTokens)} small />
              <StatCell label="Projection (100 prod.)" value={formatCurrency(projection100)} small />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

function StatCell({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="p-5">
      <p className="label-mono-sm">{label}</p>
      <p
        className={cn(
          'mt-2 font-mono tabular-nums text-foreground tracking-tightest',
          small ? 'text-lg' : 'text-2xl',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ProviderRow({
  label,
  spent,
  remaining,
}: {
  label: string;
  spent: string;
  remaining: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="font-semibold text-sm text-foreground">{label}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
          {remaining} remaining
        </p>
      </div>
      <div className="text-right">
        <p className="font-mono text-base font-semibold tabular-nums text-foreground">
          {spent}
        </p>
        <p className="label-mono-sm normal-case tracking-normal mt-0.5">Total spent</p>
      </div>
    </div>
  );
}

export default TokenCounter;
