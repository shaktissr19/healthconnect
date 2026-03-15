import { Response } from 'express';
export declare class ApiResponse {
    static success(res: Response, data?: any, message?: string): Response<any, Record<string, any>>;
    static created(res: Response, data?: any, message?: string): Response<any, Record<string, any>>;
    static noContent(res: Response): Response<any, Record<string, any>>;
    static unauthorized(res: Response, message?: string): Response<any, Record<string, any>>;
    static forbidden(res: Response, errorCodeOrMessage: string, message?: string): Response<any, Record<string, any>>;
    static notFound(res: Response, message?: string): Response<any, Record<string, any>>;
    static validationError(res: Response, messageOrErrors: string | {
        field: string;
        message: string;
    }[], errors?: any): Response<any, Record<string, any>>;
    static internalError(res: Response, message?: string): Response<any, Record<string, any>>;
    static error(res: Response, errorCode: string, message: string, statusCode?: number, errors?: any): Response<any, Record<string, any>>;
    static paginated(res: Response, data: any[], meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }, message?: string): Response<any, Record<string, any>>;
}
//# sourceMappingURL=apiResponse.d.ts.map