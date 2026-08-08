import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const html = readFileSync(resolve(repoRoot, 'index.html'), 'utf8');

// iOS Safari does not reliably render an SVG favicon in its tab bar or tab
// switcher; it wants a PNG icon plus an apple-touch-icon. These assertions lock in
// the full cross-platform icon set so a future edit can't silently drop back to the
// SVG-only state that left iOS tabs blank.

test('index.html keeps the SVG favicon for browsers that support it', () => {
    assert.match(html, /<link[^>]*rel="icon"[^>]*type="image\/svg\+xml"[^>]*href="favicon\.svg"/);
});

test('index.html references PNG favicons for iOS Safari and other non-SVG cases', () => {
    assert.match(html, /<link[^>]*rel="icon"[^>]*type="image\/png"[^>]*href="favicon-32\.png"/);
    assert.match(html, /<link[^>]*rel="icon"[^>]*type="image\/png"[^>]*href="favicon-16\.png"/);
});

test('index.html declares an apple-touch-icon', () => {
    assert.match(html, /<link[^>]*rel="apple-touch-icon"[^>]*href="apple-touch-icon\.png"/);
});

// A valid 8-bit RGBA PNG at the declared size: signature, then IHDR carrying the
// width/height. Guards against a link tag pointing at a missing or malformed file.
function assertPng(name, expectedSize) {
    const file = resolve(repoRoot, name);
    assert.ok(existsSync(file), `${name} does not exist on disk`);
    const buf = readFileSync(file);
    assert.deepEqual(
        [...buf.subarray(0, 8)],
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
        `${name} is not a PNG`,
    );
    assert.equal(buf.subarray(12, 16).toString('ascii'), 'IHDR', `${name} lacks an IHDR chunk`);
    assert.equal(buf.readUInt32BE(16), expectedSize, `${name} width is not ${expectedSize}`);
    assert.equal(buf.readUInt32BE(20), expectedSize, `${name} height is not ${expectedSize}`);
}

test('the referenced PNG icons exist at their declared sizes', () => {
    assertPng('apple-touch-icon.png', 180);
    assertPng('favicon-32.png', 32);
    assertPng('favicon-16.png', 16);
});
