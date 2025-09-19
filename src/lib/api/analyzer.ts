import { OpenAIService } from './openai';
import { AnthropicService } from './anthropic';
import { ModelConfig } from '../models';

export class AnalyzerService {
  private openaiService?: OpenAIService;
  private anthropicService?: AnthropicService;

  constructor(config: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
  }) {
    if (config.openaiApiKey) {
      this.openaiService = new OpenAIService(config.openaiApiKey);
    }
    if (config.anthropicApiKey) {
      this.anthropicService = new AnthropicService(config.anthropicApiKey);
    }
  }

  async analyze(text: string, model: ModelConfig): Promise<string> {
    switch (model.provider) {
      case 'openai':
        if (!this.openaiService) {
          throw new Error('OpenAI service not initialized. Please provide an API key.');
        }
        return this.openaiService.analyze(text, model);

      case 'anthropic':
        if (!this.anthropicService) {
          throw new Error('Anthropic service not initialized. Please provide an API key.');
        }
        return this.anthropicService.analyze(text, model);

      default:
        throw new Error(`Unsupported model provider: ${model.provider}`);
    }
  }
} 