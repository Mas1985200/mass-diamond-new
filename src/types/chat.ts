export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessageStatus =
  | "sending"
  | "sent"
  | "streaming"
  | "completed"
  | "error";

export type ChatAttachmentType =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "other";

export interface ChatAttachment {
  readonly id: string;
  readonly type: ChatAttachmentType;
  readonly name: string;
  readonly mimeType: string;
  readonly size: number;
  readonly url?: string;
  readonly thumbnailUrl?: string;
}

export interface ChatMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly role: ChatMessageRole;
  readonly content: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly status: ChatMessageStatus;
  readonly attachments: readonly ChatAttachment[];
  readonly capabilityId?: string;
  readonly errorCode?: string;
}

export interface ChatConversation {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly messages: readonly ChatMessage[];
}

export interface CreateChatMessageInput {
  readonly conversationId: string;
  readonly role: ChatMessageRole;
  readonly content: string;
  readonly attachments?: readonly ChatAttachment[];
  readonly capabilityId?: string;
}

export interface UpdateChatMessageInput {
  readonly content?: string;
  readonly status?: ChatMessageStatus;
  readonly attachments?: readonly ChatAttachment[];
  readonly errorCode?: string;
}

export interface ChatState {
  readonly activeConversationId: string | null;
  readonly conversations: readonly ChatConversation[];
  readonly isSubmitting: boolean;
  readonly error: string | null;
}

export interface SendMessageResult {
  readonly message: ChatMessage;
  readonly conversationId: string;
}
