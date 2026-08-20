import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ApiResponse } from '../utils/apiResponse';

const intParam = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.trunc(parsed))) : fallback;
};

export const getCommunityMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const community = await prisma.community.findFirst({
      where: { isActive: true, OR: [{ id: req.params.id }, { slug: req.params.id }] },
      select: { id: true },
    });
    if (!community) return ApiResponse.notFound(res, 'Community not found');

    const viewerId = req.user!.userId;
    if (req.user!.role !== 'ADMIN') {
      const viewerMembership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: community.id, userId: viewerId } },
        select: { isApproved: true },
      });
      if (!viewerMembership?.isApproved) {
        return ApiResponse.forbidden(res, 'Approved membership is required to view the member directory');
      }
    }

    const page = intParam(req.query.page, 1, 1, 100000);
    const limit = intParam(req.query.limit, 20, 1, 50);
    const where = { communityId: community.id, isApproved: true };
    const [memberships, total] = await Promise.all([
      prisma.communityMember.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { joinedAt: 'asc' },
        select: { id: true, userId: true, role: true, joinedAt: true },
      }),
      prisma.communityMember.count({ where }),
    ]);

    const users = await prisma.user.findMany({
      where: { id: { in: memberships.map(m => m.userId) } },
      select: {
        id: true,
        role: true,
        patientProfile: { select: { firstName: true, lastName: true } },
        doctorProfile: { select: { id: true, firstName: true, lastName: true, isVerified: true, verificationStatus: true } },
        hospitalProfile: { select: { id: true, name: true, isVerified: true, verificationStatus: true } },
      },
    });
    const userMap = new Map(users.map(user => [user.id, user]));

    const members = memberships.map(membership => {
      const user = userMap.get(membership.userId);
      let name = 'HealthConnect Member';
      let doctorId: string | null = null;
      let verified = false;
      if (user?.doctorProfile) {
        name = `Dr. ${user.doctorProfile.firstName} ${user.doctorProfile.lastName}`.trim();
        doctorId = user.doctorProfile.id;
        verified = user.doctorProfile.isVerified || user.doctorProfile.verificationStatus === 'VERIFIED';
      } else if (user?.patientProfile) {
        name = `${user.patientProfile.firstName} ${user.patientProfile.lastName}`.trim();
      } else if (user?.hospitalProfile) {
        name = user.hospitalProfile.name;
        verified = user.hospitalProfile.isVerified || user.hospitalProfile.verificationStatus === 'VERIFIED';
      } else if (user?.role === 'ADMIN') {
        name = 'HealthConnect Team';
        verified = true;
      }
      return {
        id: membership.id,
        role: membership.role,
        joinedAt: membership.joinedAt,
        user: { role: user?.role || null, name, doctorId, verified },
      };
    });

    return ApiResponse.success(res, { members, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) { next(error); }
};
