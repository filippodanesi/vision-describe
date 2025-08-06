
import React from 'react';
import { AlertCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ToneTabProps {
  classifications: any[];
}

// Function to get tone badge color
const getToneColor = (toneName: string) => {
  switch (toneName) {
    case 'excited': return 'bg-green-500 hover:bg-green-600';
    case 'satisfied': return 'bg-blue-500 hover:bg-blue-600';
    case 'polite': return 'bg-purple-500 hover:bg-purple-600';
    case 'sympathetic': return 'bg-yellow-500 hover:bg-yellow-600';
    case 'frustrated': return 'bg-orange-500 hover:bg-orange-600';
    case 'sad': return 'bg-gray-500 hover:bg-gray-600';
    case 'impolite': return 'bg-rose-500 hover:bg-rose-600';
    default: return '';
  }
};

const ToneTab: React.FC<ToneTabProps> = ({ classifications }) => {
  // Check if classifications exist and are not empty
  if (!classifications || classifications.length === 0) {
    return (
      <div className="space-y-4">
        <Alert variant="warning" className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertDescription className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Tone analysis not available. This could be due to text length (2000+ characters), unsupported language, or API settings.
          </AlertDescription>
        </Alert>
        
        <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            <div>
              <p className="font-medium mb-2">To enable tone analysis:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Ensure your text is under 2000 characters</li>
                <li>Use English or French language content</li>
                <li>Make sure tone analysis is enabled in features</li>
                <li>Try shorter excerpts for analysis</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
        
        <div className="p-4 border rounded-md text-muted-foreground text-sm">
          <p>Tone analysis detects emotional tones in your text, including:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Excited: enthusiasm and interest</li>
            <li>Satisfied: positive response to quality</li>
            <li>Polite: respectful and courteous</li>
            <li>Sympathetic: emotional understanding</li>
            <li>Frustrated: annoyance and irritation</li>
            <li>Sad: unpleasant passive emotion</li>
            <li>Impolite: disrespectful and rude</li>
          </ul>
        </div>
      </div>
    );
  }

  // Sort tones by confidence (from highest to lowest)
  const sortedTones = [...classifications].sort((a, b) => b.confidence - a.confidence);

  // Tone descriptions
  const toneDescriptions: Record<string, string> = {
    'excited': 'Showing personal enthusiasm and interest',
    'frustrated': 'Feeling annoyed and irritable',
    'impolite': 'Being disrespectful and rude',
    'polite': 'Displaying rational, goal-oriented behavior',
    'sad': 'An unpleasant passive emotion',
    'satisfied': 'An affective response to perceived service quality',
    'sympathetic': 'An affective mode of understanding that involves emotional resonance'
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Tone Analysis</h3>
      <div className="space-y-3">
        {sortedTones.map((tone, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <Badge className={`${getToneColor(tone.class_name)}`}>
                  {tone.class_name}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {toneDescriptions[tone.class_name] || 'Tone category'}
                </span>
              </div>
              <div>{(tone.confidence * 100).toFixed(1)}%</div>
            </div>
            <Progress value={tone.confidence * 100} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToneTab;
