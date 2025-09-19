
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { VersionData } from './types';
import VersionTimeline from './VersionTimeline';
import UpcomingFeatures from './UpcomingFeatures';

interface ChangelogContentProps {
  versions: VersionData[];
}

const ChangelogContent: React.FC<ChangelogContentProps> = ({ versions }) => {
  return (
    <main className="container max-w-5xl mx-auto px-4 py-8 flex-grow">
      <Card className="mb-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Update History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-8">
            This changelog tracks all updates and improvements made to the AI Product Description Optimizer.
          </p>
          
          <VersionTimeline versions={versions} />
        </CardContent>
      </Card>
      
      <UpcomingFeatures />
    </main>
  );
};

export default ChangelogContent;
