import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
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

// Decode an 8-bit RGBA PNG (colour type 6) into a flat array of [r,g,b,a]
// pixels: concatenate IDAT chunks, inflate, then reverse the per-scanline
// filters. Enough to inspect actual pixel content — a structurally valid PNG
// (signature + IHDR) can still be a blank/solid-colour image, which is exactly
// the failure that shipped a solid-black icon set. See regression note below.
function decodePng(name) {
    const buf = readFileSync(resolve(repoRoot, name));
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    assert.equal(buf[24], 8, `${name} is not 8-bit`);
    assert.equal(buf[25], 6, `${name} is not RGBA (colour type 6)`);

    let idat = Buffer.alloc(0);
    let off = 8;
    while (off < buf.length) {
        const len = buf.readUInt32BE(off);
        const type = buf.subarray(off + 4, off + 8).toString('ascii');
        if (type === 'IDAT') idat = Buffer.concat([idat, buf.subarray(off + 8, off + 8 + len)]);
        off += 12 + len;
    }
    const raw = inflateSync(idat);

    const bpp = 4;
    const stride = width * bpp;
    const out = Buffer.alloc(height * stride);
    let pos = 0;
    for (let y = 0; y < height; y++) {
        const filter = raw[pos++];
        for (let x = 0; x < stride; x++) {
            const cur = raw[pos++];
            const a = x >= bpp ? out[y * stride + x - bpp] : 0;
            const b = y > 0 ? out[(y - 1) * stride + x] : 0;
            const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
            let recon;
            if (filter === 0) recon = cur;
            else if (filter === 1) recon = cur + a;
            else if (filter === 2) recon = cur + b;
            else if (filter === 3) recon = cur + ((a + b) >> 1);
            else if (filter === 4) {
                const p = a + b - c;
                const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
                recon = cur + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
            } else throw new Error(`${name} uses unknown filter ${filter}`);
            out[y * stride + x] = recon & 0xff;
        }
    }

    const pixels = [];
    for (let i = 0; i < out.length; i += bpp) {
        pixels.push([out[i], out[i + 1], out[i + 2], out[i + 3]]);
    }
    return pixels;
}

// The solid-black regression: the PNGs passed the structural checks above but
// held no clock artwork (uniform/empty pixel data), so iOS fell back to its
// generic icon. Assert the decoded pixels actually contain the clock's white
// face and black outline/hands, and are not a single flat colour, so a blank
// asset can never silently pass again.
test('the PNG icons contain the clock artwork, not a flat/blank image', () => {
    for (const name of ['apple-touch-icon.png', 'favicon-32.png', 'favicon-16.png']) {
        const pixels = decodePng(name);
        const distinct = new Set(pixels.map((p) => p.join(',')));
        assert.ok(distinct.size >= 4, `${name} is nearly uniform (${distinct.size} distinct colours)`);

        const hasWhite = pixels.some(([r, g, b, a]) => r > 200 && g > 200 && b > 200 && a > 200);
        const hasBlack = pixels.some(([r, g, b, a]) => r < 60 && g < 60 && b < 60 && a > 200);
        assert.ok(hasWhite, `${name} has no white clock face`);
        assert.ok(hasBlack, `${name} has no black outline/hands`);
    }
});

// At 180x180 the red second hand is wide enough to survive rasterisation, so
// verify the naturalistic red actually made it into the largest asset.
test('the apple-touch-icon renders the red second hand', () => {
    const pixels = decodePng('apple-touch-icon.png');
    const hasRed = pixels.some(([r, g, b, a]) => r > 150 && g < 90 && b < 90 && a > 150);
    assert.ok(hasRed, 'apple-touch-icon.png has no red second hand');
});
