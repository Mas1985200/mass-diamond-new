import type { ChatMessage } from "../../types";
import { DiamondLogo } from "../brand";

export interface ChatMessageListProps {
  readonly messages: readonly ChatMessage[];
}

function getStatusLabel(
  status: ChatMessage["status"],
): string | null {
  switch (status) {
    case "sending":
      return "Sending";
    case "sent":
      return null;
    case "streaming":
      return "Generating";
    case "completed":
      return null;
    case "error":
      return "Failed";
    default:
      return null;
  }
}

function ChatMessageList({
  messages,
}: ChatMessageListProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      className="md-chat-message-list"
      aria-label="Conversation messages"
    >
      {messages.map((message) => {
        const isUser = message.role === "user";
        const statusLabel = getStatusLabel(
          message.status,
        );

        return (
          <article
            key={message.id}
            className={`md-chat-message ${
              isUser
                ? "md-chat-message--user"
                : "md-chat-message--assistant"
            }`}
          >
            <div className="md-chat-message__avatar">
              {isUser ? (
                <span
                  className="md-chat-message__user-avatar"
                  aria-hidden="true"
                >
                  You
                </span>
              ) : (
                <DiamondLogo
                  size={28}
                  glow
                  decorative
                />
              )}
            </div>

            <div className="md-chat-message__body">
              <div className="md-chat-message__meta">
                <span className="md-chat-message__author">
                  {isUser ? "You" : "Mass Diamond"}
                </span>

                {statusLabel ? (
                  <span
                    className={`md-chat-message__status md-chat-message__status--${message.status}`}
                    role={
                      message.status === "error"
                        ? "alert"
                        : "status"
                    }
                  >
                    {statusLabel}
                  </span>
                ) : null}
              </div>

              <div className="md-chat-message__content">
                {message.content}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default ChatMessageList;
