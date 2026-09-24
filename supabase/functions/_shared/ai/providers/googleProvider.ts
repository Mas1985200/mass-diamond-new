// ==========================================================
// Mass Diamond — Google AI Runtime Adapter
//
// External runtime adapter for Google Gemini.
//
// This adapter is intentionally isolated from:
// - routing
// - retry policy
// - timeout policy
// - persistence
// - billing
//
// Mass Diamond AI Core owns orchestration.
// Google is only one replaceable runtime.
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
} from "../types.ts";

export class GoogleAIProvider
  implements AIProvider
{
  public readonly id =
    "google";

  public readonly runtimeKind =
    "external" as const;

  public async execute(
    request: AIExecutionRequest,
    context?: AIExecutionContext,
  ): Promise<AIExecutionResult> {
    const apiKey =
      Deno.env.get(
        "GOOGLE_AI_API_KEY",
      ) ??
      Deno.env.get(
        "GEMINI_API_KEY",
      );

    if (!apiKey) {
      return {
        success: false,
        error: {
          code:
            "GOOGLE_AI_API_KEY_MISSING",

          message:
            "Google AI API key is not configured.",

          provider:
            this.id,

          retryable: false,
        },
      };
    }

    const startedAt =
      Date.now();

    try {
      const endpoint =
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          request.model.model,
        )}:generateContent?key=${encodeURIComponent(
          apiKey,
        )}`;

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
          endpoint,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ...(systemMessages.length >
              0
                ? {
                    systemInstruction: {
                      parts:
                        systemMessages.map(
                          (message) => ({
                            text:
                              message.content,
                          }),
                        ),
                    },
                  }
                : {}),

              contents:
                conversationMessages.map(
                  (message) => ({
                    role:
                      message.role ===
                      "assistant"
                        ? "model"
                        : "user",

                    parts: [
                      {
                        text:
                          message.content,
                      },
                    ],
                  }),
                ),

              generationConfig: {
                ...(request.model
                  .maxOutputTokens !==
                undefined
                  ? {
                      maxOutputTokens:
                        request.model
                          .maxOutputTokens,
                    }
                  : {}),

                ...(request.model
                  .temperature !==
                undefined
                  ? {
                      temperature:
                        request.model
                          .temperature,
                    }
                  : {}),
              },
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
              "GOOGLE_AI_HTTP_ERROR",

            message:
              errorBody ??
              `Google AI request failed with status ${response.status}.`,

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
              "GOOGLE_AI_EMPTY_RESPONSE",

            message:
              "Google AI returned an empty response.",

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
              "GOOGLE_AI_REQUEST_ABORTED",

            message:
              "Google AI request was aborted.",

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
            "GOOGLE_AI_NETWORK_ERROR",

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

    const candidates =
      (
        data as {
          candidates?: unknown;
        }
      ).candidates;

    if (
      !Array.isArray(
        candidates,
      )
    ) {
      return undefined;
    }

    const firstCandidate =
      candidates[0];

    if (
      typeof firstCandidate !==
        "object" ||
      firstCandidate === null
    ) {
      return undefined;
    }

    const content =
      (
        firstCandidate as {
          content?: unknown;
        }
      ).content;

    if (
      typeof content !==
        "object" ||
      content === null
    ) {
      return undefined;
    }

    const parts =
      (
        content as {
          parts?: unknown;
        }
      ).parts;

    if (
      !Array.isArray(
        parts,
      )
    ) {
      return undefined;
    }

    const textParts =
      parts
        .filter(
          (
            part,
          ): part is {
            text: string;
          } =>
            typeof part ===
              "object" &&
            part !== null &&
            typeof (
              part as {
                text?: unknown;
              }
            ).text ===
              "string",
        )
        .map(
          (part) =>
            part.text,
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
          usageMetadata?: unknown;
        }
      ).usageMetadata;

    if (
      typeof usage !==
        "object" ||
      usage === null
    ) {
      return undefined;
    }

    const value =
      usage as {
        promptTokenCount?:
          unknown;

        candidatesTokenCount?:
          unknown;

        totalTokenCount?:
          unknown;
      };

    return {
      inputTokens:
        this.toNumber(
          value.promptTokenCount,
        ),

      outputTokens:
        this.toNumber(
          value.candidatesTokenCount,
        ),

      totalTokens:
        this.toNumber(
          value.totalTokenCount,
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
        typeof data ===
          "object" &&
        data !== null
      ) {
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
              "string" &&
            message.trim()
              .length > 0
          ) {
            return message.trim();
          }
        }
      }
    } catch {
      // Fall through to text parsing.
    }

    try {
      const text =
        await response.text();

      return text.trim() ||
        undefined;
    } catch {
      return undefined;
    }
  }

  private toNumber(
    value: unknown,
  ): number | undefined {
    return typeof value ===
      "number" &&
      Number.isFinite(value)
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

    const name =
      (
        error as {
          name?: unknown;
        }
      ).name;

    return name ===
      "AbortError";
  }

  private getErrorMessage(
    error: unknown,
  ): string {
    if (
      error instanceof Error
    ) {
      return (
        error.message ||
        "Google AI request failed."
      );
    }

    if (
      typeof error ===
        "string"
    ) {
      return error;
    }

    return (
      "Google AI request failed."
    );
  }
}
