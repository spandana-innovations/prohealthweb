import fs from 'fs';
// bundle the three modules for testing
const auth = fs.readFileSync('./src/auth.js','utf8');
const idx  = fs.readFileSync('./src/index.js','utf8')
  .replace("import { ADMIN_HTML } from './admin.js';", "const ADMIN_HTML='<html>DASHBOARD</html>';")
  .replace("import { requireAdmin, handleLogin, handleLogout } from './auth.js';", "");
fs.writeFileSync('/tmp/_a.mjs', auth.replace(/^export /gm,'') + '\n' + idx);
const { default: worker } = await import('/tmp/_a.mjs');

const rows={leads:[],applications:[],data_requests:[],audit_log:[]};
const mkStmt=(sql)=>({_b:[],bind(...a){this._b=a;return this;},
  async run(){const t=(sql.match(/INTO (\w+)/)||sql.match(/UPDATE (\w+)/)||[])[1]; if(/^INSERT/.test(sql))rows[t].push(this._b); return {success:true};},
  async all(){const t=(sql.match(/FROM (\w+)/)||[])[1]; return {results:(rows[t]||[]).map((r,i)=>({id:'x'+i}))};}});
const kv=new Map();
const env={ DB:{prepare:mkStmt}, RESUMES:{put:async()=>{},get:async()=>null},
  CONFIG:{ get:async k=>kv.get(k)||null, put:async(k,v)=>kv.set(k,v), delete:async k=>kv.delete(k) },
  ADMIN_USER:'admin', ADMIN_PASS:'admin@2026', EMAIL_DEFAULT:'x@x.com', RESEND_API_KEY:'' };
globalThis.fetch=async()=>({ok:true,text:async()=>''});
const P=(p,o={})=>new Request('https://api.prohealth.us'+p,o);
const login=(u,pw,ip='1.1.1.1')=>worker.fetch(P('/admin/login',{method:'POST',
  headers:{'Content-Type':'application/json','CF-Connecting-IP':ip},body:JSON.stringify({user:u,pass:pw})}),env);

const out=[]; const t=async(n,f)=>{try{out.push(((await f())?'PASS':'FAIL')+' | '+n);}catch(e){out.push('FAIL | '+n+' :: '+e.message);}};

let COOKIE='';
await t('GET /admin unauthenticated shows the LOGIN PAGE and never the dashboard', async()=>{
  const r=await worker.fetch(P('/admin'),env); const b=await r.text();
  // 200 because it is a page; the security property is that no dashboard leaks
  return r.status===200 && b.includes('Admin sign in') && !b.includes('DASHBOARD'); });
await t('GET /admin sets noindex so it never reaches Google', async()=>{
  const r=await worker.fetch(P('/admin'),env);
  return (r.headers.get('X-Robots-Tag')||'').includes('noindex'); });
await t('admin API still returns 401 JSON when signed out', async()=>{
  const r=await worker.fetch(P('/admin/api/all'),env);
  return r.status===401 && (await r.json()).error==='not signed in'; });
await t('login with admin / admin@2026 succeeds', async()=>{
  const r=await login('admin','admin@2026');
  const sc=r.headers.get('Set-Cookie')||''; COOKIE=(sc.match(/ph_session=([^;]+)/)||[])[1]||'';
  return r.status===200 && COOKIE.length>20; });
await t('session cookie is HttpOnly + Secure + SameSite=Strict', async()=>{
  const r=await login('admin','admin@2026','2.2.2.2'); const sc=r.headers.get('Set-Cookie');
  return /HttpOnly/.test(sc) && /Secure/.test(sc) && /SameSite=Strict/.test(sc); });
await t('GET /admin WITH session shows the dashboard', async()=>{
  const r=await worker.fetch(P('/admin',{headers:{Cookie:'ph_session='+COOKIE}}),env);
  return r.status===200 && (await r.text()).includes('DASHBOARD'); });
await t('admin API works with the session', async()=>{
  const r=await worker.fetch(P('/admin/api/all',{headers:{Cookie:'ph_session='+COOKIE}}),env);
  return r.status===200 && (await r.json()).user==='admin'; });
await t('wrong password is rejected', async()=> (await login('admin','wrong','3.3.3.3')).status===401);
await t('wrong username is rejected', async()=> (await login('root','admin@2026','4.4.4.4')).status===401);
await t('TAMPERED session cookie is rejected', async()=>{
  const bad=COOKIE.slice(0,-4)+'AAAA';
  const r=await worker.fetch(P('/admin/api/all',{headers:{Cookie:'ph_session='+bad}}),env);
  return r.status===401; });
await t('forged payload without valid signature is rejected', async()=>{
  const payload=Buffer.from(JSON.stringify({u:'admin',exp:Date.now()+9e9})).toString('base64url');
  const r=await worker.fetch(P('/admin/api/all',{headers:{Cookie:'ph_session='+payload+'.deadbeef'}}),env);
  return r.status===401; });
await t('EXPIRED session is rejected', async()=>{
  // sign a token that expired an hour ago, using the real secret
  const enc=new TextEncoder();
  const payload=Buffer.from(JSON.stringify({u:'admin',exp:Date.now()-3600e3})).toString('base64url');
  const key=await crypto.subtle.importKey('raw',enc.encode('admin@2026'),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sig=Buffer.from(await crypto.subtle.sign('HMAC',key,enc.encode(payload))).toString('base64url');
  const r=await worker.fetch(P('/admin/api/all',{headers:{Cookie:'ph_session='+payload+'.'+sig}}),env);
  return r.status===401; });
await t('rate limit: locks out after 8 failed attempts from one IP', async()=>{
  for(let i=0;i<8;i++) await login('admin','nope','9.9.9.9');
  const r=await login('admin','admin@2026','9.9.9.9');   // even the RIGHT password
  return r.status===429; });
await t('rate limit does not affect a different IP', async()=>
  (await login('admin','admin@2026','8.8.8.8')).status===200);
await t('logout clears the cookie', async()=>{
  const r=await worker.fetch(P('/admin/logout',{method:'POST'}),env);
  return /ph_session=;/.test(r.headers.get('Set-Cookie')||'') && /Max-Age=0/.test(r.headers.get('Set-Cookie')); });
await t('PBKDF2 hashed password works (and plaintext then ignored)', async()=>{
  const crypto2=await import('crypto');
  const salt=crypto2.randomBytes(16).toString('hex');
  const hash=crypto2.pbkdf2Sync('SuperSecret123!',salt,100000,32,'sha256').toString('hex');
  const env2={...env, ADMIN_PASS_HASH:`pbkdf2$100000$${salt}$${hash}`, ADMIN_PASS:'admin@2026',
              CONFIG:{get:async()=>null,put:async()=>{},delete:async()=>{}}};
  const ok=await worker.fetch(P('/admin/login',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'7.7.7.7'},
    body:JSON.stringify({user:'admin',pass:'SuperSecret123!'})}),env2);
  const old=await worker.fetch(P('/admin/login',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'7.7.7.8'},
    body:JSON.stringify({user:'admin',pass:'admin@2026'})}),env2);
  return ok.status===200 && old.status===401; });
await t('public endpoints still work without login', async()=>
  (await worker.fetch(P('/health'),env)).status===200);
await t('public POST /leads still works without login', async()=>
  (await worker.fetch(P('/leads',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:'A',phone:'5'})}),env)).status===200);

out.forEach(l=>console.log('  '+l));
console.log('\n'+out.filter(x=>x.startsWith('PASS')).length+'/'+out.length+' passed');
process.exit(out.some(x=>x.startsWith('FAIL'))?1:0);
