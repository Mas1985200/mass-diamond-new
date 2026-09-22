import type { ReactNode } from "react";
import {
  useEffect,
  useRef,
} from "react";

import { DiamondLogo } from "../brand";
import ChatComposer from "./ChatComposer";
import ChatMessageList from "./ChatMessageList";

export interface ChatSurfaceProps {
  readonly children?: ReactNode;
  readonly disabled?: boolean;
  readonly onSubmit?: (message: string) => void;
}

const AUTO_SCROLL_THRESHOLD = 120;

function isNearBottom(
  element: HTMLDivElement,
): boolean {
  const distanceFromBottom =
    element.scrollHeight -
    element.scrollTop -
    element.clientHeight;

  return (
    distanceFromBottom <=
    AUTO_SCROLL_THRESHOLD
  );
}

function ChatSurface({
  children,
  disabled = false,
  onSubmit,
}: ChatSurfaceProps) {
  const contentRef =
    useRef<HTMLDivElement>(null);

  const previousScrollHeightRef =
    useRef(0);

  const hasChildren =
    children !== undefined &&
    children !== null;

  useEffect(() => {
    const content = contentRef.current;

    if (!content || !hasChildren) {
      return;
    }

    const previousScrollHeight =
      previousScrollHeightRef.current;

    const wasNearBottom =
      previousScrollHeight === 0 ||
      isNearBottom(content);

    if (wasNearBottom) {
      content.scrollTo({
        top: content.scrollHeight,
        behavior: "smooth",
      });
    }

    previousScrollHeightRef.current =
      content.scrollHeight;
  }, [children, hasChildren]);

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
        ref={contentRef}
        className={`md-chat-surface__content${
          hasChildren
            ? ""
            : " md-chat-surface__content--empty"
        }`}
        aria-live="polite"
      >
        {hasChildren ? (
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
