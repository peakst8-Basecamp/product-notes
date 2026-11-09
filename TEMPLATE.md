# Product note template

Copy this file into a new folder as `README.md` (for example `my-feature/README.md`) and fill it in. A product note says **why** we are building something and **what** it has to achieve. How it is built (data model, API, jobs, code) lives in the folder's `code/` with its own `ARCHITECTURE.md`, and the note links to it.

Every note has three layers, each for a different reader:

| Layer | File | Reader | What goes in it |
| --- | --- | --- | --- |
| **README** | `README.md` | Anyone across the board | The overview: what and why, calls or context so far, problem, who it's for, why now, goals, metrics, key journeys, timeline. Short, plain, no build detail. |
| **Product note** | `index.html` | Engineers and designers | The build brief: what we're shipping, journeys with done criteria, how it works, rules, go-live checklist, how we test, design brief, risks, open questions. Links to `code/`. |
| **Product screens** | `prototype/` | Designers | A proposal that captures flows and content, marked with an asterisk: designers rebuild it in our design language. |

Rules that keep notes useful:

- Write for someone outside the team. No internal shorthand without a one-line explanation.
- Every number says where it came from. If it's a guess, label it **Assumption** and say how we'll check it.
- Keep it to what a reader needs to agree on the problem, the people, the bet and the scope. Detail goes in the appendix or the code folder.
- Write features from the user's side: what a member, club admin or partner can do or will notice, in plain words. No field names, settings values, timings or system internals; those go in `code/ARCHITECTURE.md`.
- Update `Status`, the decision log and `notes.json` whenever something changes.

---

# peakst8 <Feature name>

**A peakst8 product feature.** One or two sentences: what it lets whom do, and the outcome.

[Product note](https://peakst8-basecamp.github.io/product-notes/<folder>/) · [Prototype](<link>) · [Code](code/) · Status: Draft · Owner: <name> · updated <date>

## 1. The problem

What is broken or missing today, for whom, and what it costs them. Use what we've actually seen: support threads, club conversations, data, a competitor that already solved it.

| Who | Today | What it costs them |
| --- | --- | --- |
| | | |

## 2. Who it's for

| | Who | What they're trying to get done | What they need from this |
| --- | --- | --- | --- |
| **Primary** | | | |
| **Secondary** | | | |
| **Not for (yet)** | | | |

Add short personas if they help: a real club or member type, their week, the moment this feature matters.

## 3. Why now

What changed (in the market, in peakst8, with a partner) that makes this the right time, and what happens if we wait.

## 4. What we're building

The solution in plain words, in 3 to 6 steps a club admin or member would recognise. No implementation detail.

## 5. Goals and non-goals

**Goals**

1. 

**Non-goals** (things people may expect that we are deliberately not doing)

- 

## 6. How we'll know it worked

| Metric | Baseline | Target | When | Source |
| --- | --- | --- | --- | --- |
| | | | | |

Include one guardrail metric (something that must not get worse).

## 7. Key journeys

The few journeys that must work end to end, written as "As a <who>, I <do>, so that <outcome>", each with what "done" looks like.

## 8. Scope and phases

| Phase | What ships | Gate to move on |
| --- | --- | --- |
| Prerequisite | | |
| V1 | | |
| V2 | | |
| Later / not planned | | |

## 9. Risks

| Risk | Likelihood | Impact | What we'll do |
| --- | --- | --- | --- |
| | | | |

## 10. Open questions and decisions

| Question | Owner | Due | Decision |
| --- | --- | --- | --- |
| | | | |

## 11. Build

| What | Where |
| --- | --- |
| Prototype | |
| Code and architecture | `code/ARCHITECTURE.md` |
| Feature checklist | |
| Designs | |

## Appendix

Research, evidence and anything else a reader may want but doesn't need to agree on the above.
