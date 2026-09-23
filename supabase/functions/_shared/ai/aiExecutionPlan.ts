// ==========================================================
// Mass Diamond — AI Execution Plan
//
// Converts execution policy into an ordered runtime plan.
//
// Responsibilities:
// - Resolve policy model configurations to registered runtimes.
// - Preserve primary/fallback ordering.
// - Expose unavailable runtime targets explicitly.
// - Keep planning independent from provider-specific logic.
//
// This layer does NOT:
// - Execute providers
// - Retry requests
// - Handle timeouts
// - Persist data
// - Handle authentication
// - Handle billing
// - Perform network requests
//
// Runtime adapters may represent:
// - External runtimes
// - Self-hosted runtimes
// - Mass Diamond-native runtimes
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

export interface AIUnavailableExecutionTarget {
  readonly providerId: string;
  readonly model: string;
  readonly priority: number;
  readonly isPrimary: boolean;
  readonly reason:
    | "PROVIDER_NOT_REGISTERED";
}

export interface AIExecutionPlan {
  readonly targets:
    readonly AIExecutionTarget[];

  readonly unavailableTargets:
    readonly AIUnavailableExecutionTarget[];
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
    const modelConfigs:
      readonly AIModelConfig[] = [
        policy.primary,
        ...policy.fallbacks,
      ];

    const targets:
      AIExecutionTarget[] = [];

    const unavailableTargets:
      AIUnavailableExecutionTarget[] = [];

    for (
      let index = 0;
      index < modelConfigs.length;
      index += 1
    ) {
      const model =
        modelConfigs[index];

      const provider =
        providers.find(
          (candidate) =>
            candidate.id ===
            model.provider,
        );

      if (!provider) {
        unavailableTargets.push({
          providerId:
            model.provider,

          model:
            model.model,

          priority:
            index,

          isPrimary:
            index === 0,

          reason:
            "PROVIDER_NOT_REGISTERED",
        });

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
      unavailableTargets,
    };
  }
}

export const aiExecutionPlanBuilder =
  new DefaultAIExecutionPlanBuilder();
