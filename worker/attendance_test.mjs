// Exercise the attendance module against an in-memory D1 / KV / R2.
// Run: node worker/attendance_test.mjs   (from repo root or worker/)
import fs from 'fs';
import path from 'path';

const here = path.dirname(new URL(import.meta.url).pathname);

// Import the real modules directly; Node resolves attendance.js's ./auth.js
// import on its own (production bundles them the same way, in separate scopes).
const M = await import(path.join(here, 'src', 'attendance.js'));
const A = await import(path.join(here, 'src', 'auth.js'));

/* ---------------- in-memory D1 ---------------- */
const nowStr = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
function splitTop(s) {
  const out = []; let d = 0, q = null, cur = '';
  for (const ch of s) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === "'") { q = "'"; cur += ch; continue; }
    if (ch === '(') d++; if (ch === ')') d--;
    if (ch === ',' && d === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur); return out;
}
const stripq = (v) => v.trim().replace(/^'/, '').replace(/'$/, '');

function makeDB() {
  const tables = { att_locations: [], att_employees: [], att_punches: [], audit_log: [] };
  let seq = 0;
  const cmp = (a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : a.__seq - b.__seq);

  function doInsert(sql, b) {
    const m = sql.match(/INSERT INTO (\w+)\s*\(([^)]*)\)\s*VALUES\s*\(([\s\S]*)\)\s*$/i);
    const table = m[1], cols = m[2].split(',').map((s) => s.trim());
    const vals = splitTop(m[3]); let bi = 0; const row = { __seq: seq++ };
    cols.forEach((c, i) => {
      const v = vals[i].trim();
      if (v === '?') row[c] = b[bi++];
      else if (/^datetime\('now'/i.test(v)) row[c] = nowStr();
      else row[c] = stripq(v);
    });
    tables[table].push(row);
    return { success: true, meta: { changes: 1 } };
  }
  function doUpdate(sql, b) {
    const m = sql.match(/UPDATE (\w+) SET ([\s\S]*?) WHERE ([\s\S]*)$/i);
    const table = m[1], sets = splitTop(m[2]).map((s) => s.trim());
    let bi = 0; const apply = {};
    for (const s of sets) { const [col, val] = s.split('='); const c = col.trim(), v = val.trim(); apply[c] = v === '?' ? b[bi++] : (/^\d+$/.test(v) ? Number(v) : stripq(v)); }
    const wm = m[3].match(/(\w+)\s*=\s*\?/); const wcol = wm[1], wval = b[bi++];
    let n = 0;
    for (const row of tables[table]) if (String(row[wcol]) === String(wval)) { Object.assign(row, apply); n++; }
    return { success: true, meta: { changes: n } };
  }
  function doDelete(sql, b) {
    const m = sql.match(/DELETE FROM (\w+) WHERE (\w+)\s*=\s*\?/i);
    const table = m[1], col = m[2], val = b[0];
    const before = tables[table].length;
    tables[table] = tables[table].filter((r) => String(r[col]) !== String(val));
    return { success: true, meta: { changes: before - tables[table].length } };
  }
  function lastPerEmp() {
    const by = {};
    for (const p of tables.att_punches) { if (!by[p.employee_id] || cmp(p, by[p.employee_id]) > 0) by[p.employee_id] = p; }
    return Object.values(by);
  }
  function doSelect(sql, b) {
    const s = sql.replace(/\s+/g, ' ').trim();
    if (/FROM att_locations WHERE id = \?/i.test(s)) return { results: tables.att_locations.filter((r) => r.id === b[0]) };
    if (/FROM att_locations ORDER BY name/i.test(s)) return { results: [...tables.att_locations].sort((a, c) => String(a.name).localeCompare(c.name)) };
    if (/FROM att_employees WHERE email = \?/i.test(s)) return { results: tables.att_employees.filter((r) => r.email === b[0]) };
    if (/pass_hash IS NOT NULL/i.test(s)) return { results: tables.att_employees.map((e) => ({ id: e.id, hp: e.pass_hash ? 1 : 0 })) };
    if (/SELECT id, email, name, assigned_office/i.test(s)) return { results: [...tables.att_employees] };
    if (/FROM att_punches WHERE employee_id = \? AND device_id = \?/i.test(s)) return { results: tables.att_punches.filter((p) => p.employee_id === b[0] && p.device_id === b[1]).slice(0, 1) };
    if (/FROM att_punches WHERE employee_id = \? ORDER BY created_at DESC LIMIT 1/i.test(s)) {
      const list = tables.att_punches.filter((p) => p.employee_id === b[0]).sort(cmp);
      return { results: list.length ? [list[list.length - 1]] : [] };
    }
    if (/GROUP BY employee_id/i.test(s)) {
      let rows = lastPerEmp();
      if (/WHERE p\.kind = \?/i.test(s)) rows = rows.filter((p) => p.kind === b[0] && p.created_at < b[1]);
      return { results: rows };
    }
    if (/COUNT\(\*\) c FROM att_punches/i.test(s)) return { results: [{ c: tables.att_punches.filter((p) => p.flagged).length }] };
    if (/FROM att_punches/i.test(s)) return { results: [...tables.att_punches].sort(cmp).reverse() };
    return { results: [] };
  }

  const prepare = (sql) => ({
    _b: [],
    bind(...a) { this._b = a; return this; },
    async run() {
      if (/^\s*INSERT/i.test(sql)) return doInsert(sql, this._b);
      if (/^\s*UPDATE/i.test(sql)) return doUpdate(sql, this._b);
      if (/^\s*DELETE/i.test(sql)) return doDelete(sql, this._b);
      return { success: true };
    },
    async all() { return doSelect(sql, this._b); },
  });
  return { prepare, _tables: tables };
}

function makeEnv() {
  const kv = new Map();
  const r2 = new Map();
  return {
    DB: makeDB(),
    RESUMES: { put: async (k, v, o) => { r2.set(k, v); }, get: async (k) => (r2.has(k) ? { body: r2.get(k) } : null) },
    CONFIG: { get: async (k) => (kv.has(k) ? kv.get(k) : null), put: async (k, v) => kv.set(k, v), delete: async (k) => kv.delete(k) },
    _r2: r2, _kv: kv,
    SESSION_SECRET: 'test-secret', RESEND_API_KEY: '',
  };
}

/* ---------------- test rig ---------------- */
const out = [];
let failed = 0;
async function t(name, fn) {
  try { const r = await fn(); if (r === false) { failed++; out.push('FAIL | ' + name); } else out.push('PASS | ' + name); }
  catch (e) { failed++; out.push('FAIL | ' + name + ' :: ' + (e.stack || e.message)); }
}
const cors = {};
const req = (pathname, opts = {}) => new Request('https://api.prohealth.us' + pathname, opts);
const bearer = (tok) => ({ Authorization: 'Bearer ' + tok });
const jbody = (o) => ({ 'Content-Type': 'application/json' });
const route = (env, pathname, opts) => {
  const r = req(pathname, opts); const url = new URL(r.url);
  return M.attendanceRoute(r, env, url, cors);
};

/* ---------------- pure functions ---------------- */
await t('haversine ~0 for same point', () => M.haversine(38.58, -121.49, 38.58, -121.49) < 1);
await t('haversine ~111km per degree lat', () => Math.abs(M.haversine(38, -121, 39, -121) - 111195) < 500);
await t('fmtHours 7.75 -> 7h 45m', () => M.fmtHours(7.75) === '7h 45m');
await t('parseDbTime handles D1 space format', () => {
  const d = M.parseDbTime('2026-07-22 18:40:05');
  return d && d.getUTCHours() === 18 && d.getUTCMinutes() === 40;
});
await t('hourInTz converts UTC->LA', () => {
  // 2026-07-22T20:00:00Z is 13:00 PDT
  return M.hourInTz(new Date('2026-07-22T20:00:00Z')) === 13;
});
await t('fishy: known device, own office, midday, not rapid -> not fishy', () => {
  const now = new Date('2026-07-22T20:00:00Z'); // 1pm LA
  return M.fishyReasons(now, { knownDevice: true, assignedOffice: 'SAC', locId: 'SAC', secondsSinceLast: 4000 }).length === 0;
});
await t('fishy: new device -> fishy', () => {
  const now = new Date('2026-07-22T20:00:00Z');
  return M.fishyReasons(now, { knownDevice: false, assignedOffice: 'SAC', locId: 'SAC', secondsSinceLast: 4000 }).includes('new device');
});
await t('fishy: wrong office -> fishy', () => {
  const now = new Date('2026-07-22T20:00:00Z');
  return M.fishyReasons(now, { knownDevice: true, assignedOffice: 'SAC', locId: 'SJ', secondsSinceLast: 4000 }).some((x) => x.includes('assigned'));
});
await t('fishy: 3am LA -> outside hours', () => {
  const now = new Date('2026-07-22T10:00:00Z'); // 3am LA
  return M.fishyReasons(now, { knownDevice: true, assignedOffice: 'SAC', locId: 'SAC', secondsSinceLast: 4000 }).some((x) => x.includes('normal hours'));
});
await t('fishy: rapid re-tap -> fishy', () => {
  const now = new Date('2026-07-22T20:00:00Z');
  return M.fishyReasons(now, { knownDevice: true, assignedOffice: 'SAC', locId: 'SAC', secondsSinceLast: 20 }).some((x) => x.includes('too soon'));
});

/* ---------------- Google sign-in ---------------- */
await t('googleClaimsValid: good token passes', () =>
  M.googleClaimsValid({ iss: 'https://accounts.google.com', aud: 'CID', exp: Math.floor(Date.now() / 1000) + 600, email: 'a@prohealth.us', email_verified: true }, 'CID', Date.now()) === true);
await t('googleClaimsValid: wrong audience fails', () =>
  M.googleClaimsValid({ iss: 'https://accounts.google.com', aud: 'OTHER', exp: Math.floor(Date.now() / 1000) + 600, email: 'a@prohealth.us', email_verified: true }, 'CID', Date.now()) === false);
await t('googleClaimsValid: expired fails', () =>
  M.googleClaimsValid({ iss: 'accounts.google.com', aud: 'CID', exp: Math.floor(Date.now() / 1000) - 10, email: 'a@prohealth.us', email_verified: true }, 'CID', Date.now()) === false);
await t('googleClaimsValid: unverified email fails', () =>
  M.googleClaimsValid({ iss: 'accounts.google.com', aud: 'CID', exp: Math.floor(Date.now() / 1000) + 600, email: 'a@prohealth.us', email_verified: false }, 'CID', Date.now()) === false);
await t('POST /attend/google is 501 when unconfigured', async () => {
  const env0 = makeEnv();
  const r = await route(env0, '/attend/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: 'x.y.z' }) });
  return r.status === 501;
});

/* ---------------- integration: superadmin provisioning ---------------- */
// Seed a superadmin in the KV admin roster.
const env = makeEnv();
const superEmail = 'daniel@prohealth.us';
await env.CONFIG.put('admins', JSON.stringify([{ email: superEmail, passHash: await A.hashPassword('supersecret1') }]));

let superToken = '';
await t('superadmin can sign in', async () => {
  const r = await route(env, '/attend/login', { method: 'POST', headers: jbody(), body: JSON.stringify({ email: superEmail, password: 'supersecret1' }) });
  const d = await r.json(); superToken = d.token;
  return r.status === 200 && d.role === 'super' && !!d.token;
});
await t('bad password rejected', async () => {
  const r = await route(env, '/attend/login', { method: 'POST', headers: jbody(), body: JSON.stringify({ email: superEmail, password: 'wrong' }) });
  return r.status === 401;
});

let loc = null;
await t('superadmin creates a location with keys', async () => {
  const r = await route(env, '/attend/admin/locations', { method: 'POST', headers: { ...jbody(), ...bearer(superToken) }, body: JSON.stringify({ id: 'SAC', name: 'Sacramento HQ', lat: 38.5816, lng: -121.4944, radius: 150 }) });
  const d = await r.json(); loc = d.location;
  return r.status === 200 && loc.nfcKey && loc.qrKey && loc.nfcKey !== loc.qrKey;
});
await t('non-super cannot reach admin endpoints', async () => {
  // employee token needed; create employee first below. For now: no token -> 401.
  const r = await route(env, '/attend/admin/locations', { method: 'GET' });
  return r.status === 401;
});

await t('superadmin provisions an employee (manual password)', async () => {
  const r = await route(env, '/attend/admin/employees', { method: 'POST', headers: { ...jbody(), ...bearer(superToken) }, body: JSON.stringify({ email: 'nurse@prohealth.us', name: 'Nora Nurse', assignedOffice: 'SAC', mode: 'manual', password: 'nursepass123' }) });
  return r.status === 200;
});
await t('non-prohealth employee rejected', async () => {
  const r = await route(env, '/attend/admin/employees', { method: 'POST', headers: { ...jbody(), ...bearer(superToken) }, body: JSON.stringify({ email: 'x@gmail.com', name: 'X', mode: 'manual', password: 'whatever123' }) });
  return r.status === 400;
});

/* ---------------- integration: employee clock in/out ---------------- */
let empToken = '';
await t('employee can sign in', async () => {
  const r = await route(env, '/attend/login', { method: 'POST', headers: jbody(), body: JSON.stringify({ email: 'nurse@prohealth.us', password: 'nursepass123' }) });
  const d = await r.json(); empToken = d.token;
  return r.status === 200 && d.role === 'employee' && d.assignedOffice === 'SAC' && d.goalHours === 8 && typeof d.todayHours === 'number';
});
await t('employee token cannot access admin', async () => {
  const r = await route(env, '/attend/admin/locations', { method: 'GET', headers: bearer(empToken) });
  return r.status === 403;
});

await t('NFC punch is instant (no selfie / gps) and clocks in', async () => {
  const r = await route(env, '/attend/punch', { method: 'POST', headers: { ...jbody(), ...bearer(empToken) }, body: JSON.stringify({ loc: 'SAC', k: loc.nfcKey, method: 'nfc', deviceId: 'devA' }) });
  const d = await r.json();
  return r.status === 200 && d.kind === 'in' && d.locName === 'Sacramento HQ';
});
await t('/me shows the open shift', async () => {
  const r = await route(env, '/attend/me', { method: 'GET', headers: bearer(empToken) });
  const d = await r.json();
  return d.open && d.open.locId === 'SAC';
});
await t('NFC with wrong key is rejected', async () => {
  const r = await route(env, '/attend/punch', { method: 'POST', headers: { ...jbody(), ...bearer(empToken) }, body: JSON.stringify({ loc: 'SAC', k: 'deadbeef', method: 'nfc', deviceId: 'devA' }) });
  return r.status === 400;
});
await t('NFC punch again clocks out and returns hours', async () => {
  const r = await route(env, '/attend/punch', { method: 'POST', headers: { ...jbody(), ...bearer(empToken) }, body: JSON.stringify({ loc: 'SAC', k: loc.nfcKey, method: 'nfc', deviceId: 'devA' }) });
  const d = await r.json();
  return r.status === 200 && d.kind === 'out' && typeof d.hours === 'number';
});

/* ---------------- QR failsafe ---------------- */
function multipart(fields, selfie) {
  const fd = new FormData();
  for (const k in fields) fd.append(k, fields[k]);
  if (selfie) fd.append('selfie', new Blob([selfie], { type: 'image/jpeg' }), 'selfie.jpg');
  return fd;
}
await t('QR punch without selfie -> 422 need selfie', async () => {
  const r = await route(env, '/attend/punch', { method: 'POST', headers: bearer(empToken), body: multipart({ loc: 'SAC', k: loc.qrKey, method: 'qr', deviceId: 'devA' }) });
  const d = await r.json();
  return r.status === 422 && d.need === 'selfie';
});
await t('QR from NEW device (fishy) with selfie but no GPS -> 422 need gps', async () => {
  const r = await route(env, '/attend/punch', { method: 'POST', headers: bearer(empToken), body: multipart({ loc: 'SAC', k: loc.qrKey, method: 'qr', deviceId: 'brandNewDevice' }, 'JPEGDATA') });
  const d = await r.json();
  return r.status === 422 && d.need === 'gps';
});
await t('QR fishy + GPS far away -> 403 geofence', async () => {
  const r = await route(env, '/attend/punch', { method: 'POST', headers: bearer(empToken), body: multipart({ loc: 'SAC', k: loc.qrKey, method: 'qr', deviceId: 'brandNewDevice', lat: '37.3382', lng: '-121.8863' }, 'JPEGDATA') });
  const d = await r.json();
  return r.status === 403 && d.error === 'geofence' && d.distance > 1000;
});
await t('QR fishy + GPS on-site -> accepted', async () => {
  const r = await route(env, '/attend/punch', { method: 'POST', headers: bearer(empToken), body: multipart({ loc: 'SAC', k: loc.qrKey, method: 'qr', deviceId: 'brandNewDevice', lat: '38.5817', lng: '-121.4945' }, 'JPEGDATA') });
  const d = await r.json();
  return r.status === 200 && (d.kind === 'in' || d.kind === 'out');
});
await t('QR selfie was stored in R2', async () => {
  return [...env._r2.keys()].some((k) => k.startsWith('att/selfies/'));
});

/* ---------------- long shift + auto-close ---------------- */
await t('auto-close closes a punch left open too long', async () => {
  const env2 = makeEnv();
  // seed an open "in" 20h ago
  const old = new Date(Date.now() - 20 * 3600e3).toISOString().replace('T', ' ').slice(0, 19);
  env2.DB._tables.att_punches.push({ __seq: 0, id: 'p1', employee_id: 'e1', email: 'x@prohealth.us', loc_id: 'SAC', loc_name: 'Sac', kind: 'in', method: 'nfc', created_at: old, flagged: '' });
  const n = await M.attendanceCron(env2);
  const closed = env2.DB._tables.att_punches.find((p) => p.flagged === 'auto-closed');
  return n === 1 && closed && closed.kind === 'out';
});

/* ---------------- output ---------------- */
console.log(out.join('\n'));
console.log('\n' + (failed ? failed + ' FAILED' : 'all attendance tests passed'));
process.exit(failed ? 1 : 0);
