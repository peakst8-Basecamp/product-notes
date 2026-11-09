# peakst8 Club Memberships

**A peakst8 product feature.** Clubs sell monthly memberships and prepaid run packs on peakst8, with perks and brand offers members can see. Members pay once and keep booking each session as they do today; the plan applies at checkout. Clubs get predictable monthly income, and their regulars get a reason to stay.

**Status:** Draft · **Owner:** to assign · **Updated:** 2 Nov 2026

| For | Open |
| --- | --- |
| Anyone | This page |
| Engineers and designers | [Product note](https://peakst8-basecamp.github.io/product-notes/memberships/): journeys, scope, risks, open questions · [Code and architecture](code/) · [Feature list](coverage/README.md) |
| Designers | [Product screens*](https://peakst8-basecamp.github.io/product-notes/memberships/prototype/): club page with Gold, Silver and Bronze levels, brand perks, admin dashboard |

\* The screens are a proposal to capture the idea. Rebuild them in our design language.

## The problem

Clubs run the same sessions every week but sell them one ticket at a time. Regulars pay full price every session or pay the organiser outside peakst8, and nothing shows what being a regular is worth. Club income swings with each week's bookings.

## Who it's for

- **Club admins** of run clubs, women's collectives, strength and yoga groups that run recurring sessions.
- **Regular members** who come 4 to 12 times a month.
- *Not yet:* one-off races, passes across several clubs, 1:1 appointments.

## Why now

The pilot clubs already book through peakst8 checkout, Razorpay supports UPI AutoPay for recurring payments, and SweatPals has proven the model. Every month a club collects memberships off-platform is revenue peakst8 doesn't see.

## Goals

1. Clubs earn predictable monthly income on peakst8.
2. Regulars book with no friction and can see their plan's value.
3. No member is ever charged without a reminder first.
4. Club admins run plans, perks and discounts on their own.

## How we'll know it works

| Metric | Target |
| --- | --- |
| Share of pilot clubs' GMV from plans | 30% in 90 days |
| Active plan holders per pilot club | 50 in 60 days |
| Renewals that succeed first time | 90% |
| Monthly plan churn | Under 8% |
| *Guardrail:* complaints about unexpected charges | 0 |

## What we have, what we don't yet

| Have | Not yet |
| --- | --- |
| Product note, prototype and a 110-row feature list | Live for any club |
| [Backend code package](code/) checked against the backend on 2 Nov | Merged into the backend; frontend not built |
| | Renewal reminders: these must ship before memberships go live |
| | Pilot clubs and prices picked |
| | Decisions: session model, platform fee on plans, refunds |

## Next

Build the renewal reminders, then pick two pilot clubs.
