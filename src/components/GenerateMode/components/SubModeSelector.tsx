import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera, FileSpreadsheet } from 'lucide-react';
import { GenerateSubMode } from '../types';

interface SubModeSelectorProps {
  onSelect: (mode: GenerateSubMode) => void;
}

export const SubModeSelector: React.FC<SubModeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-foreground">Generate New Content</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how you want to generate product descriptions
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm"
          onClick={() => onSelect(GenerateSubMode.IMAGE_ANALYSIS)}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-base">Image Analysis</CardTitle>
            <CardDescription className="text-xs">
              Generate product descriptions from photos
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm"
          onClick={() => onSelect(GenerateSubMode.CSV_TRANSLATION)}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-base">CSV Translation</CardTitle>
            <CardDescription className="text-xs">
              Batch translate product descriptions in 20+ languages
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};
