
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface OptimizationAlertsProps {
  needsOptimization: boolean;
  keywordsToOptimize: string[];
  keywordsWithPartialMatch: string[];
}

/**
 * Displays appropriate alerts based on keyword optimization status
 */
const OptimizationAlerts: React.FC<OptimizationAlertsProps> = ({ 
  needsOptimization,
  keywordsToOptimize,
  keywordsWithPartialMatch 
}) => {
  if (needsOptimization) {
    return (
      <Alert variant="info" className="bg-blue-50 text-blue-800 border-blue-200">
        <AlertTitle>Optimization Recommended</AlertTitle>
        <AlertDescription>
          Some of your target keywords ({keywordsToOptimize.join(', ')}) were not found in the analysis.
          AI optimization can help integrate these keywords into the text.
        </AlertDescription>
      </Alert>
    );
  } else if (keywordsWithPartialMatch.length > 0) {
    return (
      <Alert variant="warning" className="bg-amber-50 text-amber-800 border-amber-200">
        <AlertTitle>Partial Optimization Recommended</AlertTitle>
        <AlertDescription>
          Some keywords have only partial matches. Consider optimization to improve exact keyword matching.
        </AlertDescription>
      </Alert>
    );
  } else {
    return (
      <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
        <AlertTitle>Well Optimized Text</AlertTitle>
        <AlertDescription>
          All your target keywords have exact matches in the analysis.
        </AlertDescription>
      </Alert>
    );
  }
};

export default OptimizationAlerts;
