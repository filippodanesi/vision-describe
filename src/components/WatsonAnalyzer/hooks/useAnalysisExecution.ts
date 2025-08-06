
import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { TextStats } from './useInputManagement';
import { WatsonFeatures, WatsonLimits, TONE_SUPPORTED_LANGUAGES } from './useAnalysisFeatures';

interface AnalysisExecutionProps {
  text: string;
  features: WatsonFeatures;
  limits: WatsonLimits;
  language: string;
  toneModel: string;
  getCurrentApiKey: () => string;
  getCurrentUrl: () => string;
  getAuthType: () => string;
  updateTextStats: (text: string) => TextStats;
}

export const useAnalysisExecution = ({
  text,
  features,
  limits,
  language,
  toneModel,
  getCurrentApiKey,
  getCurrentUrl,
  getAuthType,
  updateTextStats
}: AnalysisExecutionProps) => {
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [lastAnalyzedFeatures, setLastAnalyzedFeatures] = useState<WatsonFeatures | null>(null);

  // Reset results when features change significantly from last analyzed features
  useEffect(() => {
    // Only check if we have previous results and features
    if (results && lastAnalyzedFeatures) {
      // Check if tone analysis was toggled
      const toneWasToggled = 
        features.classifications !== lastAnalyzedFeatures.classifications;
      
      // If tone analysis was toggled, we should mark that a new analysis is needed
      if (toneWasToggled) {
        console.log("Tone analysis feature was toggled, new analysis will be needed");
      }
    }
  }, [features, lastAnalyzedFeatures, results]);

  const handleAnalyze = async () => {
    if (!text) {
      toast({
        title: "No text provided",
        description: "Please enter text to analyze.",
        variant: "destructive",
      });
      return;
    }

    // Get current credentials
    const currentApiKey = getCurrentApiKey();
    const currentUrl = getCurrentUrl();

    if (!currentApiKey) {
      toast({
        title: "API Key required",
        description: "Please enter your IBM Watson NLU API key or enable secrets.",
        variant: "destructive",
      });
      return;
    }

    if (!currentUrl) {
      toast({
        title: "URL required",
        description: "Please provide a valid URL for the IBM Watson NLU service.",
        variant: "destructive",
      });
      return;
    }

    // Start analysis
    setIsAnalyzing(true);

    // Calculate text statistics
    const stats = updateTextStats(text);

    // Check if text is too long for tone analysis (2000 codepoints limit)
    const textCodepoints = [...text].length;
    const isToneTextTooLong = textCodepoints > 2000;
    
    if (features.classifications && isToneTextTooLong) {
      console.log(`Text too long for tone analysis: ${textCodepoints} codepoints (limit: 2000)`);
    }

    // Prepare parameters for API request
    const featuresParams: any = {};
    
    if (features.keywords) {
      featuresParams.keywords = { 
        limit: limits.keywords,
        sentiment: true 
      };
    }
    
    if (features.entities) {
      featuresParams.entities = { 
        limit: limits.entities,
        sentiment: true 
      };
    }
    
    if (features.concepts) {
      featuresParams.concepts = { 
        limit: limits.concepts 
      };
    }
    
    if (features.categories) {
      featuresParams.categories = { 
        limit: limits.categories 
      };
    }
    
    // For tone analysis - only include if text is not too long
    if (features.classifications && !isToneTextTooLong) {
      console.log(`Adding classifications with model: ${toneModel}, language: ${language}`);
      featuresParams.classifications = {
        model: toneModel
      };
    } else if (features.classifications && isToneTextTooLong) {
      console.log("Skipping tone analysis due to text length limit");
    }

    const requestData = {
      text: text,
      features: featuresParams,
      language: language
    };

    console.log("Sending API request with data:", JSON.stringify(requestData));

    try {
      // Determine the authentication method based on environment variables
      const authType = getAuthType();
      let headers = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header based on auth type
      if (authType === "iam") {
        headers['Authorization'] = `Basic ${btoa(`apikey:${currentApiKey}`)}`;
      } else {
        headers['Authorization'] = `Bearer ${currentApiKey}`;
      }

      const response = await fetch(currentUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const data = await response.json();
      console.log("API response received:", data);
      
      // Add warning about tone analysis if text was too long
      if (features.classifications && isToneTextTooLong) {
        if (!data.warnings) data.warnings = [];
        data.warnings.push(`Tone analysis skipped: Text exceeds 2000 character limit (${textCodepoints} characters)`);
      }
      
      setResults(data);
      
      // Save the features used for this analysis to track changes
      setLastAnalyzedFeatures({...features});
      
      let toastMessage = "The text was successfully analyzed.";
      if (features.classifications && isToneTextTooLong) {
        toastMessage += " Note: Tone analysis was skipped due to text length.";
      }
      
      toast({
        title: "Analysis completed",
        description: toastMessage,
      });
    } catch (error) {
      console.error('Error analyzing text:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    results,
    handleAnalyze
  };
};
