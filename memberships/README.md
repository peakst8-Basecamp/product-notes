# peakst8 Club Memberships

**A peakst8 product feature.** Clubs sell **plans**: a recurring membership (for example ₹1,499 a month) or a prepaid pack (for example 10 runs). A member buys the plan once and then books each run, class or event as usual. At checkout, peakst8 applies the plan automatically, so the ticket is free, discounted or uses up one credit.

[Product note](https://peakst8-basecamp.github.io/product-notes/memberships/) · [Working prototype](https://peakst8-basecamp.github.io/product-notes/memberships/prototype/) · [Schema draft](schema-draft.prisma) · Internal · Draft · updated 2 Nov 2026

This note reverse-engineers SweatPals Memberships, which SweatPals now calls "Plans". It sets out exactly what they built, then maps it onto the peakst8 backend (Express, Prisma, Postgres and Razorpay). SweatPals has no public repo, so everything here comes from their public help centre and the network routes their public web app calls (see [Evidence](#evidence)).

## In one minute

1. **The host creates a plan.** They choose what it covers (event types or specific events), how much it can be used (unlimited, N in total, or N per week or month), the price and billing (recurring, or a one-time payment with an expiry) and the rules (approval needed, first-timers only, capacity, and so on).
2. **The host sets a plan price on each ticket category.** For every category, plan holders get it free, at half price, at full price, or at a custom ₹ or % amount.
3. **The member joins the plan** from the club page: they pay, or request approval, then pay. The plan appears in the app under **Passes → Plans**.
4. **The member books events the normal way.** At checkout, peakst8 finds their eligible plan, reprices the ticket and records one use.
5. **Renewal and exit.** A recurring plan renews automatically with a notice 24 hours before. Cancelling either takes effect straight away or goes to the host as a request, and access lasts until the end of the period. Only the host can pause, refund, switch or change a plan.

The point is the separation: **a plan is not a ticket.** It is a pricing rule plus a usage meter, and it attaches to the existing registration flow.

## Working prototype

[`prototype/`](https://peakst8-basecamp.github.io/product-notes/memberships/prototype/) is a single page that runs the feature end to end in the peakst8 app's own design: dark theme, Outfit and Bricolage Grotesque, the blue `PrimaryButtonV2` gradient, the indigo-to-cyan selected pass row from `ChoosePassTab`, the gold step and offer gradient, the `EventCtaSection` price bar and the angled strike-through. The state is real, so changes on one side show up on the other:

| Side | What you can do |
| --- | --- |
| **Member (phone)** | Browse plans on the club page · join with or without the intro offer · request to join an approval-only plan and withdraw it · pay through a mock Razorpay UPI AutoPay mandate · see "Member price" on events · check out at the plan price (₹0 skips payment) · view the ticket with its membership discount · see credits and renewal in Passes → Plans · cancel (Auto or Review) · fix a failed renewal |
| **Host (dashboard)** | Plans list with MRR and holders · create and publish a plan (it appears on the club page and sets its price on covered passes) · change the plan price on any pass · pause, resume, add credits to or cancel the live member's plan · approve or decline join and cancel requests |
| **Simulated time** | Skip to the next renewal (a pre-debit notice, then a charge or a failure) · make the next renewal fail · reset |

The right-hand panel shows the member's `UserPlan` rows, the event log, and for the last checkout every step of the pricing rule: which plans were kept or dropped and why.

## Who we're building it for

| | |
| --- | --- |
| **Clubs** | Weekly run clubs, strength and HIIT communities, yoga and pilates collectives on peakst8 that run the same sessions every week |
| **Why they want it** | Predictable monthly revenue instead of per-session ticketing, and members who keep coming back |
| **Members** | Regulars who attend 4 to 12 times a month and want one payment, not a checkout every session |
| **Not for V1** | One-off races and festivals (single tickets work well there), and multi-club or network passes |

## Concepts

| SweatPals term | peakst8 term | What it is |
| --- | --- | --- |
| Plan (Membership or Class Pack) | **Plan**, `kind = MEMBERSHIP` or `PACK` | The product a club sells. One club, many plans. |
| Tier | **Plan price** | A price option on a plan, for example ₹1,499 a month or ₹14,999 a year. SweatPals' API returns `membership.tiers[]`. |
| Offer (intro offer) | **Intro offer** | A discounted first period on a price, once per member, for example ₹199 for the first 2 weeks, then ₹1,499 a month (`membership-offers/public/tier/:id`). |
| Booking pools + limits | **Coverage + usage limit** | Which events the plan covers, and how many bookings it allows in each period or in total. |
| Plan policy (per experience) | **Category plan policy** | What a plan holder pays for a given ticket category: `FREE`, `HALF`, `FULL`, `CUSTOM_PERCENT` or `CUSTOM_FLAT`. |
| user-to-membership | **Member plan** (`UserPlan`) | One member's copy of a plan: status, current period, credits left, renewal date. |
| Membership join request | **Plan join request** | Used when a plan needs approval. The member can withdraw it. |
| Shared plan | **Plan share** | The holder invites others (for example family) to use the plan's benefits. |
| Guest pass | **Guest pass** | The holder sends a free trial booking to a friend. |
| Send plan | **Send plan** | The host sends a plan to someone: free, free for a period, or full payment. |
| Fix billing | **Fix billing** | Recover a failed renewal: this cycle, prorated, or a custom amount. |

## Member flows

### 1. Discover and join

| Step | What the member sees | What the system does |
| --- | --- | --- |
| 1 | The club page has a **Plans** section. Each card shows name, price and billing, what it covers and its limits. | `GET /plans/public/club/:clubId` lists published, unarchived and listed plans. Unlisted plans are reachable only by direct link (`/plans/public/:planId`). |
| 2 | Tap **Join**. If the plan needs approval, the button reads **Request to join**. | The button state comes from the member's `UserPlan` and join request. The four states SweatPals uses are **Join**, **Request to join**, **Request pending · Withdraw** and **Not approved** (disabled). If they already hold the plan, the button reads **View**. |
| 3 | Confirm the price, the billing frequency, any intro offer, the minimum commitment disclaimer, the waiver and the questionnaire. | The eligibility checks run here: first-timers only, one per member, capacity, intro offer already used. |
| 4 | Pay. | A recurring plan creates a Razorpay Subscription, and the member authorises a UPI AutoPay or card mandate. A pack creates a normal Razorpay Order, the same as a ticket today. |
| 5 | Confirmation email and receipt. The plan shows under **Passes → Plans**. | The webhook moves the `UserPlan` to `ACTIVE` and opens period 1. |

### 2. Use the plan

- **Plan screen:** status, renewal or expiry date, what it covers, credits left this period, who it's shared with, guest passes left.
- **Booking:** the member opens any event and picks a category. If they hold an eligible plan, checkout shows **"Booked with <plan>"** and the plan price. When the price comes to ₹0, Razorpay is skipped. The member still books each event, because nothing is booked automatically.
- **Book with plan only:** a category can be set so that only plan holders can book it (members-only sessions).

### 3. Renew, cancel, rejoin

- **Renewal:** automatic on the billing date, with a push, WhatsApp or email notice 24 hours before (this matches the RBI pre-debit notice). A promo code applies only to the first charge, and renewals are full price.
- **Cancel:** Passes → Plan → Manage → Cancel. The plan's cancellation policy decides what happens: either it cancels straight away (`AUTO`) or it sends a request to the host (`REVIEW`, and the host is notified). A minimum commitment blocks cancelling until it has passed.
- **After cancelling:** a recurring plan keeps working until the end of the period paid for, and a pack works until its credits run out or it expires. There is no automatic refund.
- **Change plan:** the member cancels and joins the new plan. Only the host can switch a member's plan directly.

### 4. Claim flows (no account needed beforehand)

| Flow | How it starts | What the member does |
| --- | --- | --- |
| **Sent plan** | The host uses Send plan by email or phone | Opens the link, fills in name, phone and email and the intake form, adds a payment mandate if the plan isn't free, then claims it |
| **Shared plan** | The holder taps "Invite to my plan" | Opens the invite, fills in their details and the intake form, then taps **Claim**. Their benefits draw on the holder's plan. |
| **Guest pass** | The holder sends a pass link or QR code (app only) | The guest opens it, fills in the intake form, claims it and books one eligible event for free. Staff can also redeem it at check-in. |
| **Fix billing** | Failed renewal email | Opens a self-serve link and pays the outstanding amount |

SweatPals runs all four as public, token-based endpoints (`/public/user-membership/:id/claim`, `/public/shared-membership/:id/claim`, `/public/guest-pass/:id/claim`, `memberships/public/fix-billing/:id`). peakst8 should do the same with signed, single-use tokens.

## Host flows

### Create a plan (dashboard → Plans → + Create)

| Section | Fields |
| --- | --- |
| **Basics** | Kind (Membership or Pack), name and description (both required), cover image |
| **Coverage** | Event types (Training, Single day and others from `EVENT_TYPE`) or a list of specific events. A recurring club run is the usual target. |
| **Usage limit** | Unlimited, a total count (for packs) or a count per day, week, month or year (for memberships). Optionally roll unused bookings over into the next period. |
| **Apply to existing events** | One action that sets a plan policy on every category of the events the plan covers: Free, Half, Full, or Custom ₹ or %. |
| **Pricing and billing** | One or more prices. Each is **recurring** (weekly, monthly, every 4 weeks, quarterly, half-yearly or yearly) or **one-time**, with validity: never expires, from purchase, from first use, or a fixed end date. |
| **Extras** | Intro offer, joining fee, minimum commitment (in cycles) |
| **Rules** | One purchase per member, first-timers only, capacity (maximum active holders), approval required, unlisted, featured, shareable (with a seat count), guest passes (per cycle, eligible events, first-timers only or anyone), WhatsApp group link, waiver, questionnaire |
| **Cancellation** | Automatic or review each request |

### Set the plan price on a ticket category

The event editor gets a new **Plan pricing** row under each category: for each of the club's live plans, choose Free, Half, Full or Custom. New categories default to **Full** (no benefit) until the host sets them. SweatPals has the same rule: a plan only takes effect on events where a policy is set.

### Manage members (Members → ⋮ on a member's plan)

| Action | Effect |
| --- | --- |
| **Pause / resume** | Billing stops, access stops, and price and credits are kept. The end date moves out by the length of the pause (for recurring plans). Pauses are indefinite or end on a set date. Only the host can pause. |
| **Cancel** | Access lasts until the end of the period |
| **Refund** | Refund the last charge, then keep the plan active, cancel it now or pause it |
| **Change billing date** | This cycle only or every cycle, with an optional extra charge |
| **Change credits** | Set the credits left in the current period |
| **Change price** | This cycle only or every future cycle |
| **Switch plan** | Move the member to another plan, with an optional extra charge (upgrade or downgrade) |
| **Share plan** | Add people to a shareable plan (shows, for example, 2/4 seats taken). Resend or revoke invites. |
| **Send payment update link** | The member updates their mandate or card |
| **Fix billing** | View renewal attempts, then charge this cycle, prorated from today, or a custom amount by link, QR code or card |
| **Approve / reject join requests** | For plans with approval required |
| **Send plan** | Choose a plan, enter the person's email or phone, choose Free, Free for a period or Full payment, then send |

### Money views

- **Upcoming renewals:** the next 30 days of renewals, **at risk** (no mandate, or the mandate expires before the charge), and projected revenue.
- **Plan revenue** feeds the existing weekly club payout report (`ClubWeeklyPayoutReport`) and the platform fee invoice, the same way ticket GMV does today.

## Member plan lifecycle

```
                   ┌────────────── rejected ──────────────┐
 join (approval) → PENDING_APPROVAL ── approved ──┐          ▼
 join (no approval) ─────────────────────────────►PENDING_PAYMENT ──(30 min, no payment)──► ABANDONED
                                                    │ paid / mandate authorised
                                                    ▼
                    resume ┌──────────────────── ACTIVE ◄──────── fix billing / retry ok ──┐
                     ┌─────┤                       │  │  │                                 │
                     │  PAUSED ◄── host pauses ────┘  │  └── renewal charge fails ──► PAST_DUE
                     │                                │                                    │
                     └────────────►                   │ cancel (AUTO), or request approved │ retries exhausted
                                                      ▼                                    ▼
                                         CANCELS_AT_PERIOD_END ─── period ends ──► ENDED ◄──┘
 PACK: ACTIVE ── credits used up, or validity date passes ──► ENDED
 Member CANCEL (REVIEW policy) adds a CancelRequest; the plan stays ACTIVE until the host approves.
```

| Status | Can book with plan | Billing |
| --- | --- | --- |
| `PENDING_APPROVAL` | No | None |
| `PENDING_PAYMENT` | No | Order or mandate open |
| `ACTIVE` | Yes, if credits are left | Renews on `currentPeriodEnd` |
| `PAST_DUE` | No (SweatPals blocks cancelling here too) | Razorpay retries, and a Fix billing link is sent |
| `PAUSED` | No | Stopped |
| `CANCELS_AT_PERIOD_END` | Yes, until the period ends | No further charges |
| `ENDED` | No | None |
| `ABANDONED` | No | None |

## How checkout prices a booking

This is the core of the feature. It runs inside the existing `proceedToPayment` flow, before the Razorpay order is created.

```
input: user U, event E, category C
1. plans = U's UserPlans (owned, or shared to U) with status ∈ {ACTIVE, CANCELS_AT_PERIOD_END}
           and now < currentPeriodEnd (or validUntil for packs)
2. keep plans whose coverage includes E (by event type or explicit event id) and whose club = E.clubId (or E.coHostClubId)
3. keep plans with a CategoryPlanPolicy for C, or apply the plan's default policy if "apply to all" was used
4. keep plans whose usage meter allows one more booking in the period that contains E.startDate
5. price each: FREE → 0 · HALF → base/2 · FULL → base · CUSTOM_PERCENT → base × (1 − p) · CUSTOM_FLAT → max(0, base − x)
6. pick the lowest price; on a tie, prefer a pack that expires soonest, then a limited plan before an unlimited one
7. registration.appliedUserPlanId = chosen; create a PlanUsage row (status HELD)
8. price 0 → TICKET_GENERATED with no Razorpay order; price > 0 → normal order for the reduced amount
9. on payment success → PlanUsage CONSUMED · on order expiry or failure → RELEASED
10. on registration cancel → RELEASED if within the club's cancellation window, otherwise it stays CONSUMED (late cancel)
```

- **Coupons stack after plans.** The coupon applies to the price after the plan, and only when that price is above ₹0.
- **One plan per registration.** Plans never combine with each other.
- **Credits are counted by event date, not booking date.** Booking next month's run uses next month's allowance, which matches SweatPals' "limits reset per period".
- SweatPals exposes this as `memberships/eligible-for-bookable-service/:id` and `payments/public/plan-holders-plans {eventId, eventInstanceDate}`, which is the same idea.

## Payments on peakst8 (India)

| Concern | SweatPals | peakst8 |
| --- | --- | --- |
| Processor | Stripe (Connect) | **Razorpay**, already in the stack (`razorpay@2.9`) |
| Recurring plans | Stripe Subscriptions | **Razorpay Subscriptions** (Plan, then Subscription), with mandates by **UPI AutoPay**, card or eNACH |
| Packs | Stripe one-time payment | **Razorpay Order**: reuse the `PaymentTransaction` and `RazorpayPayment` flow |
| Renewal notice | App notification 24 hours before | Required anyway: RBI asks for a pre-debit notice at least 24 hours ahead for e-mandates. Send it by push, WhatsApp and email. |
| Large renewals | n/a | RBI e-mandate rules allow charges without extra authentication up to ₹15,000. Above that, the member has to authenticate each charge (to verify for yearly plans). |
| Failed renewal | 3 automatic retries, then "Payment failed" email | Razorpay retries the subscription. On `subscription.halted`, move to `PAST_DUE` and send a Fix billing link. |
| Payouts | Funds go to the host's Stripe account | Platform collects, as today. Plan revenue joins the weekly payout and the platform fee (`Club.platformFeePercentage`). |
| GST | Sales tax integration | Reuse the category GST approach (`isAmountInclusiveGST`, `ClubRegistrationInfo.gstPercentage`) on plan prices. |

Webhooks to add next to the existing Razorpay handler: `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.cancelled`, `subscription.completed`, `payment.failed`.

## Data model (summary)

The full draft is in [`schema-draft.prisma`](schema-draft.prisma). New tables:

| Model | Purpose |
| --- | --- |
| `Plan` | The product: club, kind, name, coverage, usage limit, rules, cancellation policy |
| `PlanPrice` | A price option (SweatPals' "tier"): amount, billing interval or validity, joining fee, Razorpay plan id |
| `PlanIntroOffer` | A discounted first period on a price |
| `PlanCoverage` | Event types or explicit events the plan covers |
| `CategoryPlanPolicy` | What plan holders pay for a ticket category |
| `UserPlan` | A member's plan: status, period dates, credits, pause, cancellation and commitment state, Razorpay subscription id |
| `PlanUsage` | One row per booking that used the plan (`HELD`, `CONSUMED` or `RELEASED`): the usage meter and audit trail |
| `PlanCharge` | Each charge (first payment, renewal, fix billing, switch, joining fee) linked to a Razorpay payment |
| `PlanJoinRequest` | Approval workflow |
| `PlanCancelRequest` | Review-each-request cancellations |
| `PlanShare` | Shared seats on a plan |
| `GuestPass` | Trial passes |
| `UserPlanEvent` | Append-only history (paused, resumed, price changed, switched and so on), the same as SweatPals' `/membership/:id/history` |

Changes to existing tables: `Registration.appliedUserPlanId`, `Category.isPlanHoldersOnly`, and relations from `Club`, `User`, `Event` and `Category`.

## API (proposed, following the existing routes, controllers, services and repositories layout)

| peakst8 route | SweatPals route it's modelled on |
| --- | --- |
| `GET /plans/public/club/:clubId` | `GET memberships/public/community/:id` |
| `GET /plans/public/:planId` | `GET memberships/public/:id` |
| `GET /plans/public/price/:priceId/offers` | `GET membership-offers/public/tier/:id` |
| `POST /plans/:planId/join` → `{ orderId \| subscriptionId }` | checkout and payment-intent flow |
| `GET /plans/me?active=true` | `GET memberships/current?active=` |
| `GET /plans/me/eligible?eventId&categoryId` | `GET memberships/eligible-for-bookable-service/:id`, `POST payments/public/plan-holders-plans` |
| `POST /plans/me/:userPlanId/cancel` | app "Manage → Cancel" |
| `GET /plan-join-requests/me` · `POST /plan-join-requests/:id/withdraw` | `GET membership-join-requests/my` · `POST …/:id/withdraw` |
| `POST /plans/me/:userPlanId/shares` · `DELETE …/shares/:shareId` | "Invite to my membership" |
| `POST /plans/me/:userPlanId/guest-passes` | guest pass send (app) |
| `GET/POST /plans/public/claim/:token` (+ `/intake-form`, `/setup-mandate`) | `public/user-membership/:id/claim`, `…/claim/setup-intent`, `…/intake-form` |
| `GET/POST /plans/public/share/:token/claim` | `public/shared-membership/:id/claim` |
| `GET/POST /plans/public/guest-pass/:token/claim` | `public/guest-pass/:id/claim` |
| `GET/POST /plans/public/fix-billing/:token` (+ `/intent`) | `memberships/public/fix-billing/:id` (+ `/intent`) |
| `GET/POST /plans/public/payment-method/:token` | `memberships/public/payment-method-update/:id` |
| Host: `POST/PATCH/GET /host/clubs/:clubId/plans`, `PUT /host/categories/:id/plan-policies` | dashboard Plans |
| Host: `GET /host/clubs/:clubId/members/:userId/plans/:userPlanId/history` | `user/:uid/membership/:id/history` |
| Host: `POST …/pause` · `…/resume` · `…/renew` · `…/deactivate` · `…/refund` · `…/switch` · `…/billing-date` · `…/credits` · `…/price` | `user/:uid/membership/:id/pause`, `…/renew`, `…/deactivate` |
| Host: `POST /host/clubs/:clubId/plans/send` | Send plan |
| Host: `GET /host/clubs/:clubId/plans/upcoming-renewals` | Transactions → Upcoming billings |
| Webhook: `POST /payment/razorpay/webhook` (extend with `subscription.*`) | Stripe webhooks |

## Scope

| | V1 (the first clubs) | V2 | Later or not |
| --- | --- | --- | --- |
| **Plans** | Membership (monthly or quarterly) and Pack (N credits plus expiry), one price each | Several prices per plan, yearly, every 4 weeks, half-yearly | Network or multi-club passes |
| **Coverage** | Event types or specific events, plus a per-category policy (Free, Half, Full, Custom) and "apply to existing events" | Plan-holders-only categories, roll-over | Appointments (peakst8 has none yet) |
| **Member** | Join, approval, pay, Passes → Plans, automatic pricing at checkout, cancel (Auto or Review), renewal notice | Shared plans, guest passes, intro offer, joining fee, minimum commitment | Members pausing their own plan (SweatPals doesn't allow it either) |
| **Host** | Create, edit and archive plans, member list with status, cancel, refund, approve join and cancel requests | Pause and resume, switch, change price, date or credits, Send plan, Fix billing, upcoming renewals | Leads pipeline, migrating from other platforms |
| **Payments** | Razorpay Subscriptions (UPI AutoPay and card), Razorpay Orders for packs, webhooks, payout and platform fee | eNACH, prorated switches | Stacking promo codes with intro offers |

## Open questions

1. **Coverage unit.** peakst8's unit is `Event` plus `Category`. Do recurring club runs exist as one event per session (one event a week) or as one multi-day event? Usage counting by event date assumes one registration per session.
2. **Registration uniqueness.** `@@unique([eventId, userId])` means one booking per event per member. Is that right for weekly sessions that are modelled as one event?
3. **Who carries mandate risk.** If a renewal fails after the member has already booked sessions in the new period, do those bookings stand?
4. **Platform fee on plans.** Is it the same `platformFeePercentage` as tickets, or a separate rate for recurring revenue?
5. **Refund rules.** Are partial-period refunds allowed or only full ones? Who can refund (club host only, or peakst8 admin too)?
6. **Naming in the app.** SweatPals renamed "Memberships" to "Plans". Which does peakst8 show: **Plans**, **Memberships** or **Passes**?
7. **Pilot clubs.** Which 2 or 3 clubs, and at what price points?

## Evidence

**SweatPals help centre (read 1 Nov 2026):** [3.1 Joining a Membership](https://help.sweatpals.com/31-joining-a-membership) · [3.2 Billing & Payments](https://help.sweatpals.com/32-managing-your-billing-and-payments) · [3.3 Access & Cancellations](https://help.sweatpals.com/33-membership-access-and-cancellations) · [3.4 Making Use of Your Membership](https://help.sweatpals.com/34-making-use-of-your-membership) · [5.1 Membership Overview](https://help.sweatpals.com/51-membership-overview) · [5.2 Creating & Configuring](https://help.sweatpals.com/52-creating-and-configuring-memberships) · [5.2a Additional Settings](https://help.sweatpals.com/52a-additional-membership-settings) · [5.3 Managing Active Members](https://help.sweatpals.com/53-managing-active-members) · [3.4 Create a Class Pack](https://help.sweatpals.com/34-create-a-class-pack)

**SweatPals public web client** (route names from the JavaScript served on sweatpals.com community pages; no logged-in or private calls were made):

```
memberships/current?active=                         memberships/eligible-for-bookable-service/:id
memberships/public/community/:communityId           (each membership has tiers[])
memberships/public/:id                              membership-offers/public/tier/:tierId?offerId&communityId
memberships/public/user-membership/:id              …/claim · …/claim/setup-intent · …/intake-form
memberships/public/shared-membership/:id            …/claim · …/intake-form
memberships/public/guest-pass/:id                   …/claim · …/intake-form
memberships/public/payment-method-update/:id        …/setup-intent · …/complete
memberships/public/fix-billing/:id                  …/intent
membership-join-requests/my                         membership-join-requests/:id/withdraw
payments/public/plan-holders-plans {eventId, eventInstanceDate}
user/:userId/memberships                            user/:uid/membership/:id/{history,pause,renew,deactivate}
user-to-membership/:id                              wallet/v1/user-memberships/ (Apple/Google wallet pass)
UI button states (offer card): Join · Request to join · Request pending → Withdraw · Not approved · View
```

**Static analysis with REA** (`rea-agents analyze-javascript-application`, 2 Nov 2026): SweatPals' public Next.js bundles for the membership, checkout, claim, guest-pass and fix-billing pages (56 files) were analysed as inert text and never executed. The run over the 5 membership chunks recovered 1,425 webpack modules (Evidence `ev_da05d85e…`). Coverage is partial by design: 51 files were outside the selected sources, and dynamic or obfuscated paths stay unresolved. The screens and states the prototype rebuilds come from the component names and translation keys in those modules:

| SweatPals screen or state (component · translation keys) | Rebuilt in the prototype as |
| --- | --- |
| `host:offers.*` (offer card: buy, request, withdraw, not approved, view) | Club page plan cards and their five button states |
| `checkout:membershipSelector.*`, `membershipTier.billingPeriod.*`, `membershipTier.signUpFee` | Join sheet, Plan step: billing options and sign-up fee |
| `checkout:membershipOffer.*` (choose offer, continue at base price, duration) | Join sheet, Offer step |
| `checkout:membershipCheckout.commitmentDisclosure`, `commitmentPeriod.*` | Minimum commitment note and cancel block |
| `checkout:approvalInfo.requestPlan*`, `joinRequest.*` (in review, declined, withdraw) | Request step, pending card, withdraw |
| `checkout:membershipUnavailable.*`, `membershipFirstTimeOnly.*`, `membershipLimited.*` | Rules in the schema (capacity, first-timers, one per member) |
| `event:ticketBanner.memberPriceBadge*`, `event:membershipBanner.seePlansCta`, `MembersOnlyBanner`, `ChooseTickets` mode `members-only` | "Member price" on events, "See plans" prompt, plan-holders-only categories |
| `checkout:plansAndTickets.withYourPlan`, `notIncludedWithPlan`, `pickPlanError` | Choose Pass: "With your plan" and "Not included with your plan" |
| `checkout:summary.membershipDiscount`, `summary.introOffer`, `summary.renewalDiscount` | Checkout and ticket summary lines |
| `checkout:orderConfirmation.membershipTitle`, `membershipConfirmedSubtitle`, `requestPendingTitle` | "You're in. Membership confirmed." and "Request sent" |
| `checkout:membershipCard.benefitsApplyAutomatically` | Plan card in Passes → Plans |
| Pages `/claim-membership/[id]`, `/fix-billing/[id]`, `/guest-pass/[id]`, `/user-membership/[id]/intake-form`, `/embed/[alias]/membership-checkout` | Claim and fix-billing flows in the spec (fix billing is in the prototype) |

The English copy for these keys isn't in the bundles (it loads at runtime), so the prototype's wording is peakst8's own.

**peakst8 backend** (`peakst8-Basecamp/peakst8-backend`, `prisma/schema.prisma`): there are no subscription or plan models yet. Payments use Razorpay Orders (`PaymentTransaction`, `RazorpayPayment`, `RefundTransaction`). The ticket unit is `Event` → `Category` → `Registration` → `Ticket`. Approvals use `ApprovalRequest`, and waivers use `Waiver` on `Category`.

## In this folder

| Path | What it is |
| --- | --- |
| `README.md` | This note |
| `index.html` | Note page for the site |
| `prototype/index.html` | Working prototype (one self-contained page) |
| `schema-draft.prisma` | Proposed Prisma models, to merge into `peakst8-backend/prisma/schema.prisma` |
