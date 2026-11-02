/**
 * Razorpay events for plans. The existing webhook controller verifies the
 * signature, then routes subscription events (and order events whose
 * notes.flow is 'plan') here. Every handler is idempotent: Razorpay retries
 * webhooks, and the reconciliation sweep can replay them.
 */
import {
  PLAN_REMINDER_TYPE,
  USER_PLAN_STATUS,
} from '../generated/prisma/enums';
import { logger } from '../lib';
import {
  PLAN_HISTORY,
  PLAN_PENDING_PAYMENT_TTL_MS,
} from '../lib/membership.constants';
import { RazorpaySubscriptionWebhook } from '../interfaces/membership.interface';
import { membershipRepository } from '../repositories/membership.repository';
import { prisma } from '..';
import { membershipService } from './membership.service';
import { planReminderService } from './planReminder.service';

const DAY_MS = 86_400_000;
/** Razorpay's own retry window, before the club's grace days start. */
const RETRY_WINDOW_DAYS = 7;

const fromUnix = (seconds: number | null): Date | null =>
  seconds ? new Date(seconds * 1000) : null;

export const membershipBillingService = {
  async handleSubscriptionEvent({
    event,
    subscriptionId,
    paymentId,
    amountInPaise,
    currentStart,
    currentEnd,
  }: RazorpaySubscriptionWebhook): Promise<void> {
    const userPlan = await prisma.userPlan.findUnique({
      where: { razorpaySubscriptionId: subscriptionId },
      select: { id: true, status: true, currentPeriodEnd: true },
    });
    if (!userPlan) {
      logger.warn(
        { subscriptionId, event },
        'Plan webhook for an unknown subscription',
      );
      return;
    }
    const amount = amountInPaise !== null ? amountInPaise / 100 : 0;

    switch (event) {
      // Mandate authorized and the up-front first period charged.
      case 'subscription.authenticated':
      case 'subscription.activated': {
        if (userPlan.status === USER_PLAN_STATUS.PENDING_PAYMENT) {
          await membershipService.activateUserPlan({
            userPlanId: userPlan.id,
            paymentId,
            amount,
          });
        }
        return;
      }

      // A recurring charge succeeded: open the next period.
      case 'subscription.charged': {
        if (!paymentId) return;
        const existing = await prisma.planCharge.findUnique({
          where: { razorpayPaymentId: paymentId },
          select: { id: true },
        });
        if (existing) return;
        const periodStart =
          fromUnix(currentStart) ?? userPlan.currentPeriodEnd ?? new Date();
        const periodEnd = fromUnix(currentEnd);
        await prisma.$transaction(async (tx) => {
          await tx.planCharge.create({
            data: {
              userPlanId: userPlan.id,
              type: 'RENEWAL',
              amount,
              razorpayPaymentId: paymentId,
              status: 'SUCCESS',
              periodStart,
              periodEnd,
            },
          });
          await tx.userPlan.update({
            where: { id: userPlan.id },
            data: {
              status:
                userPlan.status === USER_PLAN_STATUS.PAST_DUE
                  ? USER_PLAN_STATUS.ACTIVE
                  : userPlan.status,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              creditsOverride: null, // a host's credit change lasts one period
            },
          });
          await membershipRepository.createHistory({
            tx,
            userPlanId: userPlan.id,
            type: PLAN_HISTORY.RENEWED,
            data: { amount, paymentId },
          });
        });
        await planReminderService.sendNow({
          userPlanId: userPlan.id,
          type: PLAN_REMINDER_TYPE.CHARGED,
          dueAt: periodEnd ?? new Date(),
          amount,
        });
        await planReminderService.scheduleForUserPlan({
          userPlanId: userPlan.id,
        });
        return;
      }

      // A charge failed and Razorpay will retry.
      case 'subscription.pending': {
        if (userPlan.status === USER_PLAN_STATUS.ACTIVE) {
          await prisma.userPlan.update({
            where: { id: userPlan.id },
            data: { status: USER_PLAN_STATUS.PAST_DUE },
          });
          await membershipRepository.createHistory({
            userPlanId: userPlan.id,
            type: PLAN_HISTORY.RENEWAL_FAILED,
          });
        }
        await planReminderService.sendNow({
          userPlanId: userPlan.id,
          type: PLAN_REMINDER_TYPE.PAYMENT_FAILED,
          dueAt: userPlan.currentPeriodEnd ?? new Date(),
          amount: amount || null,
        });
        return;
      }

      // Retries exhausted: stay past due through the club's grace days; endLapsedPlans ends it.
      case 'subscription.halted':
        await prisma.userPlan.update({
          where: { id: userPlan.id },
          data: { status: USER_PLAN_STATUS.PAST_DUE },
        });
        return;

      case 'subscription.cancelled':
      case 'subscription.completed': {
        const isScheduled =
          userPlan.status === USER_PLAN_STATUS.CANCELS_AT_PERIOD_END;
        const hasPeriodLeft =
          (userPlan.currentPeriodEnd?.getTime() ?? 0) > Date.now();
        if (isScheduled && hasPeriodLeft) return; // access continues to period end
        await prisma.userPlan.update({
          where: { id: userPlan.id },
          data: { status: USER_PLAN_STATUS.ENDED, endedAt: new Date() },
        });
        await membershipRepository.cancelScheduledReminders({
          userPlanId: userPlan.id,
        });
        await membershipRepository.createHistory({
          userPlanId: userPlan.id,
          type: PLAN_HISTORY.ENDED,
        });
        return;
      }

      default:
        return;
    }
  },

  /** One-time plans (packs) paid through a Razorpay order. */
  async handlePlanOrderPaid({
    orderId,
    paymentId,
  }: {
    orderId: string;
    paymentId: string;
  }): Promise<void> {
    const charge = await prisma.planCharge.findUnique({
      where: { razorpayOrderId: orderId },
      select: { id: true, userPlanId: true, amount: true, status: true },
    });
    if (!charge || charge.status === 'SUCCESS') return;
    await prisma.planCharge.update({
      where: { id: charge.id },
      data: { status: 'SUCCESS', razorpayPaymentId: paymentId },
    });
    await membershipService.activateUserPlan({
      userPlanId: charge.userPlanId,
      paymentId: null,
      amount: charge.amount,
    });
  },

  /**
   * Housekeeping, run with the reminder sweep: ends plans whose cancellation
   * date or pack validity has passed, ends past-due plans after the retry
   * window plus the club's grace days, and abandons unpaid checkouts.
   */
  async endLapsedPlans(): Promise<{ ended: number; abandoned: number }> {
    const now = new Date();
    const cancelled = await prisma.userPlan.updateMany({
      where: {
        status: USER_PLAN_STATUS.CANCELS_AT_PERIOD_END,
        currentPeriodEnd: { lte: now },
      },
      data: { status: USER_PLAN_STATUS.ENDED, endedAt: now },
    });
    const packs = await prisma.userPlan.updateMany({
      where: {
        status: USER_PLAN_STATUS.ACTIVE,
        planPrice: { billingType: 'ONE_TIME' },
        currentPeriodEnd: { lte: now },
      },
      data: { status: USER_PLAN_STATUS.ENDED, endedAt: now },
    });
    const pastDue = await prisma.userPlan.findMany({
      where: { status: USER_PLAN_STATUS.PAST_DUE },
      select: {
        id: true,
        currentPeriodEnd: true,
        plan: {
          select: {
            club: {
              select: {
                membershipSettings: {
                  select: { failedPaymentGraceDays: true },
                },
              },
            },
          },
        },
      },
    });
    let lapsed = 0;
    for (const userPlan of pastDue) {
      const graceDays =
        userPlan.plan.club.membershipSettings?.failedPaymentGraceDays ?? 0;
      const lapseAt =
        (userPlan.currentPeriodEnd?.getTime() ?? 0) +
        (RETRY_WINDOW_DAYS + graceDays) * DAY_MS;
      if (lapseAt > now.getTime()) continue;
      await prisma.userPlan.update({
        where: { id: userPlan.id },
        data: { status: USER_PLAN_STATUS.ENDED, endedAt: now },
      });
      await membershipRepository.createHistory({
        userPlanId: userPlan.id,
        type: PLAN_HISTORY.ENDED,
        data: { reason: 'payment' },
      });
      lapsed += 1;
    }
    const abandoned = await prisma.userPlan.updateMany({
      where: {
        status: USER_PLAN_STATUS.PENDING_PAYMENT,
        createdAt: {
          lte: new Date(now.getTime() - PLAN_PENDING_PAYMENT_TTL_MS),
        },
      },
      data: { status: USER_PLAN_STATUS.ABANDONED },
    });
    return {
      ended: cancelled.count + packs.count + lapsed,
      abandoned: abandoned.count,
    };
  },
};
