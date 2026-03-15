import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// ── Role prefix map ───────────────────────────────────────────────────
const ROLE_PREFIX: Record<string, string> = {
  PATIENT:  'HCP',
  DOCTOR:   'HCD',
  HOSPITAL: 'HCH',
  ADMIN:    'HCA',
};

// ── Generate next registration ID ────────────────────────────────────
// Uses a DB transaction to atomically find the highest existing ID
// and increment it — prevents race conditions under concurrent registrations
export const generateRegistrationId = async (role: Role): Promise<string> => {
  const prefix = ROLE_PREFIX[role];
  if (!prefix) throw new Error(`Unknown role: ${role}`);

  return prisma.$transaction(async (tx) => {
    // Find the highest existing registration ID for this role prefix
    const lastUser = await tx.user.findFirst({
      where: {
        registrationId: { startsWith: prefix },
      },
      orderBy: { registrationId: 'desc' },
      select: { registrationId: true },
    });

    let nextSequence = 1;

    if (lastUser?.registrationId) {
      // Extract numeric part: "HCP00234" → 234
      const numericPart = lastUser.registrationId.slice(prefix.length);
      const parsed      = parseInt(numericPart, 10);
      if (!isNaN(parsed)) nextSequence = parsed + 1;
    }

    // Zero-pad to 5 digits: 1 → "00001", 234 → "00234"
    const padded = nextSequence.toString().padStart(5, '0');
    return `${prefix}${padded}`;
  });
};

// ── Validate registration ID format ──────────────────────────────────
export const validateRegistrationId = (id: string): boolean => {
  return /^HC[PDHA][0-9]{5}$/.test(id);
};

// ── Parse registration ID ─────────────────────────────────────────────
export const parseRegistrationId = (id: string): { prefix: string; role: string; sequence: number } | null => {
  if (!validateRegistrationId(id)) return null;
  const prefix   = id.slice(0, 3);
  const sequence = parseInt(id.slice(3), 10);
  const roleMap: Record<string, string> = { HCP: 'PATIENT', HCD: 'DOCTOR', HCH: 'HOSPITAL', HCA: 'ADMIN' };
  return { prefix, role: roleMap[prefix] || 'UNKNOWN', sequence };
};