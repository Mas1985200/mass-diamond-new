import type {
  ChatConversation,
  ChatMessage,
  ChatState,
} from "../../types";

import type {
  ChatStore,
  ChatStoreSnapshot,
} from "./store";

function cloneConversation(
  conversation: ChatConversation,
): ChatConversation {
  return {
    ...conversation,
    messages: [...conversation.messages],
  };
}

function cloneMessage(
  message: ChatMessage,
): ChatMessage {
  return {
    ...message,
    attachments: [...message.attachments],
  };
}

export class MemoryChatStore
  implements ChatStore
{
  private conversations =
    new Map<string, ChatConversation>();

  private activeConversationId:
    string | null = null;

  private isSubmitting = false;

  private error: string | null = null;

  public getState(): ChatState {
    return {
      activeConversationId:
        this.activeConversationId,
      conversations: Array.from(
        this.conversations.values(),
        cloneConversation,
      ),
      isSubmitting:
        this.isSubmitting,
      error: this.error,
    };
  }

  public getConversation(
    conversationId: string,
  ): ChatConversation | null {
    const conversation =
      this.conversations.get(
        conversationId,
      );

    return conversation
      ? cloneConversation(conversation)
      : null;
  }

  public getMessage(
    conversationId: string,
    messageId: string,
  ): ChatMessage | null {
    const conversation =
      this.conversations.get(
        conversationId,
      );

    if (!conversation) {
      return null;
    }

    const message =
      conversation.messages.find(
        (item) =>
          item.id === messageId,
      );

    return message
      ? cloneMessage(message)
      : null;
  }

  public setConversation(
    conversation: ChatConversation,
  ): void {
    this.conversations.set(
      conversation.id,
      cloneConversation(conversation),
    );

    if (
      this.activeConversationId ===
      null
    ) {
      this.activeConversationId =
        conversation.id;
    }
  }

  public upsertConversation(
    conversation: ChatConversation,
  ): void {
    const existing =
      this.conversations.get(
        conversation.id,
      );

    if (!existing) {
      this.setConversation(
        conversation,
      );
      return;
    }

    this.conversations.set(
      conversation.id,
      {
        ...existing,
        ...conversation,
        messages:
          conversation.messages
            .length > 0
            ? [
                ...conversation.messages,
              ]
            : [...existing.messages],
      },
    );
  }

  public removeConversation(
    conversationId: string,
  ): void {
    this.conversations.delete(
      conversationId,
    );

    if (
      this.activeConversationId ===
      conversationId
    ) {
      const nextConversation =
        this.conversations.values().next()
          .value as
          | ChatConversation
          | undefined;

      this.activeConversationId =
        nextConversation?.id ?? null;
    }
  }

  public setActiveConversation(
    conversationId: string | null,
  ): void {
    if (
      conversationId !== null &&
      !this.conversations.has(
        conversationId,
      )
    ) {
      return;
    }

    this.activeConversationId =
      conversationId;
  }

  public setMessages(
    conversationId: string,
    messages: readonly ChatMessage[],
  ): void {
    const conversation =
      this.conversations.get(
        conversationId,
      );

    if (!conversation) {
      return;
    }

    this.conversations.set(
      conversationId,
      {
        ...conversation,
        messages: messages.map(
          cloneMessage,
        ),
      },
    );
  }

  public upsertMessage(
    message: ChatMessage,
  ): void {
    const conversation =
      this.conversations.get(
        message.conversationId,
      );

    if (!conversation) {
      return;
    }

    const messageIndex =
      conversation.messages.findIndex(
        (item) =>
          item.id === message.id,
      );

    const nextMessages = [
      ...conversation.messages,
    ];

    if (messageIndex === -1) {
      nextMessages.push(
        cloneMessage(message),
      );
    } else {
      nextMessages[messageIndex] =
        cloneMessage(message);
    }

    this.conversations.set(
      message.conversationId,
      {
        ...conversation,
        messages: nextMessages,
        updatedAt:
          message.updatedAt ??
          conversation.updatedAt,
      },
    );
  }

  public removeMessage(
    conversationId: string,
    messageId: string,
  ): void {
    const conversation =
      this.conversations.get(
        conversationId,
      );

    if (!conversation) {
      return;
    }

    this.conversations.set(
      conversationId,
      {
        ...conversation,
        messages:
          conversation.messages.filter(
            (message) =>
              message.id !== messageId,
          ),
      },
    );
  }

  public setSubmitting(
    isSubmitting: boolean,
  ): void {
    this.isSubmitting =
      isSubmitting;
  }

  public setError(
    error: string | null,
  ): void {
    this.error = error;
  }

  public getSnapshot(): ChatStoreSnapshot {
    return {
      conversations: Array.from(
        this.conversations.values(),
        cloneConversation,
      ),
      activeConversationId:
        this.activeConversationId,
    };
  }

  public reset(): void {
    this.conversations.clear();
    this.activeConversationId =
      null;
    this.isSubmitting = false;
    this.error = null;
  }
}

export const memoryChatStore =
  new MemoryChatStore();
