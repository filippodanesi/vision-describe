import { useMemo } from 'react';
import { useCostTracker, type CostRecord } from '../OptimizeMode/hooks/useCostTracker';
import { getModelById } from '@/lib/models';

export interface ModelStats {
  modelId: string;
  modelName: string;
  provider: 'openai' | 'anthropic';
  operations: number;
  totalTokens: number;
  totalCost: number;
  avgCostPerOp: number;
}

export interface DashboardData {
  costHistory: CostRecord[];
  remainingBudget: { openai: number; anthropic: number };
  totalCost: { openai: number; anthropic: number };
  sessionStats: {
    totalOperations: number;
    totalActualCost: number;
    totalTokens: number;
  };
  modelStats: ModelStats[];
  recentActivity: CostRecord[];
  resetTracking: () => void;
}

function getProvider(modelId: string): 'openai' | 'anthropic' {
  return modelId.startsWith('claude') ? 'anthropic' : 'openai';
}

function getDisplayName(modelId: string): string {
  const model = getModelById(modelId);
  if (model) return model.name;
  // Fallback: capitalize the model id
  return modelId;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export function formatCost(n: number): string {
  return '$' + n.toFixed(2);
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

export function useDashboardData(): DashboardData {
  const {
    costHistory,
    remainingBudget,
    totalCost,
    getSessionStats,
    resetTracking,
  } = useCostTracker();

  const sessionStats = useMemo(() => {
    const stats = getSessionStats();
    return {
      totalOperations: stats.totalOperations,
      totalActualCost: stats.totalActualCost,
      totalTokens: stats.totalTokens,
    };
  }, [costHistory]);

  const modelStats = useMemo<ModelStats[]>(() => {
    const map = new Map<string, ModelStats>();
    for (const record of costHistory) {
      const existing = map.get(record.model);
      const cost = record.actualCost ?? record.estimatedCost;
      const tokens =
        (record.actualInputTokens ?? record.estimatedInputTokens) +
        (record.actualOutputTokens ?? record.estimatedOutputTokens);

      if (existing) {
        existing.operations += 1;
        existing.totalTokens += tokens;
        existing.totalCost += cost;
        existing.avgCostPerOp = existing.totalCost / existing.operations;
      } else {
        map.set(record.model, {
          modelId: record.model,
          modelName: getDisplayName(record.model),
          provider: getProvider(record.model),
          operations: 1,
          totalTokens: tokens,
          totalCost: cost,
          avgCostPerOp: cost,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.operations - a.operations);
  }, [costHistory]);

  const recentActivity = useMemo<CostRecord[]>(() => {
    return [...costHistory].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }, [costHistory]);

  return {
    costHistory,
    remainingBudget,
    totalCost,
    sessionStats,
    modelStats,
    recentActivity,
    resetTracking,
  };
}
