import type {
  ChatApiRequest,
  ChatApiResponse,
} from "../../types";

import { chatService } from "./container";

import type {
  UserContext,
  UserSession,
} from "../../types";

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
          | "INVALID_INPUT";
        readonly message: string;
        readonly field?: string;
      };
    };

export async function sendChatMessage(
  context: ChatClientContext,
  request: ChatApiRequest,
): Promise<ChatClientResult> {
  if (
    !context.session ||
    !context.user
  ) {
    return {
      success: false,
      error: {
        code: "AUTH_REQUIRED",
        message:
          "Authentication is required to send a chat message.",
      },
    };
  }

  return chatService.prepareMessage(
    context.user.userId,
    request,
  );
}
