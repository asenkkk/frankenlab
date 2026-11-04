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

## How Kiro was used — ⚠️ DRAFT, to be finalised after the real Kiro session

> **Honesty note:** this section is a placeholder written *before* the Kiro
> development session. It must be replaced with what actually happened —
> do not submit it as-is and do not invent details that did not occur.

Planned / to-be-confirmed usage:

- [ ] **Spec-driven development** — requirements, design and task list drafted
      under `.kiro/specs/frankenlab/` *before* code; note here which parts Kiro
      generated from the spec vs. which were hand-written. _(fill in)_
- [ ] **Steering docs** — `.kiro/steering/product.md` and `tech.md` used to keep
      Kiro's output on-brief (client-side only, zero dependencies, honest error
      messages). _(describe the effect it actually had)_
- [ ] **Agent hooks** — an example hook is described in `.kiro/hooks/README.md`.
      _(state whether it was enabled and what it did in practice)_
- [ ] **Which Kiro surface** — IDE / CLI / Web / Crew: _(record which, and how they differed)_
- [ ] **Custom agents / MCP / powers / property-based testing** — _(only list what was genuinely used)_

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Arif Syaefudin M.
