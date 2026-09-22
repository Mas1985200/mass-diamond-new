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
      data as ConversationRow,
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
          data as ConversationRow,
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

    const rows =
      (data ?? []) as ConversationRow[];

    const hasNextPage =
      rows.length > limit;

    const pageRows = hasNextPage
      ? rows.slice(0, limit)
      : rows;

    const lastRow =
      pageRows.at(-1);

    return {
      items: pageRows.map(
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
  ): Promise<ChatConversation | null> {
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
      .maybeSingle();

    if (error) {
      throw createRepositoryError(
        "updateConversation",
        error,
      );
    }

    return data
      ? mapConversation(
          data as ConversationRow,
        )
      : null;
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
        [
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
        ].join(","),
      )
      .single();

    if (error) {
      throw createRepositoryError(
        "createMessage",
        error,
      );
    }

    return mapMessage(
      data as MessageRow,
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
        [
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
        ].join(","),
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
          data as MessageRow,
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
        [
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
        ].join(","),
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

    const rows =
      (data ?? []) as MessageRow[];

    const hasNextPage =
      rows.length > limit;

    const pageRows = hasNextPage
      ? rows.slice(0, limit)
      : rows;

    const lastRow =
      pageRows.at(-1);

    return {
      items: pageRows.map(mapMessage),
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
  ): Promise<ChatMessage | null> {
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
        [
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
        ].join(","),
      )
      .maybeSingle();

    if (error) {
      throw createRepositoryError(
        "updateMessage",
        error,
      );
    }

    return data
      ? mapMessage(
          data as MessageRow,
        )
      : null;
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
