// ==========================================================
// Mass Diamond — Google Provider
// Provider adapter for the Mass Diamond AI Core.
// ==========================================================

import type {
  AIExecutionRequest,
  AIExecutionResult,
  AIProvider,
  AIProviderError,
} from "../types";

const GOOGLE_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

export class GoogleProvider
  implements AIProvider
{
  public readonly id =
    "google" as const;

  public async execute(
    request: AIExecutionRequest,
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
            "GOOGLE_API_KEY_MISSING",
          message:
            "Google AI API key is not configured.",
          provider: this.id,
          retryable: false,
        },
      };
    }

    const startedAt = Date.now();

    try {
      const systemInstruction =
        this.extractSystemInstruction(
          request,
        );

      const contents =
        request.messages
          .filter(
            (message) =>
              message.role !== "system",
          )
          .map((message) => ({
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
          }));

      const body: Record<
        string,
        unknown
      > = {
        contents,
      };

      if (systemInstruction) {
        body.systemInstruction = {
          parts: [
            {
              text:
                systemInstruction,
            },
          ],
        };
      }

      const generationConfig: Record<
        string,
        unknown
      > = {};

      if (
        typeof request.model
          .maxOutputTokens ===
        "number"
      ) {
        generationConfig.maxOutputTokens =
          request.model
            .maxOutputTokens;
      }

      if (
        typeof request.model
          .temperature ===
        "number"
      ) {
        generationConfig.temperature =
          request.model
            .temperature;
      }

      if (
        Object.keys(
          generationConfig,
        ).length > 0
      ) {
        body.generationConfig =
          generationConfig;
      }

      const url =
        `${GOOGLE_API_BASE_URL}/` +
        `${encodeURIComponent(request.model.model)}` +
        `:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response =
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify(body),
        });

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
              "GOOGLE_EMPTY_RESPONSE",
            message:
              "Google AI returned an empty response.",
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
            "GOOGLE_NETWORK_ERROR",
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

  private extractSystemInstruction(
    request: AIExecutionRequest,
  ): string | undefined {
    const messages =
      request.messages.filter(
        (message) =>
          message.role === "system",
      );

    if (messages.length === 0) {
      return undefined;
    }

    return messages
      .map(
        (message) =>
          message.content,
      )
      .join("\n\n");
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

    const candidates =
      (
        payload as {
          candidates?: unknown;
        }
      ).candidates;

    if (!Array.isArray(candidates)) {
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

    if (!Array.isArray(parts)) {
      return undefined;
    }

    const textParts =
      parts
        .map(
          (part) =>
            typeof part ===
              "object" &&
            part !== null
              ? (
                  part as {
                    text?: unknown;
                  }
                ).text
              : undefined,
        )
        .filter(
          (
            value,
          ): value is string =>
            typeof value ===
            "string",
        );

    return textParts.length > 0
      ? textParts.join("")
      : undefined;
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

    const data =
      usage as {
        promptTokenCount?: unknown;
        candidatesTokenCount?: unknown;
        totalTokenCount?: unknown;
      };

    return {
      inputTokens:
        this.readNumber(
          data.promptTokenCount,
        ),
      outputTokens:
        this.readNumber(
          data.candidatesTokenCount,
        ),
      totalTokens:
        this.readNumber(
          data.totalTokenCount,
        ),
    };
  }

  private createHttpError(
    statusCode: number,
    payload: unknown,
  ): AIProviderError {
    return {
      code:
        `GOOGLE_HTTP_${statusCode}`,
      message:
        this.extractErrorMessage(
          payload,
        ) ??
        "Google AI request failed.",
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
      : "Unknown Google AI network error.";
  }
}
