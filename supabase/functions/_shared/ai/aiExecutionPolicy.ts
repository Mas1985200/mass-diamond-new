// ==========================================================
// Mass Diamond — AI Execution Policy
//
// Defines provider/model execution preferences separately
// from provider adapters and execution mechanics.
//
// This layer is intentionally provider-aware but does not
// perform network execution.
// ==========================================================

import type {
  AIModelConfig,
  AIProviderId,
} from "./types";

export interface AIExecutionPolicyPlan {
  readonly primary: AIModelConfig;
  readonly fallbacks: readonly AIModelConfig[];
}

export interface AIExecutionPolicyResolver {
  resolve(): AIExecutionPolicyPlan;
}

const DEFAULT_PRIMARY_MODEL: AIModelConfig = {
  provider: "openai",
  model: "gpt-4.1",
  maxOutputTokens: 4096,
  temperature: 0.7,
};

const DEFAULT_FALLBACK_MODELS: readonly AIModelConfig[] = [
  {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    maxOutputTokens: 4096,
    temperature: 0.7,
  },
  {
    provider: "google",
    model: "gemini-2.5-flash",
    maxOutputTokens: 4096,
    temperature: 0.7,
  },
  {
    provider: "groq",
    model: "openai/gpt-oss-120b",
    maxOutputTokens: 4096,
    temperature: 0.7,
  },
];

export class DefaultAIExecutionPolicyResolver
  implements AIExecutionPolicyResolver
{
  public resolve(): AIExecutionPolicyPlan {
    return {
      primary: DEFAULT_PRIMARY_MODEL,
      fallbacks: DEFAULT_FALLBACK_MODELS,
    };
  }
}

export const aiExecutionPolicyResolver =
  new DefaultAIExecutionPolicyResolver();
