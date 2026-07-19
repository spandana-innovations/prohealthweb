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
const MAX_FAILS = 3;          // per IP — lock after this many failed logins
const LOCK_MINUTES = 60;      // ...for this long (1 hour)

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

/* ============================================================
   Additional admins (email + password), stored in KV.

   - Only @prohealth.us addresses may be added.
   - daniel@prohealth.us is the hard-coded owner (super-admin) and can never
     be removed. The built-in ADMIN_USER ("admin") is a super-admin too.
   - Super-admins manage the roster; everyone signs in with email + password
     and can reset their own password by email.
   ============================================================ */
export const ADMIN_DOMAIN = 'prohealth.us';
export const SUPER_EMAILS = ['daniel@prohealth.us'];

export function isProhealthEmail(email) {
  return /^[^@\s]+@prohealth\.us$/i.test(String(email || '').trim());
}
export function isSuper(who, env) {
  const w = String(who || '').toLowerCase();
  if (w === String((env && env.ADMIN_USER) || 'admin').toLowerCase()) return true;
  return SUPER_EMAILS.indexOf(w) !== -1;
}

export async function hashPassword(pass, iters = 100000) {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  return 'pbkdf2$' + iters + '$' + salt + '$' + (await pbkdf2(pass, salt, iters));
}
export async function verifyPassword(stored, pass) {
  if (!stored || stored.indexOf('pbkdf2$') !== 0) return false;
  const [, iters, salt, want] = stored.split('$');
  const got = await pbkdf2(pass, salt, parseInt(iters, 10) || 100000);
  return safeEqual(got, want);
}

/* ---------- admin roster (KV key "admins") ---------- */
export async function getAdmins(env) {
  try { const a = JSON.parse((await env.CONFIG.get('admins')) || '[]'); return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
async function saveAdmins(env, list) { await env.CONFIG.put('admins', JSON.stringify(list)); }
export async function getAdmin(env, email) {
  email = String(email || '').toLowerCase();
  return (await getAdmins(env)).find((a) => a.email === email) || null;
}
export async function upsertAdmin(env, obj) {
  const list = await getAdmins(env);
  const email = String(obj.email || '').toLowerCase();
  const i = list.findIndex((a) => a.email === email);
  if (i >= 0) list[i] = { ...list[i], ...obj, email };
  else list.push({ email, createdAt: new Date().toISOString(), ...obj });
  await saveAdmins(env, list);
  return list;
}
export async function removeAdmin(env, email) {
  email = String(email || '').toLowerCase();
  const list = (await getAdmins(env)).filter((a) => a.email !== email);
  await saveAdmins(env, list);
  return list;
}
export async function setAdminPassword(env, email, pass) {
  const passHash = await hashPassword(pass);
  await upsertAdmin(env, { email: String(email).toLowerCase(), passHash, pending: false });
}

/* ---------- one-time reset / set-password tokens (KV, 1h TTL) ---------- */
export async function createResetToken(env, email) {
  const token = hex(crypto.getRandomValues(new Uint8Array(24)));
  await env.CONFIG.put('reset:' + token,
    JSON.stringify({ email: String(email).toLowerCase(), exp: Date.now() + 3600e3 }),
    { expirationTtl: 3600 });
  return token;
}
export async function readResetToken(env, token) {
  if (!token) return null;
  try {
    const o = JSON.parse((await env.CONFIG.get('reset:' + token)) || 'null');
    if (!o || !o.exp || o.exp < Date.now()) return null;
    return o.email;
  } catch (e) { return null; }
}
export async function deleteResetToken(env, token) { try { await env.CONFIG.delete('reset:' + token); } catch (e) {} }

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
    return j({ error: 'Too many failed attempts. This device is locked for 1 hour.' }, 429);
  }
  let body = {};
  try { body = await req.json(); } catch (e) { return j({ error: 'bad request' }, 400); }

  // Slide-to-verify captcha. The login page only submits after the slider is
  // completed; this rejects naive scripted posts that skip the UI. It is a
  // speed bump, not strong bot protection — the per-IP lockout above is.
  if (String(body.captcha || '') !== 'swiped') {
    return j({ error: 'Please complete the slide-to-verify check.' }, 400);
  }

  const user = String(body.user || '').trim();
  const pass = String(body.pass || '');

  // Two ways in: the built-in ADMIN_USER (username + ADMIN_PASS_HASH), or an
  // added @prohealth.us admin (email + password stored in the KV roster).
  let identity = null;
  if (user.indexOf('@') === -1) {
    if (safeEqual(user.toLowerCase(), String(env.ADMIN_USER || 'admin').toLowerCase()) && await checkPassword(env, pass)) {
      identity = String(env.ADMIN_USER || 'admin');
    }
  } else {
    const a = await getAdmin(env, user.toLowerCase());
    if (a && !a.disabled && a.passHash && await verifyPassword(a.passHash, pass)) {
      identity = user.toLowerCase();
    }
  }

  if (!identity) {
    await noteFail(env, ip);
    return j({ error: 'Wrong username or password.' }, 401);
  }
  await clearFails(env, ip);
  const token = await makeToken(identity, env);
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
.ok{background:#E9F8F0;border:1px solid #A9DEC4;color:#2F7A63;padding:10px 12px;border-radius:9px;
  font-size:.83rem;margin-top:14px;display:none}
.ok.show{display:block}
.forgot{text-align:center;margin-top:14px}
.forgot a{font-family:"Outfit",sans-serif;font-size:.78rem;color:var(--blue-dark);text-decoration:none}
.forgot a:hover{text-decoration:underline}
.fpbox{display:none;margin-top:10px;padding-top:12px;border-top:1px solid var(--line)}
.fpbox.show{display:block}
.fpbox button{box-shadow:none;background:var(--slate);margin-top:10px}
.foot{text-align:center;font-size:.72rem;color:var(--slate);margin-top:18px;line-height:1.5}
.swipe{position:relative;height:46px;margin-top:6px;border-radius:11px;background:var(--g50);
  border:1px solid var(--g200);overflow:hidden;user-select:none;touch-action:none}
.swipe-fill{position:absolute;top:0;left:0;bottom:0;width:0;background:linear-gradient(135deg,#2EAFEA,var(--blue));border-radius:11px}
.swipe-text{position:absolute;inset:0;display:grid;place-items:center;font-size:.8rem;font-weight:500;color:var(--slate);pointer-events:none}
.swipe-handle{position:absolute;top:3px;left:3px;width:40px;height:38px;border-radius:8px;background:#fff;
  box-shadow:0 2px 8px rgba(11,58,82,.25);display:grid;place-items:center;cursor:grab;font-size:1.35rem;line-height:1;color:var(--blue);font-weight:700}
.swipe-handle:active{cursor:grabbing}
.swipe.done .swipe-text{color:#fff}
.swipe.done .swipe-handle{color:#fff;background:transparent;box-shadow:none;cursor:default}
</style></head><body>
<form class="box" id="f">
  <img class="logo" src="https://prohealth.us/assets/logo.png" alt="ProHealth">
  <h1>Admin sign in</h1>
  <p class="sub">Leads, applicants and data requests</p>
  <label for="u">Username or email</label>
  <input id="u" autocomplete="username" autocapitalize="none" required autofocus>
  <label for="p">Password</label>
  <input id="p" type="password" autocomplete="current-password" required>
  <label for="sw">Verify</label>
  <div class="swipe" id="sw">
    <div class="swipe-fill" id="swfill"></div>
    <div class="swipe-text" id="swtext">Slide to verify &rarr;</div>
    <div class="swipe-handle" id="swh" role="slider" aria-label="Slide to verify" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">&#8250;</div>
  </div>
  <button id="b" type="submit" disabled>Sign in</button>
  <div class="err" id="e"></div>
  <div class="ok" id="ok"></div>
  <div class="forgot"><a href="#" id="fpl">Forgot password?</a></div>
  <div id="fpbox" class="fpbox">
    <label for="fpe">Your @prohealth.us email</label>
    <input id="fpe" type="email" autocomplete="email" autocapitalize="none" placeholder="you@prohealth.us">
    <button id="fpb" type="button">Email me a reset link</button>
  </div>
  <p class="foot">This dashboard contains protected health information.<br>Do not share these credentials.</p>
</form>
<script>
const f=document.getElementById('f'), e=document.getElementById('e'), b=document.getElementById('b');

/* ---------- slide-to-verify captcha ---------- */
let captchaOK=false;
(function(){
  const sw=document.getElementById('sw'), h=document.getElementById('swh'),
        fill=document.getElementById('swfill'), txt=document.getElementById('swtext');
  let dragging=false, grab=0;
  const room=()=> sw.clientWidth - h.offsetWidth - 6;       // px of travel
  function paint(x){ x=Math.max(0,Math.min(x,room())); h.style.transform='translateX('+x+'px)';
    fill.style.width=(x+h.offsetWidth+3)+'px'; h.setAttribute('aria-valuenow',Math.round(x/room()*100)||0); return x; }
  function verify(){ if(captchaOK)return; captchaOK=true; dragging=false; sw.classList.add('done');
    paint(room()); txt.textContent='Verified ✓'; h.textContent='✓'; h.setAttribute('aria-valuenow',100);
    b.disabled=false; }
  h.addEventListener('pointerdown',(ev)=>{ if(captchaOK)return; dragging=true;
    grab=ev.clientX - h.getBoundingClientRect().left; try{h.setPointerCapture(ev.pointerId);}catch(_){}} );
  h.addEventListener('pointermove',(ev)=>{ if(!dragging||captchaOK)return;
    const x=paint(ev.clientX - sw.getBoundingClientRect().left - grab); if(x>=room()-2) verify(); });
  const release=()=>{ if(captchaOK||!dragging)return; dragging=false; paint(0); };  // snap back if incomplete
  h.addEventListener('pointerup',release); h.addEventListener('pointercancel',release);
  h.addEventListener('keydown',(ev)=>{ if(captchaOK)return;
    if(ev.key==='Enter'||ev.key===' '||ev.key==='ArrowRight'){ ev.preventDefault(); verify(); } });
})();

f.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  if(!captchaOK){ e.textContent='Slide to verify first.'; e.classList.add('show'); return; }
  e.classList.remove('show'); b.disabled=true; b.textContent='Signing in...';
  try{
    const r=await fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({user:document.getElementById('u').value,pass:document.getElementById('p').value,
        captcha:captchaOK?'swiped':''})});
    if(r.ok){ location.href='/admin'; return; }
    const d=await r.json().catch(()=>({}));
    e.textContent=d.error||'Sign in failed.'; e.classList.add('show');
  }catch(err){ e.textContent='Network error. Try again.'; e.classList.add('show'); }
  b.disabled=false; b.textContent='Sign in';
});

/* ---------- forgot password ---------- */
const ok=document.getElementById('ok'), fpl=document.getElementById('fpl'),
      fpbox=document.getElementById('fpbox'), fpb=document.getElementById('fpb'), fpe=document.getElementById('fpe');
fpl.addEventListener('click',(ev)=>{ ev.preventDefault(); fpbox.classList.toggle('show'); if(fpbox.classList.contains('show')) fpe.focus(); });
fpb.addEventListener('click', async ()=>{
  e.classList.remove('show'); ok.classList.remove('show'); fpb.disabled=true; fpb.textContent='Sending...';
  try{
    await fetch('/admin/forgot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:fpe.value})});
    ok.textContent='If that address is an admin, a reset link is on its way. Check your inbox.'; ok.classList.add('show'); fpbox.classList.remove('show');
  }catch(err){ e.textContent='Network error. Try again.'; e.classList.add('show'); }
  fpb.disabled=false; fpb.textContent='Email me a reset link';
});
</script></body></html>`;

/* ============================================================
   Set / reset password page (served at GET /admin/reset?token=...)
   The token is read from the URL by the page script and posted back with the
   new password to POST /admin/reset.
   ============================================================ */
export const RESET_HTML = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Set your password | ProHealth Admin</title>
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
  padding:13px;cursor:pointer;box-shadow:0 8px 20px rgba(19,138,192,.3)}
button:disabled{opacity:.6;cursor:default}
.err{background:var(--red);border:1px solid #E9A0A0;color:var(--red-ink);padding:10px 12px;border-radius:9px;font-size:.83rem;margin-top:14px;display:none}
.err.show{display:block}
.ok{background:#E9F8F0;border:1px solid #A9DEC4;color:#2F7A63;padding:12px;border-radius:9px;font-size:.86rem;margin-top:14px;display:none;text-align:center}
.ok.show{display:block}
.hint{font-size:.72rem;color:var(--slate);margin-top:6px}
</style></head><body>
<form class="box" id="f">
  <img class="logo" src="https://prohealth.us/assets/logo.png" alt="ProHealth">
  <h1>Set your password</h1>
  <p class="sub">Choose a password for your ProHealth admin account</p>
  <label for="p1">New password</label>
  <input id="p1" type="password" autocomplete="new-password" required>
  <p class="hint">At least 10 characters.</p>
  <label for="p2">Confirm password</label>
  <input id="p2" type="password" autocomplete="new-password" required>
  <button id="b" type="submit">Save password</button>
  <div class="err" id="e"></div>
  <div class="ok" id="ok"></div>
</form>
<script>
const q=new URLSearchParams(location.search), token=q.get('token')||'';
const f=document.getElementById('f'), e=document.getElementById('e'), ok=document.getElementById('ok'), b=document.getElementById('b');
if(!token){ e.textContent='This link is missing its token. Request a new one from the sign-in page.'; e.classList.add('show'); b.disabled=true; }
f.addEventListener('submit', async (ev)=>{
  ev.preventDefault(); e.classList.remove('show');
  const p1=document.getElementById('p1').value, p2=document.getElementById('p2').value;
  if(p1.length<10){ e.textContent='Password must be at least 10 characters.'; e.classList.add('show'); return; }
  if(p1!==p2){ e.textContent='The two passwords do not match.'; e.classList.add('show'); return; }
  b.disabled=true; b.textContent='Saving...';
  try{
    const r=await fetch('/admin/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token,password:p1})});
    if(r.ok){ f.querySelectorAll('input,button,label,.hint').forEach(el=>el.style.display='none');
      ok.innerHTML='Password saved. <a href="/admin">Sign in &rarr;</a>'; ok.classList.add('show'); return; }
    const d=await r.json().catch(()=>({})); e.textContent=d.error||'Could not save.'; e.classList.add('show');
  }catch(err){ e.textContent='Network error. Try again.'; e.classList.add('show'); }
  b.disabled=false; b.textContent='Save password';
});
</script></body></html>`;
