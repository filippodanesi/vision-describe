
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface EntityStatsDisplayProps {
  entityTypes: string[];
  entities: any[];
  totalEntityCount: number;
  entityTypeCount: number;
  multiWordEntitiesCount: number;
}

const EntityStatsDisplay: React.FC<EntityStatsDisplayProps> = ({
  entityTypes,
  entities,
  totalEntityCount,
  entityTypeCount,
  multiWordEntitiesCount
}) => {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-medium mb-2">Entity Types Distribution</h3>
      <div className="flex flex-wrap gap-2">
        {entityTypes.map(type => (
          <Badge key={type} variant="outline" className="bg-secondary">
            {type}: {entities.filter(e => e.type === type).length}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default EntityStatsDisplay;
