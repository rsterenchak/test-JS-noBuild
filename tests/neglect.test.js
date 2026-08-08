import { test } from 'node:test';
import assert from 'node:assert/strict';
import { neglectOrder, lastPractisedLabel, neglectViewModel } from '../src/neglect.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

test('neglectOrder puts the longest-neglected piece first', () => {
    const pieces = [
        { name: 'Recent', lastPractised: 5000 },
        { name: 'Stale', lastPractised: 1000 },
        { name: 'Middle', lastPractised: 3000 },
    ];
    assert.deepEqual(
        neglectOrder(pieces).map((p) => p.name),
        ['Stale', 'Middle', 'Recent'],
    );
});

test('neglectOrder sorts a never-practised piece ahead of every dated piece', () => {
    const pieces = [
        { name: 'Dated', lastPractised: 1000 },
        { name: 'Never', lastPractised: null },
    ];
    assert.deepEqual(
        neglectOrder(pieces).map((p) => p.name),
        ['Never', 'Dated'],
    );
});

test('neglectOrder breaks ties alphabetically for a stable order', () => {
    const pieces = [
        { name: 'Bravo', lastPractised: 1000 },
        { name: 'Alpha', lastPractised: 1000 },
    ];
    assert.deepEqual(
        neglectOrder(pieces).map((p) => p.name),
        ['Alpha', 'Bravo'],
    );
});

test('neglectOrder does not mutate its input and tolerates junk', () => {
    const pieces = [
        { name: 'B', lastPractised: 2000 },
        { name: 'A', lastPractised: 1000 },
    ];
    const before = pieces.map((p) => p.name);
    neglectOrder(pieces);
    assert.deepEqual(pieces.map((p) => p.name), before, 'input order preserved');
    assert.deepEqual(neglectOrder(null), []);
    assert.deepEqual(neglectOrder(undefined), []);
});

test('lastPractisedLabel picks the largest whole unit', () => {
    const now = 1_000_000_000;
    assert.equal(lastPractisedLabel(now, now), 'just now');
    assert.equal(lastPractisedLabel(now - 30_000, now), 'just now');
    assert.equal(lastPractisedLabel(now - 5 * MINUTE, now), '5m ago');
    assert.equal(lastPractisedLabel(now - 90 * MINUTE, now), '1h ago');
    assert.equal(lastPractisedLabel(now - 25 * HOUR, now), '1d ago');
    assert.equal(lastPractisedLabel(now - 8 * DAY, now), '1w ago');
    assert.equal(lastPractisedLabel(now - 3 * WEEK, now), '3w ago');
});

test('lastPractisedLabel reads a missing timestamp as not yet practised', () => {
    assert.equal(lastPractisedLabel(null, 1000), 'not yet practised');
    assert.equal(lastPractisedLabel(undefined, 1000), 'not yet practised');
});

test('lastPractisedLabel clamps a future timestamp to just now', () => {
    assert.equal(lastPractisedLabel(5000, 1000), 'just now');
});

test('neglectViewModel orders rows and labels each one', () => {
    const now = 1_000_000_000;
    const pieces = [
        { name: 'Recent', lastPractised: now - 2 * MINUTE },
        { name: 'Never', lastPractised: null },
        { name: 'Old', lastPractised: now - 10 * DAY },
    ];
    const model = neglectViewModel(pieces, now);
    assert.deepEqual(model.map((r) => r.name), ['Never', 'Old', 'Recent']);
    assert.deepEqual(model.map((r) => r.label), ['not yet practised', '1w ago', '2m ago']);
    assert.equal(model[0].lastPractised, null, 'a missing timestamp is normalized to null');
    assert.equal(model[2].lastPractised, now - 2 * MINUTE);
});
