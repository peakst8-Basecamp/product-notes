# Multi-organisation athlete onboarding and programme-scoped experience

**Status:** Release-readiness technical documentation  
**Mobile branch reviewed:** `feat/multi-organisation-onboarding` (`a765fc6`)  
**Last reviewed:** 11 November 2026

## Purpose and scope

This document defines the AthleteOS-to-Peakst8 flow for authentication, invite-based programme assignment, onboarding, training, and the programme-scoped leaderboard.

The governing rule is that an athlete has **exactly one active training programme** at a time. Peakst8 resolves programme, event, club, partner, and leaderboard scope on the server. The mobile client must never select or submit a programme, event, club, organisation, Yoska organisation, or Yoska programme ID for these flows.

The supplied product note is treated as product/architecture context, not as an instruction to modify the current mobile code. Delivery status below reflects the current branch and the delivery update supplied for this document.

## Delivery status

| Area | Status | Notes / owner |
| --- | --- | --- |
| Training-programme context in `/auth/me` | Implemented | App reads the active programme, event, club, and feature flags from authenticated context. |
| Invite-code assignment | Implemented | Code is submitted to Peakst8; backend resolves and assigns its training programme. |
| Programme-aware home and training content | Implemented | Home, programme/event presentation, experiences, and training use active-programme context. |
| Onboarding UI redesign | In testing | Shaumik's design change must be merged after sign-off. The contracts below remain its integration boundary. |
| Programme-scoped leaderboard | In progress | Rohit is making the remaining leaderboard changes. Merge and verify before release. |
| Go-live | Awaiting the two merges and release checks | No additional product work is identified in the delivery update. |

`/partner/puma/*`, `Puma*`, and related names are legacy technical names. They are the current verified mobile API contract, not a source of organisation scope. A neutral-name migration can follow launch with backward-compatible aliases.

Puma should ultimately exist as a proper organisation/club record with a stable
organisation ID, rather than as a hard-coded route namespace or environment
setting. That ID is useful for trusted admin, provisioning, and backend
configuration APIs; it is not an athlete-facing scope selector. Athlete mobile
requests must continue to derive Puma (or any other organisation) from the
active training programme on the server.

## Domain model and invariants

```text
User
  └─ active UserTrainingProgramme (zero or one)
       └─ TrainingProgramme
            └─ Category
                 └─ Event
                      └─ Club / organisation
```

| Entity | Responsibility |
| --- | --- |
| `UserTrainingProgramme` | Athlete assignment and active/inactive state; athlete-specific partner linkage. |
| `TrainingProgramme` | `yoskaProgrammeId`, `yoskaChatGroupId`, and programme-level features. |
| `Event` | Dates, imagery, event content, and event-specific configuration. |
| `Club` | Organisation identity, Yoska organisation ID, and organisation-wide settings. |

The backend must enforce these rules transactionally:

1. A user has no more than one active `UserTrainingProgramme`.
2. An athlete cannot be active in programmes from multiple organisations at once.
3. A programme/organisation switch deactivates the old assignment before activating the new one.
4. Every authenticated read derives scope from the active assignment, not device-supplied request parameters.
5. Two programmes in the same organisation retain separate participants, caches, and leaderboards.

## Architecture and trust boundary

```text
AthleteOS mobile app
  │ Bearer access token
  ▼
Peakst8 API
  ├─ validates identity and resolves active UserTrainingProgramme
  ├─ derives TrainingProgramme → Event → Club context
  ├─ reads programme-specific partner IDs and feature flags
  ├─ returns scoped app data / flattened view models
  └─ calls Yoska with server-held credentials
       │
       ▼
     Yoska / gamification / training services
```

The device is an untrusted requester. It submits an access token and, for assignment, an invite code. It must not be able to alter returned scope using an ID in a URL, body, query, or local cache key.

Current exception: Strava connection/disconnect calls Yoska directly, keyed by the athlete's Yoska user ID. That is an existing partner OAuth constraint, not a programme-selection mechanism. All programme-scoped data, including the leaderboard, goes through Peakst8.

## End-to-end flows

### Existing athlete with a programme already assigned

1. Athlete signs in by email OTP, Google, or Apple.
2. App securely stores tokens and calls `GET /auth/me`.
3. Peakst8 resolves the active assignment.
4. If `activeTrainingProgramme` exists and `isYoskaLinked` is true, app opens Home.
5. If a programme exists but onboarding/partner registration is incomplete, app resumes at permissions, then profile photo, registration, and optional integrations.
6. Home, Training/Progress, experiences, coaches/chat, and Leaderboard use the resolved active programme.

### New or unassigned athlete using an invite code

1. Athlete signs in or signs up through AthleteOS.
2. `GET /auth/me` returns `activeTrainingProgramme: null`.
3. App opens `/invite-code` and posts `{ "code": "…" }` to `POST /partner/puma/invite-code/verify`.
4. Peakst8 validates the code, resolves its programme, and creates/activates the caller's `UserTrainingProgramme`.
5. The app invalidates/refetches `/auth/me`, then opens `/permissions`.
6. After permissions and profile photo, `POST /partner/puma/register` links the authenticated athlete to Yoska using the active programme.
7. Athlete can optionally connect Strava and, if enabled by programme context, Ultrahuman.
8. Athlete enters Home and receives only active-programme content.

On relaunch, the route guard waits for authoritative `/auth/me`: unassigned → Invite Code; assigned but unlinked → Permissions; assigned and linked → Home.

## Mobile routes

| Route | Purpose | Principal backend action |
| --- | --- | --- |
| `/login`, `/otp` | Email OTP; Google/Apple begin at Login | Authentication endpoints |
| `/invite-code` | Assignment for an unassigned athlete | `POST /partner/puma/invite-code/verify` |
| `/permissions` | Non-blocking OS permissions | No scope mutation |
| `/profile-photo` | Persist photo and create/link partner athlete | `PATCH /athlete/profile-picture`, `POST /partner/puma/register` |
| `/connect-activity` | Optional Strava connection | Partner URL/status routes |
| `/connect-ultrahuman` | Optional and programme-feature-gated | Ultrahuman routes |
| `/preparing` → `/medal-wall` → `/ready` | Visual completion | No scope mutation |
| `/home`, `/leaderboard`, `/progress` | Scoped product | Context, programme, board, workout routes |

## API contract

### Base URLs and authentication

| Target | Base URL | Authentication |
| --- | --- | --- |
| Peakst8 API | `EXPO_PUBLIC_API_URL` in release; development uses `EXPO_PUBLIC_DEV_API_URL` or Metro host plus `EXPO_PUBLIC_LOCAL_API_PORT` (default `8080`) | `Authorization: Bearer <accessToken>` for private APIs |
| Yoska API | `EXPO_PUBLIC_YOSKA_API_URL`, default `https://api.fit.yoska.in` | Direct mobile access only for existing Strava lifecycle routes |

The production Peakst8 hostname is supplied through release configuration rather than source, so this document records exact paths and does not invent a production host. Public authentication calls have no bearer token. Private endpoints require a Peakst8 access token. Mobile refresh uses `GET /auth/refresh-token` with its stored refresh token and securely persists the rotated mobile token.

### Authentication and context

| Method and path | Auth | Request | Result |
| --- | --- | --- | --- |
| `POST /auth/signin` | Public | `{ email }` | Sends OTP for an existing account. |
| `POST /auth/verify-otp` | Public | `{ email, otp, isSigningUp: false, client: "MOBILE" }` | Access token, optional refresh token, identity. |
| `POST /auth/google/init-state` | Public | `{ client: "MOBILE", returnUrl }` | Google authorisation URL. |
| `POST /auth/google/authorize-user` | Public | `{ code, state, client: "MOBILE" }` | Tokens, identity, link flag. |
| `POST /auth/apple/authorize-user` | Public | Apple identity token, nonce, optional name, `client: "MOBILE"` | Same mobile token/identity shape as Google. |
| `GET /auth/refresh-token` | Refresh token | No body | Fresh access token, email, rotated refresh token for mobile. |
| `GET /auth/signout` | Session cleanup | No body | Clears backend refresh session; app clears local state. |
| `GET /auth/me` | Private | No body | Authoritative user and active-programme context. |

Required `/auth/me` fields used by mobile:

```ts
{
  data: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string | null;
    profilePicture: string | null;
    isYoskaLinked: boolean;
    yoskaUserId?: number | null;
    activeTrainingProgramme: null | {
      id: string;
      categoryId: string;
      event: {
        id: string;
        name: string;
        image: string;
        ogImage: string | null;
        startDate: string | null;
        endDate: string | null;
        week: number | null;
      };
      club: { id: string };
      ultrahumanEnabled: boolean;
    };
  };
}
```

`activeTrainingProgramme: null` means the athlete needs an invitation. An absent/undefined value is not a safe decision state; the app must wait for fresh context.

### Assignment, registration, and training

| Method and path | Auth | Request | Result / server responsibility |
| --- | --- | --- | --- |
| `POST /partner/puma/invite-code/verify` | Private | `{ code: string }` | `{ valid: true }`; validates code and assigns its programme to the caller. Invalid/unavailable code is `400` with safe message. |
| `POST /partner/puma/register` | Private | `{ mobile?: string }` or `{}` | `{ userId, yoskaUserId, linked }`; server derives athlete identity and active programme. |
| `GET /partner/puma/program` | Private | None | Programme/event header: dates, week, progress, athlete count. |
| `GET /partner/puma/workouts?from=YYYY-MM-DD&to=YYYY-MM-DD` | Private | Optional range | Programme-specific training calendar; omitted dates mean current week; max range 92 days. |
| `POST /partner/puma/workouts/sync?from=…&to=…` | Private | None | Syncs the authenticated athlete's activity/training view. |
| `GET /partner/puma/weekly-progress?date=YYYY-MM-DD&includeReport=true` | Private | Optional query | Athlete's progress for the selected week. |
| `GET /partner/puma/effort?date=YYYY-MM-DD` | Private | Optional query | Athlete's daily effort. |
| `GET /partner/puma/my-coaches` | Private | None | Coaches resolved for the active programme. |
| `GET /partner/puma/crew/highlights` | Private | None | Active programme's crew highlights. |

`PATCH /athlete/profile-picture`, `PATCH /athlete/profile`, and `PATCH /athlete/location` are private profile writes. They do not accept programme scope and must not change assignment.

### Leaderboard

| Method and path | Auth | Request | Response |
| --- | --- | --- | --- |
| `GET /partner/puma/leaderboard` | Private | No programme/club/event/partner ID | `{ total, rows }`; each row provides Yoska `userId`, rank, name, avatar, optional Peakst8 `athleteId`, score, and `isCurrentUser`. |

Required server algorithm:

1. Resolve the caller from the bearer token.
2. Resolve active `UserTrainingProgramme`.
3. Read its `yoskaProgrammeId`.
4. Request that board from Yoska using server-held credentials.
5. Ensure Yoska validates membership for the requested programme.
6. Return only that programme's rows, with permitted Peakst8 profile enrichment.

A missing active programme is a clear client-actionable 4xx response, never a fallback to a global/Puma board.

### Related scoped capabilities

| Capability | Current private Peakst8 endpoint(s) |
| --- | --- |
| Challenges | `GET /partner/puma/challenges`, `GET /partner/puma/challenges/current`, `POST /partner/puma/challenges/current/accept`, `POST /partner/puma/challenges/:challengeId/join` |
| Chat/broadcast | `GET /partner/puma/broadcast/channels`, `POST /partner/puma/broadcast/channels/:channelId/read`, `GET /partner/puma/chat/firebase-token`, `GET/POST /partner/puma/chat/direct/:coachYoskaUserId/messages` |
| Ultrahuman | `GET /partner/puma/ultrahuman/connect-url`, `GET /partner/puma/ultrahuman/status`, `DELETE /partner/puma/ultrahuman/connection`, `GET /partner/puma/ultrahuman/vo2-max` |
| Strava status | `GET /partner/puma/strava/status` |

The two direct Yoska calls are limited to Strava: `GET /auth/strava2/partner/:yoskaUserId?returnTo=…` and `POST /strava/disconnect`. They must not be reused for programme-scoped reads or writes.

## Caching and invalidation

| Data | Current behaviour | Required multi-programme rule |
| --- | --- | --- |
| `/auth/me` | Five-minute query cache plus disk cache; invalidated after invite success | Refetch immediately after assignment before reading features or routing to scoped content. |
| Invite assignment | Mutation invalidates `/auth/me` | Never navigate based on stale programme context. |
| Leaderboard | 15-minute stale time | Key cache by `activeTrainingProgramme.id`; a club ID is insufficient because one club may have multiple programmes. |
| Training/workouts | Date range is in the key | Include programme ID if programme switching is introduced without a full cache clear. |
| Other partner queries | Legacy `puma-*` keys are global | Scope by programme ID or atomically clear scoped queries on reassignment. |

The reviewed mobile leaderboard key is `['puma-leaderboard', clubId]`. This is the known remaining correctness gap: two programmes in one club can reuse the wrong cached board. Rohit's merge must use a key such as `['leaderboard', activeTrainingProgramme.id]` while still sending no scope ID to the API.

## Error handling and recovery

| Situation | Expected behaviour |
| --- | --- |
| Invalid, expired, or unavailable invite | Remain on Invite Code; show safe backend message; no partial assignment. |
| `/auth/me` says no active programme | Route to Invite Code. |
| Registration failure | Remain in onboarding; do not start Strava without partner user ID. |
| Profile-photo persistence failure | Inform athlete but continue; image can be updated later. |
| Board unavailable or empty | Show honest empty/error state; never mock or show cross-programme people. |
| Expired access token | Refresh/replay once; on failure clear local session and go to Login. |

## Security and observability

- Derive the actor from the verified bearer token on every private request.
- Bind invite assignment to the caller; never accept a target user ID with an invite code.
- Use database constraints and transactions for the one-active-programme invariant.
- Scope server-side caches, including leaderboard and partner-token caches, by training programme. Evict/version on reassignment.
- Never log tokens, invite codes, partner credentials, or raw personally identifying partner payloads.
- Audit assignment result, resolved programme/organisation ID, correlation ID, and cache hit/miss without secrets.
- Preserve login, invite-result, onboarding-completed, integration, and leaderboard-view analytics. Do not send invite codes or programme IDs to public analytics without privacy approval.

## Release gate

The release is ready only after both pending merges are in the release branch and these checks pass against staging and production configuration:

1. Shaumik's onboarding redesign preserves route guarding and the post-invite `/auth/me` refresh.
2. Rohit's board resolves scope server-side and uses programme ID in all mobile/backend cache keys.
3. A preassigned Programme A athlete enters Home without Invite Code.
4. An unassigned athlete using Invite A is assigned to A, completes onboarding, and sees A's training and leaderboard.
5. A Programme B code cannot expose A content, and an athlete cannot remain active in A and B.
6. Two programmes under one club return different boards with no cache bleed.
7. Forged programme/club/event/Yoska-organisation IDs cannot alter private-response scope.
8. Malformed, expired, disabled, and ineligible invites fail without changing assignment.
9. Sign-out/sign-in, relaunch mid-onboarding, token refresh, and reassignment display no stale scoped content.
10. Release builds set `EXPO_PUBLIC_API_URL` and do not fall back to local development configuration.

## Post-launch technical debt

Migrate legacy Puma names to neutral domain names such as `trainingProgramme`, `coaches`, `crew`, `chat`, and `leaderboard`. Puma must become a first-class
organisation/club record with a stable `organisationId` (or the existing stable
club ID, if it is formally adopted as the organisation identifier). Its Yoska
organisation ID belongs on that record as partner configuration.

The recommended API split is:

| API audience | Future route shape | Scope rule |
| --- | --- | --- |
| Athlete mobile app | `GET /training-programmes/me/leaderboard`, `/training-programmes/me/workouts`, `/training-programmes/me/coaches` | Backend resolves the caller's active programme and organisation. No scope ID is sent by mobile. |
| Trusted admin/provisioning API | `/organisations/:organisationId`, `/organisations/:organisationId/training-programmes` | Role-protected; the explicit organisation ID is validated against the administrator's authority. |
| Partner configuration service | Internal service/repository lookup by `organisationId` and `trainingProgrammeId` | Resolves Yoska organisation/programme/chat configuration; never exposed to the athlete client. |

Ship the neutral athlete routes and organisation-aware administrative APIs with
compatibility aliases for the current `/partner/puma/*` routes. Migrate
supported clients, then retire the Puma aliases. Do not replace a hard-coded
Puma path by adding `:organisationId` to athlete mobile requests: that would
weaken the data-isolation model.

Partner-side Strava capacity work remains separate: move toward activity-driven/webhook sync and programme-aware BullMQ jobs with deduplication, throttling, and retries. It should not delay this onboarding/leaderboard launch after the release gate passes.

