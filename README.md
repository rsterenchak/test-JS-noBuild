# Served-from-source template

A static site with no build step. The browser loads `src/` directly, so what is
in the repo is what gets served.

Shape: **served-from-source**. Onboarding adds `manifest.yml`, which regenerates
the source manifest and commits it to the repo root.

- `index.html` — entry document at the repo root
- `src/` — modules loaded as-is by the browser
- `tests/` — `node --test`, no framework

Pages source: `main`, root.
