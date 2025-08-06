
import React from 'react';
import { Badge } from "@/components/ui/badge";

/**
 * Displays a legend explaining the different keyword match statuses
 */
const KeywordStatusLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      <Badge variant="outline" className="bg-green-100 text-green-800 h-5 w-5 flex items-center justify-center p-0">✓</Badge>
      <span className="mr-3">Exact match</span>
      <Badge variant="outline" className="bg-amber-100 text-amber-800 h-5 w-5 flex items-center justify-center p-0">~</Badge>
      <span className="mr-3">Partial match</span>
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 h-5 w-5 flex items-center justify-center p-0">•</Badge>
      <span className="mr-3">Relevant</span>
      <Badge variant="default" className="bg-red-100 text-red-800 h-5 w-5 flex items-center justify-center p-0">✗</Badge>
      <span>No match</span>
    </div>
  );
};

export default KeywordStatusLegend;
