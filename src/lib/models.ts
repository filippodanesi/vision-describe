export interface Model {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic';
  costEffective?: boolean;
}

export const models: Model[] = [
  {
    id: 'o4-mini',
    name: 'o4-mini',
    description: 'Most advanced model, best for complex tasks',
    provider: 'openai'
  },
  {
    id: 'o3',
    name: 'o3',
    description: 'Fast and efficient for most tasks',
    provider: 'openai',
    costEffective: true
  },
  {
    id: 'claude-opus-4-0',
    name: 'Claude Opus 4',
    description: 'Most capable model for complex tasks',
    provider: 'anthropic'
  },
  {
    id: 'claude-sonnet-4-0',
    name: 'Claude Sonnet 4',
    description: 'Balanced performance and efficiency',
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