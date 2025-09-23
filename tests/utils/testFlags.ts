import { describe, it, test } from 'vitest';

export const FULL_STACK_ENABLED = process.env.ENABLE_FULL_STACK_TESTS === 'true';
export const AI_LIVE_ENABLED =
  process.env.AI_SERVICE_MODE === 'live' ||
  process.env.ENABLE_LIVE_AI_TESTS === 'true';

export const hasGeminiKey = Boolean(process.env.GOOGLE_GEMINI_API_KEY);
export const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY);
export const hasMistralKey = Boolean(process.env.MISTRAL_API_KEY);
export const hasHuggingFaceToken = Boolean(process.env.HF_TOKEN);

export const describeIf = (condition: boolean) => (condition ? describe : describe.skip);
export const itIf = (condition: boolean) => (condition ? it : it.skip);
export const testIf = (condition: boolean) => (condition ? test : test.skip);

export const logSkip = (reason: string) => {
  console.warn(`[vitest] skipping suite: ${reason}`);
};
