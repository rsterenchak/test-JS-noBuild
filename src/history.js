// The history view: past sessions listed newest-first, each with its date,
// duration, and tags. It exists so nothing feels lost — a plain record, not a
// surface to browse — so there is deliberately no filtering, search, or
// navigation off a row.
//
// Sessions are read from the store; this module stores nothing of its own. The
// ordering and the date/duration labels are pure functions of the stored
// sessions, so they are unit-testable without a DOM, exactly like the session
// screen and the neglect list.
import { listSessions } from './store.js';

// The timestamp a session is dated by: its end (when it was recorded) if
// present, otherwise its start. A session with neither degrades to null.
function sessionTime(session) {
    if (typeof session.end === 'number') return session.end;
    if (typeof session.start === 'number') return session.start;
    return null;
}

// Order sessions newest-first by their dated timestamp. An undated session (no
// numeric start or end) sorts last, since it cannot be placed on the timeline.
// Ties keep insertion order (a stable sort), so same-instant sessions stay put.
// Returns a new array; the input is not mutated.
export function historyOrder(sessions) {
    const list = Array.isArray(sessions) ? [...sessions] : [];
    return list.sort((a, b) => {
        const at = sessionTime(a);
        const bt = sessionTime(b);
        return (bt ?? -Infinity) - (at ?? -Infinity); // larger (newer) timestamp first
    });
}

// A compact label for how long a session lasted, given its duration in ms.
// Always the largest meaningful unit pair: "1h 5m" past an hour, "12m" past a
// minute, "45s" under one. Negative or non-numeric input clamps to "0s".
export function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor((typeof ms === 'number' ? ms : 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
}

// An absolute date-and-time label for a session timestamp. Defaults to the
// viewer's local time zone (what a real user should see); tests pass
// `{ timeZone: 'UTC' }` to pin the output for a deterministic assertion. A
// missing or non-finite timestamp reads "Undated".
export function formatSessionDate(ts, options = {}) {
    if (typeof ts !== 'number' || !Number.isFinite(ts)) return 'Undated';
    const fmt = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options,
    });
    return fmt.format(new Date(ts));
}

// Coerce a session's stored tags into a clean list of piece-name strings. The
// store normalizes on write, but reading tolerates junk so a hand-edited or
// corrupt value never breaks the render.
function sessionTags(pieces) {
    if (!Array.isArray(pieces)) return [];
    return pieces.filter((name) => typeof name === 'string' && name.trim() !== '');
}

// Pure view model: given the stored sessions, produce the ordered rows the list
// renders — each with its date and duration labels and its tags. Depends only on
// its inputs (plus the formatting options), so it is testable without a store or
// a DOM.
export function historyViewModel(sessions, options = {}) {
    return historyOrder(sessions).map((session) => {
        const start = typeof session.start === 'number' ? session.start : null;
        const end = typeof session.end === 'number' ? session.end : null;
        const duration = typeof session.duration === 'number'
            ? session.duration
            : (start !== null && end !== null ? end - start : 0);
        return {
            id: session.id,
            start,
            end,
            date: formatSessionDate(sessionTime(session), options),
            duration: formatDuration(duration),
            tags: sessionTags(session.pieces),
        };
    });
}

// Mount the history list into `root`, reading the current sessions from the
// store. Rows are plain, non-interactive records. Returns `{ refresh }`; call it
// to re-render after new sessions have been recorded, e.g. when this view
// becomes visible again.
export function initHistory(root) {
    if (!root) return { refresh() {} };

    function render() {
        const model = historyViewModel(listSessions());
        root.textContent = '';

        if (!model.length) {
            const empty = document.createElement('p');
            empty.className = 'history__empty';
            empty.textContent = 'No sessions yet. Your practice history will appear here.';
            root.appendChild(empty);
            return;
        }

        const list = document.createElement('ul');
        list.className = 'history__list';
        for (const item of model) {
            const li = document.createElement('li');
            li.className = 'history__item';

            const head = document.createElement('div');
            head.className = 'history__head';

            const date = document.createElement('span');
            date.className = 'history__date';
            date.textContent = item.date;

            const duration = document.createElement('span');
            duration.className = 'history__duration';
            duration.textContent = item.duration;

            head.appendChild(date);
            head.appendChild(duration);
            li.appendChild(head);

            if (item.tags.length) {
                const tags = document.createElement('ul');
                tags.className = 'history__tags';
                for (const tag of item.tags) {
                    const tagLi = document.createElement('li');
                    tagLi.className = 'history__tag';
                    tagLi.textContent = tag;
                    tags.appendChild(tagLi);
                }
                li.appendChild(tags);
            } else {
                const untagged = document.createElement('span');
                untagged.className = 'history__untagged';
                untagged.textContent = 'Untagged';
                li.appendChild(untagged);
            }

            list.appendChild(li);
        }
        root.appendChild(list);
    }

    render();
    return { refresh: render };
}
