# Memberships: code package

Backend code for [peakst8 Club Memberships](../README.md), written to drop into [`peakst8-Basecamp/peakst8-backend`](https://github.com/peakst8-Basecamp/peakst8-backend). It is **not** on a branch in that repo yet: the engineer who picks this up copies it in, wires the integration points below and ships it from there.

Read [ARCHITECTURE.md](ARCHITECTURE.md) first for the design. The [working prototype](https://peakst8-basecamp.github.io/product-notes/memberships/prototype/) shows the screens this code serves.

## What's checked

Verified on 2 Nov 2026 against `peakst8-backend` `main` (`b7b7f9c`), copied into a scratch checkout with these files and the schema merged in:

| Check | Result |
| --- | --- |
| `prisma validate` and `prisma generate` with `prisma/memberships.prisma` merged | Pass |
| `tsc --noEmit` (whole backend) | Pass, 0 errors |
| ESLint on every file here | 0 errors, 0 warnings |
| Prettier | Clean |
| cspell | Clean |
| `scripts/check-plan-pricing.ts` (pricing rule, limits, tie-breaks, coupons, reminder timing) | All checks pass |

Not checked: nothing here has run against a database, Redis or Razorpay. The webhook payload mapping, the Razorpay add-on approach for first periods and the WhatsApp channel need a staging run with Razorpay test mode.

## What's here

Paths mirror the backend repo, so each file goes to the same path there.

| File | What it does |
| --- | --- |
| `prisma/memberships.prisma` | All new models and enums, plus the field changes to existing models (listed at the bottom of the file) |
| `src/services/helpers/planPricing.helpers.ts` | Pure rules: checkout pricing, usage windows, coupon amounts, reminder send times, reminder copy |
| `src/services/membership.service.ts` | Member side: list plans, join (approval, capacity, first-timer, intro, codes), my plans, checkout hook, cancel, guest passes, perks page and reveal |
| `src/services/membershipHost.service.ts` | Club-admin side: create and edit plans, plan price per pass, holders, pause/resume/cancel, credits, request reviews, settings, perks, discount codes |
| `src/services/membershipBilling.service.ts` | Razorpay subscription and order events; housekeeping that ends lapsed plans and abandons unpaid checkouts |
| `src/services/planReminder.service.ts` | Renewal reminders (launch prerequisite): schedule, recompute, send, log |
| `src/infrastructure/razorpaySubscription.infra.ts` | Razorpay plans, subscriptions, orders, pause, resume, cancel |
| `src/infrastructure/planReminder.cron.ts` | 15-minute BullMQ sweep for reminders and lapsed plans |
| `src/repositories/membership.repository.ts` | Prisma queries |
| `src/dto/membership.dto.ts` | zod request schemas |
| `src/controllers/membership.controller.ts`, `src/routes/membership.routes.ts` | HTTP layer, mounted at `/plans` |
| `src/interfaces/membership.interface.ts`, `src/lib/membership.constants.ts` | Types and constants |
| `scripts/check-plan-pricing.ts` | Standalone checks for the pure rules (the backend has no test runner) |

## Integrating it

1. **Schema.** Paste the models and enums from `prisma/memberships.prisma` into `prisma/schema.prisma`, apply the "Changes to existing models" block at the bottom, then `bun run migrate:db` to create the migration.
2. **Files.** Copy `src/**` and `scripts/**` to the same paths. Optionally re-export the new interfaces, DTOs, constants, repository and services from each folder's `index.ts`; the files import each other directly, so they work either way.
3. **Routes.** In `src/index.ts`, mount `membershipRoutes` at `/plans` like the other routers.
4. **Cron.** Import `src/infrastructure/planReminder.cron.ts` where `cron.infra.ts` is imported (or move its block into `cron.infra.ts`).
5. **Webhooks.** In `payment.controller.ts`, after the signature check: send `subscription.*` events to `membershipBillingService.handleSubscriptionEvent`, and `order.paid` events whose `notes.flow` is `plan` to `membershipBillingService.handlePlanOrderPaid`. Map the Razorpay payload to `RazorpaySubscriptionWebhook` (`payload.subscription.entity.id`, `payload.payment.entity.id`, `payload.payment.entity.amount`, `current_start`, `current_end`).
6. **Checkout.** In `proceedToPayment`, inside the registration transaction and before the Razorpay order: call `membershipService.holdPlanForRegistration` and use its `amountBeforeCoupon` as the base amount (coupons apply after plans; skip Razorpay when it is 0). On payment success or failure call `settlePlanUsage`; on ticket cancel call `releasePlanUsageOnCancel`.
7. **Run the gate.** `bun run check` (spellcheck, lint, prettier, typecheck) and `bun scripts/check-plan-pricing.ts`.

## Before it ships

- Answer open question 1 in the product note (weekly sessions as one event each, or one long event). `holdPlanForRegistration` and usage counting assume one registration per session.
- Confirm with Razorpay: subscriptions with an up-front add-on and a future `start_at` (used for intro offers, first-charge codes and joining fees), UPI AutoPay limits, and whether their own pre-debit notice is sent alongside ours.
- Approve WhatsApp templates for each reminder type, then wire the WhatsApp branch in `planReminder.service.ts` `deliver()` (it throws until then, and the sweep records the failure and retries).
- Add `/passes/plans/:id` and `/fix-billing/:id` routes in the frontend; reminder emails link to them.
