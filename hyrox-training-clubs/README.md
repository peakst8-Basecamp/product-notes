# peakst8 HYROX Training Clubs

**A peakst8 product feature.** HYROX Training Clubs (HTC), run clubs and other training clubs list their weekly sessions on peakst8 as one programme and sell memberships. Athletes find a club, pick a date and book, the same way they book an event today.

[Product note](https://peakst8-basecamp.github.io/product-notes/hyrox-training-clubs/) · Status: Scoping · Owner: Shoumik · updated 18 Nov 2026

## Where this comes from

| Source | What it gives us |
| --- | --- |
| **Arvind's pre-read** ([Mattermost, Community & Event listing, 20 Oct 2026](https://mattermost.ps8.in/peakst8/pl/xouy1qz5nty8zyd369jqudc5fa)) | The opportunity: [HYROX 365 × peakst8 OS memo](https://claude.ai/artifact/X94okaXab5KP2pjErztato) and the [HYROX India · Find your gym app prototype](https://claude.ai/artifact/JsuvSreB1iYxb4kXRXM2y6) |
| **Shoumik's tech spec** ([Tech Spec: Enhancement for HTC (Event Series)](https://claude.ai/artifact/NyYUbp9fRHPM9yWNBe7uzt)) | How to model recurring sessions: each date stays an ordinary event, grouped under a new Event Series. About 9 backend days in the spec. |
| **This note** | What peakst8 already has against both, the lean plan, the estimate, the owner and the checklist |

## The opportunity

HYROX sells race day. The other 364 days of training have no home in India.

- **153 HYROX gyms** in about 40 Indian cities, and none of them can be booked between races ([HYROX India club finder](https://hyrox.co.in/find-a-hyrox-training-club/), read 16 Oct 2026).
- **About 7,300 racers in 2025 and about 25,000 in 2026**, roughly 3.5× in a year (memo, from The Bridge, UNI and Hyresult).
- In the US, Sweatpals became the official HYROX 365 event platform on 13 Oct 2026, and gyms now sell sims and open gym through it ([PR Newswire](https://www.prnewswire.com/news-releases/sweatpals-and-hyrox-join-forces-to-connect-athletes-to-hyrox-training-clubs-from-race-day-to-every-day-302906188.html)).
- peakst8 already runs HYROX India races, so we meet every racer first. The memo's roadmap is to **onboard gyms by December 2026** and be live before **HYROX Bengaluru in May 2027**.

## What the product looks like today

Most of the stack is live on app.peakst8.club. The gap is grouping sessions and selling memberships.

| What a club or athlete needs | Today on peakst8 | Gap |
| --- | --- | --- |
| Book a class, sim, open gym or day pass | Live: training events with ticket types, UPI checkout, tickets, check-in | None |
| Weekly invoices and payouts to the club | Live | None |
| Leaderboards and Strava | Live (Athlete OS) | None |
| Set up a weekly schedule in one go | Each date is made by hand | **Build** |
| One programme page with a date picker | Each date is a separate page | **Build** |
| One card per programme in discovery | Every date is listed separately | **Build** |
| Change price or details for all upcoming dates | Each date edited one by one | **Build** |
| Monthly membership with UPI AutoPay and renewal reminders | Backend code written and checked, [not merged](../memberships/code/), no screens | **Merge, test, add screens** |
| Find any HYROX gym on a map | Prototype only | Later |
| HYROX and coach training plans | Not built | Later |

## What we're building

1. A club admin creates a training session and says it repeats weekly, on the days they pick, until a date.
2. peakst8 creates every date at once. Each date has its own seats, price and ticket, so booking, payouts and check-in work as they do today.
3. Athletes see one card for the programme, open it, pick dates and book.
4. The admin changes the price or details for all upcoming dates in one edit, or cancels a single date.
5. A club sells a monthly membership (Gold, Silver or Bronze). Members pay by UPI AutoPay, get a reminder before each charge, and the plan applies when they book.

## Owner

**Shoumik owns this end to end**: builds it across backend, web and the app where needed, and onboards the clubs. Shoumik talks to HYROX gyms and run clubs, sets them up, and gets their first sessions and members live, working with Arvind.

## Plan and estimate

About **60–65 hours** for one full-stack developer using Claude, built on what is already live.

| Week | What ships | Hours |
|---|---|---|
| **Now** | Onboard clubs with no code: one training event per date, named so it joins a programme later | Onboarding only |
| **Week 1** (19–25 Nov) | Recurring sessions live: weekly schedule, programme page, one card in discovery, edits for all dates, cancelling one date. Membership backend merged and tested on staging. | ~40–45 |
| **Week 2** (26 Nov–2 Dec) | Membership screens live: club plans page, join, my plans, fix a failed payment, admin plan setup and holders | ~20 |

Monthly schedules, series coupons, programme reports, the gym map, perks and guest passes come later.

## Next steps

1. Shoumik reads this note, the tech spec and the [memberships code](../memberships/code/README.md), then confirms the estimate by 19 Nov.
2. Arvind and Shoumik answer the five open questions in the [product note](https://peakst8-basecamp.github.io/product-notes/hyrox-training-clubs/#decisions).
3. Shoumik shortlists 10 founding HYROX gyms and two run clubs, and books the first calls this week.
4. Week 1 build starts and the first gyms go live with dated sessions.
5. Membership pilot goes live with two clubs in week 2.

## Checklist

- [ ] Owner, scope and estimate confirmed by Shoumik
- [ ] Open questions answered
- [ ] 10 founding HYROX gyms and two run clubs shortlisted
- [ ] First five clubs onboarded with dated sessions
- [ ] Recurring sessions live
- [ ] Membership backend tested on staging with Razorpay test mode
- [ ] Razorpay confirms subscriptions with a later start date and UPI AutoPay limits
- [ ] WhatsApp reminder templates approved (email works without them)
- [ ] Membership pilot live with two clubs, prices agreed
- [ ] First weekly report to Arvind: clubs live, sessions booked, members signed up
