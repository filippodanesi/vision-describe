
import React from 'react';
import { Badge } from "@/components/ui/badge";

/**
 * Displays a legend explaining the different keyword match statuses
 */
const KeywordStatusLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      <Badge variant="outline" className="bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 h-5 w-5 flex items-center justify-center p-0">✓</Badge>
      <span className="mr-3">Exact match</span>
      <Badge variant="outline" className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 h-5 w-5 flex items-center justify-center p-0">~</Badge>
      <span className="mr-3">Partial match</span>
      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 h-5 w-5 flex items-center justify-center p-0">•</Badge>
      <span className="mr-3">Relevant</span>
      <Badge variant="default" className="bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 h-5 w-5 flex items-center justify-center p-0">✗</Badge>
      <span>No match</span>
    </div>
  );
};

export default KeywordStatusLegend;
