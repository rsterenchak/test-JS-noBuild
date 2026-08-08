// Entry point. No bundler — the browser loads this module directly, which is
// what makes this repo the served-from-source shape: the files in the repo ARE
// the files the browser gets. It mounts the session screen, the app's default
// view, into its root element.
import { initSession } from './session.js';

initSession(document.getElementById('app'));
