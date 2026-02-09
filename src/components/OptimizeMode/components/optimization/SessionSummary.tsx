import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calculator, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SessionSummaryProps {
  costTracker: any;
  activeProvider: 'openai' | 'anthropic';
}

/**
 * Displays comprehensive session statistics including token usage and costs
 */
const SessionSummary: React.FC<SessionSummaryProps> = ({ costTracker, activeProvider }) => {
  if (!costTracker) return null;

  const sessionStats = costTracker.getSessionStats();
  const costHistory = costTracker.costHistory;
  
  if (sessionStats.totalOperations === 0) return null;

  // Filter operations by provider
  const providerOperations = costHistory.filter((record: any) => {
    const isOpenAI = ['gpt-4o-mini', 'gpt-4o', 'o4-mini', 'o3'].includes(record.model);
    return activeProvider === 'openai' ? isOpenAI : !isOpenAI;
  });

  // Calculate provider-specific stats
  const providerStats = {
    operations: providerOperations.length,
    totalCost: providerOperations.reduce((sum: number, record: any) => 
      sum + (record.actualCost !== undefined ? record.actualCost : record.estimatedCost), 0),
    totalInputTokens: providerOperations.reduce((sum: number, record: any) => 
      sum + (record.actualInputTokens || record.estimatedInputTokens), 0),
    totalOutputTokens: providerOperations.reduce((sum: number, record: any) => 
      sum + (record.actualOutputTokens || record.estimatedOutputTokens), 0),
    avgCostPerOperation: 0,
    avgTokensPerOperation: 0
  };

  if (providerStats.operations > 0) {
    providerStats.avgCostPerOperation = providerStats.totalCost / providerStats.operations;
    providerStats.avgTokensPerOperation = (providerStats.totalInputTokens + providerStats.totalOutputTokens) / providerStats.operations;
  }

  // Get unique models used
  const modelsUsed = [...new Set(providerOperations.map((record: any) => {
    const modelData = costTracker.getModelCostData(record.model);
    return modelData?.name || record.model;
  }))];

  // Calculate cost efficiency (tokens per dollar)
  const tokensPerDollar = providerStats.totalCost > 0 
    ? (providerStats.totalInputTokens + providerStats.totalOutputTokens) / providerStats.totalCost 
    : 0;

  const formatCurrency = (value: number): string => {
    return value.toFixed(5);
  };

  const formatLargeNumber = (value: number): string => {
    return value.toLocaleString();
  };

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center text-gray-900">
          <BarChart3 className="h-5 w-5 mr-2" />
          Session Summary - {activeProvider === 'openai' ? 'OpenAI' : 'Claude'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600">Operations</div>
            <div className="text-xl font-medium text-gray-900">{providerStats.operations}</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600">Total Cost</div>
            <div className="text-xl font-medium text-gray-800">${formatCurrency(providerStats.totalCost)}</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600">Total Tokens</div>
            <div className="text-xl font-medium text-gray-700">
              {formatLargeNumber(providerStats.totalInputTokens + providerStats.totalOutputTokens)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600">Efficiency</div>
            <div className="text-xl font-medium text-gray-600">
              {tokensPerDollar > 0 ? Math.round(tokensPerDollar).toLocaleString() : '0'} tok/$
            </div>
          </div>
        </div>

        {/* Token Breakdown */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h4 className="font-medium mb-2 flex items-center text-gray-800">
            <Calculator className="h-4 w-4 mr-1" />
            Token Usage Breakdown
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Input Tokens</div>
              <div className="font-mono text-lg text-gray-800">{formatLargeNumber(providerStats.totalInputTokens)}</div>
              <div className="text-xs text-gray-500">
                Avg: {formatLargeNumber(Math.round(providerStats.totalInputTokens / Math.max(providerStats.operations, 1)))} per op
              </div>
            </div>
            <div>
              <div className="text-gray-600">Output Tokens</div>
              <div className="font-mono text-lg text-gray-800">{formatLargeNumber(providerStats.totalOutputTokens)}</div>
              <div className="text-xs text-gray-500">
                Avg: {formatLargeNumber(Math.round(providerStats.totalOutputTokens / Math.max(providerStats.operations, 1)))} per op
              </div>
            </div>
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h4 className="font-medium mb-2 flex items-center text-gray-800">
            <TrendingUp className="h-4 w-4 mr-1" />
            Cost Analysis
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Average per Operation</div>
              <div className="font-mono text-lg text-gray-800">${formatCurrency(providerStats.avgCostPerOperation)}</div>
            </div>
            <div>
              <div className="text-gray-600">Average Tokens per Operation</div>
              <div className="font-mono text-lg text-gray-800">{formatLargeNumber(Math.round(providerStats.avgTokensPerOperation))}</div>
            </div>
          </div>
          
          {/* Budget Status */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Budget Remaining</span>
              <span className="font-medium text-gray-800">${costTracker.remainingBudget[activeProvider].toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-gray-600 h-2 rounded-full" 
                style={{ 
                  width: `${Math.max(0, Math.min(100, (costTracker.remainingBudget[activeProvider] / 500) * 100))}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Models Used */}
        {modelsUsed.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h4 className="font-medium mb-2 flex items-center text-gray-800">
              <Clock className="h-4 w-4 mr-1" />
              Models Used
            </h4>
            <div className="flex flex-wrap gap-2">
              {modelsUsed.map((model: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-gray-200">
                  {model}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionSummary; 