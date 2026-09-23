// ==========================================================
// Mass Diamond — Groq AI Runtime Adapter
//
// External runtime adapter for Groq.
//
// This adapter is intentionally isolated from:
// - routing
// - retry policy
// - timeout policy
// - persistence
// - billing
//
// Mass Diamond AI Core owns orchestration.
// Groq is only one replaceable runtime.
// ==========================================================

import type {
  AIExecutionRequest,
  AIExecutionResult,
  AIProvider,
} from "../types";

export class GroqProvider
  implements AIProvider
{
  public readonly id = "groq";

  public readonly runtimeKind =
    "external" as const;

  public async execute(
    request: AIExecutionRequest,
  ): Promise<AIExecutionResult> {
    const apiKey =
      Deno.env.get("GROQ_API_KEY");

    if (!apiKey) {
      return {
        success: false,
        error: {
          code:
            "GROQ_API_KEY_MISSING",
          message:
            "Groq API key is not configured.",
          provider: this.id,
          retryable: false,
        },
      };
    }

    const startedAt = Date.now();

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: request.model.model,
            messages: request.messages,
            max_tokens:
              request.model
                .maxOutputTokens,
            temperature:
              request.model.temperature,
          }),
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
              "GROQ_HTTP_ERROR",
            message:
              errorBody ??
              `Groq request failed with status ${response.status}.`,
            provider: this.id,
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
        this.extractContent(data);

      if (!content) {
        return {
          success: false,
          error: {
            code:
              "GROQ_EMPTY_RESPONSE",
            message:
              "Groq returned an empty response.",
            provider: this.id,
            retryable: true,
          },
        };
      }

      const usage =
        this.extractUsage(data);

      return {
        success: true,
        response: {
          requestId:
            request.requestId,
          provider: this.id,
          model:
            request.model.model,
          content,
          status: "success",
          usage,
          latencyMs:
            Date.now() - startedAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code:
            "GROQ_NETWORK_ERROR",
          message:
            this.getErrorMessage(
              error,
            ),
          provider: this.id,
          retryable: true,
        },
      };
    }
  }

  private extractContent(
    data: unknown,
  ): string | undefined {
    if (
      typeof data !== "object" ||
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

    if (!Array.isArray(choices)) {
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
      ? content.trim() || undefined
      : undefined;
  }

  private extractUsage(
    data: unknown,
  ) {
    if (
      typeof data !== "object" ||
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

    const value = usage as {
      prompt_tokens?: unknown;
      completion_tokens?: unknown;
      total_tokens?: unknown;
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
  ): Promise<string | undefined> {
    try {
      const data =
        await response.json();

      if (
        typeof data !== "object" ||
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
        typeof error === "object" &&
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
      Number.isFinite(value)
      ? value
      : undefined;
  }

  private getErrorMessage(
    error: unknown,
  ): string {
    return error instanceof Error
      ? error.message
      : "Unknown Groq network error.";
  }
}
