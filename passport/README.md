# peakst8 Passport

**A peakst8 product feature.** An athlete books a whole trip around a race, trek or camp in one go: the event entry, a place to stay, food, local transfers, recovery and the extras around it. peakst8 curates one or two base packages for each experience, the athlete adds what they want on top, and pays once.

[Product note](https://peakst8-basecamp.github.io/product-notes/passport/) · [Figma design](https://www.figma.com/design/TfoO40tw7pts5GQenTYzag/Athlete-Experience-Details?node-id=1029-6210&t=Ssur8zRQ8012HHyf-4) · [Discover packages (live)](https://app.peakst8.club/events?tab=packages) · Status: Pilot · Owner: Shravan · updated 28 Nov 2026

## What it is

A Passport is a new kind of experience on peakst8. A normal peakst8 event sells a ticket. A Passport sells **an entire package around an event**:

| Part of the package | Example (HYROX Noida) |
| --- | --- |
| **Event ticket** | HYROX Noida race entry |
| **Stay** | 3 nights at a private villa (Shakeout House) or a 5-star hotel (Race Week HQ) |
| **Food** | Food at the villa, or meals as per the hotel room plan |
| **Transportation** | Local transfers, a venue visit before race weekend |
| **Recovery** | Morning yoga, a carb-loading get-together, a recovery party |
| **Extras** | Accelerated bib collection, race photography and videography |
| **Add-ons (optional, paid)** | Heritage Day (Taj Mahal and a fourth night), Solo Mode (a room to yourself) |

Passports come in three groups: **Race Week Curation** (race weekends such as HYROX, Ironman, UTMB, the World Marathon Majors), **Into the Wild** (Himalayan treks) and **Training Camps** (Kalaripayattu, open-water swimming, Muay Thai, surfing and similar).

### Where the event ticket comes from

Some events, such as HYROX, sell their tickets only through their own official channels, not through peakst8. peakst8 cannot sell those tickets directly. Instead:

1. peakst8 **buys the event tickets** from the official channel.
2. peakst8 **builds a Passport** around them: the ticket plus stay, food, transport, recovery and add-ons.
3. The athlete **buys the Passport on peakst8**, and the ticket comes as part of the package.

This is why a Passport is a package and not a ticket resale, and why the booking form asks for the details the official ticket needs (name as per government ID, date of birth, HYROX category and so on). For events peakst8 runs itself, the ticket is simply part of the package.

Under the hood, a Passport is a peakst8 event: each package is a ticket category, and add-ons belong to packages. Login, forms, waiver, Razorpay checkout and the ticket all work as they do for any event.

## What it solves

| Who | Today | What it costs them |
| --- | --- | --- |
| **Athlete travelling for a race** | Books the race entry on one site, then finds a hotel near the venue, arranges transfers, works out food and recovery, and hopes to meet other athletes. | Hours of planning, a stay that is often far from the venue, and a race week spent alone. International athletes have it hardest. |
| **Athlete looking for their next challenge** | No single place to discover races, treks and camps they could travel for. | They find out late, or not at all. |
| **Clubs and gyms bringing a group** (for example a Bali gym bringing 10–12 athletes to HYROX Noida) | Each coordinator builds the trip by hand for the whole group. | Effort, and no group benefits. |
| **peakst8** | Sells tickets to events but nothing around them, and cannot sell tickets at all for events like HYROX, which sell only through their own channels. | Misses the larger spend around each race, and the chance to make peakst8 the place athletes plan their season. |

The bet, from the [go-to-market plan](#sources): some people pick the challenge first and plan the trip around it. They want one place to discover, plan and book curated active experiences, with community, convenience and exclusive access bundled in, and will pay a premium of about 10–20% for that (**hypothesis**, being tested).

## Features

What an athlete can do today:

1. **Discover packages.** A **Discover packages** tab on the events page shows one featured Passport at the top, then rows for Race Week Curation, Into the Wild and Training Camps, in the order the team sets and then by date. The featured Passport is bookable now; the others open a **waitlist** so we can measure interest before we build them.
2. **See the whole experience on one page.** Duration, destination and next departure, what the experience is about, **what's included** (picture cards), **what's not included**, the **packages** with stay, occupancy and price, and FAQs.
3. **Choose a package.** Each package is a base (for example the villa or the hotel) with its own price, photos and room type. Sold-out and closed packages stay visible but cannot be picked.
4. **Add extras.** Optional paid add-ons for the chosen package, each with photos, what it includes and its price. The total updates as they are picked.
5. **Book in five short steps.** Package → Add-ons → Your details → Review → Waiver, then payment. Signed-in athletes get their details filled in. Progress is kept if the page is refreshed.
6. **See the full price before paying.** The review shows the package, each add-on, any discount, GST and the total, and the amount charged is the same.
7. **Pay and get a ticket.** Razorpay checkout as for any event. Packages can also be free or need host approval first. After booking, the page shows where the booking stands: View Ticket, Complete Payment, Retry Payment, Approval Pending and so on.
8. **Share the page.** Each Passport has its own link with a title, description and preview image.

What the peakst8 team gets:

- Passports stay out of the normal event listings, so they don't crowd the events feed.
- The same add-on can be offered on more than one package.
- The duration (for example "4 Days 3 Nights") is worked out from the dates in the venue's time zone.

Built but not switched on yet: the **day-by-day itinerary**, **photo walls**, **package benefits**, and **paying in your own currency** (below).

## Paying in other currencies (Razorpay)

Passports are made for travel, and some buyers are abroad (the Bali gym group is the first). We want them to see and pay prices in their own currency.

**Today:** every Passport is priced and charged in **rupees (INR)** only.

**Being built** (not live yet):

1. The athlete is shown prices in their own currency, picked from the country they are browsing from. Anyone from an unsupported country, or with an older app, sees rupees as today.
2. Prices are still set in rupees. They are converted at a live exchange rate, refreshed every few hours.
3. A foreign-currency price carries a **4% conversion margin**. Razorpay charges more for international cards and converts at its bank's rate, and the margin keeps what we receive close to the rupee price.
4. Razorpay checkout opens **in the athlete's currency**. Razorpay pays peakst8 in rupees.
5. The rate is locked when the order is created, and each payment records its currency, the amount and the rate used, alongside the rupee price.

Twenty-five currencies are planned, including USD, EUR, GBP, AED, SGD, AUD, THB and JPY. **Indonesian rupiah (IDR) is not in the list yet**, although the first international group is from Bali.

**To decide before it goes live:** whether organisers set prices in other currencies (the product requirements ask for INR, USD, EUR and IDR) or we keep rupee prices and convert; whether to add IDR; how we show athletes the 4% margin; and confirming that international payments are switched on for our Razorpay account, with a test payment from Indonesia. Details are in the [product note](https://peakst8-basecamp.github.io/product-notes/passport/#currency).

## Who it's for

| | Who | What they need |
| --- | --- | --- |
| **Primary** | Athletes who travel for races (HYROX, Ironman, marathons), in India and abroad | Race entry, stay, food and transfers sorted in one booking, near the venue, with other athletes |
| **Secondary** | Clubs and gyms bringing a group, such as HYROX Training Clubs outside Delhi NCR and the Bali gym | One package for the whole group |
| **Secondary** | Athletes looking for a trek, camp or new skill | A curated calendar to discover and join |
| **Not for (yet)** | Outside organisers creating their own Passports | Passports are curated and set up by peakst8 for now |

## Why now

- **HYROX Noida in January** is the first live test. Two packages are built and partners have been sounded out. Posters and banners at HYROX events point athletes to Passport.
- The 2027 race calendar (HYROX, Ironman, UTMB, La Vuelta, the Marathon Majors) gives about ten race weekends built on events and athlete relationships we already have.
- An international group (the Bali gym) wants to come, which is why we need payments in other currencies.

## How we'll know it worked

Targets come from the go-to-market plan. They are proposed, not benchmarks.

| Metric | Target | Source |
| --- | --- | --- |
| Unique landing-page visitors | 1,500+ from the initial launch | PostHog |
| Visitor-to-waitlist conversion | 15%+ | PostHog and waitlist sign-ups |
| Qualified leads (destination, budget and travel window) | 100+ | Waitlist answers and follow-up |
| Experience categories with real demand | 3+ | Waitlist sign-ups by group |
| Serious booking enquiries | 20+ | Sales follow-up |
| Paid HYROX Noida bookings | **Assumption:** to set with Shravan | Registrations |
| **Guardrail:** normal event booking | No drop in event checkout completion | PostHog |

## Scope and phases

| Phase | What ships | Status |
| --- | --- | --- |
| **V1: HYROX Noida** | Discover packages tab, Passport page, packages and add-ons, five-step booking, Razorpay in rupees, waitlist for upcoming Passports | Live, being polished |
| **V1.1** | Paying in other currencies; itinerary on the page; coupons in the Passport flow | Built in parts, not live |
| **V2** | Screens for the team to create and edit Passports (itinerary, inclusions, exclusions, add-ons); add-on quantities and limits; themed backgrounds for each Passport | In design (Hansel) |
| **Later** | Passport stamps: discover and collect experiences; a physical passport handed out at events | Idea, from the requirements and go-to-market plan |

## Open questions

| Question | Owner | Status |
| --- | --- | --- |
| Do organisers set prices in other currencies, or do we keep rupee prices and convert? | Shravan, Jithin | Open |
| Do we add IDR for the Bali group? | Shravan, Jithin | Open |
| Are international payments switched on for our Razorpay account? | Jithin | Open |
| Do we show athletes the 4% conversion margin, or include it quietly? | Shravan | Open |
| Which HYROX Noida version do we sell: 4 days and 3 nights with a Taj extension, or the shorter 3-night version? | Shravan | Testing with customers |
| How do we treat GST on travel packages? | Finance, with an accountant | Open |
| For events sold through other channels (HYROX): how many tickets do we buy up front, and what happens to tickets we don't sell? | Shravan | Open |
| How do we get the ticket into the athlete's name, and does the event allow it? | Shravan | Open |

## Build

| What | Where |
| --- | --- |
| Design | [Figma: Athlete Experience Details](https://www.figma.com/design/TfoO40tw7pts5GQenTYzag/Athlete-Experience-Details?node-id=1029-6210&t=Ssur8zRQ8012HHyf-4) |
| Product note (engineers and designers) | [index.html](https://peakst8-basecamp.github.io/product-notes/passport/) |
| Backend | `peakst8-backend`: `/passport` routes, packages and add-ons on event categories, the cost breakdown. Multi-currency on branch `feat/razorpay-multi-currency` (not merged) |
| Frontend | `peakst8-frontend`: `/passport/[id]` and the Discover packages tab on `/events` |

## Sources

- Product requirements (Shravan): "PRD: peakst8 Passport - Event Booking Enhancements", Google Doc, shared in Mattermost on 19 Nov 2026
- Go-to-market strategy and hypotheses (Shravan), PDF in the **peakst8 Passport** channel, 18 Nov 2026
- HYROX Noida package guide and three-night itinerary (customer-facing), 23 Nov 2026
- Frontend integration plan (Jithin), Mattermost, 25 Nov 2026; flow review thread (Shravan), 25–27 Nov 2026
- The code in `peakst8-backend` and `peakst8-frontend`, `main` as of 27 Nov 2026
