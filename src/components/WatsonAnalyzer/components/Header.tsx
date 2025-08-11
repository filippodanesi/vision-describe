import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCostTracker } from '../hooks/useCostTracker';
import { Home } from "lucide-react";

// Import for CorsProxy
import CorsProxy from './CorsProxy';

interface HeaderProps {
  credentialsFileExists?: boolean;
  budgetUpdateTrigger?: number;
}

const BudgetIndicator: React.FC = () => {
  const costTracker = useCostTracker();
  
  if (!costTracker) return null;
  
  const openAIBudget = costTracker.remainingBudget.openai;
  const anthropicBudget = costTracker.remainingBudget.anthropic;
  const totalSpent = costTracker.totalCost.openai + costTracker.totalCost.anthropic;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-gray-50 border-gray-300">
              OpenAI: ${openAIBudget.toFixed(2)}
            </Badge>
            <Badge variant="outline" className="text-xs bg-gray-50 border-gray-300">
              Claude: ${anthropicBudget.toFixed(2)}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p>Budget remaining:</p>
            <p>OpenAI: ${openAIBudget.toFixed(2)}</p>
            <p>Anthropic: ${anthropicBudget.toFixed(2)}</p>
            <p className="mt-1 pt-1 border-t">
              Total spent: ${totalSpent.toFixed(5)}
            </p>
            <p className="text-gray-400 mt-1">
              Click "Configure AI" to update budgets
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const Header: React.FC<HeaderProps> = ({ credentialsFileExists, budgetUpdateTrigger }) => {
  const hardRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-border">
      <div className="container max-w-7xl mx-auto py-4 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={hardRefresh}
                  className="text-stone-950 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <Home className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Back to home
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {credentialsFileExists && (
            <div className="text-sm text-green-600 ml-4">
              Using credentials from file
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <BudgetIndicator />
          <CorsProxy />
        </div>
      </div>
    </header>
  );
};

export default Header;
