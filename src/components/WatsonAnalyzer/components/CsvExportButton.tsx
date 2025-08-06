
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateCsvContent, downloadFile, getCurrentDateString } from '../utils/exportUtils';

interface CsvExportButtonProps {
  results: any;
  isDisabled: boolean;
}

const CsvExportButton: React.FC<CsvExportButtonProps> = ({ results, isDisabled }) => {
  const { toast } = useToast();

  const handleExport = () => {
    if (!results) {
      toast({
        title: "Export failed",
        description: "No data available for CSV export.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = generateCsvContent(results);
    const fileName = `nlu-analysis-${getCurrentDateString()}.csv`;
    
    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export completed",
      description: "The analysis has been exported as CSV.",
    });
  };

  return (
    <Button 
      onClick={handleExport}
      disabled={isDisabled}
      variant="outline"
      size="sm"
      className="flex items-center gap-1"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
};

export default CsvExportButton;
