# Cubbon Classic: embedded registration code package

Code that replaces the KonfHub registration widget on [cubbonclassic10k.com/register](https://cubbonclassic10k.com/register) with peakst8. It belongs to the [Athlete OS · Design Partner #2: Cubbon Classic 10K](../README.md) note and implements V1a in that note: registration on the race's own site, early-bird and bulk pricing, and moving existing KonfHub registrations onto peakst8.

It is **not** on a branch in `peakst8-backend` or `peakst8-frontend` yet. The engineer who picks it up copies it in, applies the two patches and ships it from there.

## What it replaces

On 9 Nov 2026 the KonfHub dashboard for Cubbon Classic 10K showed **220 paid registrations**, **₹3,74,189.80** total sales and no refunds, with sales starting around 20 Oct. The race site embeds KonfHub's "Registration Button" widget (created 25 Sep 2026), which loads an iframe.

| KonfHub today | peakst8 with this package |
| --- | --- |
| Registration widget: an iframe from KonfHub | One `<div>` and one script. Passes and prices render into the race site's own page; checkout opens over it. |
| Attendee data lives in KonfHub | Every registration is a peakst8 registration with a ticket, a QR code and a bib slot |
| Discount codes | Early-bird tiers that step down by date or seats (15% → 10% → 5% off), plus group codes for bulk buys (~20% off) |
| Webhook / API for the organiser | Booking events go to the race's own GA4 and Meta pixel |
| 220 registrations already sold | KonfHub CSV import issues each runner a real peakst8 ticket, with the amount they paid |

## What's here

Paths mirror each repo, so each file goes to the same path there.

### Backend (`backend/`, for `peakst8-backend`)

| File | What it does |
| --- | --- |
| `prisma/embed.prisma` | New models (`EventEmbed`, `CategoryPriceTier`, `RegistrationImport`, `ImportedRegistration`), two enums, and the fields to add to `Event`, `Category` and `Registration` (bottom of the file) |
| `src/services/helpers/embedPricing.helpers.ts` | Pure rules: which early-bird tier applies, tier vs coupon (no stacking), display price with GST, allowed origins, CSV and KonfHub export parsing |
| `src/services/embed.service.ts` | Public embed data, the checkout pricing hook, organiser settings, tiers, group codes, KonfHub import preview and import (issues tickets in the background) |
| `src/repositories/embed.repository.ts` | Prisma queries |
| `src/middlewares/embedCors.middleware.ts` | CORS for the public endpoint, from each event's allowed websites |
| `src/dto/embed.dto.ts`, `src/controllers/embed.controller.ts`, `src/routes/embed.routes.ts` | HTTP layer, mounted at `/embed` |
| `src/interfaces/embed.interface.ts`, `src/lib/embed.constants.ts` | Types and constants |
| `patches/registration.service.patch` | The checkout hook in `registrationService.register` |
| `patches/index.patch` | Mounts `/embed` in `src/index.ts` |
| `scripts/check-embed.ts` | Standalone checks for the pure rules (the backend has no test runner) |

### Frontend (`frontend/`, for `peakst8-frontend`)

| File | What it does |
| --- | --- |
| `public/embed/v1.js` | The loader the race site includes. No dependencies. Renders a button or a pass list with live prices, opens checkout in an overlay (or a new tab with `data-checkout="tab"`), forwards booking events to the site's GA4 and Meta pixel. |
| `lib/embed.ts` | Embed mode for the event page: reads `?embed=1&register=1&host=…&pass=…`, and posts `purchase` / `close` to the race site |

## Endpoints

| Method and path | Who | What |
| --- | --- | --- |
| `GET /embed/v1/events/:eventId` | Public, CORS per event | Event, passes with list price and current early-bird price, bulk rule, brand, tracking ids, checkout URL. Cached 60 seconds. |
| `GET /embed/events/:eventId/settings` | Host | Settings, the snippet to paste, tickets sold per price tier |
| `PUT /embed/events/:eventId/settings` | Host | Turn on, allowed websites, button label, colour, GA4 / pixel ids, bulk minimum and discount |
| `PUT /embed/events/:eventId/categories/:categoryId/tiers` | Host | Replace a pass's early-bird tiers |
| `POST /embed/events/:eventId/group-codes` | Host | Bulk buy: a code for a company or club, one use per entry bought, at the bulk discount |
| `POST /embed/events/:eventId/imports/konfhub/preview` | Host | Read a KonfHub CSV and show rows, problems, refunds skipped and ticket-name → pass matching. Writes nothing. |
| `POST /embed/events/:eventId/imports/konfhub` | Host | Save the rows and issue tickets in the background (`202`) |
| `GET /embed/events/:eventId/imports/:importId` | Host | Progress and the rows that were duplicates, invalid or failed |

## Rules worth knowing

- **Early-bird tiers** apply to every registration on the pass, embedded or not, so the price is the same on ps8.club and on the race site. The first tier by order that has started, hasn't ended and has seats left applies. A tier's seats count registrations that are paid or awaiting payment.
- **No stacking.** If a runner has a coupon or group code, they get the bigger of the tier and the code. With Cubbon's numbers, a 20% bulk code beats the 15% early bird; a 10% code loses to it.
- **Bulk buys are group codes.** peakst8 allows one registration per runner per event, so a bulk buy is a code with as many uses as entries bought. Each runner registers with it. Codes are refused below the bulk minimum.
- **Imports issue real tickets** (QR code and ticket image) and record the amount paid on KonfHub. Refunded and cancelled rows are skipped, and anyone already registered on peakst8 is marked as a duplicate, not charged or ticketed twice. No email goes out from the import: the "your entry has moved" emailer is sent separately once the counts are checked.

## What's checked

Verified on 9 Nov 2026 against `peakst8-backend` `main` (`5ff71d9`), copied into a scratch checkout with these files and the schema merged in and both patches applied:

| Check | Result |
| --- | --- |
| `prisma validate` and `prisma generate` with `embed.prisma` merged | Pass |
| `tsc --noEmit` (whole backend, with both patches) | Pass, 0 errors |
| ESLint on every backend file here and both patched files | 0 errors, 0 warnings |
| Prettier | Clean |
| cspell (with `KonfHub`, `konfhub`, `KONFHUB`, `Cubbon`, `cubbonclassic` added to `cspell.json`) | Clean |
| `scripts/check-embed.ts`: tiers by date and seats, tier vs coupon, GST display, tier validation, origins, CSV, KonfHub parsing | 35 of 35 pass |
| `frontend/public/embed/v1.js` | `node --check` passes |
| `frontend/lib/embed.ts` | `tsc --strict` passes on its own |

**Not checked:** nothing has run against a database, Redis, S3 or Razorpay. The loader hasn't run in a browser. The frontend event-page changes below are described, not written, because the registration drawer is tied closely to `EventV2Client` state. The KonfHub column names are matched by common header names; run the preview on Cubbon's real export before importing.

## Integrating it

### Backend

1. **Schema.** Paste the models and enums from `prisma/embed.prisma` into `prisma/schema.prisma`, add the fields listed at the bottom to `Event`, `Category` and `Registration`, then `bun run migrate:db`.
2. **Files.** Copy `src/**` and `scripts/**` to the same paths.
3. **Patches.** `git apply patches/registration.service.patch patches/index.patch` (or make the same two edits by hand: the tier/coupon hook before `calculateRegistrationAmount`, and `app.use('/embed', embedRoutes)`).
4. **Spelling.** Add `KonfHub`, `konfhub`, `KONFHUB`, `Cubbon` and `cubbonclassic` to `cspell.json`.
5. **Run the gate.** `bun run check` and `bun scripts/check-embed.ts`.

### Frontend

1. Copy `public/embed/v1.js` and `lib/embed.ts`. The loader is served from `https://ps8.club/embed/v1.js`. Set `data-api-origin` on the script tag if the API isn't `https://api.ps8.club`.
2. **Event page in embed mode** (`app/(routes)/(public)/event/[id]/(v2)/EventV2Client.tsx`): call `readEmbedParams(useSearchParams())`. When `openRegistration` is true, open the registration drawer once categories load, preselecting `passId` if given (`isCategoryPreselected: true`). When `isEmbedded` is true, hide the site header, footer and app banners, and keep everything inside the overlay. The layout already switches by pathname in `app/(routes)/(public)/event/[id]/layout.tsx`, so add an `embed` branch there.
3. **Report the booking.** On the post-registration page (`getPostRegistrationPath` → `/event/:id/ticket`), call `postToEmbedHost('purchase', { value: <amount in paise>, transactionId })` once, then show a "Done" button that calls `postToEmbedHost('close')`.
4. **Framing.** Nothing sets `X-Frame-Options` in `next.config.ts` today. If CloudFront or a proxy does, allow `/event/*` to be framed when `embed=1` (a `headers()` rule with `has: [{ type: 'query', key: 'embed', value: '1' }]` and `Content-Security-Policy: frame-ancestors https:`).

### Turning it on for Cubbon Classic

1. `PUT /embed/events/<cubbon event id>/settings` with `isEnabled: true`, `allowedOrigins: ["https://cubbonclassic10k.com", "*.cubbonclassic10k.com"]`, Cubbon orange `#ff5a1f`, their GA4 and pixel ids, `bulkMinQuantity` and `bulkPercentOff: 20`.
2. `PUT …/categories/<pass id>/tiers` with the three early-bird tiers and their end dates (to be confirmed with Nithin).
3. Preview, then import the KonfHub export. Check the issued count against KonfHub's 220.
4. Their web team swaps the KonfHub widget for the snippet from `GET …/settings`.
5. Send the "your entry has moved" emailer, then leave KonfHub read-only for 30 days.

## Before it ships

- **Sign-in inside the overlay.** The refresh cookie is `sameSite: 'strict'`, and Safari blocks third-party storage in iframes. Run the full flow (OTP, Razorpay, ticket) inside the overlay on iPhone Safari on staging. If sign-in doesn't hold, use `data-checkout="tab"` for launch.
- **Tier windows.** Get Nithin's dates (and seat limits, if any) for the 15%, 10% and 5% tiers.
- **Activity add-ons.** A tier lowers the pass's base price only. A coupon still applies to the pass plus any paid activities, as it does today.
- **Emailer.** Write the "your entry has moved" email (ticket link, app download, what changes) and send it from the existing email tooling after the import.
- **SEO pages.** Server-rendered event pages on `events.cubbonclassic10k.com` (the Embedded Ticketing note's full scope) come after this. The loader is the fastest way off KonfHub.
