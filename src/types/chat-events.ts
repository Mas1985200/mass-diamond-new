import type {
  ChatAttachment,
  ChatMessage,
  ChatMessageStatus,
} from "./chat";

export type ChatEventType =
  | "message.created"
  | "message.updated"
  | "message.status_changed"
  | "message.completed"
  | "message.failed"
  | "conversation.updated";

export interface ChatEventBase {
  readonly id: string;
  readonly type: ChatEventType;
  readonly occurredAt: string;
  readonly conversationId: string;
}

export interface ChatMessageCreatedEvent extends ChatEventBase {
  readonly type: "message.created";
  readonly message: ChatMessage;
}

export interface ChatMessageUpdatedEvent extends ChatEventBase {
  readonly type: "message.updated";
  readonly messageId: string;
  readonly content?: string;
  readonly attachments?: readonly ChatAttachment[];
}

export interface ChatMessageStatusChangedEvent extends ChatEventBase {
  readonly type: "message.status_changed";
  readonly messageId: string;
  readonly status: ChatMessageStatus;
}

export interface ChatMessageCompletedEvent extends ChatEventBase {
  readonly type: "message.completed";
  readonly message: ChatMessage;
}

export interface ChatMessageFailedEvent extends ChatEventBase {
  readonly type: "message.failed";
  readonly messageId: string;
  readonly errorCode: string;
  readonly message: string;
}

export interface ChatConversationUpdatedEvent extends ChatEventBase {
  readonly type: "conversation.updated";
  readonly title?: string;
  readonly updatedAt: string;
}

export type ChatEvent =
  | ChatMessageCreatedEvent
  | ChatMessageUpdatedEvent
  | ChatMessageStatusChangedEvent
  | ChatMessageCompletedEvent
  | ChatMessageFailedEvent
  | ChatConversationUpdatedEvent;
