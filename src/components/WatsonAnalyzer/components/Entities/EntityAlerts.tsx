
import React from 'react';
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EntityAlertsProps {
  entities: any[];
  entityTypeCount: number;
  totalEntityCount: number;
}

const EntityAlerts: React.FC<EntityAlertsProps> = ({ 
  entities, 
  entityTypeCount, 
  totalEntityCount 
}) => {
  return (
    <>
      <Alert variant="info" className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Named Entity Recognition (NER) identifies elements like people, organizations, locations, dates and more.
          For example: In "Rita is an IBM employee based in London", "Rita" is a person, "IBM" is an organization, 
          and "London" is a location.
        </AlertDescription>
      </Alert>

      {entities.length <= 5 && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Limited entity detection</AlertTitle>
          <AlertDescription>
            Only {entities.length} {entities.length === 1 ? 'entity was' : 'entities were'} detected. 
            Try including more diverse named entities in your text like people, organizations, locations, 
            dates, etc. Consider increasing the entity limit in the configuration panel.
          </AlertDescription>
        </Alert>
      )}

      {entityTypeCount === 1 && totalEntityCount > 1 && (
        <Alert variant="info" className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            All detected entities are of the same type ({entities[0].type}). Consider diversifying your text with different 
            entity types for more comprehensive analysis.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default EntityAlerts;
