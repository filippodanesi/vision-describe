import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, RefreshCw } from "lucide-react";
import type { AIProvider } from '../../hooks/useTextOptimization';

interface BudgetConfigSectionProps {
  costTracker: any;
  activeProvider: AIProvider;
}

const BudgetConfigSection: React.FC<BudgetConfigSectionProps> = ({ 
  costTracker, 
  activeProvider 
}) => {
  const [customBudget, setCustomBudget] = React.useState<string>('');

  if (!costTracker) return null;

  const currentBudget = costTracker.remainingBudget[activeProvider];
  const defaultBudget = 500.00;

  const handleSetBudget = () => {
    const amount = parseFloat(customBudget);
    if (!isNaN(amount) && amount > 0) {
      costTracker.setBudget(activeProvider, amount);
      setCustomBudget('');
    }
  };

  const handleResetBudget = () => {
    costTracker.setBudget(activeProvider, defaultBudget);
  };

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center text-gray-900">
          <DollarSign className="h-4 w-4 mr-1" />
          Budget Management - {activeProvider === 'openai' ? 'OpenAI' : 'Anthropic'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Current Budget:</span>
            <span className="font-mono font-medium text-gray-900">
              ${currentBudget.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gray-600 h-2 rounded-full transition-all duration-300" 
              style={{ 
                width: `${Math.max(0, Math.min(100, (currentBudget / defaultBudget) * 100))}%` 
              }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="budget-input" className="text-sm font-medium text-gray-700">
              Set New Budget
            </Label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="budget-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter amount"
                  value={customBudget}
                  onChange={(e) => setCustomBudget(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <Button 
                onClick={handleSetBudget}
                disabled={!customBudget || isNaN(parseFloat(customBudget)) || parseFloat(customBudget) <= 0}
                size="sm"
                className="bg-gray-600 hover:bg-gray-700"
              >
                Set
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleResetBudget}
            variant="outline" 
            size="sm"
            className="w-full text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to ${defaultBudget.toFixed(0)}
          </Button>
        </div>

        <div className="text-xs text-gray-500 border-t pt-3">
          <p>This budget helps you track spending and will show warnings when you approach the limit.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetConfigSection; 