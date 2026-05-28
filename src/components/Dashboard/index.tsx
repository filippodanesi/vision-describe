import React from 'react';
import { BarChart3, RefreshCw, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/utils';
import {
  useDashboardData,
  formatTokens,
  formatCost,
  timeAgo,
  useCaseLabel,
  statusLabel,
} from './useDashboardData';
import { getModelById } from '@/lib/models';

const DEFAULT_BUDGET = 100;

export const Dashboard: React.FC = () => {
  const {
    runs,
    loading,
    sessionStats,
    costByProvider,
    modelStats,
    recentRuns,
    refresh,
  } = useDashboardData();

  if (loading && runs.length === 0) {
    return (
      <div className="animate-in fade-in-0 duration-300">
        <PageHeader
          index="DASH"
          title="Usage Dashboard"
          description="AI processing costs and performance pulled from Supabase."
          status={{ label: 'Loading', tone: 'muted' }}
        />
        <div className="text-center py-24">
          <Loader2 className="h-6 w-6 text-muted-foreground/40 mx-auto mb-4 animate-spin" />
          <p className="label-mono">Loading runs…</p>
        </div>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="animate-in fade-in-0 duration-300">
        <PageHeader
          index="DASH"
          title="Usage Dashboard"
          description="AI processing costs and performance pulled from Supabase."
          status={{ label: 'No data', tone: 'muted' }}
        />
        <div className="border border-border bg-muted/30 py-20 px-6 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-4" />
          <p className="label-mono mb-2">No activity yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Start processing files in Generate or Optimize to see your usage
            statistics populate here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-0 duration-300">
      <PageHeader
        index="DASH"
        title="Usage Dashboard"
        description="AI processing costs and performance pulled from Supabase."
        status={{ label: 'Ready' }}
        meta={
          <span className="tabular-nums">
            {sessionStats.totalRuns} runs · {formatCost(sessionStats.totalCost)}
          </span>
        }
        actions={
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <div className="space-y-12">
        {/* Stat Grid */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border border border-border">
            <StatCell label="Completed Runs" value={sessionStats.totalRuns.toString()} sub="total" />
            <StatCell label="Rows Processed" value={formatTokens(sessionStats.totalRows)} sub="total" />
            <StatCell label="Tokens Used" value={formatTokens(sessionStats.totalTokens)} sub="in + out" />
            <StatCell label="Total Cost" value={formatCost(sessionStats.totalCost)} sub="all completed" />
          </div>
        </section>

        {/* Model Leaderboard */}
        {modelStats.length > 0 && (
          <section>
            <SectionHeader index={1} title="Model Leaderboard" />
            <div className="border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                    <TableHead className="w-12 label-mono">#</TableHead>
                    <TableHead className="label-mono">Model</TableHead>
                    <TableHead className="text-right label-mono">Runs</TableHead>
                    <TableHead className="text-right label-mono">Rows</TableHead>
                    <TableHead className="text-right label-mono">Tokens</TableHead>
                    <TableHead className="text-right label-mono">Cost</TableHead>
                    <TableHead className="text-right label-mono">Avg $/run</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelStats.map((m, i) => (
                    <TableRow key={m.modelId} className="hover:bg-muted/20 border-b border-border last:border-b-0">
                      <TableCell className="font-mono text-muted-foreground tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{m.modelName}</span>
                        <span className="ml-2 font-mono text-xs text-muted-foreground">{m.provider}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{m.runs}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatTokens(m.totalRows)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatTokens(m.totalTokens)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatCost(m.totalCost)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatCost(m.avgCostPerRun)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        {/* Budget by Provider */}
        <section>
          <SectionHeader index={2} title="Spend by Provider" />
          <div className="border border-border divide-y divide-border">
            <BudgetRow label="OpenAI" used={costByProvider.openai} budget={DEFAULT_BUDGET} />
            <BudgetRow label="Anthropic" used={costByProvider.anthropic} budget={DEFAULT_BUDGET} />
          </div>
        </section>

        {/* Recent Runs */}
        <section>
          <SectionHeader index={3} title="Recent Runs" />
          <div className="border border-border max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                  <TableHead className="label-mono">Time</TableHead>
                  <TableHead className="label-mono">Use Case</TableHead>
                  <TableHead className="label-mono">Model</TableHead>
                  <TableHead className="label-mono">File</TableHead>
                  <TableHead className="text-right label-mono">Rows</TableHead>
                  <TableHead className="text-right label-mono">Tok In</TableHead>
                  <TableHead className="text-right label-mono">Tok Out</TableHead>
                  <TableHead className="text-right label-mono">Cost</TableHead>
                  <TableHead className="label-mono">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRuns.map((run) => {
                  const model = getModelById(run.model_id);
                  const displayName = model?.name ?? run.model_id;
                  const ts = new Date(run.created_at).getTime();

                  return (
                    <TableRow key={run.id} className="hover:bg-muted/20 border-b border-border last:border-b-0">
                      <TableCell className="text-muted-foreground whitespace-nowrap font-mono text-xs">{timeAgo(ts)}</TableCell>
                      <TableCell>{useCaseLabel(run.use_case)}</TableCell>
                      <TableCell>{displayName}</TableCell>
                      <TableCell className="max-w-[140px] truncate text-muted-foreground" title={run.file_name || undefined}>
                        {run.file_name || '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {run.processed_count}/{run.total_rows}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatTokens(run.total_tokens_in || 0)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatTokens(run.total_tokens_out || 0)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatCost(run.total_cost || 0)}</TableCell>
                      <TableCell>
                        <StatusIndicator status={run.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
};

function StatCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-5 bg-card">
      <p className="label-mono-sm">{label}</p>
      <p className="text-2xl font-mono font-normal tracking-tightest text-foreground mt-2 tabular-nums">
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function BudgetRow({ label, used, budget }: { label: string; used: number; budget: number }) {
  const pct = Math.min((used / budget) * 100, 100);
  const overBudget = used > budget;
  return (
    <div className="flex items-center gap-4 px-5 py-4 bg-card">
      <span className="text-sm font-medium w-24 shrink-0">{label}</span>
      <Progress value={pct} className={cn('h-1.5 flex-1', overBudget && '[&>div]:bg-destructive')} />
      <span className="text-sm font-mono text-muted-foreground whitespace-nowrap tabular-nums">
        {formatCost(used)} / {formatCost(budget)}
      </span>
    </div>
  );
}

const STATUS_TONE: Record<string, 'signal' | 'foreground' | 'muted' | 'destructive'> = {
  running: 'signal',
  completed: 'foreground',
  interrupted: 'muted',
  cancelled: 'muted',
};

function StatusIndicator({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? 'muted';
  const dotClass = {
    signal: 'bg-signal animate-pulse',
    foreground: 'bg-foreground',
    muted: 'bg-muted-foreground/40',
    destructive: 'bg-destructive',
  }[tone];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-block size-1.5 rounded-full', dotClass)} aria-hidden="true" />
      <span className="font-mono uppercase tracking-caps-sm text-[10px] font-medium text-muted-foreground">
        {statusLabel(status)}
      </span>
    </span>
  );
}

export default Dashboard;
