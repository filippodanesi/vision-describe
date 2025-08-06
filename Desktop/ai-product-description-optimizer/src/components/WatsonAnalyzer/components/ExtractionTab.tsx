
import React from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import EntitiesTab from './EntitiesTab';
import KeywordsTab from './KeywordsTab';
import ConceptsTab from './ConceptsTab';
import RelationsTab from './RelationsTab';
import { 
  isExactKeywordMatch, 
  isPartialKeywordMatch 
} from "../utils/keywordUtils";

interface ExtractionTabProps {
  results: any;
  containsTargetKeyword: (text: string) => boolean;
  targetKeywords: string[];
}

const ExtractionTab: React.FC<ExtractionTabProps> = ({ results, containsTargetKeyword, targetKeywords }) => {
  return (
    <Tabs defaultValue="entities">
      <TabsList className="w-full grid grid-cols-4">
        <TabsTrigger value="entities">Entities</TabsTrigger>
        <TabsTrigger value="keywords">Keywords</TabsTrigger>
        <TabsTrigger value="concepts">Concepts</TabsTrigger>
        <TabsTrigger value="relations">Relations</TabsTrigger>
      </TabsList>

      <TabsContent value="entities" className="pt-4">
        <EntitiesTab 
          entities={results.entities || []} 
          containsTargetKeyword={containsTargetKeyword} 
        />
      </TabsContent>

      <TabsContent value="keywords" className="pt-4">
        <KeywordsTab 
          keywords={results.keywords || []} 
          containsTargetKeyword={containsTargetKeyword}
          targetKeywords={targetKeywords}
          isExactKeywordMatch={isExactKeywordMatch}
          isPartialKeywordMatch={isPartialKeywordMatch}
        />
      </TabsContent>

      <TabsContent value="concepts" className="pt-4">
        <ConceptsTab 
          concepts={results.concepts || []} 
          containsTargetKeyword={containsTargetKeyword} 
        />
      </TabsContent>

      <TabsContent value="relations" className="pt-4">
        <RelationsTab 
          relations={results.relations || []} 
          containsTargetKeyword={containsTargetKeyword} 
        />
      </TabsContent>
    </Tabs>
  );
};

export default ExtractionTab;
