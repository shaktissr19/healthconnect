import { Request, Response, NextFunction } from 'express';
import { getPatientReportFile } from './service';

const safeHeaderFileName = (value: string) => value.replace(/[\r\n"]/g, '_');

export const downloadOwnReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = await getPatientReportFile(req.user!.userId, req.params.reportId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.fileSize));
    res.setHeader('Content-Disposition', `inline; filename="${safeHeaderFileName(file.fileName)}"`);
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(file.buffer);
  } catch (error) {
    return next(error);
  }
};
