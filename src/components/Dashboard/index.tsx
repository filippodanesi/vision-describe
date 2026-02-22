import React from 'react';
import { BarChart3, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="animate-in fade-in-0 duration-300">
        <div className="text-center py-16">
          <BarChart3 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-lg font-medium tracking-tight">No activity yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Start processing files to see your usage statistics here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-0 duration-300 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Usage Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI processing costs and performance from Supabase
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard label="Completed Runs" value={sessionStats.totalRuns.toString()} sub="total" />
        <StatCard label="Rows Processed" value={formatTokens(sessionStats.totalRows)} sub="total" />
        <StatCard label="Tokens Used" value={formatTokens(sessionStats.totalTokens)} sub="in + out" />
        <StatCard label="Total Cost" value={formatCost(sessionStats.totalCost)} sub="all completed runs" />
      </div>

      {/* Model Leaderboard */}
      {modelStats.length > 0 && (
        <section>
          <h2 className="text-base font-medium tracking-tight mb-3">Model Leaderboard</h2>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Avg $/run</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelStats.map((m, i) => (
                  <TableRow key={m.modelId} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <span className="font-medium">{m.modelName}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{m.provider}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{m.runs}</TableCell>
                    <TableCell className="text-right font-mono">{formatTokens(m.totalRows)}</TableCell>
                    <TableCell className="text-right font-mono">{formatTokens(m.totalTokens)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCost(m.totalCost)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCost(m.avgCostPerRun)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Budget by Provider */}
      <section>
        <h2 className="text-base font-medium tracking-tight mb-3">Spend by Provider</h2>
        <div className="space-y-4">
          <BudgetRow label="OpenAI" used={costByProvider.openai} budget={DEFAULT_BUDGET} />
          <BudgetRow label="Anthropic" used={costByProvider.anthropic} budget={DEFAULT_BUDGET} />
        </div>
      </section>

      {/* Recent Runs */}
      <section>
        <h2 className="text-base font-medium tracking-tight mb-3">Recent Runs</h2>
        <div className="border rounded-lg max-h-[500px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Time</TableHead>
                <TableHead>Use Case</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead className="text-right">Tokens In</TableHead>
                <TableHead className="text-right">Tokens Out</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRuns.map((run) => {
                const model = getModelById(run.model_id);
                const displayName = model?.name ?? run.model_id;
                const ts = new Date(run.created_at).getTime();

                return (
                  <TableRow key={run.id} className="hover:bg-muted/20">
                    <TableCell className="text-muted-foreground whitespace-nowrap">{timeAgo(ts)}</TableCell>
                    <TableCell>{useCaseLabel(run.use_case)}</TableCell>
                    <TableCell>{displayName}</TableCell>
                    <TableCell className="max-w-[140px] truncate text-muted-foreground" title={run.file_name || ''}>
                      {run.file_name || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {run.processed_count}/{run.total_rows}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatTokens(run.total_tokens_in || 0)}</TableCell>
                    <TableCell className="text-right font-mono">{formatTokens(run.total_tokens_out || 0)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCost(run.total_cost || 0)}</TableCell>
                    <TableCell>
                      <StatusBadge status={run.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
};

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl font-normal tracking-tight font-mono mt-1">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

function BudgetRow({ label, used, budget }: { label: string; used: number; budget: number }) {
  const pct = Math.min((used / budget) * 100, 100);
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium w-20 shrink-0">{label}</span>
      <Progress value={pct} className="h-2 flex-1" />
      <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
        {formatCost(used)} / {formatCost(budget)}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950',
    completed: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950',
    interrupted: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950',
    cancelled: 'text-muted-foreground bg-muted',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] || colors.cancelled}`}>
      {statusLabel(status)}
    </span>
  );
}

export default Dashboard;
