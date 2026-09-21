import { useCallback, useState } from "react";

import type { ChatMessage } from "./types";
import { createMessageId } from "./lib/ids";
import ChatSurface from "./components/chat/ChatSurface";
import AppShell from "./components/layout/AppShell";

function App() {
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);

  const handleSubmit = useCallback((content: string) => {
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
  }, []);

  return (
    <AppShell>
      <ChatSurface onSubmit={handleSubmit}>
        {messages.length > 0 ? (
          <div>
            {messages.map((message) => (
              <div key={message.id}>
                {message.content}
              </div>
            ))}
          </div>
        ) : undefined}
      </ChatSurface>
    </AppShell>
  );
}

export default App;
