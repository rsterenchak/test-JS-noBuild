// The neglect list: pieces ordered by how long since each was last practised,
// longest-neglected first. This is the app's actual answer to "what should I
// work on next" — a chronological history answers it worst, so this surface
// leads with the piece most overdue for attention.
//
// Pieces and their most-recent-practice timestamps are derived by the store from
// tagged sessions; this module never stores anything of its own. The ordering and
// the relative "last practised" label are pure functions of that derived data and
// the current time, so they are unit-testable without a DOM, exactly like the
// session screen's view model.
import { listPieces } from './store.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

// Order a derived-pieces list most-neglected first: the oldest last-practised
// timestamp leads, because that is the piece longest overdue. A piece with no
// recorded practice timestamp (a session tagged but never given an end) is the
// most neglected of all and sorts ahead of every dated piece. Ties break
// alphabetically so the order stays stable regardless of input order. Returns a
// new array; the input is not mutated.
export function neglectOrder(pieces) {
    const list = Array.isArray(pieces) ? [...pieces] : [];
    return list.sort((a, b) => {
        const at = typeof a.lastPractised === 'number' ? a.lastPractised : -Infinity;
        const bt = typeof b.lastPractised === 'number' ? b.lastPractised : -Infinity;
        if (at !== bt) return at - bt; // older (smaller) timestamp = more neglected = first
        return String(a.name).localeCompare(String(b.name));
    });
}

// A compact, human label for how long ago a piece was last practised, given the
// current time. Always the largest whole unit: "just now" under a minute, then
// minutes, hours, days, and weeks. A missing or non-numeric timestamp reads
// "not yet practised". A future timestamp (a clock skewed backwards) clamps to
// "just now" rather than showing a negative age.
export function lastPractisedLabel(lastPractised, now) {
    if (typeof lastPractised !== 'number') return 'not yet practised';
    const delta = now - lastPractised;
    if (delta < MINUTE) return 'just now';
    if (delta < HOUR) return `${Math.floor(delta / MINUTE)}m ago`;
    if (delta < DAY) return `${Math.floor(delta / HOUR)}h ago`;
    if (delta < WEEK) return `${Math.floor(delta / DAY)}d ago`;
    return `${Math.floor(delta / WEEK)}w ago`;
}

// Pure view model: given the derived pieces and the current time, produce the
// ordered rows the list renders — each with its name, its raw last-practised
// timestamp (or null), and the relative label. Depends only on its inputs, so it
// is testable without a store or a DOM.
export function neglectViewModel(pieces, now) {
    return neglectOrder(pieces).map((piece) => ({
        name: piece.name,
        lastPractised: typeof piece.lastPractised === 'number' ? piece.lastPractised : null,
        label: lastPractisedLabel(piece.lastPractised, now),
    }));
}

// Mount the neglect list into `root`, reading the current pieces from the store.
// Each piece is a button that invokes `onOpenPiece(name)` so a piece-detail view
// (a separate surface) can wire itself in without this module changing. Returns
// `{ refresh }`; call it to re-render after new sessions have been recorded, e.g.
// when this view becomes visible again.
export function initNeglect(root, { onOpenPiece } = {}) {
    if (!root) return { refresh() {} };

    function render() {
        const model = neglectViewModel(listPieces(), Date.now());
        root.textContent = '';

        if (!model.length) {
            const empty = document.createElement('p');
            empty.className = 'neglect__empty';
            empty.textContent = 'No pieces yet. Tag a session to start tracking what needs practice.';
            root.appendChild(empty);
            return;
        }

        const list = document.createElement('ul');
        list.className = 'neglect__list';
        for (const item of model) {
            const li = document.createElement('li');
            li.className = 'neglect__item';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'neglect__piece';

            const name = document.createElement('span');
            name.className = 'neglect__name';
            name.textContent = item.name;

            const when = document.createElement('span');
            when.className = 'neglect__when';
            when.textContent = item.label;

            button.appendChild(name);
            button.appendChild(when);
            button.addEventListener('click', () => {
                if (typeof onOpenPiece === 'function') onOpenPiece(item.name);
            });

            li.appendChild(button);
            list.appendChild(li);
        }
        root.appendChild(list);
    }

    render();
    return { refresh: render };
}
