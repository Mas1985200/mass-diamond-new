// ==========================================================
// Mass Diamond — AI Provider Registry
// Central registry for provider adapters.
// ==========================================================

import type {
  AIProvider,
  AIProviderId,
} from "./types";

import { OpenAIProvider } from "./providers/openaiProvider";
import { AnthropicProvider } from "./providers/anthropicProvider";
import { GoogleProvider } from "./providers/googleProvider";
import { GroqProvider } from "./providers/groqProvider";

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
    new Map<AIProviderId, AIProvider>();

  public constructor(
    providers: readonly AIProvider[] = [],
  ) {
    for (const provider of providers) {
      this.register(provider);
    }
  }

  public get(
    providerId: AIProviderId,
  ): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  public has(
    providerId: AIProviderId,
  ): boolean {
    return this.providers.has(providerId);
  }

  public register(
    provider: AIProvider,
  ): void {
    this.providers.set(
      provider.id,
      provider,
    );
  }

  public list(): readonly AIProviderId[] {
    return Array.from(
      this.providers.keys(),
    );
  }
}

export const aiProviderRegistry =
  new DefaultAIProviderRegistry([
    new OpenAIProvider(),
    new AnthropicProvider(),
    new GoogleProvider(),
    new GroqProvider(),
  ]);
