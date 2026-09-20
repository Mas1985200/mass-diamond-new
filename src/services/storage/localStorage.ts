const STORAGE_PREFIX = "mass-diamond:";

function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

export function getStoredValue<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(key));

    if (rawValue === null) {
      return null;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

export function setStoredValue<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(
      getStorageKey(key),
      JSON.stringify(value),
    );

    return true;
  } catch {
    return false;
  }
}

export function removeStoredValue(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.removeItem(getStorageKey(key));

    return true;
  } catch {
    return false;
  }
}

export function clearStoredValues(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const prefix = STORAGE_PREFIX;

    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);

      if (key?.startsWith(prefix)) {
        window.localStorage.removeItem(key);
      }
    }

    return true;
  } catch {
    return false;
  }
}
