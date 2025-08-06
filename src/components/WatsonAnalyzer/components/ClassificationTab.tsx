
import React from 'react';
import { AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface ClassificationTabProps {
  categories: any[];
  containsTargetKeyword: (text: string) => boolean;
}

const ClassificationTab: React.FC<ClassificationTabProps> = ({ categories, containsTargetKeyword }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-md">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <AlertCircle size={16} />
          <p>No categories found in the analyzed text.</p>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Confidence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category: any, index: number) => {
          const hasTargetKeyword = containsTargetKeyword(category.label);
          return (
            <TableRow key={index} className={hasTargetKeyword ? "bg-green-500/10" : ""}>
              <TableCell className={`font-medium ${hasTargetKeyword ? "text-green-600" : ""}`}>
                {category.label}
              </TableCell>
              <TableCell>{(category.score * 100).toFixed(1)}%</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default ClassificationTab;
