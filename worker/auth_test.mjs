import fs from 'fs';
// bundle the three modules for testing
const auth = fs.readFileSync('./src/auth.js','utf8');
const idx  = fs.readFileSync('./src/index.js','utf8')
  .replace("import { ADMIN_HTML } from './admin.js';", "const ADMIN_HTML='<html>DASHBOARD</html>';")
  .replace(/import\s*\{[\s\S]*?\}\s*from\s*'\.\/auth\.js';/, "")
  .replace(/import\s*\{[\s\S]*?\}\s*from\s*'\.\/attendance\.js';/, "const attendanceRoute=async()=>new Response('{}',{status:404});const attendanceCron=async()=>0;");
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
  headers:{'Content-Type':'application/json','CF-Connecting-IP':ip},body:JSON.stringify({user:u,pass:pw,captcha:'swiped'})}),env);

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
await t('captcha: login without the swipe token is rejected (400)', async()=>{
  const r=await worker.fetch(P('/admin/login',{method:'POST',
    headers:{'Content-Type':'application/json','CF-Connecting-IP':'6.6.6.6'},
    body:JSON.stringify({user:'admin',pass:'admin@2026'})}),env);   // no captcha field
  return r.status===400; });
await t('rate limit: locks out after 3 failed attempts from one IP', async()=>{
  for(let i=0;i<3;i++) await login('admin','nope','9.9.9.9');
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
    body:JSON.stringify({user:'admin',pass:'SuperSecret123!',captcha:'swiped'})}),env2);
  const old=await worker.fetch(P('/admin/login',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'7.7.7.8'},
    body:JSON.stringify({user:'admin',pass:'admin@2026',captcha:'swiped'})}),env2);
  return ok.status===200 && old.status===401; });
await t('the committed wrangler.toml credential (admin / #Admin@2026) actually logs in', async()=>{
  const toml=fs.readFileSync('./wrangler.toml','utf8');
  const hash=(toml.match(/ADMIN_PASS_HASH\s*=\s*"([^"]+)"/)||[])[1];
  if(!hash) return false;
  const env3={...env, ADMIN_PASS_HASH:hash, ADMIN_PASS:undefined,
    CONFIG:{get:async()=>null,put:async()=>{},delete:async()=>{}}};
  const good=await worker.fetch(P('/admin/login',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'5.5.5.1'},
    body:JSON.stringify({user:'admin',pass:'#Admin@2026',captcha:'swiped'})}),env3);
  const bad=await worker.fetch(P('/admin/login',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'5.5.5.2'},
    body:JSON.stringify({user:'admin',pass:'admin@2026',captcha:'swiped'})}),env3);
  return good.status===200 && bad.status===401; });
// ---------- multi-admin: email accounts, super-gating, reset flow ----------
const admGet=(path,cookie=COOKIE)=>worker.fetch(P('/admin/api'+path,{headers:{Cookie:'ph_session='+cookie}}),env);
const admPost=(path,body,cookie=COOKIE)=>worker.fetch(P('/admin/api'+path,{method:'POST',
  headers:{'Content-Type':'application/json',Cookie:'ph_session='+cookie},body:JSON.stringify(body)}),env);
const cookieOf=(r)=>((r.headers.get('Set-Cookie')||'').match(/ph_session=([^;]+)/)||[])[1]||'';
const forgot=(email)=>worker.fetch(P('/admin/forgot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})}),env);
const doReset=(token,password)=>worker.fetch(P('/admin/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password})}),env);
const findToken=(email)=>{ for(const k of kv.keys()){ if(k.indexOf('reset:')===0){ try{ if(JSON.parse(kv.get(k)).email===email) return k.slice(6);}catch(e){} } } return null; };

await t('admins roster requires login (401 signed out)', async()=>
  (await worker.fetch(P('/admin/api/admins'),env)).status===401);
await t('super-admin can list the roster; owner daniel@ is always present', async()=>{
  const r=await admGet('/admins'); if(r.status!==200) return false; const d=await r.json();
  return Array.isArray(d.admins) && d.admins.some(a=>a.email==='daniel@prohealth.us' && a.super); });
await t('adding a non-@prohealth.us address is rejected (400)', async()=>
  (await admPost('/admins',{email:'someone@gmail.com',mode:'silent'})).status===400);
await t('adding a @prohealth.us admin with a manual password lets them sign in', async()=>{
  const add=await admPost('/admins',{email:'nurse@prohealth.us',mode:'manual',password:'TempPass123!'});
  if(add.status!==200) return false;
  return (await login('nurse@prohealth.us','TempPass123!','20.0.0.1')).status===200; });
await t('an added admin is NOT super (cannot manage the roster → 403)', async()=>{
  const ck=cookieOf(await login('nurse@prohealth.us','TempPass123!','20.0.0.2'));
  return (await admGet('/admins',ck)).status===403; });
await t('wrong password for an email admin is rejected (401)', async()=>
  (await login('nurse@prohealth.us','nope','20.0.0.3')).status===401);
await t('forgot-password → reset token → new password works end to end', async()=>{
  await admPost('/admins',{email:'aide@prohealth.us',mode:'silent'});
  if((await forgot('aide@prohealth.us')).status!==200) return false;
  const token=findToken('aide@prohealth.us'); if(!token) return false;
  if((await doReset(token,'BrandNew99!')).status!==200) return false;
  return (await login('aide@prohealth.us','BrandNew99!','20.0.0.4')).status===200; });
await t('a used reset token cannot be replayed', async()=>{
  await admPost('/admins',{email:'once@prohealth.us',mode:'silent'});
  await forgot('once@prohealth.us'); const token=findToken('once@prohealth.us');
  await doReset(token,'FirstUse123!');
  return (await doReset(token,'SecondUse123!')).status===400; });
await t('reset with a bogus token is rejected (400)', async()=>
  (await doReset('deadbeef','Whatever123!')).status===400);
await t('reset rejects a too-short password (400)', async()=>{
  await admPost('/admins',{email:'shortpw@prohealth.us',mode:'silent'});
  await forgot('shortpw@prohealth.us'); const token=findToken('shortpw@prohealth.us');
  return (await doReset(token,'short')).status===400; });
await t('forgot-password for a non-admin still returns ok (no user enumeration)', async()=>
  (await forgot('stranger@prohealth.us')).status===200);
await t('the owner account daniel@ cannot be removed (400)', async()=>
  (await worker.fetch(P('/admin/api/admins/daniel@prohealth.us',{method:'DELETE',headers:{Cookie:'ph_session='+COOKIE}}),env)).status===400);
await t('removing an added admin revokes their login', async()=>{
  await admPost('/admins',{email:'temp@prohealth.us',mode:'manual',password:'TempPass123!'});
  const del=await worker.fetch(P('/admin/api/admins/temp@prohealth.us',{method:'DELETE',headers:{Cookie:'ph_session='+COOKIE}}),env);
  if(del.status!==200) return false;
  return (await login('temp@prohealth.us','TempPass123!','20.0.0.5')).status===401; });

await t('public endpoints still work without login', async()=>
  (await worker.fetch(P('/health'),env)).status===200);
await t('public POST /leads still works without login', async()=>
  (await worker.fetch(P('/leads',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:'A',phone:'5'})}),env)).status===200);

out.forEach(l=>console.log('  '+l));
console.log('\n'+out.filter(x=>x.startsWith('PASS')).length+'/'+out.length+' passed');
process.exit(out.some(x=>x.startsWith('FAIL'))?1:0);
