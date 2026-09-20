export type EntityId = string;

export type ISODateString = string;

export interface AuditTimestamps {
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
}

export interface PaginationInput {
  readonly page?: number;
  readonly pageSize?: number;
}

export interface PaginationMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly pagination: PaginationMeta;
}

export interface RequestContext {
  readonly requestId: EntityId;
  readonly timestamp: ISODateString;
}

export interface HealthStatus {
  readonly status: "healthy" | "degraded" | "unavailable";
  readonly checkedAt: ISODateString;
}
