import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * SectionHeader — small header used to label a section inside a page.
 *
 * Layout:
 *   01 / MODEL LEADERBOARD                       optional actions
 *
 * - `index`: zero-padded position (e.g. 1 -> "01"), rendered as a muted
 *   tabular prefix in display mono.
 * - `title`: rendered in label-mono utility — uppercase tracking-caps 11px.
 * - `description`: optional muted helper text under the title in normal sans.
 * - `actions`: optional ReactNode rendered on the right (e.g. a "View all"
 *   button, a refresh icon).
 *
 * Designed to be placed above tables, cards, or stat grids. No top border,
 * no background — just a typographic separator with a clear ordinal.
 */

interface SectionHeaderProps {
  index?: number | string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  /** When true, the title is rendered larger (Geist semibold) instead of
   *  label-mono. Use for the first/primary section in a page. */
  emphasized?: boolean;
}

function formatIndex(idx: number | string): string {
  if (typeof idx === 'number') {
    return String(idx).padStart(2, '0');
  }
  return idx;
}

export function SectionHeader({
  index,
  title,
  description,
  actions,
  className,
  emphasized = false,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3 min-w-0">
          {index !== undefined && (
            <span
              className="font-mono tabular-nums text-muted-foreground/70 text-[11px] font-medium shrink-0"
              aria-hidden="true"
            >
              {formatIndex(index)}
            </span>
          )}
          {emphasized ? (
            <h2 className="text-base font-semibold tracking-tightest text-foreground truncate">
              {title}
            </h2>
          ) : (
            <h2 className="label-mono text-foreground truncate">{title}</h2>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

export default SectionHeader;
