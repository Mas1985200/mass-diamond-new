export type CapabilityId =
  | "chat"
  | "search"
  | "voice"
  | "vision"
  | "image"
  | "video"
  | "education"
  | "trade"
  | "marketplace"
  | "business"
  | "real-estate"
  | "advertising";

export interface CapabilityDefinition {
  readonly id: CapabilityId;
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
}

export const CAPABILITIES: readonly CapabilityDefinition[] = [
  {
    id: "chat",
    label: "AI Chat",
    description: "Conversational AI assistance.",
    enabled: true,
  },
  {
    id: "search",
    label: "Search",
    description: "Search across relevant global information.",
    enabled: true,
  },
  {
    id: "voice",
    label: "Voice",
    description: "Voice-based interaction.",
    enabled: true,
  },
  {
    id: "vision",
    label: "Vision",
    description: "Understand and analyze visual input.",
    enabled: true,
  },
  {
    id: "image",
    label: "Image",
    description: "Create and edit images.",
    enabled: true,
  },
  {
    id: "video",
    label: "Video",
    description: "Create and work with video content.",
    enabled: true,
  },
  {
    id: "education",
    label: "Education",
    description: "Educational assistance and learning tools.",
    enabled: true,
  },
  {
    id: "trade",
    label: "Trade",
    description: "Global trade and product discovery.",
    enabled: true,
  },
  {
    id: "marketplace",
    label: "Marketplace",
    description: "Discover and manage marketplace listings.",
    enabled: true,
  },
  {
    id: "business",
    label: "Business",
    description: "Discover and manage business information.",
    enabled: true,
  },
  {
    id: "real-estate",
    label: "Real Estate",
    description: "Discover and manage real-estate listings.",
    enabled: true,
  },
  {
    id: "advertising",
    label: "Advertising",
    description: "Create and manage advertising experiences.",
    enabled: true,
  },
];

export const CAPABILITY_BY_ID: Readonly<
  Record<CapabilityId, CapabilityDefinition>
> = Object.freeze(
  Object.fromEntries(
    CAPABILITIES.map((capability) => [capability.id, capability]),
  ) as Record<CapabilityId, CapabilityDefinition>,
);
