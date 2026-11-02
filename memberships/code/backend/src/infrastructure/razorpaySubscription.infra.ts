import Razorpay from 'razorpay';

import { env } from '../config/env';
import { PLAN_INTERVAL } from '../generated/prisma/enums';

// A second client next to razorpay.infra.ts so the existing module stays untouched;
// merge the two when this ships.
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

const toPaise = (amountInRupees: number): number =>
  Math.round(amountInRupees * 100);

const RAZORPAY_PERIOD: Record<
  PLAN_INTERVAL,
  { period: 'weekly' | 'monthly' | 'yearly'; interval: number }
> = {
  WEEKLY: { period: 'weekly', interval: 1 },
  EVERY_4_WEEKS: { period: 'weekly', interval: 4 },
  MONTHLY: { period: 'monthly', interval: 1 },
  QUARTERLY: { period: 'monthly', interval: 3 },
  HALF_YEARLY: { period: 'monthly', interval: 6 },
  YEARLY: { period: 'yearly', interval: 1 },
};

/** Razorpay caps total_count; a long horizon keeps the subscription open until cancelled. */
const SUBSCRIPTION_TOTAL_COUNT: Record<PLAN_INTERVAL, number> = {
  WEEKLY: 260,
  EVERY_4_WEEKS: 65,
  MONTHLY: 60,
  QUARTERLY: 20,
  HALF_YEARLY: 10,
  YEARLY: 5,
};

export const createRazorpayPlan = async ({
  name,
  amountInRupees,
  interval,
  planPriceId,
}: {
  name: string;
  amountInRupees: number;
  interval: PLAN_INTERVAL;
  planPriceId: string;
}): Promise<{ id: string }> => {
  const { id } = await razorpay.plans.create({
    ...RAZORPAY_PERIOD[interval],
    item: { name, amount: toPaise(amountInRupees), currency: 'INR' },
    notes: { flow: 'plan', planPriceId },
  });
  return { id };
};

/**
 * The first period is charged up front as an add-on (the intro price, a
 * discounted price or the full price, plus any joining fee), and recurring
 * charges start when that period ends. This keeps intro offers, first-charge
 * coupons and joining fees out of the Razorpay plan itself.
 */
export const createRazorpaySubscription = async ({
  razorpayPlanId,
  interval,
  firstChargeInRupees,
  firstPeriodEnd,
  userPlanId,
  userId,
}: {
  razorpayPlanId: string;
  interval: PLAN_INTERVAL;
  firstChargeInRupees: number;
  firstPeriodEnd: Date;
  userPlanId: string;
  userId: string;
}): Promise<{ id: string }> => {
  const { id } = await razorpay.subscriptions.create({
    plan_id: razorpayPlanId,
    total_count: SUBSCRIPTION_TOTAL_COUNT[interval],
    customer_notify: 0, // peakst8 sends its own reminders and receipts
    start_at: Math.floor(firstPeriodEnd.getTime() / 1000),
    addons:
      firstChargeInRupees > 0
        ? [
            {
              item: {
                name: 'First period',
                amount: toPaise(firstChargeInRupees),
                currency: 'INR',
              },
            },
          ]
        : [],
    notes: { flow: 'plan', userPlanId, userId },
  });
  return { id };
};

export const createRazorpayPlanOrder = async ({
  amountInRupees,
  userPlanId,
  userId,
}: {
  amountInRupees: number;
  userPlanId: string;
  userId: string;
}): Promise<{ id: string }> => {
  const { id } = await razorpay.orders.create({
    amount: toPaise(amountInRupees),
    currency: 'INR',
    receipt: `plan_${Date.now()}`,
    notes: { flow: 'plan', userPlanId, userId },
  });
  return { id };
};

export const cancelRazorpaySubscription = async ({
  subscriptionId,
  isAtCycleEnd,
}: {
  subscriptionId: string;
  isAtCycleEnd: boolean;
}): Promise<void> => {
  await razorpay.subscriptions.cancel(subscriptionId, isAtCycleEnd);
};

export const pauseRazorpaySubscription = async ({
  subscriptionId,
}: {
  subscriptionId: string;
}): Promise<void> => {
  await razorpay.subscriptions.pause(subscriptionId, { pause_at: 'now' });
};

export const resumeRazorpaySubscription = async ({
  subscriptionId,
}: {
  subscriptionId: string;
}): Promise<void> => {
  await razorpay.subscriptions.resume(subscriptionId, { resume_at: 'now' });
};
