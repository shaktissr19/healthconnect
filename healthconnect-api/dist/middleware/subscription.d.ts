import { Request, Response, NextFunction } from 'express';
export declare const requireSubscription: (featureName?: string) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=subscription.d.ts.map