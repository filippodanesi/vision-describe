export interface Model {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic';
  costEffective?: boolean;
}

export const models: Model[] = [
  {
    id: 'gpt-5',
    name: 'GPT-5',
    description: 'Best model for coding and agentic tasks across domains (400K context)',
    provider: 'openai',
    costEffective: true
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    description: 'Best model for complex agents and coding with highest intelligence (200K context)',
    provider: 'anthropic',
    costEffective: true
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