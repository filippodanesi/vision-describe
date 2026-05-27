import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * PageHeader — Industrial Data Tool page header.
 *
 * Layout:
 *   [INDEX] · TITLE                                    ● status · meta
 *   ───────────────────────────────────────────────────────────
 *   description
 *
 * - `index`: short uppercase code on the left (e.g. "GEN", "DASH", "01").
 *   Rendered in display mono caps tracking-caps.
 * - `title`: page name, Geist semibold tracking-tightest, tight scale.
 * - `description`: optional one-line muted subtitle on the row below.
 * - `status`: optional { label, tone } — renders status-dot + label-mono on
 *   the top right. tone "signal" uses bg-signal; "muted" uses border colour.
 * - `meta`: optional ReactNode rendered on the top right, after status.
 *   Use for chips like brand=sloggi, version, last-run timestamp, etc.
 * - `actions`: optional ReactNode rendered far right (buttons, refresh).
 *
 * The header always renders a single hairline border-bottom to separate it
 * from the main content. Spacing is tuned so the page reads as a spec sheet.
 */

type StatusTone = 'signal' | 'muted' | 'foreground';

interface PageHeaderProps {
  index?: string;
  title: string;
  description?: React.ReactNode;
  status?: { label: string; tone?: StatusTone };
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const toneClasses: Record<StatusTone, string> = {
  signal: 'bg-signal',
  muted: 'bg-muted-foreground/40',
  foreground: 'bg-foreground',
};

export function PageHeader({
  index,
  title,
  description,
  status,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-8 border-b border-border pb-6', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-3 min-w-0">
          {index && (
            <span
              className="font-display uppercase tracking-caps text-[11px] font-medium text-muted-foreground tabular-nums shrink-0"
              aria-hidden="true"
            >
              {index}
            </span>
          )}
          <h1 className="text-2xl font-semibold tracking-tightest text-foreground truncate">
            {title}
          </h1>
        </div>

        {(status || meta || actions) && (
          <div className="flex items-center gap-4 shrink-0">
            {status && (
              <span
                className="inline-flex items-center gap-1.5 font-display uppercase tracking-caps-sm text-[10px] font-medium text-muted-foreground"
                aria-label={`Status: ${status.label}`}
              >
                <span
                  className={cn(
                    'inline-block size-1.5 rounded-full align-middle',
                    toneClasses[status.tone ?? 'signal'],
                  )}
                  aria-hidden="true"
                />
                {status.label}
              </span>
            )}
            {meta && (
              <div className="font-display uppercase tracking-caps-sm text-[10px] font-medium text-muted-foreground">
                {meta}
              </div>
            )}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
      </div>

      {description && (
        <p className="mt-3 max-w-[65ch] text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </header>
  );
}

export default PageHeader;
