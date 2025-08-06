
import { useState } from 'react';
import { useOptimizationConfig } from './optimization/useOptimizationConfig';
import { useKeywordAnalysis } from './optimization/useKeywordAnalysis';
import { useOptimizationProcess } from './optimization/useOptimizationProcess';

// Define the keyword status type
export type KeywordStatus = "missing" | "exact" | "partial" | "relevant";

// Re-export the AIProvider type
export type { AIProvider } from './optimization/useOptimizationConfig';

interface UseTextOptimizationProps {
  text: string;
  results: any;
  targetKeywords: string[];
}

export const useTextOptimization = ({ text, results, targetKeywords }: UseTextOptimizationProps) => {
  // Get optimization configuration
  const config = useOptimizationConfig();
  
  // Get keyword analysis utilities
  const { checkKeywordStatus } = useKeywordAnalysis(results);
  
  // Get optimization process
  const optimizationProcess = useOptimizationProcess({
    text,
    results,
    targetKeywords,
    apiKey: config.apiKey,
    aiModel: config.aiModel,
    aiProvider: config.aiProvider
  });
  
  // Use optimizedResults if available, otherwise use original results
  const resultsForKeywords = optimizationProcess.optimizedResults || results;
  
  // Get lists of keywords based on their status
  const keywordsToOptimize = targetKeywords.filter(kw => 
    checkKeywordStatus(kw) === "missing"
  );
  
  const keywordsWithPartialMatch = targetKeywords.filter(kw => 
    checkKeywordStatus(kw) === "partial"
  );
  
  // Check if we need optimization
  const needsOptimization = keywordsToOptimize.length > 0;
  
  return {
    // Cost tracking
    costTracker: optimizationProcess.costTracker,
    lastCostRecord: optimizationProcess.lastCostRecord,
    
    // AI configuration
    ...config,
    
    // Optimization state & actions
    isOptimizing: optimizationProcess.isOptimizing,
    optimizedText: optimizationProcess.optimizedText,
    optimizedResults: optimizationProcess.optimizedResults,
    handleOptimize: optimizationProcess.handleOptimize,
    
    // Keywords data
    keywordsToOptimize,
    keywordsWithPartialMatch,
    needsOptimization,
    checkKeywordStatus: (keyword: string) => checkKeywordStatus(keyword, resultsForKeywords)
  };
};
