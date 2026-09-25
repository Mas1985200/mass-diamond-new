import type {
  ChatConversation,
  ChatMessage,
  CreateChatMessageInput,
  UpdateChatMessageInput,
} from "../../types";

import { supabase } from "../supabase";

import type {
  ChatConversationQuery,
  ChatMessageQuery,
  ChatRepository,
  ChatConversationPage,
  ChatMessagePage,
} from "./repository";

interface ConversationRow {
  readonly id: string;
  readonly user_id: string;
  readonly title: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

interface MessageRow {
  readonly id: string;
  readonly conversation_id: string;
  readonly user_id: string;
  readonly role: ChatMessage["role"];
  readonly content: string;
  readonly status: ChatMessage["status"];
  readonly attachments: unknown;
  readonly capability_id: string | null;
  readonly error_code: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function isStringOrNull(
  value: unknown,
): value is string | null {
  return (
    typeof value === "string" ||
    value === null
  );
}

function isChatMessageRole(
  value: unknown,
): value is ChatMessage["role"] {
  return (
    value === "user" ||
    value === "assistant" ||
    value === "system"
  );
}

function isChatMessageStatus(
  value: unknown,
): value is ChatMessage["status"] {
  return (
    value === "pending" ||
    value === "sent" ||
    value === "failed"
  );
}

function toConversationRow(
  value: unknown,
): ConversationRow {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.user_id !== "string" ||
    !isStringOrNull(value.title) ||
    typeof value.created_at !== "string" ||
    typeof value.updated_at !== "string"
  ) {
    throw new Error(
      "Chat repository received an invalid conversation row.",
    );
  }

  return {
    id: value.id,
    user_id: value.user_id,
    title: value.title,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

function toMessageRow(
  value: unknown,
): MessageRow {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.conversation_id !== "string" ||
    typeof value.user_id !== "string" ||
    !isChatMessageRole(value.role) ||
    typeof value.content !== "string" ||
    !isChatMessageStatus(value.status) ||
    !isStringOrNull(value.capability_id) ||
    !isStringOrNull(value.error_code) ||
    typeof value.created_at !== "string" ||
    typeof value.updated_at !== "string"
  ) {
    throw new Error(
      "Chat repository received an invalid message row.",
    );
  }

  return {
    id: value.id,
    conversation_id:
      value.conversation_id,
    user_id: value.user_id,
    role: value.role,
    content: value.content,
    status: value.status,
    attachments: value.attachments,
    capability_id:
      value.capability_id,
    error_code:
      value.error_code,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

function mapConversation(
  row: ConversationRow,
): ChatConversation {
  return {
    id: row.id,
    title: row.title ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages: [],
  };
}

function isAttachmentArray(
  value: unknown,
): value is ChatMessage["attachments"] {
  return Array.isArray(value);
}

function mapMessage(
  row: MessageRow,
): ChatMessage {
  return {
    id: row.id,
    conversationId:
      row.conversation_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    attachments:
      isAttachmentArray(row.attachments)
        ? row.attachments
        : [],
    ...(row.capability_id
      ? {
          capabilityId:
            row.capability_id,
        }
      : {}),
    ...(row.error_code
      ? {
          errorCode:
            row.error_code,
        }
      : {}),
  };
}

function createRepositoryError(
  operation: string,
  error: unknown,
): Error {
  if (error instanceof Error) {
    return new Error(
      `Chat repository ${operation} failed: ${error.message}`,
    );
  }

  return new Error(
    `Chat repository ${operation} failed.`,
  );
}

function encodeCursor(
  value: string,
): string {
  return encodeURIComponent(value);
}

function decodeCursor(
  value: string,
): string {
  return decodeURIComponent(value);
}

const MESSAGE_SELECT_COLUMNS = [
  "id",
  "conversation_id",
  "user_id",
  "role",
  "content",
  "status",
  "attachments",
  "capability_id",
  "error_code",
  "created_at",
  "updated_at",
].join(",");

export class SupabaseChatRepository
  implements ChatRepository
{
  public async createConversation(
    userId: string,
    title?: string,
  ): Promise<ChatConversation> {
    const {
      data,
      error,
    } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: userId,
        ...(title !== undefined
          ? { title }
          : {}),
      })
      .select(
        "id,user_id,title,created_at,updated_at",
      )
      .single();

    if (error) {
      throw createRepositoryError(
        "createConversation",
        error,
      );
    }

    return mapConversation(
      toConversationRow(data),
    );
  }

  public async getConversation(
    userId: string,
    conversationId: string,
  ): Promise<ChatConversation | null> {
    const {
      data,
      error,
    } = await supabase
      .from("chat_conversations")
      .select(
        "id,user_id,title,created_at,updated_at",
      )
      .eq("id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw createRepositoryError(
        "getConversation",
        error,
      );
    }

    return data
      ? mapConversation(
          toConversationRow(data),
        )
      : null;
  }

  public async listConversations(
    query: ChatConversationQuery,
  ): Promise<ChatConversationPage> {
    const limit = Math.min(
      Math.max(query.limit ?? 20, 1),
      100,
    );

    let request = supabase
      .from("chat_conversations")
      .select(
        "id,user_id,title,created_at,updated_at",
      )
      .eq("user_id", query.userId)
      .order("updated_at", {
        ascending: false,
      })
      .order("id", {
        ascending: false,
      })
      .limit(limit + 1);

    if (query.cursor) {
      const cursor =
        decodeCursor(query.cursor);

      request = request.lt(
        "updated_at",
        cursor,
      );
    }

    const {
      data,
      error,
    } = await request;

    if (error) {
      throw createRepositoryError(
        "listConversations",
        error,
      );
    }

    const rows = Array.isArray(data)
      ? data.map(toConversationRow)
      : [];

    const hasNextPage =
      rows.length > limit;

    const pageRows = hasNextPage
      ? rows.slice(0, limit)
      : rows;

    const lastRow =
      pageRows.at(-1);

    return {
      conversations: pageRows.map(
        mapConversation,
      ),
      nextCursor:
        hasNextPage && lastRow
          ? encodeCursor(
              lastRow.updated_at,
            )
          : null,
    };
  }

  public async updateConversation(
    userId: string,
    conversationId: string,
    updates: {
      readonly title?: string;
    },
  ): Promise<ChatConversation> {
    const {
      data,
      error,
    } = await supabase
      .from("chat_conversations")
      .update({
        ...(updates.title !== undefined
          ? {
              title: updates.title,
            }
          : {}),
      })
      .eq("id", conversationId)
      .eq("user_id", userId)
      .select(
        "id,user_id,title,created_at,updated_at",
      )
      .single();

    if (error) {
      throw createRepositoryError(
        "updateConversation",
        error,
      );
    }

    return mapConversation(
      toConversationRow(data),
    );
  }

  public async deleteConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const {
      error,
    } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", userId);

    if (error) {
      throw createRepositoryError(
        "deleteConversation",
        error,
      );
    }
  }

  public async createMessage(
    userId: string,
    input: CreateChatMessageInput,
  ): Promise<ChatMessage> {
    const {
      data,
      error,
    } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id:
          input.conversationId,
        user_id: userId,
        role: input.role,
        content: input.content,
        status: "sent",
        attachments:
          input.attachments ?? [],
        capability_id:
          input.capabilityId ?? null,
      })
      .select(
        MESSAGE_SELECT_COLUMNS,
      )
      .single();

    if (error) {
      throw createRepositoryError(
        "createMessage",
        error,
      );
    }

    return mapMessage(
      toMessageRow(data),
    );
  }

  public async getMessage(
    userId: string,
    conversationId: string,
    messageId: string,
  ): Promise<ChatMessage | null> {
    const {
      data,
      error,
    } = await supabase
      .from("chat_messages")
      .select(
        MESSAGE_SELECT_COLUMNS,
      )
      .eq("id", messageId)
      .eq(
        "conversation_id",
        conversationId,
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw createRepositoryError(
        "getMessage",
        error,
      );
    }

    return data
      ? mapMessage(
          toMessageRow(data),
        )
      : null;
  }

  public async listMessages(
    userId: string,
    query: ChatMessageQuery,
  ): Promise<ChatMessagePage> {
    const limit = Math.min(
      Math.max(query.limit ?? 50, 1),
      100,
    );

    let request = supabase
      .from("chat_messages")
      .select(
        MESSAGE_SELECT_COLUMNS,
      )
      .eq(
        "conversation_id",
        query.conversationId,
      )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      })
      .order("id", {
        ascending: false,
      })
      .limit(limit + 1);

    if (query.cursor) {
      const cursor =
        decodeCursor(query.cursor);

      request = request.lt(
        "created_at",
        cursor,
      );
    }

    const {
      data,
      error,
    } = await request;

    if (error) {
      throw createRepositoryError(
        "listMessages",
        error,
      );
    }

    const rows = Array.isArray(data)
      ? data.map(toMessageRow)
      : [];

    const hasNextPage =
      rows.length > limit;

    const pageRows = hasNextPage
      ? rows.slice(0, limit)
      : rows;

    const lastRow =
      pageRows.at(-1);

    return {
      messages: pageRows.map(
        mapMessage,
      ),
      nextCursor:
        hasNextPage && lastRow
          ? encodeCursor(
              lastRow.created_at,
            )
          : null,
    };
  }

  public async updateMessage(
    userId: string,
    conversationId: string,
    messageId: string,
    updates: UpdateChatMessageInput,
  ): Promise<ChatMessage> {
    const {
      data,
      error,
    } = await supabase
      .from("chat_messages")
      .update({
        ...(updates.content !== undefined
          ? {
              content:
                updates.content,
            }
          : {}),
        ...(updates.status !== undefined
          ? {
              status:
                updates.status,
            }
          : {}),
        ...(updates.attachments !==
        undefined
          ? {
              attachments:
                updates.attachments,
            }
          : {}),
        ...(updates.errorCode !==
        undefined
          ? {
              error_code:
                updates.errorCode,
            }
          : {}),
      })
      .eq("id", messageId)
      .eq(
        "conversation_id",
        conversationId,
      )
      .eq("user_id", userId)
      .select(
        MESSAGE_SELECT_COLUMNS,
      )
      .single();

    if (error) {
      throw createRepositoryError(
        "updateMessage",
        error,
      );
    }

    return mapMessage(
      toMessageRow(data),
    );
  }

  public async deleteMessage(
    userId: string,
    conversationId: string,
    messageId: string,
  ): Promise<void> {
    const {
      error,
    } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId)
      .eq(
        "conversation_id",
        conversationId,
      )
      .eq("user_id", userId);

    if (error) {
      throw createRepositoryError(
        "deleteMessage",
        error,
      );
    }
  }
}

export const supabaseChatRepository =
  new SupabaseChatRepository();
