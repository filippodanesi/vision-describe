
import React from 'react';
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const EmptyEntitiesState: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center p-8 border rounded-md">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <AlertCircle size={16} />
          <p>No entities found in the analyzed text.</p>
        </div>
      </div>
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Limited entity detection</AlertTitle>
        <AlertDescription>
          Try incorporating more specific named entities in your text, such as people (John Smith), 
          organizations (Microsoft), locations (Paris), dates (January 2023), etc. IBM Watson can detect 
          over 100 different entity types, but they need to be clearly present in the text.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EmptyEntitiesState;
