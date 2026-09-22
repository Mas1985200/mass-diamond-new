import type {
  ChatApiRequest,
  ChatApiResponse,
} from "../../types";

import type {
  UserContext,
  UserSession,
} from "../../types";

import {
  chatOrchestrator,
} from "./container";

export interface ChatClientContext {
  readonly session: UserSession;
  readonly user: UserContext;
}

export type ChatClientResult =
  | {
      readonly success: true;
      readonly response: ChatApiResponse;
    }
  | {
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
    };

export async function sendChatMessage(
  context: ChatClientContext,
  request: ChatApiRequest,
): Promise<ChatClientResult> {
  return chatOrchestrator.execute({
    userId:
      context.user.userId,
    requestId:
      request.requestId ??
      crypto.randomUUID(),
    request,
  });
}
