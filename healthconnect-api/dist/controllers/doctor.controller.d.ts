import { Request, Response } from 'express';
export declare function getDashboard(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getAppointments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateAppointment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getMyPatients(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getPatientDetail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getPrescriptions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createPrescription(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getEarnings(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getDoctorProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateDoctorProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getAvailability(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateAvailability(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=doctor.controller.d.ts.map