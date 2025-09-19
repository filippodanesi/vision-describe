import Anthropic from '@anthropic-ai/sdk';
import { ModelConfig } from '../models';

export class AnthropicService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async analyze(text: string, model: ModelConfig) {
    if (model.provider !== 'anthropic') {
      throw new Error('Invalid model provider');
    }

    try {
      const response = await this.client.messages.create({
        model: model.id,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: text,
          },
        ],
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Error analyzing text with Anthropic:', error);
      throw error;
    }
  }
} 