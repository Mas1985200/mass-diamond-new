// ==========================================================
// Mass Diamond — Core AI Chat Edge Function
//
// Responsibilities:
// - CORS / HTTP method handling
// - Request parsing and validation
// - Supabase authentication
// - Conversation ownership validation
// - Trusted user-message persistence
// - AI conversation-context loading
// - AI Runtime Coordinator execution
// - Trusted assistant-message persistence
// - Stable API responses
//
// Provider execution remains inside AI Core.
// This function must never expose provider secrets.
// ==========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  aiRuntimeCoordinator,
} from "../_shared/ai/aiRuntimeCoordinator";

import type {
  AIExecutionRequest,
} from "../_shared/ai/types";

interface ChatRequest {
  readonly message?: unknown;
  readonly conversationId?: unknown;
  readonly capability?: unknown;
  readonly language?: unknown;
  readonly attachments?: unknown;
  readonly requestId?: unknown;
}

interface AuthenticatedUser {
  readonly id: string;
}

interface ConversationRecord {
  readonly id: string;
  readonly user_id: string;
}

interface ChatMessageRecord {
  readonly role: "user" | "assistant";
  readonly content: string;
}

interface ErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly requestId?: string;
}

interface SuccessResponse {
  readonly success: true;
  readonly conversationId: string;
  readonly message: {
    readonly id: string;
    readonly conversationId: string;
    readonly userId: string;
    readonly role: "assistant";
    readonly content: string;
    readonly status: "completed";
    readonly attachments: readonly [];
    readonly capabilityId?: string;
    readonly createdAt: string;
    readonly updatedAt: string;
  };
}

type ApiResponse =
  | ErrorResponse
  | SuccessResponse;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

const MAX_MESSAGE_LENGTH = 32_000;
const MAX_HISTORY_MESSAGES = 40;

function jsonResponse(
  body: ApiResponse,
  status: number,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
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

function getOptionalString(
  value: unknown,
): string | undefined {
  const stringValue =
    getString(value);

  if (
    stringValue === null ||
    stringValue.trim().length === 0
  ) {
    return undefined;
  }

  return stringValue.trim();
}

function createRequestId(
  value: unknown,
): string {
  const requestId =
    getOptionalString(value);

  return (
    requestId ??
    crypto.randomUUID()
  );
}

function getBearerToken(
  request: Request,
): string | null {
  const authorization =
    request.headers.get(
      "Authorization",
    );

  if (!authorization) {
    return null;
  }

  const match =
    authorization.match(
      /^Bearer\s+(.+)$/i,
    );

  return match?.[1]?.trim() ?? null;
}

function createSupabaseClient(
  accessToken: string,
) {
  const supabaseUrl =
    Deno.env.get(
      "SUPABASE_URL",
    );

  const supabaseAnonKey =
    Deno.env.get(
      "SUPABASE_ANON_KEY",
    );

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      "Supabase environment configuration is incomplete.",
    );
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },
    },
  );
}

function createAdminSupabaseClient() {
  const supabaseUrl =
    Deno.env.get(
      "SUPABASE_URL",
    );

  const serviceRoleKey =
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Supabase server configuration is incomplete.",
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

async function getAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const accessToken =
    getBearerToken(request);

  if (!accessToken) {
    return null;
  }

  const supabase =
    createSupabaseClient(
      accessToken,
    );

  const {
    data,
    error,
  } =
    await supabase.auth.getUser(
      accessToken,
    );

  if (
    error ||
    !data.user
  ) {
    return null;
  }

  return {
    id: data.user.id,
  };
}

function validateMessage(
  value: unknown,
): string | null {
  const message =
    getString(value);

  if (message === null) {
    return null;
  }

  const normalized =
    message.trim();

  if (
    normalized.length === 0 ||
    normalized.length >
      MAX_MESSAGE_LENGTH
  ) {
    return null;
  }

  return normalized;
}

function validateCapability(
  value: unknown,
): string | undefined {
  const capability =
    getOptionalString(value);

  if (!capability) {
    return undefined;
  }

  if (
    capability.length > 100
  ) {
    return undefined;
  }

  return capability;
}

function validateLanguage(
  value: unknown,
): string | undefined {
  const language =
    getOptionalString(value);

  if (!language) {
    return undefined;
  }

  if (
    language.length > 20
  ) {
    return undefined;
  }

  return language;
}

async function parseRequest(
  request: Request,
): Promise<ChatRequest | null> {
  try {
    const body =
      await request.json();

    if (!isRecord(body)) {
      return null;
    }

    return body as ChatRequest;
  } catch {
    return null;
  }
}

async function getConversation(
  supabase: ReturnType<
    typeof createAdminSupabaseClient
  >,
  conversationId: string,
  userId: string,
): Promise<
  ConversationRecord | null
> {
  const {
    data,
    error,
  } =
    await supabase
      .from("chat_conversations")
      .select(
        "id, user_id",
      )
      .eq(
        "id",
        conversationId,
      )
      .eq(
        "user_id",
        userId,
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      "Failed to validate conversation ownership.",
    );
  }

  return data as
    | ConversationRecord
    | null;
}

async function createConversation(
  supabase: ReturnType<
    typeof createAdminSupabaseClient
  >,
  userId: string,
): Promise<ConversationRecord> {
  const {
    data,
    error,
  } =
    await supabase
      .from("chat_conversations")
      .insert({
        user_id: userId,
      })
      .select(
        "id, user_id",
      )
      .single();

  if (
    error ||
    !data
  ) {
    throw new Error(
      "Failed to create conversation.",
    );
  }

  return data as ConversationRecord;
}

async function loadConversationMessages(
  supabase: ReturnType<
    typeof createAdminSupabaseClient
  >,
  conversationId: string,
  userId: string,
): Promise<
  readonly ChatMessageRecord[]
> {
  const {
    data,
    error,
  } =
    await supabase
      .from("chat_messages")
      .select(
        "role, content",
      )
      .eq(
        "conversation_id",
        conversationId,
      )
      .eq(
        "user_id",
        userId,
      )
      .in(
        "role",
        ["user", "assistant"],
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(
        MAX_HISTORY_MESSAGES,
      );

  if (error) {
    throw new Error(
      "Failed to load conversation history.",
    );
  }

  const messages =
    (data ?? []) as ChatMessageRecord[];

  return [
    ...messages,
  ].reverse();
}

async function insertUserMessage(
  supabase: ReturnType<
    typeof createAdminSupabaseClient
  >,
  userId: string,
  conversationId: string,
  content: string,
  capabilityId?: string,
): Promise<string> {
  const messageId =
    crypto.randomUUID();

  const {
    error,
  } =
    await supabase
      .from("chat_messages")
      .insert({
        id: messageId,
        conversation_id:
          conversationId,
        user_id: userId,
        role: "user",
        content,
        status: "completed",
        attachments: [],
        ...(capabilityId
          ? {
              capability_id:
                capabilityId,
            }
          : {}),
      });

  if (error) {
    throw new Error(
      "Failed to persist user message.",
    );
  }

  return messageId;
}

async function insertAssistantMessage(
  supabase: ReturnType<
    typeof createAdminSupabaseClient
  >,
  userId: string,
  conversationId: string,
  content: string,
  capabilityId?: string,
): Promise<{
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}> {
  const messageId =
    crypto.randomUUID();

  const now =
    new Date().toISOString();

  const {
    error,
  } =
    await supabase
      .from("chat_messages")
      .insert({
        id: messageId,
        conversation_id:
          conversationId,
        user_id: userId,
        role: "assistant",
        content,
        status: "completed",
        attachments: [],
        ...(capabilityId
          ? {
              capability_id:
                capabilityId,
            }
          : {}),
      });

  if (error) {
    throw new Error(
      "Failed to persist assistant message.",
    );
  }

  return {
    id: messageId,
    createdAt: now,
    updatedAt: now,
  };
}

async function touchConversation(
  supabase: ReturnType<
    typeof createAdminSupabaseClient
  >,
  conversationId: string,
): Promise<void> {
  const {
    error,
  } =
    await supabase
      .from("chat_conversations")
      .update({
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        conversationId,
      );

  if (error) {
    throw new Error(
      "Failed to update conversation timestamp.",
    );
  }
}

function buildAIRequest(
  requestId: string,
  userId: string,
  conversationId: string,
  messageId: string,
  history:
    readonly ChatMessageRecord[],
  message: string,
  capability?: string,
  language?: string,
): AIExecutionRequest {
  const messages = [
    ...history,
    {
      role: "user" as const,
      content: message,
    },
  ];

  return {
    requestId,
    userId,
    conversationId,
    messageId,
    messages,
    model: {
      provider: "openai",
      model: "gpt-4.1",
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
    mode: "standard",
    metadata: {
      ...(capability
        ? {
            capability,
          }
        : {}),
      ...(language
        ? {
            language,
          }
        : {}),
    },
  };
}

function getPublicAIErrorMessage(
  code: string,
): string {
  switch (code) {
    case "AI_RUNTIME_RESOLUTION_FAILED":
      return "AI runtime is currently unavailable.";

    case "AI_RUNTIME_PLAN_EMPTY":
      return "No AI runtime is currently available.";

    case "AI_EXECUTION_POLICY_INVALID":
      return "AI execution policy is invalid.";

    case "AI_PROVIDER_TIMEOUT":
      return "The AI service took too long to respond.";

    case "AI_PROVIDER_ABORTED":
      return "The AI request was cancelled.";

    default:
      return "The AI service is temporarily unavailable.";
  }
}

async function handleRequest(
  request: Request,
): Promise<Response> {
  const requestBody =
    await parseRequest(
      request,
    );

  if (!requestBody) {
    return jsonResponse(
      {
        success: false,
        error:
          "Invalid JSON request body.",
      },
      400,
    );
  }

  const requestId =
    createRequestId(
      requestBody.requestId,
    );

  const user =
    await getAuthenticatedUser(
      request,
    );

  if (!user) {
    return jsonResponse(
      {
        success: false,
        error:
          "Authentication is required.",
        requestId,
      },
      401,
    );
  }

  const message =
    validateMessage(
      requestBody.message,
    );

  if (!message) {
    return jsonResponse(
      {
        success: false,
        error:
          "Message is required and must contain between 1 and 32000 characters.",
        requestId,
      },
      400,
    );
  }

  const capability =
    validateCapability(
      requestBody.capability,
    );

  const language =
    validateLanguage(
      requestBody.language,
    );

  const adminSupabase =
    createAdminSupabaseClient();

  let conversation:
    ConversationRecord;

  const requestedConversationId =
    getOptionalString(
      requestBody.conversationId,
    );

  if (
    requestedConversationId
  ) {
    const existingConversation =
      await getConversation(
        adminSupabase,
        requestedConversationId,
        user.id,
      );

    if (
      !existingConversation
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Conversation not found.",
          requestId,
        },
        404,
      );
    }

    conversation =
      existingConversation;
  } else {
    conversation =
      await createConversation(
        adminSupabase,
        user.id,
      );
  }

  const history =
    await loadConversationMessages(
      adminSupabase,
      conversation.id,
      user.id,
    );

  const userMessageId =
    await insertUserMessage(
      adminSupabase,
      user.id,
      conversation.id,
      message,
      capability,
    );

  const aiRequest =
    buildAIRequest(
      requestId,
      user.id,
      conversation.id,
      userMessageId,
      history,
      message,
      capability,
      language,
    );

  const execution =
    await aiRuntimeCoordinator.execute(
      aiRequest,
      {
        timeoutMs: 30_000,
        maxRetries: 1,
        retryDelayMs: 500,
      },
    );

  if (
    !execution.result.success
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          getPublicAIErrorMessage(
            execution.result.error.code,
          ),
        requestId,
      },
      503,
    );
  }

  const assistantContent =
    execution.result.response.content.trim();

  if (
    assistantContent.length === 0
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "AI returned an empty response.",
        requestId,
      },
      502,
    );
  }

  const assistantMessage =
    await insertAssistantMessage(
      adminSupabase,
      user.id,
      conversation.id,
      assistantContent,
      capability,
    );

  await touchConversation(
    adminSupabase,
    conversation.id,
  );

  return jsonResponse(
    {
      success: true,
      conversationId:
        conversation.id,
      message: {
        id: assistantMessage.id,
        conversationId:
          conversation.id,
        userId: user.id,
        role: "assistant",
        content:
          assistantContent,
        status: "completed",
        attachments: [],
        ...(capability
          ? {
              capabilityId:
                capability,
            }
          : {}),
        createdAt:
          assistantMessage.createdAt,
        updatedAt:
          assistantMessage.updatedAt,
      },
    },
    200,
  );
}

Deno.serve(
  async (request) => {
    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        null,
        {
          status: 204,
          headers:
            corsHeaders,
        },
      );
    }

    if (
      request.method !==
      "POST"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Method not allowed.",
        },
        405,
      );
    }

    try {
      return await handleRequest(
        request,
      );
    } catch {
      return jsonResponse(
        {
          success: false,
          error:
            "Internal server error.",
        },
        500,
      );
    }
  },
);
