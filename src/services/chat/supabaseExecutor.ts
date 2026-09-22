import type {
  ChatApiResponse,
  ChatMessage,
} from "../../types";

import { createMessageId } from "../../lib/ids";
import { supabase } from "../supabase";

import type {
  ChatExecutionInput,
  ChatExecutionResult,
  ChatExecutor,
} from "./execution";

interface EdgeFunctionResponse {
  readonly success?: unknown;
  readonly content?: unknown;
  readonly capability?: unknown;
  readonly language?: unknown;
  readonly provider?: unknown;
  readonly model?: unknown;
  readonly conversationId?: unknown;
  readonly usage?: unknown;
  readonly meta?: unknown;
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

function createAssistantMessage(
  input: ChatExecutionInput,
  content: string,
): ChatMessage {
  const now =
    new Date().toISOString();

  return {
    id: createMessageId(),
    conversationId:
      input.request.conversationId ??
      "",
    role: "assistant",
    content,
    createdAt: now,
    updatedAt: now,
    status: "completed",
    attachments: [],
    ...(input.request.capabilityId
      ? {
          capabilityId:
            input.request.capabilityId,
        }
      : {}),
  };
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
  input: ChatExecutionInput,
  payload: EdgeFunctionResponse,
): ChatExecutionResult {
  const success =
    getBoolean(payload.success);

  if (success !== true) {
    const errorMessage =
      getString(payload.error) ??
      "The AI service could not complete the request.";

    return createExecutorError(
      errorMessage,
      true,
    );
  }

  const content =
    getString(payload.content);

  if (
    content === null ||
    content.trim().length === 0
  ) {
    return createExecutorError(
      "The AI service returned an empty response.",
      true,
    );
  }

  const conversationId =
    getString(
      payload.conversationId,
    ) ??
    input.request.conversationId;

  if (
    conversationId === null ||
    conversationId.length === 0
  ) {
    return createExecutorError(
      "The AI service did not return a conversation identifier.",
      false,
    );
  }

  const assistantMessage =
    createAssistantMessage(
      {
        ...input,
        request: {
          ...input.request,
          conversationId,
        },
      },
      content,
    );

  const response: ChatApiResponse = {
    conversationId,
    message: assistantMessage,
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
          },
        }
      : {}),
  };

  return {
    success: true,
    response,
    assistantMessage,
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
      message: input.request.message,
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
      payload = await response.json();
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
      const errorMessage =
        getString(parsed.error) ??
        `The AI service returned HTTP ${response.status}.`;

      return createExecutorError(
        errorMessage,
        response.status === 408 ||
          response.status === 429 ||
          response.status >= 500,
      );
    }

    return mapEdgeResponse(
      input,
      parsed,
    );
  }
}

export const supabaseChatExecutor =
  new SupabaseChatExecutor();
