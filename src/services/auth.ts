import type {
  Session,
  User,
} from "@supabase/supabase-js";

import type {
  SessionStatus,
  UserContext,
  UserSession,
} from "../types";

import { createSessionId } from "../lib/ids";
import { supabase } from "./supabase";

let currentSessionId:
  | UserSession["id"]
  | null = null;

function isSupportedLocale(
  value: unknown,
): value is UserContext["locale"] {
  return (
    value === "en" ||
    value === "fa" ||
    value === "ar" ||
    value === "tr" ||
    value === "fr" ||
    value === "de" ||
    value === "es" ||
    value === "nl" ||
    value === "ru" ||
    value === "ko" ||
    value === "ja" ||
    value === "hi"
  );
}

function mapUser(
  user: User,
): UserContext {
  const metadata =
    user.user_metadata;

  const locale = isSupportedLocale(
    metadata?.locale,
  )
    ? metadata.locale
    : "en";

  return {
    userId: user.id,
    locale,
    ...(typeof metadata?.timezone === "string" &&
    metadata.timezone.trim().length > 0
      ? {
          timezone:
            metadata.timezone,
        }
      : {}),
    ...(typeof metadata?.countryCode === "string" &&
    metadata.countryCode.trim().length > 0
      ? {
          countryCode:
            metadata.countryCode,
        }
      : {}),
    ...(typeof metadata?.city === "string" &&
    metadata.city.trim().length > 0
      ? {
          city:
            metadata.city,
        }
      : {}),
  };
}

function getSessionExpiresAt(
  session: Session,
): string {
  const expiresAtSeconds =
    session.expires_at ??
    Math.floor(
      Date.now() / 1000,
    ) + session.expires_in;

  return new Date(
    expiresAtSeconds * 1000,
  ).toISOString();
}

function getSessionCreatedAt(
  session: Session,
): string {
  const expiresAtSeconds =
    session.expires_at ??
    Math.floor(
      Date.now() / 1000,
    ) + session.expires_in;

  const createdAtSeconds =
    expiresAtSeconds -
    session.expires_in;

  return new Date(
    createdAtSeconds * 1000,
  ).toISOString();
}

function mapSession(
  session: Session,
): UserSession {
  if (currentSessionId === null) {
    currentSessionId =
      createSessionId();
  }

  return {
    id: currentSessionId,
    userId: session.user.id,
    status:
      "active" satisfies SessionStatus,
    createdAt:
      getSessionCreatedAt(session),
    expiresAt:
      getSessionExpiresAt(session),
    lastActivityAt:
      new Date().toISOString(),
  };
}

export async function getCurrentSession(): Promise<
  UserSession | null
> {
  const {
    data,
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!data.session) {
    currentSessionId = null;
    return null;
  }

  return mapSession(
    data.session,
  );
}

export async function getCurrentUser(): Promise<
  UserContext | null
> {
  const {
    data,
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (
      error.name ===
      "AuthSessionMissingError"
    ) {
      return null;
    }

    throw error;
  }

  if (!data.user) {
    return null;
  }

  return mapUser(data.user);
}

export function subscribeToAuthChanges(
  listener: (
    session: UserSession | null,
  ) => void,
): () => void {
  const {
    data: {
      subscription,
    },
  } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (!session) {
        currentSessionId = null;
        listener(null);
        return;
      }

      listener(
        mapSession(session),
      );
    },
  );

  return () => {
    subscription.unsubscribe();
  };
}

export async function signOut(): Promise<void> {
  const {
    error,
  } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  currentSessionId = null;
}
