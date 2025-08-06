
import React from 'react';
import { 
  Input 
} from "@/components/ui/input";
import { 
  Label 
} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface ApiKeyProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  region: string;
  setRegion: (region: string) => void;
  url: string;
  setUrl: (url: string) => void;
  instanceId: string;
  setInstanceId: (id: string) => void;
}

const regionOptions = {
  "us-south": "Dallas (us-south)",
  "us-east": "Washington DC (us-east)",
  "eu-de": "Frankfurt (eu-de)",
  "eu-gb": "London (eu-gb)",
  "au-syd": "Sydney (au-syd)",
  "jp-tok": "Tokyo (jp-tok)",
  "kr-seo": "Seoul (kr-seo)"
};

export const ApiKeySection: React.FC<ApiKeyProps> = ({
  apiKey,
  setApiKey,
  region,
  setRegion,
  url,
  setUrl,
  instanceId,
  setInstanceId
}) => {
  const handleRegionChange = (value: string) => {
    setRegion(value);
    if (value !== "custom") {
      setUrl(`https://api.${value}.natural-language-understanding.watson.cloud.ibm.com/instances/`);
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Label htmlFor="api-key">API Key</Label>
        <Input
          id="api-key"
          type="password"
          placeholder="Enter your IBM Watson NLU API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="region">Region</Label>
        <Select value={region} onValueChange={handleRegionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(regionOptions).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instance-id">Instance ID</Label>
        <Input
          id="instance-id"
          placeholder="Enter your IBM Watson NLU instance ID"
          value={instanceId}
          onChange={(e) => setInstanceId(e.target.value)}
        />
      </div>
    </div>
  );
};
