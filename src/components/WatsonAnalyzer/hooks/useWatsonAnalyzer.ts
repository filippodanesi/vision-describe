
import { useCredentialsConfig } from './useCredentialsConfig';
import { useAnalysisFeatures } from './useAnalysisFeatures';
import { useInputManagement } from './useInputManagement';
import { useAnalysisExecution } from './useAnalysisExecution';

export const useWatsonAnalyzer = () => {
  // Get credentials configuration
  const credentials = useCredentialsConfig();
  
  // Get features and limits
  const features = useAnalysisFeatures();
  
  // Get input management
  const input = useInputManagement();
  
  // Get analysis execution
  const analysis = useAnalysisExecution({
    text: input.text,
    features: features.features,
    limits: features.limits,
    language: features.language,
    toneModel: features.toneModel,
    getCurrentApiKey: credentials.getCurrentApiKey,
    getCurrentUrl: credentials.getCurrentUrl,
    getAuthType: credentials.getAuthType,
    updateTextStats: input.updateTextStats
  });

  return {
    // Credentials configuration
    ...credentials,
    
    // Features and limits
    features: features.features,
    setFeatures: features.setFeatures,
    limits: features.limits,
    setLimits: features.setLimits,
    
    // Language
    language: features.language,
    setLanguage: features.setLanguage,
    
    // Tone model
    toneModel: features.toneModel,
    setToneModel: features.setToneModel,
    
    // Input
    text: input.text,
    setText: input.setText,
    inputMethod: input.inputMethod,
    setInputMethod: input.setInputMethod,
    targetKeywords: input.targetKeywords,
    setTargetKeywords: input.setTargetKeywords,
    
    // Analysis
    isAnalyzing: analysis.isAnalyzing,
    results: analysis.results,
    textStats: input.textStats,
    
    // Actions
    handleAnalyze: analysis.handleAnalyze,
    getTargetKeywordsList: input.getTargetKeywordsList,
  };
};

// Re-export types for use in other components
export type { 
  WatsonFeatures, 
  WatsonLimits 
} from './useAnalysisFeatures';

export type { 
  TextStats 
} from './useInputManagement';
