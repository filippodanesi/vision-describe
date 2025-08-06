
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

interface RelationsTabProps {
  relations: any[];
  containsTargetKeyword: (text: string) => boolean;
}

const RelationsTab: React.FC<RelationsTabProps> = ({ relations, containsTargetKeyword }) => {
  if (!relations || relations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-md">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <AlertCircle size={16} />
          <p>No relations found in the analyzed text.</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Elements</TableHead>
            <TableHead>Sentence</TableHead>
            <TableHead>Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {relations.map((relation: any, index: number) => {
            const sentence = relation.sentence;
            const hasTargetKeyword = containsTargetKeyword(sentence);
            
            // Extract entities involved
            const relationArgs = relation.args ? 
              relation.args.map((arg: any) => {
                const text = arg.text;
                const entityType = arg.entities?.[0]?.type || "";
                return `${text} (${entityType})`;
              }).join(" → ") 
              : "";

            return (
              <TableRow key={index} className={hasTargetKeyword ? "bg-green-500/10" : ""}>
                <TableCell>{relation.type}</TableCell>
                <TableCell>{relationArgs}</TableCell>
                <TableCell className={hasTargetKeyword ? "text-green-600" : ""}>{sentence}</TableCell>
                <TableCell>{(relation.score * 100).toFixed(1)}%</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default RelationsTab;
