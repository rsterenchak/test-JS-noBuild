# TODO LIST

- [x] **[HIGH]** Add a localStorage data layer for sessions and pieces — Completed: 2026-08-08
  - Type: feature
  - Description: Create the persistence module every surface reads and writes through: completed practice sessions (id, start timestamp, end timestamp, duration, tagged piece names) and the pieces derived from them (name, total time, last-practised timestamp, session count). Expose CRUD helpers such as `addSession`, `listSessions`, `listPieces`, `pieceByName` that read/write a single namespaced `localStorage` key and tolerate a missing or corrupt value by returning empty state. Pieces are derived from tagged sessions rather than stored separately so a piece's last-practised and total time stay consistent. This is the foundation the session, tag, neglect, history, and piece-detail surfaces all depend on; build it first. Vanilla ES module under `src/`, no build step.
  - File: `src/store.js`, `tests/store.test.js`
  <!-- id: e110ed9b-552a-4086-9176-54be03b50f5e -->

- [x] **[HIGH]** Build the session screen with one-tap start/stop and a timestamp-derived elapsed timer — Completed: 2026-08-08
  - Type: feature
  - Description: Make the default view a single large start control that begins a session in one tap from app open, with no setup or selection first. Once active, show the running elapsed time and a stop control, the active state marked by the single accent colour so "am I recording" reads from across the room. Derive elapsed time from a start timestamp stored in `localStorage` (via `src/store.js`), NOT an interval counter, so a locked screen, backgrounded app, or killed-and-reopened tab resumes the session with the correct time instead of losing it. On stop, record the completed session through the data layer. The referenced mockup `docs/mockups/session-screen.html` does not exist yet, so follow the Look and feel section (dark, high contrast, large thumb-reachable targets, mostly empty space) for structure rather than a pixel layout. Wire the view from `src/main.js`.
  - File: `src/session.js`, `src/main.js`, `index.html`, `src/style.css`
  <!-- id: df0a007e-77c3-4c7f-bb39-c8b5ad03267a -->

- [x] **[MEDIUM]** Add the tag sheet that slides up after stopping a session — Completed: 2026-08-08
  - Type: feature
  - Description: After a session stops, slide up a sheet to tag the pieces worked on, chosen from recent piece names or typed fresh. The sheet is skippable: dismissing it leaves the session recorded but untagged, and an untagged session still counts toward total practice. Persist the chosen tags onto the just-completed session via `src/store.js`. Large thumb-reachable controls; the sheet must be dismissable one-handed. Depends on the data layer and session screen.
  - File: `src/tagSheet.js`, `src/session.js`, `src/style.css`
  <!-- id: 58050b9f-f82e-4356-9b18-42bf8f42385c -->

- [x] **[LOW]** Add a realistic analog clock favicon to the browser tab — Completed: 2026-08-08
  - Type: feature
  - Description: The site currently has no custom favicon. Add a classic analog clock icon (white face, black outline, black hour/minute hands, red second hand, tick marks at 12/3/6/9) as an inline SVG favicon referenced via a `<link rel="icon">` tag in the HTML head. Colors should be realistic/naturalistic (white, black, red) rather than the app's purple theme tokens, since this is a standalone browser-tab icon, not in-app UI. Likely touches the root HTML file and may add a new small SVG asset file.
  - File: `index.html`, `src/style.css`
  <!-- id: b0516813-c100-415d-b208-31275a7b9f9f -->

- [x] **[MEDIUM]** Build the neglect list ordering pieces by time since last practised — Completed: 2026-08-08
  - Type: feature
  - Description: List pieces ordered by how long since each was last practised, longest-neglected first — the app's actual answer to "what should I work on". Read pieces and their last-practised timestamps from `src/store.js`; show each piece's name and a relative "last practised" label. Tapping a piece opens its piece-detail view. This directly serves the goal a chronological list answers worst, so it should be reachable prominently, not buried. Depends on the data layer.
  - File: `src/neglect.js`, `src/main.js`, `src/style.css`
  <!-- id: 931fb283-fabc-43cd-b455-01e4fada8307 -->

- [x] **[LOW]** Add the history view listing sessions in reverse chronological order — Completed: 2026-08-08
  - Type: feature
  - Description: Show past sessions newest-first, each with its date, duration, and tags, read from `src/store.js`. Deliberately plain — it exists so nothing feels lost, not to be browsed, so no filtering or search. Depends on the data layer.
  - File: `src/history.js`, `src/main.js`, `src/style.css`
  <!-- id: f62072c2-ca28-4cd4-adaf-9420edd5309d -->

- [x] **[LOW]** Add the piece-detail view for a single piece's totals and sessions — Completed: 2026-08-08
  - Type: feature
  - Description: Show one piece's total practised time, last-practised date, and the list of sessions that tagged it, read from `src/store.js`. Reached from the neglect list or from a tag. Depends on the data layer, neglect list, and tag sheet.
  - File: `src/pieceDetail.js`, `src/main.js`, `src/style.css`
  <!-- id: d9b01c25-3547-4a46-9e4a-d27a33466a83 -->

- [ ] **[MEDIUM]** Make the app installable and fully offline with a web manifest and service worker
  - Type: feature
  - Description: Add a web app manifest (name, icons, dark theme colour, standalone display) and a service worker that precaches `index.html` and the `src/` ES modules and styles so every surface works with no network — practice happens in a basement with no signal. No build step: hand-write `sw.js` and `manifest.webmanifest` as static files the browser gets directly, and register the service worker from `src/main.js`. Keep the precache list in sync with the served-from-source file set. Serves the offline-first constraint and the installable mobile-web requirement.
  - File: `sw.js`, `manifest.webmanifest`, `index.html`, `src/main.js`
  <!-- id: c9e555e2-768b-4890-8fa6-052e38150a08 -->
