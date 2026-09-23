// ==========================================================
// Mass Diamond — AI Provider Resolver
//
// Resolves configured AI providers into an ordered
// execution chain without exposing provider secrets.
//
// Responsibilities:
// - Resolve configured provider
// - Build ordered provider chain
// - Keep provider selection separate from execution policy
//
// Does NOT handle:
// - Retry
// - Timeout
// - Persistence
// - Billing
// - UI
// ==========================================================

import {
  getAIProviderConfiguration,
  type AIProviderConfiguration,
} from "./providerConfig";

import {
  aiProviderRegistry,
  type AIProviderRegistry,
} from "./providerRegistry";

import type {
  AIProvider,
  AIProviderId,
} from "./types";

export interface AIProviderResolutionSuccess {
  readonly resolved: true;
  readonly providers: readonly AIProvider[];
  readonly configuration: AIProviderConfiguration;
}

export interface AIProviderResolutionFailure {
  readonly resolved: false;
  readonly reason:
    | "NO_PROVIDER_CONFIGURED"
    | "PROVIDER_NOT_REGISTERED"
    | "INVALID_PROVIDER_CONFIG";
}

export type AIProviderResolution =
  | AIProviderResolutionSuccess
  | AIProviderResolutionFailure;

export interface AIProviderResolver {
  resolve(
    preferredProvider?: AIProviderId,
  ): AIProviderResolution;
}

export class DefaultAIProviderResolver
  implements AIProviderResolver
{
  private readonly registry:
    AIProviderRegistry;

  public constructor(
    registry: AIProviderRegistry,
  ) {
    this.registry = registry;
  }

  public resolve(
    preferredProvider?: AIProviderId,
  ): AIProviderResolution {
    const configurationResult =
      getAIProviderConfiguration();

    if (
      !configurationResult.configured
    ) {
      return {
        resolved: false,
        reason:
          configurationResult.reason,
      };
    }

    const configuration =
      configurationResult.configuration;

    const primaryProviderId =
      preferredProvider ??
      configuration.provider;

    if (
      preferredProvider &&
      preferredProvider !==
        configuration.provider
    ) {
      return {
        resolved: false,
        reason:
          "INVALID_PROVIDER_CONFIG",
      };
    }

    const primaryProvider =
      this.registry.get(
        primaryProviderId,
      );

    if (!primaryProvider) {
      return {
        resolved: false,
        reason:
          "PROVIDER_NOT_REGISTERED",
      };
    }

    const providers: AIProvider[] = [
      primaryProvider,
    ];

    for (
      const providerId of this.registry.list()
    ) {
      if (
        providerId ===
        primaryProviderId
      ) {
        continue;
      }

      const provider =
        this.registry.get(
          providerId,
        );

      if (provider) {
        providers.push(provider);
      }
    }

    return {
      resolved: true,
      providers,
      configuration,
    };
  }
}

export const aiProviderResolver =
  new DefaultAIProviderResolver(
    aiProviderRegistry,
  );
