import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessionsForPiece, pieceDetailViewModel } from '../src/pieceDetail.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

test('sessionsForPiece returns only the sessions that tagged the piece', () => {
    const sessions = [
        { id: 'a', pieces: ['Sonata', 'Scales'] },
        { id: 'b', pieces: ['Etude'] },
        { id: 'c', pieces: ['Scales'] },
    ];
    assert.deepEqual(
        sessionsForPiece('Scales', sessions).map((s) => s.id),
        ['a', 'c'],
    );
});

test('sessionsForPiece matches names trimmed, mirroring the store', () => {
    const sessions = [{ id: 'a', pieces: ['Scales'] }];
    assert.deepEqual(sessionsForPiece('  Scales  ', sessions).map((s) => s.id), ['a']);
});

test('sessionsForPiece tolerates a blank name, non-array input, and junk tags', () => {
    assert.deepEqual(sessionsForPiece('', [{ id: 'a', pieces: ['x'] }]), []);
    assert.deepEqual(sessionsForPiece(null, [{ id: 'a', pieces: ['x'] }]), []);
    assert.deepEqual(sessionsForPiece('x', null), []);
    assert.deepEqual(sessionsForPiece('x', [{ id: 'a', pieces: [42, null, 'x'] }]).map((s) => s.id), ['a']);
    assert.deepEqual(sessionsForPiece('x', [{ id: 'a' }]), []); // no pieces array
});

test('sessionsForPiece does not mutate its input', () => {
    const sessions = [
        { id: 'a', pieces: ['x'] },
        { id: 'b', pieces: ['y'] },
    ];
    const before = sessions.map((s) => s.id);
    sessionsForPiece('x', sessions);
    assert.deepEqual(sessions.map((s) => s.id), before);
});

test('pieceDetailViewModel orders sessions newest-first and labels each', () => {
    const sessions = [
        { id: 'old', start: 1000, end: 1000 + 5 * MINUTE, pieces: ['Sonata'] },
        { id: 'new', start: Date.UTC(2026, 0, 2), end: Date.UTC(2026, 0, 2) + HOUR, pieces: ['Sonata'] },
        { id: 'other', end: 9_999_999, pieces: ['Scales'] },
    ];
    const model = pieceDetailViewModel('Sonata', sessions, { timeZone: 'UTC' });
    assert.equal(model.found, true);
    assert.deepEqual(model.sessions.map((r) => r.id), ['new', 'old']);
    assert.equal(model.sessions[0].duration, '1h 0m');
    assert.equal(model.sessions[1].duration, '5m');
});

test('pieceDetailViewModel derives totals the way the store does', () => {
    const sessions = [
        { id: 'a', start: 0, end: 5 * MINUTE, pieces: ['Etude'] },
        { id: 'b', start: 10 * MINUTE, end: 10 * MINUTE + 25 * MINUTE, pieces: ['Etude'] },
    ];
    const model = pieceDetailViewModel('Etude', sessions, { timeZone: 'UTC' });
    assert.equal(model.sessionCount, 2);
    assert.equal(model.totalTime, '30m'); // 5m + 25m
    // Last practised is the most recent session end, formatted as a date.
    assert.equal(model.lastPractised, formatEnd(10 * MINUTE + 25 * MINUTE));
});

function formatEnd(ts) {
    // Mirror history's formatter for the assertion above without importing it,
    // keeping this test focused on pieceDetail's own contract.
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
    }).format(new Date(ts));
}

test('pieceDetailViewModel derives a session duration from start/end when none is stored', () => {
    const model = pieceDetailViewModel('P', [{ id: 'x', start: 1000, end: 1000 + 3 * MINUTE, pieces: ['P'] }]);
    assert.equal(model.sessions[0].duration, '3m');
    assert.equal(model.totalTime, '3m');
});

test('pieceDetailViewModel reads an unknown or never-tagged piece as not found', () => {
    const sessions = [{ id: 'a', end: 1000, pieces: ['Known'] }];
    const model = pieceDetailViewModel('Unknown', sessions);
    assert.equal(model.found, false);
    assert.equal(model.sessionCount, 0);
    assert.deepEqual(model.sessions, []);
    assert.equal(model.name, 'Unknown');
});

test('pieceDetailViewModel reads a piece whose sessions all lack an end as not-yet-practised', () => {
    const model = pieceDetailViewModel('P', [{ id: 'x', start: 5000, pieces: ['P'] }]);
    assert.equal(model.found, true, 'a start-only session still tags the piece');
    assert.equal(model.lastPractised, 'Not yet practised');
    assert.equal(model.totalTime, '0s'); // no end => duration 0, matching the store
});

test('pieceDetailViewModel normalizes a blank name and finds nothing', () => {
    const model = pieceDetailViewModel('   ', [{ id: 'a', end: 1000, pieces: ['x'] }]);
    assert.equal(model.name, '');
    assert.equal(model.found, false);
});
