export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  warnings?: string[];
}
