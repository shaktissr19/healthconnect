import { Request, Response, NextFunction } from 'express';
export declare const rateLimiter: (windowMs?: number, maxRequests?: number) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const authRateLimiter: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=rateLimiter.d.ts.map