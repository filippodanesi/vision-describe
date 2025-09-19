/**
 * Token Counter Component
 * 
 * @author Filippo Danesi
 * @created 2025
 * @description Real-time token usage and cost tracking component.
 *              Displays comprehensive cost analysis, token statistics,
 *              and ROI calculations for AI processing operations.
 * 
 * Key Features:
 * - Real-time token counting (input/output)
 * - Cost breakdown by provider (OpenAI/Anthropic)
 * - Session statistics and projections
 * - ROI comparison vs manual work
 * - Budget tracking and remaining balance
 * - Recent operations history
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCostTracker } from '../hooks/useCostTracker';
import { DollarSign, Zap, FileText, TrendingUp } from 'lucide-react';

interface TokenCounterProps {
  className?: string;
}

export const TokenCounter: React.FC<TokenCounterProps> = ({ className }) => {
  const { costHistory, totalCost, remainingBudget, getSessionStats } = useCostTracker();
  const stats = getSessionStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getProviderColor = (provider: 'openai' | 'anthropic') => {
    return provider === 'openai' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  };

  const getProviderIcon = (provider: 'openai' | 'anthropic') => {
    return provider === 'openai' ? '🤖' : '🧠';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Session Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Session Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalOperations}</div>
              <div className="text-sm text-gray-600">Products Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatNumber(stats.totalTokens)}</div>
              <div className="text-sm text-gray-600">Total Tokens</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatNumber(stats.totalTokensInput)}</div>
              <div className="text-sm text-gray-600">Input Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatNumber(stats.totalTokensOutput)}</div>
              <div className="text-sm text-gray-600">Output Tokens</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OpenAI */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getProviderIcon('openai')}</span>
              <div>
                <div className="font-medium">OpenAI</div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(remainingBudget.openai)} remaining
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(totalCost.openai)}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
          </div>

          {/* Anthropic */}
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getProviderIcon('anthropic')}</span>
              <div>
                <div className="font-medium">Anthropic</div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(remainingBudget.anthropic)} remaining
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(totalCost.anthropic)}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
          </div>

          {/* Total Cost */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Total Session Cost</div>
              <div className="text-xl font-bold text-blue-600">
                {formatCurrency(stats.totalActualCost)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Operations */}
      {costHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {costHistory.slice(-5).reverse().map((record, index) => {
                const provider = record.model.startsWith('claude') ? 'anthropic' : 'openai';
                const cost = record.actualCost !== undefined ? record.actualCost : record.estimatedCost;
                const inputTokens = record.actualInputTokens || record.estimatedInputTokens;
                const outputTokens = record.actualOutputTokens || record.estimatedOutputTokens;
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge className={getProviderColor(provider)}>
                        {getProviderIcon(provider)}
                      </Badge>
                      <div className="text-sm">
                        <div className="font-medium">{record.model}</div>
                        <div className="text-gray-600">
                          {formatNumber(inputTokens)} → {formatNumber(outputTokens)} tokens
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(cost)}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Per Product Estimate */}
      {(
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">
                  {formatCurrency(stats.totalActualCost / stats.totalOperations)}
                </div>
                <div className="text-sm text-gray-600">Avg Cost per Product</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {formatNumber(Math.round(stats.totalTokens / stats.totalOperations))}
                </div>
                <div className="text-sm text-gray-600">Avg Tokens per Product</div>
              </div>
            </div>
            
            {/* Projection for 100 products */}
            <div className="border-t pt-3">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {formatCurrency((stats.totalActualCost / stats.totalOperations) * 100)}
                </div>
                <div className="text-sm text-gray-600">Estimated cost for 100 products</div>
              </div>
            </div>
            
            {/* Cost Comparison */}
            <div className="border-t pt-3">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Cost Comparison</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-green-50 p-2 rounded">
                    <div className="font-medium text-green-800">Manual Work</div>
                    <div className="text-green-600">$2,500</div>
                    <div className="text-gray-500">(100 products)</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="font-medium text-blue-800">AI Processing</div>
                    <div className="text-blue-600">
                      {stats.totalOperations > 0 
                        ? formatCurrency((stats.totalActualCost / stats.totalOperations) * 100)
                        : formatCurrency(0)
                      }
                    </div>
                    <div className="text-gray-500">(100 products)</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  {stats.totalOperations > 0 ? (
                    <>Savings: {formatCurrency(2500 - ((stats.totalActualCost / stats.totalOperations) * 100))}</>
                  ) : (
                    <>Savings: {formatCurrency(2500)}</>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TokenCounter;
