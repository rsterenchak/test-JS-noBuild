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

- [ ] **[MEDIUM]** Add the tag sheet that slides up after stopping a session
  - Type: feature
  - Description: After a session stops, slide up a sheet to tag the pieces worked on, chosen from recent piece names or typed fresh. The sheet is skippable: dismissing it leaves the session recorded but untagged, and an untagged session still counts toward total practice. Persist the chosen tags onto the just-completed session via `src/store.js`. Large thumb-reachable controls; the sheet must be dismissable one-handed. Depends on the data layer and session screen.
  - File: `src/tagSheet.js`, `src/session.js`, `src/style.css`
  <!-- id: 58050b9f-f82e-4356-9b18-42bf8f42385c -->
