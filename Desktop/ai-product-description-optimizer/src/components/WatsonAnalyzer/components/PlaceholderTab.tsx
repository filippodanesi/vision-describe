import React from 'react';
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PlaceholderTabProps {
  message: string;
  helpText?: string;
}

const PlaceholderTab: React.FC<PlaceholderTabProps> = ({ message, helpText }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center p-8 border rounded-md">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <AlertCircle size={16} />
          <p>{message}</p>
        </div>
      </div>
      
      {helpText && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Note on text analysis</AlertTitle>
          <AlertDescription className="text-sm">
            {helpText}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PlaceholderTab;
