import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatElapsed, sessionViewModel } from '../src/session.js';

test('formatElapsed shows M:SS under an hour', () => {
    assert.equal(formatElapsed(0), '0:00');
    assert.equal(formatElapsed(5000), '0:05');
    assert.equal(formatElapsed(65000), '1:05');
    assert.equal(formatElapsed(20 * 60 * 1000), '20:00');
});

test('formatElapsed widens to H:MM:SS past an hour', () => {
    assert.equal(formatElapsed(3600000), '1:00:00');
    assert.equal(formatElapsed(3661000), '1:01:01');
});

test('formatElapsed clamps a negative duration to zero', () => {
    assert.equal(formatElapsed(-5000), '0:00');
});

test('sessionViewModel reports the idle state with no active session', () => {
    assert.deepEqual(sessionViewModel(null, 10000), {
        active: false,
        elapsedMs: 0,
        elapsedText: '0:00',
    });
});

test('sessionViewModel derives elapsed time from the start timestamp', () => {
    assert.deepEqual(sessionViewModel({ start: 1000 }, 4000), {
        active: true,
        elapsedMs: 3000,
        elapsedText: '0:03',
    });
});

test('sessionViewModel resumes with full elapsed time after a long gap', () => {
    // Simulates a tab reopened long after the session started: elapsed time is
    // `now - start`, so no time is lost regardless of how many ticks were missed.
    const start = 1_000_000;
    const now = start + 42 * 60 * 1000; // 42 minutes later
    const model = sessionViewModel({ start }, now);
    assert.equal(model.elapsedMs, 42 * 60 * 1000);
    assert.equal(model.elapsedText, '42:00');
});

test('sessionViewModel clamps a backwards clock to zero elapsed', () => {
    const model = sessionViewModel({ start: 5000 }, 1000);
    assert.equal(model.elapsedMs, 0);
    assert.equal(model.elapsedText, '0:00');
});
