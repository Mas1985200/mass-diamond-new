import {
  ArrowUp,
  Paperclip,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";

export interface ChatComposerProps {
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly onSubmit?: (message: string) => void;
}

function ChatComposer({
  disabled = false,
  placeholder = "Message Mass Diamond...",
  onSubmit,
}: ChatComposerProps) {
  const [message, setMessage] = useState("");

  const canSubmit =
    !disabled && message.trim().length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedMessage = message.trim();

    if (!normalizedMessage || disabled) {
      return;
    }

    onSubmit?.(normalizedMessage);
    setMessage("");
  }

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

      <label
        className="md-chat-composer__field"
      >
        <span className="sr-only">
          Message
        </span>

        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
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
