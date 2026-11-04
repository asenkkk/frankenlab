# Steering — Tech

- Stack: vanilla HTML/CSS/JS only. Zero dependencies, no build step, no framework.
  The app must run from `file://`, any static server, and GitHub Pages.
- Files: `index.html` (structure), `styles.css` (theme), `app.js` (all logic).
- Cryptography only via WebCrypto (`crypto.subtle`): HMAC-SHA256, SHA-256.
  Never hand-roll crypto, never add a crypto library.
- On-chain values are `BigInt` end-to-end; floats must never touch token amounts.
- All user-supplied strings rendered into the page go through `escapeHtml` first.
- Keep pure logic (parsing, decoding, grading, formatting) free of DOM access and
  exported through the `module.exports` guard so Node tests can import `app.js`.
  DOM wiring stays behind the `typeof document !== 'undefined'` guard.
- Accessibility: labelled controls, `role=tablist/tab/tabpanel`, `aria-live`
  result regions, `:focus-visible` outlines, WCAG-AA contrast on the dark theme.
- Network: the only endpoints are the user-entered probe URL and
  `https://bsc-dataseed.binance.org` (read-only `eth_call`). No analytics,
  no beacons, no wallet libraries.
