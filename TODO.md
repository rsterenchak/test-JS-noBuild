# TODO LIST

- [ ] **[HIGH]** Add a localStorage data layer for sessions and pieces
  - Type: feature
  - Description: Create the persistence module every surface reads and writes through: completed practice sessions (id, start timestamp, end timestamp, duration, tagged piece names) and the pieces derived from them (name, total time, last-practised timestamp, session count). Expose CRUD helpers such as `addSession`, `listSessions`, `listPieces`, `pieceByName` that read/write a single namespaced `localStorage` key and tolerate a missing or corrupt value by returning empty state. Pieces are derived from tagged sessions rather than stored separately so a piece's last-practised and total time stay consistent. This is the foundation the session, tag, neglect, history, and piece-detail surfaces all depend on; build it first. Vanilla ES module under `src/`, no build step.
  - File: `src/store.js`, `tests/store.test.js`
  <!-- id: e110ed9b-552a-4086-9176-54be03b50f5e -->
