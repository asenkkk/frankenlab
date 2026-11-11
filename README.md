# FrankenLab — API Security Chimera ⚗️🎃

> Four incompatible creatures, stitched into one body. A working security-toolkit
> web app built for **Kiroween 2026** on Devpost — **Frankenstein category**
> (with a Costume-Contest-grade spooky UI on top).

FrankenLab stitches together technologies that were never meant to share a body:

| Organ | Technology | What it does |
|---|---|---|
| 🧠 Brain | JSON Web Tokens / HMAC-SHA256 | Decode & attack-test JWTs |
| 🛰️ Eyes | HTTP / Fetch / CORS | Probe live APIs and grade their security headers |
| ⛓️ Skeleton | Ethereum ABI / JSON-RPC (`eth_call`) | Read BEP-20 token data straight from BNB Smart Chain |
| 🧰 Hands | Base64 / Hex / URL encoding + WebCrypto SHA-256 | Everyday encoder & hash toolbox |

Everything runs **100% client-side**. There is no backend, no build step, no
tracking, no cookies. The only network calls are the ones the user explicitly
triggers (a probe URL, and read-only calls to the public BSC RPC endpoint).

## Features

1. **JWT Inspector** — paste a JWT; header & payload are decoded locally, `exp`/`iat`/`nbf`
   are shown with live expiry status, the HS256 signature can be verified against a
   user-supplied secret, and a one-click test runs it against a built-in list of
   ~14 common/weak secrets. Load the sample token and hit "wordlist" to watch it crack.
2. **API Probe** — fetch any URL, see status, timing and every header the browser
   exposes, and get a 0–5 security-header score (CSP, HSTS, X-Content-Type-Options,
   X-Frame-Options / frame-ancestors, Referrer-Policy). CORS limits are stated
   honestly in the UI — a failed probe explains *why* instead of pretending.
3. **EVM Token Checker** — paste a BSC contract address and read `name()`, `symbol()`,
   `decimals()` and `totalSupply()` via read-only `eth_call` JSON-RPC to
   `https://bsc-dataseed.binance.org`. Address format is validated; errors are
   explained in plain language. No wallet connection, no signing, no keys.
4. **Encoder / Hash Toolbox** — Base64, hex and URL encode/decode (UTF-8 safe),
   plus SHA-256 hashing via the WebCrypto API.

## How to run

- **Simplest:** open `index.html` in a browser. (The EVM checker and API probe
  need internet access; everything else works offline.)
- **Local server:** `python3 -m http.server 8000` in this folder, then visit
  `http://localhost:8000`.
- **GitHub Pages:** push this repo, enable Pages (root of the default branch),
  done — it is a plain static site.

## Architecture

```
index.html   – markup: header, tab bar, one <section> per tool
styles.css   – dark Halloween theme (pumpkin orange / eerie green), responsive, focus-visible states
app.js       – all logic in vanilla JS:
               · pure helpers (JWT parse/verify, ABI decode, encoders) —
                 exported via a module.exports guard so Node tests can import them
               · browser UI wiring, guarded by `typeof document`
.kiro/       – spec-driven development artefacts (see below)
```

Design choices: zero dependencies (nothing to install, nothing to audit),
WebCrypto for all cryptography, `BigInt` for token amounts (no float rounding
on-chain values), and ABI string decoding with a bytes32 fallback for legacy tokens.

## Devpost submission draft

**Title:** FrankenLab — API Security Chimera

**Tagline:** Four security tools that should never share a body — JWTs, HTTP
headers, blockchain tokens and crypto encodings — stitched into one spooky,
private, client-side app.

**Description (draft):**
Security work means juggling a dozen scattered tools: one site to decode a JWT,
another to check headers, a block explorer for a token contract, a converter for
encodings. FrankenLab sews them into a single creature. Paste a JWT and watch a
weak-secret signature get cracked in-browser. Probe an API and get an honest
security-header report card — including an honest explanation when CORS says no.
Drop in a BSC contract address and read its name, supply and decimals directly
from chain with read-only `eth_call` — no wallet, no keys, nothing signed. Then
finish in the toolbox that encodes, decodes and hashes without anything leaving
the tab. FrankenLab is deliberately serverless: your tokens and keys never leave
your browser, because there is nowhere for them to go. Built with vanilla
HTML/CSS/JS and WebCrypto, dressed for Halloween, and structured the Kiro way —
specs, steering and hooks live in `/.kiro`, committed at the repo root.

**Category:** Frankenstein · **Bonus angles:** polished spooky UI (Costume
Contest spirit), demo-friendly sample data.

**Still needed before submitting:** public GitHub repo URL, live app URL,
demo video (< 3 min, YouTube, public), final "How Kiro was used" write-up.

## How Kiro was used

FrankenLab was built with Kiro using a spec-first workflow. The `/.kiro`
directory committed at the repo root is the record of that workflow — not an
afterthought, but the structure the app was constructed against.

- **Spec-driven development.** `.kiro/specs/frankenlab/` holds a three-part
  spec: `requirements.md` (R1–R5, one per tool plus platform/UX), `design.md`
  (architecture, key decisions, error-handling model), and `tasks.md`. `tasks.md`
  is a checkbox list that tracks the build item by item — scaffolding, each
  tool's features, the accessibility pass, Node sanity tests, the local smoke
  test, and the publishing/demo steps. Requirements and design were drafted
  before the code, and the task list is what keeps the spec and the
  implementation in step.

- **Steering docs.** `.kiro/steering/product.md` and `tech.md` set the brief
  Kiro's output had to stay on: vanilla HTML/CSS/JS only with zero dependencies,
  WebCrypto (HMAC-SHA256, SHA-256) for all cryptography, `BigInt` end-to-end for
  on-chain amounts so floats never touch token values, `escapeHtml` on every
  user-supplied string before it reaches the DOM, honest failure messages (CORS
  and RPC errors explained, never fabricated), and every tool standalone so one
  failure doesn't take the others down. Privacy as the headline feature —
  nothing pasted leaves the browser except calls the user explicitly triggers —
  comes straight from the product steering doc.

- **Agent hooks.** `.kiro/hooks/README.md` documents two example hooks
  (`lint-and-test-on-save` for `app.js`, `spec-sync-reminder` for new tool
  panels) as the intended workflow. The hooks directory contains only that
  README — there is no active hook configuration committed alongside it — so
  they are recorded as described-intent examples rather than confirmed-running
  automation.

- **Kiro surface.** This finalisation step ran in a **Kiro CLI** chat session.
  In it, the publishing and demo-video tasks were verified as complete and
  checked off in `tasks.md`: the public repo is
  <https://github.com/asenkkk/frankenlab> with GitHub Pages live at
  <https://asenkkk.github.io/frankenlab/>, and the demo video is public at
  <https://www.youtube.com/watch?v=oPp9v8l3M9I>. This README section was then
  rewritten from its earlier DRAFT placeholder to what you're reading now.

- **Custom agents / MCP / powers / property-based testing** — none of these
  were used; the project is plain static files with Node sanity tests for the
  pure helpers, and there is nothing in the repo to indicate otherwise.

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Arif Syaefudin M.
