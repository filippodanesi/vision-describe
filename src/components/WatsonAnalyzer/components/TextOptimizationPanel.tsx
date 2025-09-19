import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTextOptimization } from '../hooks/useTextOptimization';
import AIOptimizationConfig from './AIOptimizationConfig';
import CostSummary from "./optimization/CostSummary";
import SessionSummary from "./optimization/SessionSummary";
import BudgetConfigSection from "./optimization/BudgetConfigSection";
import KeywordStatusBadge from "./optimization/KeywordStatusBadge";
import KeywordStatusLegend from "./optimization/KeywordStatusLegend";
import OptimizationAlerts from "./optimization/OptimizationAlerts";
import OptimizedTextDisplay from "./optimization/OptimizedTextDisplay";

interface TextOptimizationPanelProps {
  text: string;
  results: any;
  targetKeywords: string[];
  onOptimizedTextSelect: (text: string) => void;
}

const TextOptimizationPanel: React.FC<TextOptimizationPanelProps> = ({
  text,
  results,
  targetKeywords,
  onOptimizedTextSelect
}) => {
  const {
    // Cost tracking
    costTracker,
    lastCostRecord,
    
    // API configuration
    apiKey,
    setApiKey,
    aiModel,
    setAiModel,
    aiProvider,
    setAiProvider,
    
    // Provider-specific API keys
    openAIKey,
    anthropicKey,
    
    // Optimization states
    isOptimizing,
    optimizedText,
    optimizedResults,
    keywordsToOptimize,
    keywordsWithPartialMatch,
    needsOptimization,
    handleOptimize,
    checkKeywordStatus
  } = useTextOptimization({ text, results, targetKeywords });
  
  // Use optimizedResults if available, otherwise use original results
  const resultsForKeywords = optimizedResults || results;
  
  const handleUseOptimized = () => {
    onOptimizedTextSelect(optimizedText);
    toast({
      title: "Text Updated",
      description: "The optimized text has been selected for analysis.",
    });
  };

  if (!results || targetKeywords.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="w-full bg-background border-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-semibold">AI Optimization</CardTitle>
              <CardDescription>
                Optimize text for target keywords using AI
              </CardDescription>
            </div>
            <AIOptimizationConfig 
              apiKey={apiKey} 
              setApiKey={setApiKey} 
              aiModel={aiModel} 
              setAiModel={setAiModel}
              aiProvider={aiProvider}
              setAiProvider={setAiProvider}
              openAIKey={openAIKey}
              anthropicKey={anthropicKey}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Cost Summary and Budget Configuration */}
          <div className="grid gap-4 md:grid-cols-2">
            <CostSummary 
              costTracker={costTracker} 
              activeProvider={aiProvider}
              lastCostRecord={lastCostRecord}
            />
            <BudgetConfigSection 
              costTracker={costTracker}
              activeProvider={aiProvider}
            />
          </div>
          
          {targetKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {targetKeywords.map((keyword, index) => (
                <KeywordStatusBadge 
                  key={index} 
                  keyword={keyword} 
                  status={checkKeywordStatus(keyword)} 
                />
              ))}
            </div>
          )}

          <KeywordStatusLegend />

          <OptimizationAlerts 
            needsOptimization={needsOptimization}
            keywordsToOptimize={keywordsToOptimize}
            keywordsWithPartialMatch={keywordsWithPartialMatch}
          />

          <OptimizedTextDisplay 
            originalText={text}
            optimizedText={optimizedText}
          />
        </CardContent>

        <CardFooter className="flex justify-between gap-2">
          <Button 
            onClick={handleOptimize}
            disabled={isOptimizing || (!needsOptimization && keywordsWithPartialMatch.length === 0) || !apiKey}
            className="flex-1"
            variant={(needsOptimization || keywordsWithPartialMatch.length > 0) ? "default" : "outline"}
          >
            {isOptimizing ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" /> 
                Optimizing...
              </>
            ) : (
              'Optimize Text'
            )}
          </Button>
          
          {optimizedText && (
            <Button 
              onClick={handleUseOptimized}
              className="flex-1"
            >
              Use Optimized Text
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Session Summary - shown only when there are operations */}
      {costTracker && costTracker.getSessionStats().totalOperations > 0 && (
        <SessionSummary 
          costTracker={costTracker}
          activeProvider={aiProvider}
        />
      )}
    </div>
  );
};

export default TextOptimizationPanel;
