import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/pagination.js";

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    cursor: string | null;
    has_more: boolean;
    total?: number;
  };
}

export function getSafeLimit(limit?: number): number {
  return Math.min(limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
}
