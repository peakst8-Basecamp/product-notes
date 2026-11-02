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

/* ---------- Pricing rule (pure, see services/helpers/planPricing.helpers.ts) ---------- */

export interface PlanPolicyInput {
  policy: PLAN_PRICE_POLICY;
  customValue: number | null;
}

export interface PricingCoverageInput {
  eventType: EVENT_TYPE | null;
  eventId: string | null;
}

export interface PricingPlanInput {
  userPlanId: string;
  planId: string;
  planName: string;
  clubId: string;
  kind: PLAN_KIND;
  status: USER_PLAN_STATUS;
  coverage: PricingCoverageInput[];
  limitPeriod: PLAN_LIMIT_PERIOD;
  usageLimit: number | null;
  creditsOverride: number | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  /** Event dates of the plan's usages that were not released. */
  usedEventDates: Date[];
  /** The plan price on the category being booked; null means no benefit. */
  policy: PlanPolicyInput | null;
}

export interface PricingEventInput {
  eventId: string;
  clubId: string;
  coHostClubId: string | null;
  eventType: EVENT_TYPE;
  startDate: Date;
  baseAmount: number;
}

export interface PlanPriceCandidate {
  userPlanId: string;
  planId: string;
  planName: string;
  kind: PLAN_KIND;
  price: number;
  amountSaved: number;
  creditsLeft: number | null;
  currentPeriodEnd: Date;
}

export interface PricingStep {
  userPlanId: string;
  planName: string;
  isKept: boolean;
  reason: string;
}

export interface PlanPricingResult {
  best: PlanPriceCandidate | null;
  candidates: PlanPriceCandidate[];
  steps: PricingStep[];
}

export interface UsageWindow {
  start: Date;
  end: Date;
}

export interface CouponChargeInput {
  offerPercentage: number | null;
  flatDiscountAmount: number | null;
  appliesTo: COUPON_APPLIES_TO;
  chargesCount: number | null;
}

export interface ReminderScheduleInput {
  dueAt: Date;
  offsetsHours: number[];
  sendHour: number;
  now: Date;
  /** Pre-debit notices must land at least this many hours before dueAt. */
  minHoursBefore: number;
}

export interface ReminderMessageInput {
  type: PLAN_REMINDER_TYPE;
  clubName: string;
  planName: string;
  amount: number | null;
  dueAt: Date;
  manageUrl: string;
  fixBillingUrl?: string;
}

export interface ReminderMessage {
  subject: string;
  title: string;
  body: string;
  html: string;
}

/* ---------- Service contracts ---------- */

export interface PlanPriceInput {
  label?: string;
  amount: number;
  isAmountInclusiveGST?: boolean;
  billingType: PLAN_BILLING_TYPE;
  interval?: PLAN_INTERVAL;
  validity?: PLAN_VALIDITY;
  validityDays?: number;
  validUntil?: Date;
  joiningFee?: number;
  introOffer?: { amount: number; durationDays: number };
}

export interface CreatePlanParams {
  userId: string;
  clubId: string;
  kind: PLAN_KIND;
  name: string;
  description: string;
  coverImage?: string;
  coverage: PricingCoverageInput[];
  limitPeriod: PLAN_LIMIT_PERIOD;
  usageLimit?: number;
  rollOverUnused?: boolean;
  prices: PlanPriceInput[];
  isApprovalRequired?: boolean;
  isFirstTimeOnly?: boolean;
  isOnePerMember?: boolean;
  capacity?: number;
  isUnlisted?: boolean;
  isFeatured?: boolean;
  guestPassesPerCycle?: number;
  earlyAccessHours?: number;
  allowDiscountCodes?: boolean;
  cancellationPolicy?: PLAN_CANCELLATION_POLICY;
  minCommitmentCycles?: number;
  whatsappGroupInviteUrl?: string;
  /** Sets this plan price on every covered upcoming pass. */
  applyPolicyToExisting?: PlanPolicyInput;
  isPublished?: boolean;
}

export interface UpdatePlanParams {
  userId: string;
  planId: string;
  name?: string;
  description?: string;
  isPublished?: boolean;
  isUnlisted?: boolean;
  isFeatured?: boolean;
  isArchived?: boolean;
  isApprovalRequired?: boolean;
  capacity?: number | null;
  guestPassesPerCycle?: number | null;
  earlyAccessHours?: number | null;
  allowDiscountCodes?: boolean;
  cancellationPolicy?: PLAN_CANCELLATION_POLICY;
}

export interface SetCategoryPoliciesParams {
  userId: string;
  categoryId: string;
  policies: { planId: string; policy: PlanPolicyInput | null }[];
}

export interface JoinPlanParams {
  userId: string;
  planId: string;
  planPriceId: string;
  useIntroOffer: boolean;
  couponCode?: string;
}

export type PlanCheckout =
  | { kind: 'SUBSCRIPTION'; subscriptionId: string; amountToday: number }
  | { kind: 'ORDER'; orderId: string; amountToday: number }
  | { kind: 'FREE' };

export interface JoinPlanResult {
  userPlanId: string | null;
  joinRequestId: string | null;
  status: USER_PLAN_STATUS | 'PENDING_APPROVAL';
  checkout: PlanCheckout | null;
}

export interface MyPlanSummary {
  userPlanId: string;
  planId: string;
  planName: string;
  clubId: string;
  clubName: string;
  kind: PLAN_KIND;
  status: USER_PLAN_STATUS;
  currentPeriodEnd: Date | null;
  nextChargeAmount: number | null;
  creditsLeft: number | null;
  creditsLimit: number | null;
  savedThisPeriod: number;
  savedTotal: number;
  guestPassesLeft: number;
  earlyAccessHours: number | null;
  perkCount: number;
}

export interface ApplyPlanParams {
  userId: string;
  eventId: string;
  categoryId: string;
}

export interface ClubPerkListItem {
  id: string;
  partnerName: string;
  category: PERK_CATEGORY;
  offer: string;
  redeemHow: string | null;
  logo: string | null;
  isUnlocked: boolean;
  unlockingPlanNames: string[];
}

export interface CreatePerkParams {
  userId: string;
  clubId: string;
  partnerName: string;
  category: PERK_CATEGORY;
  visibility: PERK_VISIBILITY;
  offer: string;
  redeemHow?: string;
  code?: string;
  logo?: string;
  planIds: string[];
}

export interface CreatePlanCouponParams {
  userId: string;
  clubId: string;
  couponCode: string;
  offerPercentage?: number;
  flatDiscountAmount?: number;
  planIds: string[];
  appliesTo: COUPON_APPLIES_TO;
  chargesCount?: number;
  totalUsageLimit?: number;
  expireAt?: Date;
}

export interface UpsertMembershipSettingsParams {
  userId: string;
  clubId: string;
  plansVisibleTo?: 'EVERYONE' | 'CLUB_MEMBERS';
  reminderOffsetsHours?: number[];
  yearlyReminderHours?: number[];
  reminderSendHour?: number;
  pushEnabled?: boolean;
  optionalReminders?: PLAN_REMINDER_TYPE[];
  creditReleaseHours?: number;
  lateCancelUsesCredit?: boolean;
  failedPaymentGraceDays?: number;
  refundPolicyText?: string | null;
  seePlansBannerText?: string | null;
}

export interface RazorpaySubscriptionWebhook {
  event: string;
  subscriptionId: string;
  paymentId: string | null;
  amountInPaise: number | null;
  currentStart: number | null;
  currentEnd: number | null;
}

export interface PlanReminderSweepJobData {
  triggeredAt: string;
}
