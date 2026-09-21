import type { ReactNode } from "react";

import { DiamondLogo } from "../brand";
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
  const hasContent = children !== undefined && children !== null;

  return (
    <section
      className="md-chat-surface"
      aria-labelledby="mass-diamond-chat-title"
    >
      <div className="md-chat-surface__header">
        <div className="md-chat-surface__identity">
          <DiamondLogo
            size={30}
            glow
            decorative
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

        <span
          className="md-chat-surface__status"
          aria-label="Mass Diamond is ready"
          role="status"
        />
      </div>

      <div
        className={`md-chat-surface__content${
          hasContent
            ? ""
            : " md-chat-surface__content--empty"
        }`}
      >
        {hasContent ? (
          children
        ) : (
          <div className="md-chat-empty-state">
            <DiamondLogo
              size={76}
              glow
              decorative
            />

            <div className="md-chat-empty-state__text">
              <h2>Start a conversation</h2>

              <p>
                Ask a question, describe what you need,
                or simply tell Mass Diamond what you want
                to do.
              </p>
            </div>
          </div>
        )}
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
