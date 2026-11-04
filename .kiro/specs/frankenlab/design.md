# FrankenLab — Design

## Overview
One static page, four tabbed panels, one script. All state lives in the DOM;
there is no persistence and no server component.

```
Browser tab
├── index.html ── structure: header, tab bar, 4 tool panels, footer
├── styles.css ── theme (CSS variables), layout, accessibility states
└── app.js
    ├── pure helpers  ── base64url, parseJWT, hs256Verify/crackHS256 (WebCrypto),
    │                    evaluateSecurityHeaders, ABI encode/decode, toolbox ops
    │                    (exported via module.exports guard → unit-testable in Node)
    └── UI wiring     ── guarded by `typeof document !== 'undefined'`
External calls (user-triggered only)
├── fetch(<user URL>)                    → API Probe (CORS-bound by design)
└── POST bsc-dataseed.binance.org        → eth_call name/symbol/decimals/totalSupply
```

## Key decisions
- **WebCrypto for all crypto** (HMAC-SHA256 verify, SHA-256 hash): audited,
  native, no dependency risk. Signature comparison is done on the canonical
  base64url encoding of the computed HMAC.
- **BigInt for on-chain amounts**: token supplies exceed float precision;
  formatting splits whole/fraction by 10^decimals as integers.
- **ABI string decoding with bytes32 fallback**: most BEP-20 tokens return a
  dynamic string (offset/length/data), a minority return bytes32.
- **Honest failure UX**: probe failures explain CORS; RPC failures list likely
  causes. The app never fabricates a result.
- **Security posture**: pasted secrets/tokens are only ever used locally;
  all rendered values pass through `escapeHtml` before hitting `innerHTML`.

## Error handling
Each tool catches its own errors and renders a localised message in its panel;
one tool's failure never affects the others (the chimera loses a limb, not its life).
