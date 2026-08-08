// The tag sheet: after a session stops it slides up from the bottom so the
// pieces worked on can be tagged, chosen from recently practised names or typed
// fresh. It is deliberately skippable — dismissing it (backdrop tap, Skip, or
// Escape) leaves the session recorded but untagged, and an untagged session
// still counts toward total practice. Saving persists the chosen tags onto the
// just-completed session through the store.
//
// The session has already been recorded (untagged) by the time the sheet opens,
// so nothing here is load-bearing for whether the session counts; the sheet only
// enriches it. That keeps the sheet fully skippable and the tab reload-safe: a
// tab closed while the sheet is open loses only the tagging, never the session.
import { listPieces, setSessionPieces } from './store.js';

// The recently-practised piece names offered as one-tap chips, most recent first.
// Reads through the store's derived pieces (already sorted most-recent-first) and
// takes the first `limit`. Pure with respect to the DOM, so it is unit-testable
// against an in-memory store.
export function recentPieceNames(limit = 8) {
    return listPieces()
        .map((piece) => piece.name)
        .slice(0, Math.max(0, limit));
}

// Add a chosen or typed name to the running selection, returning a new array.
// Trims surrounding whitespace, ignores blanks, and de-duplicates while keeping
// first-seen order — the same shape the store normalizes to on save, so what the
// sheet shows matches what is ultimately persisted.
export function addTag(selected, name) {
    const base = Array.isArray(selected) ? selected : [];
    if (typeof name !== 'string') return base.slice();
    const trimmed = name.trim();
    if (!trimmed || base.includes(trimmed)) return base.slice();
    return [...base, trimmed];
}

// Slide the tag sheet up over the app for the just-completed session `sessionId`.
// Appends its own backdrop + sheet to `document.body` and removes them on close;
// `onClose` (if given) fires after teardown so the caller can restore focus. The
// session is only ever enriched here, never created, so every exit path — Save,
// Skip, backdrop, Escape — is safe.
export function openTagSheet(sessionId, { onClose } = {}) {
    if (typeof document === 'undefined') return;

    let selected = [];

    const backdrop = document.createElement('div');
    backdrop.className = 'tag-sheet__backdrop';

    const sheet = document.createElement('div');
    sheet.className = 'tag-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Tag the pieces you practised');

    const heading = document.createElement('h2');
    heading.className = 'tag-sheet__title';
    heading.textContent = 'What did you practise?';
    sheet.appendChild(heading);

    // The growing list of selected tags. Rebuilt from `selected` on every change
    // so it is always a faithful mirror of what will be saved.
    const chosenList = document.createElement('div');
    chosenList.className = 'tag-sheet__chosen';
    sheet.appendChild(chosenList);

    function renderChosen() {
        chosenList.textContent = '';
        for (const name of selected) {
            const tag = document.createElement('button');
            tag.type = 'button';
            tag.className = 'tag-sheet__chosen-tag';
            tag.textContent = name;
            tag.setAttribute('aria-label', `Remove ${name}`);
            tag.addEventListener('click', () => {
                selected = selected.filter((n) => n !== name);
                renderChosen();
            });
            chosenList.appendChild(tag);
        }
    }

    function choose(name) {
        selected = addTag(selected, name);
        renderChosen();
    }

    // One-tap chips for recently practised pieces.
    const recent = recentPieceNames();
    if (recent.length) {
        const chips = document.createElement('div');
        chips.className = 'tag-sheet__recent';
        for (const name of recent) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'tag-sheet__chip';
            chip.textContent = name;
            chip.addEventListener('click', () => choose(name));
            chips.appendChild(chip);
        }
        sheet.appendChild(chips);
    }

    // Type a fresh name; Enter or the Add button commits it.
    const inputRow = document.createElement('form');
    inputRow.className = 'tag-sheet__input-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tag-sheet__input';
    input.placeholder = 'Add a piece…';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Add a piece');
    const addButton = document.createElement('button');
    addButton.type = 'submit';
    addButton.className = 'tag-sheet__add';
    addButton.textContent = 'Add';
    inputRow.appendChild(input);
    inputRow.appendChild(addButton);
    inputRow.addEventListener('submit', (event) => {
        event.preventDefault();
        choose(input.value);
        input.value = '';
        input.focus();
    });
    sheet.appendChild(inputRow);

    // Save persists whatever is selected; Skip leaves the session untagged. Both
    // simply close, because the session is already recorded either way.
    const actions = document.createElement('div');
    actions.className = 'tag-sheet__actions';

    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'tag-sheet__action tag-sheet__action--skip';
    skip.textContent = 'Skip';
    skip.addEventListener('click', () => close());

    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'tag-sheet__action tag-sheet__action--save';
    save.textContent = 'Save';
    save.addEventListener('click', () => {
        setSessionPieces(sessionId, selected);
        close();
    });

    actions.appendChild(skip);
    actions.appendChild(save);
    sheet.appendChild(actions);

    let closed = false;
    function close() {
        if (closed) return;
        closed = true;
        document.removeEventListener('keydown', onKeydown);
        backdrop.remove();
        sheet.remove();
        if (typeof onClose === 'function') onClose();
    }

    function onKeydown(event) {
        if (event.key === 'Escape') close();
    }

    // A backdrop tap dismisses one-handed; a tap on the sheet itself must not.
    backdrop.addEventListener('click', () => close());
    sheet.addEventListener('click', (event) => event.stopPropagation());

    document.addEventListener('keydown', onKeydown);
    document.body.appendChild(backdrop);
    backdrop.appendChild(sheet);

    // Trigger the slide-up transition on the next frame, after the sheet is in the
    // DOM at its off-screen start position.
    requestAnimationFrame(() => {
        backdrop.classList.add('is-open');
        sheet.classList.add('is-open');
    });

    return { close };
}
