/**
 * The renewal-reminder sweep, in the same shape as the schedules in
 * cron.infra.ts (merge it there when this ships). Every 15 minutes it ends
 * lapsed plans and sends due reminders. Scheduled in production only, like the
 * others: a dev instance would message real members.
 */
import { Queue, Worker } from 'bullmq';

import { env } from '../config/env';
import { logger } from '../lib';
import {
  PLAN_REMINDER_SWEEP_INTERVAL_MS,
  PLAN_REMINDER_SWEEP_JOB_NAME,
  PLAN_REMINDER_SWEEP_QUEUE_NAME,
  PLAN_REMINDER_SWEEP_SCHEDULER_ID,
} from '../lib/membership.constants';
import { PlanReminderSweepJobData } from '../interfaces/membership.interface';
import { membershipBillingService } from '../services/membershipBilling.service';
import { planReminderService } from '../services/planReminder.service';
import { createRedisConnection } from './redis.infra';

const isProduction = env.NODE_ENV === 'production';
const connection = createRedisConnection({
  infrastructureName: 'PlanReminderCron',
});

const planReminderSweepQueue = new Queue<PlanReminderSweepJobData>(
  PLAN_REMINDER_SWEEP_QUEUE_NAME,
  { connection },
);

async function ensurePlanReminderSweepSchedule(): Promise<void> {
  await planReminderSweepQueue.upsertJobScheduler(
    PLAN_REMINDER_SWEEP_SCHEDULER_ID,
    { every: PLAN_REMINDER_SWEEP_INTERVAL_MS },
    {
      name: PLAN_REMINDER_SWEEP_JOB_NAME,
      data: { triggeredAt: new Date().toISOString() },
      opts: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 30_000 },
        removeOnComplete: true,
      },
    },
  );
}

if (isProduction) {
  void ensurePlanReminderSweepSchedule().catch((error) => {
    logger.error(
      { error },
      'Failed to register the plan reminder sweep schedule',
    );
  });
}

// Concurrency 1: two sweeps side by side could send the same reminder twice.
export const planReminderSweepWorker = new Worker<PlanReminderSweepJobData>(
  PLAN_REMINDER_SWEEP_QUEUE_NAME,
  async () => {
    const lapsed = await membershipBillingService.endLapsedPlans();
    const reminders = await planReminderService.sweepDue();
    logger.info({ ...lapsed, ...reminders }, 'Plan reminder sweep finished');
  },
  { connection, concurrency: 1 },
);
