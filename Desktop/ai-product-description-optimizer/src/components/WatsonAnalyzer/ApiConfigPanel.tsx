
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ApiKeySection } from './components/config/ApiKeySection';
import { AnalysisFeaturesSection } from './components/config/AnalysisFeaturesSection';
import { LanguageSection } from './components/config/LanguageSection';
import { LimitsSection } from './components/config/LimitsSection';
import { QuickCredentialsInput } from './components/config/QuickCredentialsInput';
import { SessionStorageControls } from './components/config/SessionStorageControls';

interface ApiConfigPanelProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  url: string;
  setUrl: (url: string) => void;
  region: string;
  setRegion: (region: string) => void;
  instanceId: string;
  setInstanceId: (id: string) => void;
  features: {
    keywords: boolean;
    entities: boolean;
    concepts: boolean;
    categories: boolean;
    classifications: boolean;
  };
  setFeatures: (features: any) => void;
  limits: {
    keywords: number;
    entities: number;
    concepts: number;
    categories: number;
  };
  setLimits: (limits: any) => void;
  language: string;
  setLanguage: (lang: string) => void;
  toneModel: string;
  setToneModel: (model: string) => void;
  credentialsFileExists?: boolean;
  setCredentialsFileExists?: (exists: boolean) => void;
}

const ApiConfigPanel: React.FC<ApiConfigPanelProps> = ({
  apiKey,
  setApiKey,
  url,
  setUrl,
  region,
  setRegion,
  instanceId,
  setInstanceId,
  features,
  setFeatures,
  limits,
  setLimits,
  language,
  setLanguage,
  toneModel,
  setToneModel,
  credentialsFileExists = false,
  setCredentialsFileExists
}) => {
  const handleFeatureChange = (feature: string, value: boolean) => {
    setFeatures({ ...features, [feature]: value });
  };
  
  const handleLimitChange = (feature: string, value: number) => {
    setLimits({ ...limits, [feature]: value });
  };

  return (
    <Card className="w-full bg-background border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <QuickCredentialsInput
          setApiKey={setApiKey}
          setUrl={setUrl}
          setRegion={setRegion}
          setInstanceId={setInstanceId}
          credentialsFileExists={credentialsFileExists}
          setCredentialsFileExists={setCredentialsFileExists}
        />

        <Separator />

        <ApiKeySection 
          apiKey={apiKey}
          setApiKey={setApiKey}
          region={region}
          setRegion={setRegion}
          url={url}
          setUrl={setUrl}
          instanceId={instanceId}
          setInstanceId={setInstanceId}
        />

        <SessionStorageControls
          apiKey={apiKey}
          url={url}
          region={region}
          instanceId={instanceId}
        />

        <Separator />

        <AnalysisFeaturesSection 
          features={features}
          handleFeatureChange={handleFeatureChange}
        />

        <Separator />

        <LanguageSection 
          language={language}
          setLanguage={setLanguage}
        />

        <Separator />

        <LimitsSection 
          limits={limits}
          handleLimitChange={handleLimitChange}
        />
      </CardContent>
    </Card>
  );
};

export default ApiConfigPanel;
