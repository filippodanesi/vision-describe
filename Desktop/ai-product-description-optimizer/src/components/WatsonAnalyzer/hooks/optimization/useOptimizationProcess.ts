import { useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { optimizeTextWithAI } from '../../utils/optimizationUtils';
import { useCostTracker } from '../useCostTracker';
import { useKeywordAnalysis } from './useKeywordAnalysis';
import { getModelById } from '@/lib/models';
import type { AIProvider } from './useOptimizationConfig';

interface UseOptimizationProcessProps {
  text: string;
  results: any;
  targetKeywords: string[];
  apiKey: string;
  aiModel: string;
  aiProvider: AIProvider;
}

export const useOptimizationProcess = ({ text, results, targetKeywords, apiKey, aiModel, aiProvider }: UseOptimizationProcessProps) => {
  const costTracker = useCostTracker();
  const { mockAnalysisForKeywords } = useKeywordAnalysis(results);
  
  // State for optimization
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedText, setOptimizedText] = useState("");
  const [optimizedResults, setOptimizedResults] = useState<any>(null);
  const [lastCostRecord, setLastCostRecord] = useState<any>(null);
  
  // Handle optimize button click
  const handleOptimize = async () => {
    if (!text) {
      toast({
        title: "No text provided",
        description: "Please enter text to optimize.",
        variant: "destructive",
      });
      return;
    }
    
    if (!apiKey) {
      toast({
        title: "API Key required",
        description: "Please enter your API key in the AI Configuration.",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting optimization process with:", {
      provider: aiProvider,
      model: aiModel,
      textLength: text.length,
      keywordsCount: targetKeywords.length
    });

    // Validate API key format
    if (aiProvider === "anthropic" && !apiKey.startsWith("sk-ant-") && !apiKey.startsWith("sk-")) {
      console.warn("Claude API key format warning - should start with 'sk-ant-'");
      toast({
        title: "API Key format warning",
        description: "Claude API keys typically start with 'sk-ant-'. Your key may not be valid.",
        variant: "warning",
      });
    } else if (aiProvider === "openai" && !apiKey.startsWith("sk-")) {
      console.warn("OpenAI API key format warning - should start with 'sk-'");
      toast({
        title: "API Key format warning",
        description: "OpenAI API keys typically start with 'sk-'. Your key may not be valid.",
        variant: "warning",
      });
    }
    
    setIsOptimizing(true);
    try {
      console.log(`Starting optimization with ${aiProvider} model: ${aiModel}`);
      
      // Get the model object from the model ID
      const modelObj = getModelById(aiModel);
      if (!modelObj) {
        throw new Error(`Model ${aiModel} not found`);
      }
      
      const optimizationResult = await optimizeTextWithAI(
        text,
        targetKeywords,
        results,
        modelObj,
        apiKey
      );
      
      console.log("Optimization successful, result length:", optimizationResult?.content?.length || 0);
      console.log("Token usage:", optimizationResult.tokens);
      
      // Verify we have content before setting state
      if (!optimizationResult.content || optimizationResult.content.trim() === "") {
        throw new Error("The AI returned an empty response. Please try again or try a different model.");
      }
      
      setOptimizedText(optimizationResult.content);
      
      // Create analysis results for the optimized text to check keywords
      const mockResults = mockAnalysisForKeywords(optimizationResult.content, targetKeywords);
      
      // Store optimized text within the mock results for better analysis
      mockResults.optimizedText = optimizationResult.content;
      
      setOptimizedResults(mockResults);
      console.log("Created mock results for optimized text:", mockResults);
      
      // Track the cost of this optimization with actual token counts
      const costRecord = costTracker.trackOperation(
        aiModel, 
        text, 
        optimizationResult.content,
        {
          inputTokens: optimizationResult.tokens.inputTokens,
          outputTokens: optimizationResult.tokens.outputTokens
        }
      );
      setLastCostRecord(costRecord);
      
      const remainingBudget = costTracker.remainingBudget[aiProvider];
      const actualCost = costRecord?.actualCost;
      
      toast({
        title: "Text optimized",
        description: `Text optimized successfully. Cost: $${actualCost ? actualCost.toFixed(5) : costRecord?.estimatedCost.toFixed(5) || '0.00'} (${optimizationResult.tokens.inputTokens + optimizationResult.tokens.outputTokens} tokens), Remaining budget: $${remainingBudget.toFixed(2)}`,
      });
    } catch (error: any) {
      console.error("Error optimizing text:", error);
      
      // Provide more specific error messages
      let errorMessage = error instanceof Error ? error.message : "An error occurred during optimization.";
      
      // Add specific suggestions for common errors
      if (errorMessage.includes("401") || errorMessage.includes("authentication") || errorMessage.includes("invalid")) {
        errorMessage = "Authentication failed. Please check your API key in the AI Configuration.";
      } else if (errorMessage.includes("CORS")) {
        errorMessage = "CORS error detected. Try using a different CORS proxy in settings or switch to OpenAI.";
      } else if (errorMessage.includes("o4") && errorMessage.includes("max_tokens")) {
        errorMessage = "Error with o4-mini model. Use a different model like gpt-4o or try again (the system has updated the parameters).";
      } else if (errorMessage.includes("max_completion_tokens") || errorMessage.includes("The property")) {
        errorMessage = "API parameter error. Try switching to a different model such as gpt-4o or gpt-3.5-turbo.";
      }
      
      toast({
        title: "Optimization failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Don't clear optimization state on error if we already have results
      if (!optimizedText) {
        setOptimizedText("");
        setOptimizedResults(null);
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  return {
    costTracker,
    lastCostRecord,
    isOptimizing,
    optimizedText,
    optimizedResults,
    handleOptimize
  };
};
