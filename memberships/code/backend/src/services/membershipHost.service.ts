/**
 * Club-admin side of memberships. Every method re-checks that the caller is a
 * host of the club that owns the record (RBAC on the route only says "HOST").
 */
import {
  APPROVAL_STATUS,
  PLAN_LIMIT_PERIOD,
  USER_PLAN_STATUS,
} from '../generated/prisma/enums';
import { ErrorResponse } from '../lib';
import { PLAN_HISTORY } from '../lib/membership.constants';
import {
  CreatePerkParams,
  CreatePlanCouponParams,
  CreatePlanParams,
  SetCategoryPoliciesParams,
  UpdatePlanParams,
  UpsertMembershipSettingsParams,
} from '../interfaces/membership.interface';
import { membershipRepository } from '../repositories/membership.repository';
import {
  pauseRazorpaySubscription,
  resumeRazorpaySubscription,
  cancelRazorpaySubscription,
} from '../infrastructure/razorpaySubscription.infra';
import { prisma } from '..';
import { membershipService } from './membership.service';
import { planReminderService } from './planReminder.service';

async function assertClubAdmin({
  clubId,
  userId,
}: {
  clubId: string;
  userId: string;
}) {
  const club = await membershipRepository.findClubForAdmin({ clubId, userId });
  if (!club) throw ErrorResponse.forbidden('You are not an admin of this club');
  return club;
}

async function assertPlanAdmin({
  planId,
  userId,
}: {
  planId: string;
  userId: string;
}) {
  const plan = await membershipRepository.findPlanForAdmin({ planId, userId });
  if (!plan) throw ErrorResponse.forbidden('You are not an admin of this plan');
  return plan;
}

async function assertUserPlanAdmin({
  userPlanId,
  userId,
}: {
  userPlanId: string;
  userId: string;
}) {
  const userPlan = await membershipRepository.findUserPlanForAdmin({
    userPlanId,
    userId,
  });
  if (!userPlan)
    throw ErrorResponse.forbidden('You are not an admin of this plan');
  return userPlan;
}

export const membershipHostService = {
  async createPlan(params: CreatePlanParams) {
    const {
      userId,
      clubId,
      prices,
      coverage,
      applyPolicyToExisting,
      ...fields
    } = params;
    await assertClubAdmin({ clubId, userId });
    if (prices.length === 0)
      throw ErrorResponse.badRequest('A plan needs at least one price');
    if (coverage.length === 0)
      throw ErrorResponse.badRequest('Choose what the plan covers');
    if (
      fields.limitPeriod !== PLAN_LIMIT_PERIOD.UNLIMITED &&
      !fields.usageLimit
    ) {
      throw ErrorResponse.badRequest('Set how many bookings the plan allows');
    }

    return prisma.$transaction(async (tx) => {
      const plan = await tx.plan.create({
        data: {
          clubId,
          ...fields,
          isPublished: fields.isPublished ?? false,
          coverage: { create: coverage },
          prices: {
            create: prices.map(({ introOffer, ...price }) => ({
              ...price,
              introOffers: introOffer ? { create: [introOffer] } : undefined,
            })),
          },
        },
        select: { id: true, name: true },
      });

      // "Apply to existing events": set the plan price on every covered upcoming pass.
      if (!applyPolicyToExisting) return { ...plan, passesPriced: 0 };
      const eventTypes = coverage.flatMap(({ eventType }) =>
        eventType ? [eventType] : [],
      );
      const eventIds = coverage.flatMap(({ eventId }) =>
        eventId ? [eventId] : [],
      );
      const categories = await tx.category.findMany({
        where: {
          isDeleted: false,
          event: {
            isDeleted: false,
            OR: [{ clubId }, { coHostClubId: clubId }],
            AND: [
              { OR: [{ startDate: null }, { startDate: { gte: new Date() } }] },
              {
                OR: [
                  { eventType: { in: eventTypes } },
                  { id: { in: eventIds } },
                ],
              },
            ],
          },
        },
        select: { id: true },
      });
      await tx.categoryPlanPolicy.createMany({
        data: categories.map(({ id }) => ({
          categoryId: id,
          planId: plan.id,
          policy: applyPolicyToExisting.policy,
          customValue: applyPolicyToExisting.customValue,
        })),
        skipDuplicates: true,
      });
      return { ...plan, passesPriced: categories.length };
    });
  },

  async updatePlan({ userId, planId, ...fields }: UpdatePlanParams) {
    await assertPlanAdmin({ planId, userId });
    return prisma.plan.update({
      where: { id: planId },
      data: fields,
      select: {
        id: true,
        name: true,
        isPublished: true,
        isUnlisted: true,
        isArchived: true,
      },
    });
  },

  /** The "Plan pricing" row in the event editor: one policy per plan, or null for no benefit. */
  async setCategoryPolicies({
    userId,
    categoryId,
    policies,
  }: SetCategoryPoliciesParams) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        event: { club: { hosts: { some: { userId } } } },
      },
      select: { id: true, event: { select: { clubId: true } } },
    });
    if (!category)
      throw ErrorResponse.forbidden('You are not an admin of this event');
    const planIds = policies.map(({ planId }) => planId);
    const ownPlans = await prisma.plan.count({
      where: { id: { in: planIds }, clubId: category.event.clubId },
    });
    if (ownPlans !== planIds.length)
      throw ErrorResponse.badRequest('Plans must belong to this club');

    await prisma.$transaction(async (tx) => {
      for (const { planId, policy } of policies) {
        if (!policy) {
          await tx.categoryPlanPolicy.deleteMany({
            where: { categoryId, planId },
          });
          continue;
        }
        await tx.categoryPlanPolicy.upsert({
          where: { categoryId_planId: { categoryId, planId } },
          create: { categoryId, planId, ...policy },
          update: policy,
        });
      }
    });
    return { categoryId, updated: policies.length };
  },

  async listHolders({
    userId,
    clubId,
    status,
  }: {
    userId: string;
    clubId: string;
    status?: USER_PLAN_STATUS;
  }) {
    await assertClubAdmin({ clubId, userId });
    return prisma.userPlan.findMany({
      where: {
        plan: { clubId },
        status: status ?? { in: membershipRepository.LIVE_USER_PLAN_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        currentPeriodEnd: true,
        cancelRequestedAt: true,
        creditsOverride: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        plan: { select: { id: true, name: true, kind: true } },
        _count: { select: { usages: true } },
      },
    });
  },

  async pauseUserPlan({
    userId,
    userPlanId,
    pauseUntil,
  }: {
    userId: string;
    userPlanId: string;
    pauseUntil?: Date;
  }) {
    const userPlan = await assertUserPlanAdmin({ userPlanId, userId });
    if (userPlan.status !== USER_PLAN_STATUS.ACTIVE) {
      throw ErrorResponse.badRequest('Only active plans can be paused');
    }
    if (userPlan.razorpaySubscriptionId) {
      await pauseRazorpaySubscription({
        subscriptionId: userPlan.razorpaySubscriptionId,
      });
    }
    await prisma.userPlan.update({
      where: { id: userPlanId },
      data: {
        status: USER_PLAN_STATUS.PAUSED,
        pausedAt: new Date(),
        pauseUntil: pauseUntil ?? null,
      },
    });
    await membershipRepository.createHistory({
      userPlanId,
      type: PLAN_HISTORY.PAUSED,
      actorUserId: userId,
    });
    await membershipRepository.cancelScheduledReminders({ userPlanId });
    return { status: USER_PLAN_STATUS.PAUSED };
  },

  /** Resuming moves the end date out by the length of the pause, so the member loses nothing. */
  async resumeUserPlan({
    userId,
    userPlanId,
  }: {
    userId: string;
    userPlanId: string;
  }) {
    const userPlan = await assertUserPlanAdmin({ userPlanId, userId });
    if (userPlan.status !== USER_PLAN_STATUS.PAUSED || !userPlan.pausedAt) {
      throw ErrorResponse.badRequest('This plan is not paused');
    }
    if (userPlan.razorpaySubscriptionId) {
      await resumeRazorpaySubscription({
        subscriptionId: userPlan.razorpaySubscriptionId,
      });
    }
    const pausedMs = Date.now() - userPlan.pausedAt.getTime();
    await prisma.userPlan.update({
      where: { id: userPlanId },
      data: {
        status: USER_PLAN_STATUS.ACTIVE,
        pausedAt: null,
        pauseUntil: null,
        currentPeriodEnd: userPlan.currentPeriodEnd
          ? new Date(userPlan.currentPeriodEnd.getTime() + pausedMs)
          : null,
      },
    });
    await membershipRepository.createHistory({
      userPlanId,
      type: PLAN_HISTORY.RESUMED,
      actorUserId: userId,
      data: { pausedDays: Math.round(pausedMs / 86_400_000) },
    });
    await planReminderService.scheduleForUserPlan({ userPlanId });
    return { status: USER_PLAN_STATUS.ACTIVE };
  },

  /** Cancel at period end (the default) or end now. */
  async cancelUserPlan({
    userId,
    userPlanId,
    isImmediate,
  }: {
    userId: string;
    userPlanId: string;
    isImmediate: boolean;
  }) {
    const userPlan = await assertUserPlanAdmin({ userPlanId, userId });
    if (!isImmediate) {
      await membershipService.scheduleCancellation({
        userPlanId,
        actorUserId: userId,
      });
      return { status: USER_PLAN_STATUS.CANCELS_AT_PERIOD_END };
    }
    if (userPlan.razorpaySubscriptionId) {
      await cancelRazorpaySubscription({
        subscriptionId: userPlan.razorpaySubscriptionId,
        isAtCycleEnd: false,
      });
    }
    await prisma.userPlan.update({
      where: { id: userPlanId },
      data: { status: USER_PLAN_STATUS.ENDED, endedAt: new Date() },
    });
    await membershipRepository.createHistory({
      userPlanId,
      type: PLAN_HISTORY.ENDED,
      actorUserId: userId,
    });
    await membershipRepository.cancelScheduledReminders({ userPlanId });
    return { status: USER_PLAN_STATUS.ENDED };
  },

  async setCredits({
    userId,
    userPlanId,
    credits,
  }: {
    userId: string;
    userPlanId: string;
    credits: number;
  }) {
    const userPlan = await assertUserPlanAdmin({ userPlanId, userId });
    if (userPlan.plan.usageLimit === null) {
      throw ErrorResponse.badRequest('This plan has unlimited bookings');
    }
    await prisma.userPlan.update({
      where: { id: userPlanId },
      data: { creditsOverride: credits },
    });
    await membershipRepository.createHistory({
      userPlanId,
      type: PLAN_HISTORY.CREDITS_CHANGED,
      actorUserId: userId,
      data: { credits },
    });
    return { creditsOverride: credits };
  },

  async reviewJoinRequest({
    userId,
    joinRequestId,
    isApproved,
  }: {
    userId: string;
    joinRequestId: string;
    isApproved: boolean;
  }) {
    const request = await prisma.planJoinRequest.findFirst({
      where: {
        id: joinRequestId,
        plan: { club: { hosts: { some: { userId } } } },
      },
      select: { id: true, status: true, isWithdrawn: true },
    });
    if (!request)
      throw ErrorResponse.forbidden('You are not an admin of this plan');
    if (request.status !== APPROVAL_STATUS.PENDING || request.isWithdrawn) {
      throw ErrorResponse.badRequest('This request has already been decided');
    }
    return prisma.planJoinRequest.update({
      where: { id: joinRequestId },
      data: {
        status: isApproved
          ? APPROVAL_STATUS.APPROVED
          : APPROVAL_STATUS.REJECTED,
        reviewedById: userId,
      },
      select: { id: true, status: true },
    });
  },

  async reviewCancelRequest({
    userId,
    cancelRequestId,
    isApproved,
  }: {
    userId: string;
    cancelRequestId: string;
    isApproved: boolean;
  }) {
    const request = await prisma.planCancelRequest.findFirst({
      where: {
        id: cancelRequestId,
        userPlan: { plan: { club: { hosts: { some: { userId } } } } },
      },
      select: { id: true, status: true, userPlanId: true },
    });
    if (!request)
      throw ErrorResponse.forbidden('You are not an admin of this plan');
    if (request.status !== APPROVAL_STATUS.PENDING) {
      throw ErrorResponse.badRequest('This request has already been decided');
    }
    await prisma.planCancelRequest.update({
      where: { id: cancelRequestId },
      data: {
        status: isApproved
          ? APPROVAL_STATUS.APPROVED
          : APPROVAL_STATUS.REJECTED,
        reviewedById: userId,
      },
    });
    if (isApproved) {
      await membershipService.scheduleCancellation({
        userPlanId: request.userPlanId,
        actorUserId: userId,
      });
    }
    return {
      status: isApproved
        ? USER_PLAN_STATUS.CANCELS_AT_PERIOD_END
        : USER_PLAN_STATUS.ACTIVE,
    };
  },

  async upsertSettings({
    userId,
    clubId,
    ...settings
  }: UpsertMembershipSettingsParams) {
    await assertClubAdmin({ clubId, userId });
    const data = {
      ...settings,
      // The 24-hour pre-debit notice can't be removed.
      reminderOffsetsHours:
        settings.reminderOffsetsHours &&
        !settings.reminderOffsetsHours.includes(24)
          ? [...settings.reminderOffsetsHours, 24]
          : settings.reminderOffsetsHours,
    };
    return prisma.clubMembershipSettings.upsert({
      where: { clubId },
      create: { clubId, ...data },
      update: data,
    });
  },

  async createPerk({ userId, clubId, planIds, ...perk }: CreatePerkParams) {
    await assertClubAdmin({ clubId, userId });
    const ownPlans = await prisma.plan.count({
      where: { id: { in: planIds }, clubId },
    });
    if (ownPlans !== planIds.length)
      throw ErrorResponse.badRequest('Plans must belong to this club');
    return prisma.clubPerk.create({
      data: {
        clubId,
        ...perk,
        plans: { create: planIds.map((planId) => ({ planId })) },
      },
      select: { id: true, partnerName: true },
    });
  },

  async setPerkActive({
    userId,
    perkId,
    isActive,
  }: {
    userId: string;
    perkId: string;
    isActive: boolean;
  }) {
    const perk = await prisma.clubPerk.findFirst({
      where: { id: perkId, club: { hosts: { some: { userId } } } },
      select: { id: true },
    });
    if (!perk)
      throw ErrorResponse.forbidden('You are not an admin of this perk');
    return prisma.clubPerk.update({
      where: { id: perkId },
      data: { isActive },
      select: { id: true, isActive: true },
    });
  },

  /** Perks with their reveal counts, for the club to report back to brands. */
  async listPerksWithReveals({
    userId,
    clubId,
  }: {
    userId: string;
    clubId: string;
  }) {
    await assertClubAdmin({ clubId, userId });
    return prisma.clubPerk.findMany({
      where: { clubId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        partnerName: true,
        category: true,
        visibility: true,
        offer: true,
        code: true,
        isActive: true,
        revealCount: true,
        plans: { select: { plan: { select: { id: true, name: true } } } },
      },
    });
  },

  /** Discount codes are off by default; creating a code turns codes on for its plans. */
  async createPlanCoupon({
    userId,
    clubId,
    couponCode,
    offerPercentage,
    flatDiscountAmount,
    planIds,
    appliesTo,
    chargesCount,
    totalUsageLimit,
    expireAt,
  }: CreatePlanCouponParams) {
    await assertClubAdmin({ clubId, userId });
    if (
      (offerPercentage === undefined) ===
      (flatDiscountAmount === undefined)
    ) {
      throw ErrorResponse.badRequest(
        'Give either a percentage or an amount off',
      );
    }
    const ownPlans = await prisma.plan.count({
      where: { id: { in: planIds }, clubId },
    });
    if (planIds.length === 0 || ownPlans !== planIds.length) {
      throw ErrorResponse.badRequest('Choose plans from this club');
    }
    return prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.create({
        data: {
          couponCode: couponCode.toUpperCase(),
          offerPercentage: offerPercentage ?? null,
          flatDiscountAmount: flatDiscountAmount ?? null,
          totalUsageLimit: totalUsageLimit ?? null,
          expireAt: expireAt ?? null,
        },
        select: { id: true, couponCode: true },
      });
      await tx.couponToPlan.createMany({
        data: planIds.map((planId) => ({
          couponId: coupon.id,
          planId,
          appliesTo,
          chargesCount: chargesCount ?? null,
        })),
      });
      await tx.plan.updateMany({
        where: { id: { in: planIds } },
        data: { allowDiscountCodes: true },
      });
      return coupon;
    });
  },
};
