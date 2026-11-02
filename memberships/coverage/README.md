# Memberships: feature list

**Part of [peakst8 Club Memberships](../README.md).** Everything we found in SweatPals plus what peakst8 adds, written as what members and club admins can do. Use it to agree scope: move a row's phase, cut it, or add one. How each feature is built is in [code/ARCHITECTURE.md](../code/ARCHITECTURE.md).

[Page](https://peakst8-basecamp.github.io/product-notes/memberships/coverage/) · [Data](features.json) · updated 2 Nov 2026

## At a glance

- **110 features** in 10 groups. 95 are in SweatPals; 15 are peakst8 additions.
- **Before launch** 9 · **V1** 67 · **V2** 25 · **Later** 5 · **Not planned** 4
- **For** members 55 · club admins 50 · both 5
- **Working in the prototype:** 61 of 110

## Before launch: renewal reminders

No club sells a recurring plan until members are reminded before every charge, get a receipt after it, and can fix a failed payment from the message. These ship first.

- **Members trust it.** Nobody is charged without warning, so people don't dispute charges or leave the club over one.
- **It's required.** RBI rules for UPI AutoPay and card mandates require a notice before each charge.
- **It saves members.** A failed payment caught the same day, with a link to fix it, keeps the member.

## What club admins control

Club admins set these for their own audience. peakst8 only switches memberships on for a club and sets the platform fee.

**For the club**

- Who sees the plans: everyone, or club members only
- How early and where members are reminded about renewals
- How late a member can cancel a booking and still get the run back
- How long a member has to fix a failed payment
- The refund policy members see
- The brands on the perks page
- Who on the team can change prices and give refunds

**For each plan**

- Price, how often it renews, or how long a pack lasts
- What it covers and how often it can be used
- Who can join: anyone, first-timers, a group, or by approval
- Perks: early booking, guest passes, brand offers
- Whether discount codes work on it
- How members cancel, and any minimum commitment

**For each pass**

- What members pay: free, half price, or a custom amount off
- Whether only members can book it

## Features

### Renewal reminders (14) · before launch

| Feature | What it means | For | Phase | Prototype | SweatPals |
| --- | --- | --- | --- | --- | --- |
| **Reminder before every renewal** | Members hear at least a day before they're charged: the amount, the date, and a link to manage or cancel. | Members | Before launch | ✓ | ✓ |
| **Club chooses how members are reminded** | Club admins pick how early members hear about a renewal and on which channels: the app, email or WhatsApp. | Club admins | Before launch | – | New |
| **Receipt after every charge** | Members get a receipt each time they're charged, with what they paid and when the next renewal is. | Members | Before launch | – | ✓ |
| **Failed payment, with a way to fix it** | If a renewal fails, members are told straight away and can pay from a link in the message. | Members | Before launch | ✓ | ✓ |
| **Heads-up before a payment problem** | Members hear before the renewal if their AutoPay or card won't go through, so they can update it in time. | Members | Before launch | – | ✓ |
| **Intro price ending** | Members on an intro offer are told before their first full-price charge. | Members | Before launch | – | New |
| **Payment reminders can't be missed** | Anything about money always reaches the member, by email as well, and can't be switched off. Other reminders follow their notification settings. | Members | Before launch | – | New |
| **Reminders are always current** | If the club pauses, changes or cancels a plan, members only get reminders that are still true. | Members | Before launch | – | New |
| **Club can see what members were told** | Club admins can check which reminders a member got and when, before answering a complaint. | Club admins | Before launch | – | New |
| **Pack about to expire** | Pack holders are told before their pack expires, with how many runs are left. | Members | V1 | – | ✓ |
| **Plan ending after cancelling** | Members who cancelled are reminded when their access ends, with an easy way to rejoin. | Members | V1 | – | ✓ |
| **Daily renewal summary for the club** | Club admins get a short daily note: tomorrow's renewals, payments at risk, and payments that failed. | Club admins | V1 | – | ✓ |
| **Running low on runs** | Members are told when they have one or two bookings left this month. | Members | V2 | – | New |
| **Pause ending** | Members on a paused plan are told when billing starts again. | Members | V2 | – | New |

### Perks and brand offers (18)

| Feature | What it means | For | Phase | Prototype | SweatPals |
| --- | --- | --- | --- | --- | --- |
| **See what you've saved** | The plan card shows how much the member has saved this month and since joining. | Members | V1 | ✓ | ✓ |
| **Value recap with each renewal** | Each renewal receipt sums up the month: runs, savings and perks used. | Members | V1 | – | New |
| **Book early** | Members can book popular events before they open to everyone. Others see when booking opens. | Members | V1 | ✓ | New |
| **Bring a friend free** | Members get guest passes each month. A friend opens the link and books a run free, and the club gets a new lead. | Members | V1 | ✓ | ✓ |
| **Guest pass at the door** | Club staff can let a guest in with a member's pass at check-in. | Club admins | V1 | – | ✓ |
| **Club perks page** | Each club has a small page listing its brand offers (gear, food, recovery, nutrition) that anyone can browse and the club can share. | Both | V1 | ✓ | ✓ |
| **Offers unlock with a plan** | Non-members see the offer and which plan unlocks it. Members tap to reveal the code or how to redeem. | Members | V1 | ✓ | ✓ |
| **Search and filter perks** | Members can search brands and filter by category. | Members | V1 | ✓ | ✓ |
| **Members-only offers** | Clubs can keep some offers hidden until someone joins. | Club admins | V1 | ✓ | ✓ |
| **Club adds brands and picks the plans** | Club admins add a brand's offer and choose which plans unlock it, and see how many members used it to report back to the brand. | Club admins | V1 | ✓ | ✓ |
| **Club chooses each plan's perks** | For each plan, club admins choose early access, guest passes and which brand offers it includes. | Club admins | V1 | ✓ | ✓ |
| **Members-only sessions** | Clubs can run sessions only plan holders can book. | Club admins | V1 | – | ✓ |
| **Members' WhatsApp group** | Joining a plan adds the member to the club's members group. | Members | V1 | – | ✓ |
| **First in line for sold-out events** | When a spot opens, members on the waitlist get it first. | Members | V2 | – | New |
| **Reward for bringing a friend** | When a friend a member invited joins a plan, the member gets a free week or money off. | Members | V2 | – | ✓ |
| **Member badge** | Members show a badge on leaderboards, athlete lists and challenges. | Members | V2 | – | ✓ |
| **Race photos first** | Members see their event photos before they're shared publicly. | Members | V2 | – | New |
| **Streaks and milestones** | Members are celebrated for monthly streaks, 25, 50 and 100 runs, and their member anniversary. | Members | V2 | – | New |

### Discounts (7)

| Feature | What it means | For | Phase | Prototype | SweatPals |
| --- | --- | --- | --- | --- | --- |
| **Club switches codes on** | Discount codes are off until a club admin turns them on for a plan. | Club admins | V1 | ✓ | New |
| **Create a code** | Club admins create a code for a campaign, students or a partner: a percentage or an amount off, on the plans they choose. | Club admins | V1 | ✓ | ✓ |
| **First month or every month** | A code can take money off the first payment only, or every payment (for example a student rate). | Club admins | V1 | ✓ | ✓ |
| **Limits on a code** | Clubs can cap how many people use a code, set an end date, and switch a code off at any time. | Club admins | V1 | ✓ | ✓ |
| **Use a code at checkout** | Members enter a code when joining and see the discount as its own line, with a clear message if a code doesn't work. | Members | V1 | ✓ | ✓ |
| **No double discounts** | A code can't be combined with an intro offer. | Members | V1 | ✓ | ✓ |
| **Discounts for a group** | Clubs can offer a discount only to a group, such as students, women or one company's employees. | Club admins | V2 | – | New |

### Plans and pricing (20)

| Feature | What it means | For | Phase | Prototype | SweatPals |
| --- | --- | --- | --- | --- | --- |
| **Monthly memberships** | Clubs sell a membership that renews every week, month, quarter or year. | Club admins | V1 | ✓ | ✓ |
| **Run packs** | Clubs sell a pack of runs that's valid for a set time, or never expires. | Club admins | V1 | ✓ | ✓ |
| **More than one price** | A plan can have several price options, such as monthly or quarterly. | Club admins | V2 | ✓ | ✓ |
| **Intro offer** | New members can pay a lower price for their first weeks, once per person. | Club admins | V2 | ✓ | ✓ |
| **Joining fee** | Clubs can add a one-time joining fee to the first payment. | Club admins | V2 | ✓ | ✓ |
| **What a plan covers** | Clubs choose which sessions a plan covers: all training runs, race days, or specific events. | Club admins | V1 | ✓ | ✓ |
| **How often it can be used** | Unlimited, or a set number of bookings a week, month or in total. | Club admins | V1 | ✓ | ✓ |
| **Unused runs carry over** | Clubs can let unused bookings carry into next month. | Club admins | V2 | – | ✓ |
| **Member price on each pass** | For every ticket type, clubs choose what members pay: free, half price, or a custom amount off. | Club admins | V1 | ✓ | ✓ |
| **Set it once for all events** | When publishing a plan, the club can apply its member price to every upcoming event it covers in one go. | Club admins | V1 | ✓ | ✓ |
| **Prices shown with tax and fees** | Members see the full price including GST and any fees before they pay. | Members | V1 | – | ✓ |
| **Feature and order plans** | Clubs pin their main plan to the top and order the rest. | Club admins | V1 | ✓ | ✓ |
| **Hidden plans** | Clubs can hide a plan from the club page and share it by link only. | Club admins | V1 | ✓ | ✓ |
| **Approval to join** | Clubs can review each request before someone joins, for example a coached squad. | Club admins | V1 | ✓ | ✓ |
| **One per person** | Clubs can stop someone buying the same plan twice. | Club admins | V1 | – | ✓ |
| **Limited spots** | Clubs can cap how many people hold a plan at once; the plan shows as sold out when full. | Club admins | V2 | – | ✓ |
| **First-timers only** | Clubs can offer a plan only to people who haven't been to the club before. | Club admins | V2 | – | ✓ |
| **Plans for a group** | Clubs can show a plan only to a group, such as women, students or past attendees. | Club admins | V2 | – | New |
| **Retire a plan** | Clubs can stop selling a plan without affecting people already on it. | Club admins | V1 | – | ✓ |
| **Plans on the club's own website** | Clubs can show their plans and take sign-ups on their own website. | Club admins | Later | – | ✓ |

### Joining a plan (9)

| Feature | What it means | For | Phase | Prototype | SweatPals |
| --- | --- | --- | --- | --- | --- |
| **See plans on the club page** | The club page lists its plans with price, what's covered and the perks. | Members | V1 | ✓ | ✓ |
| **Clear join button** | The button always says what will happen: Join, Request to join, Request pending, Not approved, or View if you already have it. | Members | V1 | ✓ | ✓ |
| **Pick how to pay** | Members choose a price option and whether to take the intro offer. | Members | V1 | ✓ | ✓ |
| **Know the terms before paying** | Members see what's charged today, what renews and when, and any minimum commitment, before they pay. | Members | V1 | ✓ | ✓ |
| **Waiver and questions** | Members sign the club's waiver and answer its questions while joining. | Members | V1 | ✓ | ✓ |
| **Request to join** | For approval-only plans, members send a request, pay only once approved, and can withdraw it. | Members | V1 | ✓ | ✓ |
| **Told why you can't join** | Members see a clear message if a plan is sold out, for first-timers only, already held, or their request was declined. | Members | V1 | ✓ | ✓ |
| **Pay with UPI AutoPay or card** | Members set up AutoPay once and don't have to pay each month. | Members | V1 | ✓ | ✓ |
| **You're in** | A confirmation that the plan is active and that benefits apply automatically, with a shortcut to book. | Members | V1 | ✓ | ✓ |

### Booking with a plan (9)

| Feature | What it means | For | Phase | Prototype | SweatPals |
| --- | --- | --- | --- | --- | --- |
| **Member price on events** | Events show the member price next to the normal price. | Members | V1 | ✓ | ✓ |
| **Nudge to join** | People without a plan see what members pay and a link to the plans. | Members | V1 | ✓ | ✓ |
| **Plan applied automatically** | Members book as they do today; checkout uses their plan without any extra step. | Members | V1 | ✓ | ✓ |
| **Free bookings skip payment** | When the plan makes a ticket free, there's no payment screen. | Members | V1 | ✓ | ✓ |
| **Know what's not covered** | Checkout shows which passes the plan covers and which it doesn't. | Members | V1 | ✓ | ✓ |
| **Best plan wins** | If a member holds more than one plan, checkout uses the one that costs them least. | Members | V1 | ✓ | ✓ |
| **Discount on the ticket** | The ticket and receipt show the member discount. | Members | V1 | ✓ | ✓ |
| **Run back if you cancel in time** | Cancelling early enough gives the run back to the plan; the club decides how early. | Both | V1 | ✓ | ✓ |
| **See which members are going** | Event pages show which club members are coming. | Members | Later | – | ✓ |

### My plan (5)

| Feature | What it means | For | Phase | Prototype | SweatPals |
| --- | --- | --- | --- | --- | --- |
| **My plan in Passes** | Members see their plan's status, renewal date, runs left, savings and perks in one place. | Members | V1 | ✓ | ✓ |
| **Plan history** | Members can see when they joined, renewed, booked and changed anything. | Members | V1 | ✓ | ✓ |
| **Download receipts** | Members can download a receipt for every payment. | Members | V1 | – | ✓ |
| **Change how I pay** | Members can update their AutoPay or card from the app or a link. | Members | V2 | – | ✓ |
| **Plan in my phone wallet** | Members can add their plan to Apple or Google Wallet. | Members | Later | – | ✓ |

### Renewing and cancelling (8)

| Feature | What it means | For | Phase | Prototype | SweatPals |
| --- | --- | --- | --- | --- | --- |
| **Renews on its own** | Plans renew automatically on the same date each period. | Members | V1 | ✓ | ✓ |
| **Time to fix a failed payment** | After a failed payment, the plan isn't lost straight away; the club sets how long the member has to fix it. | Both | V1 | – | ✓ |
| **Cancel from the app** | Members cancel in a couple of taps, or send a request if the club reviews cancellations. The club chooses which. | Both | V1 | ✓ | ✓ |
| **Keep access until the end** | After cancelling, the plan works until the period already paid for ends. Packs work until they expire. | Members | V1 | ✓ | ✓ |
| **Settle up before cancelling** | A member with a failed payment pays it before they can cancel. | Members | V1 | ✓ | ✓ |
| **Minimum commitment** | Clubs can ask members to stay for a few months before they can cancel; members see this before joining. | Both | V2 | ✓ | ✓ |
| **Switch plans** | Members change plans by cancelling and joining the new one. | Members | V1 | ✓ | ✓ |
| **Rejoin later** | Members can come back to a plan any time (without the intro offer again). | Members | V1 | ✓ | ✓ |

### Running memberships (14)

| Feature | What it means | For | Phase | Prototype | SweatPals |
| --- | --- | --- | --- | --- | --- |
| **Members and their plans** | Club admins see every plan holder, their status and how much they use the plan. | Club admins | V1 | ✓ | ✓ |
| **Revenue at a glance** | Monthly income from plans, active holders and failed payments on one screen. | Club admins | V2 | ✓ | ✓ |
| **Requests to review** | One queue for join requests and cancellation requests. | Club admins | V1 | ✓ | ✓ |
| **Pause a member's plan** | Club admins pause a plan (an injury, travel); billing stops and the member gets the time back when it resumes. | Club admins | V2 | ✓ | ✓ |
| **Cancel a member's plan** | Club admins can end a plan at the end of the period or straight away. | Club admins | V1 | ✓ | ✓ |
| **Refund a member** | Club admins can refund a payment and choose whether the plan continues. | Club admins | V1 | – | ✓ |
| **Give extra runs** | Club admins can add bookings to a member's plan for the month. | Club admins | V2 | ✓ | ✓ |
| **Change a member's price or renewal date** | For one period or from now on. | Club admins | V2 | – | ✓ |
| **Give someone a plan** | Club admins send a plan to someone, free, free for a while, or paid, and they claim it from a link. | Club admins | V2 | – | ✓ |
| **Upcoming renewals** | Club admins see who renews soon and whose payment looks at risk, so they can follow up. | Club admins | V2 | – | ✓ |
| **Notes on a member** | Team-only notes on a member. | Club admins | Later | – | ✓ |
| **Who on the team can do what** | Club owners decide who can change prices and refund; staff can check people in and approve requests. | Club admins | V1 | – | ✓ |
| **Plan money in the weekly payout** | Plan income arrives with the club's weekly payout, like ticket income. | Club admins | V1 | – | ✓ |
| **Sell a plan at the desk** | Club staff can sign someone up in person and take payment by QR or link. | Club admins | Later | – | ✓ |

### Sharing and growth (6)

| Feature | What it means | For | Phase | Prototype | SweatPals |
| --- | --- | --- | --- | --- | --- |
| **Share a plan with family** | A member can share their plan with a few people, who claim it from an invite. | Members | V2 | – | ✓ |
| **Club adds people to a plan** | Club admins can add family members to someone's shared plan. | Club admins | V2 | – | ✓ |
| **Gift cards** | Members pay with a club gift card balance. | Members | Not planned | – | ✓ |
| **Leads pipeline** | Track prospects through stages with automatic messages. | Club admins | Not planned | – | ✓ |
| **Bring members from another platform** | Move existing memberships over from another app. | Club admins | Not planned | – | ✓ |
| **1:1 appointments** | Plans that cover personal sessions with a coach. | Club admins | Not planned | – | ✓ |

## What we couldn't see in SweatPals

- SweatPals' exact wording, which isn't in their public code.
- Their logged-in club dashboard, so club-admin features come from their help centre.
- Flows that only exist in their mobile app, such as sending guest passes.

## Updating this list

Edit [`features.json`](features.json), then run `python3 memberships/coverage/build.py` from the repo root. Keep each row to what a person can do or will notice.
