# Agent Hooks — FrankenLab

Hooks are described here as an example of the intended workflow. Whether each
hook was actually enabled during the build is recorded in the README's
"How Kiro was used" section (kept honest — no fabricated claims).

## Example hook: `lint-and-test-on-save`

- **Trigger:** on file save of `app.js`
- **Action:** run the Node sanity tests for the pure helpers (JWT parse/crack,
  ABI decode, toolbox round-trips) and report failures inline before the
  developer continues.
- **Why:** the chimera's organs are pure functions; a save-time test hook keeps
  a broken organ from being stitched in unnoticed.

## Example hook: `spec-sync-reminder`

- **Trigger:** when a new tool panel is added to `index.html`
- **Action:** prompt to update `.kiro/specs/frankenlab/requirements.md` and
  check off / extend `tasks.md` so the spec stays the source of truth.
- **Why:** spec-driven development only works if the spec and the code are
  never allowed to drift apart silently.
