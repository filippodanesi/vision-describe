
import React from 'react';
import { 
  Label 
} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface LanguageSectionProps {
  language: string;
  setLanguage: (lang: string) => void;
}

export const LanguageSection: React.FC<LanguageSectionProps> = ({ language, setLanguage }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Language</h3>
      <div className="space-y-2">
        <Label htmlFor="language">Analysis Language</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto-detect</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="it">Italian</SelectItem>
            <SelectItem value="pt">Portuguese</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
