export interface PaginationQuery {
    page?: number;
    limit?: number;
}
export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}
export declare function parsePagination(query?: PaginationQuery, defaultLimit?: number): PaginationParams;
export declare function buildPaginatedResponse<T>(data: T[], total: number, params: {
    page: number;
    limit: number;
}): PaginatedResult<T>;
