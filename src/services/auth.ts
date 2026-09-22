import type {
  Session,
  User,
} from "@supabase/supabase-js";

import { supabase } from "./supabase";
import type {
  SessionContext,
  SessionStatus,
  UserContext,
  UserSession,
} from "../types";

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
  return {
    id: session.access_token,
    user: mapUser(session.user),
    status: "active" satisfies SessionStatus,
    createdAt:
      session.user.created_at,
    expiresAt:
      session.expires_at
        ? new Date(
            session.expires_at * 1000,
          ).toISOString()
        : null,
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
  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
