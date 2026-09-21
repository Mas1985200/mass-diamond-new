import {
  ArrowUp,
  Paperclip,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export interface ChatComposerProps {
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly onSubmit?: (message: string) => void;
}

const MIN_TEXTAREA_HEIGHT = 42;
const MAX_TEXTAREA_HEIGHT = 180;

function ChatComposer({
  disabled = false,
  placeholder = "Message Mass Diamond...",
  onSubmit,
}: ChatComposerProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit =
    !disabled && message.trim().length > 0;

  function resizeTextarea() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";

    const nextHeight = Math.min(
      Math.max(
        textarea.scrollHeight,
        MIN_TEXTAREA_HEIGHT,
      ),
      MAX_TEXTAREA_HEIGHT,
    );

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_TEXTAREA_HEIGHT
        ? "auto"
        : "hidden";
  }

  function handleMessageChange(
    event: ChangeEvent<HTMLTextAreaElement>,
  ) {
    setMessage(event.target.value);
  }

  function submitMessage() {
    const normalizedMessage = message.trim();

    if (!normalizedMessage || disabled) {
      return;
    }

    onSubmit?.(normalizedMessage);
    setMessage("");
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    submitMessage();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    submitMessage();
  }

  useEffect(() => {
    resizeTextarea();
  }, [message]);

  return (
    <form
      className="md-chat-composer"
      onSubmit={handleSubmit}
      aria-label="Chat message composer"
    >
      <button
        type="button"
        className="md-chat-composer__attach"
        aria-label="Add attachment"
        disabled={disabled}
      >
        <Paperclip
          size={19}
          strokeWidth={1.9}
          aria-hidden="true"
        />
      </button>

      <label className="md-chat-composer__field">
        <span className="sr-only">
          Message
        </span>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          maxLength={32_000}
          autoComplete="off"
          spellCheck
        />
      </label>

      <button
        type="submit"
        className="md-chat-composer__submit"
        aria-label="Send message"
        disabled={!canSubmit}
      >
        <ArrowUp
          size={20}
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </button>
    </form>
  );
}

export default ChatComposer;
