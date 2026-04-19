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

export function paginateResult<T extends { id: string }>(
  rows: T[],
  limit: number,
): { items: T[]; next_cursor: string | undefined } {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  const next_cursor = hasMore && last != null ? last.id : undefined;
  return { items, next_cursor };
}
