import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
    addSession,
    listSessions,
    listPieces,
    pieceByName,
    getActiveSession,
    startActiveSession,
    stopActiveSession,
} from '../src/store.js';

const STORAGE_KEY = 'practicelog:sessions:v1';
const ACTIVE_KEY = 'practicelog:active:v1';

// A minimal in-memory stand-in for the browser localStorage the store reads
// through. Installed fresh before each test so cases never leak into each other.
class MemoryStorage {
    #map = new Map();
    getItem(key) { return this.#map.has(key) ? this.#map.get(key) : null; }
    setItem(key, value) { this.#map.set(key, String(value)); }
    removeItem(key) { this.#map.delete(key); }
    clear() { this.#map.clear(); }
}

beforeEach(() => {
    globalThis.localStorage = new MemoryStorage();
});

test('empty state when nothing has been stored', () => {
    assert.deepEqual(listSessions(), []);
    assert.deepEqual(listPieces(), []);
    assert.equal(pieceByName('anything'), null);
});

test('addSession persists a session and derives id and duration', () => {
    const stored = addSession({ start: 1000, end: 4000, pieces: ['Prelude'] });

    assert.equal(stored.duration, 3000);
    assert.ok(stored.id, 'an id is assigned');

    const sessions = listSessions();
    assert.equal(sessions.length, 1);
    assert.deepEqual(sessions[0], stored);
});

test('addSession normalizes tagged piece names', () => {
    const stored = addSession({
        start: 0,
        end: 1,
        pieces: ['  Etude  ', 'Etude', '', 42, 'Nocturne'],
    });
    assert.deepEqual(stored.pieces, ['Etude', 'Nocturne']);
});

test('pieces are derived and aggregated across tagged sessions', () => {
    addSession({ start: 0, end: 1000, pieces: ['Fugue'] });
    addSession({ start: 5000, end: 7000, pieces: ['Fugue', 'Gigue'] });

    const fugue = pieceByName('Fugue');
    assert.equal(fugue.totalTime, 3000);
    assert.equal(fugue.sessionCount, 2);
    assert.equal(fugue.lastPractised, 7000, 'tracks the most recent end timestamp');

    const gigue = pieceByName('Gigue');
    assert.equal(gigue.totalTime, 2000);
    assert.equal(gigue.sessionCount, 1);
    assert.equal(gigue.lastPractised, 5000 + 2000);
});

test('listPieces returns most recently practised first', () => {
    addSession({ start: 0, end: 100, pieces: ['Old'] });
    addSession({ start: 0, end: 900, pieces: ['New'] });

    assert.deepEqual(listPieces().map((p) => p.name), ['New', 'Old']);
});

test('pieceByName returns null for an untagged name', () => {
    addSession({ start: 0, end: 1, pieces: ['Sonata'] });
    assert.equal(pieceByName('Concerto'), null);
    assert.equal(pieceByName('   '), null);
    assert.equal(pieceByName(undefined), null);
});

test('a corrupt stored value degrades to empty state', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, 'not json at all');
    assert.deepEqual(listSessions(), []);
    assert.deepEqual(listPieces(), []);

    // A non-array JSON value is equally rejected.
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }));
    assert.deepEqual(listSessions(), []);
});

test('addSession after a corrupt value recovers into a clean list', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, '{{{');
    const stored = addSession({ start: 0, end: 10, pieces: ['Rondo'] });
    assert.deepEqual(listSessions(), [stored]);
});

test('no active session by default', () => {
    assert.equal(getActiveSession(), null);
});

test('startActiveSession persists the start timestamp', () => {
    const active = startActiveSession(1000);
    assert.deepEqual(active, { start: 1000 });
    assert.deepEqual(getActiveSession(), { start: 1000 });
});

test('an active session survives a reload and stays derivable from its timestamp', () => {
    startActiveSession(1000);
    // A reopened tab reads the same persisted start; elapsed time is recomputed
    // from it, never lost, no matter how long the tab was gone.
    assert.deepEqual(getActiveSession(), { start: 1000 });
});

test('stopActiveSession records a completed session and clears the active marker', () => {
    startActiveSession(1000);
    const stored = stopActiveSession(4000, ['Prelude']);

    assert.equal(stored.start, 1000);
    assert.equal(stored.end, 4000);
    assert.equal(stored.duration, 3000);
    assert.deepEqual(stored.pieces, ['Prelude']);

    assert.equal(getActiveSession(), null, 'active marker is cleared');
    assert.deepEqual(listSessions(), [stored], 'session is now in the completed list');
});

test('stopActiveSession is a no-op when nothing is running', () => {
    assert.equal(stopActiveSession(4000, ['Prelude']), null);
    assert.deepEqual(listSessions(), []);
});

test('a corrupt active value degrades to no active session', () => {
    globalThis.localStorage.setItem(ACTIVE_KEY, 'not json');
    assert.equal(getActiveSession(), null);

    globalThis.localStorage.setItem(ACTIVE_KEY, JSON.stringify({ no: 'start' }));
    assert.equal(getActiveSession(), null);
});
