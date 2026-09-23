// ==========================================================
// Mass Diamond — OpenAI AI Runtime Adapter
//
// External runtime adapter for OpenAI.
//
// This adapter is intentionally isolated from:
// - routing
// - retry policy
// - timeout policy
// - persistence
// - billing
//
// Mass Diamond AI Core owns orchestration.
// OpenAI is only one replaceable runtime.
//
// The execution context is provider-neutral. The adapter only
// uses the optional AbortSignal to cancel the underlying HTTP
// request when supported by the runtime.
// ==========================================================

import type {
  AIExecutionContext,
  AIExecutionRequest,
  AIExecutionResult,
  AIProvider,
} from "../types";

export class OpenAIProvider
  implements AIProvider
{
  public readonly id =
    "openai";

  public readonly runtimeKind =
    "external" as const;

  public async execute(
    request: AIExecutionRequest,
    context?: AIExecutionContext,
  ): Promise<AIExecutionResult> {
    const apiKey =
      Deno.env.get(
        "OPENAI_API_KEY",
      );

    if (!apiKey) {
      return {
        success: false,
        error: {
          code:
            "OPENAI_API_KEY_MISSING",

          message:
            "OpenAI API key is not configured.",

          provider:
            this.id,

          retryable: false,
        },
      };
    }

    const startedAt =
      Date.now();

    try {
      const response =
        await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${apiKey}`,
            },

            body: JSON.stringify({
              model:
                request.model.model,

              messages:
                request.messages,

              max_tokens:
                request.model
                  .maxOutputTokens,

              temperature:
                request.model
                  .temperature,
            }),

            signal:
              context?.signal,
          },
        );

      if (!response.ok) {
        const errorBody =
          await this.readErrorBody(
            response,
          );

        return {
          success: false,
          error: {
            code:
              "OPENAI_HTTP_ERROR",

            message:
              errorBody ??
              `OpenAI request failed with status ${response.status}.`,

            provider:
              this.id,

            retryable:
              response.status === 408 ||
              response.status === 409 ||
              response.status === 429 ||
              response.status >= 500,

            statusCode:
              response.status,
          },
        };
      }

      const data =
        await response.json();

      const content =
        this.extractContent(
          data,
        );

      if (!content) {
        return {
          success: false,
          error: {
            code:
              "OPENAI_EMPTY_RESPONSE",

            message:
              "OpenAI returned an empty response.",

            provider:
              this.id,

            retryable: true,
          },
        };
      }

      const usage =
        this.extractUsage(
          data,
        );

      return {
        success: true,
        response: {
          requestId:
            request.requestId,

          provider:
            this.id,

          model:
            request.model.model,

          content,

          status:
            "success",

          usage,

          latencyMs:
            Math.max(
              0,
              Date.now() -
                startedAt,
            ),
        },
      };
    } catch (error) {
      if (
        this.isAbortError(
          error,
        )
      ) {
        return {
          success: false,
          error: {
            code:
              "OPENAI_REQUEST_ABORTED",

            message:
              "OpenAI request was aborted.",

            provider:
              this.id,

            retryable: false,
          },
        };
      }

      return {
        success: false,
        error: {
          code:
            "OPENAI_NETWORK_ERROR",

          message:
            this.getErrorMessage(
              error,
            ),

          provider:
            this.id,

          retryable: true,
        },
      };
    }
  }

  private extractContent(
    data: unknown,
  ): string | undefined {
    if (
      typeof data !==
        "object" ||
      data === null
    ) {
      return undefined;
    }

    const choices =
      (
        data as {
          choices?: unknown;
        }
      ).choices;

    if (
      !Array.isArray(
        choices,
      )
    ) {
      return undefined;
    }

    const firstChoice =
      choices[0];

    if (
      typeof firstChoice !==
        "object" ||
      firstChoice === null
    ) {
      return undefined;
    }

    const message =
      (
        firstChoice as {
          message?: unknown;
        }
      ).message;

    if (
      typeof message !==
        "object" ||
      message === null
    ) {
      return undefined;
    }

    const content =
      (
        message as {
          content?: unknown;
        }
      ).content;

    return typeof content ===
      "string"
      ? content.trim() ||
        undefined
      : undefined;
  }

  private extractUsage(
    data: unknown,
  ) {
    if (
      typeof data !==
        "object" ||
      data === null
    ) {
      return undefined;
    }

    const usage =
      (
        data as {
          usage?: unknown;
        }
      ).usage;

    if (
      typeof usage !==
        "object" ||
      usage === null
    ) {
      return undefined;
    }

    const value =
      usage as {
        prompt_tokens?:
          unknown;

        completion_tokens?:
          unknown;

        total_tokens?:
          unknown;
      };

    return {
      inputTokens:
        this.toNumber(
          value.prompt_tokens,
        ),

      outputTokens:
        this.toNumber(
          value.completion_tokens,
        ),

      totalTokens:
        this.toNumber(
          value.total_tokens,
        ),
    };
  }

  private async readErrorBody(
    response: Response,
  ): Promise<
    string | undefined
  > {
    try {
      const data =
        await response.json();

      if (
        typeof data !==
          "object" ||
        data === null
      ) {
        return undefined;
      }

      const error =
        (
          data as {
            error?: unknown;
          }
        ).error;

      if (
        typeof error ===
          "object" &&
        error !== null
      ) {
        const message =
          (
            error as {
              message?: unknown;
            }
          ).message;

        if (
          typeof message ===
          "string"
        ) {
          return message;
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  private toNumber(
    value: unknown,
  ): number | undefined {
    return typeof value ===
      "number" &&
      Number.isFinite(
        value,
      )
      ? value
      : undefined;
  }

  private isAbortError(
    error: unknown,
  ): boolean {
    if (
      typeof error !==
        "object" ||
      error === null
    ) {
      return false;
    }

    const candidate =
      error as {
        name?: unknown;
      };

    return (
      candidate.name ===
      "AbortError"
    );
  }

  private getErrorMessage(
    error: unknown,
  ): string {
    return error instanceof
      Error
      ? error.message
      : "Unknown OpenAI network error.";
  }
}
