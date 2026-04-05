import { Request, Response } from 'express';
export declare function getNotifications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function markAllRead(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function markOneRead(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteNotification(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=notification.controller.d.ts.map