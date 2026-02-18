/**
 * Cost Tracker Hook
 * 
 * @author Filippo Danesi
 * @created 2025
 * @description Comprehensive cost tracking system for AI operations.
 *              Manages token usage, cost calculations, budget tracking,
 *              and provides detailed analytics for AI processing.
 * 
 * Key Features:
 * - Real-time cost calculation based on actual token usage
 * - Support for multiple AI providers (OpenAI, Anthropic)
 * - Budget management and remaining balance tracking
 * - Cost history and session statistics
 * - Automatic cost estimation when actual tokens unavailable
 * - Persistent storage of cost data
 * 
 * Pricing Data:
 * - Updated January 2025 with latest provider pricing
 * - Supports all major models (GPT-5, o4-mini, Claude Sonnet 4.5, etc.)
 * - Handles different pricing tiers and batch discounts
 */

import { useState, useEffect } from 'react';

export interface ModelCostData {
  name: string;
  inputCostPer1M: number;  // Cost per 1M input tokens
  outputCostPer1M: number; // Cost per 1M output tokens
  tokensPerCharInput: number;  // Approximation of tokens per character in input (fallback)
  tokensPerCharOutput: number; // Approximation of tokens per character in output (fallback)
}

export interface CostRecord {
  timestamp: number;
  model: string;
  inputChars: number;
  outputChars: number;
  actualInputTokens?: number;  // Actual tokens from API response
  actualOutputTokens?: number; // Actual tokens from API response
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  actualCost?: number;         // Cost based on actual tokens
  estimatedCost: number;
}

// Updated costs per model (prices as of January 2025)
const MODEL_COSTS: Record<string, ModelCostData> = {
  // OpenAI o4-mini (Standard pricing)
  'o4-mini': {
    name: 'o4-mini',
    inputCostPer1M: 1.10,
    outputCostPer1M: 4.40,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  // OpenAI o3 (Standard pricing)
  'o3': {
    name: 'o3',
    inputCostPer1M: 2.00,
    outputCostPer1M: 8.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  // OpenAI o3-pro (Standard pricing)
  'o3-pro': {
    name: 'o3-pro',
    inputCostPer1M: 20.00,
    outputCostPer1M: 80.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  // OpenAI o3-mini (Standard pricing)
  'o3-mini': {
    name: 'o3-mini',
    inputCostPer1M: 1.10,
    outputCostPer1M: 4.40,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  // OpenAI GPT-5 (Standard pricing)
  'gpt-5': {
    name: 'GPT-5',
    inputCostPer1M: 2.00,
    outputCostPer1M: 8.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  'gpt-5-2025-08-07': {
    name: 'GPT-5',
    inputCostPer1M: 2.00,
    outputCostPer1M: 8.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  // OpenAI GPT-5.2 (Standard pricing)
  'gpt-5.2': {
    name: 'GPT-5.2',
    inputCostPer1M: 1.75,
    outputCostPer1M: 7.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  // Legacy OpenAI models
  'gpt-4o-mini': {
    name: 'GPT-4o-mini',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  'gpt-4o': {
    name: 'GPT-4o',
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  // Claude Sonnet 4 (Base pricing)
  'claude-sonnet-4-20250514': {
    name: 'Claude 4 Sonnet',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  'claude-sonnet-4-0': {
    name: 'Claude 4 Sonnet',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  // Claude Sonnet 4.6
  'claude-sonnet-4-6': {
    name: 'Claude 4.6 Sonnet',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  // Claude Opus 4 (Base pricing)
  'claude-opus-4-0': {
    name: 'Claude 4 Opus',
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  'claude-opus-4': {
    name: 'Claude 4 Opus',
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  // Claude Opus 4.1 (Base pricing)
  'claude-opus-4-1': {
    name: 'Claude 4.1 Opus',
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  // Claude Opus 4.6 (Latest flagship — official pricing: $5/$25 per MTok)
  'claude-opus-4-6': {
    name: 'Claude Opus 4.6',
    inputCostPer1M: 5.00,
    outputCostPer1M: 25.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  // Legacy Claude models
  'claude-3-7-sonnet-20250219': {
    name: 'Claude 3.7 Sonnet',
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  'claude-3-haiku-20240307': {
    name: 'Claude 3 Haiku',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25, 
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  },
  'claude-haiku-3-5': {
    name: 'Claude Haiku 3.5',
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00,
    tokensPerCharInput: 0.25,
    tokensPerCharOutput: 0.25
  }
};

// Initial budget per provider - realistic for production use
const DEFAULT_BUDGETS = {
  openai: 100.00,    // $100 for OpenAI (sufficient for ~1000 products with o4-mini)
  anthropic: 100.00  // $100 for Claude (sufficient for ~500 products with Sonnet 4)
};

export const useCostTracker = () => {
  // Cost history
  const [costHistory, setCostHistory] = useState<CostRecord[]>(() => {
    const saved = localStorage.getItem('ai_cost_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Remaining budget per provider
  const [remainingBudget, setRemainingBudget] = useState(() => {
    const saved = localStorage.getItem('ai_remaining_budget');
    return saved ? JSON.parse(saved) : { ...DEFAULT_BUDGETS };
  });

  // Total cost per provider
  const [totalCost, setTotalCost] = useState(() => {
    const saved = localStorage.getItem('ai_total_cost');
    return saved ? JSON.parse(saved) : { openai: 0, anthropic: 0 };
  });

  // Save data when it changes
  useEffect(() => {
    localStorage.setItem('ai_cost_history', JSON.stringify(costHistory));
    localStorage.setItem('ai_remaining_budget', JSON.stringify(remainingBudget));
    localStorage.setItem('ai_total_cost', JSON.stringify(totalCost));
  }, [costHistory, remainingBudget, totalCost]);

  // Reset tracking data
  const resetTracking = (provider?: 'openai' | 'anthropic') => {
    if (provider) {
      // Reset only for a specific provider
      setCostHistory(prev => prev.filter(record => {
        const isOpenAI = ['gpt-4o-mini', 'gpt-4o', 'o4-mini', 'o3', 'gpt-5', 'gpt-5-2025-08-07'].includes(record.model);
        return provider === 'openai' ? !isOpenAI : isOpenAI;
      }));
      setRemainingBudget(prev => ({
        ...prev,
        [provider]: DEFAULT_BUDGETS[provider]
      }));
      setTotalCost(prev => ({
        ...prev,
        [provider]: 0
      }));
    } else {
      // Reset everything
      setCostHistory([]);
      setRemainingBudget({ ...DEFAULT_BUDGETS });
      setTotalCost({ openai: 0, anthropic: 0 });
    }
  };

  // Reset the budget
  const setBudget = (provider: 'openai' | 'anthropic', amount: number) => {
    setRemainingBudget(prev => ({
      ...prev,
      [provider]: amount
    }));
  };

  // Calculate and register the cost of an operation with real tokens (if available)
  const trackOperation = (
    model: string, 
    inputText: string, 
    outputText: string, 
    actualTokens?: { inputTokens: number; outputTokens: number }
  ): CostRecord | null => {
    const modelData = MODEL_COSTS[model];
    if (!modelData) {
      console.warn(`Model cost data not available for ${model}`);
      return null;
    }

    // Calculate lengths in characters
    const inputChars = inputText.length;
    const outputChars = outputText.length;

    // Usa token reali se disponibili, altrimenti stima
    const actualInputTokens = actualTokens?.inputTokens;
    const actualOutputTokens = actualTokens?.outputTokens;
    
    const estimatedInputTokens = Math.ceil(inputChars * modelData.tokensPerCharInput);
    const estimatedOutputTokens = Math.ceil(outputChars * modelData.tokensPerCharOutput);

    // Calcola costo stimato e reale
    const estimatedInputCost = (estimatedInputTokens / 1000000) * modelData.inputCostPer1M;
    const estimatedOutputCost = (estimatedOutputTokens / 1000000) * modelData.outputCostPer1M;
    const estimatedCost = estimatedInputCost + estimatedOutputCost;
    
    let actualCost: number | undefined;
    if (actualInputTokens !== undefined && actualOutputTokens !== undefined) {
      const actualInputCost = (actualInputTokens / 1000000) * modelData.inputCostPer1M;
      const actualOutputCost = (actualOutputTokens / 1000000) * modelData.outputCostPer1M;
      actualCost = actualInputCost + actualOutputCost;
    }

    // Determina il provider in base al modello
    const provider = model.startsWith('claude') ? 'anthropic' : 'openai';

    // Registra il costo
    const costRecord: CostRecord = {
      timestamp: Date.now(),
      model,
      inputChars,
      outputChars,
      actualInputTokens,
      actualOutputTokens,
      estimatedInputTokens,
      estimatedOutputTokens,
      actualCost,
      estimatedCost
    };

    setCostHistory(prev => [...prev, costRecord]);

    // Usa il costo reale se disponibile, altrimenti quello stimato
    const costToSubtract = actualCost !== undefined ? actualCost : estimatedCost;

    // Aggiorna il budget rimanente
    setRemainingBudget(prev => ({
      ...prev,
      [provider]: Math.max(0, prev[provider] - costToSubtract)
    }));

    // Aggiorna il costo totale
    setTotalCost(prev => ({
      ...prev,
      [provider]: prev[provider] + costToSubtract
    }));

    return costRecord;
  };

  // Ottieni i dati di costo per un modello
  const getModelCostData = (model: string): ModelCostData | undefined => {
    return MODEL_COSTS[model];
  };

  // Calcola statistiche totali per la sessione
  const getSessionStats = () => {
    const totalOperations = costHistory.length;
    const totalActualCost = costHistory.reduce((sum, record) => 
      sum + (record.actualCost !== undefined ? record.actualCost : record.estimatedCost), 0);
    const totalActualTokensInput = costHistory.reduce((sum, record) => 
      sum + (record.actualInputTokens || record.estimatedInputTokens), 0);
    const totalActualTokensOutput = costHistory.reduce((sum, record) => 
      sum + (record.actualOutputTokens || record.estimatedOutputTokens), 0);
    
    return {
      totalOperations,
      totalActualCost,
      totalTokensInput: totalActualTokensInput,
      totalTokensOutput: totalActualTokensOutput,
      totalTokens: totalActualTokensInput + totalActualTokensOutput
    };
  };

  return {
    costHistory,
    remainingBudget,
    totalCost,
    trackOperation,
    resetTracking,
    setBudget,
    getModelCostData,
    getSessionStats
  };
};
