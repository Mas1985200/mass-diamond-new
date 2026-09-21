import { useCallback, useState } from "react";

import ChatMessageList from "./components/chat/ChatMessageList";
import ChatSurface from "./components/chat/ChatSurface";
import AppShell from "./components/layout/AppShell";
import { createMessageId } from "./lib/ids";
import type { ChatMessage } from "./types";

function App() {
  const [messages, setMessages] =
    useState<readonly ChatMessage[]>([]);

  const handleSubmit = useCallback(
    (content: string) => {
      const now = new Date().toISOString();
      const conversationId = "local-preview";

      const message: ChatMessage = {
        id: createMessageId(),
        conversationId,
        role: "user",
        content,
        createdAt: now,
        updatedAt: now,
        status: "sent",
        attachments: [],
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        message,
      ]);
    },
    [],
  );

  return (
    <AppShell>
      <ChatSurface onSubmit={handleSubmit}>
        {messages.length > 0 ? (
          <ChatMessageList messages={messages} />
        ) : undefined}
      </ChatSurface>
    </AppShell>
  );
}

export default App;
