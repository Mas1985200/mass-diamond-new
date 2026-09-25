export type AppDirection = "ltr" | "rtl";

export type SupportedLocale =
  | "en"
  | "fa"
  | "ar"
  | "tr"
  | "fr"
  | "de"
  | "es"
  | "nl"
  | "ru"
  | "ko"
  | "ja"
  | "hi";

export interface LocaleConfig {
  readonly code: SupportedLocale;
  readonly name: string;
  readonly nativeName: string;
  readonly direction: AppDirection;
}

export interface AppMetadata {
  readonly name: "Mass Diamond";
  readonly tagline: "One app. Every need. Anywhere in the world.";
  readonly version: string;
}
