import type {
  ChatApiRequest,
  ChatApiResponse,
  ChatMessage,
} from "../../types";

export interface ChatExecutionContext {
  readonly userId: string;
  readonly requestId: string;
}

export interface ChatExecutionInput {
  readonly context: ChatExecutionContext;
  readonly request: ChatApiRequest;
}

export interface ChatExecutionSuccess {
  readonly success: true;
  readonly response: ChatApiResponse;
  readonly assistantMessage: ChatMessage;
}

export interface ChatExecutionFailure {
  readonly success: false;
  readonly error: {
    readonly code:
      | "AUTH_REQUIRED"
      | "INVALID_INPUT"
      | "CAPABILITY_UNAVAILABLE"
      | "PROVIDER_ERROR";
    readonly message: string;
    readonly retryable: boolean;
  };
}

export type ChatExecutionResult =
  | ChatExecutionSuccess
  | ChatExecutionFailure;

export interface ChatExecutor {
  execute(
    input: ChatExecutionInput,
  ): Promise<ChatExecutionResult>;
}
