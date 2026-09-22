import type {
  EntityId,
  ISODateString,
} from "./common";
import type {
  SupportedLocale,
} from "./app";

export type SessionStatus =
  | "active"
  | "expired"
  | "revoked";

export interface UserContext {
  readonly userId: EntityId;
  readonly locale: SupportedLocale;
  readonly timezone?: string;
  readonly countryCode?: string;
  readonly city?: string;
}

export interface UserSession {
  readonly id: EntityId;
  readonly userId: EntityId;
  readonly status: SessionStatus;
  readonly createdAt: ISODateString;
  readonly expiresAt: ISODateString;
  readonly lastActivityAt: ISODateString;
}

export interface SessionContext {
  readonly session: UserSession | null;
  readonly user: UserContext | null;
  readonly requestId: EntityId;
  readonly isAuthenticated: boolean;
}
