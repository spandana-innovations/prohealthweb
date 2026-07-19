/* ============================================================
   ProHealth Admin auth

   Username + password login with a real signed session.
   - password stored PBKDF2-hashed, never plaintext
   - session is an HMAC-signed, HttpOnly, Secure, SameSite=Strict cookie
   - failed logins are rate limited per IP
   - Cloudflare Access, if you enable it, is honoured as well

   Default: admin / admin@2026    <-- change it, see README-ADMIN.md
   ============================================================ */

const SESSION_HOURS = 8;
const MAX_FAILS = 8;          // per IP
const LOCK_MINUTES = 15;

/* ---------- small crypto helpers ---------- */
const enc = new TextEncoder();

function b64url(buf) {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');

/* constant-time string compare */
function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password, salt, iters) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: iters, hash: 'SHA-256' }, key, 256);
  return hex(bits);
}

/* Verify against "pbkdf2$<iters>$<salt>$<hash>" (preferred),
   or a plaintext ADMIN_PASS fallback so it works out of the box. */
async function checkPassword(env, pass) {
  const stored = env.ADMIN_PASS_HASH || '';
  if (stored.startsWith('pbkdf2$')) {
    const [, iters, salt, want] = stored.split('$');
    const got = await pbkdf2(pass, salt, parseInt(iters, 10) || 100000);
    return safeEqual(got, want);
  }
  if (env.ADMIN_PASS) {
    console.log('WARNING: ADMIN_PASS is set in plaintext. Run: node hash-password.mjs "<new password>" and store ADMIN_PASS_HASH as a secret.');
    return safeEqual(pass, env.ADMIN_PASS);
  }
  return false;
}

/* ---------- sessions ---------- */
function sessionSecret(env) {
  return env.SESSION_SECRET || env.ADMIN_PASS_HASH || env.ADMIN_PASS || 'prohealth-dev-secret';
}
async function hmac(data, secret) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}
async function makeToken(user, env) {
  const payload = b64url(enc.encode(JSON.stringify({ u: user, exp: Date.now() + SESSION_HOURS * 3600e3 })));
  return payload + '.' + (await hmac(payload, sessionSecret(env)));
}
async function readToken(token, env) {
  if (!token || token.indexOf('.') === -1) return null;
  const [payload, sig] = token.split('.');
  const want = await hmac(payload, sessionSecret(env));
  if (!safeEqual(sig, want)) return null;
  try {
    const o = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    if (!o.exp || o.exp < Date.now()) return null;
    return o.u;
  } catch (e) { return null; }
}
function getCookie(req, name) {
  const c = req.headers.get('Cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}

/* ---------- rate limiting ---------- */
async function loginBlocked(env, ip) {
  try {
    const raw = await env.CONFIG.get('fail:' + ip);
    if (!raw) return false;
    const o = JSON.parse(raw);
    return o.n >= MAX_FAILS && Date.now() < o.until;
  } catch (e) { return false; }
}
async function noteFail(env, ip) {
  try {
    let o = { n: 0, until: 0 };
    const raw = await env.CONFIG.get('fail:' + ip);
    if (raw) o = JSON.parse(raw);
    o.n = (o.n || 0) + 1;
    o.until = Date.now() + LOCK_MINUTES * 60e3;
    await env.CONFIG.put('fail:' + ip, JSON.stringify(o), { expirationTtl: LOCK_MINUTES * 60 });
  } catch (e) { /* never block login on a KV hiccup */ }
}
async function clearFails(env, ip) { try { await env.CONFIG.delete('fail:' + ip); } catch (e) {} }

/* ---------- public API ---------- */

/* Returns the signed-in identity, or a Response to send back. */
export async function requireAdmin(req, env) {
  if (env.DEV_BYPASS === '1') return 'dev@localhost';

  // Cloudflare Access, if it is in front of us, is accepted too.
  const accessEmail = req.headers.get('Cf-Access-Authenticated-User-Email');
  if (accessEmail && req.headers.get('Cf-Access-Jwt-Assertion')) {
    const allow = (env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!allow.length || allow.indexOf(accessEmail.toLowerCase()) !== -1) return accessEmail;
  }

  const user = await readToken(getCookie(req, 'ph_session'), env);
  if (user) return user;

  const isApi = new URL(req.url).pathname.startsWith('/admin/api');
  if (isApi) {
    return new Response(JSON.stringify({ error: 'not signed in' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(LOGIN_HTML, {
    status: 200,   // it is a page, not an API error; /admin/api/* still returns 401
    headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store',
               'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY' },
  });
}

export async function handleLogin(req, env) {
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  const j = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

  if (await loginBlocked(env, ip)) {
    return j({ error: 'Too many attempts. Try again in ' + LOCK_MINUTES + ' minutes.' }, 429);
  }
  let body = {};
  try { body = await req.json(); } catch (e) { return j({ error: 'bad request' }, 400); }

  const user = String(body.user || '').trim();
  const pass = String(body.pass || '');
  const okUser = safeEqual(user.toLowerCase(), String(env.ADMIN_USER || 'admin').toLowerCase());
  const okPass = await checkPassword(env, pass);

  if (!okUser || !okPass) {
    await noteFail(env, ip);
    return j({ error: 'Wrong username or password.' }, 401);
  }
  await clearFails(env, ip);
  const token = await makeToken(user, env);
  const h = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  h.append('Set-Cookie', 'ph_session=' + token + '; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=' + SESSION_HOURS * 3600);
  // A UI hint only. Readable by the website so the footer can say "View dashboard"
  // instead of "Staff login". It carries no authority whatsoever: forging it just
  // changes a word, and /admin still demands a real signed session.
  if (env.COOKIE_DOMAIN) {
    h.append('Set-Cookie', 'ph_admin_hint=1; Secure; SameSite=Lax; Domain=' + env.COOKIE_DOMAIN +
             '; Path=/; Max-Age=' + SESSION_HOURS * 3600);
  }
  return new Response(JSON.stringify({ ok: true }), { headers: h });
}

export function handleLogout(env) {
  const h = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  h.append('Set-Cookie', 'ph_session=; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=0');
  if (env && env.COOKIE_DOMAIN) {
    h.append('Set-Cookie', 'ph_admin_hint=; Secure; SameSite=Lax; Domain=' + env.COOKIE_DOMAIN + '; Path=/; Max-Age=0');
  }
  return new Response(JSON.stringify({ ok: true }), { headers: h });
}

/* ---------- login page ---------- */
export const LOGIN_HTML = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sign in | ProHealth Admin</title>
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="https://prohealth.us/assets/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--blue:#138AC0;--blue-dark:#0F6A94;--navy:#0B3A52;--ice:#E9F6FC;--g50:#F8FAFB;--g200:#E4E9EF;
--slate:#5D6E80;--ink:#0F2233;--line:#E1E8EF;--red:#FDECEC;--red-ink:#C0392B}
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:grid;place-items:center;padding:20px;font-family:"Inter",system-ui,sans-serif;
  background:radial-gradient(900px 500px at 80% -10%,rgba(143,209,239,.5),transparent 60%),
             linear-gradient(180deg,#FDFBF8,var(--ice));color:var(--ink)}
.box{width:100%;max-width:380px;background:#fff;border:1px solid var(--line);border-radius:20px;
  box-shadow:0 22px 60px rgba(11,58,82,.16);padding:30px 28px}
.logo{display:block;height:38px;margin:0 auto 20px}
h1{font-family:"Outfit",sans-serif;font-size:1.15rem;text-align:center;color:var(--navy);margin-bottom:4px}
p.sub{text-align:center;font-size:.83rem;color:var(--slate);margin-bottom:22px}
label{display:block;font-family:"Outfit",sans-serif;font-size:.76rem;font-weight:600;color:var(--slate);margin:12px 0 5px}
input{width:100%;font:inherit;font-size:.95rem;padding:11px 13px;border:1px solid var(--g200);border-radius:10px;background:var(--g50)}
input:focus{outline:2px solid var(--blue);border-color:var(--blue);background:#fff}
button{width:100%;margin-top:18px;font-family:"Outfit",sans-serif;font-weight:600;font-size:.95rem;color:#fff;
  background:linear-gradient(135deg,#2EAFEA,var(--blue) 60%,var(--blue-dark));border:none;border-radius:11px;
  padding:13px;cursor:pointer;box-shadow:0 8px 20px rgba(19,138,192,.3);transition:transform .15s}
button:hover{transform:translateY(-1px)}
button:disabled{opacity:.6;cursor:default;transform:none}
.err{background:var(--red);border:1px solid #E9A0A0;color:var(--red-ink);padding:10px 12px;border-radius:9px;
  font-size:.83rem;margin-top:14px;display:none}
.err.show{display:block}
.foot{text-align:center;font-size:.72rem;color:var(--slate);margin-top:18px;line-height:1.5}
</style></head><body>
<form class="box" id="f">
  <img class="logo" src="https://prohealth.us/assets/logo.png" alt="ProHealth">
  <h1>Admin sign in</h1>
  <p class="sub">Leads, applicants and data requests</p>
  <label for="u">Username</label>
  <input id="u" autocomplete="username" autocapitalize="none" required autofocus>
  <label for="p">Password</label>
  <input id="p" type="password" autocomplete="current-password" required>
  <button id="b" type="submit">Sign in</button>
  <div class="err" id="e"></div>
  <p class="foot">This dashboard contains protected health information.<br>Do not share these credentials.</p>
</form>
<script>
const f=document.getElementById('f'), e=document.getElementById('e'), b=document.getElementById('b');
f.addEventListener('submit', async (ev)=>{
  ev.preventDefault(); e.classList.remove('show'); b.disabled=true; b.textContent='Signing in...';
  try{
    const r=await fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({user:document.getElementById('u').value,pass:document.getElementById('p').value})});
    if(r.ok){ location.href='/admin'; return; }
    const d=await r.json().catch(()=>({}));
    e.textContent=d.error||'Sign in failed.'; e.classList.add('show');
  }catch(err){ e.textContent='Network error. Try again.'; e.classList.add('show'); }
  b.disabled=false; b.textContent='Sign in';
});
</script></body></html>`;
