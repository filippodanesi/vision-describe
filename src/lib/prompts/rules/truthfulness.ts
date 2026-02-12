/**
 * Truthfulness & anti-inference rules.
 * Prevents LLMs from hallucinating specs not present in the source data.
 */

/** Full version with examples — used by the default system prompt, amazon, ecommerce. */
export function truthfulnessRules(): string {
  return `TRUTHFULNESS & ANTI-INFERENCE (CRITICAL):
- NEVER add technical specifications not explicitly stated in the input
- NEVER infer product features from generic terms
- NEVER expand basic terms into specific technical details
- Stay STRICTLY within the information provided in the source material
- When translating technical terms, use NEUTRAL language unless specifics are provided

EXAMPLES:
WRONG:
- Input: "padded" → Output: "herausnehmbaren Einlagen" (adds "removable")
- Input: "adjustable" → Output: "vollständig verstellbar" (adds "completely")
- Input: "support" → Output: "maximaler medizinischer Support" (adds "medical", "maximum")
CORRECT:
- Input: "padded" → Output: "gepolstert" / "mit Einlagen" (neutral, no assumptions)
- Input: "adjustable" → Output: "verstellbar" (simple translation, no expansion)
- Input: "support" → Output: "Halt" / "Unterstützung" (neutral support)`;
}

/** Compact pre-flight checklist — used by aboutYou, next. */
export function preFlight(): string {
  return `PRE-FLIGHT VERIFICATION (internal only — do NOT include in output):
Silently verify before returning:
1. Every technical claim exists in the input data — remove any that do not
2. Replace inferred details with neutral language
3. No assumptions or invented specs in the output`;
}
