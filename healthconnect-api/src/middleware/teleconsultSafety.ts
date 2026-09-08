import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * The legacy appointment controller generates public meet.jit.si room URLs.
 * That remains convenient for non-production demos, but must never become the
 * implicit production clinical-video provider. Production teleconsult booking
 * stays disabled until a secured provider integration is explicitly enabled.
 */
export const enforceProductionTeleconsultSafety = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const type = String(req.body?.type || '').toUpperCase();
  if (type !== 'TELECONSULT') return next();

  if (config.env === 'production' && !config.video.teleconsultEnabled) {
    return res.status(503).json({
      success: false,
      error_code: 'TELECONSULT_TEMPORARILY_UNAVAILABLE',
      message: 'Video consultation is temporarily unavailable while secure video access is being configured.',
    });
  }

  if (config.env === 'production') {
    return res.status(503).json({
      success: false,
      error_code: 'SECURE_VIDEO_PROVIDER_REQUIRED',
      message: 'Secure video consultation provider integration is not active yet.',
    });
  }

  return next();
};
