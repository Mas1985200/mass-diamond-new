import type {
  ChatAttachment,
  ChatMessage,
  ChatMessageStatus,
} from "./chat";

export interface ChatApiRequest {
  readonly conversationId?: string;
  readonly message: string;
  readonly attachments?: readonly ChatAttachment[];
  readonly capabilityId?: string;
  readonly locale?: string;
  readonly requestId?: string;
}

export interface ChatApiUsage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
  readonly latencyMs?: number;
}

export interface ChatApiResponse {
  readonly conversationId: string;
  readonly message: ChatMessage;
  readonly usage?: ChatApiUsage;
}

export interface ChatApiStreamChunk {
  readonly requestId: string;
  readonly conversationId: string;
  readonly messageId: string;
  readonly content: string;
  readonly status: ChatMessageStatus;
  readonly sequence: number;
  readonly done: boolean;
}

export interface ChatApiError {
  readonly code: string;
  readonly message: string;
  readonly requestId?: string;
  readonly retryable: boolean;
}

export interface ChatApiErrorResponse {
  readonly error: ChatApiError;
}
