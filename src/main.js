// Entry point. No bundler — the browser loads this module directly, which is
// what makes this repo the served-from-source shape: the files in the repo ARE
// the files the browser gets.
import { greet } from './greet.js';

const out = document.getElementById('out');
if (out) out.textContent = greet('world');
