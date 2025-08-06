
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getFeatureTypeVariant } from "./utils";

interface FeatureItemProps {
  feature: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ feature }) => {
  const [type, description] = feature.split(": ");
  
  return (
    <li className="flex items-start gap-2">
      <Badge 
        variant={getFeatureTypeVariant(feature)}
        className="mt-0.5 px-1.5 py-0 text-xs font-normal whitespace-nowrap"
      >
        {type}
      </Badge>
      <span className="text-muted-foreground">{description}</span>
    </li>
  );
};

export default FeatureItem;
