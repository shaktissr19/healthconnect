import { prisma } from '../../lib/prisma';

const IST_OFFSET_MS = 330 * 60 * 1000;

export type HospitalAvailabilityInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration?: number;
  isActive?: boolean;
};

const timeToMinutes = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};

function istParts(date: Date) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    dayOfWeek: shifted.getUTCDay(),
    minuteOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

export function validateHospitalSchedule(rows: HospitalAvailabilityInput[]) {
  const normalized = rows.map(row => ({
    dayOfWeek: Number(row.dayOfWeek),
    startTime: row.startTime,
    endTime: row.endTime,
    slotDuration: Number(row.slotDuration ?? 30),
    isActive: row.isActive !== false,
  }));

  for (const row of normalized) {
    if (!Number.isInteger(row.dayOfWeek) || row.dayOfWeek < 0 || row.dayOfWeek > 6) {
      throw new Error('dayOfWeek must be between 0 (Sunday) and 6 (Saturday).');
    }
    if (!/^\d{2}:\d{2}$/.test(row.startTime) || !/^\d{2}:\d{2}$/.test(row.endTime)) {
      throw new Error('Start and end times must use HH:mm format.');
    }
    const start = timeToMinutes(row.startTime);
    const end = timeToMinutes(row.endTime);
    if (start < 0 || start >= 1440 || end <= 0 || end > 1440 || end <= start) {
      throw new Error('Each OPD session must have a valid end time after its start time.');
    }
    if (!Number.isInteger(row.slotDuration) || row.slotDuration < 10 || row.slotDuration > 120) {
      throw new Error('Slot duration must be between 10 and 120 minutes.');
    }
  }

  for (let day = 0; day <= 6; day += 1) {
    const active = normalized
      .filter(row => row.dayOfWeek === day && row.isActive)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    for (let i = 1; i < active.length; i += 1) {
      if (timeToMinutes(active[i].startTime) < timeToMinutes(active[i - 1].endTime)) {
        throw new Error('OPD sessions on the same day cannot overlap.');
      }
    }
  }

  return normalized;
}

export async function assertAcceptedAffiliation(doctorId: string, hospitalId: string) {
  const membership = await prisma.doctorHospital.findUnique({
    where: { doctorId_hospitalId: { doctorId, hospitalId } },
    include: {
      hospital: { select: { id: true, name: true, isActive: true, isVerified: true, teleconsultAvailable: true } },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          user: { select: { isActive: true } },
          offersInPerson: true,
          offersVideoConsult: true,
          isAcceptingNewPatients: true,
        },
      },
    },
  });

  if (!membership || membership.status !== 'ACCEPTED') {
    return { ok: false as const, reason: 'The doctor is not an accepted member of this hospital.' };
  }
  if (!membership.hospital.isActive || !membership.hospital.isVerified) {
    return { ok: false as const, reason: 'This hospital is not currently available for booking.' };
  }
  if (!membership.doctor.user.isActive || membership.doctor.isAcceptingNewPatients === false) {
    return { ok: false as const, reason: 'This doctor is not currently accepting new patients.' };
  }
  return { ok: true as const, membership };
}

export async function replaceHospitalAvailability(
  doctorId: string,
  hospitalId: string,
  rows: HospitalAvailabilityInput[],
) {
  const normalized = validateHospitalSchedule(rows);
  const affiliation = await assertAcceptedAffiliation(doctorId, hospitalId);
  if (!affiliation.ok) throw new Error(affiliation.reason);

  await prisma.$transaction(async tx => {
    await tx.hospitalDoctorAvailability.deleteMany({ where: { doctorId, hospitalId } });
    if (normalized.length) {
      await tx.hospitalDoctorAvailability.createMany({
        data: normalized.map(row => ({ doctorId, hospitalId, ...row })),
      });
    }
  });

  return prisma.hospitalDoctorAvailability.findMany({
    where: { doctorId, hospitalId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

export async function getHospitalAvailability(doctorId: string, hospitalId: string) {
  return prisma.hospitalDoctorAvailability.findMany({
    where: { doctorId, hospitalId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

export async function checkHospitalDoctorAvailability(input: {
  doctorId: string;
  hospitalId: string;
  scheduledAt: Date;
  durationMinutes: number;
  appointmentType?: string;
}) {
  const affiliation = await assertAcceptedAffiliation(input.doctorId, input.hospitalId);
  if (!affiliation.ok) {
    return { exists: false, available: false, reason: affiliation.reason };
  }

  if (input.appointmentType === 'IN_PERSON' && affiliation.membership.doctor.offersInPerson === false) {
    return { exists: true, available: false, reason: 'This doctor does not offer in-person consultations.' };
  }
  if (input.appointmentType === 'TELECONSULT') {
    if (!affiliation.membership.hospital.teleconsultAvailable) {
      return { exists: true, available: false, reason: 'This hospital does not offer teleconsultations.' };
    }
    if (!affiliation.membership.doctor.offersVideoConsult) {
      return { exists: true, available: false, reason: 'This doctor does not offer video consultations.' };
    }
  }

  const rows = await getHospitalAvailability(input.doctorId, input.hospitalId);
  const active = rows.filter(row => row.isActive);
  if (!active.length) {
    return { exists: true, available: false, reason: 'This hospital has not configured OPD availability for the selected doctor.' };
  }

  const { dayOfWeek, minuteOfDay } = istParts(input.scheduledAt);
  const endMinute = minuteOfDay + input.durationMinutes;
  const session = active.find(row => {
    if (row.dayOfWeek !== dayOfWeek) return false;
    return minuteOfDay >= timeToMinutes(row.startTime) && endMinute <= timeToMinutes(row.endTime);
  });

  if (!session) {
    return { exists: true, available: false, reason: 'The selected time is outside this doctor’s hospital OPD schedule.' };
  }

  return { exists: true, available: true, slotDuration: session.slotDuration };
}

export async function getHospitalBookedSlots(doctorId: string, hospitalId: string, days = 30) {
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return prisma.appointment.findMany({
    where: {
      doctorId,
      hospitalId,
      scheduledAt: { gte: new Date(), lte: until },
      status: { in: ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CHECKED_IN', 'IN_PROGRESS'] },
    },
    select: { id: true, scheduledAt: true, durationMinutes: true, status: true },
    orderBy: { scheduledAt: 'asc' },
  });
}
