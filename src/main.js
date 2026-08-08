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
import { initHistory } from './history.js';
import { initPieceDetail } from './pieceDetail.js';

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

// Each piece routes through onOpenPiece into the piece-detail surface below.
const neglect = initNeglect(neglectRoot, { onOpenPiece: openPiece });

// The history list lives in its own full-screen panel too, hidden until its tab
// is selected. It is a plain record of past sessions — deliberately not a place
// to navigate off of — and is re-read from the store each time it is shown so a
// session just recorded elsewhere appears immediately.
const historyView = document.createElement('section');
historyView.className = 'history';
historyView.setAttribute('aria-label', 'Practice history');
historyView.hidden = true;

const historyTitle = document.createElement('h1');
historyTitle.className = 'history__title';
historyTitle.textContent = 'History';
historyView.appendChild(historyTitle);

const historyRoot = document.createElement('div');
historyView.appendChild(historyRoot);
document.body.appendChild(historyView);

const history = initHistory(historyRoot);

// The piece-detail view: a full-screen panel showing one piece's totals and the
// sessions that tagged it. It is not a tab — it is reached by tapping a piece in
// the neglect list — so it lives outside the `views` array and is shown by
// openPiece / hidden by show(). Its back control returns to the neglect list.
const pieceView = document.createElement('section');
pieceView.className = 'piece';
pieceView.setAttribute('aria-label', 'Piece detail');
pieceView.hidden = true;

const pieceRoot = document.createElement('div');
pieceView.appendChild(pieceRoot);
document.body.appendChild(pieceView);

const pieceDetail = initPieceDetail(pieceRoot, { onBack: () => show('pieces') });

// Open the piece-detail surface for a name: hide every tab view, reveal the
// detail panel, and render that piece. The tab bar keeps its current highlight
// (the pieces tab, since that is where a piece is tapped from), so returning via
// Back lands back on the neglect list.
function openPiece(name) {
    for (const view of views) view.el.hidden = true;
    pieceView.hidden = false;
    pieceDetail.open(name);
}

// Bottom tab bar. It never wears the accent colour — that is reserved for the
// recording state on the session screen, so its presence alone answers "am I
// recording"; a tab bar using it would break that signal.
const tabbar = document.createElement('nav');
tabbar.className = 'tabbar';
tabbar.setAttribute('aria-label', 'Views');

const views = [
    { id: 'session', label: 'Session', el: app },
    { id: 'pieces', label: 'Pieces', el: neglectView },
    { id: 'history', label: 'History', el: historyView },
];

function show(id) {
    // Leaving any tab always closes the piece-detail surface, which sits over the
    // tab views rather than in the `views` array.
    pieceView.hidden = true;
    for (const view of views) {
        view.el.hidden = view.id !== id;
    }
    for (const tab of tabbar.children) {
        const active = tab.dataset.view === id;
        tab.classList.toggle('is-current', active);
        if (active) tab.setAttribute('aria-current', 'page');
        else tab.removeAttribute('aria-current');
    }
    // Re-read the store so each list reflects any session recorded since it was
    // last shown.
    if (id === 'pieces') neglect.refresh();
    if (id === 'history') history.refresh();
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
