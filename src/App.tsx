import { useCallback, useState } from "react";

import ChatMessageList from "./components/chat/ChatMessageList";
import ChatSurface from "./components/chat/ChatSurface";
import AppShell from "./components/layout/AppShell";
import SessionProvider from "./contexts/SessionContext";
import { createMessageId } from "./lib/ids";
import type { ChatMessage } from "./types";

const LOCAL_CONVERSATION_ID =
  "local-preview";

function createUserMessage(
  content: string,
): ChatMessage {
  const now = new Date().toISOString();

  return {
    id: createMessageId(),
    conversationId:
      LOCAL_CONVERSATION_ID,
    role: "user",
    content,
    createdAt: now,
    updatedAt: now,
    status: "sent",
    attachments: [],
  };
}

function AppContent() {
  const [messages, setMessages] =
    useState<readonly ChatMessage[]>([]);

  const handleSubmit = useCallback(
    (content: string) => {
      const message =
        createUserMessage(content);

      setMessages((currentMessages) => [
        ...currentMessages,
        message,
      ]);
    },
    [],
  );

  const handleRetry = useCallback(
    (message: ChatMessage) => {
      if (message.role !== "user") {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map(
          (currentMessage) => {
            if (
              currentMessage.id !==
              message.id
            ) {
              return currentMessage;
            }

            return {
              ...currentMessage,
              status: "sending",
              updatedAt:
                new Date().toISOString(),
              errorCode: undefined,
            };
          },
        ),
      );
    },
    [],
  );

  return (
    <AppShell>
      <ChatSurface
        onSubmit={handleSubmit}
      >
        {messages.length > 0 ? (
          <ChatMessageList
            messages={messages}
            onRetry={handleRetry}
          />
        ) : undefined}
      </ChatSurface>
    </AppShell>
  );
}

function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}

export default App;
