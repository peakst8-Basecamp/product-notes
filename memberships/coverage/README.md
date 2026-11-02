# Memberships: what we reverse-engineered

**Part of [peakst8 Club Memberships](../README.md).** Every membership feature we found in SweatPals, one row each, with who configures it on peakst8, the setting it maps to, the phase it ships in, and whether the [prototype](https://peakst8-basecamp.github.io/product-notes/memberships/prototype/) already does it. Use it as the checklist so nothing gets dropped.

[Page](https://peakst8-basecamp.github.io/product-notes/memberships/coverage/) · [Data](features.json) · Internal · updated 2 Nov 2026

## At a glance

- **132 features** across 13 areas.
- **Launch prerequisite:** 12 renewal-reminder features must ship before memberships go live.
- **Phase:** V1 74 · V2 32 · Later 10 · not planned 4.
- **Configured by:** club admins 90 · members 8 · system 31 · peakst8 admin 3.
- **In the prototype today:** 68 of 132.

## Launch prerequisite: renewal reminders

Renewal reminders are their own feature type, built and shipped before memberships go live for any club. A club can't sell a recurring plan until every row marked Launch prerequisite works end to end.

| Why | |
| --- | --- |
| **Regulation** | RBI's e-mandate rules require a pre-debit notice at least 24 hours before each recurring charge, and a notice after it. Without them, UPI AutoPay and card mandates can't be used. |
| **Trust** | SweatPals sends a notice 24 hours before every renewal. Members who are charged without warning dispute the charge, which costs the club the member and the fee. |
| **Recovery** | Failed renewals are only recovered if the member hears about it with a fix-billing link the same day. |
| **What exists today** | The backend has scheduled jobs (BullMQ upsertJobScheduler), the outbound email outbox, WhatsApp campaigns and Firebase push. NotificationDelivery is tied to registrations and has one type (ABANDONED_CART), so reminders get their own PlanReminderDelivery model and ClubMembershipSettings (see schema-draft.prisma). |

The 12 prerequisite features are listed first in the inventory, under **R. Renewal reminders**.

## The rule: club admins configure it for their audience

Nothing about a plan is fixed by peakst8. Each club's admins decide what they sell, to whom, at what price and on what terms. peakst8 sets only the platform fee and switches the feature on per club. Settings live at three levels, and a lower level never needs to repeat a higher one.

### Club settings

Dashboard → Settings → Memberships. One set per club; every plan inherits them.

| Setting | What the club admin chooses |
| --- | --- |
| **Plans section** | Show plans to everyone or to club members only; section title; plan order |
| **Renewal reminders** | When reminders go out (the 24-hour pre-debit notice is fixed; add e.g. 3 days, or 7 days for yearly), channels (push, email, WhatsApp on the club's credits), send hour, and which optional reminders are on. See the Renewal reminders feature type. |
| **Credit release window** | Hours before start when a cancelled booking gives the credit back (default 12) |
| **Late cancel and no-show** | Whether a late cancel or no-show uses up the credit |
| **Failed payment grace** | Days a past-due member keeps booking before access stops (default 0) |
| **Refund policy** | Text shown at checkout and on cancel; who can refund |
| **Tax** | GST % and whether plan prices include it (from club registration) |
| **Fees** | Platform fee paid by the member or absorbed by the club |
| **See plans banner** | Optional custom line on event pages, e.g. 'Members run free' |
| **Brand perks** | The club's brand partnerships for its perks page: partner, category, offer, code, how to redeem, shown to everyone or members only, and which plans unlock each |
| **Discount codes** | Codes with % or ₹ off, the plans they apply to, first payment or every charge, max uses and expiry; switch any code off |
| **Team** | Which club admins can create plans, change prices, refund and pause |

### Plan settings

Dashboard → Plans → Create or edit. One set per plan.

| Setting | What the club admin chooses |
| --- | --- |
| **Basics** | Membership or pack, name, description, cover |
| **Pricing** | One or more prices: interval or one-time validity, joining fee, intro offer |
| **Coverage** | Event types or specific events; usage limit and period; roll-over |
| **Audience** | Everyone · first-timers · past attendees (N runs) · profile rule from the club's own form fields (e.g. women only, students, a company email domain) · invite list |
| **Access rules** | Approval required, capacity, one per member, unlisted, featured |
| **Perks** | Early access hours, guest passes per period and who can receive them, which partner perks it unlocks, members-only sessions, WhatsApp group |
| **Sharing** | Shareable seats |
| **Discounts** | Whether the plan takes discount codes (off by default); codes are created under Dashboard → Discounts |
| **Forms** | Waiver and questionnaire at purchase |
| **Exit** | Cancellation policy (member cancels, or club reviews) and minimum commitment |

### Pass settings

Event editor → each pass. One row per plan.

| Setting | What the club admin chooses |
| --- | --- |
| **Plan price** | Free · half · full · custom % or ₹ off · no benefit |
| **Plan holders only** | Only holders of chosen plans can book this pass |

### Who can do what

| Role | Can |
| --- | --- |
| **Club owner / admin (Host on the club)** | Everything below, plus create, edit, archive plans; prices; refunds; team access |
| **Club staff (co-host, EventHost)** | See holders on their events; redeem guest passes at check-in; no prices or refunds |
| **peakst8 admin** | Switch Memberships on for a club; set the platform fee on plans; support refunds |
| **Member** | Join, book, share seats and send guest passes if the plan allows, cancel per policy |

## Where the evidence came from

| Label | Meaning |
| --- | --- |
| Help centre | SweatPals help articles 3.1–3.4, 5.1–5.4, 3.4 (class packs), 6.x, 8.5 (read 1 Nov 2026) |
| Web code | Route names, component names and translation keys in SweatPals' public web bundles, analysed with REA as inert text on 2 Nov 2026 (Evidence `ev_da05d85e…`) |
| Help + code | Both sources agree |
| Inferred | Follows from what we saw, not stated directly |
| peakst8 proposal | Not in SweatPals; added because club admins need it |

## Inventory

### R. Renewal reminders (17) · launch prerequisite

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Pre-debit notice before every recurring charge** | Notification 24 hours before each renewal | Help + code: Help 3.3 | System | PLAN_REMINDER_TYPE.PRE_DEBIT, at least 24 h before PlanCharge due; required for RBI e-mandates | Launch prerequisite | ✓ |
| **Reminder schedule** | Fixed at 24 hours | peakst8 proposal: Help 3.3 | Club admin | ClubMembershipSettings.reminderOffsets, e.g. 3 days + 1 day; 7 days for quarterly and yearly prices. The 24 h notice can't be switched off | Launch prerequisite | – |
| **Channels and fallback** | App notification and email | peakst8 proposal: Help 3.3, 5.3 | Club admin | ClubMembershipSettings.reminderChannels: push, email, WhatsApp (uses club credits); email always sent as the record | Launch prerequisite | – |
| **Send time and quiet hours** | Renewal timestamps follow the org time zone | Help centre: Help 5.2 (limitations) | Club admin | ClubMembershipSettings.reminderSendHour in IST (default 9 AM); never between 9 PM and 8 AM | Launch prerequisite | – |
| **What the reminder says** | Not visible (copy loads at runtime) | peakst8 proposal: — | System | Club name, plan, amount, charge date, masked UPI/card, intro-to-full-price change, Manage and Cancel links | Launch prerequisite | – |
| **Renewal receipt** | Confirmation email and receipt | Help + code: Help 3.1; payment-files/user-membership/ | System | PLAN_REMINDER_TYPE.CHARGED after subscription.charged: amount, period, next date, receipt | Launch prerequisite | – |
| **Payment failed notice** | Automatic 'Payment Failed' email to resolve billing | Help centre: Help 5.3 | System | PLAN_REMINDER_TYPE.PAYMENT_FAILED with fix-billing link; repeated on each Razorpay retry | Launch prerequisite | ✓ |
| **Mandate at risk** | Upcoming billings flags at-risk charges and no card on file | Help centre: Help 5.3 | System | PLAN_REMINDER_TYPE.MANDATE_AT_RISK before the charge: mandate cancelled, expired or card expiring, with update link | Launch prerequisite | – |
| **Intro offer ending** | Intro rate then auto-enrols at the regular rate | Inferred: Help 5.2 | System | PLAN_REMINDER_TYPE.INTRO_ENDING before the first full-price charge (with the pre-debit notice) | Launch prerequisite | – |
| **Mandatory vs optional reminders** | Not seen | peakst8 proposal: — | System | Pre-debit, charged and failed can't be muted; the rest follow the member's notification settings | Launch prerequisite | – |
| **Reschedule on change** | Not seen | peakst8 proposal: — | System | Pause, resume, billing-date change, price change and cancel recompute or cancel queued reminders; one per charge, type and channel | Launch prerequisite | – |
| **Delivery log** | Not seen | peakst8 proposal: — | Club admin | PlanReminderDelivery rows shown on the member's plan history; retries with attempt count | Launch prerequisite | – |
| **Pack expiry reminder** | Members track remaining credits and expiry | Inferred: Help 3.4 (classes) | Club admin | PLAN_REMINDER_TYPE.PACK_EXPIRING, e.g. 7 days and 1 day before, with credits left | V1 | – |
| **Access ending after cancel** | Access continues to period end; rejoin from the community page | Inferred: Help 3.3 | System | PLAN_REMINDER_TYPE.ACCESS_ENDING 3 days before, with a rejoin link | V1 | – |
| **Host renewal digest** | Upcoming billings: renewals, at risk, projected revenue | Help centre: Help 5.3 | Club admin | Daily email to club admins: tomorrow's renewals, at-risk mandates, failed payments | V1 | – |
| **Low credits** | Remaining credits shown in membership details | Inferred: Help 3.4 | Club admin | PLAN_REMINDER_TYPE.LOW_CREDITS when 1–2 bookings are left in the period | V2 | – |
| **Pause ending** | Pause until a set date | Inferred: Help 5.3 | System | PLAN_REMINDER_TYPE.PAUSE_ENDING before billing restarts | V2 | – |

### P. Member perks (19)

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Members-only sessions** | Members-only events with their own banner, title bar and card label | Web code: event:membersOnlyBanner.*, titleBar.membersOnly, common:eventCard.planHoldersOnly, ChooseTickets mode members-only | Club admin | Category.isPlanHoldersOnly | V1 | – |
| **Guest passes** | Per cycle count, eligible experiences, first-time or anyone; QR or link | Help + code: Help 3.4, 5.2a; public/guest-pass/:id/claim; event:ticketBanner.guestPassFree | Club admin | Plan.guestPassesPerCycle, guestEligibility; GuestPass with claim link | V1 | ✓ |
| **Redeem guest pass at check-in** | Staff add attendee with a guest pass | Help centre: Help 5.2a | Club admin | Check-in: add attendee → guest pass | V1 | – |
| **Partner perks** | Perks section locked for guests, unlocked for members; searchable | Help + code: Help 3.4; community-perks/*; host:perks.locked* | Club admin | ClubPerk (brand, category, offer, code, how to redeem) unlocked by chosen plans; listed on the club perks page | V1 | ✓ |
| **Members WhatsApp group** | Creates a chat and adds everyone who buys | Help centre: Help 3.4 (class pack) | Club admin | Plan.whatsappGroupInviteUrl | V1 | – |
| **Savings shown to the member** | Membership discount line on each booking | Inferred: checkout:summary.membershipDiscount | System | Plan card: 'You saved ₹X this period' and since joining, from PlanUsage.amountSaved | V1 | ✓ |
| **Value recap with each renewal** | Not seen | peakst8 proposal: — | System | Renewal receipt (CHARGED reminder) lists runs, savings and perks used last period | V1 | – |
| **Early access booking** | Not seen beyond members-only events | peakst8 proposal: — | Club admin | Plan.earlyAccessHours: holders book before Event.publicOpensAt; others see when it opens | V1 | ✓ |
| **Waitlist priority** | Waitlist exists; no member priority seen | peakst8 proposal: event:waitlist.* | Club admin | Plan.waitlistPriority: holders move ahead when a spot opens | V2 | – |
| **Perks each plan includes** | Perks described per plan under the Memberships tab | Help centre: Help 3.4 | Club admin | Plan settings → Perks: early access, guest passes per cycle, partner perks, WhatsApp group | V1 | ✓ |
| **Perks shown on the club page** | Perks section, searchable, locked for guests | Help + code: Help 3.4; host:perks.* | Club admin | Club page → Member perks; locked with 'Join a plan to unlock' | V1 | ✓ |
| **Referral reward** | Referral discount line at checkout | Web code: checkout:summary.referralDiscount | Club admin | Member gets a free week (or ₹ off next renewal) when a friend they invited joins a plan | V2 | – |
| **Member badge** | 'Pro member' style badge on profiles | Inferred: host:info.proMember | Club admin | Badge on athlete lists, leaderboards and Strava challenges | V2 | – |
| **Race photos first** | Not seen | peakst8 proposal: — | Club admin | Holders get face-search photo results before public release | V2 | – |
| **Streaks and milestones** | Not seen | peakst8 proposal: — | Club admin | Monthly run streaks, 25/50/100-run milestones and member anniversary, tied to medals | V2 | – |
| **Club perks page** | Perks section on the community profile, searchable; locked for guests | Help + code: Help 3.4; host:perks.title, searchPlaceholder, lockedGuest, lockedMember | Club admin | A small listing page per club: every brand perk with logo, category and offer; shareable link | V1 | ✓ |
| **Perk categories and search** | Searchable perks list with 'no matches' state | Web code: host:perks.searchAriaLabel, noMatches | Club admin | ClubPerk.category (gear, nutrition, food and drink, recovery, wearables) with filter chips and search | V1 | ✓ |
| **Perk visibility** | Locked perks shown to guests and members without the right plan | Web code: host:perks.lockedGuest, lockedMember | Club admin | ClubPerk.visibility: show as a teaser to everyone, or members only; code revealed only to unlocking plans | V1 | ✓ |
| **Perk redemption count** | Not seen | peakst8 proposal: — | Club admin | Count each 'Reveal code' tap per perk, shown to the club to report back to brands | V2 | ✓ |

### A. Plan types and pricing (16)

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Membership plan** | Recurring or prepaid access to selected experiences | Help centre: Help 5.1, 5.2 | Club admin | Plan.kind = MEMBERSHIP | V1 | ✓ |
| **Class pack** | Prepaid number of bookings, one-time or recurring | Help centre: Help 3.4 (classes), 5.1 | Club admin | Plan.kind = PACK, usageLimit | V1 | ✓ |
| **Several prices per plan (tiers)** | A plan returns tiers[], each a price option | Web code: memberships/public/community/:id → tiers | Club admin | PlanPrice (many per plan) | V2 | ✓ |
| **Billing intervals** | One-time, weekly, monthly, every 4 weeks, quarterly, semi-annual, annual | Help + code: Help 5.1; checkout:membershipTier.billingPeriod.* | Club admin | PlanPrice.interval | V1 | ✓ |
| **One-time validity** | Never expires, from purchase, from first use, fixed duration | Help centre: Help 5.2, 3.4 | Club admin | PlanPrice.validity, validityDays, validUntil | V1 | ✓ |
| **Intro offer** | Discounted first period, once per member; rejoining pays full price | Help + code: Help 5.2; membership-offers/public/tier/:id; checkout:membershipOffer.*, membershipCard.introOffer* | Club admin | PlanIntroOffer | V2 | ✓ |
| **Offer badges and countdown** | Discount, percent off, special price, exclusive badges; offer ends-in timer | Web code: checkout:membershipOffer.*Badge, priceTier.specialOfferEndsIn | Club admin | PlanIntroOffer.badge, endsAt | Later | – |
| **Sign-up (initiation) fee** | One-time fee with the first payment | Help + code: Help 5.2; checkout:membershipTier.signUpFee | Club admin | PlanPrice.joiningFee | V2 | ✓ |
| **Discount codes on plans** | Promo codes at plan checkout; the discount applies to the first payment only | Help centre: Help 3.3 | Club admin | Plan.allowDiscountCodes (club admin turns it on per plan) + Coupon linked to plans (CouponToPlan) | V1 | ✓ |
| **Discount applies to** | Promo discount only on the initial payment; full price on renewal | Help centre: Help 3.3 | Club admin | Coupon.appliesTo: FIRST_CHARGE · EVERY_CHARGE · FIRST_N_CHARGES (e.g. student rate every month) | V1 | ✓ |
| **Discount limits** | Coupons can stack with intro price unless planned; avoid heavy stacking | Help centre: Help 5.2 (limitations) | Club admin | Max uses, expiry, one per member; can't combine with an intro offer | V1 | ✓ |
| **Audience discounts** | Not seen | peakst8 proposal: — | Club admin | A discount only for an audience (students, women, a company): ties a Coupon to a plan audience rule | V2 | – |
| **Discount shown at checkout** | Custom, offer and referral discount lines in the summary | Web code: checkout:summary.customDiscount, offerDiscount, referralDiscount | System | 'Discount (CODE) −₹X' line on the plan review and receipts | V1 | ✓ |
| **Proration on join** | Aligns new member billing to the cycle | Help centre: Help 5.2 (pricing structure) | Club admin | Club setting: align renewals to a billing day | Later | – |
| **Tax on plans** | Sales tax integration | Help + code: Help 6.7; checkout:summary.fees.salesTax | Club admin | PlanPrice.isAmountInclusiveGST + club GST % | V1 | – |
| **Fees shown at checkout** | Service, processing and transaction fee lines; host can absorb fees | Web code: checkout:summary.fees.*; user.isHostAbsorbsFee | Club admin | Plan charges platform fee to member or club (like Category.chargePlatformFeeToUser) | V1 | – |

### B. Coverage and usage (9)

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Coverage by experience type** | Tick events, classes, retreats (and appointments) the plan covers | Help centre: Help 5.2 (booking pools) | Club admin | PlanCoverage.eventType | V1 | ✓ |
| **Coverage by specific experiences** | Selected classes or events only; bundles | Help centre: Help 5.2 (access control) | Club admin | PlanCoverage.eventId | V1 | – |
| **Appointments coverage** | Plans apply to 1:1 appointments with their own limits | Help centre: Help 5.2a | Club admin | Out of scope until peakst8 has appointments | Not planned | – |
| **Usage limits** | Unlimited, N total, or N per day, week, month or year | Help + code: Help 5.2; checkout:membershipLimited.* | Club admin | Plan.limitPeriod, usageLimit | V1 | ✓ |
| **Roll over unused bookings** | Unused bookings carry into the next period | Help centre: Help 5.2 | Club admin | Plan.rollOverUnused | V2 | – |
| **Limits reset per period** | Booking limits reset on the recurring period | Help centre: Help 5.2 | System | Counted by event date per period | V1 | ✓ |
| **Plan price per pass** | Can join free, half, full, custom $ or % | Help centre: Help 5.2 | Club admin | CategoryPlanPolicy | V1 | ✓ |
| **Apply to existing experiences** | Set the plan price on all published experiences at once | Help centre: Help 5.2 | Club admin | Bulk write of CategoryPlanPolicy on publish | V1 | ✓ |
| **Day pass included in plan** | Day passes show as included for plan holders | Web code: host:dayPass.includedInPlan, /day-pass/[id] | Club admin | Coverage of a day-pass category | Later | – |

### C. Audience and visibility (9)

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Published or unlisted** | Unlisted hides from the page; link still works; holders keep access | Help centre: Help 5.2 | Club admin | Plan.isUnlisted / isPublished | V1 | ✓ |
| **Featured plan** | Pins the plan first in the list | Help centre: Help 5.2 | Club admin | Plan.isFeatured, order | V1 | ✓ |
| **Capacity** | Maximum active holders; sold-out state | Help + code: Help 5.2; checkout:membershipUnavailable.soldOut* | Club admin | Plan.capacity | V2 | – |
| **First-time customers only** | Only net-new members can see and buy | Help + code: Help 5.2; checkout:membershipFirstTimeOnly.* | Club admin | Plan.isFirstTimeOnly (audience rule) | V2 | – |
| **One purchase per member** | Blocks a second purchase; 'already has membership' state | Help + code: Help 5.2; checkout:membershipUnavailable.alreadyHasMembership* | Club admin | Plan.isOnePerMember | V1 | – |
| **Approval required** | Host reviews each request before joining | Help + code: Help 5.2; membership-join-requests/* | Club admin | Plan.isApprovalRequired | V1 | ✓ |
| **Embeddable plan list and checkout** | Plan list and membership checkout widget on the host's own site | Web code: /embed/[alias]/membership-list(-v2), membership-checkout(/widget), buy-membership | Club admin | Embedded Ticketing (note 1) adds a plans widget | Later | – |
| **Audience segments** | Not seen in SweatPals beyond first-timers and approval | peakst8 proposal: peakst8 proposal | Club admin | Plan.audience: everyone · first-timers · past attendees (N runs) · profile rule from club form fields (e.g. women only, student, company email) · invite list | V2 | – |
| **Who sees the Plans section** | Not seen; plans are on the public community page | peakst8 proposal: peakst8 proposal | Club admin | Club setting: Plans visible to everyone or club members only; section title and order | V1 | – |

### D. Joining and checkout (11)

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Plan card button states** | Join · Request to join · Request pending, withdraw · Not approved · View | Web code: host:offers.*Label; 4509 chunk | System | Derived from UserPlan and PlanJoinRequest | V1 | ✓ |
| **Plan selector and details** | Pricing section, inclusions, 'more inclusions' | Web code: checkout:membershipSelector.*, membershipCard.pricingSection, moreInclusions | Club admin | Plan description and coverage text | V1 | ✓ |
| **Choose an offer step** | Pick the intro offer or continue at base price; skip | Web code: checkout:membershipOffer.chooseOfferTitle, continueAtBasePriceCta | Member | Join flow step | V2 | ✓ |
| **Commitment disclosure** | Checkout disclaimer in weeks, months or years | Web code: checkout:membershipCheckout.commitmentDisclosure | Club admin | Plan.minCommitmentCycles | V2 | ✓ |
| **Waiver at checkout** | Sign or initial a waiver; minors' legal names | Help + code: Help 5.2; checkout:waiver.* | Club admin | Plan.waiverId (reuse Waiver) | V1 | ✓ |
| **Questionnaire / intake form** | Custom questions at purchase; intake form for sent and shared plans | Help + code: Help 5.2; checkout:intakeForm.*; /user-membership/[id]/intake-form | Club admin | Plan.customForm (reuse CustomForm) | V1 | ✓ |
| **Approval info screen** | Explains request plan, instant updates, good match | Web code: checkout:approvalInfo.requestPlan* | System | Request step copy | V1 | ✓ |
| **Join request lifecycle** | In review, declined (membership copy), withdraw dialog, withdrawn toast | Web code: checkout:joinRequest.*; WithdrawJoinRequestDialog | Member | PlanJoinRequest | V1 | ✓ |
| **Order confirmation** | Membership confirmed; request pending variants | Web code: checkout:orderConfirmation.membership*, requestPending* | System | Confirmation screen | V1 | ✓ |
| **Express payment** | Apple Pay / Google Pay style express checkout | Web code: checkout:payment.express | System | Razorpay UPI intent / saved methods | V1 | ✓ |
| **Mandate at signup** | Card saved for renewals (Stripe) | Help centre: Help 3.1, 3.2 | System | Razorpay Subscription: UPI AutoPay, card or eNACH | V1 | ✓ |

### E. Booking with a plan (9)

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Benefits apply automatically** | Members still book each experience; plan applies at checkout | Help + code: Help 3.1, 3.4; checkout:membershipCard.benefitsApplyAutomatically | System | Pricing rule in proceedToPayment | V1 | ✓ |
| **Eligible plans lookup** | Server returns the member's plans valid for an experience and date | Web code: memberships/eligible-for-bookable-service/:id; payments/public/plan-holders-plans | System | GET /plans/me/eligible | V1 | ✓ |
| **Member price badge** | Member price or free badge on the ticket banner | Web code: event:ticketBanner.memberPriceBadge(Free) | System | Event page | V1 | ✓ |
| **See plans banner** | Prompts non-members; best or uniform % off; per-club copy overrides | Web code: event:membershipBanner.*, checkout:membershipBanner.* (incl. overrides.*) | Club admin | Club setting: banner text (optional override) | V1 | ✓ |
| **With your plan / not included** | Pass list marks what the plan covers; pick-plan error | Web code: checkout:plansAndTickets.* | System | Choose Pass step | V1 | ✓ |
| **Membership discount line** | Summary shows membership discount and intro or renewal discount | Web code: checkout:summary.membershipDiscount, introOffer, renewalDiscount | System | Checkout and ticket summary | V1 | ✓ |
| **Discount type on ticket** | Ticket records membership or guest pass as its discount type | Web code: checkout:ticket.discountType.* | System | Registration.appliedUserPlanId; GuestPass.registrationId | V1 | ✓ |
| **Credit back on cancel** | Inferred from usage limits and cancellation flows | Inferred: Help 5.2, 3.3 | Club admin | Club setting: hours before start to release the credit; late cancels keep it | V1 | ✓ |
| **Members going** | Shows which members are going | Web code: event:membersGoing.* | Club admin | Reuse athlete list (Event.hideAthleteList) | Later | – |

### F. Member plan management (6)

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Plans in Passes** | Status, renewal date, details, remaining credits, shared with | Help centre: Help 3.3, 3.4 | Member | Passes → Plans | V1 | ✓ |
| **Plan history** | Event history per membership | Web code: user/:uid/membership/:id/history | System | UserPlanEvent | V1 | ✓ |
| **Receipts** | Downloadable receipt files per membership | Web code: payment-files/user-membership/ | System | Reuse invoice/receipt email (ERP sync) | V1 | – |
| **Wallet pass** | Add membership to Apple or Google Wallet | Web code: wallet/v1/user-memberships/; common:actions.addToWallet | Member | Wallet pass for plans | Later | – |
| **Update payment method** | App only for members; tokenised update link | Help + code: Help 3.2; memberships/public/payment-method-update/:id | Member | Change UPI/card mandate link | V2 | – |
| **Upgrade or downgrade** | Member cancels and joins the new plan | Help centre: Help 3.3 | Member | Cancel + join; host Switch plan | V1 | ✓ |

### G. Sharing (2)

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Shared plan** | Holder invites people by email or phone; seats; claim with intake form | Help + code: Help 3.4, 5.2a, 5.3; public/shared-membership/:id/claim | Club admin | Plan.isShareable, shareSeats; PlanShare | V2 | – |
| **Host shares a member's plan** | Add from members or new customer; resend or revoke | Help centre: Help 5.3 | Club admin | Members → plan → Share plan | V2 | – |

### H. Host member management (12)

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Members tab with plan status** | Contact, attendance, plan, status, billing cycle | Help centre: Help 5.3 | Club admin | Dashboard → Members | V1 | ✓ |
| **Pause and resume** | Stops billing and access; keeps price and credits; extends end date; host only | Help + code: Help 5.3; user/:uid/membership/:id/pause | Club admin | UserPlan PAUSED | V2 | ✓ |
| **Cancel or refund** | Refund then keep active, cancel now or pause | Help centre: Help 5.3 | Club admin | Refund via Razorpay; UserPlan action | V1 | ✓ |
| **Change billing date** | This cycle or all; optional extra charge | Help centre: Help 5.3 | Club admin | UserPlan action | V2 | – |
| **Change credits** | Set remaining uses in the current cycle | Help centre: Help 5.3 | Club admin | UserPlan.creditsOverride | V2 | ✓ |
| **Change price** | This cycle or all future cycles | Help centre: Help 5.3 | Club admin | UserPlan.priceOverride | V2 | – |
| **Switch plan** | Move a member to another plan with optional charge | Help centre: Help 5.3 | Club admin | UserPlan source SWITCHED | V2 | – |
| **Send plan** | Free, free for a period, or full payment; claim link | Help + code: Help 5.2a; public/user-membership/:id/claim(/setup-intent) | Club admin | Plans → Send plan | V2 | – |
| **Profile and payment update link** | QR or link to update profile, merge duplicates, payment method | Help + code: Help 5.3; profile-completion/* | Club admin | Member link | Later | – |
| **Set phone number, reissue profile email** | For migrated or locked-out members | Help centre: Help 5.3 | Club admin | Member admin actions | Later | – |
| **Member notes** | Team-only notes per member | Help centre: Help 5.3 | Club admin | Member notes | Later | – |
| **Approve join and cancel requests** | Review queues | Help centre: Help 5.2, 5.2a | Club admin | Dashboard → Requests | V1 | ✓ |

### I. Billing and recovery (8)

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Automatic renewal** | Charges the default method on the billing date | Help centre: Help 3.3 | System | Razorpay subscription.charged | V1 | ✓ |
| **Retries on failure** | Up to 3 automatic retries | Help centre: Help 5.3 | System | Razorpay retries; club sets grace days | V1 | – |
| **No cancel while past due** | A failed renewal can't be cancelled; support stops retries | Help centre: Help 5.3 | System | Rule on PAST_DUE | V1 | ✓ |
| **Fix billing (host)** | View attempts; charge this cycle, prorated, or custom; card, reader, QR, link | Help centre: Help 5.3 | Club admin | Members → Fix billing | V2 | ✓ |
| **Fix billing (self-serve)** | Public page to pay the outstanding renewal | Web code: /fix-billing/[userToMembershipId]; memberships/public/fix-billing/:id(/intent) | Member | Fix-billing link | V1 | ✓ |
| **Upcoming billings** | Renewals list, at risk, no card on file, projected revenue | Help centre: Help 5.3 | Club admin | Dashboard → Upcoming renewals | V2 | – |
| **Refunds** | Host policy; 3–5 business days | Help centre: Help 3.3, 5.3 | Club admin | Club refund policy text; Razorpay refund | V1 | – |
| **Payouts and platform fee** | Funds to host's Stripe; host can absorb fees | Help + code: Help 6.1; user.isHostAbsorbsFee | peakst8 admin | Weekly payout; platform fee % on plans (peakst8 admin) | V1 | – |

### J. Cancellation and lifecycle (7)

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Cancellation policy** | Cancel automatically or review each request | Help centre: Help 5.2, 5.2a | Club admin | Plan.cancellationPolicy | V1 | ✓ |
| **Minimum commitment** | Weeks, months or years before a member can cancel | Help centre: Help 5.2a | Club admin | Plan.minCommitmentCycles | V2 | ✓ |
| **Access after cancel** | Recurring: to period end. Pack: until credits expire | Help centre: Help 3.3 | System | CANCELS_AT_PERIOD_END | V1 | ✓ |
| **Host cancels at discretion** | Host can cancel without notice | Help centre: Help 3.3 | Club admin | Members → Cancel now | V1 | ✓ |
| **Discontinue a plan** | Unlist to grandfather current price, or cancel and move members | Help centre: Help 5.2 | Club admin | Plan.isArchived | V1 | – |
| **Pause on one-time plans** | Doesn't extend expiry; host edits the date | Help centre: Help 5.3 | Club admin | Rule on PACK pause | V2 | – |
| **Rejoin after cancel** | Sign up for a new plan from the community page | Help centre: Help 3.3 | Member | Join again (no intro offer) | V1 | ✓ |

### K. Growth and operations (7)

| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |
| --- | --- | --- | --- | --- | --- | --- |
| **Leads pipeline** | Stages, plan-purchase triggers, email/SMS, tasks, link plans to leads | Help centre: Help 5.4 (marketing) | Club admin | Not planned | Not planned | – |
| **Gift cards as payment** | Gift card balance used as tender at checkout | Web code: checkout:giftCard.tender*; gift-cards/public/* | Club admin | Not planned | Not planned | – |
| **Point of sale** | Memberships pinned for POS sales at the desk | Web code: follower.pinnedForPos.memberships; Help 6.5 | Club admin | Host sells a plan in person (Send plan → pay by link or QR) | Later | – |
| **Migration** | Stripe customer copy or re-entry, recreate subscriptions, profile completion | Help + code: Help 5.4 (migration); profile-completion/* | peakst8 admin | Not planned | Not planned | – |
| **Plan analytics** | Integrated analytics and member management | Help centre: Help 5.1 | Club admin | MRR, holders, churn, failed payments | V2 | ✓ |
| **Enable memberships per club** | Not seen (Sweatpals tiers by plan) | peakst8 proposal: peakst8 proposal | peakst8 admin | peakst8 admin switches Memberships on for a club and sets its fee | V1 | – |
| **Team permissions** | Team management roles | Help centre: Help 8.5 | Club admin | Club admins manage plans; co-hosts view holders and redeem passes | V1 | – |

## What we could not see

- Exact wording: SweatPals loads its English copy at runtime, so it isn't in the bundles. The prototype uses peakst8 copy.
- Server rules that never reach the browser: proration maths, retry timing, how ties between two plans are broken. peakst8's rules are written in the note.
- The SweatPals host dashboard: it's behind login, so host screens come from the help centre only.
- Mobile app-only flows (guest pass sending, payment methods): described in the help centre, not seen in code.
- 51 of 56 downloaded files were outside the REA run's selected sources; relationships through them are unknown.

## Updating this note

Edit [`features.json`](features.json), then run `python3 memberships/coverage/build.py` from the repo root. It rewrites this README and the data in `index.html`.
