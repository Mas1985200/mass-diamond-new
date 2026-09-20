import type {
  ChatApiRequest,
  ChatApiResponse,
  ChatConversation,
  ChatMessage,
} from "../../types";

import {
  validateChatApiRequest,
} from "./validation";

import type {
  ChatRepository,
} from "./repository";

import type {
  ChatStore,
} from "./store";

export interface ChatServiceDependencies {
  readonly repository: ChatRepository;
  readonly store: ChatStore;
}

export interface ChatServiceResult {
  readonly success: true;
  readonly response: ChatApiResponse;
}

export interface ChatServiceValidationFailure {
  readonly success: false;
  readonly error: {
    readonly code: "INVALID_INPUT";
    readonly message: string;
    readonly field?: string;
  };
}

export type ChatServiceResponse =
  | ChatServiceResult
  | ChatServiceValidationFailure;

export class ChatService {
  private readonly repository: ChatRepository;

  private readonly store: ChatStore;

  public constructor(
    dependencies: ChatServiceDependencies,
  ) {
    this.repository = dependencies.repository;
    this.store = dependencies.store;
  }

  public async prepareMessage(
    userId: string,
    request: unknown,
  ): Promise<ChatServiceResponse> {
    const validation =
      validateChatApiRequest(request);

    if (!validation.success) {
      return validation;
    }

    const input: ChatApiRequest =
      validation.data;

    let conversation:
      | ChatConversation
      | null = null;

    if (input.conversationId) {
      conversation =
        await this.repository.getConversation(
          userId,
          input.conversationId,
        );

      if (!conversation) {
        return {
          success: false,
          error: {
            code: "INVALID_INPUT",
            field: "conversationId",
            message:
              "The requested conversation does not exist.",
          },
        };
      }
    } else {
      conversation =
        await this.repository.createConversation(
          userId,
        );
    }

    const persistedMessage =
      await this.repository.createMessage(
        userId,
        {
          conversationId:
            conversation.id,
          role: "user",
          content: input.message,
          attachments:
            input.attachments ?? [],
          ...(input.capabilityId
            ? {
                capabilityId:
                  input.capabilityId,
              }
            : {}),
        },
      );

    this.store.upsertConversation(
      conversation,
    );

    this.store.upsertMessage(
      persistedMessage,
    );

    return {
      success: true,
      response: {
        conversationId:
          conversation.id,
        message: persistedMessage,
      },
    };
  }

  public getState() {
    return this.store.getState();
  }

  public getMessage(
    conversationId: string,
    messageId: string,
  ): ChatMessage | null {
    return this.store.getMessage(
      conversationId,
      messageId,
    );
  }

  public getConversation(
    conversationId: string,
  ): ChatConversation | null {
    return this.store.getConversation(
      conversationId,
    );
  }
}
