// Does the review actually rotate, and does the JS find its elements?
const fs=require('fs');
const html=fs.readFileSync('/home/claude/site2/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const rev=script.match(/\(function\(\)\{\s*const HR=\[[\s\S]*?\}\)\(\);/);
if(!rev){ console.log('FAIL: rotation block not found in the page'); process.exit(1); }

const mk=(t)=>({tag:t,_txt:'',_cls:new Set(),_kids:[],_ev:{},
  get textContent(){return this._txt}, set textContent(v){this._txt=String(v)},
  get innerHTML(){return this._h||''}, set innerHTML(v){this._h=v;
    this.children=(v.match(/<i /g)||[]).map(()=>mk('i'));},
  classList:{_o:null,add(c){this._o._cls.add(c)},remove(c){this._o._cls.delete(c)},contains(c){return this._o._cls.has(c)}},
  addEventListener(e,f){(this._ev[e]=this._ev[e]||[]).push(f)},
  fire(e){(this._ev[e]||[]).forEach(f=>f())},
  querySelector(s){return this._q&&this._q[s]||null}, children:[]});
const q=mk('q'), w=mk('span'), dots=mk('span'), card=mk('div');
[q,w,dots,card].forEach(e=>e.classList._o=e);
card._q={'q':q,'.rvw':w,'.hr-dots':dots};
global.document={querySelector:(s)=> s==='.hr-card'?card:null};
let timers=[], intervals=[];
global.setTimeout=(f)=>{timers.push(f);return timers.length;};
global.clearInterval=(id)=>{if(id)intervals[id-1]=null;};
global.setInterval=(f,ms)=>{intervals.push({f,ms});return intervals.length;};
// the real page ships review #0 in the HTML; mirror that or the first
// comparison is against an empty string
const HRDATA=JSON.parse(rev[0].match(/const HR=(\[[\s\S]*?\]);/)[1]);
q.textContent = HRDATA[0][0];
eval(rev[0]);
const flush=()=>{const t=timers;timers=[];t.forEach(f=>f&&f());};

const out=[]; const t=(n,f)=>{try{out.push((f()?'PASS':'FAIL')+' | '+n);}catch(e){out.push('FAIL | '+n+' :: '+e.message);}};

t('the JS finds the card and its <q>', ()=>card._ev.mouseenter && intervals.length>0);
t('rotation interval is 5.5s', ()=>intervals.some(x=>x&&x.ms===5500));
t('dots rendered, one per review', ()=>dots.children.length===HRDATA.length);

const first=q.textContent;
intervals.find(x=>x).f(); flush();
const second=q.textContent;
t('it actually rotates to a different review', ()=>second && second!==first);
t('the attribution changes with it', ()=>/·/.test(w.textContent) && /Google/.test(w.textContent));
t('the active dot moves', ()=>dots.children[1].className==='on' && dots.children[0].className==='');

// cycle all the way round
const seen=new Set([first, second]);
for(let k=0;k<4;k++){ intervals.find(x=>x).f(); flush(); seen.add(q.textContent); }
t('cycles through every review', ()=>seen.size===HRDATA.length);
t('wraps back to the first', ()=>[...seen].includes(first));

card.fire('mouseenter');
t('hover pauses it', ()=>intervals.filter(x=>x).length===0);
card.fire('mouseleave');
t('leaving resumes it', ()=>intervals.filter(x=>x).length===1);

out.forEach(l=>console.log('  '+l));
console.log('\n'+out.filter(x=>x.startsWith('PASS')).length+'/'+out.length+' passed');
process.exit(out.some(x=>x.startsWith('FAIL'))?1:0);
