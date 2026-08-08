import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import { CACHE_NAME, PRECACHE_URLS } from '../src/precache.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const srcDir = resolve(repoRoot, 'src');

// Walk the static import graph starting from main.js, returning every src/ module
// the app actually loads. This is what "the served-from-source file set" means for
// offline purposes: not every file in src/, but every one reachable from the
// entry point. A new surface added later shows up here automatically, so the sync
// assertion below fails until its module is precached.
function reachableModules(entry) {
    const seen = new Set();
    const stack = [resolve(srcDir, entry)];
    while (stack.length) {
        const file = stack.pop();
        if (seen.has(file)) continue;
        seen.add(file);
        const text = readFileSync(file, 'utf8');
        const importRe = /from\s+['"](\.[^'"]+)['"]/g;
        let m;
        while ((m = importRe.exec(text)) !== null) {
            stack.push(resolve(dirname(file), m[1]));
        }
    }
    return [...seen];
}

test('CACHE_NAME is a non-empty versioned string', () => {
    assert.equal(typeof CACHE_NAME, 'string');
    assert.ok(CACHE_NAME.length > 0);
});

test('PRECACHE_URLS covers the app shell', () => {
    for (const url of ['./', './index.html', './manifest.webmanifest', './favicon.svg', './src/style.css']) {
        assert.ok(PRECACHE_URLS.includes(url), `precache is missing shell file ${url}`);
    }
});

test('PRECACHE_URLS covers every module reachable from main.js', () => {
    for (const file of reachableModules('main.js')) {
        const url = './' + relative(repoRoot, file).split('\\').join('/');
        assert.ok(
            PRECACHE_URLS.includes(url),
            `precache is out of sync: main.js loads ${url} but it is not precached`,
        );
    }
});

test('every precached URL points to a file that exists on disk', () => {
    for (const url of PRECACHE_URLS) {
        // './' is the scope root served by index.html, not a file of its own.
        const rel = url === './' ? 'index.html' : url.replace(/^\.\//, '');
        assert.ok(existsSync(resolve(repoRoot, rel)), `precached ${url} does not exist on disk`);
    }
});

test('PRECACHE_URLS has no duplicate entries', () => {
    assert.equal(new Set(PRECACHE_URLS).size, PRECACHE_URLS.length);
});

test('manifest.webmanifest is valid JSON with the fields an installable PWA needs', () => {
    const manifest = JSON.parse(readFileSync(resolve(repoRoot, 'manifest.webmanifest'), 'utf8'));
    assert.equal(typeof manifest.name, 'string');
    assert.ok(manifest.name.length > 0);
    assert.equal(manifest.display, 'standalone');
    assert.equal(typeof manifest.start_url, 'string');
    assert.ok(manifest.start_url.length > 0);
    assert.match(manifest.theme_color, /^#[0-9a-fA-F]{3,8}$/);
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'needs at least one icon');
    for (const icon of manifest.icons) {
        assert.ok(icon.src, 'icon needs a src');
        assert.ok(existsSync(resolve(repoRoot, icon.src)), `icon ${icon.src} does not exist on disk`);
    }
});
