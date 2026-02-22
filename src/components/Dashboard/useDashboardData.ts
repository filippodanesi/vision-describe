import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getModelById } from '@/lib/models';
import type { RunRecord } from '@/lib/runPersistence';

/* ── Types ─────────────────────────────────────────────────────── */

export interface ModelStats {
  modelId: string;
  modelName: string;
  provider: 'openai' | 'anthropic';
  runs: number;
  totalRows: number;
  totalTokens: number;
  totalCost: number;
  avgCostPerRun: number;
}

export interface DashboardData {
  runs: RunRecord[];
  loading: boolean;
  sessionStats: {
    totalRuns: number;
    totalRows: number;
    totalTokens: number;
    totalCost: number;
  };
  costByProvider: { openai: number; anthropic: number };
  modelStats: ModelStats[];
  recentRuns: RunRecord[];
  refresh: () => void;
}

/* ── Helpers ───────────────────────────────────────────────────── */

function getProvider(modelId: string): 'openai' | 'anthropic' {
  return modelId.startsWith('claude') ? 'anthropic' : 'openai';
}

function getDisplayName(modelId: string): string {
  const model = getModelById(modelId);
  return model?.name ?? modelId;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export function formatCost(n: number): string {
  return '$' + n.toFixed(4);
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

const USE_CASE_LABELS: Record<string, string> = {
  partoo: 'Partoo',
  amazon: 'Amazon',
  next: 'NEXT',
  aboutyou: 'About You',
  ecommerce: 'E-commerce',
};

export function useCaseLabel(useCase: string): string {
  return USE_CASE_LABELS[useCase] ?? useCase;
}

const STATUS_LABELS: Record<string, string> = {
  running: 'Running',
  completed: 'Completed',
  interrupted: 'Interrupted',
  cancelled: 'Cancelled',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

/* ── Hook ──────────────────────────────────────────────────────── */

export function useDashboardData(): DashboardData {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data) {
      setRuns(data as RunRecord[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const sessionStats = useMemo(() => {
    const completed = runs.filter(r => r.status === 'completed');
    return {
      totalRuns: completed.length,
      totalRows: completed.reduce((s, r) => s + (r.processed_count || 0), 0),
      totalTokens: completed.reduce((s, r) => s + (r.total_tokens_in || 0) + (r.total_tokens_out || 0), 0),
      totalCost: completed.reduce((s, r) => s + (r.total_cost || 0), 0),
    };
  }, [runs]);

  const costByProvider = useMemo(() => {
    const result = { openai: 0, anthropic: 0 };
    for (const r of runs) {
      if (r.status !== 'completed') continue;
      const p = getProvider(r.model_id);
      result[p] += r.total_cost || 0;
    }
    return result;
  }, [runs]);

  const modelStats = useMemo<ModelStats[]>(() => {
    const map = new Map<string, ModelStats>();
    for (const r of runs) {
      if (r.status !== 'completed') continue;
      const existing = map.get(r.model_id);
      const tokens = (r.total_tokens_in || 0) + (r.total_tokens_out || 0);
      const cost = r.total_cost || 0;
      const rows = r.processed_count || 0;

      if (existing) {
        existing.runs += 1;
        existing.totalRows += rows;
        existing.totalTokens += tokens;
        existing.totalCost += cost;
        existing.avgCostPerRun = existing.totalCost / existing.runs;
      } else {
        map.set(r.model_id, {
          modelId: r.model_id,
          modelName: getDisplayName(r.model_id),
          provider: getProvider(r.model_id),
          runs: 1,
          totalRows: rows,
          totalTokens: tokens,
          totalCost: cost,
          avgCostPerRun: cost,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.runs - a.runs);
  }, [runs]);

  const recentRuns = useMemo(() => runs.slice(0, 50), [runs]);

  return {
    runs,
    loading,
    sessionStats,
    costByProvider,
    modelStats,
    recentRuns,
    refresh: fetchRuns,
  };
}
