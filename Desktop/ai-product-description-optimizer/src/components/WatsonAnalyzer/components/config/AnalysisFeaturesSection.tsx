
import React from 'react';
import { 
  Switch 
} from "@/components/ui/switch";
import { 
  Label 
} from "@/components/ui/label";

interface AnalysisFeaturesProps {
  features: {
    keywords: boolean;
    entities: boolean;
    concepts: boolean;
    categories: boolean;
    classifications: boolean;
  };
  handleFeatureChange: (feature: string, value: boolean) => void;
}

export const AnalysisFeaturesSection: React.FC<AnalysisFeaturesProps> = ({
  features,
  handleFeatureChange
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Analysis Features</h3>
      
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground">Extraction</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="keywords"
              checked={features.keywords}
              onCheckedChange={(checked) => handleFeatureChange("keywords", checked)}
            />
            <Label htmlFor="keywords">Keywords</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="entities"
              checked={features.entities}
              onCheckedChange={(checked) => handleFeatureChange("entities", checked)}
            />
            <Label htmlFor="entities">Entities</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="concepts"
              checked={features.concepts}
              onCheckedChange={(checked) => handleFeatureChange("concepts", checked)}
            />
            <Label htmlFor="concepts">Concepts</Label>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground">Classification</h4>
        <div className="flex items-center space-x-2">
          <Switch
            id="categories"
            checked={features.categories}
            onCheckedChange={(checked) => handleFeatureChange("categories", checked)}
          />
          <Label htmlFor="categories">Categories</Label>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground">Tone Analysis</h4>
        <div className="flex items-center space-x-2">
          <Switch
            id="classifications"
            checked={features.classifications}
            onCheckedChange={(checked) => handleFeatureChange("classifications", checked)}
          />
          <Label htmlFor="classifications">Tone Analysis</Label>
        </div>
      </div>
    </div>
  );
};
