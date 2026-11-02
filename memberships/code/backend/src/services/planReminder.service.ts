/**
 * Renewal reminders: the launch prerequisite for memberships.
 *
 * Rows in plan_reminder_delivery are the durable record. `scheduleForUserPlan`
 * (re)builds the upcoming rows whenever a plan's billing changes; the cron sweep
 * sends whatever is due; `sendNow` covers notices tied to an event (charged,
 * payment failed, mandate at risk). One row per plan, type, channel and charge,
 * so a retried webhook or sweep never sends twice.
 */
import { env } from '../config/env';
import { ClubMembershipSettings, Prisma } from '../generated/prisma/client';
import {
  NOTIFICATION_CHANNEL,
  PLAN_BILLING_TYPE,
  PLAN_INTERVAL,
  PLAN_REMINDER_STATUS,
  PLAN_REMINDER_TYPE,
  USER_PLAN_STATUS,
} from '../generated/prisma/enums';
import { logger } from '../lib';
import {
  PLAN_PRE_DEBIT_MIN_HOURS,
  PLAN_REMINDER_DEFAULT_OFFSETS_HOURS,
  PLAN_REMINDER_DEFAULT_SEND_HOUR,
  PLAN_REMINDER_DEFAULT_YEARLY_OFFSETS_HOURS,
  PLAN_REMINDER_MAX_ATTEMPTS,
  PLAN_REMINDER_SWEEP_BATCH,
} from '../lib/membership.constants';
import {
  dueReminderSelect,
  membershipRepository,
} from '../repositories/membership.repository';
import { prisma } from '..';
import {
  buildReminderMessage,
  couponDiscountFor,
  reminderSendTimes,
} from './helpers/planPricing.helpers';
import { sendEmailViaQueue } from './outboundEmail.service';
import { pushNotificationService } from './pushNotification.service';

const PUSH_CHANNEL = 'PUSH';
const LONG_INTERVALS: PLAN_INTERVAL[] = [
  PLAN_INTERVAL.QUARTERLY,
  PLAN_INTERVAL.HALF_YEARLY,
  PLAN_INTERVAL.YEARLY,
];
/** Notices members can't mute: they are required for e-mandates or protect the member. */
const MANDATORY_TYPES: PLAN_REMINDER_TYPE[] = [
  PLAN_REMINDER_TYPE.PRE_DEBIT,
  PLAN_REMINDER_TYPE.CHARGED,
  PLAN_REMINDER_TYPE.PAYMENT_FAILED,
  PLAN_REMINDER_TYPE.MANDATE_AT_RISK,
  PLAN_REMINDER_TYPE.INTRO_ENDING,
];

const manageUrl = (userPlanId: string): string =>
  `${env.FRONT_END_BASE_URL}/passes/plans/${userPlanId}`;

interface ReminderRow {
  type: PLAN_REMINDER_TYPE;
  scheduledFor: Date;
  dueAt: Date;
  amount: number | null;
}

async function channelsForClub({
  clubId,
}: {
  clubId: string;
}): Promise<string[]> {
  const settings = await membershipRepository.findSettings({ clubId });
  const channels: string[] = settings?.reminderChannels.length
    ? [...settings.reminderChannels]
    : [NOTIFICATION_CHANNEL.EMAIL];
  // Email is always sent: it is the member's written record of the notice.
  if (!channels.includes(NOTIFICATION_CHANNEL.EMAIL))
    channels.push(NOTIFICATION_CHANNEL.EMAIL);
  if (settings?.pushEnabled ?? true) channels.push(PUSH_CHANNEL);
  return channels;
}

async function deliver({
  channel,
  userId,
  email,
  subject,
  title,
  body,
  html,
  url,
}: {
  channel: string;
  userId: string;
  email: string;
  subject: string;
  title: string;
  body: string;
  html: string;
  url: string;
}): Promise<void> {
  if (channel === NOTIFICATION_CHANNEL.EMAIL) {
    await sendEmailViaQueue({ to: email, subject, htmlTemplate: html });
    return;
  }
  if (channel === PUSH_CHANNEL) {
    await pushNotificationService.queuePushNotification({
      userId,
      title,
      body,
      url,
    });
    return;
  }
  // WhatsApp needs an approved Meta template per reminder type and uses the
  // club's credits (WhatsappCreditAccount). Wire it to whatsappCampaign's sender
  // once the templates are approved.
  throw new Error('WhatsApp plan reminders need approved templates');
}

type DueReminder = Prisma.PlanReminderDeliveryGetPayload<{
  select: typeof dueReminderSelect;
}>;

async function recordFailure({
  reminder,
  error,
}: {
  reminder: DueReminder;
  error: unknown;
}) {
  const attemptCount = reminder.attemptCount + 1;
  const isFinal = attemptCount >= PLAN_REMINDER_MAX_ATTEMPTS;
  await prisma.planReminderDelivery.update({
    where: { id: reminder.id },
    data: {
      attemptCount,
      errorMessage: error instanceof Error ? error.message : String(error),
      status: isFinal
        ? PLAN_REMINDER_STATUS.FAILED
        : PLAN_REMINDER_STATUS.SCHEDULED,
    },
  });
  if (isFinal && MANDATORY_TYPES.includes(reminder.type)) {
    logger.error(
      {
        reminderId: reminder.id,
        type: reminder.type,
        channel: reminder.channel,
      },
      'Mandatory plan reminder could not be delivered',
    );
  }
}

async function sendOneReminder(
  reminder: DueReminder,
): Promise<'SENT' | 'FAILED' | 'SKIPPED'> {
  const { userPlan } = reminder;
  // A pre-debit notice for a plan that is no longer renewing is moot.
  if (
    reminder.type === PLAN_REMINDER_TYPE.PRE_DEBIT &&
    userPlan.status !== USER_PLAN_STATUS.ACTIVE
  ) {
    await prisma.planReminderDelivery.update({
      where: { id: reminder.id },
      data: { status: PLAN_REMINDER_STATUS.CANCELLED },
    });
    return 'SKIPPED';
  }
  const message = buildReminderMessage({
    type: reminder.type,
    clubName: userPlan.plan.club.name,
    planName: userPlan.plan.name,
    amount: reminder.amount,
    dueAt: reminder.dueAt,
    manageUrl: manageUrl(userPlan.id),
    fixBillingUrl: `${env.FRONT_END_BASE_URL}/fix-billing/${userPlan.id}`,
  });
  try {
    await deliver({
      channel: reminder.channel,
      userId: userPlan.user.id,
      email: userPlan.user.email,
      url: manageUrl(userPlan.id),
      ...message,
    });
  } catch (error) {
    await recordFailure({ reminder, error });
    return 'FAILED';
  }
  await prisma.planReminderDelivery.update({
    where: { id: reminder.id },
    data: {
      status: PLAN_REMINDER_STATUS.SENT,
      sentAt: new Date(),
      attemptCount: { increment: 1 },
    },
  });
  return 'SENT';
}

type ScheduledUserPlan = Prisma.UserPlanGetPayload<{
  select: typeof scheduledUserPlanSelect;
}>;
type MembershipSettingsRecord = ClubMembershipSettings | null;

const scheduledUserPlanSelect = {
  id: true,
  status: true,
  currentPeriodEnd: true,
  currentPeriodStart: true,
  startedAt: true,
  introOfferId: true,
  priceOverride: true,
  planPrice: { select: { amount: true, billingType: true, interval: true } },
  plan: { select: { clubId: true } },
  couponId: true,
} satisfies Prisma.UserPlanSelect;

/** The next renewal amount: the price (or the host's override) less any code that applies to it. */
async function renewalAmountFor({
  userPlanId,
  userPlan,
}: {
  userPlanId: string;
  userPlan: ScheduledUserPlan;
}): Promise<number> {
  const amount = userPlan.priceOverride ?? userPlan.planPrice.amount;
  if (!userPlan.couponId) return amount;
  const link = await prisma.couponToPlan.findFirst({
    where: { couponId: userPlan.couponId },
    select: {
      appliesTo: true,
      chargesCount: true,
      coupon: { select: { offerPercentage: true, flatDiscountAmount: true } },
    },
  });
  if (!link) return amount;
  const chargeIndex = await prisma.planCharge.count({
    where: { userPlanId, status: 'SUCCESS' },
  });
  return (
    amount -
    couponDiscountFor({
      coupon: {
        ...link.coupon,
        appliesTo: link.appliesTo,
        chargesCount: link.chargesCount,
      },
      amount,
      chargeIndex,
    })
  );
}

function preDebitRows({
  userPlan,
  settings,
  dueAt,
  sendHour,
  now,
  amount,
}: {
  userPlan: ScheduledUserPlan;
  settings: MembershipSettingsRecord;
  dueAt: Date;
  sendHour: number;
  now: Date;
  amount: number;
}): ReminderRow[] {
  const { interval } = userPlan.planPrice;
  const isLong = interval !== null && LONG_INTERVALS.includes(interval);
  const offsets = isLong
    ? (settings?.yearlyReminderHours ??
      PLAN_REMINDER_DEFAULT_YEARLY_OFFSETS_HOURS)
    : (settings?.reminderOffsetsHours ?? PLAN_REMINDER_DEFAULT_OFFSETS_HOURS);
  const timing = {
    dueAt,
    sendHour,
    now,
    minHoursBefore: PLAN_PRE_DEBIT_MIN_HOURS,
  };
  const rows: ReminderRow[] = reminderSendTimes({
    ...timing,
    offsetsHours: offsets,
  }).map((scheduledFor) => ({
    type: PLAN_REMINDER_TYPE.PRE_DEBIT,
    scheduledFor,
    dueAt,
    amount,
  }));
  const isFirstPeriod =
    userPlan.startedAt?.getTime() === userPlan.currentPeriodStart?.getTime();
  if (userPlan.introOfferId && isFirstPeriod) {
    const [introNotice] = reminderSendTimes({ ...timing, offsetsHours: [72] });
    if (introNotice) {
      rows.push({
        type: PLAN_REMINDER_TYPE.INTRO_ENDING,
        scheduledFor: introNotice,
        dueAt,
        amount,
      });
    }
  }
  return rows;
}

/** Optional notices before a pack expires or a cancelled plan ends, if the club has them on. */
function endingRows({
  userPlan,
  settings,
  isRecurring,
  dueAt,
  sendHour,
  now,
}: {
  userPlan: ScheduledUserPlan;
  settings: MembershipSettingsRecord;
  isRecurring: boolean;
  dueAt: Date;
  sendHour: number;
  now: Date;
}): ReminderRow[] {
  const optional = settings?.optionalReminders ?? [
    PLAN_REMINDER_TYPE.PACK_EXPIRING,
    PLAN_REMINDER_TYPE.ACCESS_ENDING,
  ];
  let type: PLAN_REMINDER_TYPE | null = null;
  if (!isRecurring) type = PLAN_REMINDER_TYPE.PACK_EXPIRING;
  else if (userPlan.status === USER_PLAN_STATUS.CANCELS_AT_PERIOD_END)
    type = PLAN_REMINDER_TYPE.ACCESS_ENDING;
  if (!type || !optional.includes(type)) return [];
  const offsetsHours =
    type === PLAN_REMINDER_TYPE.PACK_EXPIRING ? [168, 24] : [72];
  return reminderSendTimes({
    dueAt,
    offsetsHours,
    sendHour,
    now,
    minHoursBefore: 24,
  }).map((scheduledFor) => ({ type: type, scheduledFor, dueAt, amount: null }));
}

export const planReminderService = {
  /**
   * Rebuilds the upcoming reminders for a plan. Call after activation, renewal,
   * pause, resume, billing-date or price change, and cancellation.
   */
  async scheduleForUserPlan({
    userPlanId,
  }: {
    userPlanId: string;
  }): Promise<number> {
    const userPlan = await prisma.userPlan.findUnique({
      where: { id: userPlanId },
      select: scheduledUserPlanSelect,
    });
    if (!userPlan?.currentPeriodEnd) return 0;

    const settings = await membershipRepository.findSettings({
      clubId: userPlan.plan.clubId,
    });
    const now = new Date();
    const dueAt = userPlan.currentPeriodEnd;
    const sendHour =
      settings?.reminderSendHour ?? PLAN_REMINDER_DEFAULT_SEND_HOUR;
    const isRecurring =
      userPlan.planPrice.billingType === PLAN_BILLING_TYPE.RECURRING;
    const rows: ReminderRow[] = [];

    if (isRecurring && userPlan.status === USER_PLAN_STATUS.ACTIVE) {
      const amount = await renewalAmountFor({ userPlanId, userPlan });
      rows.push(
        ...preDebitRows({ userPlan, settings, dueAt, sendHour, now, amount }),
      );
    }
    rows.push(
      ...endingRows({ userPlan, settings, isRecurring, dueAt, sendHour, now }),
    );

    const channels = await channelsForClub({ clubId: userPlan.plan.clubId });
    await prisma.$transaction(async (tx) => {
      await membershipRepository.cancelScheduledReminders({ tx, userPlanId });
      if (rows.length === 0) return;
      // The unique key includes dueAt, so a reminder already sent for this
      // charge (status SENT) is kept and never duplicated.
      await tx.planReminderDelivery.createMany({
        data: rows.flatMap((row) =>
          channels.map((channel) => ({ userPlanId, channel, ...row })),
        ),
        skipDuplicates: true,
      });
      await tx.planReminderDelivery.updateMany({
        where: {
          userPlanId,
          status: PLAN_REMINDER_STATUS.CANCELLED,
          dueAt,
          type: { in: rows.map((row) => row.type) },
        },
        data: { status: PLAN_REMINDER_STATUS.SCHEDULED },
      });
    });
    return rows.length * channels.length;
  },

  /** Records and sends an event notice (charged, payment failed, mandate at risk) right away. */
  async sendNow({
    userPlanId,
    type,
    dueAt,
    amount,
  }: {
    userPlanId: string;
    type: PLAN_REMINDER_TYPE;
    dueAt: Date;
    amount: number | null;
  }): Promise<void> {
    const userPlan = await prisma.userPlan.findUnique({
      where: { id: userPlanId },
      select: { plan: { select: { clubId: true } } },
    });
    if (!userPlan) return;
    const channels = await channelsForClub({ clubId: userPlan.plan.clubId });
    await prisma.planReminderDelivery.createMany({
      data: channels.map((channel) => ({
        userPlanId,
        type,
        channel,
        dueAt,
        amount,
        scheduledFor: new Date(),
      })),
      skipDuplicates: true,
    });
    await planReminderService.sweepDue();
  },

  /** Sends every reminder that is due. Run by the cron every 15 minutes. */
  async sweepDue(): Promise<{ sent: number; failed: number }> {
    const due = await membershipRepository.findDueReminders({
      now: new Date(),
      take: PLAN_REMINDER_SWEEP_BATCH,
    });
    let sent = 0;
    let failed = 0;
    for (const reminder of due) {
      const outcome = await sendOneReminder(reminder);
      if (outcome === 'SENT') sent += 1;
      if (outcome === 'FAILED') failed += 1;
    }
    return { sent, failed };
  },
};
