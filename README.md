# peakst8 product notes

Every peakst8 product note lives here, one folder per note. Each folder has its own README with the full note. Site: [peakst8-basecamp.github.io/product-notes](https://peakst8-basecamp.github.io/product-notes/)

## Notes

| # | Note | Status | What it is | Open |
| --- | --- | --- | --- | --- |
| 1 | **[peakst8 Embedded Ticketing](embedded-ticketing/)** | ![status](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpeakst8-Basecamp%2Fproduct-notes%2Fmain%2Fnotes.json&query=%24.notes%5B%3F%28%40.id%3D%3D%22embedded-ticketing%22%29%5D.status&label=status&color=0b0b0c) | Clubs sell events on their own website, built for SEO and AEO, with peakst8 checkout inside. Pilots: Find Your Fit, Sisters in Sweat, Cubbon Classic 10K. | [Note](https://peakst8-basecamp.github.io/product-notes/embedded-ticketing/) · [Prototype](https://peakst8-basecamp.github.io/product-notes/embedded-ticketing/prototype/) · [README](embedded-ticketing/README.md) |
| 2 | **[Run Crew × peakst8 Playbook](run-crew/)** | ![status](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpeakst8-Basecamp%2Fproduct-notes%2Fmain%2Fnotes.json&query=%24.notes%5B%3F%28%40.id%3D%3D%22run-crew%22%29%5D.status&label=status&color=0b0b0c) | Reebok training plan rollout: about 250 Run Crew runners moving onto the peakst8 app. | [Playbook](run-crew/README.md) · [Install guide](https://peakst8-basecamp.github.io/product-notes/run-crew/install-guide/) |

## Updating a status

Statuses live in one file, [`notes.json`](notes.json). Anyone with write access updates it; the README badges and the site pick up the change within a few minutes.

1. Open [`notes.json`](notes.json) on GitHub and click the pencil.
2. In your note, change `status` to one of: Draft, Scoping, In design, In build, In QA, Pilot, Live, Paused, Done.
3. Update `next` (the next milestone, in plain words), `owner` and `updated` (YYYY-MM-DD). For Embedded Ticketing, set each milestone's `status` to `todo`, `doing` or `done`.
4. Commit to `main`. Keep the file valid JSON and use only the statuses above, or the badges and site can't read it.

To give an engineer write access: repo **Settings → Collaborators and teams → Add people**, role **Write**.

## Adding a note

1. Create a folder, for example `my-feature/`, with a `README.md` (the note) and, if it has one, an `index.html` for the site.
2. Add an entry to `notes.json` and a row to the table above.
3. Add the page to `sitemap.xml` and `llms.txt` if it should be found by search and AI tools.

## In this repo

| Path | What it is |
| --- | --- |
| `notes.json` | Status of every note (edit this to update a status) |
| `index.html` | Site home: every note with its live status |
| `embedded-ticketing/` | Note 1: note page, `prototype/`, `screens/`, `README.md` |
| `run-crew/` | Note 2: playbook `README.md`, `install-guide/` |
| `404.html` | Sends old `/embed/` links to `/embedded-ticketing/` |
| `robots.txt`, `sitemap.xml`, `llms.txt` | Search and AI crawler files |
