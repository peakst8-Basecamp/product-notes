# Technical spec: going live with Cubbon Classic 10K

For engineering. It covers what must be true technically before we onboard Cubbon Classic's runners: registration on their site by **20 Nov 2026**, the engagement layer by **30 Nov**, and the 8-week programme from **25 Jan 2027** to race day on 21 Mar.

Back to the [README](README.md) (overview) and the [product note](https://peakst8-basecamp.github.io/product-notes/athlete-os-cubbon-classic/) (journeys, checklist, tests).

## Scale we're planning for

| | Number | Source |
| --- | --- | --- |
| Registered runners | 3,500 by race week | Organiser, 9 Nov call |
| Runners in the programme | ~1,750 | **Assumption:** 50% of registrations join |
| Activities a week during the programme | ~5,000 | **Assumption:** 3 runs a week each. Peaks on Saturday and Sunday mornings. |
| Leaderboard freshness | Under 15 minutes from a run to a rank | Target |

## 1. Activity data: the main constraint

Missions, points and leaderboards all depend on getting each runner's runs in quickly and fairly.

### What we have today (backend `main`, 9 Nov)

- **peakst8's own Strava app.** Runners connect with OAuth (`/strava/init-state`, `/strava/authorize`). Activities are **pulled** by BullMQ jobs: a backfill worker (concurrency 2, one-day lookback) and leaderboard rebuilds (at most 20 per 15 minutes). **There is no Strava webhook subscription.** A Strava 429 holds the whole queue until the next 15-minute window.
- **Strava and Ultrahuman through Yoska**, for Puma athletes (`yoska.infra.ts`: `syncYoskaStravaActivities`, `fetchYoskaUltrahumanConnectUrl`).
- **No Apple Health or Health Connect.** There's no code in the backend or the web app; the app lists them as "coming soon".

### Why Strava alone won't carry 3,500 runners

| Strava limit (per app, from the [rate limits docs](https://developers.strava.com/docs/rate-limits/)) | Overall | Reads (non-upload) |
| --- | --- | --- |
| Default | 200 per 15 min, 2,000 per day | 100 per 15 min, 1,000 per day |
| Self-serve upgrade | 400 per 15 min, 4,000 per day, **10 athletes** | — |
| More athletes or higher limits | Only after Strava's review, for apps near capacity | — |

- **Pulling doesn't fit.** One activity-list call per programme runner per day is ~1,750 reads, already over the 1,000-a-day read limit before any detail calls.
- **Webhooks fit on an average day, not at peak.** With webhooks it's one read per new run: ~700 a day on average. A Sunday-morning peak of several hundred runs in an hour hits the 100-per-15-minute read cap, so leaderboards lag by hours.
- **Athlete capacity.** Check the peakst8 Strava app's athlete capacity on the Strava API settings page. If it's still capped, Strava's review is a hard blocker for onboarding.
- **Terms risk.** Since Strava's November 2024 API agreement, apps may show a runner's Strava data only to that runner. Leaderboards and club tools are the uses called out ([DC Rainmaker](https://dcrainmaker.com/2024/11/stravas-changes-to-kill-off-apps.html), [TechRepublic](https://techrepublic.com/article/news-strava-api-scraping-crackdown)). A public leaderboard ranked on Strava runs needs a written answer from Strava, or a design that shows only mission points, never Strava activity data, to other runners.

### What we need

| # | Work | Why | Owner | By |
| --- | --- | --- | --- | --- |
| A1 | **Apply for Strava's developer review and a higher limit now**: athlete capacity for 3,500+, raised read limits, and confirmation that ranking runners by mission points is allowed | Weeks of lead time; blocks onboarding | Arvind + backend | Apply by 15 Nov |
| A2 | **Strava webhooks**: one push subscription, a callback that answers the handshake, fetch each new activity, handle `update` / `delete` and deauthorisation | Cuts reads from one per runner per day to one per run | Backend | 30 Nov |
| A3 | **Respect the rate-limit headers**: budget each 15-minute window and give new runs priority over backfills and rebuilds | Keeps weekend peaks from starving live updates | Backend | 30 Nov |
| A4 | **Apple Health (HealthKit) in the iOS app**: read running workouts (distance, duration, start time, source device) with background delivery; HealthKit entitlement and purpose strings; App Store review | No Strava limits; covers runners without Strava | Mobile | Submit by 15 Dec |
| A5 | **Health Connect in the Android app**: read exercise sessions and distance only; complete the [Health apps declaration form](https://support.google.com/googleplay/android-developer/answer/12991134) in Play Console with a privacy policy; Google review | Same, for Android | Mobile | Submit by 15 Dec |
| A6 | **Public app release.** The app is on TestFlight and Google Play testing today. 3,500 runners need the public App Store and Play listing (TestFlight builds expire after 90 days). | HealthKit and Health Connect ship through store review anyway | Mobile | Live by 15 Jan |
| A7 | **One activity ingest for every source**: Strava webhook, HealthKit and Health Connect all post the same shape (source, external id, type, start, distance, moving time, device). Duplicates are merged (same runner, start within 5 minutes, distance within 5%). Preference order: watch app, then Strava. | A run synced from a watch to both Strava and Apple Health must count once | Backend | 15 Jan |
| A8 | **Fair play**: count only GPS or device-recorded runs; hold manual entries and anything faster than 2:30/km or with GPS jumps for organiser review | The leaderboard has to be trusted | Backend | 15 Jan |
| A9 | **Activity → points in real time**: score missions when a run arrives, not in a daily 03:00 batch as Yoska does | Under 15 minutes from run to rank | Backend | 15 Jan |

## 2. Registration (Embedded Ticketing)

The code is in [embedded-ticketing/code](../embedded-ticketing/code/). It's checked against backend `main` (`5ff71d9`) but not merged.

| # | Work | By |
| --- | --- | --- |
| R1 | Merge the backend package: schema, files, two patches; migrate; `bun run check` and `bun scripts/check-embed.ts` | 16 Nov |
| R2 | Frontend: serve `/embed/v1.js`; event page embed mode (auto-open registration, hide site chrome); post `purchase` from the ticket page | 18 Nov |
| R3 | Allow `/event/*?embed=1` to be framed if CloudFront or a proxy sets `X-Frame-Options` | 18 Nov |
| R4 | Staging run in Razorpay test mode, including iPhone Safari inside the overlay (the refresh cookie is `sameSite: strict`). If sign-in doesn't hold, launch with checkout in a new tab. | 19 Nov |
| R5 | Cubbon's settings, early-bird tiers and 20% bulk; KonfHub import (220 tickets); widget swap; "entry moved" email | 20 Nov |

## 3. Engagement layer

| # | Work | By |
| --- | --- | --- |
| E1 | Merge Yoska's engine into the peakst8 backend: missions (from the challenge library), points, leaderboards (individual, club, age group, gender), onboarding and race-prep quizzes, nudges | 30 Nov |
| E2 | Organiser dashboard: programme builder, missions and points, leaderboards, rewards, nudges, clubs, insights. Screens are proposals to rebuild in our design language. | 30 Nov |
| E3 | Runner app: this week's missions, leaderboard, rewards and badges, quiz | 15 Jan |
| E4 | Club run check-in: the captain scans the runner's QR in the app, which counts the Community mission | 15 Jan |
| E5 | Rewards: personal and group, claim in the app, stock limits, brand-backed partner rewards | 15 Jan |
| E6 | Messaging: push for everyone; WhatsApp switched on for Cubbon (today WhatsApp credits are limited to peakst8 Originals); one nudge a day at most | 15 Jan |
| E7 | Retire Yoska screens for Cubbon. Nobody at Cubbon logs into fit.yoska.in. | 30 Nov |

## 4. Accounts, consent and privacy

| # | Work | By |
| --- | --- | --- |
| P1 | Imported KonfHub runners get accounts on first email OTP; no passwords | 20 Nov |
| P2 | Separate, explicit consent for each data source (Strava, Apple Health, Health Connect) and for appearing on public leaderboards, with an opt-out to show first name and initial only. Required for India's DPDP Act. | 15 Jan |
| P3 | Privacy policy updated for health data: what we read, why, retention, deletion. Needed for both store reviews (A4, A5). | 1 Dec |
| P4 | Disconnect and delete: revoking a source stops syncing and removes its stored activities | 15 Jan |

## 5. Scale and monitoring

| # | Work | By |
| --- | --- | --- |
| S1 | Load test: 10,000 runners, weekend burst of 1,500 runs in an hour, through ingest, scoring and leaderboard reads | 20 Jan |
| S2 | Dashboards and alerts: Strava 429s per window, ingest lag (run to rank), queue depth, failed webhooks, checkout errors | 20 Jan |
| S3 | Public embed endpoint cached (60 s, already in the code); leaderboard reads cached per board | 20 Jan |

## Go-live gates

| Gate | Date | Passes when |
| --- | --- | --- |
| Registration | 20 Nov | R1–R5 done; 220 of 220 imported; one real booking by Nithin, then refunded |
| Dashboard | 30 Nov | E1, E2 and E7 done; Nithin sets up week 1 alone on staging |
| Data sources | 15 Jan | Strava review answered (A1); webhooks live (A2, A3); app public with HealthKit and Health Connect approved (A4–A6) |
| Programme | 25 Jan | A7–A9, E3–E6, P2–P4 and S1–S2 done; a test cohort of 50 runners ranks correctly for a week |

## Open technical questions

1. Does Strava allow ranking runners by mission points earned from Strava runs, if no Strava activity data is shown to others? (A1)
2. What athlete capacity and rate limits does the peakst8 Strava app have today?
3. Do Yoska's Strava and Ultrahuman links stay for Puma only, or move to peakst8's own connections?
4. Is the iOS app's public release blocked on anything else?
5. Who owns the mobile work (A4–A6): the Project 3 app team or a separate peakst8 app?
