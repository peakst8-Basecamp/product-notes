# peakst8 Embedded Ticketing

**A peakst8 product feature.** Clubs and races sell entries on their own website. peakst8 still runs checkout, payments, tickets and check-in, so the platform fee is unchanged, while the search traffic and attribution stay with the organiser.

**Status:** In build · **Owner:** Arvind · **Updated:** 9 Nov 2026

| For | Open |
| --- | --- |
| Anyone | This page |
| Engineers and designers | [Product note](https://peakst8-basecamp.github.io/product-notes/embedded-ticketing/): how it works, SEO and AEO requirements, scope, timeline · [Code](code/) |
| Designers | [Product screens*](https://peakst8-basecamp.github.io/product-notes/embedded-ticketing/prototype/): 17 V1 screens |

\* The screens are a proposal to capture the idea. Rebuild them in our design language.

## The problem

Organisers list on peakst8 and link out, or drop in a ticketing iframe such as KonfHub. Either way Google and AI answer engines credit someone else, nobody can fire their GA4 or Meta pixel on a booking, and the organiser builds no search presence of their own.

## Who it's for

Community fitness clubs and races in Indian metros that run paid events, have a website, and have no in-house developer.

| Design partner or pilot | What they run | Go-live |
| --- | --- | --- |
| **Cubbon Classic 10K** ([conversations](../athlete-os-cubbon-classic/)) | A 10K race, Edition 2 on 21 Mar 2027. 220 registrations on KonfHub, 3,500 expected. | **20 Nov 2026** (moved up, goes first) |
| **Find Your Fit** | Recurring community runs | 30 Nov 2026 |
| **Sisters in Sweat** | Women's fitness community events | 7 Dec 2026 |

## Why now

Cubbon Classic has registration open on KonfHub today and has offered to move it if we ship. Every week we wait, more runners sign up elsewhere.

## Goals

1. Organisers go live on their own site in under 10 minutes, with one snippet.
2. Cubbon Classic leaves KonfHub by 20 Nov without losing a single registration.
3. Bookings through Embed show up in the organiser's own analytics.
4. Event pages rank on Google and get quoted by AI answer engines (V1 full scope).

## How we'll know it works

| Metric | Target |
| --- | --- |
| Registrations moved from KonfHub (Cubbon) | 220 of 220 |
| Book-to-paid conversion on mobile | Not lower than the peakst8 event page |
| Share of pilot GMV through Embed | Reviewed at go / no-go, 15 Jan 2027 |
| Bookings from organic and AI referrals | Tracked from launch |

## What we have, what we don't yet

| Have | Not yet |
| --- | --- |
| Product note and 17-screen prototype | Live for any organiser |
| [Code package](code/): race-site loader, early-bird tiers, bulk group codes, KonfHub import, per-site security. Checked against the backend on 9 Nov. | Merged into the peakst8 backend and frontend |
| | Event pages on the organiser's domain (SEO and AEO) |
| | Club codes on approval and bib export |
| | Organiser dashboard screens |

## Timeline

| When | Milestone |
| --- | --- |
| 20 Nov 2026 | Cubbon Classic live on cubbonclassic10k.com |
| 30 Nov 2026 | Find Your Fit live |
| 7 Dec 2026 | Sisters in Sweat live |
| 15 Jan 2027 | Go / no-go for all organisers |
