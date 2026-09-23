// ==========================================================
// Mass Diamond — AI Execution Engine
//
// Responsibilities:
// - Provider execution
// - Timeout protection
// - Controlled retry
// - Provider fallback
// - Provider-neutral error handling
//
// This layer intentionally does NOT handle:
// - UI
// - persistence
// - authentication
// - routing
// - billing
// - provider-specific API logic
// ==========================================================

import type {
  AIExecutionRequest,
  AIExecutionResult,
  AIProvider,
  AIProviderError,
} from "./types";

export interface AIExecutionPolicy {
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly retryDelayMs: number;
}

export interface AIExecutionAttempt {
  readonly provider: string;
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
    providers: readonly AIProvider[],
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
    providers: readonly AIProvider[],
    policyOverrides: Partial<AIExecutionPolicy> = {},
  ): Promise<AIExecutionEngineResult> {
    const policy: AIExecutionPolicy = {
      ...DEFAULT_POLICY,
      ...policyOverrides,
    };

    if (providers.length === 0) {
      return {
        result: {
          success: false,
          error: {
            code: "NO_AI_PROVIDER_AVAILABLE",
            message:
              "No AI provider is available for execution.",
            retryable: false,
          },
        },
        attempts: [],
      };
    }

    const attempts: AIExecutionAttempt[] = [];

    let lastFailure: AIExecutionResult | undefined;

    for (
      let providerIndex = 0;
      providerIndex < providers.length;
      providerIndex += 1
    ) {
      const provider = providers[providerIndex];

      const providerResult =
        await this.executeWithRetry(
          request,
          provider,
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

      if (
        !providerResult.error.retryable
      ) {
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

  private async executeWithRetry(
    request: AIExecutionRequest,
    provider: AIProvider,
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

      const result =
        await this.executeWithTimeout(
          request,
          provider,
          policy.timeoutMs,
        );

      const latencyMs =
        Date.now() - startedAt;

      attempts.push({
        provider: provider.id,
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
        provider.id,
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
                      `Provider ${provider.id} exceeded the ${timeoutMs}ms execution timeout.`,
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
          "AI execution failed without a provider response.",
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
      : "Unknown AI provider execution error.";
  }
}

export const aiExecutionEngine =
  new DefaultAIExecutionEngine();
