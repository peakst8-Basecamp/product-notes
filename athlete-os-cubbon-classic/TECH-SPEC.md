# Technical spec: going live with Cubbon Classic 10K

For engineering. It covers what must be true technically before we onboard Cubbon Classic's runners: registration on their site by **20 Nov 2026**, the engagement layer by **30 Nov**, and the 8-week programme from **25 Jan 2027** to race day on 21 Mar.

Sections 6 and 7 apply to the whole platform, not only Cubbon: how the Strava integration scales, and the plan to move off Yoska for clubs, corporates, brands, races and coaches. **Scale and migration come before new features.** Cubbon is one design partner inside that plan.

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
| E1 | Phase 2 of the migration plan (section 7): move Yoska's engine into the peakst8 backend: missions (from the challenge library), points, leaderboards (individual, club, age group, gender), onboarding and race-prep quizzes, nudges | 30 Nov |
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

## 6. Strava at scale (platform-wide)

### The principle

Strava is one source among several, never the only pipe. We take runs **pushed** to us (Strava webhooks, Apple Health, Health Connect), fetch each run **once**, store it, and build everything from our own copy. We never poll, never re-fetch for a leaderboard, and never use more than one Strava app to get around limits (that breaks Strava's terms).

### How many Strava calls we need

With webhooks, one read per new run. **Assumptions:** a connected runner logs 3 runs a week; Sunday carries twice an average day's runs, a quarter of them in one peak hour.

| Connected runners | Runs on an average day | Peak reads per 15 min | Fits Strava's default (100 per 15 min, 1,000 a day)? |
| --- | --- | --- | --- |
| 1,000 | ~430 | ~55 | Yes |
| 3,500 (Cubbon at full turnout) | ~1,500 | ~190 | No. Needs a raised limit. |
| 10,000 | ~4,300 | ~540 | No. Needs Strava's review at about 6× the default. |
| 50,000 | ~21,500 | ~2,700 | Only with a negotiated limit; most runs must come from Apple Health and Health Connect |

**Pulling** (what we do today) costs at least one call per runner per sync, whether they ran or not. That's why it breaks first.

### The design that grows with us

| Layer | What it does | Why it scales |
| --- | --- | --- |
| **Webhook receiver** | One Strava push subscription. Answer the handshake, acknowledge each event in under 2 seconds, and put it on a queue. Nothing else happens in the request. | No polling. Bursts are absorbed by the queue. |
| **Fetch queue with a rate budget** | Reads Strava's limit headers after every call and keeps a shared budget per 15-minute window and per day in Redis. Priorities: new runs, then edits and deletes, then backfills. When the budget is spent, work waits for the next window; nothing is dropped. | Peaks delay updates by minutes, not hours, and backfills never starve live runs |
| **Token store** | Refresh a runner's token only when a fetch needs it. Handle `deauthorize` events by stopping syncs and deleting their Strava data. | No wasted calls; complies with revocation |
| **Our own activity store** | Every run from every source, in one shape, de-duplicated (same runner, start within 5 minutes, distance within 5%). | Leaderboards, missions and reports never call Strava |
| **Event-driven scoring** | A stored run scores missions and updates leaderboard rows straight away. Leaderboards are read from precomputed rows with a short cache. | Reads scale with viewers, not with Strava |
| **Source mix** | Ask runners to connect Apple Health or Health Connect first, and Strava when they use it. Later, consider Garmin's developer programme or an aggregator (Terra, Spike, Open Wearables) as build-or-buy. | Each new source moves load off Strava |
| **Compliance by design** | Other runners see points, ranks and mission ticks, never Strava activity details (maps, pace, titles). A runner's own Strava data is shown only to them. | Fits Strava's Nov 2024 terms; confirm in the review |

### How we grow the Strava limit

1. **Now:** check the app's athlete capacity on the Strava API settings page and apply for review with the Cubbon plan (A1).
2. **Before each big cohort:** send Strava the measured usage from the last 30 days (peak reads per window, runners connected) and ask for the next tier. Strava raises limits for apps near capacity, so we need the usage data to show it.
3. **Always:** keep peak usage under 70% of the limit. Above that, onboard new cohorts to Apple Health and Health Connect first.

### What changes in the code

| Today (`main`) | Change |
| --- | --- |
| Backfill worker pulls each runner (concurrency 2, one-day lookback) | Backfill only on first connect (last 30 days, once), at lowest priority |
| Organisers can trigger a leaderboard "recalculate", which calls Strava for every runner (up to 20 rebuilds per 15 min) | Recalculate reads our own activity store. No Strava calls. |
| A 429 holds the whole queue until the next window | Keep this as the last line of defence; the budget should stop us reaching 429 |
| Strava sync for Puma also runs through Yoska's own Strava app | Move to peakst8's app (see section 7). Runners must reconnect: Yoska's Strava tokens belong to Yoska's app and can't be moved. |
| Public category leaderboards built from Strava data | Show points and ranks only, pending Strava's answer |

## 7. Yoska migration plan (platform-wide)

### Why

The backend depends on Yoska in 48 files (about 236 references). That covers Puma athlete sign-up, groups, chat, broadcasts, device tokens, Strava and Ultrahuman sync (`yoska.infra.ts`, `yoskaChat.infra.ts`), and challenges and leaderboards through a separate gamification service (`gamification.infra.ts`). The coach dashboard at fit.yoska.in holds 85 challenges, 30 levels, 6 leaderboards and about 40 organisations. Every new feature built on top of that adds to the move later.

### How we migrate

- **No big bang.** peakst8 becomes the source of truth one capability at a time, behind the same calls the app makes today (strangler pattern).
- **Data foundation first** (section 6), then the engine, then segments one by one.
- **Every segment has entry criteria, a dual-run period, exit criteria and a rollback.**
- **Freeze new features on Yoska** from the start of phase 2.

### Phases

| Phase | What | Done when | Proposed dates |
| --- | --- | --- | --- |
| **0 · Inventory** | Every Yoska capability, every caller in our code, every organisation, group and coach, and how many active athletes each has. Mark each capability: move, rebuild, or retire. | A signed-off sheet; no unknown callers | By 20 Nov 2026 |
| **1 · Data foundation** | Section 6: Strava review, webhooks, rate budget, activity store with de-duplication, Apple Health and Health Connect, app public on both stores | Runs from all sources land in one store within 15 minutes at a 10,000-runner load test | Nov 2026 – 15 Jan 2027 |
| **2 · Engine** | Missions (from the challenge library), points, levels, leaderboards, quizzes, nudges, broadcasts and group chat on peakst8. One-time import of Yoska's challenges, levels and organisations. | Same inputs give the same points and ranks as Yoska for a replayed month of Puma data | Dec 2026 – Jan 2027 |
| **3 · Segments move** | One segment at a time (table below), each with a dual run | Each segment's exit criteria met | Jan – Apr 2027 |
| **4 · Switch off** | Remove Yoska calls from the backend, stop Yoska's Strava app, archive the data | No traffic to Yoska for 30 days | After the last segment |

### Segments

| Segment | Who is on Yoska today | What must work on peakst8 first | Order | Exit criteria |
| --- | --- | --- | --- | --- |
| **Races and events** (Cubbon Classic) | New, nobody to move | Registration (Embedded Ticketing), programme, missions, leaderboards, rewards | 1st: 25 Jan 2027 | A 50-runner test cohort ranks correctly for a week, then the full programme |
| **Clubs** (Find Your Fit, Sisters in Sweat, Run Crew) | Some community groups | Club pages, events, Memberships, club leaderboards, check-in | 2nd: Feb 2027 | Club admins run a month without Yoska |
| **Corporates** (Puma and the other organisations: Goldman Sachs, Boeing, Goa Police and so on) | Puma: 94 athletes in a live programme; about 40 organisations, some duplicated | Organisations with admins, cohort programmes, weekly challenges, private leaderboards, chat and broadcasts, reports, athletes reconnecting Strava to peakst8 | 3rd: Mar 2027, Puma first, after replaying their data in phase 2 | Puma runs a full programme cycle on peakst8 with no gap in points or streaks |
| **Brands** (Puma, Reebok, Cubbon sponsors) | Campaigns run through corporate programmes | Sponsor slot, brand content and quizzes, partner rewards and claims, reach reports | With corporates and races, as each campaign moves | Each brand gets its weekly report from peakst8 |
| **Coaches and academies** (YRA, YCA, YFA, YTA, HYROX; one coach lists about 3,750 athletes) | Training plans, workout calendar, form review, coach chat | **Decision needed:** rebuild coach tools, keep Yoska for coaching only, or retire | Last: decide by 31 Jan 2027 | Per the decision |

### Moving the data

| Data | How |
| --- | --- |
| Athletes | Match by email to peakst8 users; create the rest; no passwords (email OTP) |
| Organisations and groups | Merge duplicates (for example the three Goa Police groups) with the organisation's admin before import |
| Challenges, levels, level ranges | One-time import into the mission library and levels |
| Points, streaks and history | Import as opening balances so nobody's rank or streak resets |
| Strava connections | Can't be moved: tokens belong to Yoska's Strava app. Each athlete reconnects to peakst8 in one tap, prompted in-app and by email, ahead of their segment's move. This also counts against peakst8's Strava capacity (section 6). |
| Chat and broadcasts | Last 90 days imported read-only; new messages on peakst8 |

### Risks

| Risk | What we'll do |
| --- | --- |
| Athletes don't reconnect Strava and drop off leaderboards | Reconnect campaign two weeks ahead; Apple Health and Health Connect as the default; keep the Yoska sync read-only during the dual run |
| Points differ between Yoska and peakst8 | Replay a month of real data in phase 2 and fix every difference before any segment moves |
| A segment's move goes wrong mid-programme | Move between programme cycles only; the rollback is pointing the app back at Yoska's calls for that segment |
| Strava capacity runs out during reconnects | Stagger reconnects by segment; apply for the next tier before each one |

## Go-live gates

| Gate | Date | Passes when |
| --- | --- | --- |
| Registration | 20 Nov | R1–R5 done; 220 of 220 imported; one real booking by Nithin, then refunded |
| Dashboard | 30 Nov | E1, E2 and E7 done; Nithin sets up week 1 alone on staging |
| Data sources | 15 Jan | Strava review answered (A1); webhooks live (A2, A3); app public with HealthKit and Health Connect approved (A4–A6) |
| Migration phase 0 | 20 Nov | Yoska inventory signed off (section 7) |
| Programme | 25 Jan | A7–A9, E3–E6, P2–P4 and S1–S2 done; a test cohort of 50 runners ranks correctly for a week |

## Open technical questions

1. Does Strava allow ranking runners by mission points earned from Strava runs, if no Strava activity data is shown to others? (A1)
2. What athlete capacity and rate limits does the peakst8 Strava app have today?
3. Do Yoska's Strava and Ultrahuman links stay for Puma only, or move to peakst8's own connections?
4. Is the iOS app's public release blocked on anything else?
5. Who owns the mobile work (A4–A6): the Project 3 app team or a separate peakst8 app?
6. Coaches and academies: rebuild coach tools on peakst8, keep Yoska for coaching only, or retire? (section 7)
7. Build or buy for wearables beyond Apple Health and Health Connect (Garmin, an aggregator)?
