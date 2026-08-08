// The persistence layer every surface reads and writes through. It owns a single
// source of truth: one namespaced localStorage key holding the full list of
// completed practice sessions. Pieces are never stored separately — they are
// derived from the sessions' tags on read, so a piece's total time and
// last-practised timestamp always stay consistent with the sessions that
// produced them. A missing or corrupt stored value degrades to empty state
// rather than throwing, so a surface never has to guard against a bad read.

const STORAGE_KEY = 'practicelog:sessions:v1';
// The in-progress session lives under its own key: a single start timestamp,
// nothing more. Keeping it separate from the completed-session list means the
// running session is recovered from storage on every read, so a locked screen,
// a backgrounded app, or a killed-and-reopened tab resumes with the correct
// elapsed time instead of losing it.
const ACTIVE_KEY = 'practicelog:active:v1';

// Resolved lazily on every call so tests (and the browser) can install or swap
// the localStorage implementation without this module capturing a stale handle.
function storage() {
    return globalThis.localStorage;
}

function newId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `s-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Coerce arbitrary input into a clean list of piece names: strings only, trimmed,
// no blanks, de-duplicated while preserving first-seen order.
function normalizePieces(pieces) {
    if (!Array.isArray(pieces)) return [];
    const seen = new Set();
    const out = [];
    for (const raw of pieces) {
        if (typeof raw !== 'string') continue;
        const name = raw.trim();
        if (!name || seen.has(name)) continue;
        seen.add(name);
        out.push(name);
    }
    return out;
}

// The single read path. Any failure — no storage, missing key, unparseable JSON,
// or a value that is not an array — collapses to empty state.
function readSessions() {
    try {
        const raw = storage()?.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeSessions(sessions) {
    storage().setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Persist a completed practice session and return the stored record. `id` is
// generated when absent; `duration` is derived from start/end when both are
// numbers unless the caller supplies one explicitly.
export function addSession(session = {}) {
    const start = typeof session.start === 'number' ? session.start : null;
    const end = typeof session.end === 'number' ? session.end : null;
    const duration = typeof session.duration === 'number'
        ? session.duration
        : (start !== null && end !== null ? end - start : 0);

    const record = {
        id: session.id ?? newId(),
        start,
        end,
        duration,
        pieces: normalizePieces(session.pieces),
    };

    const sessions = readSessions();
    sessions.push(record);
    writeSessions(sessions);
    return record;
}

// Replace the tags on an already-recorded session, identified by its id. The tag
// sheet uses this to attach pieces to the session that just completed: the
// session is recorded untagged on stop (so it counts even if tagging is skipped)
// and this fills in the pieces afterwards. Names are normalized exactly as at
// creation, so derived pieces stay consistent. An unknown id is a no-op that
// returns null; the updated record is returned otherwise.
export function setSessionPieces(id, pieces) {
    const sessions = readSessions();
    const index = sessions.findIndex((session) => session.id === id);
    if (index === -1) return null;
    const updated = { ...sessions[index], pieces: normalizePieces(pieces) };
    sessions[index] = updated;
    writeSessions(sessions);
    return updated;
}

// All stored sessions, oldest first (insertion order).
export function listSessions() {
    return readSessions();
}

// Pieces derived from every tagged session: total practice time, most recent
// practice timestamp, and how many sessions touched the piece. Sorted most
// recently practised first.
export function listPieces() {
    const byName = new Map();
    for (const session of readSessions()) {
        const duration = typeof session.duration === 'number' ? session.duration : 0;
        const end = typeof session.end === 'number' ? session.end : null;
        for (const name of normalizePieces(session.pieces)) {
            const piece = byName.get(name)
                ?? { name, totalTime: 0, lastPractised: null, sessionCount: 0 };
            piece.totalTime += duration;
            piece.sessionCount += 1;
            if (end !== null && (piece.lastPractised === null || end > piece.lastPractised)) {
                piece.lastPractised = end;
            }
            byName.set(name, piece);
        }
    }
    return [...byName.values()].sort(
        (a, b) => (b.lastPractised ?? 0) - (a.lastPractised ?? 0),
    );
}

// The derived piece for a given name, or null when no session tags it.
export function pieceByName(name) {
    if (typeof name !== 'string') return null;
    const target = name.trim();
    if (!target) return null;
    return listPieces().find((piece) => piece.name === target) ?? null;
}

// The in-progress session, or null when nothing is running. A missing key or a
// value without a numeric `start` degrades to null, matching the store's rule
// that a bad read never throws.
export function getActiveSession() {
    try {
        const raw = storage()?.getItem(ACTIVE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed.start === 'number' ? parsed : null;
    } catch {
        return null;
    }
}

// Begin a session by persisting only its start timestamp. Elapsed time is later
// derived from this stored value rather than accumulated, so time is never lost
// while the tab is backgrounded or closed. Returns the active record.
export function startActiveSession(start = Date.now()) {
    const record = { start: typeof start === 'number' ? start : Date.now() };
    storage().setItem(ACTIVE_KEY, JSON.stringify(record));
    return record;
}

// End the in-progress session: record it as a completed session through the
// normal session store, clear the active marker, and return the stored record.
// Returns null when there is no active session to stop.
export function stopActiveSession(end = Date.now(), pieces = []) {
    const active = getActiveSession();
    if (!active) return null;
    storage().removeItem(ACTIVE_KEY);
    return addSession({
        start: active.start,
        end: typeof end === 'number' ? end : Date.now(),
        pieces,
    });
}
