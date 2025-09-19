import OpenAI from 'openai';
import { ModelConfig } from '../models';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async analyze(text: string, model: ModelConfig) {
    if (model.provider !== 'openai') {
      throw new Error('Invalid model provider');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: model.id,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes text and provides insights.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing text with OpenAI:', error);
      throw error;
    }
  }
} 