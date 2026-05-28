export interface Model {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic';
  costEffective?: boolean;
  speed: 'Fast' | 'Medium' | 'Slow';
  cost: 'Low' | 'Medium' | 'High';
  quality: 'Good' | 'Very Good' | 'Excellent';
}

export const models: Model[] = [
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    description: 'Flagship OpenAI model: best intelligence, reasoning, and 400K context',
    provider: 'openai',
    speed: 'Fast',
    cost: 'Low',
    quality: 'Excellent',
  },
  {
    id: 'claude-opus-4-7',
    name: 'Claude Opus 4.7',
    description: 'Most capable Anthropic model: 1M context, adaptive thinking, top text quality',
    provider: 'anthropic',
    speed: 'Medium',
    cost: 'High',
    quality: 'Excellent',
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    description: 'Previous Anthropic flagship: top-tier text quality (200K context)',
    provider: 'anthropic',
    speed: 'Medium',
    cost: 'Medium',
    quality: 'Excellent',
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    description: 'Fast Anthropic model, great balance of quality and speed (200K context)',
    provider: 'anthropic',
    costEffective: true,
    speed: 'Fast',
    cost: 'Medium',
    quality: 'Excellent',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    description: 'Fastest Anthropic model: ideal for high-volume batch processing (200K context)',
    provider: 'anthropic',
    costEffective: true,
    speed: 'Fast',
    cost: 'Low',
    quality: 'Good',
  }
];

export const getModelById = (id: string): Model | undefined => {
  return models.find(model => model.id === id);
};

export const getModelsByProvider = (provider: 'openai' | 'anthropic'): Model[] => {
  return models.filter(model => model.provider === provider);
};

export const getCostEffectiveModels = (): Model[] => {
  return models.filter(model => model.costEffective);
};

export const getHighPerformanceModels = (): Model[] => {
  return models.filter(model => !model.costEffective);
};
