
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface EntityTableProps {
  entities: any[];
  containsTargetKeyword: (text: string) => boolean;
  countWords: (text: string) => number;
}

const EntityTable: React.FC<EntityTableProps> = ({ 
  entities, 
  containsTargetKeyword, 
  countWords 
}) => {
  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/4">Text</TableHead>
            <TableHead className="w-1/6">Type</TableHead>
            <TableHead className="w-1/6">Confidence</TableHead>
            <TableHead className="w-1/6">Relevance</TableHead>
            <TableHead className="w-1/6">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entities.map((entity: any, index: number) => {
            const hasTargetKeyword = containsTargetKeyword(entity.text);
            const wordCount = countWords(entity.text);
            return (
              <TableRow key={index} className={hasTargetKeyword ? "bg-green-500/10" : ""}>
                <TableCell className={`font-medium ${hasTargetKeyword ? "text-green-600" : ""}`}>
                  {entity.text}
                  {wordCount > 1 && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {wordCount} words
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {entity.type}
                  </Badge>
                </TableCell>
                <TableCell>{entity.confidence ? (entity.confidence * 100).toFixed(1) + '%' : 'N/A'}</TableCell>
                <TableCell>{(entity.relevance * 100).toFixed(1)}%</TableCell>
                <TableCell>{entity.count}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default EntityTable;
