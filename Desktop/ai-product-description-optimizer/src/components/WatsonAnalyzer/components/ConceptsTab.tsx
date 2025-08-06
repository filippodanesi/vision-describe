
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

interface ConceptsTabProps {
  concepts: any[];
  containsTargetKeyword: (text: string) => boolean;
}

const ConceptsTab: React.FC<ConceptsTabProps> = ({ concepts, containsTargetKeyword }) => {
  if (!concepts || concepts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-md">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <AlertCircle size={16} />
          <p>No concepts found in the analyzed text.</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Text</TableHead>
            <TableHead>Relevance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {concepts.map((concept: any, index: number) => {
            const hasTargetKeyword = containsTargetKeyword(concept.text);
            return (
              <TableRow key={index} className={hasTargetKeyword ? "bg-green-500/10" : ""}>
                <TableCell className={`font-medium ${hasTargetKeyword ? "text-green-600" : ""}`}>
                  {concept.text}
                </TableCell>
                <TableCell>{(concept.relevance * 100).toFixed(1)}%</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default ConceptsTab;
