// ==========================================================
// Mass Diamond — AI Provider Configuration
// Server-side configuration only.
// Secrets must never be exposed to the client.
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
      readonly configuration: AIProviderConfiguration;
    }
  | {
      readonly configured: false;
      readonly reason:
        | "NO_PROVIDER_CONFIGURED"
        | "INVALID_PROVIDER_CONFIG";
    };

const PROVIDER_ENVIRONMENT_KEYS: Readonly<
  Record<AIProviderId, string>
> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_API_KEY",
  groq: "GROQ_API_KEY",
};

const PROVIDER_MODEL_ENVIRONMENT_KEYS: Readonly<
  Record<AIProviderId, string>
> = {
  openai: "OPENAI_MODEL",
  anthropic: "ANTHROPIC_MODEL",
  google: "GOOGLE_MODEL",
  groq: "GROQ_MODEL",
};

const PROVIDER_BASE_URL_ENVIRONMENT_KEYS: Readonly<
  Partial<Record<AIProviderId, string>>
> = {
  openai: "OPENAI_BASE_URL",
  anthropic: "ANTHROPIC_BASE_URL",
  google: "GOOGLE_BASE_URL",
  groq: "GROQ_BASE_URL",
};

const PROVIDER_ORDER: readonly AIProviderId[] = [
  "openai",
  "anthropic",
  "google",
  "groq",
];

function getEnvironmentValue(
  key: string,
): string | null {
  const value = Deno.env.get(key);

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return null;
  }

  return value.trim();
}

function getConfiguredProviderIds(): AIProviderId[] {
  return PROVIDER_ORDER.filter(
    (provider) =>
      getEnvironmentValue(
        PROVIDER_ENVIRONMENT_KEYS[provider],
      ) !== null,
  );
}

function getProviderModel(
  provider: AIProviderId,
): string | null {
  return getEnvironmentValue(
    PROVIDER_MODEL_ENVIRONMENT_KEYS[provider],
  );
}

function getProviderBaseUrl(
  provider: AIProviderId,
): string | undefined {
  const environmentKey =
    PROVIDER_BASE_URL_ENVIRONMENT_KEYS[
      provider
    ];

  if (!environmentKey) {
    return undefined;
  }

  return (
    getEnvironmentValue(
      environmentKey,
    ) ?? undefined
  );
}

export function getAIProviderConfiguration(): AIProviderConfigurationResult {
  const configuredProviders =
    getConfiguredProviderIds();

  if (configuredProviders.length === 0) {
    return {
      configured: false,
      reason: "NO_PROVIDER_CONFIGURED",
    };
  }

  const provider =
    configuredProviders[0];

  const apiKey =
    getEnvironmentValue(
      PROVIDER_ENVIRONMENT_KEYS[provider],
    );

  const model =
    getProviderModel(provider);

  if (!apiKey || !model) {
    return {
      configured: false,
      reason: "INVALID_PROVIDER_CONFIG",
    };
  }

  const baseUrl =
    getProviderBaseUrl(provider);

  return {
    configured: true,
    configuration: {
      provider,
      model,
      apiKey,
      ...(baseUrl
        ? { baseUrl }
        : {}),
    },
  };
}
