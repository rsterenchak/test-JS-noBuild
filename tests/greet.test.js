import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greet } from '../src/greet.js';

test('greet names the thing it is given', () => {
    assert.equal(greet('world'), 'Hello, world.');
});
