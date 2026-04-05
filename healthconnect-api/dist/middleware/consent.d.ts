import { Request, Response, NextFunction } from 'express';
export declare const requireConsent: (patientIdParam?: string) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=consent.d.ts.map