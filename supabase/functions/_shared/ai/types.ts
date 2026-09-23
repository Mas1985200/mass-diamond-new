// ==========================================================
// Mass Diamond — Server AI Runtime Contracts
//
// Provider-neutral contracts for scalable AI execution.
//
// Runtime categories:
// - External
// - Self-hosted
// - Mass Diamond-native
//
// These contracts intentionally avoid vendor-specific
// dependencies so runtime implementations can evolve
// without changing the Core architecture.
// ==========================================================

export type AIRuntimeKind =
  | "external"
  | "self_hosted"
  | "native";

export type AIProviderId =
  string;

export type AIRequestMode =
  | "standard"
  | "stream";

export type AIResponseStatus =
  | "success"
  | "partial"
  | "error";

export interface AIModelConfig {
  readonly provider:
    AIProviderId;

  readonly model:
    string;

  readonly maxOutputTokens?:
    number;

  readonly temperature?:
    number;
}

export interface AIMessage {
  readonly role:
    | "system"
    | "user"
    | "assistant";

  readonly content:
    string;
}

export interface AIExecutionRequest {
  readonly requestId:
    string;

  readonly userId:
    string;

  readonly conversationId:
    string;

  readonly messageId:
    string;

  readonly messages:
    readonly AIMessage[];

  readonly model:
    AIModelConfig;

  readonly mode:
    AIRequestMode;

  readonly metadata?:
    Readonly<
      Record<string, string>
    >;
}

export interface AIExecutionContext {
  readonly signal?:
    AbortSignal;

  readonly runtimeKind?:
    AIRuntimeKind;

  readonly metadata?:
    Readonly<
      Record<string, string>
    >;
}

export interface AIUsage {
  readonly inputTokens?:
    number;

  readonly outputTokens?:
    number;

  readonly totalTokens?:
    number;
}

export interface AIExecutionResponse {
  readonly requestId:
    string;

  readonly provider:
    AIProviderId;

  readonly model:
    string;

  readonly content:
    string;

  readonly status:
    AIResponseStatus;

  readonly usage?:
    AIUsage;

  readonly latencyMs:
    number;
}

export interface AIProviderError {
  readonly code:
    string;

  readonly message:
    string;

  readonly provider?:
    AIProviderId;

  readonly retryable:
    boolean;

  readonly statusCode?:
    number;
}

export interface AIExecutionSuccess {
  readonly success:
    true;

  readonly response:
    AIExecutionResponse;
}

export interface AIExecutionFailure {
  readonly success:
    false;

  readonly error:
    AIProviderError;
}

export type AIExecutionResult =
  | AIExecutionSuccess
  | AIExecutionFailure;

export interface AIProvider {
  readonly id:
    AIProviderId;

  readonly runtimeKind:
    AIRuntimeKind;

  execute(
    request:
      AIExecutionRequest,

    context?:
      AIExecutionContext,
  ): Promise<AIExecutionResult>;
}
