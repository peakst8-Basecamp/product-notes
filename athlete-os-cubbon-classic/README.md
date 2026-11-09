# Athlete OS · Design Partner #2: Cubbon Classic 10K

Cubbon Classic 10K moves its registration from KonfHub to peakst8, and runs an 8-week engagement programme on Athlete OS until race day (21 Mar 2027). We're working with Nithin Gowda (MyRace). Design Partner #1 is [Run Crew × Reebok](../run-crew/).

[Product note](https://peakst8-basecamp.github.io/product-notes/athlete-os-cubbon-classic/) · [Product screens*](https://peakst8-basecamp.github.io/product-notes/athlete-os-cubbon-classic/prototype/) · [Code](code/) · [Embedded Ticketing](../embedded-ticketing/) · Status: In build · Owner: Arvind · updated 9 Nov 2026

\* The product screens are a proposal. Adapt them to the org's design language before build.

## Calls so far

| Call | What we learned |
| --- | --- |
| **1 · Programme brief** (Nithin) | "Road to Cubbon Classic, Powered by [Brand]": 6–8 weeks of weekly missions, brand-led content, sampling, club engagement, a leaderboard, race-day activation and post-race content. Edition 1 had ~4,000 runners. Nithin will move registration to peakst8 if we build this. |
| **2 · 9 Nov 2026** | ~220 registered on KonfHub (₹3.74 lakh, no refunds) with 4.5 months to go. Expecting **3,500**. Early-bird tiers at **15%, 10% and 5% off**, and **~20% off bulk buys**. Engagement goes live **from Jan 2027**, after TMM and alongside TCS 10K: **8 weeks to race day**. Email everyone already registered. Brands back rewards for consistency, for a runner alone or with their group. |

**Next steps:** (1) Nithin comes back with the programme. (2) Arvind introduces brands and picks one to take a bet on.

## Problem

- Registration runs in a KonfHub iframe: KonfHub gets the search traffic, attribution is lost, and club codes are issued by hand.
- The engagement programme lives on Yoska's coach dashboard, which wasn't built for events.
- A runner pays and then hears nothing for four months.
- Sponsors have no weekly way to reach runners.

## Who it's for

- **Organiser (Nithin's team):** sell entries on their own site and run the season themselves.
- **Runners and club captains:** a weekly plan, a fair leaderboard, rewards worth chasing.
- **Brands:** reach runners every week and prove it.
- *Not yet:* coach tools (workout calendar, form review, chat). These stay in Yoska.

## Why now

Registration is open and growing on KonfHub every week. The organiser has offered to move it. Yoska's engine (missions, points, leaderboards, nudges) already exists to merge. There are 19 weeks to race day, enough to ship in November and measure a full season.

## Goals

1. Registration fully on peakst8 by **20 Nov**, with all KonfHub entries moved over.
2. The organiser configures the engagement layer in peakst8, with no Yoska screens, by **30 Nov**.
3. Road to Cubbon Classic runs **25 Jan – 21 Mar**, backed by at least one brand.
4. Show it scales: a 3,500-runner race on one setup, with no engineering for each event.

## How we'll know it works

| Metric | Today | Target |
| --- | --- | --- |
| Registrations | ~220 (9 Nov) | 3,500 by race week |
| Registrations lost moving off KonfHub | — | 0 |
| Sales by price tier (early bird, bulk) | — | Tracked from launch |
| Registered runners who join the programme | — | 50% by end of week 1 |
| Weekly active runners during the 8 weeks | — | 40% of joiners |
| Brands backing rewards | 0 | At least 1 by 15 Jan |
| *Guardrail:* checkout completion | KonfHub's rate | Not lower |

## Key journeys

- **Runner registers on cubbonclassic10k.com.** They see live prices, check out with peakst8 over the page, and get a ticket. *Done when* the booking shows in the peakst8 dashboard and in Cubbon's GA4.
- **Existing KonfHub runner** gets an email: "your entry has moved", with their peakst8 ticket. *Done when* 220 of 220 are ticketed.
- **Company or club buys in bulk** with a group code at ~20% off. *Done when* each member registers with the code.
- **Organiser sets up a week of missions** in the dashboard alone. *Done when* Nithin does week 1 without help.
- **Runner checks this week's missions and rank** in the app. *Done when* a synced run moves them on the leaderboard.

## How it works

1. The organiser switches Embed on for the event: allowed website, colour, GA4 and pixel ids, early-bird tiers, bulk discount.
2. The race site replaces the KonfHub widget with one `<div>` and the peakst8 script. Passes and prices render in their page; checkout opens over it.
3. Existing KonfHub registrations are imported from a CSV. Each runner gets a real peakst8 ticket.
4. From 25 Jan, runners get weekly missions. Runs sync from their watch or Strava, club runs count on a QR check-in, and quizzes count when finished. Points feed the leaderboards and rewards.

Details: [code/README.md](code/README.md).

## Go-live checklist

**From Cubbon Classic**
- [ ] Base fee, plus dates (and any seat limits) for the 15%, 10% and 5% tiers
- [ ] KonfHub attendee export, with consent to contact
- [ ] Their web team ready to swap the widget on `/register`
- [ ] Programme from Nithin: missions, scoring, personal and group rewards
- [ ] At least one brand for rewards (Arvind introduces)

**Registration (by 20 Nov)**
- [ ] Backend: merge the [code package](code/) (schema, files, two patches) and migrate
- [ ] Frontend: loader at `/embed/v1.js`, event page in embed mode, booking message to the race site
- [ ] Embed settings for Cubbon: `cubbonclassic10k.com`, Cubbon orange, GA4 and pixel, 20% bulk
- [ ] Early-bird tiers set on each pass
- [ ] KonfHub import: preview, import, 220 tickets issued
- [ ] Widget swapped on `/register`
- [ ] "Your entry has moved" email sent
- [ ] KonfHub kept read-only for 30 days

**Engagement (dashboard by 30 Nov, programme live 25 Jan)**
- [ ] Yoska engine merged into peakst8: missions, points, leaderboards, nudges
- [ ] Organiser dashboard: programme, missions, leaderboards, rewards, nudges, clubs
- [ ] Runner app: this week, leaderboard, rewards, quiz
- [ ] Nithin sets up week 1 alone
- [ ] Email to registered runners when the programme opens

## How we test

| What | How | Pass when |
| --- | --- | --- |
| Pricing rules | `bun scripts/check-embed.ts` | 35 of 35 pass (they do today) |
| Full checkout | Staging, Razorpay test mode: a test page carrying the snippet → register → OTP → pay → ticket | Ticket issued; GA4 and pixel get the purchase |
| iPhone Safari | Same flow inside the overlay | Sign-in holds. If not, launch with checkout in a new tab. |
| Early bird | Set tier dates on staging, register either side of a boundary | Price steps 15% → 10% → 5%; the price shown equals the price charged |
| Bulk and no stacking | Register with a 20% group code during the 15% tier | The runner pays 20% off, not 35% |
| Import | Preview Cubbon's real export, then import into staging | 220 ready, refunds skipped, duplicates flagged, no emails sent |
| Production sign-off | Nithin makes one real booking on the live site, then we refund it | Shows in the dashboard and GA4 |
| Scale | Load test leaderboards at 10,000 runners before 25 Jan | Ranks update within a minute |

## Open questions

- Pull Cubbon's Embed go-live ahead of the other pilots (20 Nov instead of 14 Dec)? Proposed: yes.
- Who checks runners in at club runs? Proposed: the captain scans the runner's QR.
- Who writes the race-prep quizzes: the brand or coaches?
- Does MyRace have an API for bibs, timing and results? That would be Phase 3, after the pilot.

## Appendix

**Road to Cubbon Classic: illustrative points (from Nithin)**

| Mission | Example | Points |
| --- | --- | --- |
| Running consistency | 3 planned runs in a week | 30 |
| Long-run milestone | Weekly long run | 20 |
| Strength & mobility | 2 sessions | 20 |
| Community | An organised club run | 15 |
| Learning | Race-prep quiz or module | 10 |

**Possible rewards:** weekly top performer, Club of the Week, consistency badges, Cubbon Classic merchandise, nutrition and recovery partner rewards, race-day recognition, free entries or partner experiences.

**From Yoska to peakst8:**
- *Merged now:* leaderboards, the challenge library (as missions), onboarding quizzes, nudges, reports, organisations (as clubs).
- *Later:* levels, leagues, training plans.
- *Stays in Yoska:* form review, chat, food data, coach tools.
