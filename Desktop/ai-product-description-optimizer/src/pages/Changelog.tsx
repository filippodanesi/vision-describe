import React from 'react';
import Footer from '@/components/WatsonAnalyzer/components/Footer';
import ChangelogHeader from '@/components/Changelog/ChangelogHeader';
import ChangelogContent from '@/components/Changelog/ChangelogContent';
import { VersionData } from '@/components/Changelog/types';

const Changelog: React.FC = () => {
  const versions: VersionData[] = [
    {
      version: "1.1.8",
      date: "May 24, 2025",
      type: "MAJOR",
      features: [
        "MAJOR: Added multi-model optimization support for OpenAI and Anthropic",
        "IMPLEMENT: Integrated OpenAI models (o4-mini, o3) for text optimization",
        "IMPLEMENT: Added Anthropic Claude models (Claude 4 Sonnet, Claude 4 Opus) support",
        "ENHANCEMENT: Created unified AnalyzerService for seamless model switching",
        "IMPLEMENT: Added cost-effective and high-performance model categorization",
        "ENHANCEMENT: Improved model selection with provider-specific configurations",
        "UPDATE: Enhanced optimization workflow with multiple AI provider support"
      ]
    },
    {
      version: "1.1.7",
      date: "May 23, 2025",
      type: "ADD",
      features: [
        "IMPLEMENT: Added support for Claude 4 Sonnet model with accurate pricing",
        "ENHANCEMENT: Updated cost tracking with precise Claude model pricing ($3/$15 per MTok for Sonnet 4)",
        "UPDATE: Restricted Claude models to only Sonnet 4 and Sonnet 3.7 for optimal performance",
        "FIX: Corrected cost calculation dashboard to match actual Claude API usage",
        "ENHANCEMENT: Improved model selection in Anthropic configuration with latest pricing",
        "IMPLEMENT: Added detailed cost tooltips showing input/output token pricing"
      ]
    },
    {
      version: "1.1.6",
      date: "May 20, 2025",
      type: "IMPROVE",
      features: [
        "ENHANCEMENT: Improved entity detection visualization with type grouping",
        "ENHANCEMENT: Added alerts for low entity detection",
        "FIX: Added info variant to Alert component",
        "IMPLEMENT: Enabled tone analysis by default",
        "ENHANCE: Increased default keyword limit to 20"
      ]
    },
    {
      version: "1.1.5",
      date: "May 20, 2025",
      type: "FIX",
      features: [
        "FIX: Fixed import errors in useOptimizationProcess.ts",
        "FIX: Corrected import paths for optimization modules",
        "ENHANCEMENT: Improved error handling for AI models"
      ]
    },
    {
      version: "1.1.4",
      date: "May 19, 2025",
      type: "IMPROVE",
      features: [
        "ENHANCEMENT: Enhanced product entity identification in text analysis",
        "ENHANCEMENT: Improved keyword matching in optimized texts",
        "ENHANCEMENT: Enhanced entity recognition in optimized text"
      ]
    },
    {
      version: "1.1.3",
      date: "May 18, 2025",
      type: "FIX",
      features: [
        "FIX: Fixed issue with o4-mini model",
        "UPDATE: Updated openAiUtils.ts to use max_completion_tokens instead of max_tokens",
        "ENHANCEMENT: Improved AI model-specific error messages"
      ]
    },
    {
      version: "1.1.2",
      date: "May 17, 2025",
      type: "IMPROVE",
      features: [
        "ENHANCEMENT: Optimized user interface for text analysis",
        "ENHANCEMENT: Enhanced user experience in the results panel",
        "ENHANCEMENT: Refined keyword recognition system"
      ]
    },
    {
      version: "1.1.1",
      date: "May 16, 2025",
      type: "IMPROVE",
      features: [
        "IMPLEMENT: Added support for additional languages in tone analysis",
        "ENHANCEMENT: Improved entity processing algorithm",
        "ENHANCEMENT: Optimized performance for analyzing long texts"
      ]
    },
    {
      version: "1.1.0",
      date: "May 15, 2025",
      type: "MAJOR",
      features: [
        "MAJOR: Added text optimization functionality with AI",
        "IMPLEMENT: Implemented support for OpenAI and Claude",
        "IMPLEMENT: Integrated cost monitoring for AI APIs"
      ]
    },
    {
      version: "1.0.0",
      date: "May 14, 2025",
      type: "MAJOR",
      features: [
        "MAJOR: Initial application release",
        "IMPLEMENT: Implemented basic interface for text analysis",
        "IMPLEMENT: Integrated with IBM Watson Natural Language Understanding API",
        "IMPLEMENT: Added support for keywords, entities, concepts, and categories analysis"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ChangelogHeader />
      <ChangelogContent versions={versions} />
      <Footer />
    </div>
  );
};

export default Changelog;
