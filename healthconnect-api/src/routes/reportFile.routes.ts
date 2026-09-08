import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getReportFile } from '../modules/patient/services/reports.service';

const router = Router();

router.get('/patient/reports/:reportId/file', authenticate, async (req, res, next) => {
  try {
    const role = req.user!.role;
    if (role !== 'PATIENT' && role !== 'DOCTOR') {
      return res.status(403).json({
        success: false,
        error_code: 'REPORT_ACCESS_DENIED',
        message: 'Only the patient owner or an authorized doctor can access a medical report.',
      });
    }

    const file = await getReportFile(req.user!.userId, role, req.params.reportId);
    const safeName = String(file.name || 'medical-report')
      .replace(/[\r\n"\\/]/g, '_')
      .slice(0, 120);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.buffer.length));
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.send(file.buffer);
  } catch (error) {
    next(error);
  }
});

export default router;
