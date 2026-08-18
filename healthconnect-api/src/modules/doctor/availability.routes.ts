import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { doctorAvailabilityUpdateSchema } from './availability.validator';
import { getOwnDoctorAvailability, updateOwnDoctorAvailability } from './availability.service';

const router = Router();
const doctorRole = requireRole('DOCTOR');
const userIdFrom = (req: any) => req.user?.userId ?? req.user?.id;

router.get('/availability', authenticate, doctorRole, async (req: any, res) => {
  try {
    const availability = await getOwnDoctorAvailability(userIdFrom(req));
    if (!availability) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }
    return res.json({ success: true, data: availability });
  } catch (error) {
    console.error('[DoctorAvailability GET /availability]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch availability.' });
  }
});

router.put(
  '/availability',
  authenticate,
  doctorRole,
  validate(doctorAvailabilityUpdateSchema),
  async (req: any, res) => {
    try {
      const availability = await updateOwnDoctorAvailability(userIdFrom(req), req.body);
      if (!availability) {
        return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
      }
      return res.json({ success: true, message: 'Availability saved successfully.', data: availability });
    } catch (error) {
      console.error('[DoctorAvailability PUT /availability]', error);
      return res.status(500).json({ success: false, message: 'Failed to save availability.' });
    }
  },
);

export default router;
