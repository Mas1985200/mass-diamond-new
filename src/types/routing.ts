export type RoutingCapability =
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

export type RoutingConfidence =
  | "low"
  | "medium"
  | "high";

export interface CapabilityRoute {
  readonly capability: RoutingCapability;
  readonly confidence: RoutingConfidence;
  readonly reason?: string;
}

export interface RoutingInput {
  readonly message: string;
  readonly conversationId?: string;
  readonly locale?: string;
  readonly hasAttachments: boolean;
  readonly attachmentTypes?: readonly string[];
}

export interface RoutingResult {
  readonly primary: CapabilityRoute;
  readonly alternatives: readonly CapabilityRoute[];
  readonly routedAt: string;
}

export interface RoutingContext {
  readonly requestId: string;
  readonly input: RoutingInput;
  readonly result: RoutingResult;
}
