import {
  useCallback,
  useMemo,
} from "react";

import type {
  ChatApiRequest,
} from "../types";

import {
  useSession,
} from "../contexts";

import {
  sendChatMessage,
  type ChatClientResult,
} from "../services/chat/client";

export interface UseChatResult {
  readonly isAuthenticated: boolean;
  readonly sendMessage: (
    request: ChatApiRequest,
  ) => Promise<ChatClientResult>;
}

export function useChat(): UseChatResult {
  const {
    session,
    user,
    isAuthenticated,
  } = useSession();

  const sendMessage =
    useCallback(
      async (
        request: ChatApiRequest,
      ): Promise<ChatClientResult> => {
        if (
          !isAuthenticated ||
          session === null ||
          user === null
        ) {
          return {
            success: false,
            error: {
              code:
                "AUTH_REQUIRED",
              message:
                "Authentication is required to send a chat message.",
              retryable: false,
            },
          };
        }

        return sendChatMessage(
          {
            session,
            user,
          },
          request,
        );
      },
      [
        isAuthenticated,
        session,
        user,
      ],
    );

  return useMemo(
    () => ({
      isAuthenticated,
      sendMessage,
    }),
    [
      isAuthenticated,
      sendMessage,
    ],
  );
}
