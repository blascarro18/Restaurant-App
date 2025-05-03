export interface PaginationRequest {
    page: number;
    limit: number;
    totalItems?: number;
}

export interface PaginationResponse {
    meta: {
        page: number;
        lastPage: number;
        total: number;
    };
}
