// The session screen: the app's default view. One large control that starts a
// session in a single tap from app open, and once running shows the elapsed
// time and a stop control. The running state is the only place the accent
// colour appears, so "am I recording" reads from across the room.
//
// The elapsed time is always recomputed from the start timestamp held in the
// store, never accumulated by the ticker below. The ticker only prompts a
// repaint; a tab that is backgrounded, locked, or killed and reopened resumes
// with the correct time because the number is derived from storage each render.
import { startActiveSession, stopActiveSession, getActiveSession } from './store.js';
import { openTagSheet } from './tagSheet.js';

// Format elapsed milliseconds as M:SS, widening to H:MM:SS past an hour.
// Negative input (a clock skewing backwards) clamps to zero rather than showing
// a nonsensical negative timer.
export function formatElapsed(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(hours > 0 ? 2 : 1, '0');
    const ss = String(seconds).padStart(2, '0');
    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Pure view model: given the active session (or null) and the current time,
// describe what the screen should show. Elapsed time is `now - start`, so the
// result depends only on the stored timestamp and the clock — never on how many
// ticks have fired. This is the timestamp-derived resume behaviour, testable
// without a DOM.
export function sessionViewModel(active, now) {
    if (active && typeof active.start === 'number') {
        const elapsedMs = Math.max(0, now - active.start);
        return { active: true, elapsedMs, elapsedText: formatElapsed(elapsedMs) };
    }
    return { active: false, elapsedMs: 0, elapsedText: formatElapsed(0) };
}

// Mount the session screen into `root`, wiring start/stop and resuming any
// session that survived a reload.
export function initSession(root) {
    if (!root) return;
    let ticker = null;

    function stopTicker() {
        if (ticker !== null) {
            clearInterval(ticker);
            ticker = null;
        }
    }

    // Refresh only the displayed number. Elapsed time is re-derived from storage
    // here, so skipped ticks (a backgrounded tab) cost nothing but a stale paint
    // that corrects itself on the next tick.
    function tick() {
        const time = root.querySelector('.session__elapsed');
        if (!time) {
            stopTicker();
            return;
        }
        time.textContent = sessionViewModel(getActiveSession(), Date.now()).elapsedText;
    }

    function startTicker() {
        stopTicker();
        ticker = setInterval(tick, 1000);
    }

    function handleStart() {
        startActiveSession();
        render();
        startTicker();
    }

    function handleStop() {
        // Record the completed session first — untagged, so it counts even if the
        // tag sheet is skipped — then slide the sheet up to attach pieces to it.
        const completed = stopActiveSession();
        stopTicker();
        render();
        if (completed) openTagSheet(completed.id);
    }

    // --- TEMPORARY: session-note keyboard probe (entry 9d783a1f) ---------------
    // A diagnostic single-line input added purely to open the software keyboard
    // on this app, so we can test whether the iOS standalone keyboard
    // viewport-shrink bug (first focus permanently shrinks the layout viewport,
    // seen in a sibling PWA) reproduces here. It holds no state and persists
    // nothing. font-size is kept >= 16px in `.session__note-input` so iOS does
    // not zoom on focus. Remove this whole block AND its `appendSessionNote(root)`
    // call in render() together in one later entry.
    function appendSessionNote(parent) {
        const label = document.createElement('label');
        label.className = 'session__note';

        const caption = document.createElement('span');
        caption.className = 'session__note-caption';
        caption.textContent = 'Session note';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'session__note-input';
        input.setAttribute('aria-label', 'Session note');
        input.autocomplete = 'off';

        label.append(caption, input);
        parent.appendChild(label);
    }
    // --- END TEMPORARY session-note keyboard probe -----------------------------

    function render() {
        const model = sessionViewModel(getActiveSession(), Date.now());
        root.textContent = '';
        root.classList.toggle('is-active', model.active);

        if (model.active) {
            const time = document.createElement('div');
            time.className = 'session__elapsed';
            // A timer that ticks every second must not be announced each tick.
            time.setAttribute('role', 'timer');
            time.setAttribute('aria-live', 'off');
            time.textContent = model.elapsedText;
            root.appendChild(time);

            const stop = document.createElement('button');
            stop.type = 'button';
            stop.className = 'session__control session__control--stop';
            stop.textContent = 'Stop';
            stop.addEventListener('click', handleStop);
            root.appendChild(stop);
        } else {
            const start = document.createElement('button');
            start.type = 'button';
            start.className = 'session__control session__control--start';
            start.textContent = 'Start';
            start.addEventListener('click', handleStart);
            root.appendChild(start);
        }

        // TEMPORARY: session-note keyboard probe — remove with the block above.
        appendSessionNote(root);
    }

    render();
    // Resume an in-progress session left running by a previous visit.
    if (getActiveSession()) startTicker();
}
