import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/apiResponse';

const QA_PREFIX = 'HC_QA:';

const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .slice(0, 64)
  .replace(/^-|-$/g, '');

async function uniqueSlug(name: string, fallbackId: string) {
  const base = slugify(name) || `community-${fallbackId.slice(0, 8)}`;
  let candidate = base;
  let suffix = 2;
  while (await prisma.community.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}

async function requesterEmails(userIds: string[]) {
  if (!userIds.length) return new Map<string, string>();
  const users = await prisma.user.findMany({
    where: { id: { in: [...new Set(userIds)] } },
    select: { id: true, email: true },
  });
  return new Map(users.map(u => [u.id, u.email]));
}

const requestDto = (request: any, email?: string) => ({
  ...request,
  name: request.communityName,
  requesterEmail: email || null,
  requester_email: email || null,
});

export const getCommunityRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = String(req.query.status || 'PENDING').toUpperCase();
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return ApiResponse.error(res, 'INVALID_STATUS', 'status must be PENDING, APPROVED or REJECTED', 400);
    }
    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit || '50'), 10) || 50));
    const where = { status: status as any };
    const [rows, total] = await Promise.all([
      prisma.communityRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityRequest.count({ where }),
    ]);
    const emails = await requesterEmails(rows.map(r => r.requestedBy).filter(Boolean) as string[]);
    return ApiResponse.success(res, {
      requests: rows.map(r => requestDto(r, r.requestedBy ? emails.get(r.requestedBy) : undefined)),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) { next(e); }
};

export const approveCommunityRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.communityRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return ApiResponse.notFound(res, 'Community request not found');
    if (request.status !== 'PENDING') return ApiResponse.error(res, 'ALREADY_REVIEWED', 'This request has already been reviewed', 409);

    const slug = await uniqueSlug(request.communityName, request.id);
    const adminNote = String(req.body?.adminNote || '').trim() || null;
    const reviewerId = req.user!.userId;

    const result = await prisma.$transaction(async tx => {
      const community = await tx.community.create({
        data: {
          slug,
          name: request.communityName.trim(),
          description: request.reason.trim(),
          emoji: '🏥',
          category: request.category || 'General',
          visibility: 'PUBLIC',
          language: 'en',
          isFeatured: false,
          isActive: true,
          allowAnonymous: true,
          requireApproval: false,
          rules: 'Be respectful. Share experiences, not prescriptions. Report harmful or misleading content to moderators.',
          createdBy: request.requestedBy || reviewerId,
        },
      });

      if (request.requestedBy) {
        await tx.communityMember.upsert({
          where: { communityId_userId: { communityId: community.id, userId: request.requestedBy } },
          create: { communityId: community.id, userId: request.requestedBy, role: 'OWNER', isApproved: true },
          update: { role: 'OWNER', isApproved: true },
        });
      }

      const reviewed = await tx.communityRequest.update({
        where: { id: request.id },
        data: { status: 'APPROVED', adminNote, reviewedBy: reviewerId, reviewedAt: new Date() },
      });

      if (request.requestedBy) {
        await tx.notification.create({
          data: {
            userId: request.requestedBy,
            type: 'COMMUNITY_REQUEST_UPDATE',
            title: 'Your community is live',
            body: `${community.name} has been approved and created on HealthConnect.`,
            data: { requestId: request.id, communityId: community.id, communitySlug: community.slug },
            isRead: false,
          },
        });
      }
      return { request: reviewed, community };
    });

    return ApiResponse.success(res, result, 'Community approved and created');
  } catch (e) { next(e); }
};

export const rejectCommunityRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.communityRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return ApiResponse.notFound(res, 'Community request not found');
    if (request.status !== 'PENDING') return ApiResponse.error(res, 'ALREADY_REVIEWED', 'This request has already been reviewed', 409);
    const reason = String(req.body?.reason || '').trim();
    if (reason.length < 2) return ApiResponse.error(res, 'REASON_REQUIRED', 'A rejection reason is required', 400);

    const reviewed = await prisma.$transaction(async tx => {
      const row = await tx.communityRequest.update({
        where: { id: request.id },
        data: { status: 'REJECTED', adminNote: reason, reviewedBy: req.user!.userId, reviewedAt: new Date() },
      });
      if (request.requestedBy) {
        await tx.notification.create({
          data: {
            userId: request.requestedBy,
            type: 'COMMUNITY_REQUEST_UPDATE',
            title: 'Community request update',
            body: reason,
            data: { requestId: request.id, status: 'REJECTED' },
            isRead: false,
          },
        });
      }
      return row;
    });
    return ApiResponse.success(res, reviewed, 'Community request rejected');
  } catch (e) { next(e); }
};

type QAMeta = { doctorName: string; durationMin: number };
const qaDescription = (meta: QAMeta) => `${QA_PREFIX}${JSON.stringify(meta)}`;
const parseQAMeta = (description?: string | null): QAMeta | null => {
  if (!description?.startsWith(QA_PREFIX)) return null;
  try {
    const raw = JSON.parse(description.slice(QA_PREFIX.length));
    return { doctorName: String(raw.doctorName || 'HealthConnect Doctor'), durationMin: Number(raw.durationMin || 60) };
  } catch { return null; }
};
const qaDto = (event: any) => {
  const meta = parseQAMeta(event.description) || { doctorName: 'HealthConnect Doctor', durationMin: 60 };
  return {
    id: event.id,
    communityId: event.communityId,
    doctorName: meta.doctorName,
    topic: event.title,
    title: event.title,
    scheduledAt: event.eventDate,
    eventDate: event.eventDate,
    durationMin: meta.durationMin,
    meetLink: event.meetLink,
    isCancelled: event.isCancelled,
    createdAt: event.createdAt,
  };
};

export const getQASessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await prisma.community.findUnique({ where: { id: req.params.id } });
    if (!community) return ApiResponse.notFound(res, 'Community not found');
    const events = await prisma.communityEvent.findMany({
      where: { communityId: community.id, description: { startsWith: QA_PREFIX } },
      orderBy: { eventDate: 'desc' },
      take: 100,
    });
    return ApiResponse.success(res, events.map(qaDto));
  } catch (e) { next(e); }
};

export const createQASession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await prisma.community.findUnique({ where: { id: req.params.id } });
    if (!community || !community.isActive) return ApiResponse.notFound(res, 'Active community not found');
    const doctorName = String(req.body?.doctorName || '').trim();
    const topic = String(req.body?.topic || '').trim();
    const scheduledAt = new Date(req.body?.scheduledAt);
    const durationMin = Math.min(240, Math.max(15, Number(req.body?.durationMin || 60)));
    const meetLink = String(req.body?.meetLink || '').trim() || null;
    if (!doctorName || !topic || Number.isNaN(scheduledAt.getTime())) return ApiResponse.error(res, 'INVALID_INPUT', 'Doctor name, topic and scheduled time are required', 400);
    if (scheduledAt.getTime() <= Date.now()) return ApiResponse.error(res, 'INVALID_DATE', 'Q&A session must be scheduled in the future', 400);
    if (meetLink && !/^https?:\/\//i.test(meetLink)) return ApiResponse.error(res, 'INVALID_LINK', 'Meet link must be an http(s) URL', 400);

    const event = await prisma.communityEvent.create({
      data: {
        communityId: community.id,
        createdBy: req.user!.userId,
        title: topic,
        description: qaDescription({ doctorName, durationMin }),
        eventDate: scheduledAt,
        format: 'ONLINE',
        meetLink,
      },
    });

    const members = await prisma.communityMember.findMany({ where: { communityId: community.id, isApproved: true }, select: { userId: true } });
    if (members.length) {
      const preferences = await prisma.user.findMany({
        where: { id: { in: members.map(m => m.userId) }, isActive: true },
        select: { id: true, settings: { select: { communityActivity: true } } },
      });
      const recipients = preferences.filter(u => u.settings?.communityActivity !== false).map(u => u.id);
      if (recipients.length) {
        await prisma.notification.createMany({
          data: recipients.map(userId => ({
            userId,
            type: 'COMMUNITY_ACTIVITY',
            title: `Live Q&A scheduled in ${community.name}`,
            body: `${doctorName}: ${topic}`,
            data: { communityId: community.id, eventId: event.id, action: 'QA_SCHEDULED' },
            isRead: false,
          })),
        });
      }
    }

    return ApiResponse.created(res, qaDto(event), 'Q&A session scheduled and members notified');
  } catch (e) { next(e); }
};

export const deleteQASession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.communityEvent.findUnique({ where: { id: req.params.sessionId } });
    if (!event || !event.description?.startsWith(QA_PREFIX)) return ApiResponse.notFound(res, 'Q&A session not found');
    await prisma.communityEvent.update({ where: { id: event.id }, data: { isCancelled: true } });
    return ApiResponse.success(res, null, 'Q&A session cancelled');
  } catch (e) { next(e); }
};
