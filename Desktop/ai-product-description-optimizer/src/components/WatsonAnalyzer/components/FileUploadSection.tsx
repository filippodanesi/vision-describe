
import React, { useState, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { File, Upload, Copy } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface FileUploadSectionProps {
  text: string;
  setText: (text: string) => void;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  text,
  setText
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Update the file name display
    setFileName(file.name);

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
    };
    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Could not read the selected file",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Text copied",
      description: "Text has been copied to your clipboard",
      duration: 2000,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <input 
          id="text-file" 
          type="file" 
          ref={fileInputRef}
          accept=".txt,.doc,.docx,.rtf,.pdf,.md,.html,.json,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md p-6 cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleUploadClick}>
          <File className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm font-medium mb-1">
            {fileName ? fileName : "Click to upload a text file"}
          </p>
          <p className="text-xs text-muted-foreground">
            TXT, DOC, DOCX, PDF, RTF, MD, HTML, JSON, CSV
          </p>
        </div>
        
        {fileName && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={handleUploadClick}
          >
            <Upload className="h-4 w-4 mr-2" />
            Change file
          </Button>
        )}
      </div>

      {text && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="file-preview">Preview</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 opacity-70 hover:opacity-100"
              onClick={copyToClipboard}
              title="Copy text"
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy
            </Button>
          </div>
          <Textarea
            id="file-preview"
            value={text}
            readOnly
            className="min-h-[150px] font-mono text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default FileUploadSection;
