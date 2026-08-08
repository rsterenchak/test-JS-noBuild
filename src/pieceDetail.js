// The piece-detail view: everything known about a single piece — its total
// practised time, when it was last practised, and the sessions that tagged it,
// newest-first. It is reached from the neglect list (tap a piece) or from a tag,
// never from a tab of its own; a back control returns to where you came from.
//
// Like the neglect list and history view, this surface stores nothing of its
// own: the piece's totals are derived from the tagged sessions exactly as the
// store derives them, so the numbers here always agree with the neglect list.
// The ordering and the date/duration/total labels are pure functions of the
// stored sessions, so they are unit-testable without a DOM. The session-level
// labels reuse history's formatters so a duration or date reads the same on
// every surface.
import { listSessions } from './store.js';
import { historyOrder, formatDuration, formatSessionDate } from './history.js';

// The sessions that tagged a given piece. Names are compared trimmed, matching
// how the store normalizes tags on write and how `pieceByName` resolves a name,
// so a piece opened from the neglect list finds exactly the sessions the store
// counted for it. A blank name or a non-array input yields no sessions. Returns
// a new array; the input is not mutated.
export function sessionsForPiece(name, sessions) {
    const target = typeof name === 'string' ? name.trim() : '';
    if (!target || !Array.isArray(sessions)) return [];
    return sessions.filter((session) =>
        Array.isArray(session.pieces) &&
        session.pieces.some((piece) => typeof piece === 'string' && piece.trim() === target));
}

// Pure view model: given a piece name and the stored sessions, produce the
// detail this surface renders — the piece's derived totals plus the ordered
// rows for the sessions that tagged it, each with its date and duration labels.
// `found` is false when no stored session tags the piece (an unknown or
// never-tagged name), so the caller renders an empty state rather than a card of
// zeros. Totals are derived the same way the store derives a piece — total time
// sums session durations, last-practised is the most recent session end — so
// this view agrees with the neglect list. Depends only on its inputs (plus the
// formatting options tests use to pin the time zone), so it needs no store or DOM.
export function pieceDetailViewModel(name, sessions, options = {}) {
    const target = typeof name === 'string' ? name.trim() : '';
    const tagged = historyOrder(sessionsForPiece(target, sessions));

    let totalTime = 0;
    let lastPractised = null;
    const rows = tagged.map((session) => {
        const start = typeof session.start === 'number' ? session.start : null;
        const end = typeof session.end === 'number' ? session.end : null;
        const duration = typeof session.duration === 'number'
            ? session.duration
            : (start !== null && end !== null ? end - start : 0);
        totalTime += duration;
        if (end !== null && (lastPractised === null || end > lastPractised)) {
            lastPractised = end;
        }
        return {
            id: session.id,
            date: formatSessionDate(end ?? start, options),
            duration: formatDuration(duration),
        };
    });

    return {
        name: target,
        found: rows.length > 0,
        sessionCount: rows.length,
        totalTime: formatDuration(totalTime),
        lastPractised: lastPractised === null
            ? 'Not yet practised'
            : formatSessionDate(lastPractised, options),
        sessions: rows,
    };
}

// A labelled stat cell — a small caption over its value — used for the piece's
// total time, last-practised date, and session count.
function statCell(label, value) {
    const cell = document.createElement('div');
    cell.className = 'piece__stat';

    const caption = document.createElement('span');
    caption.className = 'piece__stat-label';
    caption.textContent = label;

    const figure = document.createElement('span');
    figure.className = 'piece__stat-value';
    figure.textContent = value;

    cell.appendChild(caption);
    cell.appendChild(figure);
    return cell;
}

// Mount the piece-detail view into `root`. It renders whichever piece `open(name)`
// was last called with, reading that piece's sessions from the store; `refresh()`
// re-renders the same piece after new sessions may have been recorded. A back
// control invokes `onBack()` so the caller can return to the surface the detail
// was opened from. Returns `{ open, refresh }`.
export function initPieceDetail(root, { onBack } = {}) {
    if (!root) return { open() {}, refresh() {} };

    let currentName = null;

    function render() {
        root.textContent = '';

        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'piece__back';
        back.textContent = '‹ Back';
        back.addEventListener('click', () => {
            if (typeof onBack === 'function') onBack();
        });
        root.appendChild(back);

        const model = pieceDetailViewModel(currentName, listSessions());

        const title = document.createElement('h1');
        title.className = 'piece__title';
        title.textContent = model.name || 'Piece';
        root.appendChild(title);

        if (!model.found) {
            const empty = document.createElement('p');
            empty.className = 'piece__empty';
            empty.textContent = 'No sessions have tagged this piece yet.';
            root.appendChild(empty);
            return;
        }

        const stats = document.createElement('div');
        stats.className = 'piece__stats';
        stats.appendChild(statCell('Total practised', model.totalTime));
        stats.appendChild(statCell('Last practised', model.lastPractised));
        stats.appendChild(statCell('Sessions', String(model.sessionCount)));
        root.appendChild(stats);

        const list = document.createElement('ul');
        list.className = 'piece__list';
        for (const item of model.sessions) {
            const li = document.createElement('li');
            li.className = 'piece__item';

            const date = document.createElement('span');
            date.className = 'piece__date';
            date.textContent = item.date;

            const duration = document.createElement('span');
            duration.className = 'piece__duration';
            duration.textContent = item.duration;

            li.appendChild(date);
            li.appendChild(duration);
            list.appendChild(li);
        }
        root.appendChild(list);
    }

    function open(name) {
        currentName = typeof name === 'string' ? name : null;
        render();
    }

    return { open, refresh: render };
}
