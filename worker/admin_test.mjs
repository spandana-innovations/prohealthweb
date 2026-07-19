// Render the admin against fake data and exercise every tab + the erase flow.
import fs from 'fs'; import vm from 'vm';
const html = fs.readFileSync('/tmp/adminhtml.txt','utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
const store = {};
const mk = (id) => { const e = { id, _html:'', textContent:'', value:'', checked:false, dataset:{}, style:{},
  className:'', _cls:new Set(),
  get innerHTML(){return this._html}, set innerHTML(v){this._html=String(v)},
  classList:{ _o:null, add(c){this._o._cls.add(c)}, remove(c){this._o._cls.delete(c)},
    toggle(c,f){f?this._o._cls.add(c):this._o._cls.delete(c)}, contains(c){return this._o._cls.has(c)} },
  addEventListener(){}, querySelectorAll(){return []}, querySelector(){return null},
  setAttribute(){}, getAttribute(){return null}, focus(){}, setSelectionRange(){}, click(){}, remove(){} };
  e.classList._o = e; return e; };
const els = {};
const doc = {
  getElementById: (id) => { if(!ids.includes(id) && !els[id]) return null; els[id]=els[id]||mk(id); return els[id]; },
  querySelector: () => null, querySelectorAll: () => [], addEventListener(){}, createElement: () => mk('new'),
  body: mk('body') };

const LEADS=[{id:'l1',name:'Mary Chen',phone:'555-0101',email:'mary@x.com',service:'Home Health',type:'callback',status:'new',created_at:'2026-07-16 09:00:00',notes:''},
             {id:'l2',name:'John Diaz',phone:'555-0102',email:'john@x.com',service:'Hospice',type:'referral',status:'contacted',created_at:'2026-07-15 09:00:00',notes:'called'}];
const APPS=[{id:'a1',name:'Nina Patel',phone:'555-0201',email:'nina@x.com',role:'Registered Nurse (RN)',office:'Fresno',resume_key:'resumes/a1-cv.pdf',status:'new',created_at:'2026-07-16 08:00:00'},
            {id:'a2',name:'Sam Okoro',phone:'555-0202',email:'sam@x.com',role:'Physical Therapist (PT)',office:'San Jose',resume_key:'',status:'closed',created_at:'2026-07-10 08:00:00'}];
const REQS=[{id:'d1',ref:'DR-ABC',name:'Mary Chen',email:'mary@x.com',request_type:'Delete my personal information',relationship:'Website visitor',status:'new',due_by:'2026-07-01T00:00:00Z',created_at:'2026-05-17 09:00:00'}];

let lastFetch = null;
const g = {
  document: doc, console,
  fetch: async (u, o) => { lastFetch = {u, o};
    if(u.endsWith('/all')) return {ok:true,status:200,json:async()=>({user:'admin',leads:LEADS,applications:APPS,data_requests:REQS})};
    if(u.includes('/find')) return {ok:true,status:200,json:async()=>({email:'mary@x.com',leads:[LEADS[0]],applications:[],data_requests:[REQS[0]]})};
    if(u.includes('/erase')) return {ok:true,status:200,json:async()=>({ok:true,deleted:{leads:1}})};
    if(u.endsWith('/openings')) return {ok:true,status:200,json:async()=>({openings:[{title:'Registered Nurse (RN)',type:'Full-time',summary:'x',offices:['Fresno'],active:true}]})};
    if(u.endsWith('/config')) return {ok:true,status:200,json:async()=>({EMAIL_DEFAULT:'a@b.com'})};
    return {ok:true,status:200,json:async()=>({ok:true})}; },
  setInterval(){}, setTimeout:(f)=>f&&f(), clearTimeout(){}, alert(){}, confirm:()=>true,
  location:{href:'/admin'}, scrollTo(){}, Intl, Date, JSON, Math, Object, Array, String, Number, RegExp, Blob:class{}, URL:{createObjectURL:()=>''},
};
g.globalThis = g;
vm.createContext(g);
vm.runInContext(script, g);
await new Promise(r=>setTimeout(r,50));

const out=[];
const t=(n,f)=>{ try{ out.push((f()?'PASS':'FAIL')+' | '+n); }catch(e){ out.push('FAIL | '+n+' :: '+e.message); } };
const V = () => els['view']._html;

t('overview renders by default', () => V().includes('Good') && V().includes('Outstanding'));
t('overview surfaces the OVERDUE data request', () => V().includes('OVERDUE') && V().includes('DR-ABC'));
t('overview flags leads waiting over 2 hours', () => V().includes('waiting more than 2 hours'));
t('overview flags new applicants', () => V().includes('new applicant'));
t('overview shows recent activity', () => V().includes('Latest activity') && V().includes('Mary Chen'));
t('stat cards render', () => (V().match(/class="stat/g)||[]).length >= 4);
t('tabs show counts', () => els['tabs']._html.includes('pill'));
t('overdue count uses the alert style', () => els['tabs']._html.includes('pill alert'));

g.go('leads');
t('leads tab lists both leads', () => V().includes('Mary Chen') && V().includes('John Diaz'));
t('leads have status + type filters', () => V().includes('Status') && V().includes('Type'));
g.setF('leads','status','new');
t('filtering leads to new drops the contacted one', () => V().includes('Mary Chen') && !V().includes('John Diaz'));
g.setF('leads','status','all');

g.go('applications');
t('applicants tab renders', () => V().includes('Nina Patel'));
t('applicants have 4 filter rows', () => (V().match(/class="frow"/g)||[]).length === 4);
t('resume button shows when a resume exists', () => V().includes('Resume'));
g.setF('applications','resume','no');
t('filter: resume missing', () => !V().includes('Nina Patel') && V().includes('Sam Okoro'));
g.setF('applications','resume','all'); g.setF('applications','role','Therapy');
t('filter: role group Therapy finds the PT', () => V().includes('Sam Okoro') && !V().includes('Nina Patel'));
g.setF('applications','role','All'); g.setF('applications','office','Fresno');
t('filter: office Fresno', () => V().includes('Nina Patel') && !V().includes('Sam Okoro'));
g.setF('applications','office','All');

g.go('requests');
t('data requests render with erase box', () => V().includes('Erase this person') && V().includes('Find their data'));
t('overdue request is tagged', () => V().includes('tag due'));

out.forEach(l=>console.log('  '+l));
console.log('\n'+out.filter(x=>x.startsWith('PASS')).length+'/'+out.length+' passed');
process.exit(out.some(x=>x.startsWith('FAIL'))?1:0);
