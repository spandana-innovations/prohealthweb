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
import { requireAdmin, handleLogin, handleLogout } from './auth.js';

const ALLOWED_ORIGINS = [
  'https://prohealth.us',
  'https://www.prohealth.us',
  'https://prohealth.pages.dev',
  'http://localhost:3000',
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
      if (p === '/admin' || p === '/admin/') {
        const who = await requireAdmin(req, env);
        if (who instanceof Response) return who;
        return new Response(ADMIN_HTML, {
          headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store',
                     'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY' },
        });
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
function corsHeaders(origin) {
  const ok = ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
const json = (o, cors = {}, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors } });

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
async function getConfig(env) {
  let saved = {};
  try { saved = JSON.parse((await env.CONFIG.get('config')) || '{}'); } catch (e) { saved = {}; }
  return {
    EMAIL_FROM: saved.EMAIL_FROM || env.EMAIL_FROM || 'ProHealth Website <no-reply@prohealth.us>',
    EMAIL_DEFAULT: saved.EMAIL_DEFAULT || env.EMAIL_DEFAULT || '',
    EMAIL_INTAKE: saved.EMAIL_INTAKE || env.EMAIL_INTAKE || '',
    EMAIL_HOSPICE: saved.EMAIL_HOSPICE || env.EMAIL_HOSPICE || '',
    EMAIL_CAREERS: saved.EMAIL_CAREERS || env.EMAIL_CAREERS || '',
    EMAIL_PRIVACY: saved.EMAIL_PRIVACY || env.EMAIL_PRIVACY || '',
    HOURS_OPEN: saved.HOURS_OPEN || '08:30',
    HOURS_CLOSE: saved.HOURS_CLOSE || '17:00',
    HOLIDAYS_TEXT: saved.HOLIDAYS_TEXT || '',
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

/* ---------------- POST /leads ---------------- */
async function handleLead(req, env, cors) {
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
  return json({ ok: true, id }, cors);
}

/* ---------------- POST /applications ---------------- */
async function handleApplication(req, env, cors) {
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
  return json({ ok: true, id }, cors);
}

/* ---------------- POST /data-requests ---------------- */
async function handleDataRequest(req, env, cors) {
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
  return json({ ok: true, id, ref }, cors);
}

/* ---------------- admin API ---------------- */
const TABLE = { leads: 'leads', applications: 'applications', requests: 'data_requests' };

async function adminApi(req, env, path, url, who) {
  if (path === '/all' && req.method === 'GET') {
    const [l, a, d] = await Promise.all([
      env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 500').all(),
      env.DB.prepare('SELECT * FROM applications ORDER BY created_at DESC LIMIT 500').all(),
      env.DB.prepare('SELECT * FROM data_requests ORDER BY created_at DESC LIMIT 500').all(),
    ]);
    return json({ user: who, leads: l.results || [], applications: a.results || [], data_requests: d.results || [] });
  }

  const m = path.match(/^\/(leads|applications|requests)\/([\w-]+)$/);
  if (m && req.method === 'PATCH') {
    const table = TABLE[m[1]], id = m[2];
    const b = await req.json();
    const sets = [], vals = [];
    if (b.status !== undefined) {
      if (['new', 'contacted', 'converted', 'closed'].indexOf(b.status) === -1) return json({ error: 'bad status' }, {}, 400);
      sets.push('status = ?'); vals.push(b.status);
    }
    if (b.notes !== undefined) { sets.push('notes = ?'); vals.push(clean(b.notes, 8000)); }
    if (!sets.length) return json({ error: 'nothing to update' }, {}, 400);
    vals.push(id);
    const stmt = env.DB.prepare('UPDATE ' + table + ' SET ' + sets.join(', ') + ' WHERE id = ?');
    await stmt.bind(...vals).run();
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
      const out = {};
      for (const k of keep) if (b[k] !== undefined) out[k] = clean(b[k], 4000);
      await env.CONFIG.put('config', JSON.stringify(out));
      await audit(env, who, 'update config', '', Object.keys(out).join(','));
      return json({ ok: true });
    }
  }

  return json({ error: 'not found' }, {}, 404);
}

async function audit(env, who, action, target, detail) {
  try {
    await env.DB.prepare(
      'INSERT INTO audit_log (id, actor, action, target, detail, created_at) ' +
      "VALUES (?, ?, ?, ?, ?, datetime('now'))"
    ).bind(crypto.randomUUID(), who, action, target, detail).run();
  } catch (e) { console.log('audit failed', e.message); }
}
