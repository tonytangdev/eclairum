/**
 * Parameters for pagination requests
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Metadata for paginated responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Generic paginated result containing data and metadata
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
