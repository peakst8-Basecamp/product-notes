import { prisma } from '..';
import { Prisma } from '../generated/prisma/client';
import {
  PLAN_REMINDER_STATUS,
  PLAN_USAGE_STATUS,
  USER_PLAN_STATUS,
} from '../generated/prisma/enums';

const LIVE_USER_PLAN_STATUSES: USER_PLAN_STATUS[] = [
  USER_PLAN_STATUS.PENDING_PAYMENT,
  USER_PLAN_STATUS.ACTIVE,
  USER_PLAN_STATUS.PAST_DUE,
  USER_PLAN_STATUS.PAUSED,
  USER_PLAN_STATUS.CANCELS_AT_PERIOD_END,
];

/** Everything the pricing rule needs about a member's plan. */
export const pricingUserPlanSelect = {
  id: true,
  status: true,
  creditsOverride: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  plan: {
    select: {
      id: true,
      name: true,
      clubId: true,
      kind: true,
      limitPeriod: true,
      usageLimit: true,
      coverage: { select: { eventType: true, eventId: true } },
    },
  },
  usages: {
    where: { status: { not: PLAN_USAGE_STATUS.RELEASED } },
    select: { eventDate: true },
  },
} satisfies Prisma.UserPlanSelect;

export type PricingUserPlanRecord = Prisma.UserPlanGetPayload<{
  select: typeof pricingUserPlanSelect;
}>;

const planCouponSelect = {
  appliesTo: true,
  chargesCount: true,
  coupon: {
    select: {
      id: true,
      couponCode: true,
      offerPercentage: true,
      flatDiscountAmount: true,
      totalUsageLimit: true,
    },
  },
} satisfies Prisma.CouponToPlanSelect;

export type PlanCouponRecord = Prisma.CouponToPlanGetPayload<{
  select: typeof planCouponSelect;
}>;

const planForJoinSelect = {
  id: true,
  clubId: true,
  name: true,
  kind: true,
  capacity: true,
  isApprovalRequired: true,
  isFirstTimeOnly: true,
  isOnePerMember: true,
  allowDiscountCodes: true,
  minCommitmentCycles: true,
  prices: {
    where: { isActive: true },
    select: {
      id: true,
      amount: true,
      billingType: true,
      interval: true,
      validity: true,
      validityDays: true,
      validUntil: true,
      joiningFee: true,
      razorpayPlanId: true,
      introOffers: {
        where: { isActive: true },
        select: { id: true, amount: true, durationDays: true },
      },
    },
  },
} satisfies Prisma.PlanSelect;

export type PlanForJoinRecord = Prisma.PlanGetPayload<{
  select: typeof planForJoinSelect;
}> | null;

export const dueReminderSelect = {
  id: true,
  type: true,
  channel: true,
  dueAt: true,
  amount: true,
  attemptCount: true,
  userPlan: {
    select: {
      id: true,
      status: true,
      user: { select: { id: true, email: true, phoneNumber: true } },
      plan: { select: { name: true, club: { select: { name: true } } } },
    },
  },
} satisfies Prisma.PlanReminderDeliverySelect;

export const membershipRepository = {
  LIVE_USER_PLAN_STATUSES,

  async findClubForAdmin({
    clubId,
    userId,
  }: {
    clubId: string;
    userId: string;
  }) {
    return prisma.club.findFirst({
      where: { id: clubId, hosts: { some: { userId } } },
      select: { id: true, name: true },
    });
  },

  async findPlanForAdmin({
    planId,
    userId,
  }: {
    planId: string;
    userId: string;
  }) {
    return prisma.plan.findFirst({
      where: { id: planId, club: { hosts: { some: { userId } } } },
      select: { id: true, clubId: true, name: true },
    });
  },

  async findPublicPlans({ clubId }: { clubId: string }) {
    return prisma.plan.findMany({
      where: {
        clubId,
        isPublished: true,
        isArchived: false,
        isUnlisted: false,
      },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        kind: true,
        name: true,
        description: true,
        coverImage: true,
        limitPeriod: true,
        usageLimit: true,
        isApprovalRequired: true,
        isFeatured: true,
        earlyAccessHours: true,
        guestPassesPerCycle: true,
        coverage: { select: { eventType: true, eventId: true } },
        prices: {
          where: { isActive: true },
          select: {
            id: true,
            label: true,
            amount: true,
            billingType: true,
            interval: true,
            validity: true,
            validityDays: true,
            joiningFee: true,
            introOffers: {
              where: { isActive: true },
              select: { id: true, amount: true, durationDays: true },
            },
          },
        },
        _count: { select: { perks: true } },
      },
    });
  },

  async findPlanForJoin({
    planId,
    planPriceId,
  }: {
    planId: string;
    planPriceId: string;
  }): Promise<PlanForJoinRecord> {
    return prisma.plan.findFirst({
      where: { id: planId, isPublished: true, isArchived: false },
      select: {
        ...planForJoinSelect,
        prices: {
          ...planForJoinSelect.prices,
          where: { id: planPriceId, isActive: true },
        },
      },
    });
  },
  async countLiveHolders({ planId }: { planId: string }) {
    return prisma.userPlan.count({
      where: { planId, status: { in: LIVE_USER_PLAN_STATUSES } },
    });
  },

  async findUserPlansOfPlan({
    planId,
    userId,
  }: {
    planId: string;
    userId: string;
  }) {
    return prisma.userPlan.findMany({
      where: { planId, userId },
      select: { id: true, status: true, introOfferId: true },
    });
  },

  async hasAttendedClub({
    clubId,
    userId,
  }: {
    clubId: string;
    userId: string;
  }) {
    const registration = await prisma.registration.findFirst({
      where: { userId, isDeleted: false, event: { clubId } },
      select: { id: true },
    });
    return registration !== null;
  },

  async findApprovedJoinRequest({
    planId,
    userId,
  }: {
    planId: string;
    userId: string;
  }) {
    return prisma.planJoinRequest.findFirst({
      where: { planId, userId, status: 'APPROVED', isWithdrawn: false },
      select: { id: true },
    });
  },

  async findPendingJoinRequest({
    planId,
    userId,
  }: {
    planId: string;
    userId: string;
  }) {
    return prisma.planJoinRequest.findFirst({
      where: { planId, userId, status: 'PENDING', isWithdrawn: false },
      select: { id: true },
    });
  },

  async findPlanCoupon({
    couponCode,
    planId,
  }: {
    couponCode: string;
    planId: string;
  }) {
    return prisma.couponToPlan.findFirst({
      where: {
        planId,
        coupon: {
          couponCode: { equals: couponCode, mode: 'insensitive' },
          isActive: true,
          OR: [{ expireAt: null }, { expireAt: { gt: new Date() } }],
        },
      },
      select: planCouponSelect,
    });
  },

  async countCouponPlanUses({ couponId }: { couponId: string }) {
    return prisma.userPlan.count({
      where: { couponId, status: { not: USER_PLAN_STATUS.ABANDONED } },
    });
  },

  async findBookableUserPlans({ userId }: { userId: string }) {
    return prisma.userPlan.findMany({
      where: {
        userId,
        status: {
          in: [USER_PLAN_STATUS.ACTIVE, USER_PLAN_STATUS.CANCELS_AT_PERIOD_END],
        },
      },
      select: pricingUserPlanSelect,
    });
  },

  async findPoliciesForCategory({
    categoryId,
    planIds,
  }: {
    categoryId: string;
    planIds: string[];
  }) {
    return prisma.categoryPlanPolicy.findMany({
      where: { categoryId, planId: { in: planIds } },
      select: { planId: true, policy: true, customValue: true },
    });
  },

  async findCategoryForPricing({
    eventId,
    categoryId,
  }: {
    eventId: string;
    categoryId: string;
  }) {
    return prisma.category.findFirst({
      where: { id: categoryId, eventId, isDeleted: false },
      select: {
        id: true,
        baseAmount: true,
        isPlanHoldersOnly: true,
        event: {
          select: {
            id: true,
            clubId: true,
            coHostClubId: true,
            eventType: true,
            startDate: true,
            publicOpensAt: true,
          },
        },
      },
    });
  },

  async findMyPlans({ userId }: { userId: string }) {
    return prisma.userPlan.findMany({
      where: { userId, status: { not: USER_PLAN_STATUS.ABANDONED } },
      orderBy: { createdAt: 'desc' },
      select: {
        ...pricingUserPlanSelect,
        priceOverride: true,
        introOfferId: true,
        planPrice: { select: { amount: true, billingType: true } },
        plan: {
          select: {
            ...pricingUserPlanSelect.plan.select,
            guestPassesPerCycle: true,
            earlyAccessHours: true,
            club: { select: { name: true } },
            _count: { select: { perks: true } },
          },
        },
        guestPasses: { select: { periodStart: true } },
      },
    });
  },

  async findSavings({ userPlanId }: { userPlanId: string }) {
    return prisma.planUsage.findMany({
      where: { userPlanId, status: { not: PLAN_USAGE_STATUS.RELEASED } },
      select: { eventDate: true, amountSaved: true },
    });
  },

  async findUserPlanForMember({
    userPlanId,
    userId,
  }: {
    userPlanId: string;
    userId: string;
  }) {
    return prisma.userPlan.findFirst({
      where: { id: userPlanId, userId },
      select: {
        id: true,
        status: true,
        startedAt: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        commitmentEndsAt: true,
        razorpaySubscriptionId: true,
        plan: {
          select: {
            id: true,
            name: true,
            cancellationPolicy: true,
            guestPassesPerCycle: true,
          },
        },
      },
    });
  },

  async findUserPlanForAdmin({
    userPlanId,
    userId,
  }: {
    userPlanId: string;
    userId: string;
  }) {
    return prisma.userPlan.findFirst({
      where: {
        id: userPlanId,
        plan: { club: { hosts: { some: { userId } } } },
      },
      select: {
        id: true,
        status: true,
        pausedAt: true,
        currentPeriodEnd: true,
        razorpaySubscriptionId: true,
        plan: { select: { id: true, name: true, usageLimit: true } },
      },
    });
  },

  async createHistory({
    tx,
    userPlanId,
    type,
    actorUserId,
    data,
  }: {
    tx?: Prisma.TransactionClient;
    userPlanId: string;
    type: string;
    actorUserId?: string;
    data?: Prisma.InputJsonValue;
  }) {
    await (tx ?? prisma).userPlanEvent.create({
      data: { userPlanId, type, actorUserId, data },
    });
  },

  async findSettings({ clubId }: { clubId: string }) {
    return prisma.clubMembershipSettings.findUnique({ where: { clubId } });
  },

  async cancelScheduledReminders({
    tx,
    userPlanId,
  }: {
    tx?: Prisma.TransactionClient;
    userPlanId: string;
  }) {
    await (tx ?? prisma).planReminderDelivery.updateMany({
      where: { userPlanId, status: PLAN_REMINDER_STATUS.SCHEDULED },
      data: { status: PLAN_REMINDER_STATUS.CANCELLED },
    });
  },

  async findDueReminders({ now, take }: { now: Date; take: number }) {
    return prisma.planReminderDelivery.findMany({
      where: {
        status: PLAN_REMINDER_STATUS.SCHEDULED,
        scheduledFor: { lte: now },
      },
      orderBy: { scheduledFor: 'asc' },
      take,
      select: dueReminderSelect,
    });
  },

  async findClubPerks({ clubId }: { clubId: string }) {
    return prisma.clubPerk.findMany({
      where: { clubId, isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        partnerName: true,
        category: true,
        visibility: true,
        offer: true,
        redeemHow: true,
        logo: true,
        plans: {
          where: { plan: { isPublished: true, isArchived: false } },
          select: { planId: true, plan: { select: { name: true } } },
        },
      },
    });
  },
};
