# peakst8 product notes

Every peakst8 product note lives here, one folder per note. Each folder has its own README with the full note. Site: [peakst8-basecamp.github.io/product-notes](https://peakst8-basecamp.github.io/product-notes/)

## Notes

Every note has three layers: the **README** for anyone, the **product note** for engineers and designers, and the **product screens*** for designers to rebuild in our design language.

### Product features

| Note | Status | What it is | Open |
| --- | --- | --- | --- |
| **[peakst8 Embedded Ticketing](embedded-ticketing/)** | ![status](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpeakst8-Basecamp%2Fproduct-notes%2Fmain%2Fnotes.json&query=%24.notes%5B0%5D.status&label=status&color=0b0b0c) | Clubs and races sell entries on their own website with peakst8 checkout. Now includes early-bird tiers, bulk group codes and import from KonfHub. Design partners: Cubbon Classic 10K (first), Find Your Fit, Sisters in Sweat. | [Product note](https://peakst8-basecamp.github.io/product-notes/embedded-ticketing/) · [Product screens*](https://peakst8-basecamp.github.io/product-notes/embedded-ticketing/prototype/) · [Code](https://github.com/peakst8-Basecamp/product-notes/tree/main/embedded-ticketing/code) · [README](embedded-ticketing/README.md) |
| **[peakst8 Club Memberships](memberships/)** | ![status](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpeakst8-Basecamp%2Fproduct-notes%2Fmain%2Fnotes.json&query=%24.notes%5B2%5D.status&label=status&color=0b0b0c) | Clubs sell recurring memberships and prepaid packs. Members book each session as usual and peakst8 applies the plan at checkout. Reverse-engineered from SweatPals Plans, mapped onto the peakst8 backend with a Prisma schema draft. | [Product note](https://peakst8-basecamp.github.io/product-notes/memberships/) · [Product screens*](https://peakst8-basecamp.github.io/product-notes/memberships/prototype/) · [Feature list](https://peakst8-basecamp.github.io/product-notes/memberships/coverage/) · [Code](https://peakst8-basecamp.github.io/product-notes/memberships/code/) · [Schema](https://github.com/peakst8-Basecamp/product-notes/blob/main/memberships/code/backend/prisma/memberships.prisma) · [README](memberships/README.md) |

### Design partner conversations

| Note | Status | What it is | Open |
| --- | --- | --- | --- |
| **[Design partner conversations: Run Crew × Reebok](run-crew/)** | ![status](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpeakst8-Basecamp%2Fproduct-notes%2Fmain%2Fnotes.json&query=%24.notes%5B1%5D.status&label=status&color=0b0b0c) | Moving about 250 Run Crew runners on the Reebok training plan onto the peakst8 app: the roster, app setup, install guide, messages and the Reebok review. | [Product note](https://peakst8-basecamp.github.io/product-notes/run-crew/) · [Install guide](https://peakst8-basecamp.github.io/product-notes/run-crew/install-guide/) · [App screens](https://peakst8-basecamp.github.io/product-notes/run-crew/app-screens/) · [Rollout checklist](https://claude.ai/artifact/MNZVVd8tXVs9Xgjrm6MLSz) · [README](run-crew/README.md) |
| **[Design partner conversations: Cubbon Classic 10K](athlete-os-cubbon-classic/)** | ![status](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpeakst8-Basecamp%2Fproduct-notes%2Fmain%2Fnotes.json&query=%24.notes%5B3%5D.status&label=status&color=0b0b0c) | Cubbon Classic 10K (21 Mar 2027) moves registration from KonfHub to peakst8 and runs an 8-week programme on Athlete OS. With Nithin Gowda (MyRace). ~220 registered, 3,500 expected. | [Product note](https://peakst8-basecamp.github.io/product-notes/athlete-os-cubbon-classic/) · [Product screens*](https://peakst8-basecamp.github.io/product-notes/athlete-os-cubbon-classic/prototype/) · [Code (Embedded Ticketing)](https://github.com/peakst8-Basecamp/product-notes/tree/main/embedded-ticketing/code) · [README](athlete-os-cubbon-classic/README.md) |

\* Product screens are a proposal, not final designs.

## Updating a status

Statuses live in one file, [`notes.json`](notes.json). Anyone with write access updates it; the README badges and the site pick up the change within a few minutes.

1. Open [`notes.json`](notes.json) on GitHub and click the pencil.
2. In your note, change `status` to one of: Draft, Scoping, In design, In build, In QA, Pilot, Live, Paused, Done.
3. Update `next` (the next milestone, in plain words), `owner` and `updated` (YYYY-MM-DD). For Embedded Ticketing, set each milestone's `status` to `todo`, `doing` or `done`.
4. Commit to `main`. Keep the file valid JSON, use only the statuses above, and keep the notes in the same order as the table, or the badges show the wrong note.

To give an engineer write access: repo **Settings → Collaborators and teams → Add people**, role **Write**.

## Adding a note

Every note has three layers: `README.md` for anyone across the board, `index.html` (the product note) for engineers and designers, and `prototype/` (product screens, marked with *) for designers to rebuild in our design language. See [`TEMPLATE.md`](TEMPLATE.md).

1. Copy [`TEMPLATE.md`](TEMPLATE.md) into a new folder as `README.md`, for example `my-feature/README.md`, and fill it in. The note covers why and what; write features from the user's side, and put code and technical design in the folder's `code/` with an `ARCHITECTURE.md`. Add an `index.html` if the note has a page on the site.
2. Add an entry to `notes.json` and a row to the table above.
3. Add the page to `sitemap.xml` and `llms.txt` if it should be found by search and AI tools.

## In this repo

| Path | What it is |
| --- | --- |
| `TEMPLATE.md` | Product note template: problem, who it's for, why now, goals, metrics, journeys, scope, risks, decisions, build |
| `notes.json` | Status of every note (edit this to update a status) |
| `index.html` | Site home: every note with its live status |
| `embedded-ticketing/` | Product feature: note page, `prototype/`, `screens/`, `code/` (race-site registration), `README.md` |
| `run-crew/` | Note 2: note page `index.html` (renders the playbook `README.md`), `install-guide/`, `app-screens/` |
| `athlete-os-cubbon-classic/` | Design partner conversations, Cubbon Classic 10K: note page, `prototype/` (product screens), `README.md` |
| `404.html` | Sends old `/embed/` links to `/embedded-ticketing/` |
| `robots.txt`, `sitemap.xml`, `llms.txt` | Search and AI crawler files |
