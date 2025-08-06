
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FirecrawlService } from '../utils/FirecrawlService';
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UrlInputSectionProps {
  text: string;
  setText: (text: string) => void;
}

const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  text,
  setText
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleScrape = async () => {
    if (!url) {
      toast({
        title: "URL required",
        description: "Please enter a URL to scrape",
        variant: "destructive",
      });
      return;
    }

    // Check if API key exists
    const savedApiKey = FirecrawlService.getApiKey();
    if (!savedApiKey) {
      setShowApiKeyDialog(true);
      return;
    }

    await scrapeUrl();
  };

  const saveApiKey = () => {
    if (!apiKey) {
      toast({
        title: "API key required",
        description: "Please enter a valid Firecrawl API key",
        variant: "destructive",
      });
      return;
    }

    FirecrawlService.saveApiKey(apiKey);
    setShowApiKeyDialog(false);
    
    toast({
      title: "API key saved",
      description: "Your Firecrawl API key has been saved"
    });

    scrapeUrl();
  };

  const scrapeUrl = async () => {
    setIsLoading(true);
    
    try {
      // Format the URL properly if it doesn't include http/https
      let formattedUrl = url;
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }

      const response = await FirecrawlService.scrapeUrl(formattedUrl);
      
      if (response.success) {
        setText(response.data.markdown || '');
        toast({
          title: "Scraping successful",
          description: "Clean content has been extracted from the URL"
        });
      } else {
        // Safe type checking before accessing error property
        const errorMessage = 'error' in response ? response.error : "Failed to scrape the URL"; 
          
        toast({
          title: "Scraping failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error scraping URL:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to scrape the URL",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for text changes in the textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={handleScrape}
          disabled={isLoading || !url}
          className="shrink-0"
        >
          {isLoading ? "Scraping..." : "Scrape"}
        </Button>
      </div>

      {text && (
        <div className="space-y-2">
          <Label htmlFor="scraped-content">Scraped Content</Label>
          <Textarea
            id="scraped-content"
            value={text}
            onChange={handleTextChange}
            className="min-h-[200px] font-mono text-sm"
          />
        </div>
      )}

      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Firecrawl API Key Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              To use the URL scraping feature, please enter your Firecrawl API key.
              You can get one by signing up at <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">firecrawl.dev</a>.
            </p>
            <Input
              type="password"
              placeholder="Enter your Firecrawl API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveApiKey}>
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UrlInputSection;
