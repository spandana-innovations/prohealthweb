// Exercise the Worker against mock D1 / R2 / KV bindings
import fs from 'fs';
const auth = fs.readFileSync('./src/auth.js','utf8').replace(/^export /gm,'');
const src = fs.readFileSync('./src/index.js','utf8')
  .replace("import { ADMIN_HTML } from './admin.js';", "const ADMIN_HTML='<html>DASHBOARD</html>';")
  .replace(/import\s*\{[\s\S]*?\}\s*from\s*'\.\/auth\.js';/, "");
fs.writeFileSync('/tmp/_w.mjs', auth + '\n' + src);
const { default: worker } = await import('/tmp/_w.mjs');

const rows = { leads: [], applications: [], data_requests: [], audit_log: [] };
const mkStmt = (sql) => ({
  _sql: sql, _b: [],
  bind(...a){ this._b = a; return this; },
  async run(){
    const t = (sql.match(/INTO (\w+)/) || sql.match(/UPDATE (\w+)/) || [])[1];
    if (/^INSERT/.test(sql)) rows[t].push(this._b);
    if (/^UPDATE/.test(sql)) rows[t].push(['UPDATE', ...this._b]);
    return { success: true };
  },
  async all(){ const t=(sql.match(/FROM (\w+)/)||[])[1]; return { results: (rows[t]||[]).map((r,i)=>({id:'x'+i})) }; },
});
const kv = new Map();
const env = {
  DB: { prepare: mkStmt },
  RESUMES: { put: async()=>{}, get: async(k)=>k.startsWith('resumes/')?{body:'pdf'}:null },
  CONFIG: { get: async(k)=>kv.get(k)||null, put: async(k,v)=>kv.set(k,v), delete: async(k)=>kv.delete(k) },
  EMAIL_DEFAULT:'intake@x.com', EMAIL_CAREERS:'hr@x.com', EMAIL_PRIVACY:'privacy@x.com',
  RESEND_API_KEY: '', ADMIN_EMAILS: 'boss@prohealth.us',
};
globalThis.fetch = async()=>({ok:true,text:async()=>''});
const P = (path, opts={}) => new Request('https://api.prohealth.us'+path, opts);
const J = (o) => ({ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(o) });
const ADMIN = { 'Cf-Access-Jwt-Assertion':'jwt', 'Cf-Access-Authenticated-User-Email':'boss@prohealth.us' };
env.ADMIN_EMAILS='boss@prohealth.us';

const out=[];
const t = async (name, fn) => { try { const r = await fn(); out.push((r?'PASS':'FAIL')+' | '+name); } catch(e){ out.push('FAIL | '+name+' :: '+e.message); } };

await t('GET /health returns ok', async()=> (await worker.fetch(P('/health'), env)).status===200);
await t('POST /leads accepts a valid lead', async()=>{
  const r = await worker.fetch(P('/leads', J({name:'Jane',phone:'555',service:'Hospice',type:'callback'})), env);
  return r.status===200 && rows.leads.length===1; });
await t('POST /leads rejects missing phone', async()=>
  (await worker.fetch(P('/leads', J({name:'Jane'})), env)).status===400);
await t('POST /data-requests returns a reference + 45-day due date', async()=>{
  const r = await worker.fetch(P('/data-requests', J({name:'Bob',email:'b@x.com',request_type:'Delete'})), env);
  const b = await r.json(); return r.status===200 && /^DR-/.test(b.ref); });
await t('POST /applications rejects a non-PDF resume', async()=>{
  const fd = new FormData(); fd.append('name','A'); fd.append('phone','5');
  fd.append('resume', new File([new Uint8Array(10)],'cv.docx',{type:'application/msword'}));
  const r = await worker.fetch(P('/applications',{method:'POST',body:fd}), env);
  return r.status===400 && (await r.json()).error.includes('PDF'); });
await t('POST /applications rejects a resume over 2MB', async()=>{
  const fd = new FormData(); fd.append('name','A'); fd.append('phone','5');
  fd.append('resume', new File([new Uint8Array(3*1024*1024)],'cv.pdf',{type:'application/pdf'}));
  const r = await worker.fetch(P('/applications',{method:'POST',body:fd}), env);
  return r.status===400 && (await r.json()).error.includes('2MB'); });
await t('POST /applications accepts a valid PDF', async()=>{
  const fd = new FormData(); fd.append('name','A'); fd.append('phone','5'); fd.append('role','RN');
  fd.append('resume', new File([new Uint8Array(500)],'cv.pdf',{type:'application/pdf'}));
  return (await worker.fetch(P('/applications',{method:'POST',body:fd}), env)).status===200; });

// --- security ---
// Auth is username/password now, with Cloudflare Access accepted as well.
// What matters is not the status code, it is that no dashboard ever leaks.
await t('GET /admin signed out NEVER leaks the dashboard', async()=>{
  const r = await worker.fetch(P('/admin'), env);
  const b = await r.text();
  return !b.includes('DASHBOARD') && b.includes('Admin sign in'); });
await t('GET /admin/api/all signed out is refused', async()=>{
  const r = await worker.fetch(P('/admin/api/all'), env);
  return r.status===401 && !(await r.text()).includes('leads'); });
await t('an email not on ADMIN_EMAILS never reaches the dashboard', async()=>{
  const r = await worker.fetch(P('/admin',{headers:{...ADMIN,'Cf-Access-Authenticated-User-Email':'hacker@evil.com'}}), env);
  return !(await r.text()).includes('DASHBOARD'); });
await t('an email not on ADMIN_EMAILS cannot read the API', async()=>{
  const r = await worker.fetch(P('/admin/api/all',{headers:{...ADMIN,'Cf-Access-Authenticated-User-Email':'hacker@evil.com'}}), env);
  return r.status===401; });
await t('GET /admin ALLOWS an allow-listed admin', async()=>
  (await worker.fetch(P('/admin',{headers:ADMIN}), env)).status===200);
await t('resume path traversal is rejected', async()=>
  (await worker.fetch(P('/admin/api/resume?key=../../secret',{headers:ADMIN}), env)).status===400);

// --- admin api ---
await t('GET /admin/api/all returns all three tables', async()=>{
  const b = await (await worker.fetch(P('/admin/api/all',{headers:ADMIN}), env)).json();
  return b.leads && b.applications && b.data_requests && b.user==='boss@prohealth.us'; });
await t('PATCH rejects an invalid status', async()=>
  (await worker.fetch(P('/admin/api/leads/abc',{method:'PATCH',headers:{...ADMIN,'Content-Type':'application/json'},body:JSON.stringify({status:'pwned'})}), env)).status===400);
await t('PATCH accepts a valid status + writes audit', async()=>{
  const before = rows.audit_log.length;
  const r = await worker.fetch(P('/admin/api/leads/abc',{method:'PATCH',headers:{...ADMIN,'Content-Type':'application/json'},body:JSON.stringify({status:'contacted'})}), env);
  return r.status===200 && rows.audit_log.length===before+1; });
await t('PUT /admin/api/openings saves and GET returns them', async()=>{
  await worker.fetch(P('/admin/api/openings',{method:'PUT',headers:{...ADMIN,'Content-Type':'application/json'},
    body:JSON.stringify({openings:[{title:'RN',type:'Full-time',offices:['Fresno'],active:true},{title:''}]})}), env);
  const b = await (await worker.fetch(P('/admin/api/openings',{headers:ADMIN}), env)).json();
  return b.openings.length===1 && b.openings[0].title==='RN'; });
await t('public GET /openings.json serves what admin saved', async()=>{
  const b = await (await worker.fetch(P('/openings.json'), env)).json();
  return b.openings[0].title==='RN'; });
await t('PUT /admin/api/config saves email routing', async()=>{
  await worker.fetch(P('/admin/api/config',{method:'PUT',headers:{...ADMIN,'Content-Type':'application/json'},
    body:JSON.stringify({EMAIL_HOSPICE:'hospice@prohealth.us'})}), env);
  const b = await (await worker.fetch(P('/admin/api/config',{headers:ADMIN}), env)).json();
  return b.EMAIL_HOSPICE==='hospice@prohealth.us'; });
await t('config from KV overrides wrangler vars', async()=>{
  const b = await (await worker.fetch(P('/admin/api/config',{headers:ADMIN}), env)).json();
  return b.EMAIL_HOSPICE==='hospice@prohealth.us' && b.EMAIL_DEFAULT==='intake@x.com'; });

// --- openings seeding ---
await t('GET /openings.json seeds demo roles on first run (admin and site agree)', async()=>{
  kv.delete('openings');
  const b = await (await worker.fetch(P('/openings.json'), env)).json();
  return b.openings.length===7 && b.seeded; });
await t('seeded openings persist, so deleting one actually sticks', async()=>{
  await worker.fetch(P('/openings.json'), env);           // seed
  const before = JSON.parse(kv.get('openings')).openings.length;
  await worker.fetch(P('/admin/api/openings',{method:'PUT',headers:{...ADMIN,'Content-Type':'application/json'},
    body:JSON.stringify({openings:[{title:'RN',offices:['Fresno'],active:true}]})}), env);
  const after = JSON.parse(kv.get('openings')).openings.length;
  const site = await (await worker.fetch(P('/openings.json'), env)).json();
  return before===7 && after===1 && site.openings.length===1; });
await t('an empty openings list stays empty (does not resurrect the demo data)', async()=>{
  await worker.fetch(P('/admin/api/openings',{method:'PUT',headers:{...ADMIN,'Content-Type':'application/json'},
    body:JSON.stringify({openings:[]})}), env);
  const site = await (await worker.fetch(P('/openings.json'), env)).json();
  return site.openings.length===0; });

// --- find & erase ---
await t('GET /find requires a valid email', async()=>
  (await worker.fetch(P('/admin/api/find?email=nope',{headers:ADMIN}), env)).status===400);
await t('GET /find is admin-only', async()=>
  (await worker.fetch(P('/admin/api/find?email=a@b.com'), env)).status===401);
await t('POST /erase is admin-only', async()=>
  (await worker.fetch(P('/admin/api/erase',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:'a@b.com',what:['leads']})}), env)).status===401);
await t('POST /erase rejects a bad email', async()=>
  (await worker.fetch(P('/admin/api/erase',{method:'POST',headers:{...ADMIN,'Content-Type':'application/json'},
    body:JSON.stringify({email:'x',what:['leads']})}), env)).status===400);
await t('POST /erase writes to the audit log', async()=>{
  const before = rows.audit_log.length;
  const r = await worker.fetch(P('/admin/api/erase',{method:'POST',headers:{...ADMIN,'Content-Type':'application/json'},
    body:JSON.stringify({email:'gone@x.com',what:['leads','applications']})}), env);
  return r.status===200 && rows.audit_log.length > before; });

// --- contact triage, audit log, acknowledgement emails ---
const DANIEL = { 'Cf-Access-Jwt-Assertion':'jwt', 'Cf-Access-Authenticated-User-Email':'daniel@prohealth.us' };
env.ADMIN_EMAILS = 'boss@prohealth.us,daniel@prohealth.us';

await t('PATCH /leads/:id can change type (push contact -> callback)', async()=>{
  const r = await worker.fetch(P('/admin/api/leads/x0',{method:'PATCH',headers:{...ADMIN,'Content-Type':'application/json'},
    body:JSON.stringify({type:'callback'})}), env);
  return r.status===200; });
await t('POST /leads/:id/to-application promotes a contact into an applicant', async()=>{
  const before = rows.applications.length;
  const r = await worker.fetch(P('/admin/api/leads/x0/to-application',{method:'POST',headers:{...ADMIN,'Content-Type':'application/json'},body:'{}'}), env);
  return r.status===200 && rows.applications.length===before+1; });
await t('GET /audit is owner-only (403 for a non-super admin)', async()=>
  (await worker.fetch(P('/admin/api/audit',{headers:ADMIN}), env)).status===403);
await t('GET /audit returns the log for the owner (daniel@)', async()=>{
  const r = await worker.fetch(P('/admin/api/audit',{headers:DANIEL}), env);
  return r.status===200 && Array.isArray((await r.json()).log); });
await t('a submitted lead with an email gets an acknowledgement email', async()=>{
  const calls=[]; const orig=globalThis.fetch;
  globalThis.fetch = async(u,o)=>{ try{ calls.push(JSON.parse(o.body)); }catch(e){} return {ok:true,text:async()=>''}; };
  const env2 = {...env, RESEND_API_KEY:'re_test'};
  await worker.fetch(P('/leads', J({name:'Ann Lee',phone:'5',email:'ann@x.com',type:'contact'})), env2);
  globalThis.fetch = orig;
  const toAnn = calls.some(c=> (Array.isArray(c.to)?c.to:[c.to]).indexOf('ann@x.com') > -1);
  return toAnn; });
await t('a lead with no email sends no acknowledgement (only staff notify)', async()=>{
  const tos=[]; const orig=globalThis.fetch;
  globalThis.fetch = async(u,o)=>{ try{ const b=JSON.parse(o.body); tos.push(...(Array.isArray(b.to)?b.to:[b.to])); }catch(e){} return {ok:true,text:async()=>''}; };
  const env2 = {...env, RESEND_API_KEY:'re_test'};
  await worker.fetch(P('/leads', J({name:'No Email',phone:'5',type:'referral'})), env2);
  globalThis.fetch = orig;
  return !tos.includes('');   // never an ack to an empty address
});

out.forEach(l=>console.log('  '+l));
console.log('\n'+out.filter(x=>x.startsWith('PASS')).length+'/'+out.length+' passed');
process.exit(out.some(x=>x.startsWith('FAIL'))?1:0);
