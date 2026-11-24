# peakst8 Custom Emails

**A peakst8 product feature.** A club sends its registration emails under its own name and in its own design. The club picks a sender name and a sender address on `ps8.in`, peakst8's separate domain for club mail, and replaces the wording and design of each email its athletes receive while they register. An email the club has not customised keeps going out in the peakst8 design.

[Product note](https://peakst8-basecamp.github.io/product-notes/custom-emails/) · Status: In build · Owner: Jithin · updated 24 Nov 2026

## 1. The problem

Every email an athlete gets while registering for a club's event looks like it comes from peakst8, not from the club they signed up with.

| Who | Today | What it costs them |
| --- | --- | --- |
| **Club** | Every registration email is sent by "peakst8 Support" from `support@peakst8.club`, in the peakst8 design and wording. The club cannot change any of it. | The club's own brand disappears at the moment an athlete commits. Clubs that care about their voice ask us to edit emails for them by hand. |
| **Athlete** | Registers with a club, then gets a login code and a confirmation from a sender they may not recognise. | Emails are easier to miss or distrust, and the confirmation says nothing club-specific (what to bring, where to meet). |
| **peakst8 team** | A club that wants different wording needs an engineer to add a one-off email for that event. | Engineering time per club, and a growing set of special cases to maintain. |

## 2. Who it's for

| | Who | What they're trying to get done | What they need from this |
| --- | --- | --- | --- |
| **Primary** | Club hosts who run events on peakst8 | Make every touchpoint with their athletes feel like the club | Their own sender name and address, and control over each email's subject and design, without asking peakst8 |
| **Secondary** | Athletes registering for that club's events | Recognise who is writing to them and find what they need | Emails that are clearly from the club and still carry the essentials (login code, ticket details) |
| **Not for (yet)** | Clubs that want to send from their own domain (for example `hello@myclub.com`) | Full sender control | Not in this version: the address is always on `ps8.in` |

## 3. Why now

- Clubs are moving their whole registration onto peakst8 (see [Embedded Ticketing](../embedded-ticketing/) and [Onboarding Clubs](../onboarding-clubs/)). When checkout sits on the club's own website, a peakst8-branded email right after it is the one place the club's brand breaks.
- We have already built one-off branded emails for single events by hand. Each new one costs engineering time, and this replaces that with something a host does themselves.

## 4. What we're building

A new **Emails** tab in the club's settings, with two parts.

**Sender**

1. The host sets the **sender name** athletes see in their inbox (for example "Cubbon Run Club").
2. The host picks the part of the **sender address** before the `@` (for example `cubbonrunclub`). The address is always on `ps8.in`, so mail goes out as `cubbonrunclub@ps8.in`.

**Emails**

3. The tab lists the emails peakst8 sends during a registration. Each one names the moment it is sent and shows whether the club is on the default or its own version.
4. For any email, the host switches from **Default** to **Custom HTML**, pastes their own HTML, and optionally sets their own subject line.
5. Each email has a short list of **variables** the host places in the HTML, written like `{{ otp }}` or `{{ eventName }}`. peakst8 fills them in for each athlete when the email is sent. Some are required: the editor shows them and will not save a design that leaves one out.
6. A **preview** shows the email as designed, with the variables shown as written. The host can go back to the peakst8 default at any time.

Every email an athlete can get during a registration, and where each one stands:

| Email | When the athlete gets it | What the club can use in it | Status |
| --- | --- | --- | --- |
| **Event Registration OTP** | They enter their email on the club's registration form and need a code to continue | The code, their first name, when the code expires | Available |
| **Ticket Confirmation** | Their spot is confirmed (free registration, successful payment, a squad member joining, or a host approving a free request) | Their name, the event, club and pass names, location, start and end dates, the WhatsApp group button, the ticket's QR code | Available |
| **Request Received** | They ask to join an approval-based event and are waiting for the host's decision. The general version of this email is switched off today. | To be defined | **Incomplete** |
| **Request Approved** | A host approves their request and they need to pay to confirm their spot | To be defined | **Incomplete** |
| **Request Declined** | A host declines their request | To be defined | **Incomplete** |
| **Incomplete Registration Reminder** | They started the registration form without logging in and did not finish it | To be defined | **Incomplete** |
| **Abandoned Cart** | They reached payment and their held spot expired before they paid | To be defined | **Incomplete** |
| **Waiver Copy** | Their spot is confirmed and they get a PDF copy of the waiver they accepted | To be defined | **Incomplete** |
| **Invoice** | They paid and their tax invoice is ready | To be defined | **Incomplete** |

**Incomplete** means the club cannot customise it yet: it still goes out in the peakst8 design, from the peakst8 sender. The order they are built in is not decided (see section 8).

### Planned improvement: a separate domain for club mail

Not built yet. Today a club's sender address is on `peakst8.club`, the same domain peakst8's own emails use. Before clubs go live it moves to **`ps8.in`**.

| Who is sending | Sent from |
| --- | --- |
| peakst8's default emails (a club that has customised nothing) | `support@peakst8.club`, as today |
| A club's custom emails | the club's address on `ps8.in`, for example `cubbonrunclub@ps8.in` |

**Why.** Inbox providers such as Gmail judge a sending domain by the mail that comes from it. If a club's design or wording gets marked as spam, that counts against the whole domain. Keeping club mail on `ps8.in` means it cannot hurt delivery of peakst8's own login codes and tickets from `peakst8.club`.

**What it needs.** `ps8.in` set up and approved for sending, the Emails tab showing `@ps8.in`, and any sender address a club has already saved moved across.

### Planned improvement: consent and opt-out

Not built yet. Once clubs write their own emails, we need to be able to show that an athlete agreed to receive them and can stop them.

**What we add**

1. **An opt-in checkbox on the registration form.** It is unticked by default, sits apart from the terms and waiver tick, and says in plain words who will email the athlete (the club and peakst8) and about what. We keep a record of when the athlete ticked it and the wording they saw.
2. **An opt-out button in the emails.** One click, no login, and it takes effect straight away. Opting out must be as easy as opting in.
3. **Opt-outs are respected at send time.** An athlete who has opted out stops getting the optional emails from that club.
4. **Every opt-in and opt-out is saved.** We keep a permanent record in our database, so that if an athlete, a club or a regulator asks, we can show exactly what was agreed and when.

**What we save**

| | What is recorded |
| --- | --- |
| **Opt-in** | Who (the athlete and their email address), for which club, when, on which event's registration form, and the exact wording of the checkbox they ticked |
| **Opt-out** | Who, for which club, when, and which email the opt-out button was clicked in |
| **History** | Every change is added as a new entry and nothing is overwritten. An athlete who opts in, out and in again has three entries, and the latest one decides whether they get optional emails. |

An athlete who leaves the box unticked is also recorded, so "never asked" and "asked and said no" are not confused. How long the records are kept is a question for the lawyer.

**Why: the Indian law**

- The [Digital Personal Data Protection Act, 2023](<https://www.indiacode.nic.in/bitstream/123456789/22037/2/a2023-22.pdf>) (DPDP Act), section 6, says consent must be free, specific, informed, unconditional and unambiguous, given by a clear affirmative action. A pre-ticked box or silence does not count.
- The same section lets a person withdraw consent at any time, says withdrawing must be as easy as giving it, and requires us to stop within a reasonable time.
- The DPDP Rules were notified on 13 November 2025. The consent obligations start applying 18 months later, around **13 May 2027** ([government notification](<https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf>)).
- India has no email-specific law like the US CAN-SPAM Act, and the DPDP Act does not mention email or unsubscribe links. An unsubscribe button is the practical way to meet the "as easy to withdraw" rule ([commentary](<https://chambers.com/articles/s-r-data-yes-means-yes-managing-consent-under-india-s-new-data-protection-law>)).

This is our reading of the Act and of published commentary, not legal advice. A lawyer should confirm it before we build.

**Essential and optional emails are treated differently**

| Kind | Emails | Opt-out |
| --- | --- | --- |
| **Essential**: needed to complete the registration the athlete asked for | Event Registration OTP, Ticket Confirmation, Request Received, Request Approved, Request Declined, Waiver Copy, Invoice | No opt-out. An athlete who opts out still gets their code and their ticket. |
| **Optional**: reminders and promotion | Incomplete Registration Reminder, Abandoned Cart, and any future announcements from the club | Sent only with opt-in; carries the opt-out button |

Which emails count as essential is our proposal and is one of the things to confirm with a lawyer.

## 5. Goals and non-goals

**Goals**

1. A host can make the club the visible sender of its registration emails without contacting peakst8.
2. A host can replace the subject and design of each listed email, and undo it.
3. A custom email can never go out missing the thing it exists to deliver (the login code, the ticket details).
4. A club that changes nothing sees no difference: the peakst8 design stays the default.

**Non-goals**

- **Sending from the club's own domain.** The address is always on `ps8.in`.
- **A drag-and-drop email builder.** Hosts paste HTML they made elsewhere.
- **Different designs per event.** A club's design applies to all of its events.
- **Marketing emails.** This covers the emails sent automatically during registration, not campaigns or announcements.
- **Campaign-specific emails** that peakst8 runs for particular events (for example founders peak and Project 3) keep their own designs.

## 6. How we'll know it worked

| Metric | Baseline | Target | When | Source |
| --- | --- | --- | --- | --- |
| Clubs that have set their own sender | 0 | **Assumption:** 5 clubs | 4 weeks after launch | Club email settings in the database |
| Clubs with at least one custom email | 0 | **Assumption:** 3 clubs | 4 weeks after launch | Same |
| Requests to engineering for a one-off club email | Not counted today | None for the emails in the list | From launch | Engineering requests |
| **Guardrail:** registration emails that fail to send | Current failure rate in the email log | No increase | Weekly | Outbound email log |

The targets are guesses; we set real ones after the first two clubs have used it.

## 7. Key journeys

1. **As a host, I set my club's sender name and address, so that athletes see my club in their inbox.**
   Done when: the next registration email for any of the club's events arrives from that name and address.
2. **As a host, I paste my own design for the Ticket Confirmation, so that athletes get my club's wording and instructions.**
   Done when: the preview shows the design, saving is refused if a required variable is missing (with the missing ones named), and the next confirmed athlete receives the club's version with their own details filled in.
3. **As a host, I go back to the default, so that a design I no longer want stops going out.**
   Done when: the email shows as Default again and the next athlete receives the peakst8 design.
4. **As an athlete, I register for a club's event, so that I get my code and my ticket.**
   Done when: both emails arrive from the club's sender, with the right code and ticket details, whether or not the club customised them.

## 8. Scope and phases

| Phase | What ships | Gate to move on |
| --- | --- | --- |
| Prerequisite | The two email types are added to the list by the peakst8 team (name, description and required variables for each) | Both appear in the Emails tab |
| **V1** | Sender name and address; custom subject and HTML for **Event Registration OTP** and **Ticket Confirmation**; preview; reset to default | Two clubs have sent real registrations on a custom design without a failed or broken email |
| V2 | The emails marked Incomplete in section 4: request received, request approved, request declined, incomplete-registration reminder, abandoned cart, waiver copy, invoice | Order decided from what the first clubs ask for |
| Before the first club goes live | Club mail moves to `ps8.in`; default mail stays on `peakst8.club` | `ps8.in` is approved for sending and test mail lands in the inbox, not spam |
| Compliance (before 13 May 2027) | Opt-in checkbox on the registration form; opt-out button in optional emails; opt-outs respected at send time; a record of each consent | A lawyer has confirmed the approach |
| Later / not planned | Sending from the club's own domain; a visual email builder; per-event designs; sending a test email to yourself | |

## 9. Risks

| Risk | Likelihood | Impact | What we'll do |
| --- | --- | --- | --- |
| A host's HTML looks broken in Gmail or Outlook | Medium | Medium | Preview in the editor; share a short guide on email-safe HTML; reset to default is one click |
| A custom email drops something essential | Low | High | Required variables are checked on save; an email with one missing cannot be saved |
| Athletes reply to the club's address and nobody receives it | High | Medium | Open question below: decide where replies go before the first club goes live |
| A club picks a sender address that looks like peakst8's own (for example `support`) | Low | Medium | Open question below: reserve peakst8's own addresses |
| One club's poor design or wording hurts delivery of peakst8's own emails (login codes, tickets) | Low | High | Club mail moves to its own domain, `ps8.in`, so it cannot damage `peakst8.club`. Still watch bounce and complaint rates per club and switch a club back to the default if needed |
| `ps8.in` is a new sending domain with no track record, so early club mail may land in spam | Medium | Medium | Set the domain up fully for sending before any club uses it, start with low volumes, and watch where mail lands |
| Athletes do not recognise `ps8.in` and distrust the email | Medium | Low | The sender name is the club's own; mention peakst8 in the email footer |
| A club puts promotion into an essential email (for example an offer inside the Ticket Confirmation), turning it into marketing the athlete cannot opt out of | Medium | High | Decide the rule with a lawyer; say it clearly in the host guide; review designs if needed |
| We reach May 2027 without a record of who agreed to what | Medium | High | Save every opt-in and opt-out from the day the checkbox ships, not after |
| A consent record is edited or lost, so we cannot answer a complaint | Low | High | Records are only ever added, never changed or deleted by the product |

## 10. Open questions and decisions

| Question | Owner | Due | Decision |
| --- | --- | --- | --- |
| Where do replies to a club's sender address go? | Jithin | Before first club | Open |
| Should peakst8's own address names (`support`, `invoice`, and similar) be blocked for clubs? Today any name is accepted. | Jithin | Before first club | Open |
| Should the preview fill in sample values, or show variables as written? | Jithin | 24 Nov 2026 | **Decided:** shown as written, the same for every email |
| Should the QR code be in the default Ticket Confirmation? It is available to custom designs but not in the default today. | Jithin | Before launch | Open |
| In what order are the seven incomplete emails built? | Jithin | After V1 | Open |
| Where does club mail go out from? | Jithin | 24 Nov 2026 | **Decided:** `ps8.in` for custom emails, `peakst8.club` for default emails |
| A club that set its own sender but kept the peakst8 design: does it send from `ps8.in` or `peakst8.club`? | Jithin | Before the domain move | Open. Proposed: `ps8.in`, since the sender is the club |
| Does a lawyer agree with our reading of the DPDP Act, and with which emails are essential? | Jithin | Before the compliance build | Open |
| How long do we keep opt-in and opt-out records, including after an account is deleted? | Jithin, with a lawyer | Before the compliance build | Open |
| Is the opt-in per club, or one for all of peakst8? | Jithin | Before the compliance build | Open |
| Who is responsible for the athlete's data under the Act: peakst8, the club, or both? | Jithin, with a lawyer | Before the compliance build | Open |
| What do we do about athletes who registered before the checkbox existed? | Jithin, with a lawyer | Before the compliance build | Open |
| May a club's custom essential email carry promotional content? | Jithin, with a lawyer | Before the compliance build | Open |

## 11. Build

| What | Where |
| --- | --- |
| Host screens | Club settings → **Emails** tab, in the peakst8 web app |
| Code | `peakst8-backend` and `peakst8-frontend` (club email system) |
| Technical notes | `peakst8-backend/AGENTS.md`, section "Outbound Email Outbox" |

## Appendix

**How a variable works.** A host writes `Hi {{ athleteName }}, you're in for {{ eventName }}` and each athlete receives `Hi Priya, you're in for Sunday Long Run`. The same variables work in the subject line. A design only uses the variables it mentions, so an optional one (the QR code, the WhatsApp button) can simply be left out.

**What stays the same for a club that changes only the sender.** The peakst8 designs and subjects are unchanged; only the name and address in the athlete's inbox change.
