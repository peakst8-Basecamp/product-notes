# Athlete OS · Design Partner #2: Cubbon Classic 10K

**An Athlete OS design partner note.** Athlete OS is peakst8's app and dashboard that keeps a cohort engaged while it builds up to an event. [Design Partner #1](../run-crew/) is Run Crew × Reebok, with about 250 runners on a training plan. This note covers **Design Partner #2: Cubbon Classic 10K**, with Nithin Gowda of the MyRace team. It is the first race organiser on Athlete OS and adds two things: registration on the organiser's own website (Embedded Ticketing), and an engagement layer (weekly missions, points, leaderboards, rewards and nudges) that the organiser configures themselves, keeping every registered runner active from sign-up to race day.

This note doesn't define all of Athlete OS. It covers what Cubbon Classic needs, what we ship for them in November, and what it proves for the product.

[Product note](https://peakst8-basecamp.github.io/product-notes/athlete-os-cubbon-classic/) · [Product screens](https://peakst8-basecamp.github.io/product-notes/athlete-os-cubbon-classic/prototype/) · [Design Partner #1: Run Crew](https://peakst8-basecamp.github.io/product-notes/run-crew/) · [Embedded Ticketing note](https://peakst8-basecamp.github.io/product-notes/embedded-ticketing/) · [Code](code/) · Status: Scoping · Owner: Arvind · updated 9 Nov 2026

## The short version (for the board)

- **Design Partner #2:** Cubbon Classic 10K, Edition 2, Bengaluru, **21 Mar 2027** (19 weeks away). Edition 1 had about 4,000 runners. The organiser expects **3,500 participants** for Edition 2.
- **Where they are today:** registration runs on a KonfHub widget inside [cubbonclassic10k.com/register](https://cubbonclassic10k.com/register), with about **220 registrations on 9 Nov** and about 4.5 months to go. The engagement programme runs on Yoska's coach dashboard (fit.yoska.in), which was built for coaching, not for events.
- **Agreed on the 9 Nov call:** engagement and the leaderboard go live from January 2027, after TMM (Tata Mumbai Marathon) and alongside TCS 10K training, as an 8-week programme up to race day. Next steps: Nithin comes back with the programme, and Arvind introduces brands to back rewards for consistency.
- **The deal:** if we ship this, Nithin moves the whole registration to peakst8 and runs the "Road to Cubbon Classic" programme on it.
- **What we ship, all in November:** (1) Embedded Ticketing live on their site, (2) Yoska's backend merged into the peakst8 backend, (3) a redesigned peakst8 dashboard where the organiser configures the engagement layer themselves, with no Yoska screens left in the loop.
- **Why it matters:** Design Partner #1 (Run Crew × Reebok) showed a cohort of about 250 runners on a training plan. Design Partner #2 puts a 3,500-runner race on one configuration, showing that Athlete OS scales without engineering work for each event. After Cubbon, the same setup goes to community clubs and other races. If the partnership with MyRace goes well, we integrate with MyRace directly for timing and results and offer it across clubs and events.

## From the 9 Nov call with Cubbon Classic

| Topic | What we heard | What changes in this note |
| --- | --- | --- |
| Registrations | About 220 on 9 Nov, about 4.5 months to go | Baseline is 220, not the 400 to 500 first quoted |
| Expected turnout | 3,500 participants | Registration target is 3,500 |
| Ticket price | Early-bird tiers at 15%, 10% and 5% off, and about 20% off for bulk buys | Embedded Ticketing needs tiered early-bird prices and a bulk or group discount at launch |
| Engagement and leaderboard | Go live from January 2027. Runners engage after TMM (Tata Mumbai Marathon) and alongside TCS 10K training. An 8-week programme up to race day. | No warm-up league in December. Road to Cubbon Classic runs 25 Jan to 21 Mar 2027. We still build the dashboard in November, so the season is set up well before it opens. |
| Runners already registered | Send them an emailer | Emailer when registration moves to peakst8, then another when the programme opens |
| Brands | Onboard brands to reward consistency | Rewards are designed by Nithin, for a runner alone or with their group |

**Next steps**

| # | Owner | Step | Due |
| --- | --- | --- | --- |
| 1 | Nithin Gowda | Come back with the Road to Cubbon Classic programme: weekly missions, scoring, and personal and group rewards | To agree |
| 2 | Arvind | Introduce Nithin to brands that will back rewards for consistency, and pick one to take a bet on | To agree |

**Metrics we track**

| Metric | Today | Target |
| --- | --- | --- |
| Registrations | ~220 (9 Nov) | 3,500 by race week |
| Sales by price tier | — | Early-bird tiers and bulk buys tracked separately |
| Registered runners who open the emailer and join the programme | — | 50% join by the end of week 1 (25 to 31 Jan) |
| Weekly active runners during the 8 weeks | — | 40% of joiners |
| Rewards claimed, personal and group | — | Set once brands are in |
| Brands onboarded for rewards | 0 | At least 1 before 25 Jan |

## 1. The problem

| Who | Today | What it costs them |
| --- | --- | --- |
| **Cubbon Classic organiser (Nithin's team)** | Registration runs through a KonfHub iframe. Club entries go through a form, and the code arrives 24 to 48 hours later. | Search traffic and attribution go to KonfHub. Codes are issued by hand. Registrations, clubs and engagement sit in three tools. |
| **Organiser running engagement** | The programme lives in Yoska's coach dashboard: challenges, levels, leaderboards, nudges, built for coaches managing athletes. | No event view. Setup takes coach-level knowledge (85 challenges, 30 levels, level ranges), and leaderboards recompute once a day. |
| **Registered runner** | Pays, gets a confirmation, and hears nothing until bib collection. | Nothing to do for four months. The race is just one day, not a build-up they feel part of. |
| **Sponsor ("Powered by [Brand]")** | Logo on the T-shirt and the race page. | No weekly contact with runners and no proof of reach beyond race day. |

## 2. Who it's for

| | Who | What they're trying to get done | What they need from this |
| --- | --- | --- | --- |
| **Primary** | Race and event organisers with 1,000+ runners (Cubbon Classic first) | Fill the race, keep runners training, give sponsors something to show | Registration on their own site plus an engagement programme they can set up in an afternoon |
| **Primary** | Registered runners and club captains | Get race-ready, feel part of something, be seen | A clear weekly plan, a fair leaderboard, rewards worth chasing |
| **Secondary** | Sponsors (nutrition, recovery, apparel) | Reach runners every week, sample products | A branded slot in the programme and a weekly reach report |
| **Secondary** | Community clubs (Find Your Fit, Sisters in Sweat, and others) | Run seasons and challenges for their members | The same engagement layer, switched on for a club instead of a race |
| **Not for (yet)** | Coaches selling one-to-one plans | Workout calendars, form review, coach chat | Stays in Yoska until V2 |

## 3. Why now

- **A design partner with a live race.** Cubbon Classic registration is open now, and Nithin has offered to move it if we build this. Each week we wait, more runners sign up on KonfHub.
- **The Embed module is already scoped.** Its [product note](https://peakst8-basecamp.github.io/product-notes/embedded-ticketing/) names Cubbon Classic as the race pilot, with club codes and bib export. This note pulls Cubbon's go-live forward from 14 Dec to 20 Nov.
- **Yoska already has the engine.** Challenges, points, levels, leaderboards, onboarding quizzes and nudges exist and run for groups such as Puma. We merge the engine and replace the screens, so we are not starting from zero.
- **The timeline fits.** Registration to race is 19 weeks. If we ship in November, there is a full season of engagement to measure before the board sees race-day numbers.

## 4. What we're building

1. **Registration on the organiser's site.** The organiser turns on Embedded Ticketing and the KonfHub iframe on `/register` is replaced by peakst8 checkout. Runners register individually or with a club code. Existing KonfHub registrations are imported, so nobody signs up twice.
2. **A programme the organiser builds themselves.** In the peakst8 dashboard the organiser lays out the season (pre-season from registration, then the 8-week Road to Cubbon Classic from 25 Jan), picks weekly missions, sets points and adds a sponsor.
3. **Missions that count themselves.** Runs and long runs come in from the runner's watch or Strava. Club runs count when the runner checks in at the run. Quizzes count when they're finished.
4. **Leaderboards people care about.** Individual, club, age group and gender boards, all updating as activities come in, with Club of the Week and weekly top performers.
5. **Rewards and nudges.** Badges, merchandise, partner rewards, free entries and race-day recognition. Reminders go out when a mission is due or a streak is about to break.
6. **One report.** Registrations, active runners, club standings and sponsor reach in one place for the organiser, and a weekly summary the sponsor can see.

## 5. Goals and non-goals

**Goals**

1. Move Cubbon Classic registration fully to peakst8 by **20 Nov 2026**, with every KonfHub registration imported.
2. Give the organiser a peakst8 dashboard where they set up the whole engagement layer without opening fit.yoska.in, by **30 Nov 2026**.
3. Merge Yoska's challenge, points, leaderboard, level, quiz and nudge engine into the peakst8 backend, so one account and one database serve registration and engagement.
4. Keep a meaningful share of registered runners active every week until race day.
5. Set up the second event or club afterwards in under a day, with no engineering.

**Non-goals**

- Coach tools from Yoska (workout calendar, training blocks, form review, coach chat). They stay in Yoska for now.
- Timing hardware or live race tracking. V1 exports bibs to the timing partner as before.
- A final scoring system. The points below are illustrative and will be tuned with Nithin.
- Direct MyRace integration in November. That is Phase 3 and depends on the pilot going well.

## 6. How we'll know it worked

| Metric | Baseline | Target | When | Source |
| --- | --- | --- | --- | --- |
| Registrations on peakst8 (imported + new) | ~220 on KonfHub (9 Nov) | 3,500 | Race week | peakst8 orders. Target is the organiser's expected count from the 9 Nov call. Checked weekly against the run-rate. |
| Registrations lost in the KonfHub move | — | 0 | 20 Nov | Import count vs. KonfHub export count |
| Registered runners who join the programme | — | 50% | 31 Jan 2027 | Programme joins ÷ registrations. **Assumption**, checked at the end of week 1. |
| Weekly active runners (finish at least one mission) | — | 40% of joiners | Each week of Road to Cubbon | Mission completions |
| Clubs registered | Not known (form today) | 80 clubs | 28 Feb 2027 | Club codes issued. **Assumption:** to be confirmed against Edition 1 with Nithin. |
| Time to set up the next event's engagement layer | Days, done by our team in Yoska | Under 1 day, done by the organiser | Second event | Setup log |
| **Guardrail:** checkout completion | KonfHub's rate (to get from Nithin) | Not lower | From 20 Nov | Checkout funnel |

## 7. Key journeys

- **As the organiser, I swap KonfHub for peakst8 on my register page, so that** every registration lands in my peakst8 dashboard. *Done when* a test runner registers on cubbonclassic10k.com/register, pays and shows up in the dashboard with a bib, and the KonfHub widget is gone.
- **As a club captain, I register my club and get a code straight away, so that** my members can sign up today, not in two days. *Done when* the code is issued on approval and the roster shows progress against the 7 men + 3 women minimum.
- **As the organiser, I build the Road to Cubbon season in an afternoon, so that** missions, points, leaderboards and rewards go live without asking peakst8 engineering. *Done when* Nithin sets up week 1 alone in the dashboard.
- **As a runner, I open the app and see this week's missions and where I stand, so that** I train and stay engaged until race day. *Done when* a synced run ticks off the mission and moves me on the leaderboard within minutes.
- **As a sponsor, I see how many runners my content and samples reached each week, so that** I can justify the spend. *Done when* the weekly report shows reach, quiz completions and reward claims for the brand.

## 8. Scope and phases

| Phase | What ships | Gate to move on |
| --- | --- | --- |
| **Prerequisite** (9 to 15 Nov) | Scope lock with Nithin. KonfHub export and club list received. Yoska backend audit. Dashboard designs signed off. | Nithin signs off scope and designs on 13 Nov |
| **V1a: Registration** (16 to 20 Nov) | Embedded Ticketing live on cubbonclassic10k.com/register: individual entry, club codes on approval, bibs, GA4 and pixel. KonfHub registrations imported, and each runner gets an email saying their entry has moved. | Import count matches KonfHub, and the first new registrations are on peakst8 |
| **V1b: Engagement layer** (16 to 29 Nov) | Yoska engine merged into the peakst8 backend. Athlete OS dashboard: programme builder, missions and points, leaderboards, rewards, nudges, clubs, insights. Runner app: missions, leaderboard, rewards, quizzes. | QA on staging on 26 Nov. Nithin configures the warm-up league without help. |
| **Go-live** (30 Nov) | Registration and the dashboard run only on peakst8, with no Yoska screens. Emailer to everyone already registered. Board update. | Release checklist below is all green |
| **Pre-season** (Dec to Jan) | Nithin's programme loaded. Brands onboarded for rewards. Club sign-ups. Emailer when the programme opens. | Programme and at least one brand locked by 15 Jan |
| **V2** (25 Jan to 21 Mar) | Road to Cubbon Classic (8 weeks). Sponsor slot and report. Auto-levels from the onboarding quiz. Training plan library. Leagues with promotion and relegation. | 40% weekly active in the warm-up league |
| **Phase 3** (Feb to Apr, if the pilot goes well) | Direct MyRace integration: bibs, timing and results flow into each runner's profile without separate syncing. A shared MyRace layer offered to community clubs and other events. | Partnership agreement with MyRace |
| **Later / not planned** | Coach tools (workout calendar, form review, coach chat), food data, timing hardware | — |

### Release checklist (November)

- [ ] **Embedded Ticketing plug-and-play:** the organiser pastes one snippet or points a subdomain and starts collecting registrations.
- [ ] **KonfHub replaced** on cubbonclassic10k.com/register, with every existing registration imported and confirmed.
- [ ] **Yoska backend merged** into the peakst8 backend: challenges become missions, plus points, leaderboards, levels, quizzes, nudges and activity sync.
- [ ] **Yoska UI decoupled:** nobody at Cubbon logs into fit.yoska.in.
- [ ] **Redesigned Athlete OS dashboard:** the organiser configures the programme, missions, leaderboards, rewards and nudges themselves.
- [ ] **Runner app** shows missions, leaderboards, rewards and quizzes for Cubbon runners.
- [ ] **Nithin onboarded** and has set up week 1 of Road to Cubbon alone.

### Onboarding Nithin Gowda (Cubbon Classic, MyRace)

| When | Step | What Nithin does | What we do |
| --- | --- | --- | --- |
| Wed 11 Nov | Kickoff | Agrees the season shape, scoring, rewards and sponsor slot | Walks through the product screens. Locks scope. |
| Thu 12 Nov | Access | Gets an organiser login for the Cubbon Classic event and adds team members | Creates the organiser account and switches Embed on |
| Fri 13 Nov | Data | Shares the KonfHub export and club list | Maps fields and runs a test import |
| Fri 20 Nov | Site swap | Their web team pastes the peakst8 snippet on /register (or points `events.cubbonclassic10k.com`) | Imports registrations and sends the "entry moved" email |
| Fri 27 Nov | Configure | Sets up week 1 of the programme in the dashboard, with us beside them | Fixes whatever slows them down the same day |
| From 25 Jan | Run | Weekly 30-minute review: numbers, Club of the Week, next missions | Brings the weekly report and the list of what's missing for V2 |

## 9. Risks

| Risk | Likelihood | Impact | What we'll do |
| --- | --- | --- | --- |
| Three weeks is tight for Embed, the backend merge and a new dashboard together | High | High | Registration ships first (20 Nov) and stands alone. The engagement layer can slip into December: the programme only opens on 25 Jan. |
| A registration is lost or duplicated in the KonfHub move | Medium | High | Count-for-count check, runner-facing confirmation email, and KonfHub kept read-only for 30 days |
| Leaderboards feel unfair (manual entries, mis-tagged runs, GPS errors) | Medium | High | Missions only count synced or checked-in activity. Outliers are flagged for organiser review. |
| Leaderboards slow down at 3,500+ runners if they recompute in batches, as Yoska does daily at 03:00 | Medium | Medium | Rank as activities arrive and load test at 10,000 runners before 26 Nov |
| No sponsor signed for "Powered by [Brand]" | Medium | Medium | The programme runs without one. The sponsor slot stays empty until signed. |
| Nithin's team lacks time to configure | Medium | Medium | We set up week 1 together. Templates come pre-filled from this note. |
| The Yoska merge pulls in coach features we don't need | Medium | Medium | Merge only the engine listed in the appendix. Coach tools stay in Yoska. |

## 10. Open questions and decisions

| Question | Owner | Due | Decision |
| --- | --- | --- | --- |
| Pull Cubbon go-live ahead of Find Your Fit and Sisters in Sweat (20 Nov instead of 14 Dec)? | Arvind | 11 Nov | Proposed: yes |
| Registration fee and passes for Edition 2 | Nithin | 13 Nov | Early-bird tiers at 15%, 10% and 5% off, about 20% off for bulk buys. Base fee still to confirm. |
| Can KonfHub export every registration with consent to contact? | Nithin | 13 Nov | |
| 6 or 8 weeks for Road to Cubbon Classic? | Nithin | 9 Nov | 8 weeks up to race day, from January 2027 (decided on the 9 Nov call) |
| Final points per mission (the current table is illustrative) | Nithin + Arvind | 27 Nov | |
| Who checks runners in at organised club runs? | Club captains | 27 Nov | Proposed: captain scans the runner's QR in the app |
| Brands for rewards and "Powered by [Brand]" | Arvind introduces, Nithin decides | 15 Jan | |
| Rewards for a runner alone or with their group? | Nithin | With the programme | Both, designed by Nithin |
| Who writes the race-prep quizzes and modules (brand or coaches)? | Nithin | 27 Nov | |
| Does MyRace offer an API for bibs, timing and results? | Nithin | Phase 3 | |

## 11. Build

| What | Where |
| --- | --- |
| Product screens | [prototype/](prototype/) |
| Registration module | [Embedded Ticketing note](../embedded-ticketing/) |
| Code: embedded registration (replaces the KonfHub widget) | [code/](code/): backend package, embed loader, KonfHub import, early-bird and bulk pricing. Verified against backend `main` on 9 Nov. |
| Yoska screen inventory | Appendix below |

## Appendix

### A. Road to Cubbon Classic: the programme (from Nithin Gowda, MyRace)

"Road to Cubbon Classic, Powered by [Brand]" is a six-to-eight-week digital and physical training programme with:

- weekly missions on peakst8
- brand-led educational content
- product sampling
- club engagement
- a digital leaderboard
- race-day activation
- post-race content

**Weekly missions and points (illustrative, not the final scoring):**

| Challenge | Example activity | Points |
| --- | --- | --- |
| Running consistency | Complete 3 planned runs in a week | 30 |
| Long-run milestone | Complete an appropriate weekly long run | 20 |
| Strength & mobility | Complete 2 sessions | 20 |
| Community | Attend an organised club run | 15 |
| Learning | Complete a race-preparation quiz or educational module | 10 |

That is up to 95 points a runner a week, or 760 over 8 weeks.

**Possible rewards:** weekly top-performer recognition · Club of the Week · training consistency badges · exclusive Cubbon Classic merchandise · nutrition and recovery partner rewards · special recognition at race-day celebrations · complimentary entries or partner experiences.

### B. What fit.yoska.in does today, and where it lands in peakst8

Inventory taken on 9 Nov 2026 from the Yoska coach dashboard (read only, nothing changed). The new screens are designed in the peakst8 design language and **don't copy** Yoska's layouts. This table is a list of capabilities to carry over.

| Yoska today | What it does | In peakst8 Athlete OS | Phase |
| --- | --- | --- | --- |
| **Leaderboards** | Boards by activity, age group, location or organisation. Run daily or weekly. Ranked by distance or a unified score (points + challenges + distance). Filters for age, gender and location. Rankings and streak tabs. Manual "Sync all". | Leaderboards: individual, club, age group and gender, updating as activities arrive | V1 |
| **Challenge Leaderboard** | Ranking for one challenge, with gold, silver and bronze | A leaderboard for each mission | V1 |
| **Challenges** | Library of 85 challenges across 8 disciplines (running, cycling, strength, nutrition, wellness and more). Levels 1 to 10, duration, points, metric, schedule, rules, individual or multi-sport. Assigned to athletes. | Missions: picked from a library, set per programme week, points set by the organiser | V1 |
| **Topic questions** | Onboarding questionnaire (21 questions) where answers can set the athlete's level automatically | Onboarding quiz (V1) and race-prep quizzes for the Learning mission (V1). Auto-level comes in V2. | V1 / V2 |
| **Nudges** | Message templates (league promoted, league demoted), manual send by in-app or SMS, AI tone rewrite | Nudges: automatic reminders and celebrations, plus a manual send to a segment | V1 |
| **Reports** | Community groups, coaches, subscriptions, geography, export | Event insights and a sponsor report | V1 |
| **Organizations** | Athletes grouped by organisation (Puma, Goa Police and others, some duplicated) | Clubs with captains, codes and roster rules | V1 |
| **Global levels / level ranges** | 30 levels across 4 disciplines, with distance and duration bands per level | Runner levels from the onboarding quiz and recent runs | V2 |
| **Athletes** | Roster and programmes per athlete | Athletes list with programme progress | V1 (read-only) |
| **Leagues** (seen in nudge templates) | Tiers with promotion and demotion | Weekly leagues | V2 |
| **Training blocks / workout calendar** | Plan library (10K to full Ironman, HYROX) and a workout calendar | Training plan library (Cubbon 10K plan first) | V2 |
| **Form review, chat, food data, manage coaches** | Coach tools | Stay in Yoska | Not planned |

### C. Cubbon Classic register page today (9 Nov 2026)

[cubbonclassic10k.com/register](https://cubbonclassic10k.com/register) offers two paths. **Individual:** timed 10K entry with T-shirt, medal, chip timing, photos, certificate and breakfast; the fee "will be announced here". **Club:** the captain submits club name, captain name, email, phone and base city; a unique code arrives in 24 to 48 hours; members register on their own with the code; minimum 10 runners, 7 men + 3 women. Embedded Ticketing replaces both paths (see the Embedded Ticketing note, screens O7 and C2 to C3).
