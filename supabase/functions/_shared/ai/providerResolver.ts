// ==========================================================
// Mass Diamond — AI Provider Resolver
//
// Resolves AI runtime adapters independently from execution
// policy.
//
// Responsibilities:
// - Find registered runtime adapters.
// - Resolve an explicitly requested runtime.
// - Resolve the configured runtime when no explicit runtime
//   is requested.
// - Keep provider/model policy separate from execution.
//
// Does NOT handle:
// - Retry
// - Timeout
// - Persistence
// - Billing
// - Network execution
// - Provider-specific API logic
//
// Runtime adapters may represent:
// - External runtimes
// - Self-hosted runtimes
// - Mass Diamond-native runtimes
// ==========================================================

import {
  getAIProviderConfiguration,
  type AIProviderConfiguration,
} from "./providerConfig.ts";

import {
  aiProviderRegistry,
  type AIProviderRegistry,
} from "./providerRegistry.ts";

import type {
  AIProvider,
  AIProviderId,
} from "./types.ts";

export interface AIProviderResolutionSuccess {
  readonly resolved: true;
  readonly providers: readonly AIProvider[];
  readonly configuration?: AIProviderConfiguration;
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

    const configuredProviderId =
      configurationResult.configured
        ? configurationResult
            .configuration.provider
        : undefined;

    const primaryProviderId =
      preferredProvider ??
      configuredProviderId;

    if (!primaryProviderId) {
      return {
        resolved: false,
        reason:
          "NO_PROVIDER_CONFIGURED",
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
      configuration:
        configurationResult.configured
          ? configurationResult.configuration
          : undefined,
    };
  }
}

export const aiProviderResolver =
  new DefaultAIProviderResolver(
    aiProviderRegistry,
  );
