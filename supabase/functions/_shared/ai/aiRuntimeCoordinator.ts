// ==========================================================
// Mass Diamond — AI Runtime Coordinator
//
// Coordinates the AI execution pipeline:
//
//   Policy
//      ↓
//   Provider Resolver
//      ↓
//   Execution Plan
//      ↓
//   Execution Engine
//
// This layer owns orchestration only.
//
// It does NOT handle:
// - authentication
// - persistence
// - billing
// - routing
// - provider-specific API logic
// - UI
//
// The coordinator is intentionally runtime-neutral.
// External, self-hosted, and Mass Diamond-native runtimes
// can all participate through the same contracts.
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
  readonly policyResolver: AIExecutionPolicyResolver;
  readonly providerResolver: AIProviderResolver;
  readonly planBuilder: AIExecutionPlanBuilder;
  readonly executionEngine: AIExecutionEngine;
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
    dependencies: AIRuntimeCoordinatorDependencies,
  ) {
    this.dependencies =
      dependencies;
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
              `AI_RUNTIME_RESOLUTION_FAILED`,
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
