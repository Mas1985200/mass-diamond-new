// ==========================================================
// Mass Diamond — AI Provider Registry
// Central registry for server-side AI provider resolution.
// ==========================================================

import type {
  AIProvider,
  AIProviderId,
} from "./types";

export interface AIProviderRegistry {
  register(
    provider: AIProvider,
  ): void;

  get(
    providerId: AIProviderId,
  ): AIProvider | null;

  has(
    providerId: AIProviderId,
  ): boolean;

  list(): readonly AIProviderId[];
}

export class DefaultAIProviderRegistry
  implements AIProviderRegistry
{
  private readonly providers =
    new Map<
      AIProviderId,
      AIProvider
    >();

  public register(
    provider: AIProvider,
  ): void {
    if (
      !provider ||
      typeof provider.id !==
        "string"
    ) {
      throw new Error(
        "Invalid AI provider registration.",
      );
    }

    if (
      this.providers.has(
        provider.id,
      )
    ) {
      throw new Error(
        `AI provider "${provider.id}" is already registered.`,
      );
    }

    this.providers.set(
      provider.id,
      provider,
    );
  }

  public get(
    providerId: AIProviderId,
  ): AIProvider | null {
    return (
      this.providers.get(
        providerId,
      ) ?? null
    );
  }

  public has(
    providerId: AIProviderId,
  ): boolean {
    return this.providers.has(
      providerId,
    );
  }

  public list(): readonly AIProviderId[] {
    return Array.from(
      this.providers.keys(),
    );
  }
}

export const aiProviderRegistry =
  new DefaultAIProviderRegistry();
