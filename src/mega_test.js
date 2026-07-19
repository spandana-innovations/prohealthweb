// Does a pinned mega survive mouseleave? That is the bug.
const L={};
const mk=(n)=>{const e={_cls:new Set(),_ev:{},tag:n,
  classList:{_o:null,add(c){this._o._cls.add(c)},remove(...c){c.forEach(x=>this._o._cls.delete(x))},
    contains(c){return this._o._cls.has(c)},toggle(c,f){f?this._o._cls.add(c):this._o._cls.delete(c)}},
  addEventListener(ev,fn){(this._ev[ev]=this._ev[ev]||[]).push(fn)},
  fire(ev,arg){(this._ev[ev]||[]).forEach(f=>f(arg||{preventDefault(){},target:this}))},
  querySelector(){return this._link||null}, setAttribute(k,v){this['_'+k]=v}, getAttribute(k){return this['_'+k]},
  contains(t){return t===this||t===this._link}, blur(){}};
  e.classList._o=e; return e;};

const svc=mk('svc'), loc=mk('loc');
svc._link=mk('a'); loc._link=mk('a');
svc._mega='[data-mega]'; loc._mega='[data-mega-loc]';
const docEv={};
global.document={
  querySelectorAll:(s)=>s.includes('data-mega')?[svc,loc]:[],
  addEventListener:(ev,fn)=>{(docEv[ev]=docEv[ev]||[]).push(fn)},
  activeElement:null };
global.window={matchMedia:()=>({matches:false})};   // fine pointer = desktop
global.matchMedia=global.window.matchMedia;
let timers=[];
global.setTimeout=(f,ms)=>{timers.push(f); return timers.length;};
global.clearTimeout=(id)=>{ if(id) timers[id-1]=null; };
global.addEventListener=()=>{};
const fs=require('fs');
const src=fs.readFileSync('/tmp/megajs.txt','utf8');
eval(src);
const runTimers=()=>{const t=timers;timers=[];t.forEach(f=>f&&f());};

const out=[]; const t=(n,f)=>{try{out.push((f()?'PASS':'FAIL')+' | '+n);}catch(e){out.push('FAIL | '+n+' :: '+e.message);}};

// --- hover ---
svc.fire('mouseenter');
t('hover opens the panel', ()=>svc.classList.contains('open'));
svc.fire('mouseleave'); runTimers();
t('leaving without clicking closes it (after a grace delay)', ()=>!svc.classList.contains('open'));

// --- THE BUG: click to pin, then move the mouse ---
svc._link.fire('click');
t('clicking Services pins the panel open', ()=>svc.classList.contains('open') && svc.classList.contains('pinned'));
svc.fire('mouseleave'); runTimers();
t('moving the mouse away does NOT close a pinned panel', ()=>svc.classList.contains('open'));
svc.fire('mouseleave'); svc.fire('mouseleave'); runTimers(); runTimers();
t('repeated mouseleave still cannot close it', ()=>svc.classList.contains('open'));

// --- pinning the other one swaps ---
loc._link.fire('click');
t('pinning Locations closes Services', ()=>loc.classList.contains('pinned') && !svc.classList.contains('open'));

// --- outside click ---
(docEv.click||[]).forEach(f=>f({target:mk('body')}));
t('clicking outside closes everything', ()=>!loc.classList.contains('open') && !svc.classList.contains('open'));

// --- escape ---
svc._link.fire('click');
(docEv.keydown||[]).forEach(f=>f({key:'Escape'}));
t('Escape closes it', ()=>!svc.classList.contains('open'));

// --- second click follows the link ---
svc._link.fire('click');
let navigated=true;
svc._link.fire('click', {preventDefault(){navigated=false;}, target:svc._link});
t('a second click navigates to /services/ instead of re-pinning', ()=>navigated);

// --- aria ---
svc._link.fire('click');
t('aria-expanded tracks state', ()=>svc._link.getAttribute('aria-expanded')==='true');

out.forEach(l=>console.log('  '+l));
console.log('\n'+out.filter(x=>x.startsWith('PASS')).length+'/'+out.length+' passed');
process.exit(out.some(x=>x.startsWith('FAIL'))?1:0);
