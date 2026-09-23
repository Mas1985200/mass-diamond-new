// ==========================================================
// Mass Diamond — Anthropic AI Runtime Adapter
//
// External runtime adapter for Anthropic.
//
// This adapter is intentionally isolated from:
// - routing
// - retry policy
// - timeout policy
// - persistence
// - billing
//
// Mass Diamond AI Core owns orchestration.
// Anthropic is only one replaceable runtime.
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

export class AnthropicProvider
  implements AIProvider
{
  public readonly id =
    "anthropic";

  public readonly runtimeKind =
    "external" as const;

  public async execute(
    request: AIExecutionRequest,
    context?: AIExecutionContext,
  ): Promise<AIExecutionResult> {
    const apiKey =
      Deno.env.get(
        "ANTHROPIC_API_KEY",
      );

    if (!apiKey) {
      return {
        success: false,
        error: {
          code:
            "ANTHROPIC_API_KEY_MISSING",

          message:
            "Anthropic API key is not configured.",

          provider:
            this.id,

          retryable: false,
        },
      };
    }

    const startedAt =
      Date.now();

    try {
      const systemMessages =
        request.messages.filter(
          (message) =>
            message.role ===
            "system",
        );

      const conversationMessages =
        request.messages.filter(
          (message) =>
            message.role !==
            "system",
        );

      const response =
        await fetch(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "x-api-key":
                apiKey,

              "anthropic-version":
                "2023-06-01",
            },

            body: JSON.stringify({
              model:
                request.model.model,

              max_tokens:
                request.model
                  .maxOutputTokens ??
                4096,

              temperature:
                request.model
                  .temperature,

              ...(systemMessages.length >
              0
                ? {
                    system:
                      systemMessages
                        .map(
                          (message) =>
                            message.content,
                        )
                        .join(
                          "\n\n",
                        ),
                  }
                : {}),

              messages:
                conversationMessages.map(
                  (message) => ({
                    role:
                      message.role,

                    content:
                      message.content,
                  }),
                ),
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
              "ANTHROPIC_HTTP_ERROR",

            message:
              errorBody ??
              `Anthropic request failed with status ${response.status}.`,

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
              "ANTHROPIC_EMPTY_RESPONSE",

            message:
              "Anthropic returned an empty response.",

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
              "ANTHROPIC_REQUEST_ABORTED",

            message:
              "Anthropic request was aborted.",

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
            "ANTHROPIC_NETWORK_ERROR",

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

    const content =
      (
        data as {
          content?: unknown;
        }
      ).content;

    if (
      !Array.isArray(
        content,
      )
    ) {
      return undefined;
    }

    const textParts =
      content
        .filter(
          (
            block,
          ): block is {
            type: "text";
            text: string;
          } =>
            typeof block ===
              "object" &&
            block !== null &&
            (
              block as {
                type?: unknown;
              }
            ).type ===
              "text" &&
            typeof (
              block as {
                text?: unknown;
              }
            ).text ===
              "string",
        )
        .map(
          (block) =>
            block.text,
        );

    const result =
      textParts
        .join("")
        .trim();

    return (
      result || undefined
    );
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
        input_tokens?:
          unknown;

        output_tokens?:
          unknown;
      };

    const inputTokens =
      this.toNumber(
        value.input_tokens,
      );

    const outputTokens =
      this.toNumber(
        value.output_tokens,
      );

    return {
      inputTokens,

      outputTokens,

      totalTokens:
        inputTokens !==
          undefined &&
        outputTokens !==
          undefined
          ? inputTokens +
            outputTokens
          : undefined,
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
      : "Unknown Anthropic network error.";
  }
}
