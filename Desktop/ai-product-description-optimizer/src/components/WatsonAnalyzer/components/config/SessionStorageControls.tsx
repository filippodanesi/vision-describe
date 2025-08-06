
import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, Clipboard } from "lucide-react";
import { toast } from "sonner";

interface SessionStorageControlsProps {
  apiKey: string;
  url: string;
  region: string;
  instanceId: string;
}

// Storage key
const SESSION_STORAGE_KEY = 'watson_credentials';

export const SessionStorageControls: React.FC<SessionStorageControlsProps> = ({
  apiKey,
  url,
  region,
  instanceId
}) => {
  const handleSaveCredentials = () => {
    const credentials = {
      apiKey,
      url,
      region,
      instanceId
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(credentials));
    toast.success("Credentials saved to session");
  };

  const handleLoadCredentials = () => {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  };

  return (
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex-1"
        onClick={handleSaveCredentials}
      >
        <Save className="h-4 w-4 mr-2" />
        Save to Session
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex-1"
        onClick={() => {
          const credentials = handleLoadCredentials();
          if (credentials) {
            toast.success("Credentials loaded from session");
            return credentials;
          } else {
            toast.error("No saved credentials found");
            return null;
          }
        }}
      >
        <Clipboard className="h-4 w-4 mr-2" />
        Load from Session
      </Button>
    </div>
  );
};
