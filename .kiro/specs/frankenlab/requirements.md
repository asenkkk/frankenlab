# FrankenLab — Requirements

## Introduction
FrankenLab is a single-page, fully client-side web app that combines four
security utilities into one Halloween-themed interface, for the Kiroween 2026
hackathon, Frankenstein category ("stitch together technologies that shouldn't
work together"). No backend, no build step, no user data leaves the browser
except calls the user explicitly triggers.

## Requirements

### R1 — JWT Inspector
- R1.1 Accept a pasted JWT, split it into header/payload/signature, base64url-decode
  and pretty-print header and payload as JSON.
- R1.2 Display `exp`, `iat`, `nbf` claims (when present) with UTC timestamps and a
  live status (valid / EXPIRED / not-yet-valid).
- R1.3 Verify an HS256 signature against a user-supplied secret using WebCrypto HMAC.
- R1.4 Test the signature against a built-in list of common/weak secrets and report
  a hit as a security finding.
- R1.5 Reject malformed tokens with a plain-language error. The token must never
  be transmitted anywhere.

### R2 — API Probe
- R2.1 Fetch a user-entered URL with the Fetch API; show status, elapsed time and
  all response headers the browser exposes.
- R2.2 Grade five security headers (CSP, HSTS, X-Content-Type-Options,
  X-Frame-Options or CSP frame-ancestors, Referrer-Policy) and show a score out of 5.
- R2.3 On failure, explain CORS as the most likely cause; never claim the target is down.

### R3 — EVM Token Checker
- R3.1 Accept a BSC contract address; validate `0x` + 40 hex chars before any call.
- R3.2 Read `name()`, `symbol()`, `decimals()`, `totalSupply()` via read-only
  `eth_call` JSON-RPC against `https://bsc-dataseed.binance.org`.
- R3.3 Decode ABI return values (string with bytes32 fallback; uint256 via BigInt)
  and format total supply using the token's decimals.
- R3.4 No wallet connection, signing, or private-key handling of any kind.
- R3.5 Surface RPC/contract errors with likely causes.

### R4 — Encoder / Hash Toolbox
- R4.1 Base64, hex and URL encode/decode, UTF-8 safe, with input validation errors.
- R4.2 SHA-256 hashing via WebCrypto, output as lowercase hex.
- R4.3 Copy-output and use-output-as-input helpers.

### R5 — Platform / UX
- R5.1 Plain HTML/CSS/JS in three files (`index.html`, `styles.css`, `app.js`);
  runs from `file://`, any static server, or GitHub Pages.
- R5.2 Dark Halloween theme with accessible contrast, visible focus states,
  labelled controls, `aria-live` result regions, and tab semantics.
- R5.3 Zero dependencies; pure logic functions must be importable from Node for tests.
