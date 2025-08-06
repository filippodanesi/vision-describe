
import React, { useState, useEffect } from 'react';

export interface WatsonFeatures {
  keywords: boolean;
  entities: boolean;
  concepts: boolean;
  categories: boolean;
  classifications: boolean; // Support for tone analysis
}

export interface WatsonLimits {
  keywords: number;
  entities: number;
  concepts: number;
  categories: number;
}

// Array of supported languages for tone analysis
export const TONE_SUPPORTED_LANGUAGES = ["en", "fr", "auto"];

export const useAnalysisFeatures = () => {
  // Features state
  const [features, setFeatures] = useState<WatsonFeatures>({
    keywords: true,
    entities: true,
    concepts: true,
    categories: true,
    classifications: true, // Default enabled for tone analysis
  });
  
  // Limits state
  const [limits, setLimits] = useState<WatsonLimits>({
    keywords: 20,
    entities: 10,
    concepts: 10,
    categories: 5,
  });
  
  // Language state
  const [language, setLanguage] = useState("auto"); // Default to auto-detect
  
  // Tone model state
  const [toneModel, setToneModel] = useState("tone-classifications-en-v1");
  
  // Update the tone model based on the selected language
  useEffect(() => {
    // Set tone model based on language
    if (language === "fr") {
      setToneModel("tone-classifications-fr-v1");
    } else {
      // Default to English tone model for English or auto-detection
      setToneModel("tone-classifications-en-v1");
    }
    
    console.log(`Language changed to: ${language}, tone model set to: ${language === "fr" ? "tone-classifications-fr-v1" : "tone-classifications-en-v1"}`);
  }, [language]);
  
  return {
    features,
    setFeatures,
    limits,
    setLimits,
    language,
    setLanguage,
    toneModel,
    setToneModel,
    isToneSupportedForLanguage: (lang: string) => TONE_SUPPORTED_LANGUAGES.includes(lang)
  };
};
