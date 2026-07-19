// Does clicking the poster actually swap in the YouTube iframe?
const fs=require('fs');
const page=process.argv[2];
const html=fs.readFileSync(page,'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const blk=script.match(/document\.querySelectorAll\('\.frame\[data-yt\]'\)[\s\S]*?\n\}\);/);
if(!blk){ console.log('FAIL: no play handler in', page); process.exit(1); }

const frames=[];
const mkFrame=(id)=>{const f={dataset:{yt:id},_html:'',_ev:{},style:{},
  get innerHTML(){return this._html}, set innerHTML(v){this._html=v},
  addEventListener(e,fn){(this._ev[e]=this._ev[e]||[]).push(fn)},
  fire(e,a){(this._ev[e]||[]).forEach(fn=>fn(a||{}))}};
  frames.push(f); return f;};
const vid = (html.match(/data-yt="([^"]+)"/)||[])[1];
const f = mkFrame(vid);
global.document={querySelectorAll:(s)=> s.includes('data-yt') ? [f] : []};
eval(blk[0]);

const out=[]; const t=(n,fn)=>{try{out.push((fn()?'PASS':'FAIL')+' | '+n);}catch(e){out.push('FAIL | '+n+' :: '+e.message);}};
t('video id is the real careers video', ()=>vid==='EfZZgqSnk-8');
t('poster starts with no iframe', ()=>!f._html.includes('<iframe'));
f.fire('click');
t('clicking loads the YouTube iframe', ()=>f._html.includes('<iframe') && f._html.includes(vid));
t('uses youtube-nocookie (no tracking before consent)', ()=>f._html.includes('youtube-nocookie.com'));
t('autoplays once clicked', ()=>f._html.includes('autoplay=1'));
const f2=mkFrame(vid); global.document={querySelectorAll:()=>[f2]}; eval(blk[0]);
f2.fire('keydown',{key:'Enter',preventDefault(){}});
t('keyboard Enter works too (accessibility)', ()=>f2._html.includes('<iframe'));
out.forEach(l=>console.log('  '+l));
const bad=out.some(x=>x.startsWith('FAIL'));
console.log('  '+out.filter(x=>x.startsWith('PASS')).length+'/'+out.length+' passed  ('+page.split('/').slice(-2)[0]+')');
process.exit(bad?1:0);
