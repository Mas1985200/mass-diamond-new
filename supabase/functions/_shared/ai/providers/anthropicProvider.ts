// ==========================================================
// Mass Diamond — Anthropic Provider
// Provider adapter for the Mass Diamond AI Core.
// ==========================================================

import type {
  AIExecutionRequest,
  AIExecutionResult,
  AIProvider,
  AIProviderError,
} from "../types";

const ANTHROPIC_API_URL =
  "https://api.anthropic.com/v1/messages";

const ANTHROPIC_VERSION =
  "2023-06-01";

export class AnthropicProvider
  implements AIProvider
{
  public readonly id =
    "anthropic" as const;

  public async execute(
    request: AIExecutionRequest,
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
          provider: this.id,
          retryable: false,
        },
      };
    }

    const startedAt = Date.now();

    try {
      const systemMessages =
        request.messages
          .filter(
            (message) =>
              message.role === "system",
          )
          .map(
            (message) =>
              message.content,
          )
          .join("\n\n");

      const messages =
        request.messages
          .filter(
            (message) =>
              message.role !== "system",
          )
          .map((message) => ({
            role:
              message.role ===
              "assistant"
                ? "assistant"
                : "user",
            content:
              message.content,
          }));

      const body: Record<
        string,
        unknown
      > = {
        model:
          request.model.model,
        messages,
        max_tokens:
          request.model
            .maxOutputTokens ??
          4096,
      };

      if (systemMessages) {
        body.system =
          systemMessages;
      }

      if (
        typeof request.model
          .temperature ===
        "number"
      ) {
        body.temperature =
          request.model
            .temperature;
      }

      const response =
        await fetch(
          ANTHROPIC_API_URL,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              "x-api-key":
                apiKey,
              "anthropic-version":
                ANTHROPIC_VERSION,
            },
            body:
              JSON.stringify(body),
          },
        );

      const payload: unknown =
        await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            this.createHttpError(
              response.status,
              payload,
            ),
        };
      }

      const content =
        this.extractContent(
          payload,
        );

      if (!content) {
        return {
          success: false,
          error: {
            code:
              "ANTHROPIC_EMPTY_RESPONSE",
            message:
              "Anthropic returned an empty response.",
            provider: this.id,
            retryable: true,
            statusCode:
              response.status,
          },
        };
      }

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
          usage:
            this.extractUsage(
              payload,
            ),
          latencyMs:
            Date.now() -
            startedAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code:
            "ANTHROPIC_NETWORK_ERROR",
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
    payload: unknown,
  ): string | undefined {
    if (
      typeof payload !==
        "object" ||
      payload === null
    ) {
      return undefined;
    }

    const content =
      (
        payload as {
          content?: unknown;
        }
      ).content;

    if (!Array.isArray(content)) {
      return undefined;
    }

    const textParts =
      content
        .filter(
          (
            block,
          ) =>
            typeof block ===
              "object" &&
            block !== null &&
            (
              block as {
                type?: unknown;
              }
            ).type ===
              "text",
        )
        .map(
          (block) =>
            (
              block as {
                text?: unknown;
              }
            ).text,
        )
        .filter(
          (
            value,
          ): value is string =>
            typeof value ===
            "string",
        );

    if (
      textParts.length === 0
    ) {
      return undefined;
    }

    return textParts.join("");
  }

  private extractUsage(
    payload: unknown,
  ) {
    if (
      typeof payload !==
        "object" ||
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
      typeof usage !==
        "object" ||
      usage === null
    ) {
      return undefined;
    }

    const data =
      usage as {
        input_tokens?: unknown;
        output_tokens?: unknown;
      };

    const inputTokens =
      this.readNumber(
        data.input_tokens,
      );

    const outputTokens =
      this.readNumber(
        data.output_tokens,
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

  private createHttpError(
    statusCode: number,
    payload: unknown,
  ): AIProviderError {
    return {
      code:
        `ANTHROPIC_HTTP_${statusCode}`,
      message:
        this.extractErrorMessage(
          payload,
        ) ??
        "Anthropic request failed.",
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
      typeof payload !==
        "object" ||
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
      typeof error !==
        "object" ||
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

    return typeof message ===
      "string"
      ? message
      : undefined;
  }

  private readNumber(
    value: unknown,
  ): number | undefined {
    return typeof value ===
      "number"
      ? value
      : undefined;
  }

  private getErrorMessage(
    error: unknown,
  ): string {
    return error instanceof Error
      ? error.message
      : "Unknown Anthropic network error.";
  }
}
