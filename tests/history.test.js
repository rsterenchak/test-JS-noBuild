import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    historyOrder,
    formatDuration,
    formatSessionDate,
    historyViewModel,
} from '../src/history.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

test('historyOrder puts the most recent session first', () => {
    const sessions = [
        { id: 'a', end: 1000 },
        { id: 'c', end: 3000 },
        { id: 'b', end: 2000 },
    ];
    assert.deepEqual(
        historyOrder(sessions).map((s) => s.id),
        ['c', 'b', 'a'],
    );
});

test('historyOrder dates a session by its end, falling back to start', () => {
    const sessions = [
        { id: 'ended', end: 2000, start: 1000 },
        { id: 'startonly', start: 5000 }, // no end — dated by start, so newest
    ];
    assert.deepEqual(
        historyOrder(sessions).map((s) => s.id),
        ['startonly', 'ended'],
    );
});

test('historyOrder sorts an undated session last', () => {
    const sessions = [
        { id: 'undated' },
        { id: 'dated', end: 1000 },
    ];
    assert.deepEqual(
        historyOrder(sessions).map((s) => s.id),
        ['dated', 'undated'],
    );
});

test('historyOrder does not mutate its input and tolerates junk', () => {
    const sessions = [
        { id: 'a', end: 1000 },
        { id: 'b', end: 2000 },
    ];
    const before = sessions.map((s) => s.id);
    historyOrder(sessions);
    assert.deepEqual(sessions.map((s) => s.id), before, 'input order preserved');
    assert.deepEqual(historyOrder(null), []);
    assert.deepEqual(historyOrder(undefined), []);
});

test('formatDuration picks the largest meaningful unit', () => {
    assert.equal(formatDuration(0), '0s');
    assert.equal(formatDuration(45 * 1000), '45s');
    assert.equal(formatDuration(12 * MINUTE), '12m');
    assert.equal(formatDuration(90 * MINUTE), '1h 30m');
    assert.equal(formatDuration(2 * HOUR), '2h 0m');
});

test('formatDuration clamps negative or non-numeric input to zero', () => {
    assert.equal(formatDuration(-5000), '0s');
    assert.equal(formatDuration(null), '0s');
    assert.equal(formatDuration(undefined), '0s');
});

test('formatSessionDate renders an absolute date and time', () => {
    const ts = Date.UTC(2026, 7, 8, 14, 30); // 8 Aug 2026, 14:30 UTC
    const label = formatSessionDate(ts, { timeZone: 'UTC' });
    assert.match(label, /2026/);
    assert.match(label, /Aug/);
    assert.match(label, /8/);
    assert.match(label, /14:30/);
});

test('formatSessionDate reads a missing timestamp as Undated', () => {
    assert.equal(formatSessionDate(null), 'Undated');
    assert.equal(formatSessionDate(undefined), 'Undated');
    assert.equal(formatSessionDate(NaN), 'Undated');
});

test('historyViewModel orders rows and labels date, duration, and tags', () => {
    const sessions = [
        { id: 'old', start: 1000, end: 1000 + 5 * MINUTE, pieces: ['Etude'] },
        { id: 'new', start: Date.UTC(2026, 0, 2), end: Date.UTC(2026, 0, 2) + HOUR, pieces: ['Sonata', 'Scales'] },
    ];
    const model = historyViewModel(sessions, { timeZone: 'UTC' });
    assert.deepEqual(model.map((r) => r.id), ['new', 'old']);
    assert.equal(model[0].duration, '1h 0m');
    assert.deepEqual(model[0].tags, ['Sonata', 'Scales']);
    assert.equal(model[1].duration, '5m');
    assert.deepEqual(model[1].tags, ['Etude']);
});

test('historyViewModel derives duration from start/end when none is stored', () => {
    const model = historyViewModel([{ id: 'x', start: 1000, end: 1000 + 3 * MINUTE }]);
    assert.equal(model[0].duration, '3m');
});

test('historyViewModel yields an empty tag list for an untagged session', () => {
    const model = historyViewModel([{ id: 'x', end: 1000 }]);
    assert.deepEqual(model[0].tags, []);
});

test('historyViewModel drops non-string tags from the row', () => {
    const model = historyViewModel([{ id: 'x', end: 1000, pieces: ['Good', 42, '', '  '] }]);
    assert.deepEqual(model[0].tags, ['Good']);
});
