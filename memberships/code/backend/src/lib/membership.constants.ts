// Memberships constants. Export from src/lib/index.ts (or merge into constants.ts).

/** Reminders are sent in IST; the fixed offset avoids a timezone library. */
export const IST_OFFSET_MINUTES = 330;

/** Never send a reminder between these IST hours (inclusive start, exclusive end). */
export const PLAN_REMINDER_QUIET_START_HOUR = 21;
export const PLAN_REMINDER_QUIET_END_HOUR = 8;

/** RBI e-mandate rule: a pre-debit notice at least 24 hours before each charge. */
export const PLAN_PRE_DEBIT_MIN_HOURS = 24;

export const PLAN_REMINDER_DEFAULT_OFFSETS_HOURS = [72, 24];
export const PLAN_REMINDER_DEFAULT_YEARLY_OFFSETS_HOURS = [168, 24];
export const PLAN_REMINDER_DEFAULT_SEND_HOUR = 9;
export const PLAN_REMINDER_SWEEP_BATCH = 200;
export const PLAN_REMINDER_MAX_ATTEMPTS = 3;

export const PLAN_REMINDER_SWEEP_QUEUE_NAME = 'plan-reminder-sweep';
export const PLAN_REMINDER_SWEEP_JOB_NAME = 'plan-reminder-sweep';
export const PLAN_REMINDER_SWEEP_SCHEDULER_ID = 'plan-reminder-sweep-scheduler';
export const PLAN_REMINDER_SWEEP_INTERVAL_MS = 15 * 60 * 1000;

/** A plan checkout left unpaid this long is abandoned and frees its capacity. */
export const PLAN_PENDING_PAYMENT_TTL_MS = 30 * 60 * 1000;

export const PLAN_DEFAULT_CREDIT_RELEASE_HOURS = 12;

export const PLAN_HISTORY = {
  JOINED: 'JOINED',
  ACTIVATED: 'ACTIVATED',
  RENEWED: 'RENEWED',
  RENEWAL_FAILED: 'RENEWAL_FAILED',
  PAUSED: 'PAUSED',
  RESUMED: 'RESUMED',
  CANCEL_REQUESTED: 'CANCEL_REQUESTED',
  CANCELLED: 'CANCELLED',
  ENDED: 'ENDED',
  CREDITS_CHANGED: 'CREDITS_CHANGED',
  GUEST_PASS_SENT: 'GUEST_PASS_SENT',
} as const;
