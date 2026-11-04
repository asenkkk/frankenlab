/* FrankenLab — API Security Chimera. Vanilla JS, no dependencies.
   Pure helpers are exported for Node tests (module.exports guard at the bottom);
   UI wiring only runs in a browser (document guard). */
'use strict';

/* ---------- shared helpers ---------- */
const enc = new TextEncoder();
const dec = new TextDecoder();

function bytesToB64Url(bytes) {
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64UrlToBytes(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=');
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}
function b64UrlToString(str) { return dec.decode(b64UrlToBytes(str)); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- 1. JWT Inspector ---------- */
const COMMON_SECRETS = ['secret', 'password', '123456', '123456789', 'key', 'mysecret', 'secretkey',
  'your-256-bit-secret', 'changeme', 'supersecret', 'test', 'jwtsecret', 's3cret', 'keyboard cat'];

function parseJWT(token) {
  const parts = String(token).trim().split('.');
  if (parts.length !== 3) throw new Error('A JWT must have exactly 3 dot-separated parts (header.payload.signature).');
  return {
    header: JSON.parse(b64UrlToString(parts[0])),
    payload: JSON.parse(b64UrlToString(parts[1])),
    signature: parts[2],
    signingInput: parts[0] + '.' + parts[1],
  };
}
async function hs256Verify(secret, signingInput, signatureB64Url) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  return bytesToB64Url(new Uint8Array(sig)) === signatureB64Url;
}
async function crackHS256(jwt) {
  for (const s of COMMON_SECRETS) {
    if (await hs256Verify(s, jwt.signingInput, jwt.signature)) return s;
  }
  return null;
}
function expiryInfo(payload) {
  const now = Math.floor(Date.now() / 1000);
  const out = [];
  if (payload.exp !== undefined) out.push({ claim: 'exp', value: payload.exp, when: new Date(payload.exp * 1000).toISOString(), status: payload.exp > now ? 'valid (not expired)' : 'EXPIRED' });
  if (payload.iat !== undefined) out.push({ claim: 'iat', value: payload.iat, when: new Date(payload.iat * 1000).toISOString(), status: 'issued-at' });
  if (payload.nbf !== undefined) out.push({ claim: 'nbf', value: payload.nbf, when: new Date(payload.nbf * 1000).toISOString(), status: payload.nbf <= now ? 'active' : 'not yet valid' });
  return out;
}

/* ---------- 2. API Probe: security-header grading ---------- */
/* headers: plain object with lowercase keys. Returns checks + score/5. */
function evaluateSecurityHeaders(headers) {
  const csp = headers['content-security-policy'] || '';
  const checks = [
    { name: 'Content-Security-Policy', present: !!csp, value: csp },
    { name: 'Strict-Transport-Security', present: !!headers['strict-transport-security'], value: headers['strict-transport-security'] || '' },
    { name: 'X-Content-Type-Options', present: (headers['x-content-type-options'] || '').toLowerCase() === 'nosniff', value: headers['x-content-type-options'] || '' },
    { name: 'X-Frame-Options / CSP frame-ancestors', present: !!headers['x-frame-options'] || /(^|;)\s*frame-ancestors/.test(csp), value: headers['x-frame-options'] || (csp.match(/frame-ancestors[^;]*/)?.[0] || '') },
    { name: 'Referrer-Policy', present: !!headers['referrer-policy'], value: headers['referrer-policy'] || '' },
  ];
  return { checks, score: checks.filter(c => c.present).length, total: checks.length };
}

/* ---------- 3. EVM Token Checker (read-only eth_call) ---------- */
const BSC_RPC = 'https://bsc-dataseed.binance.org';
const SELECTORS = { name: '0x06fdde03', symbol: '0x95d89b41', decimals: '0x313ce567', totalSupply: '0x18160ddd' };

function isValidAddress(a) { return /^0x[0-9a-fA-F]{40}$/.test(String(a).trim()); }
function buildEthCall(to, data, id = 1) {
  return { jsonrpc: '2.0', id, method: 'eth_call', params: [{ to, data }, 'latest'] };
}
function hexToBytes(hex) {
  const h = hex.replace(/^0x/, '');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}
/* Decode an ABI-encoded string; falls back to bytes32-as-ascii for legacy tokens. */
function decodeAbiString(hex) {
  if (!hex || hex === '0x') return '';
  const bytes = hexToBytes(hex);
  if (bytes.length >= 64) {
    const len = Number(BigInt('0x' + hex.replace(/^0x/, '').slice(64, 128) || '0'));
    const start = 64;
    if (len > 0 && start + len <= bytes.length) return dec.decode(bytes.slice(start, start + len));
  }
  return dec.decode(bytes.filter(b => b !== 0)); // bytes32 fallback
}
function decodeAbiUint(hex) { return BigInt(hex === '0x' || !hex ? '0' : hex); }
function formatTokenAmount(raw, decimals) {
  const d = BigInt(decimals), base = 10n ** d;
  const whole = raw / base, frac = (raw % base).toString().padStart(Number(d), '0').replace(/0+$/, '');
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? `${wholeStr}.${frac}` : wholeStr;
}
async function ethCall(to, data, id) {
  const res = await fetch(BSC_RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildEthCall(to, data, id)) });
  if (!res.ok) throw new Error('RPC HTTP ' + res.status);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'RPC error');
  return json.result;
}

/* ---------- 4. Encoder / Hash toolbox ---------- */
const toolbox = {
  b64enc: v => btoa(String.fromCharCode(...enc.encode(v))),
  b64dec: v => dec.decode(Uint8Array.from(atob(v.trim()), c => c.charCodeAt(0))),
  hexenc: v => [...enc.encode(v)].map(b => b.toString(16).padStart(2, '0')).join(''),
  hexdec: v => { const t = v.trim().replace(/\s/g, ''); if (!/^([0-9a-fA-F]{2})*$/.test(t)) throw new Error('Invalid hex (needs pairs of 0-9/a-f).'); return dec.decode(hexToBytes(t)); },
  urlenc: v => encodeURIComponent(v),
  urldec: v => decodeURIComponent(v.trim()),
  sha256: async v => [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(v)))].map(b => b.toString(16).padStart(2, '0')).join(''),
};

/* ---------- Browser UI ---------- */
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);

  /* Tabs */
  document.querySelectorAll('[role="tab"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b === btn)));
      document.querySelectorAll('[role="tabpanel"]').forEach(p => { p.hidden = p.id !== 'panel-' + btn.dataset.tab; });
    });
  });

  /* JWT */
  const sample = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Vg30C57s3l90JNap_VgMhKZjfc-p7SoBXaSAy8c28HA'; // demo token, signed with "your-256-bit-secret"
  function renderJWT() {
    const box = $('jwt-result'); const raw = $('jwt-input').value;
    if (!raw.trim()) { box.innerHTML = ''; return null; }
    try {
      const jwt = parseJWT(raw);
      const exp = expiryInfo(jwt.payload);
      const expRows = exp.length ? exp.map(e => `<tr><td><code>${e.claim}</code></td><td>${escapeHtml(e.when)}</td><td class="${e.status === 'EXPIRED' ? 'bad' : 'ok'}">${escapeHtml(e.status)}</td></tr>`).join('') : '<tr><td colspan="3">No exp / iat / nbf claims.</td></tr>';
      box.innerHTML = `<h3>Header</h3><pre>${escapeHtml(JSON.stringify(jwt.header, null, 2))}</pre>
        <h3>Payload</h3><pre>${escapeHtml(JSON.stringify(jwt.payload, null, 2))}</pre>
        <h3>Claims timing</h3><table><tr><th>Claim</th><th>UTC</th><th>Status</th></tr>${expRows}</table>
        <p>Algorithm: <code>${escapeHtml(jwt.header.alg || '?')}</code> · Signature (base64url): <code>${escapeHtml(jwt.signature.slice(0, 24))}…</code></p>
        <div id="jwt-sig-result"></div>`;
      return jwt;
    } catch (e) { box.innerHTML = `<p class="bad">⚠️ ${escapeHtml(e.message)}</p>`; return null; }
  }
  $('jwt-input').addEventListener('input', renderJWT);
  $('jwt-sample').addEventListener('click', () => { $('jwt-input').value = sample; renderJWT(); });
  $('jwt-verify').addEventListener('click', async () => {
    const jwt = renderJWT(); if (!jwt) return;
    const secret = $('jwt-secret').value;
    const ok = secret ? await hs256Verify(secret, jwt.signingInput, jwt.signature) : false;
    $('jwt-sig-result').innerHTML = secret
      ? (ok ? '<p class="ok">✅ Signature VALID for the secret you entered. Anyone with that secret can forge tokens.</p>'
            : '<p class="bad">❌ Signature does not match that secret.</p>')
      : '<p class="mid">Enter a secret first, or run the wordlist test.</p>';
  });
  $('jwt-crack').addEventListener('click', async () => {
    const jwt = renderJWT(); if (!jwt) return;
    if (jwt.header.alg !== 'HS256') { $('jwt-sig-result').innerHTML = '<p class="mid">Wordlist test only applies to HS256 tokens.</p>'; return; }
    const found = await crackHS256(jwt);
    $('jwt-sig-result').innerHTML = found
      ? `<p class="bad">🚨 CRACKED — this token was signed with the common secret <code>${escapeHtml(found)}</code>. Treat every token from that issuer as forgeable.</p>`
      : '<p class="ok">✅ Not signed with any secret in the built-in common-secrets wordlist.</p>';
  });

  /* API Probe */
  $('probe-go').addEventListener('click', async () => {
    const box = $('probe-result'); const url = $('probe-url').value.trim();
    box.innerHTML = '<p>Probing…</p>';
    const t0 = performance.now();
    try {
      const res = await fetch(url, { method: 'GET' });
      const ms = Math.round(performance.now() - t0);
      const headers = {}; res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
      const { checks, score, total } = evaluateSecurityHeaders(headers);
      const rows = checks.map(c => `<tr><td>${escapeHtml(c.name)}</td><td class="${c.present ? 'ok' : 'bad'}">${c.present ? 'present' : 'MISSING'}</td><td><code>${escapeHtml(c.value || '—')}</code></td></tr>`).join('');
      const headerRows = Object.entries(headers).map(([k, v]) => `<tr><td><code>${escapeHtml(k)}</code></td><td><code>${escapeHtml(v)}</code></td></tr>`).join('') || '<tr><td colspan="2">No headers exposed to the browser (CORS).</td></tr>';
      let preview = '';
      try { preview = (await res.clone().text()).slice(0, 500); } catch { /* binary/streamed body */ }
      box.innerHTML = `<p class="score">Header score: ${score}/${total}</p>
        <p>Status: <strong>${res.status} ${escapeHtml(res.statusText)}</strong> · Time: <strong>${ms} ms</strong> · Type: ${escapeHtml(res.type)}</p>
        <h3>Security headers</h3><table><tr><th>Header</th><th>Result</th><th>Value</th></tr>${rows}</table>
        <h3>All headers the browser exposed</h3><table><tr><th>Name</th><th>Value</th></tr>${headerRows}</table>
        ${preview ? `<h3>Body preview (first 500 chars)</h3><pre>${escapeHtml(preview)}</pre>` : ''}`;
    } catch (e) {
      box.innerHTML = `<p class="bad">⚠️ Fetch failed after ${Math.round(performance.now() - t0)} ms: ${escapeHtml(e.message)}.</p>
        <p>Most likely cause: the target blocks cross-origin reads (no CORS headers), is offline, or the URL is invalid. This tool cannot distinguish those from inside a browser — try a CORS-friendly public API such as <code>https://api.github.com/</code>.</p>`;
    }
  });

  /* EVM Token Checker */
  $('evm-go').addEventListener('click', async () => {
    const box = $('evm-result'); const addr = $('evm-address').value.trim();
    if (!isValidAddress(addr)) { box.innerHTML = '<p class="bad">⚠️ Invalid address — expected 0x followed by 40 hex characters.</p>'; return; }
    box.innerHTML = '<p>Reading from BSC…</p>';
    try {
      const [nameHex, symHex, decHex, supHex] = await Promise.all([
        ethCall(addr, SELECTORS.name, 1), ethCall(addr, SELECTORS.symbol, 2),
        ethCall(addr, SELECTORS.decimals, 3), ethCall(addr, SELECTORS.totalSupply, 4)]);
      const decimals = Number(decodeAbiUint(decHex));
      const supplyRaw = decodeAbiUint(supHex);
      box.innerHTML = `<table>
        <tr><th>Name</th><td>${escapeHtml(decodeAbiString(nameHex))}</td></tr>
        <tr><th>Symbol</th><td>${escapeHtml(decodeAbiString(symHex))}</td></tr>
        <tr><th>Decimals</th><td>${decimals}</td></tr>
        <tr><th>Total supply</th><td>${formatTokenAmount(supplyRaw, decimals)} (raw: ${supplyRaw.toString()})</td></tr>
        <tr><th>Contract</th><td><code>${escapeHtml(addr)}</code></td></tr></table>
        <p class="hint">Read-only eth_call — no wallet was connected and nothing was signed.</p>`;
    } catch (e) {
      box.innerHTML = `<p class="bad">⚠️ Could not read this contract: ${escapeHtml(e.message)}</p>
        <p>Possible causes: the address is not a BEP-20 token on BSC, the RPC is rate-limiting, or you are offline.</p>`;
    }
  });

  /* Toolbox */
  document.querySelectorAll('[data-op]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const msg = $('tools-msg');
      try { $('tools-output').value = await toolbox[btn.dataset.op]($('tools-input').value); msg.innerHTML = ''; }
      catch (e) { msg.innerHTML = `<p class="bad">⚠️ ${escapeHtml(e.message)}</p>`; }
    });
  });
  $('tools-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('tools-output').value); $('tools-msg').innerHTML = '<p class="ok">Copied.</p>'; } catch { $('tools-output').select(); document.execCommand('copy'); } });
  $('tools-swap').addEventListener('click', () => { $('tools-input').value = $('tools-output').value; });
}

/* Node test exports (ignored by browsers) */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseJWT, hs256Verify, crackHS256, expiryInfo, evaluateSecurityHeaders,
    isValidAddress, buildEthCall, decodeAbiString, decodeAbiUint, formatTokenAmount, toolbox, SELECTORS, BSC_RPC };
}
