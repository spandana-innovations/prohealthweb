// Simulate real mobile interactions: does tapping the hamburger / chat button work?
const REAL = new Set(JSON.parse(process.argv[2]));
const listeners = {};
const made = {};
const mk = (id) => ({ id, className:'', textContent:'', innerHTML:'', value:'', style:{}, dataset:{},
  hidden:true, offsetWidth:300, offsetParent:{}, _cls:new Set(),
  classList:{ _o:null,
    add(c){this._o._cls.add(c)}, remove(c){this._o._cls.delete(c)},
    toggle(c,f){ if(f===undefined){ this._o._cls.has(c)?this._o._cls.delete(c):this._o._cls.add(c);} else { f?this._o._cls.add(c):this._o._cls.delete(c);} },
    contains(c){return this._o._cls.has(c)} },
  addEventListener(ev,fn){ (listeners[id]=listeners[id]||{})[ev]=fn; },
  removeEventListener(){}, querySelector(){return null}, querySelectorAll(){return []},
  setAttribute(k,v){ this['_attr_'+k]=v; }, getAttribute(k){return this['_attr_'+k]||null},
  focus(){}, blur(){}, appendChild(){}, remove(){}, scrollIntoView(){}, hasChildNodes(){return false},
  contains(){return false}, click(){ const l=listeners[id]; if(l&&l.click) l.click({preventDefault(){}}); } });
global.document = {
  getElementById:(id)=>{ if(!REAL.has(id)) return null; if(!made[id]){ made[id]=mk(id); made[id].classList._o=made[id]; } return made[id]; },
  querySelector:(s)=>{ if(s==='.chat-fab') return null; if(s==='[data-mega]') return null; return null; },
  querySelectorAll:()=>[], addEventListener(){}, createElement:()=>{const e=mk('new'); e.classList._o=e; return e;},
  body:(()=>{const b=mk('body'); b.classList._o=b; return b;})(), activeElement:null };
global.window={matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),addEventListener(){},removeEventListener(){},innerWidth:390};
global.addEventListener=()=>{}; global.setInterval=()=>{}; global.setTimeout=(f)=>f&&f();
global.IntersectionObserver=class{observe(){}unobserve(){}};
global.matchMedia=global.window.matchMedia; global.location={pathname:'/',hash:''};
global.requestAnimationFrame=(f)=>f(); global.performance={now:()=>0}; global.innerWidth=390;
global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve({openings:[]})});
global.alert=()=>{}; const _log=console.log; console.log=()=>{};
const vm=require('vm'), fs=require('fs');
vm.runInThisContext(fs.readFileSync(process.argv[3],'utf8'));
console.log=_log;

const out=[];
// --- TAP 1: hamburger ---
const drawer=document.getElementById('drawer');
const btn=document.getElementById('menuBtn');
if(!btn) out.push('FAIL: no #menuBtn');
else if(!listeners['menuBtn'] || !listeners['menuBtn'].click) out.push('FAIL: hamburger has no click listener');
else { listeners['menuBtn'].click({preventDefault(){}});
  out.push(drawer.classList.contains('open') ? 'PASS: hamburger opens drawer' : 'FAIL: drawer did not open');
  out.push(btn.getAttribute('aria-expanded')==='true' ? 'PASS: aria-expanded set' : 'FAIL: aria-expanded not set'); }
// --- TAP 2: call bar chat toggle ---
const panel=document.getElementById('chatPanel');
if(typeof toggleChat!=='function') out.push('FAIL: toggleChat is not defined');
else {
  toggleChat();
  out.push(panel.classList.contains('open') ? 'PASS: chat opens from call bar' : 'FAIL: chat did not open');
  const tx=document.getElementById('chatToggleTx');
  out.push(tx && tx.textContent==='Minimise chat' ? 'PASS: button says "Minimise chat"' : 'FAIL: label not synced ('+(tx&&tx.textContent)+')');
  toggleChat();
  out.push(!panel.classList.contains('open') ? 'PASS: second tap minimises' : 'FAIL: did not minimise');
  out.push(tx.textContent==='Chat with us' ? 'PASS: label restored' : 'FAIL: label not restored');
}
// --- TAP 3: openChat from a hero chip ---
if(typeof openChat!=='function') out.push('FAIL: openChat is not defined');
else { openChat('family'); out.push(panel.classList.contains('open') ? 'PASS: openChat() works' : 'FAIL: openChat did not open'); }
out.forEach(l=>console.log('  '+l));
process.exit(out.some(l=>l.startsWith('FAIL'))?1:0);
