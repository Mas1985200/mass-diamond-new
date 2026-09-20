import type {
  ChatConversation,
  ChatMessage,
  CreateChatMessageInput,
  UpdateChatMessageInput,
} from "../../types";

export interface ChatConversationQuery {
  readonly userId: string;
  readonly conversationId?: string;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface ChatMessageQuery {
  readonly conversationId: string;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface ChatConversationPage {
  readonly conversations: readonly ChatConversation[];
  readonly nextCursor: string | null;
}

export interface ChatMessagePage {
  readonly messages: readonly ChatMessage[];
  readonly nextCursor: string | null;
}

export interface ChatRepository {
  createConversation(
    userId: string,
    title?: string,
  ): Promise<ChatConversation>;

  getConversation(
    userId: string,
    conversationId: string,
  ): Promise<ChatConversation | null>;

  listConversations(
    query: ChatConversationQuery,
  ): Promise<ChatConversationPage>;

  updateConversation(
    userId: string,
    conversationId: string,
    updates: {
      readonly title?: string;
    },
  ): Promise<ChatConversation>;

  deleteConversation(
    userId: string,
    conversationId: string,
  ): Promise<void>;

  createMessage(
    userId: string,
    input: CreateChatMessageInput,
  ): Promise<ChatMessage>;

  getMessage(
    userId: string,
    conversationId: string,
    messageId: string,
  ): Promise<ChatMessage | null>;

  listMessages(
    userId: string,
    query: ChatMessageQuery,
  ): Promise<ChatMessagePage>;

  updateMessage(
    userId: string,
    conversationId: string,
    messageId: string,
    updates: UpdateChatMessageInput,
  ): Promise<ChatMessage>;

  deleteMessage(
    userId: string,
    conversationId: string,
    messageId: string,
  ): Promise<void>;
}
