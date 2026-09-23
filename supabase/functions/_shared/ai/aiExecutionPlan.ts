// ==========================================================
// Mass Diamond — AI Execution Plan
//
// Combines provider resolution with model execution policy.
//
// Responsibilities:
// - Pair each provider with its intended model.
// - Preserve primary/fallback ordering.
// - Prevent a provider from receiving another provider's model.
// - Keep execution mechanics outside this layer.
//
// Does NOT handle:
// - Network execution
// - Retry
// - Timeout
// - Persistence
// - Billing
// - Authentication
// ==========================================================

import type {
  AIModelConfig,
  AIProvider,
} from "./types";

import type {
  AIExecutionPolicyPlan,
} from "./aiExecutionPolicy";

export interface AIExecutionTarget {
  readonly provider: AIProvider;
  readonly model: AIModelConfig;
  readonly priority: number;
  readonly isPrimary: boolean;
}

export interface AIExecutionPlan {
  readonly targets: readonly AIExecutionTarget[];
}

export interface AIExecutionPlanBuilder {
  build(
    policy: AIExecutionPolicyPlan,
    providers: readonly AIProvider[],
  ): AIExecutionPlan;
}

export class DefaultAIExecutionPlanBuilder
  implements AIExecutionPlanBuilder
{
  public build(
    policy: AIExecutionPolicyPlan,
    providers: readonly AIProvider[],
  ): AIExecutionPlan {
    const modelConfigs: readonly AIModelConfig[] = [
      policy.primary,
      ...policy.fallbacks,
    ];

    const targets: AIExecutionTarget[] = [];

    for (
      let index = 0;
      index < modelConfigs.length;
      index += 1
    ) {
      const model = modelConfigs[index];

      const provider = providers.find(
        (candidate) =>
          candidate.id === model.provider,
      );

      if (!provider) {
        continue;
      }

      targets.push({
        provider,
        model,
        priority: index,
        isPrimary: index === 0,
      });
    }

    return {
      targets,
    };
  }
}

export const aiExecutionPlanBuilder =
  new DefaultAIExecutionPlanBuilder();
