
import React from 'react';
import { Badge } from "@/components/ui/badge";
import type { KeywordStatus } from '../../hooks/useTextOptimization';

interface KeywordStatusBadgeProps {
  keyword: string;
  status: KeywordStatus;
}

/**
 * Displays a keyword with a visual indicator of its match status
 */
const KeywordStatusBadge: React.FC<KeywordStatusBadgeProps> = ({ keyword, status }) => {
  let badgeVariant: "default" | "destructive" | "outline" | "secondary" = "default";
  let badgeClass = "";
  let indicator = "✗";
  
  if (status === "exact") {
    badgeVariant = "outline";
    badgeClass = "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800";
    indicator = "✓";
  } else if (status === "partial") {
    badgeVariant = "outline";
    badgeClass = "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800";
    indicator = "~";
  } else if (status === "relevant") {
    badgeVariant = "secondary";
    badgeClass = "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800";
    indicator = "•";
  } else {
    badgeClass = "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800";
  }
  
  return (
    <Badge 
      variant={badgeVariant}
      className={`${badgeClass} font-medium`}
    >
      <span className="mr-1">{keyword}</span>
      <span className="font-medium">{indicator}</span>
    </Badge>
  );
};

export default KeywordStatusBadge;
