export interface Model {
  id: string;
  name: string;
  description: string;
  provider: 'anthropic';
  costEffective?: boolean;
  speed: 'Fast' | 'Medium' | 'Slow';
  cost: 'Low' | 'Medium' | 'High';
  quality: 'Good' | 'Very Good' | 'Excellent';
}

// Single supported model. The app consolidated on Claude Opus 4.8 across every
// flow (Image Analysis, CSV Translation, Metadata Generation, Optimize); no
// user-facing model selector is exposed. The array shape is kept so existing
// callers (getModelById, Dashboard, processing pipeline) keep working.
export const models: Model[] = [
  {
    id: 'claude-opus-4-8',
    name: 'Claude Opus 4.8',
    description: 'Most capable Anthropic model: 1M context, adaptive thinking, top text quality',
    provider: 'anthropic',
    speed: 'Medium',
    cost: 'High',
    quality: 'Excellent',
  },
];

export const getModelById = (id: string): Model | undefined => {
  return models.find(model => model.id === id);
};
