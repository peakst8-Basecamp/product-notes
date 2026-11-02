import { z } from 'zod';

import {
  COUPON_APPLIES_TO,
  EVENT_TYPE,
  PERK_CATEGORY,
  PERK_VISIBILITY,
  PLAN_BILLING_TYPE,
  PLAN_CANCELLATION_POLICY,
  PLAN_INTERVAL,
  PLAN_KIND,
  PLAN_LIMIT_PERIOD,
  PLAN_PRICE_POLICY,
  PLAN_REMINDER_TYPE,
  PLAN_VALIDITY,
  USER_PLAN_STATUS,
} from '../generated/prisma/enums';
import { requiredString } from './common.dto';

export const idParamsDto = z.object({ id: requiredString }).strip();
export const clubParamsDto = z.object({ clubId: requiredString }).strip();

const policyDto = z
  .object({
    policy: z.nativeEnum(PLAN_PRICE_POLICY),
    customValue: z.coerce.number().min(0).nullable().default(null),
  })
  .strip()
  .refine(
    ({ policy, customValue }) =>
      !(
        policy === PLAN_PRICE_POLICY.CUSTOM_PERCENT ||
        policy === PLAN_PRICE_POLICY.CUSTOM_FLAT
      ) || customValue !== null,
    { message: 'Custom plan prices need a value', path: ['customValue'] },
  );

const coverageDto = z
  .object({
    eventType: z.nativeEnum(EVENT_TYPE).nullable().default(null),
    eventId: requiredString.nullable().default(null),
  })
  .strip()
  .refine(
    ({ eventType, eventId }) => (eventType === null) !== (eventId === null),
    {
      message: 'Cover an event type or one event, not both',
    },
  );

const priceDto = z
  .object({
    label: requiredString.optional(),
    amount: z.coerce.number().min(0),
    isAmountInclusiveGST: z.boolean().optional(),
    billingType: z.nativeEnum(PLAN_BILLING_TYPE),
    interval: z.nativeEnum(PLAN_INTERVAL).optional(),
    validity: z.nativeEnum(PLAN_VALIDITY).optional(),
    validityDays: z.coerce.number().int().positive().optional(),
    validUntil: z.coerce.date().optional(),
    joiningFee: z.coerce.number().min(0).optional(),
    introOffer: z
      .object({
        amount: z.coerce.number().min(0),
        durationDays: z.coerce.number().int().positive(),
      })
      .strip()
      .optional(),
  })
  .strip()
  .refine(
    ({ billingType, interval, validity }) =>
      billingType === PLAN_BILLING_TYPE.RECURRING
        ? interval !== undefined
        : validity !== undefined,
    {
      message:
        'Recurring prices need an interval; one-time prices need a validity',
    },
  );

export const createPlanBodyDto = z
  .object({
    kind: z.nativeEnum(PLAN_KIND),
    name: requiredString,
    description: requiredString,
    coverImage: requiredString.optional(),
    coverage: z.array(coverageDto).min(1),
    limitPeriod: z.nativeEnum(PLAN_LIMIT_PERIOD),
    usageLimit: z.coerce.number().int().positive().optional(),
    rollOverUnused: z.boolean().optional(),
    prices: z.array(priceDto).min(1),
    isApprovalRequired: z.boolean().optional(),
    isFirstTimeOnly: z.boolean().optional(),
    isOnePerMember: z.boolean().optional(),
    capacity: z.coerce.number().int().positive().optional(),
    isUnlisted: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    guestPassesPerCycle: z.coerce.number().int().min(0).optional(),
    earlyAccessHours: z.coerce.number().int().min(0).optional(),
    allowDiscountCodes: z.boolean().optional(),
    cancellationPolicy: z.nativeEnum(PLAN_CANCELLATION_POLICY).optional(),
    minCommitmentCycles: z.coerce.number().int().positive().optional(),
    whatsappGroupInviteUrl: z.url().optional(),
    applyPolicyToExisting: policyDto.optional(),
    isPublished: z.boolean().optional(),
  })
  .strip();

export const updatePlanBodyDto = z
  .object({
    name: requiredString.optional(),
    description: requiredString.optional(),
    isPublished: z.boolean().optional(),
    isUnlisted: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    isApprovalRequired: z.boolean().optional(),
    capacity: z.coerce.number().int().positive().nullable().optional(),
    guestPassesPerCycle: z.coerce.number().int().min(0).nullable().optional(),
    earlyAccessHours: z.coerce.number().int().min(0).nullable().optional(),
    allowDiscountCodes: z.boolean().optional(),
    cancellationPolicy: z.nativeEnum(PLAN_CANCELLATION_POLICY).optional(),
  })
  .strip();

export const setCategoryPoliciesBodyDto = z
  .object({
    policies: z.array(
      z
        .object({ planId: requiredString, policy: policyDto.nullable() })
        .strip(),
    ),
  })
  .strip();

export const joinPlanBodyDto = z
  .object({
    planPriceId: requiredString,
    useIntroOffer: z.boolean().default(false),
    couponCode: requiredString.optional(),
  })
  .strip();

export const eligiblePlansQueryDto = z
  .object({ eventId: requiredString, categoryId: requiredString })
  .strip();

export const cancelPlanBodyDto = z
  .object({ reason: z.string().trim().max(500).optional() })
  .strip();

export const holdersQueryDto = z
  .object({ status: z.nativeEnum(USER_PLAN_STATUS).optional() })
  .strip();

export const pausePlanBodyDto = z
  .object({ pauseUntil: z.coerce.date().optional() })
  .strip();

export const endPlanBodyDto = z
  .object({ isImmediate: z.boolean().default(false) })
  .strip();

export const setCreditsBodyDto = z
  .object({ credits: z.coerce.number().int().min(0) })
  .strip();

export const reviewRequestBodyDto = z
  .object({ isApproved: z.boolean() })
  .strip();

export const membershipSettingsBodyDto = z
  .object({
    plansVisibleTo: z.enum(['EVERYONE', 'CLUB_MEMBERS']).optional(),
    reminderOffsetsHours: z
      .array(z.coerce.number().int().min(24).max(720))
      .max(4)
      .optional(),
    yearlyReminderHours: z
      .array(z.coerce.number().int().min(24).max(720))
      .max(4)
      .optional(),
    reminderSendHour: z.coerce.number().int().min(8).max(20).optional(),
    pushEnabled: z.boolean().optional(),
    optionalReminders: z.array(z.nativeEnum(PLAN_REMINDER_TYPE)).optional(),
    creditReleaseHours: z.coerce.number().int().min(0).max(168).optional(),
    lateCancelUsesCredit: z.boolean().optional(),
    failedPaymentGraceDays: z.coerce.number().int().min(0).max(30).optional(),
    refundPolicyText: z.string().trim().max(2000).nullable().optional(),
    seePlansBannerText: z.string().trim().max(120).nullable().optional(),
  })
  .strip();

export const createPerkBodyDto = z
  .object({
    partnerName: requiredString,
    category: z.nativeEnum(PERK_CATEGORY),
    visibility: z.nativeEnum(PERK_VISIBILITY).default(PERK_VISIBILITY.TEASER),
    offer: requiredString,
    redeemHow: requiredString.optional(),
    code: requiredString.optional(),
    logo: z.url().optional(),
    planIds: z.array(requiredString).min(1),
  })
  .strip();

export const setPerkActiveBodyDto = z.object({ isActive: z.boolean() }).strip();

export const createPlanCouponBodyDto = z
  .object({
    couponCode: requiredString.max(32),
    offerPercentage: z.coerce.number().positive().max(100).optional(),
    flatDiscountAmount: z.coerce.number().positive().optional(),
    planIds: z.array(requiredString).min(1),
    appliesTo: z
      .nativeEnum(COUPON_APPLIES_TO)
      .default(COUPON_APPLIES_TO.FIRST_CHARGE),
    chargesCount: z.coerce.number().int().positive().optional(),
    totalUsageLimit: z.coerce.number().int().positive().optional(),
    expireAt: z.coerce.date().optional(),
  })
  .strip()
  .refine(
    ({ offerPercentage, flatDiscountAmount }) =>
      (offerPercentage === undefined) !== (flatDiscountAmount === undefined),
    { message: 'Provide exactly one of offerPercentage or flatDiscountAmount' },
  );
