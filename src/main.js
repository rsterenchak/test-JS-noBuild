// Entry point. No bundler — the browser loads this module directly, which is
// what makes this repo the served-from-source shape: the files in the repo ARE
// the files the browser gets.
//
// It mounts two surfaces and a bottom tab bar to switch between them: the session
// screen (the default view, where practice is recorded) and the neglect list
// (pieces ordered by how long since each was last practised — the answer to "what
// should I work on"). The neglect list is re-read from the store each time it is
// shown, so a session just recorded on the other tab is reflected immediately.
import { initSession } from './session.js';
import { initNeglect } from './neglect.js';

const app = document.getElementById('app');
initSession(app);

// The neglect list lives in its own full-screen panel, hidden until its tab is
// selected. Appending it here keeps the session screen (#app) and the HTML shell
// untouched — the tab bar owns which surface is visible.
const neglectView = document.createElement('section');
neglectView.className = 'neglect';
neglectView.setAttribute('aria-label', 'Pieces by neglect');
neglectView.hidden = true;

const neglectTitle = document.createElement('h1');
neglectTitle.className = 'neglect__title';
neglectTitle.textContent = 'What to practise';
neglectView.appendChild(neglectTitle);

const neglectRoot = document.createElement('div');
neglectView.appendChild(neglectRoot);
document.body.appendChild(neglectView);

// Each piece routes through onOpenPiece so the piece-detail view (a separate
// surface, not yet built) can wire itself in without this file changing.
const neglect = initNeglect(neglectRoot, { onOpenPiece: undefined });

// Bottom tab bar. It never wears the accent colour — that is reserved for the
// recording state on the session screen, so its presence alone answers "am I
// recording"; a tab bar using it would break that signal.
const tabbar = document.createElement('nav');
tabbar.className = 'tabbar';
tabbar.setAttribute('aria-label', 'Views');

const views = [
    { id: 'session', label: 'Session', el: app },
    { id: 'pieces', label: 'Pieces', el: neglectView },
];

function show(id) {
    for (const view of views) {
        view.el.hidden = view.id !== id;
    }
    for (const tab of tabbar.children) {
        const active = tab.dataset.view === id;
        tab.classList.toggle('is-current', active);
        if (active) tab.setAttribute('aria-current', 'page');
        else tab.removeAttribute('aria-current');
    }
    // Re-read the store so the list reflects any session recorded since it was
    // last shown.
    if (id === 'pieces') neglect.refresh();
}

for (const view of views) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabbar__tab';
    tab.dataset.view = view.id;
    tab.textContent = view.label;
    tab.addEventListener('click', () => show(view.id));
    tabbar.appendChild(tab);
}

document.body.appendChild(tabbar);
show('session');
