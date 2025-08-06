
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
    badgeClass = "bg-green-100 text-green-800 border-green-300";
    indicator = "✓";
  } else if (status === "partial") {
    badgeVariant = "outline";
    badgeClass = "bg-amber-100 text-amber-800 border-amber-300";
    indicator = "~";
  } else if (status === "relevant") {
    badgeVariant = "secondary";
    badgeClass = "bg-blue-100 text-blue-800 border-blue-300";
    indicator = "•";
  } else {
    badgeClass = "bg-red-100 text-red-800 border-red-300";
  }
  
  return (
    <Badge 
      variant={badgeVariant}
      className={`${badgeClass} font-medium`}
    >
      <span className="mr-1">{keyword}</span>
      <span className="font-bold">{indicator}</span>
    </Badge>
  );
};

export default KeywordStatusBadge;
