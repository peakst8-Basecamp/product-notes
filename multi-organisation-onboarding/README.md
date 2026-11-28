# peakst8 Multi-Organisation Onboarding

**A peakst8 product feature.** Any club or organisation can run its own training programme inside the peakst8 app (Athlete OS). Athletes join with an invite, follow the plan week by week, and see only their own programme's coaches, challenges and leaderboard.

[Product note](https://peakst8-basecamp.github.io/product-notes/multi-organisation-onboarding/) · [Technical spec](TECH-SPEC.md) · Status: Pilot · Owner: Jithin · updated 28 Nov 2026

## What it is

Until now the peakst8 app ran one training programme: PUMA Project 3. Everything in the app assumed that one organisation.

Multi-organisation onboarding removes that assumption. A **training programme** now belongs to a club, and the app shows each athlete the programme they were invited to:

| Part | What it means |
| --- | --- |
| **Organisation** | A club on peakst8, such as a race, a run club or a brand's training squad |
| **Training programme** | A plan with a start and end date, coaches and athletes, run by that club |
| **Invite** | A link and a six-character code, emailed to one athlete, that puts them in one programme |
| **The app** | The same peakst8 app for everyone. What it shows depends on the athlete's programme |

Everything athletes had in Project 3 works the same way for every programme: the training week, Strava sync, the leaderboard, weekly challenges, coach chat and broadcasts, and booked sessions with a meeting link.

This is a feature of its own, like Passport. **Cubbon Classic 10K is the first customer**, not the reason it exists: Run Crew × Reebok and the HYROX training clubs are next in line for the same thing.

## What it solves

| Who | Today | What it costs them |
| --- | --- | --- |
| **A club that wants to train its athletes** | The app was built around one programme. A second club meant custom work each time. | Weeks of engineering before a programme can start, so most clubs could not have one. |
| **An athlete** | No way to join a club's programme in the app unless they were in Project 3. | They train on a spreadsheet or a third-party app, away from their club and its leaderboard. |
| **peakst8** | Every design partner conversation (Cubbon Classic, Run Crew, HYROX training clubs) ended at "the app only does Puma". | Athlete OS could not be sold as a product. |

## How it works

1. **We set up the programme.** The peakst8 team creates the programme for the club, with its dates, coaches and training plan.
2. **The club sends its athletes' emails.** Each athlete gets their own invite by email: a link that opens the app, and a six-character code as a backup.
3. **The athlete joins.** They install the app, open the invite and sign in with an email code, Google or Apple. New athletes add their name, birthday and sports.
4. **They connect Strava.** Runs then sync on their own and count towards training progress and the leaderboard.
5. **They train.** Home shows this week's workouts. The leaderboard, challenges and coach chat are for their programme only.

An athlete who already has a programme skips the invite and goes straight to Home.

## Who it's for

| | Who | What they need |
| --- | --- | --- |
| **Primary** | Clubs and races running a training programme: Cubbon Classic 10K first, then Run Crew × Reebok and HYROX training clubs | Their own programme in the app, without custom work |
| **Primary** | Their athletes | A simple way in, and a programme that is only theirs |
| **Secondary** | Coaches | To message, broadcast to and book sessions with their own athletes |
| **Not for (yet)** | Clubs setting up a programme by themselves | Programmes and invites are set up by the peakst8 team for now |

## Why now

- **Cubbon Classic 10K** runs its programme from January 2027 and is the first club outside Puma to use the app.
- Two more design partners (Run Crew × Reebok, HYROX training clubs) are waiting on the same thing.
- Project 3 proved the training experience with one organisation. The next step is making it work for any.

## Goals and non-goals

**Goals**

1. A new club's programme can start without any change to the app.
2. An athlete only ever sees their own programme: plan, coaches, challenges and leaderboard.
3. Puma Project 3 athletes notice no change.

**Non-goals**

- One athlete in two programmes at once. An athlete has one active programme.
- Self-serve setup for clubs. That is the next phase.
- A new training experience. The screens and features are the ones Project 3 already has.

## Rules

- **One invite, one athlete.** Once an invite is used, nobody else can use it.
- **One programme at a time.** An athlete cannot be active in two programmes.
- **Programmes are kept apart**, even two programmes in the same club: separate athletes, separate leaderboards.
- **The app never chooses the programme.** peakst8 works it out from the signed-in athlete, so an athlete cannot open another club's data.
- A wrong or already-used code shows the same message, "Invalid invite code".

## How we'll know it worked

Targets are proposed, not benchmarks.

| Metric | Target | Source |
| --- | --- | --- |
| Invited athletes who join the programme | **Assumption:** 80% within a week of the invite | Invites sent vs athletes in the programme |
| Joined athletes who connect Strava | **Assumption:** 90% | App analytics |
| Time to start a new club's programme | **Assumption:** under one working day, with no app release | Team log |
| Athletes seeing another programme's data | 0 | Release checklist, support |
| **Guardrail:** Project 3 athletes | No drop in weekly active athletes after the change | App analytics |

## Scope and phases

| Phase | What ships | Status |
| --- | --- | --- |
| **V1** | Invite by email (link and code), sign-in and onboarding, programme-scoped Home, training, leaderboard, challenges and coach chat. Puma moved onto the same flow. | Live in the app since 19 Nov 2026 |
| **V1.1** | New app builds on the stores; the old Puma-only code removed | In progress |
| **V2** | Screens for clubs to create a programme and invite athletes themselves | Not started |
| **Later** | Training plans built and stored in peakst8 instead of the partner training system (Yoska) | Plan being written |

## Open questions

| Question | Owner | Status |
| --- | --- | --- |
| Is connecting Strava required, or can an athlete skip it? Today the app allows skipping. | Jithin, Shravan | Open |
| How many athletes can one programme take within Strava's rate limits? Cubbon Classic expects about 1,000 to start. | Jithin | Open |
| Does an invite expire? | Jithin | Open |
| Who can send invites until clubs have their own screen: support only, or the club's host? | Arvind, Jithin | Open |
| When do we move training plans from Yoska into peakst8? | Jithin, Rohit | Plan being written |

## Build

| What | Where |
| --- | --- |
| Product note (engineers and designers) | [index.html](https://peakst8-basecamp.github.io/product-notes/multi-organisation-onboarding/) |
| Technical spec | [TECH-SPEC.md](TECH-SPEC.md), written 11 Nov 2026 before go-live |
| Mobile app | `peakst8-mobile`: invite link and code, onboarding steps, programme-aware screens |
| Backend | `peakst8-backend`: training programmes, invite codes, the `/training` routes |
| Help articles | Drafted for the peakst8 Help Center: "Run a training programme in the app" (hosts) and "Join a training programme" (athletes). Not published yet. |

## Sources

- Technical spec (Jithin), 11 Nov 2026, in this folder
- Team call minutes, Mattermost **Team Platform**, 9 and 17 Nov 2026
- Go-live update (Jithin), Mattermost **Team Platform**, 19 Nov 2026
- The mobile app and backend code on `main`, read on 28 Nov 2026
