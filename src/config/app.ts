import type {
  AppMetadata,
  LocaleConfig,
  SupportedLocale,
} from "../types/app";

export type {
  AppDirection,
  AppMetadata,
  LocaleConfig,
  SupportedLocale,
} from "../types/app";

export const APP_METADATA: AppMetadata = {
  name: "Mass Diamond",
  tagline: "One app. Every need. Anywhere in the world.",
  version: "0.1.0",
};

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const LOCALES: readonly LocaleConfig[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    direction: "ltr",
  },
  {
    code: "fa",
    name: "Persian",
    nativeName: "فارسی",
    direction: "rtl",
  },
  {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    direction: "rtl",
  },
  {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    direction: "ltr",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    direction: "ltr",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    direction: "ltr",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    direction: "ltr",
  },
  {
    code: "nl",
    name: "Dutch",
    nativeName: "Nederlands",
    direction: "ltr",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    direction: "ltr",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    direction: "ltr",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    direction: "ltr",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    direction: "ltr",
  },
];

export const LOCALE_BY_CODE: Readonly<
  Record<SupportedLocale, LocaleConfig>
> = Object.freeze(
  Object.fromEntries(
    LOCALES.map((locale) => [locale.code, locale]),
  ) as Record<SupportedLocale, LocaleConfig>,
);
