import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Home } from "lucide-react";

// Import for CorsProxy
import CorsProxy from './CorsProxy';

interface HeaderProps {
  credentialsFileExists?: boolean;
}

const BudgetIndicator: React.FC = () => null;

const Header: React.FC<HeaderProps> = ({ credentialsFileExists }) => {
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
