export type AIProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "groq";

export type AIRequestMode =
  | "standard"
  | "stream";

export type AIResponseStatus =
  | "success"
  | "partial"
  | "error";

export interface AIModelConfig {
  readonly provider: AIProviderId;
  readonly model: string;
  readonly maxOutputTokens?: number;
  readonly temperature?: number;
}

export interface AIRequest {
  readonly requestId: string;
  readonly conversationId: string;
  readonly message: string;
  readonly systemPrompt?: string;
  readonly model: AIModelConfig;
  readonly mode: AIRequestMode;
}

export interface AIUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
}

export interface AIResponse {
  readonly requestId: string;
  readonly provider: AIProviderId;
  readonly model: string;
  readonly content: string;
  readonly status: AIResponseStatus;
  readonly usage?: AIUsage;
  readonly latencyMs: number;
}

export interface AIError {
  readonly code: string;
  readonly message: string;
  readonly provider?: AIProviderId;
  readonly retryable: boolean;
}

export interface AIExecutionResult {
  readonly response?: AIResponse;
  readonly error?: AIError;
}
