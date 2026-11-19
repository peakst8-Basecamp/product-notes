# Embedded Ticketing: user experience

**Organisers never touch code.** They paste their website link, peakst8 puts the ticket bar on their site, checks that it's live and tells them. Anyone who wants the code still gets it in one copy, with the right steps for their site builder.

Status: Draft · Owner: Arvind · updated 19 Nov 2026 · Help doc: [release.ps8.in/#website-tickets](https://release.ps8.in/#website-tickets)

## The release note (what we publish when it ships)

This is the entry that goes into the [release log](https://release.ps8.in/#release-log) on ship day. The feature is done when every line below is true.

| Field | Text |
| --- | --- |
| **Title** | Sell tickets on your own website, with no code |
| **Byline** | Paste your website link; peakst8 adds the ticket bar and tells you when it's live. |
| **Why** | Organisers were sent an npm link and two raw values over WhatsApp. Most have no developer, so the ticket bar never reached their site. |
| **What changed** | The Website Embed tab asks where tickets should appear. peakst8 recognises the site builder, then installs the ticket bar for the organiser, sends the code to their developer, or gives a one-line snippet with the exact steps. Every install is checked on the live page, and the organiser is told if it ever disappears. |
| **Who can use it** | Every host, from Manage → Website Embed on app.peakst8.club |
| **Guide** | [Sell tickets on your website](https://release.ps8.in/#website-tickets) |
| **Metric** | Share of organisers who switch on Website Embed and are live within 24 hours |
| **Rollback** | Hide the install options; the snippet and Event Id stay in the tab |

## Today vs the target

| Step | Today | Target |
| --- | --- | --- |
| Getting the code | A developer shares an npm link and a script on WhatsApp | The Website Embed tab has everything; the help doc is the only link we send |
| In the app | Manage → Website Embed shows a switch, then **peakst8 Base Url** and **Event Id** to copy | The tab asks for the organiser's web page and offers ways to install |
| Putting it on the site | The organiser assembles the script and finds where to paste it | peakst8 installs it, or sends it to their developer, or shows the one step for their builder |
| Knowing it works | Nobody checks | peakst8 checks the live page, shows **Live on yoursite.com**, and emails if it goes missing |

## The organiser's journey

1. **Switch on.** Manage → Website Embed → **Sell tickets on your website**.
2. **Paste your page.** "Where should tickets appear?" The organiser pastes the page link, for example `cubbonclassic10k.com/register`.
3. **We recognise the site.** peakst8 shows "Built with Webflow" (or WordPress, Wix, Squarespace, Shopify, Framer, or "a custom site").
4. **Pick how to install.** Best option first:

    | Option | What the organiser does | What happens |
    | --- | --- | --- |
    | **Let peakst8 do it** (default) | Invites support@peakst8.club to edit the site, with the role we name for their builder | We add the ticket bar, test a booking up to payment and email the organiser |
    | **Send it to my developer** | Types the developer's email | The developer gets the snippet, the builder steps and the help doc link |
    | **Copy the code** | Copies one line, with the Event Id already in it | The tab shows the one place to paste it for their builder |
    | **Connect** (V2) | Approves peakst8 in their WordPress, Shopify, Webflow or GitHub | We install it through that app, with no manual step |

5. **We confirm it's live.** The tab moves to **Live on yoursite.com** with a "Try a booking" link. If we can't find the ticket bar on the page, the tab says what to check.
6. **We keep watching.** If the ticket bar disappears from the page (a site redesign, a removed block), we email the organiser and the tab shows **Needs attention**.

## What athletes see

A ticket bar at the bottom of the organiser's page. They pick a ticket, sign in and pay without leaving the site. Their ticket, check-in and refunds work exactly as on app.peakst8.club, and the booking shows in the organiser's Athletes tab marked **Website**.

## The Website Embed tab, state by state

| State | What the organiser sees |
| --- | --- |
| **Off** | One line on what it does, and the switch |
| **Add your site** | "Where should tickets appear?" with a field for the page link |
| **Choose how** | The site builder we recognised and the install options, Let peakst8 do it first |
| **Installing** | "We're on it" (peakst8 installs) or "Sent to your developer", with the time we last checked |
| **Live** | **Live on yoursite.com**, "Try a booking", and bookings from the website this week |
| **Needs attention** | What we found on the page, what to check, and "Ask us to fix it" |

The **peakst8 Base Url** field goes away. The Event Id stays, inside the snippet, under "Copy the code".

## The snippet

Shorter, served from our own domain, and always the latest version:

```html
<script src="https://app.peakst8.club/embed.js" data-event="your-event-id" async></script>
```

Today's snippet loads a pinned version from unpkg and needs a base URL. Serving it from app.peakst8.club means fixes reach every organiser without anyone re-pasting code. The race-site loader in [code/frontend/public/embed/v1.js](code/frontend/public/embed/v1.js) can take this role.

## Messages

| When | To | Message |
| --- | --- | --- |
| Organiser picks Let peakst8 do it | Organiser | "Thanks. Invite support@peakst8.club as <role> on <builder>. We'll have tickets on your site within one working day." |
| Organiser picks Send it to my developer | Developer | "<Club> wants peakst8 tickets on <page>. Paste this one line before the closing body tag: <snippet>. Steps for <builder>: <help doc link>." |
| Ticket bar found on the page | Organiser | "Tickets are live on <page>. Try a booking: <link>." |
| Ticket bar missing for 24 hours | Organiser | "We can't find your ticket bar on <page>. Reply and we'll fix it." |

## Phases

| Phase | What ships | Done when |
| --- | --- | --- |
| **Now** (no build) | The [help doc](https://release.ps8.in/#website-tickets) replaces the npm link. The team installs by hand for anyone who invites support@peakst8.club, using Claude to do the edit and the test booking. | Every organiser gets the help doc link, not npm |
| **V1** | New Website Embed tab with the states above; builder recognised from the page; Let peakst8 do it, Send it to my developer and Copy the code; live check and daily re-check; the shorter snippet | An organiser with no developer is live the same day without writing to support on WhatsApp |
| **V2** | Connect: WordPress plugin, Shopify app, Webflow app and a GitHub pull request for coded sites | A WordPress or Shopify organiser goes live in one approval |
| **Later** | A preview of the organiser's own page with the ticket bar on it, before they install | |

## Rules

- We only change a site the organiser has invited us to, and only the ticket bar.
- After installing we tell the organiser they can remove our access, and remind them a week later.
- We never ask for an organiser's password. Access is always an invite from their builder.
- One Experience per page.

## Open questions

| Question | Owner |
| --- | --- |
| Who on the peakst8 team handles "Let peakst8 do it" installs, and within what time? | Arvind |
| Do we keep the pinned unpkg snippet working for organisers who already pasted it? | Engineering |
| Do we charge for done-for-you installs, or keep it free while we onboard the first organisers? | Arvind |
