
const REAL = new Set(JSON.parse(process.argv[2]));
const CLS  = new Set(JSON.parse(process.argv[3]));
const made={};
const mk=(id)=>({id, className:'', textContent:'', innerHTML:'', value:'', files:[], style:{}, dataset:{},
  hidden:false, offsetWidth:300, offsetParent:{}, options:[], checked:false, size:0,
  classList:{toggle(){}, add(){}, remove(){}, contains(){return false}},
  addEventListener(){}, removeEventListener(){}, querySelector(){return null}, querySelectorAll(){return []},
  setAttribute(){}, getAttribute(){return null}, focus(){}, blur(){}, appendChild(){}, remove(){},
  scrollIntoView(){}, insertBefore(){}, contains(){return false}, closest(){return null}, click(){}});
global.document={
  getElementById:(id)=>{ if(!REAL.has(id)) return null; made[id]=made[id]||mk(id); return made[id]; },
  querySelector:(s)=>{ const m=s.match(/^[.#]?([\w-]+)/); return (m&&(CLS.has(m[1])||REAL.has(m[1])))?mk(m[1]):null; },
  querySelectorAll:()=>[], addEventListener(){}, createElement:()=>mk('new'),
  body:mk('body'), documentElement:mk('html'), activeElement:null, cookie:'' };
global.window={matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),addEventListener(){},
  removeEventListener(){}, innerWidth:1400};
global.addEventListener=()=>{}; global.setInterval=()=>{}; global.setTimeout=()=>{};
global.IntersectionObserver=class{constructor(){}observe(){}unobserve(){}};
global.matchMedia=global.window.matchMedia; global.location={pathname:'/',hash:''};
global.requestAnimationFrame=(f)=>f(); global.performance={now:()=>0}; global.innerWidth=1400;
global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({openings:[]})});
global.alert=()=>{}; global.console.log=()=>{};
try{ require(process.argv[4]); process.stdout.write('CLEAN'); }
catch(e){ process.stdout.write('ERROR|'+e.message+'|'+(e.stack.split('\n')[1]||'').trim()); }
