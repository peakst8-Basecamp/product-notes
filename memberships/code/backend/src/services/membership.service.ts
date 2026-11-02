import { randomBytes } from 'node:crypto';

import {
  GUEST_PASS_STATUS,
  PERK_VISIBILITY,
  PLAN_BILLING_TYPE,
  PLAN_CANCELLATION_POLICY,
  PLAN_LIMIT_PERIOD,
  PLAN_USAGE_STATUS,
  PLAN_VALIDITY,
  USER_PLAN_STATUS,
} from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';
import { ErrorResponse } from '../lib';
import { PLAN_HISTORY } from '../lib/membership.constants';
import {
  ApplyPlanParams,
  ClubPerkListItem,
  JoinPlanParams,
  JoinPlanResult,
  MyPlanSummary,
  PlanCheckout,
  PlanPricingResult,
  PricingPlanInput,
} from '../interfaces/membership.interface';
import {
  membershipRepository,
  PlanCouponRecord,
  PlanForJoinRecord,
  PricingUserPlanRecord,
} from '../repositories/membership.repository';
import {
  createRazorpayPlan,
  createRazorpayPlanOrder,
  createRazorpaySubscription,
  cancelRazorpaySubscription,
} from '../infrastructure/razorpaySubscription.infra';
import { prisma } from '..';
import {
  addInterval,
  addMonths,
  BOOKABLE_PLAN_STATUSES,
  couponDiscountFor,
  creditsLeftFor,
  evaluatePlansForCategory,
} from './helpers/planPricing.helpers';
import { planReminderService } from './planReminder.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const newToken = (): string => randomBytes(24).toString('base64url');

function toPricingInput({
  userPlan,
  policies,
}: {
  userPlan: PricingUserPlanRecord;
  policies: Map<string, { policy: PricingPlanInput['policy'] }>;
}): PricingPlanInput | null {
  if (!userPlan.currentPeriodStart || !userPlan.currentPeriodEnd) return null;
  return {
    userPlanId: userPlan.id,
    planId: userPlan.plan.id,
    planName: userPlan.plan.name,
    clubId: userPlan.plan.clubId,
    kind: userPlan.plan.kind,
    status: userPlan.status,
    coverage: userPlan.plan.coverage,
    limitPeriod: userPlan.plan.limitPeriod,
    usageLimit: userPlan.plan.usageLimit,
    creditsOverride: userPlan.creditsOverride,
    currentPeriodStart: userPlan.currentPeriodStart,
    currentPeriodEnd: userPlan.currentPeriodEnd,
    usedEventDates: userPlan.usages.map(({ eventDate }) => eventDate),
    policy: policies.get(userPlan.plan.id)?.policy ?? null,
  };
}

type JoinPlanRecord = NonNullable<PlanForJoinRecord>;
type JoinPriceRecord = JoinPlanRecord['prices'][number];

/** Rules a member must pass before a plan can start. Returns their past copies of this plan. */
async function assertCanJoin({
  plan,
  userId,
}: {
  plan: JoinPlanRecord;
  userId: string;
}) {
  const existing = await membershipRepository.findUserPlansOfPlan({
    planId: plan.id,
    userId,
  });
  if (
    existing.some(({ status }) =>
      membershipRepository.LIVE_USER_PLAN_STATUSES.includes(status),
    )
  ) {
    throw ErrorResponse.Conflict('You already have this plan');
  }
  if (plan.isOnePerMember && existing.length > 0) {
    throw ErrorResponse.forbidden('This plan can only be bought once');
  }
  if (
    plan.isFirstTimeOnly &&
    (await membershipRepository.hasAttendedClub({
      clubId: plan.clubId,
      userId,
    }))
  ) {
    throw ErrorResponse.forbidden('This plan is for first-time members only');
  }
  if (plan.capacity !== null) {
    const holders = await membershipRepository.countLiveHolders({
      planId: plan.id,
    });
    if (holders >= plan.capacity)
      throw ErrorResponse.badRequest('This plan is sold out');
  }
  return existing;
}

/** For approval-only plans: the open request's id, or null once the club has approved. */
async function joinRequestIfNotApproved({
  planId,
  planPriceId,
  userId,
}: {
  planId: string;
  planPriceId: string;
  userId: string;
}): Promise<string | null> {
  if (await membershipRepository.findApprovedJoinRequest({ planId, userId }))
    return null;
  const pending = await membershipRepository.findPendingJoinRequest({
    planId,
    userId,
  });
  if (pending) return pending.id;
  const created = await prisma.planJoinRequest.create({
    data: { planId, userId, planPriceId },
    select: { id: true },
  });
  return created.id;
}

/** The price's intro offer, if this member hasn't used it before. Once per member per plan. */
function availableIntroOffer({
  price,
  existing,
}: {
  price: JoinPriceRecord;
  existing: { introOfferId: string | null }[];
}): JoinPriceRecord['introOffers'][number] {
  const intro = price.introOffers[0];
  if (!intro || existing.some(({ introOfferId }) => introOfferId !== null)) {
    throw ErrorResponse.badRequest('The intro offer is not available');
  }
  return intro;
}

async function resolvePlanCoupon({
  couponCode,
  planId,
  isAllowed,
  isIntro,
}: {
  couponCode: string;
  planId: string;
  isAllowed: boolean;
  isIntro: boolean;
}): Promise<PlanCouponRecord> {
  if (!isAllowed)
    throw ErrorResponse.badRequest('This plan does not take discount codes');
  if (isIntro)
    throw ErrorResponse.badRequest(
      'Discount codes cannot be combined with the intro offer',
    );
  const coupon = await membershipRepository.findPlanCoupon({
    couponCode,
    planId,
  });
  if (!coupon) throw ErrorResponse.badRequest('Invalid discount code');
  if (coupon.coupon.totalUsageLimit !== null) {
    const uses = await membershipRepository.countCouponPlanUses({
      couponId: coupon.coupon.id,
    });
    if (uses >= coupon.coupon.totalUsageLimit)
      throw ErrorResponse.badRequest('This code has been fully used');
  }
  return coupon;
}

const toCouponInput = (coupon: PlanCouponRecord) => ({
  ...coupon.coupon,
  appliesTo: coupon.appliesTo,
  chargesCount: coupon.chargesCount,
});

function firstPeriodEnd({
  price,
  now,
  introDays,
}: {
  price: JoinPriceRecord;
  now: Date;
  introDays: number | null;
}): Date {
  if (price.billingType === PLAN_BILLING_TYPE.RECURRING) {
    if (!price.interval)
      throw ErrorResponse.internalError('Recurring price has no interval');
    return introDays !== null
      ? new Date(now.getTime() + introDays * DAY_MS)
      : addInterval({ start: now, interval: price.interval });
  }
  if (price.validity === PLAN_VALIDITY.FIXED_DATE && price.validUntil)
    return price.validUntil;
  if (price.validity === PLAN_VALIDITY.NEVER_EXPIRES) return new Date(8.64e15);
  return new Date(now.getTime() + (price.validityDays ?? 30) * DAY_MS);
}

async function startSubscriptionCheckout({
  plan,
  price,
  coupon,
  amountToday,
  periodEnd,
  userPlanId,
  userId,
}: {
  plan: JoinPlanRecord;
  price: JoinPriceRecord;
  coupon: PlanCouponRecord | null;
  amountToday: number;
  periodEnd: Date;
  userPlanId: string;
  userId: string;
}): Promise<PlanCheckout> {
  const interval = price.interval!;
  // Codes that apply beyond the first charge need their own Razorpay plan at the discounted price.
  const recurringDiscount =
    coupon && coupon.appliesTo !== 'FIRST_CHARGE'
      ? couponDiscountFor({
          coupon: toCouponInput(coupon),
          amount: price.amount,
          chargeIndex: 1,
        })
      : 0;
  let razorpayPlanId = recurringDiscount === 0 ? price.razorpayPlanId : null;
  if (!razorpayPlanId) {
    ({ id: razorpayPlanId } = await createRazorpayPlan({
      name: plan.name,
      amountInRupees: price.amount - recurringDiscount,
      interval,
      planPriceId: price.id,
    }));
    if (recurringDiscount === 0) {
      await prisma.planPrice.update({
        where: { id: price.id },
        data: { razorpayPlanId },
      });
    }
  }
  const { id: subscriptionId } = await createRazorpaySubscription({
    razorpayPlanId,
    interval,
    firstChargeInRupees: amountToday,
    firstPeriodEnd: periodEnd,
    userPlanId,
    userId,
  });
  await prisma.userPlan.update({
    where: { id: userPlanId },
    data: { razorpaySubscriptionId: subscriptionId },
  });
  return { kind: 'SUBSCRIPTION', subscriptionId, amountToday };
}

async function startOrderCheckout({
  amountToday,
  now,
  periodEnd,
  userPlanId,
  userId,
}: {
  amountToday: number;
  now: Date;
  periodEnd: Date;
  userPlanId: string;
  userId: string;
}): Promise<PlanCheckout> {
  if (amountToday <= 0) return { kind: 'FREE' };
  const { id: orderId } = await createRazorpayPlanOrder({
    amountInRupees: amountToday,
    userPlanId,
    userId,
  });
  await prisma.planCharge.create({
    data: {
      userPlanId,
      type: 'FIRST_PAYMENT',
      amount: amountToday,
      razorpayOrderId: orderId,
      periodStart: now,
      periodEnd,
    },
  });
  return { kind: 'ORDER', orderId, amountToday };
}

export const membershipService = {
  async listPublicPlans({ clubId }: { clubId: string }) {
    const plans = await membershipRepository.findPublicPlans({ clubId });
    return plans.map(({ _count, ...plan }) => ({
      ...plan,
      perkCount: _count.perks,
    }));
  },

  /**
   * Starts a plan. Approval-only plans create a join request first; once
   * approved, the same call proceeds to payment. Returns what the client needs
   * to open Razorpay (a subscription for recurring prices, an order otherwise).
   */
  async joinPlan({
    userId,
    planId,
    planPriceId,
    useIntroOffer,
    couponCode,
  }: JoinPlanParams): Promise<JoinPlanResult> {
    const plan = await membershipRepository.findPlanForJoin({
      planId,
      planPriceId,
    });
    const price = plan?.prices[0];
    if (!plan || !price) throw ErrorResponse.notFound('Plan not found');

    const existing = await assertCanJoin({ plan, userId });
    if (plan.isApprovalRequired) {
      const pendingRequestId = await joinRequestIfNotApproved({
        planId,
        planPriceId,
        userId,
      });
      if (pendingRequestId) {
        return {
          userPlanId: null,
          joinRequestId: pendingRequestId,
          status: 'PENDING_APPROVAL',
          checkout: null,
        };
      }
    }

    const intro = useIntroOffer
      ? availableIntroOffer({ price, existing })
      : null;
    const isIntro = intro !== null;
    const coupon = couponCode
      ? await resolvePlanCoupon({
          couponCode,
          planId,
          isAllowed: plan.allowDiscountCodes,
          isIntro,
        })
      : null;

    const now = new Date();
    const periodEnd = firstPeriodEnd({
      price,
      now,
      introDays: intro?.durationDays ?? null,
    });
    const base = intro?.amount ?? price.amount;
    const discount = coupon
      ? couponDiscountFor({
          coupon: toCouponInput(coupon),
          amount: base,
          chargeIndex: 0,
        })
      : 0;
    const amountToday = base - discount + (price.joiningFee ?? 0);

    const userPlan = await prisma.userPlan.create({
      data: {
        userId,
        planId,
        planPriceId,
        introOfferId: intro?.id ?? null,
        couponId: coupon?.coupon.id ?? null,
        status: USER_PLAN_STATUS.PENDING_PAYMENT,
        commitmentEndsAt:
          plan.minCommitmentCycles && price.interval
            ? addMonths({ date: now, months: plan.minCommitmentCycles })
            : null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      select: { id: true },
    });
    await membershipRepository.createHistory({
      userPlanId: userPlan.id,
      type: PLAN_HISTORY.JOINED,
      actorUserId: userId,
      data: {
        isIntro,
        couponCode: coupon?.coupon.couponCode ?? null,
        amountToday,
      },
    });

    const checkout =
      price.billingType === PLAN_BILLING_TYPE.RECURRING
        ? await startSubscriptionCheckout({
            plan,
            price,
            coupon,
            amountToday,
            periodEnd,
            userPlanId: userPlan.id,
            userId,
          })
        : await startOrderCheckout({
            amountToday,
            now,
            periodEnd,
            userPlanId: userPlan.id,
            userId,
          });
    if (checkout.kind === 'FREE') {
      await membershipService.activateUserPlan({
        userPlanId: userPlan.id,
        paymentId: null,
        amount: 0,
      });
      return {
        userPlanId: userPlan.id,
        joinRequestId: null,
        status: USER_PLAN_STATUS.ACTIVE,
        checkout,
      };
    }
    return {
      userPlanId: userPlan.id,
      joinRequestId: null,
      status: USER_PLAN_STATUS.PENDING_PAYMENT,
      checkout,
    };
  },

  /** Called by the billing webhooks once the first payment (or mandate with up-front charge) succeeds. */
  async activateUserPlan({
    userPlanId,
    paymentId,
    amount,
  }: {
    userPlanId: string;
    paymentId: string | null;
    amount: number;
  }): Promise<void> {
    const updated = await prisma.userPlan.updateMany({
      where: { id: userPlanId, status: USER_PLAN_STATUS.PENDING_PAYMENT },
      data: { status: USER_PLAN_STATUS.ACTIVE, startedAt: new Date() },
    });
    if (updated.count === 0) return; // already activated by a retried webhook
    const activated = await prisma.userPlan.findUniqueOrThrow({
      where: { id: userPlanId },
      select: { startedAt: true },
    });
    // Align the period start with activation so "first period" checks hold.
    await prisma.userPlan.update({
      where: { id: userPlanId },
      data: { currentPeriodStart: activated.startedAt },
    });
    if (paymentId) {
      await prisma.planCharge.upsert({
        where: { razorpayPaymentId: paymentId },
        create: {
          userPlanId,
          type: 'FIRST_PAYMENT',
          amount,
          razorpayPaymentId: paymentId,
          status: 'SUCCESS',
        },
        update: { status: 'SUCCESS' },
      });
    }
    await membershipRepository.createHistory({
      userPlanId,
      type: PLAN_HISTORY.ACTIVATED,
      data: { amount },
    });
    await planReminderService.scheduleForUserPlan({ userPlanId });
  },

  async getMyPlans({ userId }: { userId: string }): Promise<MyPlanSummary[]> {
    const plans = await membershipRepository.findMyPlans({ userId });
    const now = new Date();
    return Promise.all(
      plans.map(async (userPlan) => {
        const savings = await membershipRepository.findSavings({
          userPlanId: userPlan.id,
        });
        const periodStart = userPlan.currentPeriodStart ?? new Date(0);
        const periodEnd = userPlan.currentPeriodEnd ?? new Date(8.64e15);
        const credits =
          userPlan.currentPeriodStart &&
          userPlan.plan.limitPeriod !== PLAN_LIMIT_PERIOD.UNLIMITED
            ? creditsLeftFor({
                plan: {
                  limitPeriod: userPlan.plan.limitPeriod,
                  usageLimit: userPlan.plan.usageLimit,
                  creditsOverride: userPlan.creditsOverride,
                  currentPeriodStart: userPlan.currentPeriodStart,
                  usedEventDates: userPlan.usages.map(
                    ({ eventDate }) => eventDate,
                  ),
                },
                at: now,
              })
            : { left: null, limit: null };
        const guestPassesUsed = userPlan.guestPasses.filter(
          (pass) => pass.periodStart.getTime() === periodStart.getTime(),
        ).length;
        return {
          userPlanId: userPlan.id,
          planId: userPlan.plan.id,
          planName: userPlan.plan.name,
          clubId: userPlan.plan.clubId,
          clubName: userPlan.plan.club.name,
          kind: userPlan.plan.kind,
          status: userPlan.status,
          currentPeriodEnd: userPlan.currentPeriodEnd,
          nextChargeAmount:
            userPlan.planPrice.billingType === PLAN_BILLING_TYPE.RECURRING &&
            userPlan.status === USER_PLAN_STATUS.ACTIVE
              ? (userPlan.priceOverride ?? userPlan.planPrice.amount)
              : null,
          creditsLeft: credits.left,
          creditsLimit: credits.limit,
          savedThisPeriod: savings
            .filter(
              ({ eventDate }) =>
                eventDate >= periodStart && eventDate < periodEnd,
            )
            .reduce((sum, { amountSaved }) => sum + amountSaved, 0),
          savedTotal: savings.reduce(
            (sum, { amountSaved }) => sum + amountSaved,
            0,
          ),
          guestPassesLeft: Math.max(
            0,
            (userPlan.plan.guestPassesPerCycle ?? 0) - guestPassesUsed,
          ),
          earlyAccessHours: userPlan.plan.earlyAccessHours,
          perkCount: userPlan.plan._count.perks,
        };
      }),
    );
  },

  /** What a member would pay for a pass with their plans. Used by checkout and the event page. */
  async priceCategoryForMember({
    userId,
    eventId,
    categoryId,
  }: ApplyPlanParams): Promise<
    PlanPricingResult & { baseAmount: number; isPlanHoldersOnly: boolean }
  > {
    const category = await membershipRepository.findCategoryForPricing({
      eventId,
      categoryId,
    });
    if (!category?.event.startDate)
      throw ErrorResponse.notFound('Pass not found');
    const userPlans = await membershipRepository.findBookableUserPlans({
      userId,
    });
    const policies = await membershipRepository.findPoliciesForCategory({
      categoryId,
      planIds: userPlans.map(({ plan }) => plan.id),
    });
    const policyMap = new Map(
      policies.map(({ planId, policy, customValue }) => [
        planId,
        { policy: { policy, customValue } },
      ]),
    );
    const inputs = userPlans
      .map((userPlan) => toPricingInput({ userPlan, policies: policyMap }))
      .filter((input): input is PricingPlanInput => input !== null);
    const result = evaluatePlansForCategory({
      plans: inputs,
      event: {
        eventId,
        clubId: category.event.clubId,
        coHostClubId: category.event.coHostClubId,
        eventType: category.event.eventType,
        startDate: category.event.startDate,
        baseAmount: category.baseAmount,
      },
    });
    return {
      ...result,
      baseAmount: category.baseAmount,
      isPlanHoldersOnly: category.isPlanHoldersOnly,
    };
  },

  /**
   * Checkout hook. Call inside the registration transaction in
   * proceedToPayment, before the Razorpay order is created. Returns the base
   * amount to charge (before coupons) and holds one use of the chosen plan.
   */
  async holdPlanForRegistration({
    tx,
    userId,
    eventId,
    categoryId,
    registrationId,
  }: ApplyPlanParams & {
    tx: Prisma.TransactionClient;
    registrationId: string;
  }): Promise<{ amountBeforeCoupon: number; userPlanId: string | null }> {
    const pricing = await membershipService.priceCategoryForMember({
      userId,
      eventId,
      categoryId,
    });
    if (pricing.isPlanHoldersOnly && !pricing.best) {
      throw ErrorResponse.forbidden('This pass is for plan holders only');
    }
    if (!pricing.best)
      return { amountBeforeCoupon: pricing.baseAmount, userPlanId: null };
    const category = await membershipRepository.findCategoryForPricing({
      eventId,
      categoryId,
    });
    await tx.registration.update({
      where: { id: registrationId },
      data: { appliedUserPlanId: pricing.best.userPlanId },
    });
    await tx.planUsage.create({
      data: {
        userPlanId: pricing.best.userPlanId,
        registrationId,
        usedByUserId: userId,
        eventDate: category!.event.startDate!,
        amountSaved: pricing.best.amountSaved,
        status:
          pricing.best.price === 0
            ? PLAN_USAGE_STATUS.CONSUMED
            : PLAN_USAGE_STATUS.HELD,
      },
    });
    return {
      amountBeforeCoupon: pricing.best.price,
      userPlanId: pricing.best.userPlanId,
    };
  },

  /** Payment succeeded → CONSUMED; order failed or expired → RELEASED. Idempotent. */
  async settlePlanUsage({
    registrationId,
    isPaid,
  }: {
    registrationId: string;
    isPaid: boolean;
  }): Promise<void> {
    await prisma.planUsage.updateMany({
      where: { registrationId, status: PLAN_USAGE_STATUS.HELD },
      data: {
        status: isPaid
          ? PLAN_USAGE_STATUS.CONSUMED
          : PLAN_USAGE_STATUS.RELEASED,
      },
    });
  },

  /** On ticket cancel: the credit comes back only inside the club's release window. */
  async releasePlanUsageOnCancel({
    registrationId,
  }: {
    registrationId: string;
  }): Promise<boolean> {
    const usage = await prisma.planUsage.findUnique({
      where: { registrationId },
      select: {
        id: true,
        eventDate: true,
        userPlan: { select: { plan: { select: { clubId: true } } } },
      },
    });
    if (!usage) return false;
    const settings = await membershipRepository.findSettings({
      clubId: usage.userPlan.plan.clubId,
    });
    const releaseHours = settings?.creditReleaseHours ?? 12;
    const isInWindow =
      usage.eventDate.getTime() - Date.now() >= releaseHours * 60 * 60 * 1000;
    if (!isInWindow && (settings?.lateCancelUsesCredit ?? true)) return false;
    await prisma.planUsage.update({
      where: { id: usage.id },
      data: { status: PLAN_USAGE_STATUS.RELEASED },
    });
    return true;
  },

  async cancelMyPlan({
    userId,
    userPlanId,
    reason,
  }: {
    userId: string;
    userPlanId: string;
    reason?: string;
  }): Promise<{
    status: USER_PLAN_STATUS;
    accessUntil: Date | null;
    isRequestSent: boolean;
  }> {
    const userPlan = await membershipRepository.findUserPlanForMember({
      userPlanId,
      userId,
    });
    if (!userPlan) throw ErrorResponse.notFound('Plan not found');
    if (userPlan.status === USER_PLAN_STATUS.PAST_DUE) {
      throw ErrorResponse.badRequest(
        'Pay the outstanding renewal before cancelling',
      );
    }
    if (userPlan.status !== USER_PLAN_STATUS.ACTIVE)
      throw ErrorResponse.badRequest('This plan is not active');
    if (userPlan.commitmentEndsAt && userPlan.commitmentEndsAt > new Date()) {
      throw ErrorResponse.forbidden(
        `This plan has a minimum commitment until ${userPlan.commitmentEndsAt.toDateString()}`,
      );
    }
    if (userPlan.plan.cancellationPolicy === PLAN_CANCELLATION_POLICY.REVIEW) {
      await prisma.planCancelRequest.create({ data: { userPlanId, reason } });
      await prisma.userPlan.update({
        where: { id: userPlanId },
        data: { cancelRequestedAt: new Date() },
      });
      await membershipRepository.createHistory({
        userPlanId,
        type: PLAN_HISTORY.CANCEL_REQUESTED,
        actorUserId: userId,
        data: { reason: reason ?? null },
      });
      return {
        status: USER_PLAN_STATUS.ACTIVE,
        accessUntil: userPlan.currentPeriodEnd,
        isRequestSent: true,
      };
    }
    await membershipService.scheduleCancellation({
      userPlanId,
      actorUserId: userId,
    });
    return {
      status: USER_PLAN_STATUS.CANCELS_AT_PERIOD_END,
      accessUntil: userPlan.currentPeriodEnd,
      isRequestSent: false,
    };
  },

  /** Stops future charges; access lasts to the end of the paid period. Shared by member and host flows. */
  async scheduleCancellation({
    userPlanId,
    actorUserId,
  }: {
    userPlanId: string;
    actorUserId: string;
  }): Promise<void> {
    const userPlan = await prisma.userPlan.update({
      where: { id: userPlanId },
      data: { status: USER_PLAN_STATUS.CANCELS_AT_PERIOD_END },
      select: { razorpaySubscriptionId: true, currentPeriodEnd: true },
    });
    if (userPlan.razorpaySubscriptionId) {
      await cancelRazorpaySubscription({
        subscriptionId: userPlan.razorpaySubscriptionId,
        isAtCycleEnd: true,
      });
    }
    await prisma.userPlan.update({
      where: { id: userPlanId },
      data: { cancelAt: userPlan.currentPeriodEnd },
    });
    await membershipRepository.createHistory({
      userPlanId,
      type: PLAN_HISTORY.CANCELLED,
      actorUserId,
    });
    await planReminderService.scheduleForUserPlan({ userPlanId });
  },

  async withdrawJoinRequest({
    userId,
    joinRequestId,
  }: {
    userId: string;
    joinRequestId: string;
  }) {
    const updated = await prisma.planJoinRequest.updateMany({
      where: {
        id: joinRequestId,
        userId,
        status: 'PENDING',
        isWithdrawn: false,
      },
      data: { isWithdrawn: true },
    });
    if (updated.count === 0) throw ErrorResponse.notFound('Request not found');
    return { isWithdrawn: true };
  },

  async sendGuestPass({
    userId,
    userPlanId,
  }: {
    userId: string;
    userPlanId: string;
  }) {
    const userPlan = await membershipRepository.findUserPlanForMember({
      userPlanId,
      userId,
    });
    if (!userPlan || !BOOKABLE_PLAN_STATUSES.includes(userPlan.status)) {
      throw ErrorResponse.badRequest('Guest passes need an active plan');
    }
    const limit = userPlan.plan.guestPassesPerCycle ?? 0;
    const periodStart = userPlan.currentPeriodStart ?? new Date();
    const used = await prisma.guestPass.count({
      where: { userPlanId, periodStart },
    });
    if (used >= limit)
      throw ErrorResponse.badRequest('No guest passes left this period');
    const pass = await prisma.guestPass.create({
      data: {
        userPlanId,
        claimToken: newToken(),
        periodStart,
        expiresAt: userPlan.currentPeriodEnd,
        status: GUEST_PASS_STATUS.SENT,
      },
      select: { id: true, claimToken: true, expiresAt: true },
    });
    await membershipRepository.createHistory({
      userPlanId,
      type: PLAN_HISTORY.GUEST_PASS_SENT,
      actorUserId: userId,
    });
    return {
      guestPassId: pass.id,
      claimToken: pass.claimToken,
      expiresAt: pass.expiresAt,
      left: limit - used - 1,
    };
  },

  /** The club perks page. Members-only perks are hidden from people who can't unlock them. */
  async listClubPerks({
    clubId,
    userId,
  }: {
    clubId: string;
    userId?: string;
  }): Promise<ClubPerkListItem[]> {
    const perks = await membershipRepository.findClubPerks({ clubId });
    const heldPlanIds = new Set(
      userId
        ? (await membershipRepository.findBookableUserPlans({ userId })).map(
            ({ plan }) => plan.id,
          )
        : [],
    );
    return perks
      .map((perk) => {
        const isUnlocked = perk.plans.some(({ planId }) =>
          heldPlanIds.has(planId),
        );
        return {
          id: perk.id,
          partnerName: perk.partnerName,
          category: perk.category,
          offer: perk.offer,
          redeemHow: perk.redeemHow,
          logo: perk.logo,
          isUnlocked,
          unlockingPlanNames: perk.plans.map(({ plan }) => plan.name),
          visibility: perk.visibility,
        };
      })
      .filter((perk) => perk.unlockingPlanNames.length > 0)
      .filter(
        (perk) =>
          perk.visibility !== PERK_VISIBILITY.MEMBERS_ONLY || perk.isUnlocked,
      )
      .map(({ visibility: _visibility, ...perk }) => perk);
  },

  /** Returns the code to a member whose plan unlocks the perk, and counts the reveal for the brand. */
  async revealPerk({ userId, perkId }: { userId: string; perkId: string }) {
    const perk = await prisma.clubPerk.findFirst({
      where: { id: perkId, isActive: true },
      select: {
        id: true,
        code: true,
        redeemHow: true,
        plans: { select: { planId: true } },
      },
    });
    if (!perk) throw ErrorResponse.notFound('Perk not found');
    const held = await membershipRepository.findBookableUserPlans({ userId });
    const isUnlocked = held.some(({ plan }) =>
      perk.plans.some(({ planId }) => planId === plan.id),
    );
    if (!isUnlocked)
      throw ErrorResponse.forbidden(
        'Join a plan that includes this perk to unlock it',
      );
    await prisma.clubPerk.update({
      where: { id: perkId },
      data: { revealCount: { increment: 1 } },
    });
    return { code: perk.code, redeemHow: perk.redeemHow };
  },
};
