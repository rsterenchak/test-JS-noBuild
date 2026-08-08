import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { recentPieceNames, addTag } from '../src/tagSheet.js';
import { addSession } from '../src/store.js';

// The same in-memory localStorage stand-in the store tests use, so the sheet's
// store-backed helpers can be exercised without a browser. The sheet's DOM
// surface (openTagSheet) needs a document and is verified by manual review.
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

test('recentPieceNames returns nothing before any session is tagged', () => {
    assert.deepEqual(recentPieceNames(), []);
});

test('recentPieceNames lists recently practised pieces, most recent first', () => {
    addSession({ start: 0, end: 100, pieces: ['Old'] });
    addSession({ start: 0, end: 900, pieces: ['New', 'Middle'] });

    const names = recentPieceNames();
    assert.equal(names[0], 'New', 'most recently practised leads');
    assert.ok(names.includes('Old'));
    assert.ok(names.includes('Middle'));
});

test('recentPieceNames caps the list at the requested limit', () => {
    addSession({ start: 0, end: 500, pieces: ['A', 'B', 'C', 'D'] });
    assert.equal(recentPieceNames(2).length, 2);
    assert.deepEqual(recentPieceNames(0), []);
});

test('addTag trims, ignores blanks, and de-duplicates while keeping order', () => {
    let selected = [];
    selected = addTag(selected, '  Prelude  ');
    assert.deepEqual(selected, ['Prelude']);

    selected = addTag(selected, 'Prelude'); // duplicate, ignored
    assert.deepEqual(selected, ['Prelude']);

    selected = addTag(selected, '   '); // blank, ignored
    assert.deepEqual(selected, ['Prelude']);

    selected = addTag(selected, 'Fugue');
    assert.deepEqual(selected, ['Prelude', 'Fugue'], 'first-seen order preserved');
});

test('addTag tolerates a non-array selection or a non-string name', () => {
    assert.deepEqual(addTag(undefined, 'Etude'), ['Etude']);
    assert.deepEqual(addTag(['Etude'], 42), ['Etude']);
});
