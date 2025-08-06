
import React from 'react';
import { AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KeywordsTabProps {
  keywords: any[];
  containsTargetKeyword: (text: string) => boolean;
  targetKeywords: string[];
  isExactKeywordMatch?: (text: string, targetKeyword: string) => boolean;
  isPartialKeywordMatch?: (text: string, targetKeyword: string) => boolean;
}

const KeywordsTab: React.FC<KeywordsTabProps> = ({ 
  keywords, 
  containsTargetKeyword, 
  targetKeywords,
  isExactKeywordMatch,
  isPartialKeywordMatch
}) => {
  if (!keywords || keywords.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-md">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <AlertCircle size={16} />
          <p>No keywords found in the analyzed text.</p>
        </div>
      </div>
    );
  }

  // Log the keywords and target keywords for debugging
  console.log("Keywords from API:", keywords);
  console.log("Target keywords:", targetKeywords);

  // Check the type of match with target keywords
  const checkKeywordMatch = (text: string) => {
    if (!targetKeywords.length) return "none";
    
    // Convert text to lowercase for comparison
    const lowerText = text.toLowerCase().trim();
    console.log(`Checking keyword match for: "${lowerText}"`);
    
    // Check for exact matches
    for (const keyword of targetKeywords) {
      const lowerKeyword = keyword.toLowerCase().trim();
      if (isExactKeywordMatch && isExactKeywordMatch(lowerText, lowerKeyword)) {
        console.log(`✓ Exact match found for "${lowerText}" with "${lowerKeyword}"`);
        return "exact";
      }
    }
    
    // Check for partial matches
    for (const keyword of targetKeywords) {
      const lowerKeyword = keyword.toLowerCase().trim();
      if (isPartialKeywordMatch && isPartialKeywordMatch(lowerText, lowerKeyword)) {
        console.log(`~ Partial match found for "${lowerText}" with "${lowerKeyword}"`);
        return "partial";
      }
    }
    
    // Double-check if there's any match using direct string includes
    for (const keyword of targetKeywords) {
      const lowerKeyword = keyword.toLowerCase().trim();
      if (lowerText.includes(lowerKeyword)) {
        console.log(`• Direct includes match for "${lowerText}" with "${lowerKeyword}"`);
        // If we got here, one of our matcher functions might be failing
        return "partial";
      }
    }
    
    console.log(`✗ No match for "${lowerText}"`);
    return "none";
  };
  
  // Count words in a phrase
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Text</TableHead>
              <TableHead>Words</TableHead>
              <TableHead>Relevance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((keyword: any, index: number) => {
              const matchType = checkKeywordMatch(keyword.text);
              const wordCount = countWords(keyword.text);
              
              let rowClassName = "";
              let textClassName = "font-medium";
              
              if (matchType === "exact") {
                rowClassName = "bg-green-500/10";
                textClassName = "font-medium text-green-600";
              } else if (matchType === "partial") {
                rowClassName = "bg-orange-500/10";
                textClassName = "font-medium text-orange-600";
              }
              
              return (
                <TableRow key={index} className={rowClassName}>
                  <TableCell className={textClassName}>
                    {keyword.text}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-secondary/50">
                      {wordCount}
                    </Badge>
                  </TableCell>
                  <TableCell>{(keyword.relevance * 100).toFixed(1)}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
      
      {targetKeywords.length > 0 && (
        <div className="flex flex-col gap-1 mt-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
            <span>Exact match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500/70"></div>
            <span>Partial match</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordsTab;
