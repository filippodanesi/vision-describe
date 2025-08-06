
export interface VersionData {
  version: string;
  date: string;
  type: string;
  features: string[];
}

export interface CostAnalysis {
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}
