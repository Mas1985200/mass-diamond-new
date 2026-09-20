import type { AppDirection, SupportedLocale } from "./app";

export type ThemePreference =
  | "dark"
  | "light"
  | "system";

export type ChatResponseMode =
  | "balanced"
  | "concise"
  | "detailed";

export interface UserPreferences {
  readonly locale: SupportedLocale;
  readonly direction: AppDirection;
  readonly theme: ThemePreference;
  readonly chatResponseMode: ChatResponseMode;
  readonly reducedMotion: boolean;
  readonly notificationsEnabled: boolean;
}

export type UserPreferenceUpdate =
  Partial<UserPreferences>;
