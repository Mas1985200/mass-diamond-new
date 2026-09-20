import type {
  ChatConversation,
  ChatMessage,
  ChatState,
} from "../../types";

export interface ChatStoreSnapshot {
  readonly conversations: readonly ChatConversation[];
  readonly activeConversationId: string | null;
}

export interface ChatStore {
  getState(): ChatState;

  getConversation(
    conversationId: string,
  ): ChatConversation | null;

  getMessage(
    conversationId: string,
    messageId: string,
  ): ChatMessage | null;

  setConversations(
    conversations: readonly ChatConversation[],
  ): void;

  setActiveConversation(
    conversationId: string | null,
  ): void;

  upsertConversation(
    conversation: ChatConversation,
  ): void;

  removeConversation(
    conversationId: string,
  ): void;

  upsertMessage(
    message: ChatMessage,
  ): void;

  removeMessage(
    conversationId: string,
    messageId: string,
  ): void;

  setSubmitting(
    isSubmitting: boolean,
  ): void;

  setError(
    error: string | null,
  ): void;

  getSnapshot(): ChatStoreSnapshot;

  reset(): void;
}
