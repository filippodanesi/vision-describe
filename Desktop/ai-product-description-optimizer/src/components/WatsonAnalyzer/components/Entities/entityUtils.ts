
// Helper functions for entity processing

export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).length;
};

export const hasMultiWordEntities = (entities: any[]): boolean => {
  return entities.some(entity => entity.text.includes(' '));
};

export const getEntityTypes = (entities: any[]): string[] => {
  return [...new Set(entities.map(entity => entity.type))];
};

export const getMultiWordEntitiesCount = (entities: any[]): number => {
  return entities.filter(entity => entity.text.includes(' ')).length;
};
