export const APP_NAME = "Mass Diamond";

export const APP_TAGLINE =
  "One app. Every need. Anywhere in the world.";

export const APP_VERSION = "0.1.0";

export const DEFAULT_APP_LOCALE = "en";

export const APP_SUPPORTED_LOCALES = [
  "en",
  "fa",
  "ar",
  "tr",
  "fr",
  "de",
  "es",
  "nl",
  "ru",
  "ko",
  "ja",
  "hi",
] as const;

export const APP_STORAGE_KEYS = {
  locale: "mass-diamond.locale",
  theme: "mass-diamond.theme",
  userPreferences: "mass-diamond.user-preferences",
} as const;
