import type {
  CapabilityRoute,
  RoutingCapability,
  RoutingContext,
  RoutingInput,
  RoutingResult,
} from "../../types";

const CAPABILITY_KEYWORDS: Readonly<
  Record<RoutingCapability, readonly string[]>
> = {
  chat: [],
  search: [
    "search",
    "find",
    "look up",
    "جستجو",
    "پیدا کن",
    "بگرد",
    "اطلاعات پیدا کن",
  ],
  voice: [
    "voice",
    "speak",
    "audio",
    "صدا",
    "صحبت کن",
    "بلند بگو",
  ],
  vision: [
    "image",
    "photo",
    "picture",
    "عکس",
    "تصویر",
    "عکس را",
    "تصویر را",
  ],
  image: [
    "generate image",
    "create image",
    "edit image",
    "تصویر بساز",
    "عکس بساز",
    "تصویر ایجاد کن",
    "عکس ویرایش کن",
  ],
  video: [
    "video",
    "film",
    "movie",
    "ویدیو",
    "فیلم",
    "ویدئو",
  ],
  education: [
    "learn",
    "lesson",
    "course",
    "study",
    "آموزش",
    "درس",
    "یاد بگیر",
    "مطالعه",
  ],
  trade: [
    "trade",
    "supplier",
    "wholesale",
    "import",
    "export",
    "تجارت",
    "تأمین کننده",
    "عمده فروشی",
    "واردات",
    "صادرات",
  ],
  marketplace: [
    "buy",
    "sell",
    "marketplace",
    "product",
    "خرید",
    "فروش",
    "محصول",
    "مارکت",
  ],
  business: [
    "business",
    "company",
    "store",
    "restaurant",
    "کسب و کار",
    "شرکت",
    "فروشگاه",
    "رستوران",
  ],
  "real-estate": [
    "real estate",
    "property",
    "house",
    "apartment",
    "rent",
    "املاک",
    "ملک",
    "خانه",
    "آپارتمان",
    "اجاره",
  ],
  advertising: [
    "advertising",
    "advertisement",
    "ad",
    "campaign",
    "تبلیغ",
    "تبلیغات",
    "کمپین",
  ],
};

function normalizeText(
  value: string,
): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ");
}

function hasKeyword(
  text: string,
  keyword: string,
): boolean {
  return text.includes(
    normalizeText(keyword),
  );
}

function createRoute(
  capability: RoutingCapability,
  confidence: CapabilityRoute["confidence"],
  reason?: string,
): CapabilityRoute {
  return {
    capability,
    confidence,
    ...(reason
      ? { reason }
      : {}),
  };
}

function detectKeywordRoutes(
  input: RoutingInput,
): CapabilityRoute[] {
  const text = normalizeText(
    input.message,
  );

  const routes: CapabilityRoute[] = [];

  for (const capability of Object.keys(
    CAPABILITY_KEYWORDS,
  ) as RoutingCapability[]) {
    if (capability === "chat") {
      continue;
    }

    const keywords =
      CAPABILITY_KEYWORDS[capability];

    const matchedKeyword =
      keywords.find((keyword) =>
        hasKeyword(text, keyword),
      );

    if (!matchedKeyword) {
      continue;
    }

    routes.push(
      createRoute(
        capability,
        "medium",
        `Matched routing keyword: ${matchedKeyword}`,
      ),
    );
  }

  return routes;
}

function detectAttachmentRoute(
  input: RoutingInput,
): CapabilityRoute | null {
  if (!input.hasAttachments) {
    return null;
  }

  const attachmentTypes =
    input.attachmentTypes ?? [];

  if (
    attachmentTypes.some((type) =>
      type.startsWith("image/"),
    )
  ) {
    return createRoute(
      "vision",
      "medium",
      "Image attachment detected.",
    );
  }

  if (
    attachmentTypes.some((type) =>
      type.startsWith("video/"),
    )
  ) {
    return createRoute(
      "video",
      "medium",
      "Video attachment detected.",
    );
  }

  if (
    attachmentTypes.some((type) =>
      type.startsWith("audio/"),
    )
  ) {
    return createRoute(
      "voice",
      "medium",
      "Audio attachment detected.",
    );
  }

  return null;
}

function deduplicateRoutes(
  routes: readonly CapabilityRoute[],
): CapabilityRoute[] {
  const seen =
    new Set<RoutingCapability>();

  return routes.filter((route) => {
    if (seen.has(route.capability)) {
      return false;
    }

    seen.add(route.capability);
    return true;
  });
}

export function routeCapability(
  input: RoutingInput,
  requestId: string,
): RoutingContext {
  const routes: CapabilityRoute[] = [];

  const attachmentRoute =
    detectAttachmentRoute(input);

  if (attachmentRoute) {
    routes.push(attachmentRoute);
  }

  routes.push(
    ...detectKeywordRoutes(input),
  );

  const uniqueRoutes =
    deduplicateRoutes(routes);

  const primary =
    uniqueRoutes[0] ??
    createRoute(
      "chat",
      "high",
      "No specialized capability was detected.",
    );

  const alternatives =
    uniqueRoutes.slice(1);

  const result: RoutingResult = {
    primary,
    alternatives,
    routedAt:
      new Date().toISOString(),
  };

  return {
    requestId,
    input,
    result,
  };
}
