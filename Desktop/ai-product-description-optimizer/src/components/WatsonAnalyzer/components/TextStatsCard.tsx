
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TextStatsCardProps {
  textStats: {
    wordCount: number;
    sentenceCount: number;
    charCount: number;
  };
  language?: string;
}

const TextStatsCard: React.FC<TextStatsCardProps> = ({ textStats, language }) => {
  return (
    <Card className="bg-secondary/30">
      <CardContent className="p-4 space-y-2">
        <h3 className="text-xs uppercase font-semibold text-muted-foreground">Text Statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium">Words</p>
            <p className="text-2xl font-mono">{textStats.wordCount}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Sentences</p>
            <p className="text-2xl font-mono">{textStats.sentenceCount}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Characters</p>
            <p className="text-2xl font-mono">{textStats.charCount}</p>
          </div>
        </div>
        {language && (
          <div className="pt-2">
            <Badge variant="outline">Language: {language.toUpperCase()}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TextStatsCard;
