export type AppErrorCode =
  | "UNKNOWN"
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "NETWORK"
  | "TIMEOUT"
  | "PROVIDER"
  | "STORAGE"
  | "DATABASE"
  | "CAPABILITY_UNAVAILABLE";

export type AppErrorSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical";

export interface AppError {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly severity: AppErrorSeverity;
  readonly retryable: boolean;
  readonly requestId?: string;
  readonly cause?: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface AppErrorResponse {
  readonly success: false;
  readonly error: AppError;
}

export interface AppSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
}

export type AppResponse<T> =
  | AppSuccessResponse<T>
  | AppErrorResponse;
