# peakst8 Club Memberships

**A peakst8 product feature.** Clubs sell monthly memberships and prepaid run packs on peakst8, with perks and brand offers their members can see. Members pay once, keep booking each session as they do today, and the plan applies at checkout. Clubs get predictable monthly income, and their regulars get a reason to stay.

[Product note](https://peakst8-basecamp.github.io/product-notes/memberships/) · [Working prototype](https://peakst8-basecamp.github.io/product-notes/memberships/prototype/) · [Code and architecture](code/) · [Feature list](coverage/README.md) · Status: Draft · Owner: _to assign_ · updated 2 Nov 2026

## 1. The problem

Community fitness clubs on peakst8 run the same sessions every week, but they sell them one ticket at a time.

| Who | Today | What it costs them |
| --- | --- | --- |
| **Club admins** | Every weekly run is a separate event with its own ticket. Income depends on how many people book that week. Regulars who'd happily pay monthly either pay per session or pay the organiser directly, outside peakst8. **Assumption:** off-platform UPI collections are common; confirm in pilot interviews. | Unpredictable income, and no record of who the paying regulars are. Brand partnerships the club has built have nowhere to live, so they can't be used to sell anything. |
| **Regular members** | A full checkout for every session, at the same price as someone coming once. Nothing shows what being a regular is worth. | Friction every week, no reward for loyalty, an easy reason to drift to another club. |
| **peakst8** | Revenue is a platform fee on each ticket (`Club.platformFeePercentage`, 3% by default). In October 2026 the platform had 244 users and ₹3,85,203 GMV across organisers (source: "Organiser and Event Summary – October" sheet). | GMV moves with each week's bookings. When clubs collect memberships off-platform, peakst8 loses both the revenue and the member relationship. |

SweatPals, a US community-fitness platform, built exactly this and treats it as core: "Plans create predictable revenue and simplify member access across all experiences" (SweatPals help centre 5.1). We reverse-engineered their feature in full; see the [feature list](coverage/README.md).

## 2. Who it's for

| | Who | What they're trying to get done | What they need from this |
| --- | --- | --- | --- |
| **Primary: club admins** | Founders and community leads of social fitness clubs in Indian metros that run recurring sessions: run clubs (Find Your Fit), women's collectives (Sisters in Sweat), strength and HIIT groups, yoga and pilates collectives. Many already have brand partners. | Run the community without chasing money every week; reward regulars; show partners they have an engaged audience. | Plans they set up themselves for their own audience, perks and brand offers they control, discounts they can switch on, and money that arrives in the weekly payout. |
| **Primary: regular members** | People who come 4 to 12 times a month. | Show up without paying every time; feel like part of the club. | One payment, no surprise charges, and a clear view of what the plan gives them (savings, early access, guest passes, brand perks). |
| **Secondary** | Club staff and co-hosts; brand partners; peakst8 ops and finance. | Check people in and approve requests; reach the club's members; pay out and invoice correctly. | Approval queues and guest-pass redemption; a perks listing with reveal counts; plan revenue in the existing payout and platform-fee reports. |
| **Not for (yet)** | One-off races and festivals; passes across several clubs; studios that need 1:1 appointment booking. | | Single tickets already work for races. Network passes and appointments need separate decisions. |

**Two people to design for** (illustrative, based on our pilot clubs):

- **The club founder.** Runs a 400-member weekly run club with two volunteers. Has a coffee shop and a running store happy to give members a discount. Wants 100 regulars on a monthly plan so the club can pay pacers and book a track, and wants a page to point partners and new runners to.
- **The regular.** Runs with the club twice a week. Pays ₹299 each Saturday and ₹249 each Tuesday. Would pay ₹1,499 a month if it meant no checkout, a free coffee after the long run, and booking the monthly 10K before it sells out.

## 3. Why now

- **The clubs are already on peakst8 checkout.** The Embedded Ticketing pilots (Find Your Fit, Sisters in Sweat) run their bookings through peakst8, so a plan can apply to bookings they already take.
- **Recurring payments work in India now.** Razorpay Subscriptions supports UPI AutoPay, cards and eNACH, and peakst8 already uses Razorpay.
- **The backend has the pieces.** Scheduled jobs, the email outbox, WhatsApp and push notifications exist; memberships add models and rules on top, not new infrastructure.
- **The model is proven.** SweatPals runs it for thousands of communities, and its design gives us a tested starting point.
- **Waiting has a cost.** Every month a club collects memberships off-platform is a month of members and revenue peakst8 doesn't see.

## 4. What we're building

1. **Club admins create plans** for their own audience: a monthly or quarterly membership, or a prepaid pack of runs. They choose what it covers, how often it can be used, the price, who can buy it, and the rules (approval, capacity, cancellation).
2. **Club admins set the plan price on each pass**: free, half price, or a custom amount off. That decides what a member pays at checkout.
3. **Members join from the club page.** They pay once (a UPI AutoPay mandate for monthly plans) or request approval first. The plan sits in the app under Passes.
4. **Members book sessions exactly as today.** Checkout sees the plan, applies the member price and records one use. At ₹0, there's no payment step.
5. **Renewals are never a surprise.** A reminder goes out before every charge, a receipt after it, and a fix-payment link if it fails. Cancelling is in the member's hands (or the club reviews it, if the club chooses).
6. **Members see what they get.** Savings so far, early booking, guest passes for friends, and the club's brand perks on a listing page anyone can browse. Club admins can switch on discount codes for campaigns, students or partners.

**Club admins configure all of it.** peakst8 only switches memberships on for a club and sets the platform fee. Settings sit at three levels: club (reminders, refund policy, perks page, team access), plan (pricing, coverage, audience, perks, discounts, cancellation) and pass (plan price). Full list in the [feature list](coverage/README.md#what-club-admins-control).

## 5. Goals and non-goals

**Goals**

1. Clubs earn predictable monthly income on peakst8 from their regulars.
2. Regulars book with no friction and can see the value of their plan.
3. No member is ever charged without a reminder first.
4. Club admins can run plans, perks and discounts without help from peakst8.
5. Clubs can show their brand partnerships in one place.

**Non-goals**

- Replacing single tickets. Plans sit alongside them.
- Passes that work across several clubs.
- Members pausing their own plan (only the club can pause, as in SweatPals).
- Migrating memberships from other platforms in V1.
- A leads pipeline or CRM.

## 6. How we'll know it worked

Targets are **assumptions** to confirm with the pilot clubs before launch; baselines come from the pilot clubs' last three months on peakst8.

| Metric | Baseline | Target | When | Source |
| --- | --- | --- | --- | --- |
| Share of pilot clubs' GMV from plans | 0% | 30% | 90 days after launch | Plan charges vs ticket GMV per club |
| Active plan holders per pilot club | 0 | 50 | 60 days | `UserPlan` status ACTIVE |
| Sessions per month: holders vs pay-per-session regulars | Pull from pilot data | Holders attend 1.5× | 90 days | Registrations linked to plans |
| Renewal success rate (first attempt) | n/a | 90% | Each month | Razorpay subscription charges |
| Failed renewals recovered within 7 days | n/a | 50% | Each month | Fix-billing payments |
| Monthly plan churn | n/a | Under 8% | From month 2 | Plans ended or cancelled |
| **Guardrail:** complaints or disputes about unexpected charges | 0 | 0 | Always | Support log, Razorpay disputes |
| **Guardrail:** pay-per-session checkout conversion | Pull from pilot data | No drop | 60 days | Existing registration funnel |

## 7. Key journeys

| As a … | I … | So that … | Done when |
| --- | --- | --- | --- |
| Club admin | create a monthly plan, set it to free on training runs and half price on race days, and publish it | my regulars can join | The plan shows on the club page and the right price appears at checkout on every covered pass |
| Regular | join with UPI AutoPay and book Saturday's run | I stop paying each week | Checkout shows "Free with my plan" and skips payment; the ticket shows the member discount |
| Regular | get a reminder before my renewal, then a receipt | I'm never surprised | The reminder arrives at least 24 hours before the charge, by the club's chosen channels |
| Regular | cancel from the app | I'm in control | The plan stays active until the end of the period and no further charge happens |
| Club admin | add a brand perk and choose which plans unlock it | partners reach my members | It appears on the club perks page, locked for non-members, with a reveal count I can share with the brand |
| Club admin | turn on discount codes for one plan and create a student code | I can run campaigns | Members enter the code at checkout; it shows as its own line and follows the rules I set |
| Club admin | see failed renewals and send a fix-payment link | I don't lose members to a card problem | The member pays from the link and the plan is active again |

## 8. Scope and phases

| Phase | What ships | Gate to move on |
| --- | --- | --- |
| **Before launch: renewal reminders** | Members hear before every charge, get a receipt after it, and can fix a failed payment from the message. They're warned before a payment problem and before an intro price ends. Clubs choose how members are reminded and can see what each member was told. | All 9 before-launch reminder features work end to end on staging with Razorpay test mandates |
| **V1: first pilot clubs** | Memberships and packs; plan price per pass; join, approval, pay; automatic pricing at checkout; cancel; admin plan list, members, requests, refunds. Perks: savings, early access, guest passes, brand perks and the club perks page, members-only sessions. Discount codes switched on per plan. | Two pilot clubs live with at least 20 paying holders each; no unexpected-charge complaints |
| **V2** | Several prices per plan, intro offers, joining fees, minimum commitment, shared plans, pause and switch, fix billing from the dashboard, upcoming renewals, waitlist priority, referral reward, member badge, audience discounts | V1 metrics on track at 60 days |
| **Later / not planned** | Network passes, appointments, gift cards, leads pipeline, migration from other platforms | Separate product notes |

The full list, written as what members and club admins can do, is in the [feature list](coverage/README.md).

## 9. Risks

| Risk | Likelihood | Impact | What we'll do |
| --- | --- | --- | --- |
| Members feel surprised by a renewal charge | Medium | High | Reminders are a launch prerequisite; mandatory notices can't be muted; cancel is in the app |
| UPI AutoPay mandates fail or lapse | Medium | Medium | Mandate-at-risk notice, Razorpay retries, fix-payment link, failed-payment grace setting per club |
| Weekly sessions don't map cleanly to plans | Medium | High | Decide the session model first (open question 1); usage counts by event date |
| Clubs over-discount and cut their own income | Low | Medium | Discounts off by default; can't combine with intro offers; usage caps |
| Brand perks go stale | Medium | Low | Reveal counts and an active switch per perk; review prompt each quarter |
| Payout, GST and platform fee on recurring revenue are unclear | Medium | Medium | Finance decision before V1 (open question 4) |

## 10. Open questions and decisions

| Question | Owner | Due | Decision |
| --- | --- | --- | --- |
| 1. Are weekly club runs one event per session, or one long event? (Usage counting and `@@unique([eventId, userId])` depend on it.) | Engineering | Before build | |
| 2. If a renewal fails after a member booked sessions in the new period, do those bookings stand? | Product | Before V1 | |
| 3. Do refunds cover part of a period, or only full charges? Who can issue them? | Product + finance | Before V1 | |
| 4. Platform fee on plans: the same rate as tickets, or a separate rate for recurring revenue? | Finance | Before V1 | |
| 5. What the app calls it: Plans, Memberships or Passes? | Product | Before design | |
| 6. Which two pilot clubs, and at what prices? | Partnerships | Before V1 | |
| 7. Does Razorpay send its own pre-debit notice for UPI AutoPay, and does ours replace or add to it? | Engineering | Before prerequisite | |
| Renewal reminders ship before memberships go live | Product | | **Decided** 2 Nov 2026 |
| Club admins configure plans, perks and discounts for their own audience | Product | | **Decided** 2 Nov 2026 |

## 11. Build

| What | Where |
| --- | --- |
| Working prototype (club page with Gold, Silver and Bronze levels, brand perks wall, admin dashboard with charts) | [prototype/](https://peakst8-basecamp.github.io/product-notes/memberships/prototype/) |
| Code for the engineer to pick up, and the architecture | [code/](code/) · [code/ARCHITECTURE.md](code/ARCHITECTURE.md) |
| Feature list (what members and club admins can do, by phase) | [coverage/](coverage/README.md) |
| Database schema draft (validated against the backend schema) | [code/backend/prisma/memberships.prisma](code/backend/prisma/memberships.prisma) |

## Appendix

**How we know what SweatPals built.** Nine SweatPals help-centre articles (read 1 Nov 2026) and static analysis of their public web bundles with REA on 2 Nov 2026: 56 files read as inert text, never executed, recovering the membership routes, components and screen states. Details and limits are in [code/ARCHITECTURE.md § Evidence](code/ARCHITECTURE.md#evidence).

**In this folder**

| Path | What it is |
| --- | --- |
| `README.md` | This product note |
| `index.html` | The note as a page on the site |
| `prototype/` | Working prototype (one self-contained page) |
| `coverage/` | Feature list: `features.json` (source), `build.py`, generated `README.md` and `index.html` |
| `code/` | Code package and `ARCHITECTURE.md` for engineering |
