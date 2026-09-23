// ==========================================================
// Mass Diamond — Groq Provider
// Provider adapter for the Mass Diamond AI Core.
// ==========================================================

import type {
  AIExecutionRequest,
  AIExecutionResult,
  AIProvider,
  AIProviderError,
} from "../types";

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

export class GroqProvider implements AIProvider {
  public readonly id = "groq" as const;

  public async execute(
    request: AIExecutionRequest,
  ): Promise<AIExecutionResult> {
    const apiKey = Deno.env.get("GROQ_API_KEY");

    if (!apiKey) {
      return {
        success: false,
        error: {
          code: "GROQ_API_KEY_MISSING",
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
        GROQ_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: request.model.model,
            messages: request.messages,
            max_tokens:
              request.model.maxOutputTokens,
            temperature:
              request.model.temperature,
          }),
        },
      );

      const payload: unknown =
        await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: this.createHttpError(
            response.status,
            payload,
          ),
        };
      }

      const content =
        this.extractContent(payload);

      if (!content) {
        return {
          success: false,
          error: {
            code: "GROQ_EMPTY_RESPONSE",
            message:
              "Groq returned an empty response.",
            provider: this.id,
            retryable: true,
            statusCode: response.status,
          },
        };
      }

      return {
        success: true,
        response: {
          requestId: request.requestId,
          provider: this.id,
          model: request.model.model,
          content,
          status: "success",
          usage: this.extractUsage(payload),
          latencyMs:
            Date.now() - startedAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "GROQ_NETWORK_ERROR",
          message:
            this.getErrorMessage(error),
          provider: this.id,
          retryable: true,
        },
      };
    }
  }

  private extractContent(
    payload: unknown,
  ): string | undefined {
    if (
      typeof payload !== "object" ||
      payload === null
    ) {
      return undefined;
    }

    const choices =
      (
        payload as {
          choices?: unknown;
        }
      ).choices;

    if (!Array.isArray(choices)) {
      return undefined;
    }

    const firstChoice = choices[0];

    if (
      typeof firstChoice !== "object" ||
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
      typeof message !== "object" ||
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

    return typeof content === "string"
      ? content
      : undefined;
  }

  private extractUsage(
    payload: unknown,
  ) {
    if (
      typeof payload !== "object" ||
      payload === null
    ) {
      return undefined;
    }

    const usage =
      (
        payload as {
          usage?: unknown;
        }
      ).usage;

    if (
      typeof usage !== "object" ||
      usage === null
    ) {
      return undefined;
    }

    const data =
      usage as {
        prompt_tokens?: unknown;
        completion_tokens?: unknown;
        total_tokens?: unknown;
      };

    return {
      inputTokens:
        this.readNumber(
          data.prompt_tokens,
        ),
      outputTokens:
        this.readNumber(
          data.completion_tokens,
        ),
      totalTokens:
        this.readNumber(
          data.total_tokens,
        ),
    };
  }

  private createHttpError(
    statusCode: number,
    payload: unknown,
  ): AIProviderError {
    return {
      code:
        `GROQ_HTTP_${statusCode}`,
      message:
        this.extractErrorMessage(
          payload,
        ) ??
        "Groq request failed.",
      provider: this.id,
      retryable:
        statusCode === 408 ||
        statusCode === 409 ||
        statusCode === 429 ||
        statusCode >= 500,
      statusCode,
    };
  }

  private extractErrorMessage(
    payload: unknown,
  ): string | undefined {
    if (
      typeof payload !== "object" ||
      payload === null
    ) {
      return undefined;
    }

    const error =
      (
        payload as {
          error?: unknown;
        }
      ).error;

    if (
      typeof error !== "object" ||
      error === null
    ) {
      return undefined;
    }

    const message =
      (
        error as {
          message?: unknown;
        }
      ).message;

    return typeof message === "string"
      ? message
      : undefined;
  }

  private readNumber(
    value: unknown,
  ): number | undefined {
    return typeof value === "number"
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
