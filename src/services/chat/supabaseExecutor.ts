import type {
  ChatApiResponse,
  ChatMessage,
} from "../../types";

import { supabase } from "../supabase";

import type {
  ChatExecutionInput,
  ChatExecutionResult,
  ChatExecutor,
} from "./execution";

interface EdgeFunctionResponse {
  readonly success?: unknown;
  readonly conversationId?: unknown;
  readonly message?: unknown;
  readonly usage?: unknown;
  readonly error?: unknown;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function getString(
  value: unknown,
): string | null {
  return typeof value === "string"
    ? value
    : null;
}

function getBoolean(
  value: unknown,
): boolean | null {
  return typeof value === "boolean"
    ? value
    : null;
}

function createExecutorError(
  message: string,
  retryable: boolean,
): ChatExecutionResult {
  return {
    success: false,
    error: {
      code: "PROVIDER_ERROR",
      message,
      retryable,
    },
  };
}

function getFunctionsUrl(): string {
  const baseUrl =
    import.meta.env.VITE_SUPABASE_URL
      .trim()
      .replace(/\/+$/, "");

  return `${baseUrl}/functions/v1/ai-chat`;
}

function isChatMessage(
  value: unknown,
): value is ChatMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.conversationId ===
      "string" &&
    value.role === "assistant" &&
    typeof value.content === "string" &&
    typeof value.createdAt === "string" &&
    (value.updatedAt === undefined ||
      typeof value.updatedAt === "string") &&
    (
      value.status === "sending" ||
      value.status === "sent" ||
      value.status === "streaming" ||
      value.status === "completed" ||
      value.status === "error"
    ) &&
    Array.isArray(value.attachments)
  );
}

function parseEdgeResponse(
  value: unknown,
): EdgeFunctionResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  return value;
}

function mapEdgeResponse(
  payload: EdgeFunctionResponse,
): ChatExecutionResult {
  const success =
    getBoolean(payload.success);

  if (success !== true) {
    return createExecutorError(
      getString(payload.error) ??
        "The AI service could not complete the request.",
      true,
    );
  }

  if (
    !isChatMessage(payload.message)
  ) {
    return createExecutorError(
      "The AI service returned an invalid assistant message.",
      false,
    );
  }

  if (
    payload.message.content.trim()
      .length === 0
  ) {
    return createExecutorError(
      "The AI service returned an empty assistant response.",
      true,
    );
  }

  const conversationId =
    getString(
      payload.conversationId,
    ) ??
    payload.message.conversationId;

  if (
    conversationId.length === 0 ||
    conversationId !==
      payload.message.conversationId
  ) {
    return createExecutorError(
      "The AI service returned an invalid conversation identifier.",
      false,
    );
  }

  const response: ChatApiResponse = {
    conversationId,
    message: payload.message,
    ...(isRecord(payload.usage)
      ? {
          usage: {
            ...(typeof payload.usage
              .inputTokens === "number"
              ? {
                  inputTokens:
                    payload.usage
                      .inputTokens,
                }
              : {}),
            ...(typeof payload.usage
              .outputTokens === "number"
              ? {
                  outputTokens:
                    payload.usage
                      .outputTokens,
                }
              : {}),
            ...(typeof payload.usage
              .totalTokens === "number"
              ? {
                  totalTokens:
                    payload.usage
                      .totalTokens,
                }
              : {}),
            ...(typeof payload.usage
              .latencyMs === "number"
              ? {
                  latencyMs:
                    payload.usage
                      .latencyMs,
                }
              : {}),
          },
        }
      : {}),
  };

  return {
    success: true,
    response,
    assistantMessage:
      payload.message,
  };
}

export class SupabaseChatExecutor
  implements ChatExecutor
{
  public async execute(
    input: ChatExecutionInput,
  ): Promise<ChatExecutionResult> {
    const {
      data: {
        session,
      },
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (sessionError) {
      return createExecutorError(
        "Unable to verify the current authentication session.",
        true,
      );
    }

    if (!session) {
      return {
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message:
            "Authentication is required to execute chat.",
          retryable: false,
        },
      };
    }

    const body = {
      message:
        input.request.message,
      ...(input.request.conversationId
        ? {
            conversationId:
              input.request.conversationId,
          }
        : {}),
      ...(input.request.capabilityId
        ? {
            capability:
              input.request.capabilityId,
          }
        : {}),
      ...(input.request.locale
        ? {
            language:
              input.request.locale,
          }
        : {}),
      ...(input.request.attachments &&
      input.request.attachments.length > 0
        ? {
            attachments:
              input.request.attachments,
          }
        : {}),
      requestId:
        input.context.requestId,
    };

    let response: Response;

    try {
      response = await fetch(
        getFunctionsUrl(),
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey:
              import.meta.env
                .VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(body),
        },
      );
    } catch {
      return createExecutorError(
        "Unable to reach the AI service.",
        true,
      );
    }

    let payload: unknown;

    try {
      payload =
        await response.json();
    } catch {
      return createExecutorError(
        "The AI service returned an invalid response.",
        response.status >= 500,
      );
    }

    const parsed =
      parseEdgeResponse(payload);

    if (!parsed) {
      return createExecutorError(
        "The AI service returned an invalid response format.",
        response.status >= 500,
      );
    }

    if (!response.ok) {
      return createExecutorError(
        getString(parsed.error) ??
          `The AI service returned HTTP ${response.status}.`,
        response.status === 408 ||
          response.status === 429 ||
          response.status >= 500,
      );
    }

    return mapEdgeResponse(
      parsed,
    );
  }
}

export const supabaseChatExecutor =
  new SupabaseChatExecutor();
