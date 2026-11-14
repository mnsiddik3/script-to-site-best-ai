export type GeminiModel =
  | 'gemini-3.8-flash'
  | 'gemini-3.7-flash'
  | 'gemini-3.6-flash'
  | 'gemini-3.5-flash-lite'
  | 'gemini-3.1-flash-lite'
  | 'gemini-2.5-flash';

const MODEL_FALLBACKS: Record<GeminiModel, GeminiModel | null> = {
  'gemini-3.8-flash': 'gemini-3.7-flash',
  'gemini-3.7-flash': 'gemini-3.6-flash',
  'gemini-3.6-flash': 'gemini-3.5-flash-lite',
  'gemini-3.5-flash-lite': 'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite': 'gemini-2.5-flash',
  'gemini-2.5-flash': null,
};

export const getNextGeminiAttempt = (
  apiKeys: string[],
  currentKeyIndex: number,
  model: GeminiModel,
  exhaustedKeyIndices: Set<number>,
): { keyIndex: number; model: GeminiModel } | null => {
  for (let offset = 1; offset <= apiKeys.length; offset++) {
    const keyIndex = (currentKeyIndex + offset) % apiKeys.length;
    if (apiKeys[keyIndex]?.trim() && !exhaustedKeyIndices.has(keyIndex)) {
      return { keyIndex, model };
    }
  }

  const fallbackModel = MODEL_FALLBACKS[model];
  const firstValidKeyIndex = apiKeys.findIndex((key) => key.trim());
  if (fallbackModel && firstValidKeyIndex !== -1) {
    return { keyIndex: firstValidKeyIndex, model: fallbackModel };
  }

  return null;
};