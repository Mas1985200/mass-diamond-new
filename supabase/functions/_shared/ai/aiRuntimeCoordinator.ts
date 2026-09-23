// ==========================================================
// Mass Diamond — AI Runtime Coordinator
//
// Coordinates the complete provider-neutral AI execution
// pipeline:
//
// Policy
//   ↓
// Provider Resolution
//   ↓
// Execution Plan
//   ↓
// Execution Engine
//
// Responsibilities:
// - Resolve the active execution policy.
// - Resolve available runtime adapters.
// - Build an ordered execution plan.
// - Delegate execution to the runtime engine.
// - Preserve provider/runtime neutrality.
//
// Does NOT handle:
// - Authentication
// - Persistence
// - Billing
// - Conversation management
// - Capability routing
// - Provider-specific API logic
// - Direct network execution
// ==========================================================

import type {
  AIExecutionRequest,
} from "./types";

import {
  aiExecutionPolicyResolver,
  type AIExecutionPolicyResolver,
} from "./aiExecutionPolicy";

import {
  aiProviderResolver,
  type AIProviderResolver,
} from "./providerResolver";

import {
  aiExecutionPlanBuilder,
  type AIExecutionPlanBuilder,
} from "./aiExecutionPlan";

import {
  aiExecutionEngine,
  type AIExecutionEngine,
  type AIExecutionEngineResult,
} from "./aiExecutionEngine";

export interface AIRuntimeCoordinatorDependencies {
  readonly policyResolver:
    AIExecutionPolicyResolver;

  readonly providerResolver:
    AIProviderResolver;

  readonly planBuilder:
    AIExecutionPlanBuilder;

  readonly executionEngine:
    AIExecutionEngine;
}

export interface AIRuntimeExecutionOptions {
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
}

export interface AIRuntimeCoordinator {
  execute(
    request: AIExecutionRequest,
    options?: AIRuntimeExecutionOptions,
  ): Promise<AIExecutionEngineResult>;
}

export class DefaultAIRuntimeCoordinator
  implements AIRuntimeCoordinator
{
  private readonly dependencies:
    AIRuntimeCoordinatorDependencies;

  public constructor(
    dependencies:
      AIRuntimeCoordinatorDependencies,
  ) {
    this.dependencies = dependencies;
  }

  public async execute(
    request: AIExecutionRequest,
    options: AIRuntimeExecutionOptions = {},
  ): Promise<AIExecutionEngineResult> {
    const policy =
      this.dependencies.policyResolver.resolve();

    const resolution =
      this.dependencies.providerResolver.resolve(
        policy.primary.provider,
      );

    if (!resolution.resolved) {
      return {
        result: {
          success: false,
          error: {
            code:
              "AI_RUNTIME_RESOLUTION_FAILED",

            message:
              this.getResolutionErrorMessage(
                resolution.reason,
              ),

            retryable: false,
          },
        },

        attempts: [],
      };
    }

    const plan =
      this.dependencies.planBuilder.build(
        policy,
        resolution.providers,
      );

    if (plan.targets.length === 0) {
      return {
        result: {
          success: false,
          error: {
            code:
              "AI_RUNTIME_PLAN_EMPTY",

            message:
              "No executable AI runtime target is available.",

            retryable: false,
          },
        },

        attempts: [],
      };
    }

    return this.dependencies.executionEngine.execute(
      request,
      plan,
      options,
    );
  }

  private getResolutionErrorMessage(
    reason:
      | "NO_PROVIDER_CONFIGURED"
      | "PROVIDER_NOT_REGISTERED"
      | "INVALID_PROVIDER_CONFIG",
  ): string {
    switch (reason) {
      case "NO_PROVIDER_CONFIGURED":
        return "No AI runtime is configured.";

      case "PROVIDER_NOT_REGISTERED":
        return "The configured AI runtime is not registered.";

      case "INVALID_PROVIDER_CONFIG":
        return "The AI runtime configuration is invalid.";

      default:
        return "AI runtime resolution failed.";
    }
  }
}

export const aiRuntimeCoordinator =
  new DefaultAIRuntimeCoordinator({
    policyResolver:
      aiExecutionPolicyResolver,

    providerResolver:
      aiProviderResolver,

    planBuilder:
      aiExecutionPlanBuilder,

    executionEngine:
      aiExecutionEngine,
  });
