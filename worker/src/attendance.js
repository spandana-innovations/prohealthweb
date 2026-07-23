/* ============================================================
   ProHealth Attendance  —  NFC / QR clock-in + clock-out

   Attaches to the existing ProHealth Worker (D1 + KV + R2 + auth).
   Employees and superadmins use the attendance PWA (separate repo,
   prohealthattendance); the PWA talks to these endpoints with a
   Bearer token issued by POST /attend/login.

   PUBLIC-ish (Bearer token = a signed-in employee)
     POST /attend/login        {email, password}            -> {token, role, ...}
     GET  /attend/me                                         -> identity + open shift
     POST /attend/punch         nfc: instant | qr: selfie(+gps if fishy)
     POST /attend/logout        (client just drops the token)
     GET  /attend/setpw?token=  set-password page (provisioned employees)
     POST /attend/setpw         {token, password}

   SUPERADMIN (Bearer token whose role is "super")
     GET/POST/DELETE /attend/admin/locations[/:id]
     GET/POST/DELETE /attend/admin/employees[/:email]
     GET  /attend/admin/overview
     GET  /attend/admin/punches
     GET  /attend/admin/selfie?key=
     POST /attend/admin/punch   manual add / correction (the override)

   The failsafe, in one place:
     - NFC is a *proximity* proof. You must physically hold the phone to
       the wall tag, so tapping it is instant: valid tag key -> punch.
     - QR can be photographed and shared, so the QR path always takes a
       selfie, and additionally demands a passing GPS geofence whenever the
       punch looks "fishy" (new device, wrong office, odd hour, rapid re-tap).
     - The server always stamps the time (the client clock is never trusted),
       enforces one open punch at a time, and computes + sanity-checks the
       hours at clock-out. A nightly job auto-closes forgotten punches.
   ============================================================ */

import {
  hashPassword, verifyPassword, isSuper, getAdmin,
} from './auth.js';

/* ---------------- tunables ---------------- */
export const ATT = {
  TZ: 'America/Los_Angeles',   // offices are all California
  MAX_SHIFT_HOURS: 16,         // longer than this at clock-out => flagged
  DEFAULT_RADIUS_M: 150,       // geofence radius when a location doesn't set one
  MIN_TOGGLE_SECONDS: 90,      // two punches closer than this look like a fat-finger
  DAY_START_HOUR: 5,           // punches outside [5:00, 22:00) local look odd
  DAY_END_HOUR: 22,
  SELFIE_MAX_BYTES: 3 * 1024 * 1024,
  SESSION_HOURS: 12,
  SELFIE_PREFIX: 'att/selfies/',
  GOAL_HOURS: 8,               // the ring on the employee screen fills toward this
};

/* ---------------- tiny crypto (self-contained; mirrors auth.js) ---------------- */
const enc = new TextEncoder();
function b64url(buf) {
  const b = new Uint8Array(buf); let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
function sessionSecret(env) {
  return env.SESSION_SECRET || env.ADMIN_PASS_HASH || env.ADMIN_PASS || 'prohealth-dev-secret';
}
async function hmac(data, secret) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}
// Attendance bearer token: "<payload>.<sig>". Audience "att" so it can never
// be mistaken for (or reused as) an /admin dashboard session.
async function makeToken(env, sub, role) {
  const payload = b64url(enc.encode(JSON.stringify({ aud: 'att', sub, r: role, exp: Date.now() + ATT.SESSION_HOURS * 3600e3 })));
  return payload + '.' + (await hmac(payload, sessionSecret(env)));
}
async function readToken(env, token) {
  if (!token || token.indexOf('.') === -1) return null;
  const [payload, sig] = token.split('.');
  if (!safeEqual(sig, await hmac(payload, sessionSecret(env)))) return null;
  try {
    const o = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    if (o.aud !== 'att' || !o.exp || o.exp < Date.now()) return null;
    return { sub: o.sub, role: o.r };
  } catch (e) { return null; }
}

/* ---------------- Google Sign-In (ID token verification) ----------------
   The employee app uses "Sign in with Google" (Google Identity Services). The
   browser hands us a signed ID token (a JWT); we verify it here against
   Google's public keys, then check it's a @prohealth.us account. No password. */

// Google's signing keys, cached in KV for an hour.
async function googleKeys(env) {
  try { const c = await env.CONFIG.get('google_jwks'); if (c) return JSON.parse(c); } catch (e) {}
  const r = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  const j = await r.json();
  try { await env.CONFIG.put('google_jwks', JSON.stringify(j), { expirationTtl: 3600 }); } catch (e) {}
  return j;
}

// Pure claim checks — split out so they're unit-testable without a real token.
export function googleClaimsValid(p, clientId, nowMs) {
  if (!p || !clientId) return false;
  if (p.iss !== 'accounts.google.com' && p.iss !== 'https://accounts.google.com') return false;
  if (p.aud !== clientId) return false;
  if (!p.exp || p.exp * 1000 < nowMs) return false;
  if (!p.email || p.email_verified === false) return false;
  return true;
}

async function verifyGoogleIdToken(env, idToken) {
  if (!env.GOOGLE_CLIENT_ID) return null;
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) return null;
  let header, payload;
  try {
    header = JSON.parse(new TextDecoder().decode(unb64url(parts[0])));
    payload = JSON.parse(new TextDecoder().decode(unb64url(parts[1])));
  } catch (e) { return null; }
  if (header.alg !== 'RS256') return null;
  const keys = await googleKeys(env);
  const jwk = ((keys && keys.keys) || []).find((k) => k.kid === header.kid);
  if (!jwk) return null;
  try {
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, unb64url(parts[2]), enc.encode(parts[0] + '.' + parts[1]));
    if (!ok) return null;
  } catch (e) { return null; }
  if (!googleClaimsValid(payload, env.GOOGLE_CLIENT_ID, Date.now())) return null;
  return payload;
}

/* ---------------- helpers ---------------- */
const json = (o, cors = {}, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors } });
const clean = (s, max = 400) => String(s ?? '').slice(0, max).trim();
const lc = (s) => String(s || '').trim().toLowerCase();
const newKey = () => hex(crypto.getRandomValues(new Uint8Array(16)));
const uuid = () => crypto.randomUUID();

// Great-circle distance in metres.
export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLng = (lng2 - lng1) * toR;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
// Hour-of-day (0-23) at a given instant in the office timezone.
export function hourInTz(date, tz = ATT.TZ) {
  try {
    const h = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(date);
    const n = parseInt(h, 10);
    return n === 24 ? 0 : n;   // some ICU builds render midnight as 24
  } catch (e) { return date.getUTCHours(); }
}
// D1's datetime('now') is "YYYY-MM-DD HH:MM:SS" in UTC. Turn it into a real
// Date (the space form + a bare "Z" is not reliably parsed by V8).
export function parseDbTime(s) {
  if (!s) return null;
  const d = new Date(String(s).replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}
export function fmtHours(h) {
  const total = Math.max(0, Math.round(h * 60));
  return Math.floor(total / 60) + 'h ' + String(total % 60).padStart(2, '0') + 'm';
}

// 'HH:MM' -> minutes since midnight (null if unparseable).
export function hhmmToMin(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const h = +m[1], mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}
// Length of a shift in hours (handles overnight shifts that cross midnight).
export function shiftHours(shift) {
  if (!shift) return null;
  const a = hhmmToMin(shift.start), b = hhmmToMin(shift.end);
  if (a == null || b == null) return null;
  let mins = b - a; if (mins <= 0) mins += 24 * 60;   // overnight
  return Math.round((mins / 60) * 100) / 100;
}

// Parse the attendance holidays text ("YYYY-MM-DD = Label" per line) — same
// format as the website's closures, but a separate list for a separate purpose.
export function parseHolidays(text) {
  const out = [];
  for (const line of String(text || '').split('\n')) {
    const m = /^\s*(\d{4}-\d{2}-\d{2})\s*(?:=\s*(.*))?$/.exec(line);
    if (m) out.push({ date: m[1], label: (m[2] || '').trim() });
  }
  return out;
}

// Roll up a month of punches into a per-employee summary. Pure + testable.
// punches: rows with {email, kind, hours, created_at, flagged}. Returns rows
// sorted by name/email.
export function summarizeMonth(punches, nameByEmail) {
  const by = {};
  for (const p of (punches || [])) {
    const e = p.email || '';
    const r = by[e] || (by[e] = { email: e, name: (nameByEmail && nameByEmail[e]) || e, hours: 0, days: {}, sessions: 0, flagged: 0 });
    const day = String(p.created_at || '').slice(0, 10);
    if (p.kind === 'out') { r.hours += Number(p.hours) || 0; r.sessions += 1; if (day) r.days[day] = 1; }
    if (p.kind === 'in' && day) r.days[day] = 1;
    if (p.flagged) r.flagged += 1;
  }
  return Object.values(by).map((r) => ({
    email: r.email, name: r.name,
    hours: Math.round(r.hours * 100) / 100,
    daysWorked: Object.keys(r.days).length,
    sessions: r.sessions, flagged: r.flagged,
  })).sort((a, b) => String(a.name).localeCompare(b.name));
}

/* Decide whether a QR punch is suspicious enough to demand a GPS geofence.
   Pure function so it is easy to unit-test. Returns an array of reasons
   (empty => not fishy). */
export function fishyReasons(now, ctx) {
  const r = [];
  if (!ctx.knownDevice) r.push('new device');
  if (ctx.assignedOffice && ctx.locId && ctx.locId !== ctx.assignedOffice) r.push('not your assigned office');
  const h = hourInTz(now, ctx.tz || ATT.TZ);
  if (h < ATT.DAY_START_HOUR || h >= ATT.DAY_END_HOUR) r.push('outside normal hours');
  if (ctx.secondsSinceLast != null && ctx.secondsSinceLast >= 0 && ctx.secondsSinceLast < ATT.MIN_TOGGLE_SECONDS) r.push('too soon after last punch');
  return r;
}

/* ---------------- data access ---------------- */
async function getLocation(env, id) {
  if (!id) return null;
  const r = await env.DB.prepare('SELECT * FROM att_locations WHERE id = ?').bind(id).all();
  return (r.results || [])[0] || null;
}
async function listLocations(env) {
  const r = await env.DB.prepare('SELECT * FROM att_locations ORDER BY name').all();
  return r.results || [];
}
async function getEmployeeByEmail(env, email) {
  const r = await env.DB.prepare('SELECT * FROM att_employees WHERE email = ?').bind(lc(email)).all();
  return (r.results || [])[0] || null;
}
async function getShift(env, id) {
  if (!id) return null;
  const r = await env.DB.prepare('SELECT * FROM att_shifts WHERE id = ?').bind(id).all();
  return (r.results || [])[0] || null;
}
async function listShifts(env) {
  const r = await env.DB.prepare('SELECT * FROM att_shifts ORDER BY start, name').all();
  return r.results || [];
}
async function lastPunch(env, employeeId) {
  const r = await env.DB.prepare('SELECT * FROM att_punches WHERE employee_id = ? ORDER BY created_at DESC LIMIT 1').bind(employeeId).all();
  return (r.results || [])[0] || null;
}
// True if this (employee, device) pairing has punched before.
async function deviceSeen(env, employeeId, deviceId) {
  if (!deviceId) return false;
  const r = await env.DB.prepare('SELECT id FROM att_punches WHERE employee_id = ? AND device_id = ? LIMIT 1').bind(employeeId, deviceId).all();
  return (r.results || []).length > 0;
}
async function audit(env, who, action, target, detail) {
  try {
    await env.DB.prepare('INSERT INTO audit_log (id, actor, action, target, detail, created_at) ' +
      "VALUES (?, ?, ?, ?, ?, datetime('now'))").bind(uuid(), who, action, target, detail).run();
  } catch (e) { console.log('att audit failed', e.message); }
}

/* one-time set-password tokens for provisioned employees (KV, 1h) */
async function createEmpToken(env, email) {
  const token = hex(crypto.getRandomValues(new Uint8Array(24)));
  await env.CONFIG.put('eset:' + token, JSON.stringify({ email: lc(email), exp: Date.now() + 3600e3 }), { expirationTtl: 3600 });
  return token;
}
async function readEmpToken(env, token) {
  if (!token) return null;
  try { const o = JSON.parse((await env.CONFIG.get('eset:' + token)) || 'null'); return o && o.exp > Date.now() ? o.email : null; }
  catch (e) { return null; }
}

/* ---------------- auth guard ---------------- */
function bearer(req) {
  const h = req.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
// Returns { sub, role, emp } or a Response (401/403). requireSuper gates admin.
async function requireEmployee(req, env, cors, opts = {}) {
  const t = await readToken(env, bearer(req));
  if (!t) return json({ error: 'Please sign in again.' }, cors, 401);
  if (opts.super && t.role !== 'super') return json({ error: 'Superadmins only.' }, cors, 403);
  let emp = null;
  if (t.role !== 'super') {
    emp = await getEmployeeByEmail(env, t.sub);
    if (!emp || !emp.active) return json({ error: 'This account is not active.' }, cors, 403);
  }
  return { sub: t.sub, role: t.role, emp };
}

/* ============================================================
   Router. index.js calls attendanceRoute for any /attend/* path.
   Returns a Response, or null if the path is not ours.
   ============================================================ */
export async function attendanceRoute(req, env, url, cors) {
  const p = url.pathname;
  if (p === '/attend/login' && req.method === 'POST') return handleLogin(req, env, cors);
  if (p === '/attend/google' && req.method === 'POST') return handleGoogle(req, env, cors);
  if (p === '/attend/logout') return json({ ok: true }, cors);
  if (p === '/attend/setpw') return handleSetPw(req, env, cors);
  if (p === '/attend/me' && req.method === 'GET') return handleMe(req, env, cors);
  if (p === '/attend/punch' && req.method === 'POST') return handlePunch(req, env, cors);
  if (p.startsWith('/attend/admin/')) return adminRoute(req, env, url, cors);
  return json({ error: 'not found' }, cors, 404);
}

/* ---------------- POST /attend/login ---------------- */
async function handleLogin(req, env, cors) {
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  if (await tooMany(env, ip, 'attlogin', 12, 900)) return json({ error: 'Too many attempts. Wait a few minutes.' }, cors, 429);
  let b = {}; try { b = await req.json(); } catch (e) { return json({ error: 'bad request' }, cors, 400); }
  const email = lc(b.email), pass = String(b.password || '');
  if (!email || !pass) return json({ error: 'Email and password are required.' }, cors, 400);

  let role = null;
  if (isSuper(email, env)) {
    // A superadmin signs in with the same @prohealth.us email + password they
    // use for the website dashboard. Their hash lives in the admin roster (KV).
    const a = await getAdmin(env, email);
    if (a && a.passHash && await verifyPassword(a.passHash, pass)) role = 'super';
  }
  if (!role) {
    const emp = await getEmployeeByEmail(env, email);
    if (emp && emp.active && emp.pass_hash && await verifyPassword(emp.pass_hash, pass)) role = 'employee';
  }
  if (!role) return json({ error: 'Wrong email or password.' }, cors, 401);

  const token = await makeToken(env, email, role);
  await audit(env, email, 'attendance sign-in', role, '');
  const me = await meFor(env, email, role);
  return json({ ok: true, token, ...me }, cors);
}

/* ---------------- POST /attend/google ----------------
   Verify a Google ID token, then sign the person in. Superadmins pass straight
   through (identified by email); everyone else with a @prohealth.us Google
   account is an employee — auto-provisioned on first sign-in, unless an admin
   has deactivated them. We capture their name + Google photo each time. */
async function handleGoogle(req, env, cors) {
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  if (await tooMany(env, ip, 'attlogin', 20, 900)) return json({ error: 'Too many attempts. Wait a few minutes.' }, cors, 429);
  if (!env.GOOGLE_CLIENT_ID) return json({ error: 'Google sign-in is not configured yet.' }, cors, 501);
  let b = {}; try { b = await req.json(); } catch (e) { return json({ error: 'bad request' }, cors, 400); }
  const payload = await verifyGoogleIdToken(env, b.idToken);
  if (!payload) return json({ error: 'Google sign-in failed. Please try again.' }, cors, 401);

  const email = lc(payload.email);
  if (!/^[^@\s]+@prohealth\.us$/.test(email) && payload.hd !== 'prohealth.us') {
    return json({ error: 'Please use your @prohealth.us Google account.' }, cors, 403);
  }
  const name = clean(payload.name, 80) || email.split('@')[0];
  const picture = clean(payload.picture, 400);

  let role;
  if (isSuper(email, env)) {
    role = 'super';
  } else {
    const emp = await getEmployeeByEmail(env, email);
    if (emp && !emp.active) return json({ error: 'This account is inactive. Please contact your office.' }, cors, 403);
    if (!emp) {
      await env.DB.prepare(
        "INSERT INTO att_employees (id, email, name, pass_hash, picture, assigned_office, active, created_at, created_by) " +
        "VALUES (?, ?, ?, '', ?, '', 1, datetime('now'), 'google')"
      ).bind(uuid(), email, name, picture).run();
    } else {
      await env.DB.prepare('UPDATE att_employees SET name = ?, picture = ? WHERE id = ?').bind(name, picture, emp.id).run();
    }
    role = 'employee';
  }
  const token = await makeToken(env, email, role);
  await audit(env, email, 'attendance sign-in (google)', role, '');
  return json({ ok: true, token, ...(await meFor(env, email, role)) }, cors);
}

// Completed hours clocked today (office timezone), not counting an open shift.
async function todayHours(env, employeeId) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: ATT.TZ, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(now);
  const g = (t) => parseInt((parts.find((x) => x.type === t) || {}).value || '0', 10);
  let h = g('hour'); if (h === 24) h = 0;
  const secsSinceLocalMidnight = h * 3600 + g('minute') * 60 + g('second');
  const startIso = new Date(now.getTime() - secsSinceLocalMidnight * 1000).toISOString().replace('T', ' ').slice(0, 19);
  const r = await env.DB.prepare("SELECT hours FROM att_punches WHERE employee_id = ? AND kind = 'out' AND created_at >= ?").bind(employeeId, startIso).all();
  let sum = 0; for (const row of (r.results || [])) sum += Number(row.hours) || 0;
  return Math.round(sum * 100) / 100;
}

/* ---------------- GET /attend/me ---------------- */
async function handleMe(req, env, cors) {
  const who = await requireEmployee(req, env, cors);
  if (who instanceof Response) return who;
  return json(await meFor(env, who.sub, who.role, who.emp), cors);
}
async function meFor(env, email, role, emp) {
  const offices = (await listLocations(env)).filter((l) => l.active).map((l) => ({ id: l.id, name: l.name }));
  if (role === 'super') return { role, email, name: 'Superadmin', assignedOffice: null, open: null, offices, picture: null, todayHours: 0, goalHours: ATT.GOAL_HOURS };
  emp = emp || await getEmployeeByEmail(env, email);
  let open = null;
  if (emp) {
    const lp = await lastPunch(env, emp.id);
    if (lp && lp.kind === 'in') {
      const loc = await getLocation(env, lp.loc_id);
      open = { punchId: lp.id, locId: lp.loc_id, locName: (loc && loc.name) || lp.loc_name || lp.loc_id, since: lp.created_at };
    }
  }
  let shift = null, goal = ATT.GOAL_HOURS;
  if (emp && emp.shift_id) {
    const s = await getShift(env, emp.shift_id);
    if (s) { shift = { id: s.id, name: s.name, start: s.start, end: s.end, days: s.days }; const sh = shiftHours(s); if (sh) goal = sh; }
  }
  return {
    role, email, name: (emp && emp.name) || email,
    assignedOffice: emp ? emp.assigned_office : null, open, offices,
    picture: emp ? (emp.picture || null) : null,
    todayHours: emp ? await todayHours(env, emp.id) : 0,
    goalHours: goal, shift,
  };
}

/* ---------------- POST /attend/punch ---------------- */
async function handlePunch(req, env, cors) {
  const who = await requireEmployee(req, env, cors);
  if (who instanceof Response) return who;
  if (who.role === 'super') return json({ error: 'Superadmins manage the system but do not clock in.' }, cors, 400);
  const emp = who.emp;

  // Accept multipart (with a selfie) or plain JSON (NFC, no selfie).
  const ctype = req.headers.get('Content-Type') || '';
  let f = {}, selfie = null;
  if (ctype.includes('multipart/form-data')) {
    const form = await req.formData();
    for (const k of ['loc', 'k', 'method', 'deviceId', 'kind', 'lat', 'lng', 'accuracy']) f[k] = form.get(k);
    selfie = form.get('selfie');
  } else {
    try { f = await req.json(); } catch (e) { return json({ error: 'bad request' }, cors, 400); }
  }

  const locId = clean(f.loc, 40), method = clean(f.method, 8) === 'nfc' ? 'nfc' : 'qr';
  const key = clean(f.k, 80), deviceId = clean(f.deviceId, 80);
  const loc = await getLocation(env, locId);
  if (!loc || !loc.active) return json({ error: 'Unknown or inactive office tag.' }, cors, 400);

  // The tag key proves the punch came from a genuine ProHealth tag. NFC tags
  // carry a *secret* key never printed in public; the QR key is the printed one.
  const want = method === 'nfc' ? loc.nfc_key : loc.qr_key;
  if (!want || !safeEqual(key, want)) return json({ error: 'This tag is not recognised. Ask an admin to re-issue it.' }, cors, 400);

  const now = new Date();
  const lp = await lastPunch(env, emp.id);
  const openIn = lp && lp.kind === 'in' ? lp : null;
  const kind = openIn ? 'out' : 'in';                       // toggle
  const secondsSinceLast = lp ? Math.round((now - parseDbTime(lp.created_at)) / 1000) : null;

  // ---- failsafe ----
  let lat = f.lat != null && f.lat !== '' ? Number(f.lat) : null;
  let lng = f.lng != null && f.lng !== '' ? Number(f.lng) : null;
  const accuracy = f.accuracy != null && f.accuracy !== '' ? Number(f.accuracy) : null;
  let distance = null, flagged = '', note = '';

  if (method === 'qr') {
    // QR always needs a selfie.
    if (!selfie || typeof selfie !== 'object' || !selfie.size) return json({ need: 'selfie', error: 'A photo is required to clock in by QR.' }, cors, 422);

    const known = await deviceSeen(env, emp.id, deviceId);
    const reasons = fishyReasons(now, {
      knownDevice: known, assignedOffice: emp.assigned_office, locId,
      secondsSinceLast, tz: ATT.TZ,
    });
    if (reasons.length) {
      // Suspicious QR punch -> require a GPS fix inside the geofence.
      if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
        return json({ need: 'gps', reason: reasons.join(', '), error: 'Please allow location to confirm you are on-site.' }, cors, 422);
      }
      if (loc.lat == null || loc.lng == null) {
        // Can't geofence a location with no coordinates; record but flag it.
        flagged = 'no-geo'; note = 'office has no coordinates; ' + reasons.join(', ');
      } else {
        const radius = loc.radius || ATT.DEFAULT_RADIUS_M;
        distance = haversine(lat, lng, loc.lat, loc.lng);
        if (distance > radius) {
          return json({ error: 'geofence', distance: Math.round(distance), radius, message: 'You appear to be about ' + Math.round(distance) + ' m from ' + loc.name + '. Clock in/out must be done on-site.' }, cors, 403);
        }
        note = 'gps-verified (' + reasons.join(', ') + ')';
      }
    }
  }
  // NFC: proximity is the proof — instant. (Tag key already validated above.)

  // ---- hours at clock-out ----
  let hours = null;
  if (kind === 'out' && openIn) {
    hours = Math.max(0, (now - parseDbTime(openIn.created_at)) / 3600e3);
    if (hours > ATT.MAX_SHIFT_HOURS) {
      flagged = flagged || 'long-shift';
      note = (note ? note + '; ' : '') + 'shift exceeds ' + ATT.MAX_SHIFT_HOURS + 'h — please review';
    }
    hours = Math.round(hours * 100) / 100;
  }

  // ---- store selfie ----
  let selfieKey = '';
  if (selfie && typeof selfie === 'object' && selfie.size) {
    if (selfie.size > ATT.SELFIE_MAX_BYTES) return json({ error: 'That photo is too large.' }, cors, 400);
    selfieKey = ATT.SELFIE_PREFIX + uuid() + '.jpg';
    try { await env.RESUMES.put(selfieKey, await selfie.arrayBuffer(), { httpMetadata: { contentType: 'image/jpeg' } }); }
    catch (e) { console.log('selfie store failed', e.message); selfieKey = ''; }
  }

  const id = uuid();
  await env.DB.prepare(
    'INSERT INTO att_punches (id, employee_id, email, loc_id, loc_name, kind, method, lat, lng, accuracy, distance, selfie_key, device_id, flagged, note, hours, created_at) ' +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
  ).bind(id, emp.id, emp.email, locId, loc.name, kind, method,
         lat, lng, accuracy, distance, selfieKey, deviceId, flagged, note, hours).run();

  await audit(env, emp.email, 'punch ' + kind + ' (' + method + ')', loc.name, flagged || '');

  return json({
    ok: true, id, kind, method, locName: loc.name,
    at: now.toISOString(), hours, hoursText: hours != null ? fmtHours(hours) : null,
    flagged: flagged || null,
    message: kind === 'in'
      ? 'Clocked in at ' + loc.name + '.'
      : 'Clocked out of ' + loc.name + '. You worked ' + (hours != null ? fmtHours(hours) : '—') + '.',
  }, cors);
}

/* ---------------- set-password (provisioned employees) ---------------- */
async function handleSetPw(req, env, cors) {
  if (req.method === 'GET') return new Response(SETPW_HTML, { headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  if (req.method === 'POST') {
    let b = {}; try { b = await req.json(); } catch (e) { return json({ error: 'bad request' }, cors, 400); }
    const email = await readEmpToken(env, String(b.token || ''));
    if (!email) return json({ error: 'This link has expired. Ask an admin for a new one.' }, cors, 400);
    const pass = String(b.password || '');
    if (pass.length < 10) return json({ error: 'Password must be at least 10 characters.' }, cors, 400);
    const emp = await getEmployeeByEmail(env, email);
    if (!emp) return json({ error: 'This account no longer exists.' }, cors, 400);
    await env.DB.prepare('UPDATE att_employees SET pass_hash = ?, active = 1 WHERE id = ?').bind(await hashPassword(pass), emp.id).run();
    await env.CONFIG.delete('eset:' + String(b.token || ''));
    await audit(env, email, 'attendance password set', email, '');
    return json({ ok: true }, cors);
  }
  return json({ error: 'method not allowed' }, cors, 405);
}

/* ============================================================
   SUPERADMIN  /attend/admin/*
   ============================================================ */
async function adminRoute(req, env, url, cors) {
  const who = await requireEmployee(req, env, cors, { super: true });
  if (who instanceof Response) return who;
  const sub = url.pathname.replace('/attend/admin', '');   // e.g. "/locations"

  /* ---- locations ---- */
  if (sub === '/locations') {
    if (req.method === 'GET') return json({ locations: (await listLocations(env)).map(pubLocation) }, cors);
    if (req.method === 'POST') {
      let b = {}; try { b = await req.json(); } catch (e) { return json({ error: 'bad request' }, cors, 400); }
      const name = clean(b.name, 80);
      if (!name) return json({ error: 'A name is required.' }, cors, 400);
      let id = clean(b.id, 40).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const lat = b.lat != null && b.lat !== '' ? Number(b.lat) : null;
      const lng = b.lng != null && b.lng !== '' ? Number(b.lng) : null;
      const radius = b.radius ? Math.max(20, Math.min(2000, parseInt(b.radius, 10) || ATT.DEFAULT_RADIUS_M)) : ATT.DEFAULT_RADIUS_M;
      const active = b.active === false ? 0 : 1;
      let loc = id ? await getLocation(env, id) : null;
      if (loc) {
        await env.DB.prepare('UPDATE att_locations SET name=?, lat=?, lng=?, radius=?, active=? WHERE id=?')
          .bind(name, lat, lng, radius, active, id).run();
        await audit(env, who.sub, 'update location', id, name);
      } else {
        if (!id) id = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || newKey().slice(0, 6).toUpperCase();
        // avoid a collision on a generated id
        if (await getLocation(env, id)) id = id.slice(0, 6) + newKey().slice(0, 4).toUpperCase();
        await env.DB.prepare('INSERT INTO att_locations (id, name, lat, lng, radius, nfc_key, qr_key, active, created_at) ' +
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))")
          .bind(id, name, lat, lng, radius, newKey(), newKey(), active).run();
        await audit(env, who.sub, 'create location', id, name);
      }
      return json({ ok: true, location: pubLocation(await getLocation(env, id)) }, cors);
    }
  }
  const locDel = sub.match(/^\/locations\/([\w-]+)$/);
  if (locDel && req.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM att_locations WHERE id = ?').bind(locDel[1]).run();
    await audit(env, who.sub, 'delete location', locDel[1], '');
    return json({ ok: true }, cors);
  }
  // Rotate a location's keys (invalidates old tags/QRs).
  const locRot = sub.match(/^\/locations\/([\w-]+)\/rotate$/);
  if (locRot && req.method === 'POST') {
    const loc = await getLocation(env, locRot[1]);
    if (!loc) return json({ error: 'not found' }, cors, 404);
    await env.DB.prepare('UPDATE att_locations SET nfc_key=?, qr_key=? WHERE id=?').bind(newKey(), newKey(), loc.id).run();
    await audit(env, who.sub, 'rotate location keys', loc.id, '');
    return json({ ok: true, location: pubLocation(await getLocation(env, loc.id)) }, cors);
  }

  /* ---- employees ---- */
  if (sub === '/employees') {
    if (req.method === 'GET') {
      const r = await env.DB.prepare('SELECT id, email, name, assigned_office, shift_id, picture, active, created_at FROM att_employees ORDER BY name').all();
      // hasPassword needs the hash column; fetch cheaply
      const h = await env.DB.prepare('SELECT id, (pass_hash IS NOT NULL AND pass_hash != "") AS hp FROM att_employees').all();
      const hp = {}; for (const x of (h.results || [])) hp[x.id] = !!x.hp;
      return json({ employees: (r.results || []).map((e) => ({ id: e.id, email: e.email, name: e.name, assignedOffice: e.assigned_office, shiftId: e.shift_id || '', picture: e.picture || '', active: !!e.active, hasPassword: !!hp[e.id], createdAt: e.created_at })) }, cors);
    }
    if (req.method === 'POST') {
      let b = {}; try { b = await req.json(); } catch (e) { return json({ error: 'bad request' }, cors, 400); }
      const email = lc(b.email);
      if (!/^[^@\s]+@prohealth\.us$/i.test(email)) return json({ error: 'Only @prohealth.us emails can be added.' }, cors, 400);
      const name = clean(b.name, 80) || email.split('@')[0];
      const office = clean(b.assignedOffice, 40);
      // 'manual' = set a password now; 'invite' = just create the record (they
      // sign in with Google); 'magic' = email a set-password link. With Google
      // login on, 'invite' is the norm — you only pre-add to assign an office.
      const mode = ['manual', 'invite', 'magic'].indexOf(b.mode) !== -1 ? b.mode : 'magic';
      const activeOnCreate = (mode === 'manual' || mode === 'invite') ? 1 : 0;
      let emp = await getEmployeeByEmail(env, email);
      if (!emp) {
        const id = uuid();
        await env.DB.prepare('INSERT INTO att_employees (id, email, name, pass_hash, assigned_office, active, created_at, created_by) ' +
          "VALUES (?, ?, ?, '', ?, ?, datetime('now'), ?)")
          .bind(id, email, name, office, activeOnCreate, who.sub).run();
        emp = await getEmployeeByEmail(env, email);
      } else {
        await env.DB.prepare('UPDATE att_employees SET name=?, assigned_office=? WHERE id=?').bind(name, office, emp.id).run();
      }
      let sent = false;
      if (mode === 'manual') {
        const pass = String(b.password || '');
        if (pass.length < 10) return json({ error: 'Password must be at least 10 characters.' }, cors, 400);
        await env.DB.prepare('UPDATE att_employees SET pass_hash=?, active=1 WHERE id=?').bind(await hashPassword(pass), emp.id).run();
      } else if (mode === 'magic') {
        const token = await createEmpToken(env, email);
        sent = await emailSetPw(env, email, url.origin, token);
      }   // 'invite': nothing more to do — Google login provisions the rest
      await audit(env, who.sub, 'add/update employee', email, mode);
      return json({ ok: true, email, sent }, cors);
    }
  }
  const empDel = sub.match(/^\/employees\/([^/]+)$/);
  if (empDel && req.method === 'DELETE') {
    const email = lc(decodeURIComponent(empDel[1]));
    // Deactivate rather than hard-delete, so their punch history survives.
    await env.DB.prepare('UPDATE att_employees SET active = 0 WHERE email = ?').bind(email).run();
    await audit(env, who.sub, 'deactivate employee', email, '');
    return json({ ok: true }, cors);
  }
  const empReset = sub.match(/^\/employees\/([^/]+)\/reset$/);
  if (empReset && req.method === 'POST') {
    const email = lc(decodeURIComponent(empReset[1]));
    if (!await getEmployeeByEmail(env, email)) return json({ error: 'not found' }, cors, 404);
    const token = await createEmpToken(env, email);
    const sent = await emailSetPw(env, email, url.origin, token);
    await audit(env, who.sub, 'employee reset link', email, '');
    return json({ ok: true, sent }, cors);
  }

  /* ---- assign an employee to an office and/or shift ---- */
  const empAssign = sub.match(/^\/employees\/([^/]+)\/assign$/);
  if (empAssign && req.method === 'POST') {
    const email = lc(decodeURIComponent(empAssign[1]));
    const emp = await getEmployeeByEmail(env, email);
    if (!emp) return json({ error: 'not found' }, cors, 404);
    let b = {}; try { b = await req.json(); } catch (e) { return json({ error: 'bad request' }, cors, 400); }
    const office = b.assignedOffice !== undefined ? clean(b.assignedOffice, 40) : emp.assigned_office;
    const shiftId = b.shiftId !== undefined ? clean(b.shiftId, 40) : emp.shift_id;
    await env.DB.prepare('UPDATE att_employees SET assigned_office = ?, shift_id = ? WHERE id = ?').bind(office, shiftId, emp.id).run();
    await audit(env, who.sub, 'assign employee', email, 'office=' + office + ' shift=' + shiftId);
    return json({ ok: true }, cors);
  }

  /* ---- shift templates ---- */
  if (sub === '/shifts') {
    if (req.method === 'GET') return json({ shifts: await listShifts(env) }, cors);
    if (req.method === 'POST') {
      let b = {}; try { b = await req.json(); } catch (e) { return json({ error: 'bad request' }, cors, 400); }
      const name = clean(b.name, 60);
      if (!name) return json({ error: 'A shift name is required.' }, cors, 400);
      if (hhmmToMin(b.start) == null || hhmmToMin(b.end) == null) return json({ error: 'Start and end must be HH:MM.' }, cors, 400);
      const days = (Array.isArray(b.days) ? b.days : String(b.days || '').split(',')).map((d) => clean(d, 3)).filter(Boolean).join(',');
      let id = clean(b.id, 40);
      if (id && await getShift(env, id)) {
        await env.DB.prepare('UPDATE att_shifts SET name=?, start=?, end=?, days=? WHERE id=?').bind(name, clean(b.start, 5), clean(b.end, 5), days, id).run();
        await audit(env, who.sub, 'update shift', id, name);
      } else {
        id = uuid();
        await env.DB.prepare("INSERT INTO att_shifts (id, name, start, end, days, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))")
          .bind(id, name, clean(b.start, 5), clean(b.end, 5), days).run();
        await audit(env, who.sub, 'create shift', id, name);
      }
      return json({ ok: true, shift: await getShift(env, id) }, cors);
    }
  }
  const shiftDel = sub.match(/^\/shifts\/([\w-]+)$/);
  if (shiftDel && req.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM att_shifts WHERE id = ?').bind(shiftDel[1]).run();
    await env.DB.prepare('UPDATE att_employees SET shift_id = ? WHERE shift_id = ?').bind('', shiftDel[1]).run();
    await audit(env, who.sub, 'delete shift', shiftDel[1], '');
    return json({ ok: true }, cors);
  }

  /* ---- attendance holidays (separate from the website's closures) ---- */
  if (sub === '/holidays') {
    if (req.method === 'GET') {
      const text = (await env.CONFIG.get('att_holidays')) || '';
      return json({ text, holidays: parseHolidays(text) }, cors);
    }
    if (req.method === 'PUT') {
      let b = {}; try { b = await req.json(); } catch (e) { return json({ error: 'bad request' }, cors, 400); }
      await env.CONFIG.put('att_holidays', clean(b.text, 8000));
      await audit(env, who.sub, 'update attendance holidays', '', '');
      return json({ ok: true }, cors);
    }
  }

  /* ---- monthly summary report ---- */
  if (sub === '/report' && req.method === 'GET') {
    const month = clean(url.searchParams.get('month'), 7);      // YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: 'month must be YYYY-MM' }, cors, 400);
    const start = month + '-01 00:00:00';
    const end = month + '-31 23:59:59';
    const [pr, er] = await Promise.all([
      env.DB.prepare('SELECT email, kind, hours, flagged, created_at FROM att_punches WHERE created_at >= ? AND created_at <= ? ORDER BY created_at').bind(start, end).all(),
      env.DB.prepare('SELECT email, name FROM att_employees').all(),
    ]);
    const nameByEmail = {};
    for (const e of (er.results || [])) nameByEmail[e.email] = e.name;
    const rows = summarizeMonth(pr.results || [], nameByEmail);
    const totals = rows.reduce((t, r) => ({ hours: t.hours + r.hours, days: t.days + r.daysWorked, flagged: t.flagged + r.flagged }), { hours: 0, days: 0, flagged: 0 });
    totals.hours = Math.round(totals.hours * 100) / 100;
    const holidays = parseHolidays((await env.CONFIG.get('att_holidays')) || '').filter((h) => h.date.slice(0, 7) === month);
    return json({ month, rows, totals, holidays }, cors);
  }

  /* ---- overview: who is on the clock right now ---- */
  if (sub === '/overview' && req.method === 'GET') {
    const r = await env.DB.prepare(
      'SELECT p.* FROM att_punches p JOIN (SELECT employee_id, MAX(created_at) mx FROM att_punches GROUP BY employee_id) m ' +
      'ON p.employee_id = m.employee_id AND p.created_at = m.mx').all();
    const rows = r.results || [];
    const onClock = rows.filter((x) => x.kind === 'in').map((x) => ({ email: x.email, locName: x.loc_name, since: x.created_at, method: x.method }));
    const fr = await env.DB.prepare("SELECT COUNT(*) c FROM att_punches WHERE flagged != '' AND flagged IS NOT NULL AND created_at >= datetime('now','-7 days')").all();
    return json({ onClock, flagged7d: (fr.results && fr.results[0] && fr.results[0].c) || 0 }, cors);
  }

  /* ---- punches list (for reports / review) ---- */
  if (sub === '/punches' && req.method === 'GET') {
    const from = clean(url.searchParams.get('from'), 30), to = clean(url.searchParams.get('to'), 30);
    const emp = lc(url.searchParams.get('emp')), loc = clean(url.searchParams.get('loc'), 40);
    const w = [], v = [];
    if (from) { w.push('created_at >= ?'); v.push(from); }
    if (to) { w.push('created_at <= ?'); v.push(to); }
    if (emp) { w.push('email = ?'); v.push(emp); }
    if (loc) { w.push('loc_id = ?'); v.push(loc); }
    const sql = 'SELECT * FROM att_punches' + (w.length ? ' WHERE ' + w.join(' AND ') : '') + ' ORDER BY created_at DESC LIMIT 1000';
    const r = await env.DB.prepare(sql).bind(...v).all();
    return json({ punches: r.results || [] }, cors);
  }

  /* ---- serve a selfie image ---- */
  if (sub === '/selfie' && req.method === 'GET') {
    const key = url.searchParams.get('key') || '';
    if (key.indexOf(ATT.SELFIE_PREFIX) !== 0 || key.indexOf('..') !== -1) return json({ error: 'bad key' }, cors, 400);
    const obj = await env.RESUMES.get(key);
    if (!obj) return json({ error: 'not found' }, cors, 404);
    await audit(env, who.sub, 'view selfie', key, '');
    return new Response(obj.body, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store', ...cors } });
  }

  /* ---- manual punch (correction / override) ---- */
  if (sub === '/punch' && req.method === 'POST') {
    let b = {}; try { b = await req.json(); } catch (e) { return json({ error: 'bad request' }, cors, 400); }
    const emp = await getEmployeeByEmail(env, lc(b.email));
    if (!emp) return json({ error: 'Unknown employee.' }, cors, 400);
    const kind = b.kind === 'out' ? 'out' : 'in';
    const loc = await getLocation(env, clean(b.loc, 40));
    const at = clean(b.at, 40);   // ISO; falls back to now
    let hours = null;
    if (kind === 'out') {
      const openIn = await lastPunch(env, emp.id);
      if (openIn && openIn.kind === 'in') hours = Math.round(Math.max(0, ((at ? new Date(at) : new Date()) - parseDbTime(openIn.created_at)) / 3600e3) * 100) / 100;
    }
    const id = uuid();
    await env.DB.prepare(
      'INSERT INTO att_punches (id, employee_id, email, loc_id, loc_name, kind, method, selfie_key, device_id, flagged, note, hours, created_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ' + (at ? '?' : "datetime('now')") + ')'
    ).bind(...[id, emp.id, emp.email, loc ? loc.id : '', loc ? loc.name : clean(b.loc, 40), kind, 'manual', '', '', 'manual', clean(b.note, 400), hours, ...(at ? [at] : [])]).run();
    await audit(env, who.sub, 'manual punch ' + kind, emp.email, clean(b.note, 200));
    return json({ ok: true, id, hours }, cors);
  }

  return json({ error: 'not found' }, cors, 404);
}

// Location shape sent to the PWA (superadmin) — includes the keys so the app
// can write the NFC tag and render the QR. Superadmin-only endpoint.
function pubLocation(l) {
  if (!l) return null;
  return { id: l.id, name: l.name, lat: l.lat, lng: l.lng, radius: l.radius || ATT.DEFAULT_RADIUS_M,
           nfcKey: l.nfc_key, qrKey: l.qr_key, active: !!l.active };
}

async function emailSetPw(env, email, origin, token) {
  try {
    const from = env.EMAIL_FROM || 'ProHealth Home Care <no-reply@prohealth.us>';
    if (!env.RESEND_API_KEY) return false;
    const link = origin + '/attend/setpw?token=' + token;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [email], subject: 'Set up your ProHealth attendance login',
        html: '<p>You have been set up to clock in and out with the ProHealth attendance app.</p>' +
          '<p><a href="' + link + '">Set your password</a> (valid for 1 hour), then sign in with your @prohealth.us email.</p>' }),
    });
    return r.ok;
  } catch (e) { console.log('emailSetPw failed', e.message); return false; }
}

/* Per-IP throttle (mirrors index.js). Kept local so attendance.js is self-contained. */
async function tooMany(env, ip, bucket, max, ttl) {
  try {
    const key = 'rl:' + bucket + ':' + ip;
    const n = parseInt((await env.CONFIG.get(key)) || '0', 10);
    if (n >= max) return true;
    await env.CONFIG.put(key, String(n + 1), { expirationTtl: ttl });
    return false;
  } catch (e) { return false; }
}

/* ============================================================
   Nightly maintenance: auto-close punches left open too long, so a forgotten
   clock-out never runs forever. Called from the Worker's scheduled() handler.
   ============================================================ */
export async function attendanceCron(env) {
  const cutoff = new Date(Date.now() - ATT.MAX_SHIFT_HOURS * 3600e3).toISOString().replace('T', ' ').slice(0, 19);
  // last punch per employee that is an "in" older than the cutoff
  const r = await env.DB.prepare(
    'SELECT p.* FROM att_punches p JOIN (SELECT employee_id, MAX(created_at) mx FROM att_punches GROUP BY employee_id) m ' +
    'ON p.employee_id = m.employee_id AND p.created_at = m.mx WHERE p.kind = ? AND p.created_at < ?'
  ).bind('in', cutoff).all();
  let closed = 0;
  for (const open of (r.results || [])) {
    const hours = Math.round(ATT.MAX_SHIFT_HOURS * 100) / 100;
    await env.DB.prepare(
      'INSERT INTO att_punches (id, employee_id, email, loc_id, loc_name, kind, method, selfie_key, device_id, flagged, note, hours, created_at) ' +
      "VALUES (?, ?, ?, ?, ?, 'out', 'auto', '', '', 'auto-closed', ?, ?, datetime('now'))"
    ).bind(uuid(), open.employee_id, open.email, open.loc_id, open.loc_name,
           'auto-closed: no clock-out within ' + ATT.MAX_SHIFT_HOURS + 'h', hours).run();
    closed++;
  }
  if (closed) await audit(env, 'system', 'auto-close punches', '', String(closed));
  return closed;
}

/* ---------------- set-password page (served at /attend/setpw) ---------------- */
export const SETPW_HTML = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Set your password | ProHealth Attendance</title><meta name="robots" content="noindex">
<style>
:root{--blue:#138AC0;--navy:#0B3A52;--g50:#F8FAFB;--g200:#E4E9EF;--slate:#5D6E80;--ink:#0F2233;--line:#E1E8EF;--red:#C0392B}
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:grid;place-items:center;padding:20px;font-family:system-ui,sans-serif;background:linear-gradient(180deg,#FDFBF8,#E9F6FC);color:var(--ink)}
.box{width:100%;max-width:360px;background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:0 18px 50px rgba(11,58,82,.14);padding:28px 26px}
h1{font-size:1.15rem;color:var(--navy);text-align:center;margin-bottom:4px}
p.sub{text-align:center;font-size:.83rem;color:var(--slate);margin-bottom:20px}
label{display:block;font-size:.76rem;font-weight:600;color:var(--slate);margin:12px 0 5px}
input{width:100%;font:inherit;padding:11px 13px;border:1px solid var(--g200);border-radius:10px;background:var(--g50)}
button{width:100%;margin-top:18px;font-weight:600;color:#fff;background:var(--blue);border:none;border-radius:11px;padding:13px;cursor:pointer}
.msg{margin-top:14px;font-size:.83rem;padding:10px 12px;border-radius:9px;display:none}
.msg.err{display:block;background:#FDECEC;color:var(--red)}
.msg.ok{display:block;background:#E9F8F0;color:#2F7A63;text-align:center}
</style></head><body>
<form class="box" id="f">
  <h1>Set your password</h1><p class="sub">ProHealth attendance</p>
  <label for="p1">New password</label><input id="p1" type="password" autocomplete="new-password" required>
  <label for="p2">Confirm password</label><input id="p2" type="password" autocomplete="new-password" required>
  <button id="b" type="submit">Save password</button>
  <div class="msg" id="m"></div>
</form>
<script>
var q=new URLSearchParams(location.search),token=q.get('token')||'';
var f=document.getElementById('f'),m=document.getElementById('m'),b=document.getElementById('b');
if(!token){m.className='msg err';m.textContent='This link is missing its token.';b.disabled=true;}
f.addEventListener('submit',async function(ev){ev.preventDefault();m.className='msg';
  var p1=document.getElementById('p1').value,p2=document.getElementById('p2').value;
  if(p1.length<10){m.className='msg err';m.textContent='At least 10 characters.';return;}
  if(p1!==p2){m.className='msg err';m.textContent='Passwords do not match.';return;}
  b.disabled=true;b.textContent='Saving...';
  try{var r=await fetch('/attend/setpw',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token,password:p1})});
    if(r.ok){f.innerHTML='<div class="msg ok">Password saved. You can now sign in to the attendance app.</div>';return;}
    var d=await r.json().catch(function(){return{};});m.className='msg err';m.textContent=d.error||'Could not save.';
  }catch(e){m.className='msg err';m.textContent='Network error.';}
  b.disabled=false;b.textContent='Save password';});
</script></body></html>`;
