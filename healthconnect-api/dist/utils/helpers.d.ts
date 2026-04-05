export declare const generateAccessToken: (bytes?: number) => string;
export declare const generateOTP: (length?: number) => string;
export declare const formatDateIN: (date: Date | string) => string;
export declare const formatDateTimeIN: (date: Date | string) => string;
export declare const getPaginationParams: (query: any) => {
    page: number;
    limit: number;
    skip: number;
};
export declare const buildPaginationMeta: (total: number, page: number, limit: number) => {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
export declare const sanitizeString: (str: string) => string;
export declare const maskEmail: (email: string) => string;
export declare const maskPhone: (phone: string) => string;
//# sourceMappingURL=helpers.d.ts.map