// ==========================================================
// Mass Diamond — AI Provider Registry
//
// Central registry for provider-neutral AI runtime adapters.
//
// Responsibilities:
// - Register AI providers.
// - Resolve providers by ID.
// - Expose registered provider IDs.
//
// Does NOT:
// - Execute providers.
// - Select models.
// - Handle retries.
// - Handle timeouts.
// - Persist data.
// - Read user messages.
// ==========================================================

import type {
  AIProvider,
  AIProviderId,
} from "./types.ts";

import {
  OpenAIProvider,
} from "./providers/openaiProvider.ts";

import {
  AnthropicProvider,
} from "./providers/anthropicProvider.ts";

import {
  GoogleAIProvider,
} from "./providers/googleProvider.ts";

import {
  GroqProvider,
} from "./providers/groqProvider.ts";

export interface AIProviderRegistry {
  get(
    providerId: AIProviderId,
  ): AIProvider | undefined;

  has(
    providerId: AIProviderId,
  ): boolean;

  register(
    provider: AIProvider,
  ): void;

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

  public constructor(
    providers:
      readonly AIProvider[] = [],
  ) {
    for (const provider of providers) {
      this.register(provider);
    }
  }

  public get(
    providerId: AIProviderId,
  ): AIProvider | undefined {
    return this.providers.get(
      providerId,
    );
  }

  public has(
    providerId: AIProviderId,
  ): boolean {
    return this.providers.has(
      providerId,
    );
  }

  public register(
    provider: AIProvider,
  ): void {
    this.providers.set(
      provider.id,
      provider,
    );
  }

  public list():
    readonly AIProviderId[] {
    return Array.from(
      this.providers.keys(),
    );
  }
}

export const aiProviderRegistry =
  new DefaultAIProviderRegistry([
    new OpenAIProvider(),
    new AnthropicProvider(),
    new GoogleAIProvider(),
    new GroqProvider(),
  ]);
