/**
 * Pure membership rules: no database, no I/O. Everything here is covered by
 * scripts/check-plan-pricing.ts, so the rules can be checked without a server.
 */
import {
  COUPON_APPLIES_TO,
  PLAN_INTERVAL,
  PLAN_KIND,
  PLAN_LIMIT_PERIOD,
  PLAN_PRICE_POLICY,
  PLAN_REMINDER_TYPE,
  USER_PLAN_STATUS,
} from '../../generated/prisma/enums';
import {
  CouponChargeInput,
  PlanPolicyInput,
  PlanPriceCandidate,
  PlanPricingResult,
  PricingEventInput,
  PricingPlanInput,
  PricingStep,
  ReminderMessage,
  ReminderMessageInput,
  ReminderScheduleInput,
  UsageWindow,
} from '../../interfaces/membership.interface';
import {
  IST_OFFSET_MINUTES,
  PLAN_REMINDER_QUIET_END_HOUR,
  PLAN_REMINDER_QUIET_START_HOUR,
} from '../../lib/membership.constants';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Statuses whose holder can still book with the plan. */
export const BOOKABLE_PLAN_STATUSES: USER_PLAN_STATUS[] = [
  USER_PLAN_STATUS.ACTIVE,
  USER_PLAN_STATUS.CANCELS_AT_PERIOD_END,
];

export const INTERVAL_MONTHS: Record<PLAN_INTERVAL, number | null> = {
  WEEKLY: null,
  MONTHLY: 1,
  EVERY_4_WEEKS: null,
  QUARTERLY: 3,
  HALF_YEARLY: 6,
  YEARLY: 12,
};

const INTERVAL_DAYS: Partial<Record<PLAN_INTERVAL, number>> = {
  WEEKLY: 7,
  EVERY_4_WEEKS: 28,
};

const roundRupees = (amount: number): number => Math.round(amount);

export function addMonths({
  date,
  months,
}: {
  date: Date;
  months: number;
}): Date {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

/** End of the billing period that starts at `start`. */
export function addInterval({
  start,
  interval,
}: {
  start: Date;
  interval: PLAN_INTERVAL;
}): Date {
  const months = INTERVAL_MONTHS[interval];
  if (months) return addMonths({ date: start, months });
  return new Date(start.getTime() + (INTERVAL_DAYS[interval] ?? 30) * DAY_MS);
}

export function priceForPolicy({
  policy,
  baseAmount,
}: {
  policy: PlanPolicyInput;
  baseAmount: number;
}): number {
  const value = policy.customValue ?? 0;
  switch (policy.policy) {
    case PLAN_PRICE_POLICY.FREE:
      return 0;
    case PLAN_PRICE_POLICY.HALF:
      return roundRupees(baseAmount / 2);
    case PLAN_PRICE_POLICY.FULL:
      return baseAmount;
    case PLAN_PRICE_POLICY.CUSTOM_PERCENT:
      return Math.max(0, roundRupees(baseAmount * (1 - value / 100)));
    case PLAN_PRICE_POLICY.CUSTOM_FLAT:
      return Math.max(0, roundRupees(baseAmount - value));
    default:
      return baseAmount;
  }
}

/** Start of the IST calendar day that contains `at`, as a UTC instant. */
function istDayStart(at: Date): Date {
  const shifted = new Date(at.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MINUTES * 60 * 1000);
}

/**
 * The usage window a booking falls in. Limits are counted by the event's date,
 * not the booking date, so booking next month's run uses next month's allowance.
 * Week, month and year windows are anchored on the plan's current period start.
 */
export function usageWindowFor({
  limitPeriod,
  anchor,
  at,
}: {
  limitPeriod: PLAN_LIMIT_PERIOD;
  anchor: Date;
  at: Date;
}): UsageWindow | null {
  if (limitPeriod === PLAN_LIMIT_PERIOD.UNLIMITED) return null;
  if (limitPeriod === PLAN_LIMIT_PERIOD.TOTAL) {
    return { start: new Date(0), end: new Date(8.64e15) };
  }
  if (limitPeriod === PLAN_LIMIT_PERIOD.PER_DAY) {
    const start = istDayStart(at);
    return { start, end: new Date(start.getTime() + DAY_MS) };
  }
  const step = ({ date, forward }: { date: Date; forward: boolean }): Date => {
    const sign = forward ? 1 : -1;
    if (limitPeriod === PLAN_LIMIT_PERIOD.PER_WEEK) {
      return new Date(date.getTime() + sign * 7 * DAY_MS);
    }
    return addMonths({
      date,
      months: sign * (limitPeriod === PLAN_LIMIT_PERIOD.PER_YEAR ? 12 : 1),
    });
  };
  let start = anchor;
  while (at.getTime() < start.getTime())
    start = step({ date: start, forward: false });
  let end = step({ date: start, forward: true });
  while (at.getTime() >= end.getTime()) {
    start = end;
    end = step({ date: start, forward: true });
  }
  return { start, end };
}

export function creditsLeftFor({
  plan,
  at,
}: {
  plan: Pick<
    PricingPlanInput,
    | 'limitPeriod'
    | 'usageLimit'
    | 'creditsOverride'
    | 'currentPeriodStart'
    | 'usedEventDates'
  >;
  at: Date;
}): { left: number | null; limit: number | null } {
  const window = usageWindowFor({
    limitPeriod: plan.limitPeriod,
    anchor: plan.currentPeriodStart,
    at,
  });
  if (!window) return { left: null, limit: null };
  const limit = plan.creditsOverride ?? plan.usageLimit ?? 0;
  const used = plan.usedEventDates.filter(
    (date) =>
      date.getTime() >= window.start.getTime() &&
      date.getTime() < window.end.getTime(),
  ).length;
  return { left: Math.max(0, limit - used), limit };
}

/** Why a plan can't price this pass, or null if it can (limits are checked separately). */
function dropReason({
  plan,
  event,
}: {
  plan: PricingPlanInput;
  event: PricingEventInput;
}): string | null {
  if (!BOOKABLE_PLAN_STATUSES.includes(plan.status))
    return `Plan is ${plan.status.toLowerCase()}`;
  const endsEarly =
    plan.status === USER_PLAN_STATUS.CANCELS_AT_PERIOD_END ||
    plan.kind === PLAN_KIND.PACK;
  if (
    endsEarly &&
    event.startDate.getTime() >= plan.currentPeriodEnd.getTime()
  ) {
    return 'Plan ends before the event';
  }
  if (plan.clubId !== event.clubId && plan.clubId !== event.coHostClubId) {
    return 'Plan belongs to another club';
  }
  const isCovered = plan.coverage.some(
    (rule) =>
      rule.eventId === event.eventId ||
      (rule.eventType !== null && rule.eventType === event.eventType),
  );
  if (!isCovered) return 'Plan does not cover this event';
  if (!plan.policy) return 'No plan price set on this pass';
  return null;
}

/**
 * The checkout rule: which of a member's plans applies to a pass, and at what
 * price. Returns every step so the decision can be shown and logged.
 */
export function evaluatePlansForCategory({
  plans,
  event,
}: {
  plans: PricingPlanInput[];
  event: PricingEventInput;
}): PlanPricingResult {
  const steps: PricingStep[] = [];
  const candidates: PlanPriceCandidate[] = [];
  const drop = (plan: PricingPlanInput, reason: string) =>
    steps.push({
      userPlanId: plan.userPlanId,
      planName: plan.planName,
      isKept: false,
      reason,
    });

  for (const plan of plans) {
    const reason = dropReason({ plan, event });
    if (reason) {
      drop(plan, reason);
      continue;
    }
    const { left, limit } = creditsLeftFor({ plan, at: event.startDate });
    if (left !== null && left <= 0) {
      drop(plan, `All ${limit} bookings used for this period`);
      continue;
    }
    const price = priceForPolicy({
      policy: plan.policy!,
      baseAmount: event.baseAmount,
    });
    candidates.push({
      userPlanId: plan.userPlanId,
      planId: plan.planId,
      planName: plan.planName,
      kind: plan.kind,
      price,
      amountSaved: event.baseAmount - price,
      creditsLeft: left,
      currentPeriodEnd: plan.currentPeriodEnd,
    });
    steps.push({
      userPlanId: plan.userPlanId,
      planName: plan.planName,
      isKept: true,
      reason: `Price ${price}${left !== null ? `, ${left} of ${limit} left` : ''}`,
    });
  }

  // Lowest price wins; on a tie, a pack that expires soonest, then a limited plan before an unlimited one.
  candidates.sort(
    (a, b) =>
      a.price - b.price ||
      Number(b.kind === PLAN_KIND.PACK) - Number(a.kind === PLAN_KIND.PACK) ||
      (a.kind === PLAN_KIND.PACK && b.kind === PLAN_KIND.PACK
        ? a.currentPeriodEnd.getTime() - b.currentPeriodEnd.getTime()
        : 0) ||
      Number(a.creditsLeft === null) - Number(b.creditsLeft === null),
  );
  return { best: candidates[0] ?? null, candidates, steps };
}

/** Amount a coupon takes off one charge. `chargeIndex` is 0 for the first payment. */
export function couponDiscountFor({
  coupon,
  amount,
  chargeIndex,
}: {
  coupon: CouponChargeInput;
  amount: number;
  chargeIndex: number;
}): number {
  const applies =
    coupon.appliesTo === COUPON_APPLIES_TO.EVERY_CHARGE ||
    (coupon.appliesTo === COUPON_APPLIES_TO.FIRST_CHARGE &&
      chargeIndex === 0) ||
    (coupon.appliesTo === COUPON_APPLIES_TO.FIRST_N_CHARGES &&
      chargeIndex < (coupon.chargesCount ?? 1));
  if (!applies) return 0;
  if (coupon.offerPercentage)
    return Math.min(
      amount,
      roundRupees((amount * coupon.offerPercentage) / 100),
    );
  return Math.min(amount, coupon.flatDiscountAmount ?? 0);
}

/** IST hour of an instant. */
export function istHour(at: Date): number {
  return new Date(at.getTime() + IST_OFFSET_MINUTES * 60 * 1000).getUTCHours();
}

/** The same IST calendar day as `at`, at `hour`:00 IST. */
function atIstHour({ at, hour }: { at: Date; hour: number }): Date {
  return new Date(istDayStart(at).getTime() + hour * HOUR_MS);
}

/**
 * When each reminder goes out: each offset before the charge, moved to the
 * club's send hour on that day, never in quiet hours, and never later than the
 * minimum notice. Reminders already in the past are dropped.
 */
export function reminderSendTimes({
  dueAt,
  offsetsHours,
  sendHour,
  now,
  minHoursBefore,
}: ReminderScheduleInput): Date[] {
  const latest = dueAt.getTime() - minHoursBefore * HOUR_MS;
  const hour = Math.min(
    Math.max(sendHour, PLAN_REMINDER_QUIET_END_HOUR),
    PLAN_REMINDER_QUIET_START_HOUR - 1,
  );
  const times = new Set<number>();
  for (const offset of [...new Set([...offsetsHours, minHoursBefore])]) {
    let sendAt = atIstHour({
      at: new Date(dueAt.getTime() - offset * HOUR_MS),
      hour,
    });
    if (sendAt.getTime() > dueAt.getTime() - offset * HOUR_MS) {
      sendAt = new Date(sendAt.getTime() - DAY_MS);
    }
    if (sendAt.getTime() > latest)
      sendAt = atIstHour({ at: new Date(latest - DAY_MS), hour });
    if (sendAt.getTime() > now.getTime()) times.add(sendAt.getTime());
  }
  return [...times].sort((a, b) => a - b).map((time) => new Date(time));
}

const formatRupees = (amount: number): string =>
  `₹${Math.round(amount).toLocaleString('en-IN')}`;
const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });

export function buildReminderMessage({
  type,
  clubName,
  planName,
  amount,
  dueAt,
  manageUrl,
  fixBillingUrl,
}: ReminderMessageInput): ReminderMessage {
  const money = amount !== null ? formatRupees(amount) : '';
  const when = formatDate(dueAt);
  const lines: Record<PLAN_REMINDER_TYPE, { subject: string; body: string }> = {
    PRE_DEBIT: {
      subject: `${planName} renews on ${when}`,
      body: `${money} will be charged for your ${clubName} ${planName} on ${when} through your AutoPay mandate. To stop it, cancel before then.`,
    },
    CHARGED: {
      subject: `Payment received: ${planName}`,
      body: `We charged ${money} for your ${clubName} ${planName}. Your next renewal is on ${when}.`,
    },
    PAYMENT_FAILED: {
      subject: `Your ${planName} payment didn't go through`,
      body: `We couldn't charge ${money} for your ${clubName} ${planName}. Pay now to keep booking with your plan.`,
    },
    MANDATE_AT_RISK: {
      subject: `Update your payment method for ${planName}`,
      body: `Your AutoPay mandate won't cover the ${money} renewal on ${when}. Update it so your ${clubName} plan continues.`,
    },
    INTRO_ENDING: {
      subject: `Your intro offer ends on ${when}`,
      body: `From ${when}, your ${clubName} ${planName} renews at ${money}. You'll get another reminder before the charge.`,
    },
    PACK_EXPIRING: {
      subject: `${planName} expires on ${when}`,
      body: `Use your remaining ${clubName} runs before ${when}.`,
    },
    ACCESS_ENDING: {
      subject: `${planName} ends on ${when}`,
      body: `Your cancelled ${clubName} plan stays active until ${when}. Rejoin any time from the club page.`,
    },
    LOW_CREDITS: {
      subject: `You're almost out of runs on ${planName}`,
      body: `You have one or two bookings left this period on your ${clubName} plan.`,
    },
    PAUSE_ENDING: {
      subject: `${planName} restarts on ${when}`,
      body: `${clubName} paused your plan until ${when}. Billing restarts then at ${money}.`,
    },
  };
  const { subject, body } = lines[type];
  const link =
    type === PLAN_REMINDER_TYPE.PAYMENT_FAILED && fixBillingUrl
      ? fixBillingUrl
      : manageUrl;
  const cta =
    type === PLAN_REMINDER_TYPE.PAYMENT_FAILED ? 'Pay now' : 'Manage plan';
  return {
    subject,
    title: subject,
    body,
    html: `<p>${body}</p><p><a href="${link}">${cta}</a></p>`,
  };
}
