import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import {
  doctorAvailabilityUpdateSchema,
  doctorConsultationModesSchema,
  doctorProfileUpdateSchema,
} from './profile.validator';
import {
  getOwnDoctorProfile,
  syncDoctorProfileCompletion,
  updateOwnDoctorProfile,
} from './profile.service';

const router = Router();
const doctorRole = requireRole('DOCTOR');
const userIdFrom = (req: any) => req.user?.userId ?? req.user?.id;

router.get('/profile', authenticate, doctorRole, async (req: any, res) => {
  try {
    const userId = userIdFrom(req);
    await syncDoctorProfileCompletion(userId);
    const profile = await getOwnDoctorProfile(userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }
    return res.json({ success: true, data: profile });
  } catch (error) {
    console.error('[DoctorProfileV2 GET /profile]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

router.get('/profile/completion', authenticate, doctorRole, async (req: any, res) => {
  try {
    const completion = await syncDoctorProfileCompletion(userIdFrom(req));
    if (!completion) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }
    return res.json({ success: true, data: completion });
  } catch (error) {
    console.error('[DoctorProfileV2 GET /profile/completion]', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate profile completion.' });
  }
});

router.put(
  '/profile',
  authenticate,
  doctorRole,
  validate(doctorProfileUpdateSchema),
  async (req: any, res) => {
    try {
      const profile = await updateOwnDoctorProfile(userIdFrom(req), req.body);
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
      }
      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        data: profile,
      });
    } catch (error) {
      console.error('[DoctorProfileV2 PUT /profile]', error);
      return res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
  },
);

router.put(
  '/profile/availability',
  authenticate,
  doctorRole,
  validate(doctorAvailabilityUpdateSchema),
  async (req: any, res) => {
    try {
      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([, value]) => value !== undefined),
      );
      const profile = await updateOwnDoctorProfile(userIdFrom(req), updateData);
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
      }
      return res.json({ success: true, message: 'Availability updated.', data: profile });
    } catch (error) {
      console.error('[DoctorProfileV2 PUT /profile/availability]', error);
      return res.status(500).json({ success: false, message: 'Failed to update availability.' });
    }
  },
);

router.put(
  '/profile/consultation-modes',
  authenticate,
  doctorRole,
  validate(doctorConsultationModesSchema),
  async (req: any, res) => {
    try {
      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([, value]) => value !== undefined),
      );
      const profile = await updateOwnDoctorProfile(userIdFrom(req), updateData);
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
      }
      return res.json({ success: true, message: 'Consultation modes updated.', data: profile });
    } catch (error) {
      console.error('[DoctorProfileV2 PUT /profile/consultation-modes]', error);
      return res.status(500).json({ success: false, message: 'Failed to update consultation modes.' });
    }
  },
);

export default router;
