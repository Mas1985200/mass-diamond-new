export type ValidationResult<T> =
  | {
      readonly success: true;
      readonly data: T;
    }
  | {
      readonly success: false;
      readonly error: ValidationError;
    };

export interface ValidationError {
  readonly code: "INVALID_INPUT";
  readonly message: string;
  readonly field?: string;
}

export function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

export function isString(
  value: unknown,
): value is string {
  return typeof value === "string";
}

export function isNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

export function isBoolean(
  value: unknown,
): value is boolean {
  return typeof value === "boolean";
}

export function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function isArray(
  value: unknown,
): value is readonly unknown[] {
  return Array.isArray(value);
}

export function validateNonEmptyString(
  value: unknown,
  field: string,
  message = `${field} must be a non-empty string.`,
): ValidationResult<string> {
  if (!isNonEmptyString(value)) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field,
        message,
      },
    };
  }

  return {
    success: true,
    data: value.trim(),
  };
}

export function validateOptionalString(
  value: unknown,
  field: string,
): ValidationResult<string | undefined> {
  if (value === undefined) {
    return {
      success: true,
      data: undefined,
    };
  }

  if (!isString(value)) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field,
        message: `${field} must be a string when provided.`,
      },
    };
  }

  return {
    success: true,
    data: value,
  };
}

export function validateObject(
  value: unknown,
  field = "value",
): ValidationResult<Record<string, unknown>> {
  if (!isObject(value)) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field,
        message: `${field} must be an object.`,
      },
    };
  }

  return {
    success: true,
    data: value,
  };
}

export function validateArray(
  value: unknown,
  field = "value",
): ValidationResult<readonly unknown[]> {
  if (!isArray(value)) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        field,
        message: `${field} must be an array.`,
      },
    };
  }

  return {
    success: true,
    data: value,
  };
}

export function assertNever(
  value: never,
  message = "Unexpected value.",
): never {
  throw new Error(
    `${message} Received: ${String(value)}`,
  );
}
