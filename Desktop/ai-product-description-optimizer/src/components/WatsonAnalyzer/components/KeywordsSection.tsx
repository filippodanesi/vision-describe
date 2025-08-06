
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface KeywordsSectionProps {
  targetKeywords: string;
  setTargetKeywords: (keywords: string) => void;
}

const KeywordsSection: React.FC<KeywordsSectionProps> = ({
  targetKeywords,
  setTargetKeywords
}) => {
  const targetKeywordsList = targetKeywords
    .split(',')
    .map(kw => kw.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2">
      <Label htmlFor="target-keywords">Target keywords (comma-separated)</Label>
      <Input
        id="target-keywords"
        placeholder="Enter keywords to highlight in results"
        value={targetKeywords}
        onChange={(e) => setTargetKeywords(e.target.value)}
      />
      
      {targetKeywordsList.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {targetKeywordsList.map((keyword, index) => (
            <Badge key={index} variant="outline" className="bg-secondary">
              {keyword}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default KeywordsSection;
