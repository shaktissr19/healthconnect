import { prisma } from '../../lib/prisma';
import { DOCTOR_AVAILABILITY_DAYS } from './availability.validator';

export const BUSINESS_TIME_ZONE = 'Asia/Kolkata';

export type AvailabilitySession = {
  start: string;
  end: string;
  slotDuration: number;
};

export type WeeklyAvailability = Record<(typeof DOCTOR_AVAILABILITY_DAYS)[number], AvailabilitySession[]>;

type AvailabilityRow = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive?: boolean;
};

const SHORT_DAY: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

const DAY_TO_INDEX: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const emptyWeekly = (): WeeklyAvailability => ({
  Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [],
});

function legacyJsonToRows(schedule: unknown, defaultSlotDuration = 30): AvailabilityRow[] {
  if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) return [];
  const rows: AvailabilityRow[] = [];

  for (const [rawDay, rawRanges] of Object.entries(schedule as Record<string, unknown>)) {
    const dayOfWeek = DAY_TO_INDEX[rawDay.trim().toLowerCase()];
    if (dayOfWeek === undefined || !Array.isArray(rawRanges)) continue;

    for (const rawRange of rawRanges) {
      if (typeof rawRange !== 'string') continue;
      const match = rawRange.trim().match(/^([0-2]\d:[0-5]\d)\s*-\s*([0-2]\d:[0-5]\d)$/);
      if (!match) continue;
      const [, startTime, endTime] = match;
      if (timeToMinutes(endTime) <= timeToMinutes(startTime)) continue;
      rows.push({ dayOfWeek, startTime, endTime, slotDuration: defaultSlotDuration, isActive: true });
    }
  }

  return rows;
}

function rowsToWeekly(rows: AvailabilityRow[]): WeeklyAvailability {
  const weekly = emptyWeekly();
  for (const row of rows) {
    if (row.dayOfWeek < 0 || row.dayOfWeek > 6 || row.isActive === false) continue;
    const day = DOCTOR_AVAILABILITY_DAYS[row.dayOfWeek];
    weekly[day].push({ start: row.startTime, end: row.endTime, slotDuration: row.slotDuration || 30 });
  }
  for (const day of DOCTOR_AVAILABILITY_DAYS) {
    weekly[day].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  }
  return weekly;
}

function weeklyToRows(weekly: Partial<WeeklyAvailability>): AvailabilityRow[] {
  const rows: AvailabilityRow[] = [];
  DOCTOR_AVAILABILITY_DAYS.forEach((day, dayOfWeek) => {
    for (const session of weekly[day] ?? []) {
      rows.push({
        dayOfWeek,
        startTime: session.start,
        endTime: session.end,
        slotDuration: session.slotDuration || 30,
        isActive: true,
      });
    }
  });
  return rows;
}

function legacySlotsToWeekly(slots: any): WeeklyAvailability {
  const weekly = emptyWeekly();
  for (const day of DOCTOR_AVAILABILITY_DAYS) {
    const slot = slots?.[day];
    if (!slot?.enabled) continue;
    weekly[day] = [{ start: slot.start, end: slot.end, slotDuration: slot.slotDuration || 30 }];
  }
  return weekly;
}

function weeklyToLegacyJson(weekly: WeeklyAvailability) {
  const output: Record<string, string[]> = {};
  DOCTOR_AVAILABILITY_DAYS.forEach((day, dayIndex) => {
    const sessions = weekly[day];
    if (sessions.length) output[SHORT_DAY[dayIndex]] = sessions.map(session => `${session.start}-${session.end}`);
  });
  return output;
}

function weeklyToLegacySlots(weekly: WeeklyAvailability) {
  return Object.fromEntries(DOCTOR_AVAILABILITY_DAYS.map(day => {
    const first = weekly[day][0];
    return [day, first
      ? { enabled: true, start: first.start, end: first.end, slotDuration: first.slotDuration }
      : { enabled: false, start: '09:00', end: '17:00', slotDuration: 30 }];
  }));
}

async function resolveDoctorProfile(userId: string) {
  return prisma.doctorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      availabilitySchedule: true,
      consultationFee: true,
      teleconsultFee: true,
      videoConsultFee: true,
      audioConsultFee: true,
      offersInPerson: true,
      offersVideoConsult: true,
      offersAudioConsult: true,
      offersChatConsult: true,
      isAvailableOnline: true,
      isAcceptingNewPatients: true,
    },
  });
}

export async function getEffectiveAvailabilityRows(doctorId: string): Promise<AvailabilityRow[] | null> {
  const [profile, rows] = await Promise.all([
    prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: { id: true, availabilitySchedule: true },
    }),
    prisma.doctorAvailability.findMany({
      where: { doctorId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
  ]);

  if (!profile) return null;
  if (rows.length) return rows;

  // Existing seeded doctors store schedules on DoctorProfile JSON. Keep them
  // bookable without data migration; the next Doctor save materializes rows.
  return legacyJsonToRows(profile.availabilitySchedule);
}

export async function getOwnDoctorAvailability(userId: string) {
  const profile = await resolveDoctorProfile(userId);
  if (!profile) return null;

  const rows = await getEffectiveAvailabilityRows(profile.id) ?? [];
  const weeklySchedule = rowsToWeekly(rows);

  return {
    doctorId: profile.id,
    timezone: BUSINESS_TIME_ZONE,
    configured: rows.length > 0,
    weeklySchedule,
    slots: weeklyToLegacySlots(weeklySchedule),
    fees: {
      inPerson: profile.consultationFee,
      video: profile.videoConsultFee ?? profile.teleconsultFee,
      phone: profile.audioConsultFee,
    },
    consultationModes: {
      offersInPerson: profile.offersInPerson,
      offersVideoConsult: profile.offersVideoConsult,
      offersAudioConsult: profile.offersAudioConsult,
      offersChatConsult: profile.offersChatConsult,
    },
    isAvailableOnline: profile.isAvailableOnline,
    isAcceptingNewPatients: profile.isAcceptingNewPatients,
    availability: rows.map(row => ({
      id: row.id ?? null,
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      slotDuration: row.slotDuration || 30,
      isActive: row.isActive !== false,
    })),
  };
}

export async function updateOwnDoctorAvailability(userId: string, input: any) {
  const profile = await resolveDoctorProfile(userId);
  if (!profile) return null;

  let weeklySchedule: WeeklyAvailability | undefined;
  if (input.weeklySchedule) weeklySchedule = { ...emptyWeekly(), ...input.weeklySchedule };
  else if (input.slots) weeklySchedule = legacySlotsToWeekly(input.slots);

  const profileData: any = {};
  if (input.fees) {
    if (input.fees.inPerson !== undefined) profileData.consultationFee = input.fees.inPerson;
    if (input.fees.video !== undefined) {
      profileData.videoConsultFee = input.fees.video;
      profileData.teleconsultFee = input.fees.video;
    }
    if (input.fees.phone !== undefined) profileData.audioConsultFee = input.fees.phone;
  }

  for (const field of [
    'offersInPerson', 'offersVideoConsult', 'offersAudioConsult', 'offersChatConsult',
    'isAvailableOnline', 'isAcceptingNewPatients',
  ]) {
    if (input[field] !== undefined) profileData[field] = input[field];
  }

  await prisma.$transaction(async tx => {
    if (weeklySchedule) {
      const rows = weeklyToRows(weeklySchedule);
      await tx.doctorAvailability.deleteMany({ where: { doctorId: profile.id } });
      if (rows.length) {
        await tx.doctorAvailability.createMany({
          data: rows.map(row => ({
            doctorId: profile.id,
            dayOfWeek: row.dayOfWeek,
            startTime: row.startTime,
            endTime: row.endTime,
            slotDuration: row.slotDuration,
            isActive: row.isActive !== false,
          })),
        });
      }
      profileData.availabilitySchedule = weeklyToLegacyJson(weeklySchedule);
    }

    if (Object.keys(profileData).length) {
      await tx.doctorProfile.update({ where: { id: profile.id }, data: profileData });
    }
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DOCTOR_AVAILABILITY_UPDATED',
      entityType: 'DoctorProfile',
      entityId: profile.id,
      metadata: {
        scheduleUpdated: Boolean(weeklySchedule),
        fields: Object.keys(profileData),
      },
    },
  }).catch(() => undefined);

  return getOwnDoctorAvailability(userId);
}

function istParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  const dayOfWeek = DAY_TO_INDEX[get('weekday').toLowerCase()];
  const minuteOfDay = Number(get('hour')) * 60 + Number(get('minute'));
  return { dayOfWeek, minuteOfDay };
}

export async function checkDoctorAvailability(input: {
  doctorId: string;
  scheduledAt: Date;
  durationMinutes: number;
  appointmentType?: string;
}) {
  const profile = await prisma.doctorProfile.findUnique({
    where: { id: input.doctorId },
    select: {
      id: true,
      offersInPerson: true,
      offersVideoConsult: true,
    },
  });
  if (!profile) return { exists: false, available: false, reason: 'Doctor not found.' };

  if (input.appointmentType === 'IN_PERSON' && !profile.offersInPerson) {
    return { exists: true, available: false, reason: 'This doctor is not accepting in-person appointments.' };
  }
  if (input.appointmentType === 'TELECONSULT' && !profile.offersVideoConsult) {
    return { exists: true, available: false, reason: 'This doctor is not offering video consultations.' };
  }

  const rows = await getEffectiveAvailabilityRows(profile.id) ?? [];
  if (!rows.length) {
    return { exists: true, available: false, reason: 'This doctor has not configured bookable availability yet.' };
  }

  const { dayOfWeek, minuteOfDay } = istParts(input.scheduledAt);
  if (dayOfWeek === undefined || !Number.isFinite(minuteOfDay)) {
    return { exists: true, available: false, reason: 'Unable to resolve appointment time.' };
  }

  const requestedEnd = minuteOfDay + input.durationMinutes;
  const matchingSession = rows.find(row => {
    if (row.dayOfWeek !== dayOfWeek || row.isActive === false) return false;
    const sessionStart = timeToMinutes(row.startTime);
    const sessionEnd = timeToMinutes(row.endTime);
    const slotDuration = row.slotDuration || 30;
    const aligned = minuteOfDay >= sessionStart && (minuteOfDay - sessionStart) % slotDuration === 0;
    return aligned && requestedEnd <= sessionEnd;
  });

  if (!matchingSession) {
    return {
      exists: true,
      available: false,
      reason: 'Selected time is outside the doctor’s configured availability.',
    };
  }

  return { exists: true, available: true, reason: null };
}
