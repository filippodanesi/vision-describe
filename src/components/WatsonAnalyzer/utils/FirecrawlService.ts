import FirecrawlApp from '@mendable/firecrawl-js';

interface ErrorResponse {
  success: false;
  error: string;
}

interface ScrapingSuccessResponse {
  success: true;
  data: {
    markdown?: string;
    html?: string;
    metadata?: any;
  };
}

type ScrapingResponse = ScrapingSuccessResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;

  static saveApiKey(apiKey: string): void {
    sessionStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
    console.log('Firecrawl API key saved successfully');
  }

  static getApiKey(): string | null {
    return sessionStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async scrapeUrl(url: string): Promise<ScrapingResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found. Please provide a Firecrawl API key.' };
    }

    try {
      console.log('Making scrape request to Firecrawl API for URL:', url);
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      const scrapeResponse = await this.firecrawlApp.scrapeUrl(url, {
        formats: ['markdown'],
        onlyMainContent: true, // Focus on main content
        excludeTags: ['code', 'pre', 'CodeGroup'], // Exclude code blocks
        blockAds: true, // Remove ads and cookie popups
        removeBase64Images: true, // Remove base64 images to reduce noise
        timeout: 30000, // 30 second timeout
      });

      if (!scrapeResponse.success) {
        console.error('Scrape failed:', 'error' in scrapeResponse ? scrapeResponse.error : 'Unknown error');
        return { 
          success: false, 
          error: 'error' in scrapeResponse ? scrapeResponse.error : 'Failed to scrape website' 
        };
      }

      // Clean the markdown content
      if (scrapeResponse.markdown) {
        scrapeResponse.markdown = this.cleanMarkdownContent(scrapeResponse.markdown);
      }

      console.log('Scrape successful:', scrapeResponse);
      return { 
        success: true,
        data: scrapeResponse
      };
    } catch (error) {
      console.error('Error during scrape:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }

  /**
   * Cleans the markdown content to make it more suitable for analysis
   * Removes markdown formatting, code blocks, and other noise
   */
  private static cleanMarkdownContent(markdown: string): string {
    if (!markdown) return '';

    // Remove code blocks (content between triple backticks)
    let cleaned = markdown.replace(/```[\s\S]*?```/g, '');

    // Remove inline code (content between single backticks)
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

    // Remove bold formatting (**text**)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');

    // Remove italic formatting (*text*)
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');

    // Remove markdown links and keep only the text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    // Remove image markdown
    cleaned = cleaned.replace(/!\[[^\]]*\]\([^\)]+\)/g, '');

    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]*>/g, '');

    // Remove any remaining CodeGroup tags or XML-like tags
    cleaned = cleaned.replace(/<CodeGroup>[\s\S]*?<\/CodeGroup>/g, '');
    
    // Remove heading markers (###) but keep the text
    cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, '$1');

    // Remove blockquotes (> ) but keep the text
    cleaned = cleaned.replace(/^>\s+(.+)$/gm, '$1');

    // Remove horizontal rules
    cleaned = cleaned.replace(/^---+$/gm, '');

    // Remove excess whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    return cleaned;
  }
}
