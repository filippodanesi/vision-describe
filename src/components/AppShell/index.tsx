import React, { useState } from 'react';
import { ThemeProvider } from '../WatsonAnalyzer/ThemeProvider';
import Header from '../WatsonAnalyzer/components/Header';
import Footer from '../WatsonAnalyzer/components/Footer';
import { OptimizeMode } from '../WatsonAnalyzer';
import { GenerateMode } from '../GenerateMode';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ImageIcon, Sparkles } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <ThemeProvider defaultTheme="light">
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container max-w-7xl mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="optimize" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Optimize
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate">
              <GenerateMode />
            </TabsContent>

            <TabsContent value="optimize">
              <OptimizeMode />
            </TabsContent>
          </Tabs>
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default AppShell;
