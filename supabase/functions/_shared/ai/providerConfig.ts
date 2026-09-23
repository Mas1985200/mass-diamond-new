 // ==========================================================
// Mass Diamond — AI Provider Configuration
//
// Server-side configuration only.
// Secrets must never be exposed to the client.
//
// This module is responsible only for discovering and
// validating server-side provider configuration.
//
// It does NOT:
// - execute providers
// - select fallback order
// - perform retries
// - enforce timeouts
// - route user capabilities
// - persist messages
//
// Runtime orchestration remains in AI Core.
// ==========================================================

import type {
  AIProviderId,
} from "./types";

export interface AIProviderConfiguration {
  readonly provider: AIProviderId;
  readonly model: string;
  readonly apiKey: string;
  readonly baseUrl?: string;
}

export type AIProviderConfigurationResult =
  | {
      readonly configured: true;
      readonly configuration:
        AIProviderConfiguration;
    }
  | {
      readonly configured: false;
      readonly reason:
        | "NO_PROVIDER_CONFIGURED"
        | "INVALID_PROVIDER_CONFIG";
    };

const PROVIDER_ENVIRONMENT_KEYS:
  Readonly<
    Record<
      AIProviderId,
      readonly string[]
    >
  > = {
  openai: [
    "OPENAI_API_KEY",
  ],

  anthropic: [
    "ANTHROPIC_API_KEY",
  ],

  google: [
    "GOOGLE_AI_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
  ],

  groq: [
    "GROQ_API_KEY",
  ],
};

const PROVIDER_MODEL_ENVIRONMENT_KEYS:
  Readonly<
    Record<
      AIProviderId,
      readonly string[]
    >
  > = {
  openai: [
    "OPENAI_MODEL",
  ],

  anthropic: [
    "ANTHROPIC_MODEL",
  ],

  google: [
    "GOOGLE_MODEL",
    "GEMINI_MODEL",
  ],

  groq: [
    "GROQ_MODEL",
  ],
};

const PROVIDER_BASE_URL_ENVIRONMENT_KEYS:
  Readonly<
    Partial<
      Record<
        AIProviderId,
        readonly string[]
      >
    >
  > = {
  openai: [
    "OPENAI_BASE_URL",
  ],

  anthropic: [
    "ANTHROPIC_BASE_URL",
  ],

  google: [
    "GOOGLE_BASE_URL",
  ],

  groq: [
    "GROQ_BASE_URL",
  ],
};

const PROVIDER_ORDER:
  readonly AIProviderId[] = [
    "openai",
    "anthropic",
    "google",
    "groq",
  ];

function getEnvironmentValue(
  key: string,
): string | null {
  const value =
    Deno.env.get(key);

  if (
    typeof value !==
      "string" ||
    value.trim().length === 0
  ) {
    return null;
  }

  return value.trim();
}

function getFirstEnvironmentValue(
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value =
      getEnvironmentValue(key);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function getConfiguredProviderIds():
  AIProviderId[] {
  return PROVIDER_ORDER.filter(
    (provider) =>
      getFirstEnvironmentValue(
        PROVIDER_ENVIRONMENT_KEYS[
          provider
        ],
      ) !== null,
  );
}

function getProviderModel(
  provider: AIProviderId,
): string | null {
  return getFirstEnvironmentValue(
    PROVIDER_MODEL_ENVIRONMENT_KEYS[
      provider
    ],
  );
}

function getProviderBaseUrl(
  provider: AIProviderId,
): string | undefined {
  const environmentKeys =
    PROVIDER_BASE_URL_ENVIRONMENT_KEYS[
      provider
    ];

  if (
    !environmentKeys
  ) {
    return undefined;
  }

  return (
    getFirstEnvironmentValue(
      environmentKeys,
    ) ?? undefined
  );
}

export function getAIProviderConfiguration():
  AIProviderConfigurationResult {
  const configuredProviders =
    getConfiguredProviderIds();

  if (
    configuredProviders.length ===
    0
  ) {
    return {
      configured: false,
      reason:
        "NO_PROVIDER_CONFIGURED",
    };
  }

  for (const provider of configuredProviders) {
    const apiKey =
      getFirstEnvironmentValue(
        PROVIDER_ENVIRONMENT_KEYS[
          provider
        ],
      );

    const model =
      getProviderModel(
        provider,
      );

    if (
      !apiKey ||
      !model
    ) {
      continue;
    }

    const baseUrl =
      getProviderBaseUrl(
        provider,
      );

    return {
      configured: true,
      configuration: {
        provider,
        model,
        apiKey,
        ...(baseUrl
          ? {
              baseUrl,
            }
          : {}),
      },
    };
  }

  return {
    configured: false,
    reason:
      "INVALID_PROVIDER_CONFIG",
  };
}
