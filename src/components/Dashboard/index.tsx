import React from 'react';
import { BarChart3 } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useDashboardData,
  formatTokens,
  formatCost,
  timeAgo,
} from './useDashboardData';
import { getModelById } from '@/lib/models';

const DEFAULT_BUDGET = 100;

export const Dashboard: React.FC = () => {
  const {
    sessionStats,
    modelStats,
    recentActivity,
    remainingBudget,
    totalCost,
    resetTracking,
    costHistory,
  } = useDashboardData();

  if (costHistory.length === 0) {
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

  const budgetRemaining = remainingBudget.openai + remainingBudget.anthropic;

  return (
    <div className="animate-in fade-in-0 duration-300 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Usage Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your AI processing costs and model performance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Operations" value={sessionStats.totalOperations.toString()} sub="total" />
        <StatCard label="Tokens" value={formatTokens(sessionStats.totalTokens)} sub="total" />
        <StatCard label="Total Cost" value={formatCost(sessionStats.totalActualCost)} sub="all-time" />
        <StatCard label="Budget Left" value={formatCost(budgetRemaining)} sub="remaining" />
      </div>

      {/* Model Leaderboard */}
      <section>
        <h2 className="text-lg font-medium tracking-tight mb-3">Model Leaderboard</h2>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Ops</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Avg $/op</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelStats.map((m, i) => (
                <TableRow key={m.modelId} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <span className="font-medium">{m.modelName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{m.provider}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{m.operations}</TableCell>
                  <TableCell className="text-right font-mono">{formatTokens(m.totalTokens)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCost(m.totalCost)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCost(m.avgCostPerOp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Budget by Provider */}
      <section>
        <h2 className="text-lg font-medium tracking-tight mb-3">Budget by Provider</h2>
        <div className="space-y-4">
          <BudgetRow label="OpenAI" used={totalCost.openai} budget={DEFAULT_BUDGET} />
          <BudgetRow label="Anthropic" used={totalCost.anthropic} budget={DEFAULT_BUDGET} />
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium tracking-tight">Recent Activity</h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                Clear History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all usage data, cost history, and budget tracking. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => resetTracking()}>
                  Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="border rounded-lg max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Time</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Tokens In</TableHead>
                <TableHead className="text-right">Tokens Out</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((record, i) => {
                const model = getModelById(record.model);
                const displayName = model?.name ?? record.model;
                const tokensIn = record.actualInputTokens ?? record.estimatedInputTokens;
                const tokensOut = record.actualOutputTokens ?? record.estimatedOutputTokens;
                const cost = record.actualCost ?? record.estimatedCost;

                return (
                  <TableRow key={`${record.timestamp}-${i}`} className="hover:bg-muted/30">
                    <TableCell className="text-muted-foreground">{timeAgo(record.timestamp)}</TableCell>
                    <TableCell>{displayName}</TableCell>
                    <TableCell className="text-right font-mono">{formatTokens(tokensIn)}</TableCell>
                    <TableCell className="text-right font-mono">{formatTokens(tokensOut)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCost(cost)}</TableCell>
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
      <p className="text-2xl font-medium tracking-tighter font-mono mt-1">{value}</p>
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

export default Dashboard;
