import type {
  Session,
  User,
} from "@supabase/supabase-js";

import type {
  SessionStatus,
  UserContext,
  UserSession,
} from "../types";

import { supabase } from "./supabase";

function mapUser(
  user: User,
): UserContext {
  return {
    id: user.id,
    email: user.email ?? null,
  };
}

function mapSession(
  session: Session,
): UserSession {
  const expiresAt =
    session.expires_at !== undefined
      ? new Date(
          session.expires_at * 1000,
        ).toISOString()
      : null;

  return {
    id: session.user.id,
    user: mapUser(session.user),
    status: "active" satisfies SessionStatus,
    createdAt: session.user.created_at,
    expiresAt,
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
    return null;
  }

  return mapSession(data.session);
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
      listener(
        session
          ? mapSession(session)
          : null,
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
}
