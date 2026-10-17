export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export const AI_PRICING: Record<string, ModelPricing> = {
  // Anthropic Claude 3.5 Sonnet
  'claude-3-5-sonnet-20241022': {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
  },
  // Anthropic Claude 3.5 Haiku
  'claude-3-5-haiku-20241022': {
    inputPerMillion: 0.8,
    outputPerMillion: 4.0,
  },
  // Google Gemini 1.5 Flash
  'gemini-1.5-flash': {
    inputPerMillion: 0.075,
    outputPerMillion: 0.3,
  },
  // Google Gemini 1.5 Pro
  'gemini-1.5-pro': {
    inputPerMillion: 1.25,
    outputPerMillion: 5.0,
  },
  // Google text-embedding-004
  'text-embedding-004': {
    inputPerMillion: 0.025,
    outputPerMillion: 0.0,
  },
};

/**
 * Tính toán chi phí USD dựa trên model và số lượng token vào/ra
 */
export function calculateAiCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = AI_PRICING[model] || AI_PRICING['gemini-1.5-flash'];
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;
  return Math.round((inputCost + outputCost) * 100000) / 100000;
}
