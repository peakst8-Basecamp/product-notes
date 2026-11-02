/**
 * Self-check for the pure membership rules. The backend has no test runner, so
 * this runs standalone: `npx ts-node scripts/check-plan-pricing.ts` (or bun).
 * Exits non-zero on the first failed check.
 */
import assert from 'node:assert/strict';

import {
  COUPON_APPLIES_TO,
  EVENT_TYPE,
  PLAN_KIND,
  PLAN_LIMIT_PERIOD,
  PLAN_PRICE_POLICY,
  USER_PLAN_STATUS,
} from '../src/generated/prisma/enums';
import { PricingPlanInput } from '../src/interfaces/membership.interface';
import {
  couponDiscountFor,
  evaluatePlansForCategory,
  istHour,
  reminderSendTimes,
} from '../src/services/helpers/planPricing.helpers';

const day = 24 * 60 * 60 * 1000;
const now = new Date('2026-11-02T03:30:00.000Z'); // 9:00 IST

const basePlan: PricingPlanInput = {
  userPlanId: 'up1',
  planId: 'p1',
  planName: 'FYF Unlimited',
  clubId: 'club1',
  kind: PLAN_KIND.MEMBERSHIP,
  status: USER_PLAN_STATUS.ACTIVE,
  coverage: [{ eventType: EVENT_TYPE.TRAINING, eventId: null }],
  limitPeriod: PLAN_LIMIT_PERIOD.UNLIMITED,
  usageLimit: null,
  creditsOverride: null,
  currentPeriodStart: now,
  currentPeriodEnd: new Date(now.getTime() + 30 * day),
  usedEventDates: [],
  policy: { policy: PLAN_PRICE_POLICY.FREE, customValue: null },
};
const saturdayRun = {
  eventId: 'e1',
  clubId: 'club1',
  coHostClubId: null,
  eventType: EVENT_TYPE.TRAINING,
  startDate: new Date(now.getTime() + 5 * day),
  baseAmount: 299,
};

// 1. A free plan prices the pass at 0.
let result = evaluatePlansForCategory({
  plans: [basePlan],
  event: saturdayRun,
});
assert.equal(result.best?.price, 0);
assert.equal(result.best?.amountSaved, 299);

// 2. No plan price on the pass means no benefit.
result = evaluatePlansForCategory({
  plans: [{ ...basePlan, policy: null }],
  event: saturdayRun,
});
assert.equal(result.best, null);

// 3. Coverage: a training plan doesn't apply to a race day.
result = evaluatePlansForCategory({
  plans: [basePlan],
  event: { ...saturdayRun, eventType: EVENT_TYPE.SINGLE_DAY },
});
assert.equal(result.best, null);

// 4. Paused and past-due plans can't be used.
for (const status of [USER_PLAN_STATUS.PAUSED, USER_PLAN_STATUS.PAST_DUE]) {
  result = evaluatePlansForCategory({
    plans: [{ ...basePlan, status }],
    event: saturdayRun,
  });
  assert.equal(result.best, null, status);
}

// 5. Limits count by event date: 8 per month, 8 already used this month.
const eightAMonth: PricingPlanInput = {
  ...basePlan,
  userPlanId: 'up2',
  limitPeriod: PLAN_LIMIT_PERIOD.PER_MONTH,
  usageLimit: 8,
  usedEventDates: Array.from(
    { length: 8 },
    (_, index) => new Date(now.getTime() + index * day),
  ),
};
result = evaluatePlansForCategory({ plans: [eightAMonth], event: saturdayRun });
assert.equal(result.best, null);
// ...but a run next month uses next month's allowance.
result = evaluatePlansForCategory({
  plans: [eightAMonth],
  event: { ...saturdayRun, startDate: new Date(now.getTime() + 35 * day) },
});
assert.equal(result.best?.creditsLeft, 8);

// 6. Lowest price wins; a pack wins a tie over an unlimited membership.
const pack: PricingPlanInput = {
  ...basePlan,
  userPlanId: 'up3',
  planName: '10-Run Pack',
  kind: PLAN_KIND.PACK,
  limitPeriod: PLAN_LIMIT_PERIOD.TOTAL,
  usageLimit: 10,
};
result = evaluatePlansForCategory({
  plans: [basePlan, pack],
  event: saturdayRun,
});
assert.equal(result.best?.userPlanId, 'up3');
const half: PricingPlanInput = {
  ...basePlan,
  userPlanId: 'up4',
  policy: { policy: PLAN_PRICE_POLICY.HALF, customValue: null },
};
result = evaluatePlansForCategory({
  plans: [half, basePlan],
  event: saturdayRun,
});
assert.equal(result.best?.userPlanId, 'up1');

// 7. A cancelled plan works until its period ends, not after.
result = evaluatePlansForCategory({
  plans: [{ ...basePlan, status: USER_PLAN_STATUS.CANCELS_AT_PERIOD_END }],
  event: { ...saturdayRun, startDate: new Date(now.getTime() + 40 * day) },
});
assert.equal(result.best, null);

// 8. Coupons: first charge only vs every charge.
const firstOnly = {
  offerPercentage: 20,
  flatDiscountAmount: null,
  appliesTo: COUPON_APPLIES_TO.FIRST_CHARGE,
  chargesCount: null,
};
assert.equal(
  couponDiscountFor({ coupon: firstOnly, amount: 1499, chargeIndex: 0 }),
  300,
);
assert.equal(
  couponDiscountFor({ coupon: firstOnly, amount: 1499, chargeIndex: 1 }),
  0,
);
const student = {
  offerPercentage: null,
  flatDiscountAmount: 300,
  appliesTo: COUPON_APPLIES_TO.EVERY_CHARGE,
  chargesCount: null,
};
assert.equal(
  couponDiscountFor({ coupon: student, amount: 1499, chargeIndex: 5 }),
  300,
);

// 9. Reminders: 3 days and 1 day before, at 9 AM IST, the last at least 24 h before the charge.
const dueAt = new Date('2026-12-02T03:30:00.000Z'); // 2 Dec, 9:00 IST
const times = reminderSendTimes({
  dueAt,
  offsetsHours: [72, 24],
  sendHour: 9,
  now,
  minHoursBefore: 24,
});
assert.equal(times.length, 2);
for (const time of times) {
  assert.equal(istHour(time), 9);
  assert.ok(dueAt.getTime() - time.getTime() >= 24 * 60 * 60 * 1000);
}
// A send hour in quiet hours is moved inside allowed hours.
const late = reminderSendTimes({
  dueAt,
  offsetsHours: [24],
  sendHour: 23,
  now,
  minHoursBefore: 24,
});
assert.ok(istHour(late[0]) < 21 && istHour(late[0]) >= 8);

console.log('check-plan-pricing: all checks passed');
