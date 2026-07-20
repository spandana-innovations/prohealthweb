/* ============================================================
   ProHealth API + Admin  —  Cloudflare Worker

   PUBLIC
     POST /leads             {name, phone, service?, type?, email?, message?, page?}
     POST /applications      multipart: name, phone, email?, role?, office?, license?, resume(File)
     POST /data-requests     {request_type, relationship, name, email, phone?, dob?, details?, is_agent?}
     GET  /openings.json     job openings for the careers page
     GET  /health

   ADMIN  (protected by Cloudflare Access, see README)
     GET  /admin             dashboard
     GET  /admin/api/all
     PATCH /admin/api/{leads|applications|requests}/:id   {status?, notes?}
     GET  /admin/api/resume?key=...
     GET/PUT /admin/api/openings
     GET/PUT /admin/api/config
   ============================================================ */

import { ADMIN_HTML } from './admin.js';
import {
  requireAdmin, handleLogin, handleLogout, RESET_HTML,
  isSuper, isProhealthEmail, isLocalName, roleOf, SUPER_EMAILS,
  getAdmins, getAdmin, upsertAdmin, removeAdmin, setAdminPassword,
  createResetToken, readResetToken, deleteResetToken,
} from './auth.js';

const ALLOWED_ORIGINS = [
  'https://prohealth.us',
  'https://www.prohealth.us',
  'https://prohealth.pages.dev',
  'https://prohealth-1oi.pages.dev',
  'http://localhost:3000',
  'http://localhost:8000',
];

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    const cors = corsHeaders(req.headers.get('Origin') || '');
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      if (p === '/admin/login' && req.method === 'POST') return await handleLogin(req, env);
      if (p === '/admin/logout') return handleLogout(env);
      if (p === '/admin/forgot' && req.method === 'POST') return await handleForgot(req, env);
      if (p === '/admin/reset') return await handleReset(req, env);
      if (p === '/admin' || p === '/admin/') {
        const who = await requireAdmin(req, env);
        if (who instanceof Response) return who;
        return new Response(ADMIN_HTML, { headers: htmlHeaders() });
      }
      if (p.startsWith('/admin/api/')) {
        const who = await requireAdmin(req, env);
        if (who instanceof Response) return who;
        return await adminApi(req, env, p.replace('/admin/api', ''), url, who);
      }

      if (p === '/health') return json({ ok: true, ts: new Date().toISOString() }, cors);
      if (p === '/openings.json' && req.method === 'GET') {
        return new Response(JSON.stringify(await readOpenings(env)), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...cors },
        });
      }
      if (req.method === 'POST' && p === '/leads') return await handleLead(req, env, cors);
      if (req.method === 'POST' && p === '/applications') return await handleApplication(req, env, cors);
      if (req.method === 'POST' && p === '/data-requests') return await handleDataRequest(req, env, cors);

      return json({ error: 'not found' }, cors, 404);
    } catch (e) {
      console.log('ERROR', p, e.stack || e.message);
      return json({ error: 'server error' }, cors, 500);
    }
  },
};


/* First run: KV is empty, but the site bundles a demo list. If we returned
   nothing, the admin would look bare while the site showed seven roles, and
   deleting one in the admin would appear to do nothing. So seed KV once with
   the same demo data. After that the admin is the single source of truth, and
   an empty list genuinely means "no openings". */
const DEFAULT_OPENINGS = [
  { title: 'Registered Nurse (RN)', type: 'Full-time', active: true,
    summary: 'Home Health and Hospice case management. Flexible schedule, local territory.',
    offices: ['Sacramento','Walnut Creek','San Jose','Stockton','Monterey','Fresno'] },
  { title: 'Licensed Vocational Nurse (LVN)', type: 'Full-time', active: true,
    summary: "Skilled visits, wound care and medication management in patients' homes.",
    offices: ['Sacramento','Stockton','Fresno'] },
  { title: 'Physical Therapist (PT)', type: 'Full-time', active: true,
    summary: "Home-based rehab. Our PTs hold master's and doctorate degrees.",
    offices: ['Walnut Creek','San Jose','Stockton'] },
  { title: 'Occupational Therapist (OT)', type: 'Part-time', active: true,
    summary: 'Restore independence in daily living, with home-safety evaluations.',
    offices: ['Sacramento','San Jose'] },
  { title: 'Speech Language Pathologist (SLP)', type: 'Per-diem', active: true,
    summary: 'Swallowing and speech evaluation and treatment across the region.',
    offices: ['Sacramento','Fresno'] },
  { title: 'Home Health Aide (HHA) / Caregiver', type: 'Flexible', active: true,
    summary: 'Personal care and companionship, from a few hours a day to 24-hour care.',
    offices: ['Sacramento','Walnut Creek','San Jose','Stockton','Monterey','Fresno'] },
  { title: 'Medical Social Worker (MSW)', type: 'Part-time', active: true,
    summary: 'Counselling, planning and community resource navigation for families.',
    offices: ['Sacramento','San Jose'] },
];

async function readOpenings(env) {
  const raw = await env.CONFIG.get('openings');
  if (raw) { try { return JSON.parse(raw); } catch (e) { /* corrupt: reseed below */ } }
  const seeded = { seeded: new Date().toISOString(), openings: DEFAULT_OPENINGS };
  await env.CONFIG.put('openings', JSON.stringify(seeded));
  return seeded;
}

/* ---------------- helpers ---------------- */
// Cheap, always-on security headers (no runtime cost, no extra requests).
const SECHEAD = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};
// Headers for HTML pages served by the Worker (admin, login, reset).
// The CSP restricts only framing, plugins and <base> injection — it does not
// constrain script/style/img sources, so it cannot break the pages.
const HTML_CSP = "frame-ancestors 'none'; object-src 'none'; base-uri 'none'";
function htmlHeaders(extra) {
  return Object.assign({ 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': HTML_CSP },
    SECHEAD, extra || {});
}
function corsHeaders(origin) {
  const ok = ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
const json = (o, cors = {}, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...SECHEAD, ...cors } });

// Per-IP throttle for unauthenticated endpoints. One KV read + write; fast.
async function tooMany(env, ip, bucket, max, ttl) {
  try {
    const key = 'rl:' + bucket + ':' + ip;
    const n = parseInt((await env.CONFIG.get(key)) || '0', 10);
    if (n >= max) return true;
    await env.CONFIG.put(key, String(n + 1), { expirationTtl: ttl });
    return false;
  } catch (e) { return false; }   // never block a real user on a KV hiccup
}

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const clean = (s, max = 2000) => String(s ?? '').slice(0, max).trim();

function toBase64(buf) {
  let s = '';
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}

/* ---------------- config (KV, editable from the dashboard) ---------------- */
// Seeded default so a fresh install already knows the standard US federal
// closures (observed office dates). Shown in Settings and fully editable; once
// an admin saves the field it becomes the source of truth (including empty).
const DEFAULT_HOLIDAYS_TEXT = [
  '2026-01-01 = New Year’s Day',
  '2026-01-19 = Martin Luther King Jr. Day',
  '2026-02-16 = Presidents’ Day',
  '2026-05-25 = Memorial Day',
  '2026-06-19 = Juneteenth National Independence Day',
  '2026-07-03 = Independence Day (observed)',
  '2026-09-07 = Labor Day',
  '2026-11-11 = Veterans Day',
  '2026-11-26 = Thanksgiving Day',
  '2026-11-27 = Day after Thanksgiving',
  '2026-12-25 = Christmas Day',
  '2027-01-01 = New Year’s Day',
  '2027-01-18 = Martin Luther King Jr. Day',
  '2027-02-15 = Presidents’ Day',
  '2027-05-31 = Memorial Day',
  '2027-06-18 = Juneteenth National Independence Day (observed)',
  '2027-07-05 = Independence Day (observed)',
  '2027-09-06 = Labor Day',
  '2027-11-11 = Veterans Day',
  '2027-11-25 = Thanksgiving Day',
  '2027-11-26 = Day after Thanksgiving',
  '2027-12-24 = Christmas Day (observed)',
].join('\n');

async function getConfig(env) {
  let saved = {};
  try { saved = JSON.parse((await env.CONFIG.get('config')) || '{}'); } catch (e) { saved = {}; }
  return {
    EMAIL_FROM: saved.EMAIL_FROM || env.EMAIL_FROM || 'ProHealth Home Care <no-reply@prohealth.us>',
    EMAIL_DEFAULT: saved.EMAIL_DEFAULT || env.EMAIL_DEFAULT || '',
    EMAIL_INTAKE: saved.EMAIL_INTAKE || env.EMAIL_INTAKE || '',
    EMAIL_HOSPICE: saved.EMAIL_HOSPICE || env.EMAIL_HOSPICE || '',
    EMAIL_CAREERS: saved.EMAIL_CAREERS || env.EMAIL_CAREERS || '',
    EMAIL_PRIVACY: saved.EMAIL_PRIVACY || env.EMAIL_PRIVACY || '',
    HOURS_OPEN: saved.HOURS_OPEN || '08:30',
    HOURS_CLOSE: saved.HOURS_CLOSE || '17:00',
    // respect an explicit saved value (even empty); only fall back to the seed
    // when the field has never been saved.
    HOLIDAYS_TEXT: saved.HOLIDAYS_TEXT !== undefined ? saved.HOLIDAYS_TEXT : DEFAULT_HOLIDAYS_TEXT,
  };
}

function routeEmail(cfg, text) {
  const s = String(text || '').toLowerCase();
  if (s.includes('hospice') || s.includes('palliative')) return cfg.EMAIL_HOSPICE || cfg.EMAIL_DEFAULT;
  if (s.includes('career') || s.includes('recruit') || s.includes('application')) return cfg.EMAIL_CAREERS || cfg.EMAIL_DEFAULT;
  if (s.includes('referral') || s.includes('provider') || s.includes('intake')) return cfg.EMAIL_INTAKE || cfg.EMAIL_DEFAULT;
  if (s.includes('privacy') || s.includes('data request')) return cfg.EMAIL_PRIVACY || cfg.EMAIL_DEFAULT;
  return cfg.EMAIL_DEFAULT;
}

async function sendEmail(env, cfg, to, subject, html, attachment) {
  if (!to || !env.RESEND_API_KEY) { console.log('email skipped: no recipient or no RESEND_API_KEY'); return; }
  const body = { from: cfg.EMAIL_FROM, to: to.split(',').map((s) => s.trim()).filter(Boolean), subject, html };
  if (attachment) body.attachments = [attachment];
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) console.log('Resend error', r.status, await r.text());
}

/* ---------------- acknowledgement email to the submitter ----------------
   A branded, email-client-safe (table + inline styles) confirmation sent to
   the person who submitted a lead / contact / application / data request. */
const ACK_PHONE = '877.667.8770';
function ackShell(headline, intro, rows, closing) {
  const rowsHtml = (rows || []).filter(Boolean).map(function (r) {
    return '<tr><td style="padding:4px 0;color:#5D6E80;font:600 13px Arial,sans-serif;width:130px;vertical-align:top">' + esc(r[0]) +
      '</td><td style="padding:4px 0;color:#0F2233;font:400 14px Arial,sans-serif">' + esc(r[1]) + '</td></tr>';
  }).join('');
  return '<!doctype html><html><body style="margin:0;background:#EEF5F9;padding:24px 0">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF5F9"><tr><td align="center">' +
    '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E1E8EF">' +
    // header
    '<tr><td style="background:#0B3A52;background:linear-gradient(135deg,#0B3A52,#138AC0);padding:22px 28px">' +
    '<img src="https://prohealth.us/assets/logo-white.png" alt="ProHealth Home Care" height="30" style="height:30px;display:block"></td></tr>' +
    // body
    '<tr><td style="padding:28px">' +
    '<h1 style="margin:0 0 10px;color:#0B3A52;font:700 21px Arial,sans-serif">' + esc(headline) + '</h1>' +
    '<p style="margin:0 0 18px;color:#3B4A57;font:400 15px/1.6 Arial,sans-serif">' + intro + '</p>' +
    (rowsHtml ? '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#F6FAFC;border:1px solid #E4EEF4;border-radius:10px;padding:6px 14px;margin-bottom:18px"><tr><td><table role="presentation" width="100%">' + rowsHtml + '</table></td></tr></table>' : '') +
    '<p style="margin:0 0 4px;color:#3B4A57;font:400 15px/1.6 Arial,sans-serif">' + closing + '</p>' +
    '<p style="margin:18px 0 0;color:#3B4A57;font:400 15px/1.6 Arial,sans-serif">Warm regards,<br><b style="color:#0B3A52">The ProHealth Home Care Team</b></p>' +
    '<div style="margin-top:22px;text-align:center"><a href="tel:+18776678770" style="display:inline-block;background:#138AC0;color:#fff;text-decoration:none;font:700 14px Arial,sans-serif;padding:11px 22px;border-radius:9px">Call us: ' + ACK_PHONE + '</a></div>' +
    '</td></tr>' +
    // footer
    '<tr><td style="background:#F8FAFB;border-top:1px solid #E4E9EF;padding:18px 28px;color:#8494A2;font:400 12px/1.6 Arial,sans-serif">' +
    'ProHealth Home Care, Inc. &middot; Sacramento, California &middot; ' + ACK_PHONE + '<br>' +
    'This is an automated confirmation. Please do not reply. For anything urgent, call us any time; our on-call clinical line is staffed 24/7.<br>' +
    'This message may reference protected health information. If it reached you in error, please delete it.' +
    '</td></tr></table></td></tr></table></body></html>';
}
function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || 'there'; }

async function sendAck(env, cfg, to, subject, html) {
  if (!to) return;
  try { await sendEmail(env, cfg, to, subject, html); }
  catch (e) { console.log('ack email failed', e.message); }   // never fail the submission on an ack
}

/* ---------------- POST /leads ---------------- */
async function handleLead(req, env, cors) {
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  if (await tooMany(env, ip, 'form', 20, 600)) return json({ error: 'Too many submissions. Please try again in a few minutes.' }, cors, 429);
  const d = await req.json();
  if (!clean(d.name) || !clean(d.phone)) return json({ error: 'name and phone required' }, cors, 400);
  const cfg = await getConfig(env);
  const id = crypto.randomUUID();

  await env.DB.prepare(
    'INSERT INTO leads (id, type, service, name, phone, email, message, page, created_at) ' +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
  ).bind(id, clean(d.type, 40) || 'lead', clean(d.service, 80), clean(d.name, 120), clean(d.phone, 40),
         clean(d.email, 160), clean(d.message || d.notes, 4000), clean(d.page, 200)).run();

  await sendEmail(env, cfg, routeEmail(cfg, (d.service || '') + ' ' + (d.type || '')),
    'New ' + (d.type || 'lead') + ': ' + clean(d.name, 60) + ' | ' + (clean(d.service, 40) || 'General'),
    '<h2>New website lead</h2>' +
    '<p><b>Name:</b> ' + esc(d.name) + '<br><b>Phone:</b> ' + esc(d.phone) + '<br>' +
    '<b>Service:</b> ' + esc(d.service || '-') + '<br><b>Type:</b> ' + esc(d.type || '-') + '<br>' +
    '<b>Email:</b> ' + esc(d.email || '-') + '<br><b>Page:</b> ' + esc(d.page || '-') + '</p>' +
    '<p><b>Message:</b><br>' + esc(d.message || d.notes || '-') + '</p>' +
    '<p style="color:#888">Lead ' + id + '. Open the dashboard to set status and add notes.</p>');

  if (clean(d.email)) {
    const isContact = (d.type || '') === 'contact';
    await sendAck(env, cfg, clean(d.email, 160),
      isContact ? 'We received your message — ProHealth Home Care' : 'Thanks for reaching out — ProHealth Home Care',
      ackShell(
        'Hi ' + firstName(d.name) + ", we've got it.",
        isContact
          ? 'Thank you for contacting ProHealth Home Care. Your message has reached our team and a care coordinator will get back to you, usually the same business day.'
          : 'Thank you for reaching out about home health care. Your request is with our care team and we will be in touch shortly to help.',
        [ ['Service', d.service || '—'], d.message ? ['Your message', d.message] : null ],
        'If you need anything in the meantime, just call us at ' + ACK_PHONE + '.'));
  }
  return json({ ok: true, id }, cors);
}

/* ---------------- POST /applications ---------------- */
async function handleApplication(req, env, cors) {
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  if (await tooMany(env, ip, 'form', 20, 600)) return json({ error: 'Too many submissions. Please try again in a few minutes.' }, cors, 429);
  const form = await req.formData();
  const name = clean(form.get('name'), 120), phone = clean(form.get('phone'), 40);
  if (!name || !phone) return json({ error: 'name and phone required' }, cors, 400);
  const cfg = await getConfig(env);
  const id = crypto.randomUUID();

  const resume = form.get('resume');
  let resumeKey = '', attachment = null;
  if (resume && typeof resume === 'object' && resume.size) {
    const isPdf = resume.type === 'application/pdf' || /\.pdf$/i.test(resume.name || '');
    if (!isPdf) return json({ error: 'resume must be a PDF' }, cors, 400);
    if (resume.size > 2 * 1024 * 1024) return json({ error: 'resume too large, 2MB maximum' }, cors, 400);
    resumeKey = 'resumes/' + id + '-' + (resume.name || 'resume.pdf').replace(/[^\w.-]/g, '_');
    const buf = await resume.arrayBuffer();
    await env.RESUMES.put(resumeKey, buf, { httpMetadata: { contentType: 'application/pdf' } });
    attachment = { filename: resume.name || 'resume.pdf', content: toBase64(buf) };
  }

  await env.DB.prepare(
    'INSERT INTO applications (id, name, phone, email, role, office, license, resume_key, created_at) ' +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
  ).bind(id, name, phone, clean(form.get('email'), 160), clean(form.get('role'), 80),
         clean(form.get('office'), 60), clean(form.get('license'), 60), resumeKey).run();

  await sendEmail(env, cfg, cfg.EMAIL_CAREERS || cfg.EMAIL_DEFAULT,
    'New application: ' + name + ' | ' + (clean(form.get('role'), 40) || 'General'),
    '<h2>New job application</h2>' +
    '<p><b>Name:</b> ' + esc(name) + '<br><b>Phone:</b> ' + esc(phone) + '<br>' +
    '<b>Email:</b> ' + esc(form.get('email') || '-') + '<br><b>Role:</b> ' + esc(form.get('role') || '-') + '<br>' +
    '<b>Office:</b> ' + esc(form.get('office') || '-') + '<br><b>License:</b> ' + esc(form.get('license') || '-') + '<br>' +
    '<b>Resume:</b> ' + (resumeKey ? 'attached' : 'not provided') + '</p>' +
    '<p style="color:#888">Application ' + id + '</p>', attachment);

  const appEmail = clean(form.get('email'), 160);
  if (appEmail) {
    await sendAck(env, cfg, appEmail, 'We received your application — ProHealth Home Care',
      ackShell(
        'Hi ' + firstName(name) + ', thanks for applying!',
        "We've received your application to join ProHealth Home Care. Our recruiting team will review it and reach out, usually within one business day.",
        [ ['Role', clean(form.get('role'), 80) || 'General'], ['Résumé', resumeKey ? 'Received' : 'Not attached'] ],
        'We look forward to speaking with you. Questions? Call us at ' + ACK_PHONE + '.'));
  }
  return json({ ok: true, id }, cors);
}

/* ---------------- POST /data-requests ---------------- */
async function handleDataRequest(req, env, cors) {
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  if (await tooMany(env, ip, 'form', 20, 600)) return json({ error: 'Too many submissions. Please try again in a few minutes.' }, cors, 429);
  const d = await req.json();
  if (!clean(d.name) || !clean(d.email)) return json({ error: 'name and email required' }, cors, 400);
  const cfg = await getConfig(env);
  const id = crypto.randomUUID();
  const ref = 'DR-' + Date.now().toString(36).toUpperCase();
  const due = new Date(Date.now() + 45 * 864e5).toISOString();

  await env.DB.prepare(
    'INSERT INTO data_requests (id, ref, request_type, relationship, name, dob, email, phone, details, is_agent, due_by, created_at) ' +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
  ).bind(id, ref, clean(d.request_type, 160), clean(d.relationship, 80), clean(d.name, 120),
         clean(d.dob, 20), clean(d.email, 160), clean(d.phone, 40), clean(d.details, 4000),
         d.is_agent ? 1 : 0, due).run();

  await sendEmail(env, cfg, cfg.EMAIL_PRIVACY || cfg.EMAIL_DEFAULT,
    '[' + ref + '] Data request from ' + clean(d.name, 60) + ', respond by ' + due.slice(0, 10),
    '<h2>Privacy data request</h2>' +
    '<p><b>Reference:</b> ' + esc(ref) + '<br><b>Request:</b> ' + esc(d.request_type) + '<br>' +
    '<b>Relationship:</b> ' + esc(d.relationship || '-') + '<br><b>Name:</b> ' + esc(d.name) + '<br>' +
    '<b>Email:</b> ' + esc(d.email) + '<br><b>Phone:</b> ' + esc(d.phone || '-') + '<br>' +
    '<b>DOB:</b> ' + esc(d.dob || '-') + '<br><b>Authorised agent:</b> ' + (d.is_agent ? 'Yes' : 'No') + '</p>' +
    '<p><b>Details:</b><br>' + esc(d.details || '-') + '</p>' +
    '<p style="color:#C0392B"><b>CCPA clock:</b> acknowledge within 10 business days, respond by ' + due.slice(0, 10) + '.</p>');

  await sendAck(env, cfg, clean(d.email, 160), '[' + ref + '] We received your privacy request — ProHealth Home Care',
    ackShell(
      'Hi ' + firstName(d.name) + ', your request is logged.',
      "We've received your privacy request and opened it under the reference below. We will acknowledge it within 10 business days and respond within 45 calendar days, as required by California law (CCPA/CPRA).",
      [ ['Reference', ref], ['Request type', d.request_type || '—'], ['Logged', due.slice(0, 10) ? new Date().toISOString().slice(0, 10) : '' ] ],
      'If you have questions about this request, call us at ' + ACK_PHONE + ' and reference ' + ref + '.'));
  return json({ ok: true, id, ref }, cors);
}

/* ---------------- admin API ---------------- */
const TABLE = { leads: 'leads', applications: 'applications', requests: 'data_requests' };
// Columns an admin may edit per table (name -> max length). Keys are a fixed
// whitelist, so they are safe to interpolate into the UPDATE statement.
const EDITABLE = {
  leads:         { name: 120, phone: 40, email: 160, service: 80, message: 4000, type: 40 },
  applications:  { name: 120, phone: 40, email: 160, role: 80, office: 60, license: 60 },
  data_requests: { name: 120, email: 160, phone: 40, request_type: 160, relationship: 80, dob: 20, details: 4000 },
};

async function adminApi(req, env, path, url, who) {
  if (path === '/all' && req.method === 'GET') {
    const [l, a, d] = await Promise.all([
      env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 500').all(),
      env.DB.prepare('SELECT * FROM applications ORDER BY created_at DESC LIMIT 500').all(),
      env.DB.prepare('SELECT * FROM data_requests ORDER BY created_at DESC LIMIT 500').all(),
    ]);
    return json({ user: who, super: isSuper(who, env), leads: l.results || [], applications: a.results || [], data_requests: d.results || [] });
  }

  const m = path.match(/^\/(leads|applications|requests)\/([\w-]+)$/);
  if (m && req.method === 'DELETE') {
    const table = TABLE[m[1]], id = m[2];
    if (table === 'applications') {
      const row = (await env.DB.prepare('SELECT resume_key FROM applications WHERE id = ?').bind(id).all()).results[0];
      if (row && row.resume_key) { try { await env.RESUMES.delete(row.resume_key); } catch (e) {} }
    }
    await env.DB.prepare('DELETE FROM ' + table + ' WHERE id = ?').bind(id).run();
    await audit(env, who, 'delete ' + table, id, '');
    return json({ ok: true });
  }
  if (m && req.method === 'PATCH') {
    const table = TABLE[m[1]], id = m[2];
    const b = await req.json();
    const sets = [], vals = [];
    if (b.status !== undefined) {
      if (['new', 'contacted', 'converted', 'closed', 'archived'].indexOf(b.status) === -1) return json({ error: 'bad status' }, {}, 400);
      sets.push('status = ?'); vals.push(b.status);
    }
    if (b.notes !== undefined) { sets.push('notes = ?'); vals.push(clean(b.notes, 8000)); }
    const editable = EDITABLE[table] || {};
    for (const k in editable) if (b[k] !== undefined) { sets.push(k + ' = ?'); vals.push(clean(b[k], editable[k])); }
    if (!sets.length) return json({ error: 'nothing to update' }, {}, 400);
    vals.push(id);
    await env.DB.prepare('UPDATE ' + table + ' SET ' + sets.join(', ') + ' WHERE id = ?').bind(...vals).run();
    await audit(env, who, 'update ' + table, id, JSON.stringify(b).slice(0, 300));
    return json({ ok: true });
  }

  if (path === '/resume' && req.method === 'GET') {
    const key = url.searchParams.get('key') || '';
    if (key.indexOf('resumes/') !== 0 || key.indexOf('..') !== -1) return json({ error: 'bad key' }, {}, 400);
    const obj = await env.RESUMES.get(key);
    if (!obj) return json({ error: 'not found' }, {}, 404);
    await audit(env, who, 'download resume', key, '');
    return new Response(obj.body, {
      headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store',
                 'Content-Disposition': 'inline; filename="' + key.split('/').pop() + '"' },
    });
  }


  /* GET /find?email=  what do we hold on this person? */
  if (path === '/find' && req.method === 'GET') {
    const email = (url.searchParams.get('email') || '').trim().toLowerCase();
    if (!email || email.indexOf('@') === -1) return json({ error: 'a valid email is required' }, {}, 400);
    const like = '%' + email + '%';
    const [l, a, d] = await Promise.all([
      env.DB.prepare('SELECT id,name,phone,email,service,type,created_at FROM leads WHERE lower(email) LIKE ?').bind(like).all(),
      env.DB.prepare('SELECT id,name,phone,email,role,resume_key,created_at FROM applications WHERE lower(email) LIKE ?').bind(like).all(),
      env.DB.prepare('SELECT id,ref,name,email,request_type,created_at FROM data_requests WHERE lower(email) LIKE ?').bind(like).all(),
    ]);
    await audit(env, who, 'search by email', email, '');
    return json({ email, leads: l.results || [], applications: a.results || [], data_requests: d.results || [] });
  }

  /* POST /erase  {email, what:['leads','applications','resumes']}  permanent */
  if (path === '/erase' && req.method === 'POST') {
    const b = await req.json();
    const email = String(b.email || '').trim().toLowerCase();
    if (!email || email.indexOf('@') === -1) return json({ error: 'a valid email is required' }, {}, 400);
    const what = Array.isArray(b.what) ? b.what : [];
    const like = '%' + email + '%';
    const done = {};

    if (what.indexOf('resumes') !== -1 || what.indexOf('applications') !== -1) {
      // delete the files before the rows, or we lose the keys
      const rs = await env.DB.prepare('SELECT resume_key FROM applications WHERE lower(email) LIKE ? AND resume_key != ""').bind(like).all();
      let n = 0;
      for (const r of (rs.results || [])) { try { await env.RESUMES.delete(r.resume_key); n++; } catch (e) {} }
      done.resumes = n;
    }
    if (what.indexOf('leads') !== -1) {
      const r = await env.DB.prepare('DELETE FROM leads WHERE lower(email) LIKE ?').bind(like).run();
      done.leads = (r.meta && r.meta.changes) || 0;
    }
    if (what.indexOf('applications') !== -1) {
      const r = await env.DB.prepare('DELETE FROM applications WHERE lower(email) LIKE ?').bind(like).run();
      done.applications = (r.meta && r.meta.changes) || 0;
    }
    // The request itself is kept on purpose: it is the evidence you complied.
    await audit(env, who, 'ERASE personal data', email, JSON.stringify(done));
    return json({ ok: true, email, deleted: done });
  }

  if (path === '/openings') {
    if (req.method === 'GET') return json(await readOpenings(env));
    if (req.method === 'PUT') {
      const b = await req.json();
      if (!Array.isArray(b.openings)) return json({ error: 'openings must be an array' }, {}, 400);
      const cleaned = b.openings.slice(0, 60).map(function (o) {
        return { title: clean(o.title, 120), type: clean(o.type, 40), summary: clean(o.summary, 400),
                 offices: (o.offices || []).slice(0, 12).map(function (x) { return clean(x, 60); }),
                 active: o.active !== false };
      }).filter(function (o) { return o.title; });
      await env.CONFIG.put('openings', JSON.stringify({ updated: new Date().toISOString(), openings: cleaned }));
      await audit(env, who, 'update openings', '', cleaned.length + ' roles');
      return json({ ok: true, count: cleaned.length });
    }
  }

  if (path === '/config') {
    if (req.method === 'GET') return json(await getConfig(env));
    if (req.method === 'PUT') {
      const b = await req.json();
      const keep = ['EMAIL_FROM', 'EMAIL_DEFAULT', 'EMAIL_INTAKE', 'EMAIL_HOSPICE', 'EMAIL_CAREERS',
                    'EMAIL_PRIVACY', 'HOURS_OPEN', 'HOURS_CLOSE', 'HOLIDAYS_TEXT'];
      // Merge onto the existing config so a partial save (e.g. just holidays)
      // never wipes the other settings.
      let out = {};
      try { out = JSON.parse((await env.CONFIG.get('config')) || '{}'); } catch (e) { out = {}; }
      const changed = [];
      for (const k of keep) if (b[k] !== undefined) { out[k] = clean(b[k], 4000); changed.push(k); }
      await env.CONFIG.put('config', JSON.stringify(out));
      await audit(env, who, 'update config', '', changed.join(','));
      return json({ ok: true });
    }
  }

  /* Promote a contact/lead into a job application (contact triage). */
  const promo = path.match(/^\/leads\/([\w-]+)\/to-application$/);
  if (promo && req.method === 'POST') {
    const lid = promo[1];
    const lead = (await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(lid).all()).results[0];
    if (!lead) return json({ error: 'lead not found' }, {}, 404);
    const aid = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO applications (id, name, phone, email, role, office, license, resume_key, created_at) ' +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
    ).bind(aid, clean(lead.name, 120), clean(lead.phone, 40), clean(lead.email, 160),
           clean(lead.service, 80), '', '', '').run();
    // mark the source contact as handled so it leaves the queue
    await env.DB.prepare("UPDATE leads SET status = 'converted' WHERE id = ?").bind(lid).run();
    await audit(env, who, 'promote contact to applicant', lid, aid);
    return json({ ok: true, id: aid });
  }

  /* Usage / edit log (owner only). */
  if (path === '/audit' && req.method === 'GET') {
    if (!isSuper(who, env)) return json({ error: 'Only the owner can view the activity log.' }, {}, 403);
    const r = await env.DB.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 500').all();
    return json({ log: r.results || [] });
  }

  /* Diagnostic: send a real test email and report exactly what Resend says. */
  if (path === '/test-email' && req.method === 'POST') {
    const b = await req.json().catch(function () { return {}; });
    const to = clean(b.to, 160);
    if (!to || to.indexOf('@') === -1) return json({ ok: false, error: 'Enter a valid recipient email address.' }, {}, 400);
    if (!env.RESEND_API_KEY) return json({ ok: false, error: 'No RESEND_API_KEY is set on the Worker, so no email can be sent. Run: wrangler secret put RESEND_API_KEY' });
    const cfg = await getConfig(env);
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: cfg.EMAIL_FROM, to: [to], subject: 'ProHealth admin — test email',
          html: ackShell('It works.', 'This is a test from the ProHealth admin dashboard. If you are reading it, outbound email is configured correctly.',
            [ ['Requested by', who], ['From', cfg.EMAIL_FROM] ], 'You can ignore this message.') }),
      });
      const txt = await r.text();
      if (r.ok) { await audit(env, who, 'send test email', to, ''); return json({ ok: true, to: to }); }
      // Surface Resend's real reason (e.g. domain not verified) to the admin.
      let reason = txt; try { const j = JSON.parse(txt); reason = j.message || j.name || txt; } catch (e) {}
      return json({ ok: false, status: r.status, error: String(reason).slice(0, 400) });
    } catch (e) { return json({ ok: false, error: e.message }); }
  }

  /* ---------------- backend access: admin accounts (super-admins only) ---------------- */
  if (path === '/admins' || path.indexOf('/admins/') === 0) {
    if (!isSuper(who, env)) return json({ error: 'Only the owner can manage admin access.' }, {}, 403);
    const origin = url.origin;

    if (path === '/admins' && req.method === 'GET') {
      const list = await getAdmins(env);
      const view = list.map((a) => ({
        email: a.email, hasPassword: !!a.passHash, disabled: !!a.disabled,
        super: isSuper(a.email, env), role: roleOf(a.email, env), createdAt: a.createdAt || '', createdBy: a.createdBy || '',
      }));
      // Always surface the protected owner/super accounts, even before they have a password.
      const have = view.map((v) => v.email);
      for (const s of SUPER_EMAILS) if (have.indexOf(s) === -1)
        view.unshift({ email: s, hasPassword: false, disabled: false, super: true, role: roleOf(s, env), createdAt: '', createdBy: '' });
      return json({ admins: view, emailConfigured: !!env.RESEND_API_KEY, domain: 'prohealth.us' });
    }

    if (path === '/admins' && req.method === 'POST') {
      const b = await req.json();
      const email = String(b.email || '').trim().toLowerCase();
      if (!isProhealthEmail(email)) return json({ error: 'Only @prohealth.us addresses can be added.' }, {}, 400);
      const mode = b.mode || 'magic';   // 'magic' | 'manual' | 'silent'

      if (mode === 'manual') {
        const pass = String(b.password || '');
        if (pass.length < 10) return json({ error: 'Password must be at least 10 characters.' }, {}, 400);
        await setAdminPassword(env, email, pass);
        await upsertAdmin(env, { email, createdBy: who });
        await audit(env, who, 'add admin (password set)', email, '');
        return json({ ok: true, email, sent: false });
      }
      if (!(await getAdmin(env, email))) await upsertAdmin(env, { email, createdBy: who, pending: true });
      if (mode === 'silent') { await audit(env, who, 'add admin (no notify)', email, ''); return json({ ok: true, email, sent: false }); }

      // magic: email a set-password link
      const token = await createResetToken(env, email);
      const cfg = await getConfig(env);
      await sendEmail(env, cfg, email, 'Set up your ProHealth admin access',
        '<p>You have been given access to the ProHealth admin dashboard.</p>' +
        '<p><a href="' + origin + '/admin/reset?token=' + token + '">Set your password</a> ' +
        '(valid for 1 hour), then sign in at ' + origin + '/admin with your email.</p>');
      await audit(env, who, 'add admin (magic link)', email, '');
      return json({ ok: true, email, sent: !!env.RESEND_API_KEY });
    }

    if (path === '/admins/reset' && req.method === 'POST') {
      const b = await req.json();
      const email = String(b.email || '').trim().toLowerCase();
      if (!isProhealthEmail(email)) return json({ error: 'bad email' }, {}, 400);
      if (!(await getAdmin(env, email)) && !isSuper(email, env)) return json({ error: 'not an admin' }, {}, 404);
      const token = await createResetToken(env, email);
      const cfg = await getConfig(env);
      await sendEmail(env, cfg, email, 'Reset your ProHealth admin password',
        '<p>A password reset was requested for your ProHealth admin account.</p>' +
        '<p><a href="' + origin + '/admin/reset?token=' + token + '">Set a new password</a> (valid for 1 hour).</p>');
      await audit(env, who, 'send reset link', email, '');
      return json({ ok: true, sent: !!env.RESEND_API_KEY });
    }

    if (path === '/admins/set-password' && req.method === 'POST') {
      const b = await req.json();
      const email = String(b.email || '').trim().toLowerCase();
      const pass = String(b.password || '');
      if (!isProhealthEmail(email)) return json({ error: 'bad email' }, {}, 400);
      if (pass.length < 10) return json({ error: 'Password must be at least 10 characters.' }, {}, 400);
      await setAdminPassword(env, email, pass);
      await audit(env, who, 'set admin password', email, '');
      return json({ ok: true });
    }

    const rm = path.match(/^\/admins\/([^/]+)$/);
    if (rm && req.method === 'DELETE') {
      const email = decodeURIComponent(rm[1]).toLowerCase();
      if (isSuper(email, env)) return json({ error: 'The owner account cannot be removed.' }, {}, 400);
      await removeAdmin(env, email);
      await audit(env, who, 'remove admin', email, '');
      return json({ ok: true });
    }
  }

  return json({ error: 'not found' }, {}, 404);
}

async function handleForgot(req, env) {
  // Light per-IP cap so this can't be used to flood an admin's inbox.
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  try {
    const key = 'forgot:' + ip;
    const n = parseInt((await env.CONFIG.get(key)) || '0', 10);
    if (n >= 5) return json({ ok: true });         // silently drop; never reveal
    await env.CONFIG.put(key, String(n + 1), { expirationTtl: 3600 });
  } catch (e) { /* never block on a KV hiccup */ }

  let b = {};
  try { b = await req.json(); } catch (e) { /* fallthrough */ }
  const email = String(b.email || '').trim().toLowerCase();
  // Only act for real admins, but always return ok so we never reveal who exists.
  if (isProhealthEmail(email) && ((await getAdmin(env, email)) || isSuper(email, env))) {
    const token = await createResetToken(env, email);
    const cfg = await getConfig(env);
    await sendEmail(env, cfg, email, 'Reset your ProHealth admin password',
      '<p>Someone requested a password reset for your ProHealth admin account.</p>' +
      '<p><a href="' + new URL(req.url).origin + '/admin/reset?token=' + token + '">Set a new password</a> ' +
      '(valid for 1 hour). If this wasn’t you, you can ignore this email.</p>');
  }
  return json({ ok: true });
}

async function handleReset(req, env) {
  if (req.method === 'GET') {
    return new Response(RESET_HTML, { headers: htmlHeaders() });
  }
  if (req.method === 'POST') {
    let b = {};
    try { b = await req.json(); } catch (e) { return json({ error: 'bad request' }, {}, 400); }
    const token = String(b.token || '');
    const pass = String(b.password || '');
    const email = await readResetToken(env, token);
    if (!email) return json({ error: 'This link has expired. Ask for a new one.' }, {}, 400);
    if (pass.length < 10) return json({ error: 'Password must be at least 10 characters.' }, {}, 400);
    await setAdminPassword(env, email, pass);
    await deleteResetToken(env, token);
    await audit(env, email, 'password set via reset link', email, '');
    return json({ ok: true });
  }
  return json({ error: 'method not allowed' }, {}, 405);
}

async function audit(env, who, action, target, detail) {
  try {
    await env.DB.prepare(
      'INSERT INTO audit_log (id, actor, action, target, detail, created_at) ' +
      "VALUES (?, ?, ?, ?, ?, datetime('now'))"
    ).bind(crypto.randomUUID(), who, action, target, detail).run();
  } catch (e) { console.log('audit failed', e.message); }
}
