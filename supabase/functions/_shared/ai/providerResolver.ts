// ==========================================================
// Mass Diamond — AI Provider Resolver
// Resolves a configured provider without exposing secrets.
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
  readonly provider: AIProvider;
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

    const providerId =
      preferredProvider ??
      configuration.provider;

    if (
      providerId !==
      configuration.provider
    ) {
      return {
        resolved: false,
        reason:
          "INVALID_PROVIDER_CONFIG",
      };
    }

    const provider =
      this.registry.get(
        providerId,
      );

    if (!provider) {
      return {
        resolved: false,
        reason:
          "PROVIDER_NOT_REGISTERED",
      };
    }

    return {
      resolved: true,
      provider,
      configuration,
    };
  }
}

export const aiProviderResolver =
  new DefaultAIProviderResolver(
    aiProviderRegistry,
  );
