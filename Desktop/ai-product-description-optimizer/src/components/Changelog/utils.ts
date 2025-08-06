
// Helper function to get badge variant based on feature type
export const getFeatureTypeVariant = (feature: string) => {
  if (feature.startsWith("FIX") || feature.startsWith("BUGFIX")) return "destructive";
  if (feature.startsWith("ENHANCEMENT") || feature.startsWith("ENHANCE")) return "secondary";
  if (feature.startsWith("IMPLEMENT") || feature.startsWith("NEW")) return "default";
  if (feature.startsWith("MAJOR") || feature.startsWith("BREAKING")) return "outline";
  if (feature.startsWith("UPDATE")) return "secondary";
  if (feature.startsWith("COST") || feature.startsWith("PRICING")) return "outline";
  return "default";
};
