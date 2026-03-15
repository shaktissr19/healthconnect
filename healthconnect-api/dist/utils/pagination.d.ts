export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}
export declare const getPaginationParams: (query: any) => PaginationParams;
export declare const buildPaginatedResponse: <T>(data: T[], total: number, { page, limit }: PaginationParams) => {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasMore: boolean;
    };
};
//# sourceMappingURL=pagination.d.ts.map