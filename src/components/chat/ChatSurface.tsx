import type { ReactNode } from "react";

import ChatComposer from "./ChatComposer";

export interface ChatSurfaceProps {
  readonly children?: ReactNode;
  readonly disabled?: boolean;
  readonly onSubmit?: (message: string) => void;
}

function ChatSurface({
  children,
  disabled = false,
  onSubmit,
}: ChatSurfaceProps) {
  return (
    <section
      className="md-chat-surface"
      aria-labelledby="mass-diamond-chat-title"
    >
      <div className="md-chat-surface__header">
        <div className="md-chat-surface__identity">
          <span
            className="md-chat-surface__status"
            aria-hidden="true"
          />

          <div>
            <h1
              id="mass-diamond-chat-title"
              className="md-chat-surface__title"
            >
              How can I help you?
            </h1>

            <p className="md-chat-surface__description">
              Ask anything or choose what you need.
            </p>
          </div>
        </div>
      </div>

      <div
        className="md-chat-surface__content"
        aria-live="polite"
      >
        {children}
      </div>

      <div className="md-chat-surface__composer">
        <ChatComposer
          disabled={disabled}
          onSubmit={onSubmit}
        />
      </div>
    </section>
  );
}

export default ChatSurface;
