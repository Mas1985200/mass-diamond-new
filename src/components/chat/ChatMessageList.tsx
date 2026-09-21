import type { ChatMessage } from "../../types";
import { DiamondLogo } from "../brand";

export interface ChatMessageListProps {
  readonly messages: readonly ChatMessage[];
  readonly onRetry?: (message: ChatMessage) => void;
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
  onRetry,
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
        const isStreaming =
          message.status === "streaming";
        const statusLabel = getStatusLabel(
          message.status,
        );

        const canRetry =
          message.status === "error" &&
          isUser &&
          onRetry !== undefined;

        return (
          <article
            key={message.id}
            className={`md-chat-message ${
              isUser
                ? "md-chat-message--user"
                : "md-chat-message--assistant"
            }`}
            aria-busy={isStreaming || undefined}
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

              <div
                className="md-chat-message__content"
                aria-live={
                  isStreaming
                    ? "polite"
                    : undefined
                }
              >
                {message.content}

                {isStreaming ? (
                  <span
                    className="md-chat-message__cursor"
                    aria-hidden="true"
                  />
                ) : null}
              </div>

              {canRetry ? (
                <button
                  type="button"
                  className="md-chat-message__retry"
                  onClick={() => onRetry(message)}
                >
                  Try again
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default ChatMessageList;
