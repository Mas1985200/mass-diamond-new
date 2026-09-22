import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentSession,
  getCurrentUser,
  subscribeToAuthChanges,
} from "../services/auth";
import { createRequestId } from "../lib/ids";
import type {
  SessionContext as SessionContextValue,
  UserContext,
  UserSession,
} from "../types";

const SessionContext =
  createContext<SessionContextValue | null>(
    null,
  );

export interface SessionProviderProps {
  readonly children: ReactNode;
}

function SessionProvider({
  children,
}: SessionProviderProps) {
  const [session, setSession] =
    useState<UserSession | null>(null);

  const [user, setUser] =
    useState<UserContext | null>(null);

  const [requestId, setRequestId] =
    useState(() => createRequestId());

  useEffect(() => {
    let mounted = true;
    let userLoadTimer: ReturnType<
      typeof setTimeout
    > | null = null;

    async function loadInitialSession() {
      try {
        const currentSession =
          await getCurrentSession();

        if (!mounted) {
          return;
        }

        if (!currentSession) {
          setSession(null);
          setUser(null);
          return;
        }

        const currentUser =
          await getCurrentUser();

        if (!mounted) {
          return;
        }

        setSession(currentSession);
        setUser(currentUser);
        setRequestId(createRequestId());
      } catch {
        if (!mounted) {
          return;
        }

        setSession(null);
        setUser(null);
        setRequestId(createRequestId());
      }
    }

    function loadUserAfterAuthChange() {
      if (!mounted) {
        return;
      }

      void getCurrentUser()
        .then((nextUser) => {
          if (!mounted) {
            return;
          }

          setUser(nextUser);
        })
        .catch(() => {
          if (!mounted) {
            return;
          }

          setUser(null);
        });
    }

    void loadInitialSession();

    const unsubscribe =
      subscribeToAuthChanges(
        (nextSession) => {
          if (!mounted) {
            return;
          }

          setSession(nextSession);
          setRequestId(createRequestId());

          if (!nextSession) {
            setUser(null);
            return;
          }

          if (userLoadTimer !== null) {
            clearTimeout(userLoadTimer);
          }

          userLoadTimer = setTimeout(() => {
            userLoadTimer = null;
            loadUserAfterAuthChange();
          }, 0);
        },
      );

    return () => {
      mounted = false;

      if (userLoadTimer !== null) {
        clearTimeout(userLoadTimer);
        userLoadTimer = null;
      }

      unsubscribe();
    };
  }, []);

  const contextValue =
    useMemo<SessionContextValue>(
      () => ({
        session,
        user,
        requestId,
        isAuthenticated:
          session !== null &&
          user !== null,
      }),
      [
        session,
        user,
        requestId,
      ],
    );

  return (
    <SessionContext.Provider
      value={contextValue}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context =
    useContext(SessionContext);

  if (context === null) {
    throw new Error(
      "useSession must be used within SessionProvider.",
    );
  }

  return context;
}

export default SessionProvider;
