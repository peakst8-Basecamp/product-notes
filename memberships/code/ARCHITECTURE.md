# Memberships: architecture

How [peakst8 Club Memberships](../README.md) is built on the peakst8 backend (Express, Prisma 7, Postgres, BullMQ, Razorpay). The code is in [`backend/`](backend/); [README](README.md) covers integration.

## Concepts

| peakst8 term | Model | What it is | SweatPals equivalent |
| --- | --- | --- | --- |
| **Plan** | `Plan` (`kind` = `MEMBERSHIP` or `PACK`) | What a club sells. One club, many plans. | Plan (Membership or Class Pack) |
| **Plan price** | `PlanPrice` | A price option: recurring interval, or one-time with a validity | Tier |
| **Intro offer** | `PlanIntroOffer` | Discounted first period, once per member | Offer |
| **Coverage + usage limit** | `PlanCoverage`, `Plan.limitPeriod`, `usageLimit` | Which events the plan covers; N bookings per period or in total | Booking pools + limits |
| **Plan price on a pass** | `CategoryPlanPolicy` | What a holder pays for a ticket category: `FREE`, `HALF`, `FULL`, `CUSTOM_PERCENT`, `CUSTOM_FLAT`. No row = no benefit. | Plan policy per experience |
| **Member plan** | `UserPlan` | One member's copy: status, period, credits, Razorpay subscription | user-to-membership |
| **Usage** | `PlanUsage` | One row per booking that used a plan (`HELD`, `CONSUMED`, `RELEASED`): the meter and audit trail | — |
| **Charge** | `PlanCharge` | First payment, renewal, fix billing, switch, joining fee | — |
| **Join / cancel request** | `PlanJoinRequest`, `PlanCancelRequest` | Approval workflows | Membership join request |
| **Guest pass** | `GuestPass` | Free trial booking for a friend | Guest pass |
| **Brand perk** | `ClubPerk`, `PlanPerk` | Partner offer unlocked by chosen plans | Perks |
| **Discount code** | `Coupon` (existing) + `CouponToPlan` | Club code on chosen plans: first charge, every charge, first N | Promo code |
| **Club settings** | `ClubMembershipSettings` | Reminder timing and channels, release window, grace days, refund text | — |
| **Reminder** | `PlanReminderDelivery` | One row per reminder, charge and channel | — |
| **History** | `UserPlanEvent` | Append-only log of member and host actions | membership history |

## Member plan lifecycle

```
                   ┌────────────── rejected ──────────────┐
 join (approval) → PENDING_APPROVAL ── approved ──┐          ▼
 join (no approval) ─────────────────────────────►PENDING_PAYMENT ──(30 min, no payment)──► ABANDONED
                                                    │ paid / mandate authorized
                                                    ▼
                    resume ┌──────────────────── ACTIVE ◄──────── renewal charged / fix billing ──┐
                     ┌─────┤                       │  │  │                                        │
                     │  PAUSED ◄── host pauses ────┘  │  └── renewal charge fails ──► PAST_DUE ───┘
                     │                                │                                    │
                     └────────────►                   │ cancel (AUTO), or request approved │ retry window + club grace days
                                                      ▼                                    ▼
                                         CANCELS_AT_PERIOD_END ─── period ends ──► ENDED ◄──┘
 PACK: ACTIVE ── validity passes ──► ENDED      PENDING_APPROVAL is a PlanJoinRequest, not a UserPlan.
```

| Status | Books with plan | Billing | Set by |
| --- | --- | --- | --- |
| `PENDING_PAYMENT` | No | Order or mandate open | `joinPlan` |
| `ACTIVE` | Yes, while credits last | Renews on `currentPeriodEnd` | `activateUserPlan`, `subscription.charged` |
| `PAST_DUE` | No; can't cancel | Razorpay retries; fix-billing link sent | `subscription.pending` / `halted` |
| `PAUSED` | No | Stopped; end date moves out on resume | host `pauseUserPlan` |
| `CANCELS_AT_PERIOD_END` | Yes, until the period ends | None | `scheduleCancellation` |
| `ENDED` | No | None | `endLapsedPlans`, `subscription.cancelled`, host |
| `ABANDONED` | No | None | `endLapsedPlans` after 30 minutes |

## How checkout prices a pass

`planPricing.helpers.ts` → `evaluatePlansForCategory`, called by `membershipService.holdPlanForRegistration` inside `proceedToPayment`.

```
input: member's ACTIVE / CANCELS_AT_PERIOD_END plans, the event, the pass
for each plan, drop it if:
  status isn't bookable · a pack or cancelling plan ends before the event · another club (co-host counts)
  · coverage misses the event type and event id · no plan price on this pass
  · the usage window containing the EVENT date is full (day in IST; week/month/year anchored on the period start; packs in total)
price the rest: FREE 0 · HALF base/2 · FULL base · CUSTOM_PERCENT base×(1−p) · CUSTOM_FLAT max(0, base−x)
pick: lowest price → a pack (soonest expiry) → a limited plan before unlimited
then: registration.appliedUserPlanId; PlanUsage CONSUMED if price 0, else HELD until payment
payment success → CONSUMED · failure/expiry → RELEASED · ticket cancel → RELEASED only inside the club's release window
```

Coupons apply after the plan price, only when it is above ₹0. Plans never combine. Every decision returns its steps, so the reason can be logged or shown.

## Payments

| Case | How |
| --- | --- |
| **Recurring plan** | Razorpay Plan (created lazily per `PlanPrice`, id cached) + Subscription. The first period (intro price, discounted price or full price, plus joining fee) is charged up front as an add-on; recurring charges start at `start_at` = end of the first period. |
| **Every-charge code** | A separate Razorpay Plan at the discounted amount (not cached yet; low volume). |
| **Pack / one-time** | Razorpay Order with `notes.flow = 'plan'`; `order.paid` activates it. |
| **Renewal** | `subscription.charged` opens the next period, records the charge, sends the receipt, reschedules reminders, resets host credit overrides. |
| **Failure** | `subscription.pending` → `PAST_DUE` + payment-failed notice; `halted` keeps `PAST_DUE`; `endLapsedPlans` ends it after 7 retry days + the club's grace days. |
| **Pause / resume / cancel** | Mirrored to Razorpay (`subscriptions.pause`, `resume`, `cancel(atCycleEnd)`). |
| **Payouts** | Platform collects as today; plan revenue joins the weekly payout and platform fee (finance to confirm the rate, open question 4). |
| **GST** | `PlanPrice.isAmountInclusiveGST` + the club's GST %, as categories do. |

## Renewal reminders (launch prerequisite)

`planReminder.service.ts` + `planReminder.cron.ts`.

- **Durable rows.** `PlanReminderDelivery`, unique on (plan, type, channel, `dueAt`), so retries never double-send.
- **Scheduling.** `scheduleForUserPlan` runs after activation, renewal, resume, cancel (and should after any billing-date or price change). It cancels queued rows and rebuilds them: `PRE_DEBIT` at the club's offsets (default 72 h and 24 h; 168 h and 24 h for quarterly or longer), `INTRO_ENDING` in the first period of an intro offer, and optional `PACK_EXPIRING` / `ACCESS_ENDING`.
- **Timing.** At the club's send hour in IST, never 21:00 to 08:00, and the last notice always at least 24 hours before the charge (RBI e-mandate rule). Pure function: `reminderSendTimes`.
- **Immediate notices.** `sendNow` for `CHARGED`, `PAYMENT_FAILED`, `MANDATE_AT_RISK`.
- **Sending.** The sweep sends due rows: email always (the written record), push if the club allows it, WhatsApp once templates are approved. It retries 3 times, then marks the row `FAILED` and logs an error for mandatory types. Stale pre-debit notices (plan no longer active) are cancelled, not sent.
- **Copy.** `buildReminderMessage`: club, plan, amount, date, and a Manage or Pay now link.

## Club admins configure it

| Level | Where | Model |
| --- | --- | --- |
| Club | Dashboard → Settings → Memberships | `ClubMembershipSettings` (visibility, reminder offsets, channels, send hour, optional reminders, credit release window, late cancels, grace days, refund text, banner text) |
| Plan | Dashboard → Plans | `Plan`, `PlanPrice`, `PlanIntroOffer`, `PlanCoverage`, `PlanPerk`, `CouponToPlan` |
| Pass | Event editor → each pass | `CategoryPlanPolicy`, `Category.isPlanHoldersOnly` |

Every host method re-checks that the caller hosts the club (`Club.hosts`), because the route's RBAC only says "HOST". peakst8 admin switches the feature on (`ClubMembershipSettings.isEnabled`) and owns the platform fee.

## API

All routes are under `/plans`.

| Who | Method and path | Service |
| --- | --- | --- |
| Public | `GET /club/:clubId` | `listPublicPlans` |
| Public | `GET /club/:clubId/perks` | `listClubPerks` (teasers; members-only hidden) |
| Member | `GET /me` | `getMyPlans` (status, credits, savings, guest passes, perks) |
| Member | `GET /me/eligible?eventId&categoryId` | `priceCategoryForMember` |
| Member | `GET /club/:clubId/perks/me` | `listClubPerks` with unlock state |
| Member | `POST /:id/join` `{ planPriceId, useIntroOffer, couponCode? }` | `joinPlan` → subscription, order, free, or pending approval |
| Member | `POST /me/:id/cancel` | `cancelMyPlan` (Auto or Review; commitment and past-due rules) |
| Member | `POST /me/:id/guest-passes` | `sendGuestPass` |
| Member | `POST /join-requests/:id/withdraw` | `withdrawJoinRequest` |
| Member | `POST /perks/:id/reveal` | `revealPerk` (counts the reveal) |
| Host | `POST /host/club/:clubId` · `PATCH /host/:id` | `createPlan` (with "apply to existing passes") · `updatePlan` |
| Host | `PUT /host/categories/:id/policies` | `setCategoryPolicies` |
| Host | `GET /host/club/:clubId/holders` | `listHolders` |
| Host | `POST /host/user-plans/:id/{pause,resume,cancel,credits}` | pause, resume, cancel (period end or now), set credits |
| Host | `POST /host/{join,cancel}-requests/:id/review` | approve or decline |
| Host | `PUT /host/club/:clubId/settings` | `upsertSettings` |
| Host | `GET`/`POST /host/club/:clubId/perks` · `PATCH /host/perks/:id` | perks with reveal counts, create, switch on/off |
| Host | `POST /host/club/:clubId/discounts` | `createPlanCoupon` |

V2 routes in the spec but not in this package: send plan, switch plan, change price or billing date, shared plans, fix billing from the dashboard, upcoming renewals, claim links for guest passes.

## Evidence

**SweatPals help centre (read 1 Nov 2026):** [3.1](https://help.sweatpals.com/31-joining-a-membership) · [3.2](https://help.sweatpals.com/32-managing-your-billing-and-payments) · [3.3](https://help.sweatpals.com/33-membership-access-and-cancellations) · [3.4](https://help.sweatpals.com/34-making-use-of-your-membership) · [5.1](https://help.sweatpals.com/51-membership-overview) · [5.2](https://help.sweatpals.com/52-creating-and-configuring-memberships) · [5.2a](https://help.sweatpals.com/52a-additional-membership-settings) · [5.3](https://help.sweatpals.com/53-managing-active-members) · [Class packs](https://help.sweatpals.com/34-create-a-class-pack)

**SweatPals public web client.** Route names from the JavaScript on public community pages; no logged-in or private calls were made:

```
memberships/current?active=                         memberships/eligible-for-bookable-service/:id
memberships/public/community/:communityId           (each membership has tiers[])
membership-offers/public/tier/:tierId               memberships/public/user-membership/:id/{claim,intake-form}
memberships/public/shared-membership/:id/claim      memberships/public/guest-pass/:id/claim
memberships/public/payment-method-update/:id        memberships/public/fix-billing/:id(/intent)
membership-join-requests/my · /:id/withdraw         payments/public/plan-holders-plans {eventId, eventInstanceDate}
user/:uid/membership/:id/{history,pause,renew,deactivate}
```

**REA static analysis (2 Nov 2026).** 56 public Next.js bundles (membership, checkout, claim, guest-pass, fix-billing pages) read as inert text and never executed. The run over the 5 membership chunks recovered 1,425 webpack modules (Evidence `ev_da05d85e…`); 51 files were outside the selected sources, and dynamic paths stay unresolved. Component names and translation keys gave the screen states the prototype rebuilds; the [feature checklist](../coverage/README.md) maps each one.

**peakst8 backend (`main` at `b7b7f9c`).** No plan or subscription models before this. Payments use Razorpay Orders (`PaymentTransaction`, `RazorpayPayment`). The ticket unit is `Event` → `Category` → `Registration` → `Ticket`. Scheduled jobs use BullMQ `upsertJobScheduler` (`cron.infra.ts`); email goes through the `OutboundEmail` outbox; push through `pushNotificationService`; `NotificationDelivery` only knows `ABANDONED_CART`.
