// ==========================================================
// Mass Diamond — AI Execution Engine
//
// Executes an AI execution plan while keeping execution
// mechanics independent from provider implementations.
//
// Responsibilities:
// - Execute provider/model targets
// - Timeout protection
// - Controlled retry
// - Ordered fallback
// - Provider-neutral error handling
//
// This layer intentionally does NOT handle:
// - UI
// - Authentication
// - Routing
// - Persistence
// - Billing
// - Capability selection
// - Provider-specific API logic
//
// External providers are runtime adapters only.
// Self-hosted and Mass Diamond-native runtimes can use
// the same execution contract in the future.
// ==========================================================

import type {
  AIExecutionRequest,
  AIExecutionResult,
  AIProvider,
  AIProviderError,
} from "./types";

import type {
  AIExecutionPlan,
  AIExecutionTarget,
} from "./aiExecutionPlan";

export interface AIExecutionPolicy {
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly retryDelayMs: number;
}

export interface AIExecutionAttempt {
  readonly provider: string;
  readonly model: string;
  readonly attempt: number;
  readonly latencyMs: number;
  readonly success: boolean;
  readonly errorCode?: string;
}

export interface AIExecutionEngineResult {
  readonly result: AIExecutionResult;
  readonly attempts: readonly AIExecutionAttempt[];
}

export interface AIExecutionEngine {
  execute(
    request: AIExecutionRequest,
    plan: AIExecutionPlan,
    policy?: Partial<AIExecutionPolicy>,
  ): Promise<AIExecutionEngineResult>;
}

const DEFAULT_POLICY: AIExecutionPolicy = {
  timeoutMs: 30_000,
  maxRetries: 1,
  retryDelayMs: 500,
};

export class DefaultAIExecutionEngine
  implements AIExecutionEngine
{
  public async execute(
    request: AIExecutionRequest,
    plan: AIExecutionPlan,
    policyOverrides: Partial<AIExecutionPolicy> = {},
  ): Promise<AIExecutionEngineResult> {
    const policy: AIExecutionPolicy = {
      ...DEFAULT_POLICY,
      ...policyOverrides,
    };

    if (plan.targets.length === 0) {
      return {
        result: {
          success: false,
          error: {
            code: "NO_AI_EXECUTION_TARGET_AVAILABLE",
            message:
              "No AI execution target is available.",
            retryable: false,
          },
        },
        attempts: [],
      };
    }

    const attempts: AIExecutionAttempt[] = [];

    let lastFailure: AIExecutionResult | undefined;

    for (
      const target of plan.targets
    ) {
      const providerResult =
        await this.executeTargetWithRetry(
          request,
          target,
          policy,
          attempts,
        );

      if (providerResult.success) {
        return {
          result: providerResult,
          attempts,
        };
      }

      lastFailure = providerResult;

      if (!providerResult.error.retryable) {
        break;
      }
    }

    return {
      result:
        lastFailure ??
        this.createUnknownFailure(),
      attempts,
    };
  }

  private async executeTargetWithRetry(
    request: AIExecutionRequest,
    target: AIExecutionTarget,
    policy: AIExecutionPolicy,
    attempts: AIExecutionAttempt[],
  ): Promise<AIExecutionResult> {
    let lastResult:
      | AIExecutionResult
      | undefined;

    const totalAttempts =
      policy.maxRetries + 1;

    for (
      let attempt = 1;
      attempt <= totalAttempts;
      attempt += 1
    ) {
      const startedAt = Date.now();

      const executionRequest: AIExecutionRequest = {
        ...request,
        model: target.model,
      };

      const result =
        await this.executeWithTimeout(
          executionRequest,
          target.provider,
          policy.timeoutMs,
        );

      const latencyMs =
        Date.now() - startedAt;

      attempts.push({
        provider: target.provider.id,
        model: target.model.model,
        attempt,
        latencyMs,
        success: result.success,
        errorCode: result.success
          ? undefined
          : result.error.code,
      });

      if (result.success) {
        return result;
      }

      lastResult = result;

      if (
        !result.error.retryable ||
        attempt >= totalAttempts
      ) {
        break;
      }

      await this.delay(
        policy.retryDelayMs,
      );
    }

    return (
      lastResult ??
      this.createUnknownFailure(
        target.provider.id,
      )
    );
  }

  private async executeWithTimeout(
    request: AIExecutionRequest,
    provider: AIProvider,
    timeoutMs: number,
  ): Promise<AIExecutionResult> {
    let timeoutHandle:
      | ReturnType<typeof setTimeout>
      | undefined;

    try {
      const timeoutPromise =
        new Promise<AIExecutionResult>(
          (resolve) => {
            timeoutHandle =
              setTimeout(() => {
                resolve({
                  success: false,
                  error: {
                    code:
                      "AI_PROVIDER_TIMEOUT",
                    message:
                      `AI runtime ${provider.id} exceeded the ${timeoutMs}ms execution timeout.`,
                    provider:
                      provider.id,
                    retryable: true,
                  },
                });
              }, timeoutMs);
          },
        );

      return await Promise.race([
        provider.execute(request),
        timeoutPromise,
      ]);
    } catch (error) {
      return {
        success: false,
        error: {
          code:
            "AI_PROVIDER_EXECUTION_ERROR",
          message:
            this.getErrorMessage(error),
          provider: provider.id,
          retryable: true,
        },
      };
    } finally {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private async delay(
    milliseconds: number,
  ): Promise<void> {
    if (milliseconds <= 0) {
      return;
    }

    await new Promise<void>(
      (resolve) => {
        setTimeout(
          resolve,
          milliseconds,
        );
      },
    );
  }

  private createUnknownFailure(
    provider?: string,
  ): AIExecutionResult {
    return {
      success: false,
      error: {
        code: "AI_EXECUTION_FAILED",
        message:
          "AI execution failed without a runtime response.",
        provider:
          provider as AIProviderError["provider"],
        retryable: true,
      },
    };
  }

  private getErrorMessage(
    error: unknown,
  ): string {
    return error instanceof Error
      ? error.message
      : "Unknown AI runtime execution error.";
  }
}

export const aiExecutionEngine =
  new DefaultAIExecutionEngine();
