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

- [x] **[MEDIUM]** Make the app installable and fully offline with a web manifest and service worker — Completed: 2026-08-08
  - Type: feature
  - Description: Add a web app manifest (name, icons, dark theme colour, standalone display) and a service worker that precaches `index.html` and the `src/` ES modules and styles so every surface works with no network — practice happens in a basement with no signal. No build step: hand-write `sw.js` and `manifest.webmanifest` as static files the browser gets directly, and register the service worker from `src/main.js`. Keep the precache list in sync with the served-from-source file set. Serves the offline-first constraint and the installable mobile-web requirement.
  - File: `sw.js`, `manifest.webmanifest`, `index.html`, `src/main.js`
  <!-- id: c9e555e2-768b-4890-8fa6-052e38150a08 -->

- [x] **[MEDIUM]** Fix favicon not appearing in iOS Safari tabs — Completed: 2026-08-08
  - Type: bug
  - Description: The clock favicon added via `<link rel="icon">` (SVG) renders correctly on desktop browsers but does not display in iOS Safari's tab bar or tab switcher, because iOS Safari has unreliable SVG favicon support and expects a PNG/ICO fallback plus an `apple-touch-icon` link tag. Add a PNG version of the clock icon (e.g. 180x180 for apple-touch-icon, 32x32/16x16 for standard favicon) and reference it with both `<link rel="icon" type="image/png" ...>` and `<link rel="apple-touch-icon" href="...">` tags alongside the existing SVG link so all platforms resolve a working icon. Likely touches the root HTML file and adds new PNG asset files alongside the existing SVG.
  - File: `index.html`
  <!-- id: e1391474-679f-4af2-bc90-0c390c645c6c -->

- [x] **[HIGH]** Fix favicon PNG assets rendering as solid black instead of the clock icon — Completed: 2026-08-08
  - Type: bug
  - Description: `favicon-32.png`, `favicon-16.png`, and `apple-touch-icon.png` (added in PR #9) pass structural validation (valid PNG signature, correct IHDR dimensions) but render as solid black squares when opened directly — they contain no visible clock artwork, which is why iOS Safari falls back to its generic globe icon on the Practice Log tab instead of showing a favicon. Regenerate all three PNGs by actually rasterizing the existing `favicon.svg` clock design (white face, black outline, black hands, red second hand, tick marks) at 180x180, 32x32, and 16x16, rather than emitting blank/placeholder image data. Also strengthen `tests/favicon.test.js` to catch this class of failure going forward — e.g. assert the decoded pixel data isn't a single uniform color (checking for at least a handful of distinct RGB values, or that white and black pixels both appear) so a blank asset can't silently pass again.
  - File: `favicon-32.png`, `favicon-16.png`, `apple-touch-icon.png`, `favicon.svg`, `tests/favicon.test.js`
  <!-- id: ec052a08-923e-464e-9017-9883b45bfe16 -->

- [x] **[LOW]** Add a temporary session-note text input as a keyboard probe for the standalone viewport-shrink bug — Completed: 2026-08-09
  - Type: feature
  - Description: Diagnostic probe, intended to be removable. This app currently has no text inputs anywhere, so the iOS standalone keyboard bug (first keyboard open permanently shrinks the layout viewport ~59px for the session, observed in a sibling PWA) can never trigger here — which also means this app is the cleanest testbed for whether its configuration (no `viewport-fit=cover`, min-height document layout) avoids the bug. Add a single-line text input to the Session view in `src/session.js`, labeled "Session note", visually unobtrusive and styled consistently with the existing view (plain field, no persistence required — it does not need to save anywhere, though wiring it into the session record via `src/store.js` is acceptable if trivial). It must be an ordinary focusable `<input type="text">` so the software keyboard opens on tap. Set `font-size` at 16px or larger so iOS does not zoom on focus. No other behavior changes. Acceptance criteria: (a) the Session view shows the input and tapping it opens the software keyboard in the installed app; (b) dismissing the keyboard returns the view without errors; (c) all existing session start/stop behavior is unchanged; (d) the input is added in one clearly-commented block so it can be removed in a single later entry.
  - File: `src/session.js`, `src/style.css`
  - Completed:
  <!-- id: 9d783a1f-81da-40d1-b3b1-209b88f4571d -->
