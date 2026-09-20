const FALLBACK_RANDOM_ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyz";

function createFallbackRandomPart(
  length: number,
): string {
  let result = "";

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(
      Math.random() * FALLBACK_RANDOM_ALPHABET.length,
    );

    result += FALLBACK_RANDOM_ALPHABET[randomIndex];
  }

  return result;
}

function createRandomPart(length: number): string {
  const cryptoApi =
    typeof globalThis.crypto !== "undefined"
      ? globalThis.crypto
      : undefined;

  if (
    cryptoApi &&
    typeof cryptoApi.randomUUID === "function"
  ) {
    return cryptoApi.randomUUID().replaceAll("-", "");
  }

  if (
    cryptoApi &&
    typeof cryptoApi.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(length);
    cryptoApi.getRandomValues(bytes);

    return Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0"),
    )
      .join("")
      .slice(0, length);
  }

  return createFallbackRandomPart(length);
}

export function createId(
  prefix?: string,
): string {
  const randomPart = createRandomPart(24);

  if (!prefix) {
    return randomPart;
  }

  return `${prefix}_${randomPart}`;
}

export function createRequestId(): string {
  return createId("req");
}

export function createConversationId(): string {
  return createId("conv");
}

export function createMessageId(): string {
  return createId("msg");
}

export function createEventId(): string {
  return createId("evt");
}

export function createSessionId(): string {
  return createId("ses");
}

export function isValidEntityId(
  value: unknown,
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim();

  if (
    normalized.length < 2 ||
    normalized.length > 128
  ) {
    return false;
  }

  return /^[a-zA-Z0-9_-]+$/.test(normalized);
}
