/* ============================================================
   ProHealth Care Guide, hybrid chatbot
   Guided buttons + free-text intent engine + AI fallback.
   Hours-aware: response promises change outside PT business hours.
   Leads POST to the Worker API in production.
   ============================================================ */
const PHONE = '877.667.8770';

/* ---- Pacific-time business hours (Mon–Fri 8:30–17:00 PT) ---- */
function ptNow(){
  const s = new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',hour:'numeric',minute:'numeric',hour12:false,timeZoneName:'short'}).formatToParts(new Date());
  const g = t => (s.find(p=>p.type===t)||{}).value;
  const days = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  return { day: days[g('weekday')], mins: (+g('hour'))*60 + (+g('minute')), tz: g('timeZoneName') || 'PT' };
}
const HOLIDAYS_CHAT={"2026-07-03":"Independence Day","2026-09-07":"Labor Day","2026-10-12":"Columbus Day",
 "2026-11-11":"Veterans Day","2026-11-26":"Thanksgiving Day","2026-11-27":"Day after Thanksgiving",
 "2026-12-24":"Christmas Eve","2026-12-25":"Christmas Day","2027-01-01":"New Year\u2019s Day"};
function ptIso(d){
  const f=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const g=t=>(f.find(p=>p.type===t)||{}).value;
  return `${g('year')}-${g('month')}-${g('day')}`;
}
/* minutes until the office next opens, skipping weekends and holidays */
function minsToOpen(){
  for(let step=0; step<14*24*60; step+=5){
    const d=new Date(Date.now()+step*60000);
    const s=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(d);
    const g=t=>(s.find(p=>p.type===t)||{}).value;
    const days={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
    const dow=days[g('weekday')], mins=(+g('hour'))*60+(+g('minute'));
    if(dow>=1&&dow<=5 && mins>=510 && mins<1020 && !HOLIDAYS_CHAT[ptIso(d)]) return step;
  }
  return null;
}
function gapText(m){
  if(m===null) return '';
  if(m<1) return 'in under a minute';
  if(m<60) return 'in '+m+' minute'+(m===1?'':'s');
  const h=Math.floor(m/60), mm=m%60;
  if(h<24) return 'in '+h+' hour'+(h===1?'':'s')+(mm?' '+mm+' minute'+(mm===1?'':'s'):'');
  const d=Math.floor(h/24), hh=h%24;
  return 'in '+d+' day'+(d===1?'':'s')+(hh?' '+hh+' hour'+(hh===1?'':'s'):'');
}
function hoursState(){
  const t = ptNow();
  const open = t.day>=1 && t.day<=5 && t.mins >= 510 && t.mins < 1020;   // 8:30–17:00
  let next;
  if (t.day===0) next = 'Monday at 8:30am';
  else if (t.day===6) next = 'Monday at 8:30am';
  else if (t.mins < 510) next = 'today at 8:30am';
  else if (t.mins >= 1020) next = (t.day===5 ? 'Monday at 8:30am' : 'tomorrow at 8:30am');
  const gap = open ? null : gapText(minsToOpen());
  return { open, next, tz: t.tz, gap };
}
/* The response promise the bot is allowed to make right now */
function responsePromise(){
  const h = hoursState();
  return h.open
    ? `within 2 hours`
    : `first thing when we open (${h.next} ${h.tz})`;
}
function hoursLine(){
  const h = hoursState();
  return h.open
    ? `We're open now, our team replies ${responsePromise()}.`
    : `We're closed right now, and we open again ${h.gap} (${h.next} ${h.tz}). Leave your details and we'll call you then. If this is urgent, our on-call clinical line is staffed 24/7 at ${PHONE}.`;
}
function paintHours(){
  const h = hoursState();
  const st = document.getElementById('chatStatus'), lv = document.getElementById('chatLive'), tx = document.getElementById('chatHoursText');
  if(st) st.textContent = h.open ? `Open now · replies in ~2 hrs` : `Closed · opens ${h.gap}`;
  if(lv) lv.classList.toggle('off', !h.open);
  if(tx) tx.textContent = `Mon–Fri 8:30am–5:00pm ${h.tz} · 24/7 on-call for patients`;
}
document.addEventListener('DOMContentLoaded', paintHours);
setInterval(paintHours, 60000);
document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && panel() && panel().classList.contains('open')){ panel().classList.remove('open'); syncChatToggle(); }
});

const SERVICES = {
  homehealth: {label:"Home Health",
    info:"Home Health brings skilled nursing plus physical, occupational and speech therapy to you at home. It's ordered by a physician and covered by Medicare when you qualify, and visits are scheduled around your recovery plan.",
    follow:[
      ["Do I qualify?","You generally need two things: a physician's order, and to be considered homebound, which simply means leaving home takes considerable effort or help. You can still be homebound and go to medical appointments. Most people who ask us this do qualify. One call and our intake team can usually tell you in minutes."],
      ["What does it cost?","For qualifying patients Medicare covers home health at 100%, so most families pay nothing out of pocket. We also work with Medi-Cal and most major plans. Our intake team checks your exact coverage for free before any care starts, so there are no surprises later."],
      ["How soon can it start?","Our intake team responds to referrals within 2 hours during business hours, and the first nurse visit is usually within 24 to 48 hours."],
      ["Do I need a doctor's order?","Yes, home health needs a physician's order. If you don't have one yet, call us anyway. We contact your doctor's office directly and arrange it, so that part isn't your job."],
      ["Who comes to my home?","Depending on your plan: registered nurses, physical, occupational or speech therapists, home health aides and medical social workers. Everyone is licensed, background checked, insured and supervised."]
    ]},
  hospice: {label:"Hospice Care",
    info:"Hospice focuses on comfort, dignity and quality of life, managing pain and symptoms at home, with emotional and spiritual support for the whole family. It's fully covered by Medicare for eligible patients.",
    follow:[
      ["Is it too early for hospice?","It's the question families agonise over most, and the honest answer is that most people call later than they wish they had. Hospice is appropriate when a physician believes an illness is life limiting and the focus has shifted to comfort. There's no cost to asking, and no pressure from us either way."],
      ["Is hospice giving up?","No. Patients often feel better and live more fully once symptoms are properly controlled, because the exhausting parts stop and the living parts get room. Hospice is about how you spend the time, not about surrender."],
      ["Who pays for it?","The Medicare Hospice Benefit covers eligible patients at 100%, including medications, equipment and supplies related to the hospice diagnosis. Medi-Cal and most private plans offer similar coverage."],
      ["Can we keep our own doctor?","Yes. Your physician stays involved and works alongside our hospice medical director."],
      ["What if we change our minds?","You can leave hospice at any time and go back to curative treatment, then return later if you wish. Nothing is locked in, ever."],
      ["What support does the family get?","Social workers, chaplains and trained volunteers, plus a nurse on call 24/7. Bereavement support continues for 13 months after a loss."]
    ]},
  palliative: {label:"Palliative Care",
    info:"Palliative care gives relief from the symptoms and stress of serious illness at any stage, alongside the treatment you're already having. Our program bridges home health and hospice so care never has to start over.",
    follow:[
      ["How is this different from hospice?","Palliative care is comfort and symptom relief at any stage, while you're still pursuing treatment that aims to cure. Hospice is that same comfort focused care once curative treatment is no longer the goal. Many of our patients start with palliative care years before hospice is ever mentioned."],
      ["Do I have to stop treatment?","No, and that's rather the point. Palliative care runs alongside chemotherapy, dialysis, heart failure treatment and anything else you're doing."],
      ["Is it covered?","Coverage varies by plan. Medicare, Medi-Cal and many private plans cover palliative services in different ways, so our intake team checks your specific benefits for free before anything begins."],
      ["Who is it for?","Anyone whose serious illness brings pain, fatigue, breathlessness or anxiety, or whose family needs help thinking through what happens next."]
    ]},
  homecare: {label:"Home Care",
    info:"Home Care is non-medical support: bathing, dressing, meals, transfers and companionship, from a few hours a day up to 24 hour care. It's private pay and shaped entirely around your routine.",
    follow:[
      ["What does it cost?","Home Care is private pay with straightforward hourly rates that depend on the schedule and level of care. After a free in-home assessment you get an exact quote, with no long term contract. Long term care insurance often applies and we'll help you check."],
      ["Does insurance cover it?","Medicare doesn't cover non-medical home care, though long term care insurance often does, and some VA benefits apply. If you need skilled nursing or therapy instead, that's Home Health and Medicare usually does cover it. Our team helps you work out which one you actually need."],
      ["Is there a minimum?","No rigid minimum. Schedules run from a few hours a day to 24 hour and live-in care, built around your routine."],
      ["Are caregivers screened?","Every caregiver is background checked, trained, insured and supervised by our care coordinators. We match them to your loved one's personality, not just the shift."],
      ["Can it work with home health?","Yes, and many families do exactly that. Clinical visits handle the medical side while caregivers help with daily living in between. One agency, one coordinated plan."]
    ]}
};

const KB = [
  {keys:['hour','hours','open','closed','when','time','today','tonight','weekend'], dyn:()=>`Our offices are open Monday to Friday, 8:30am to 5:00pm Pacific. ${hoursLine()}`},
  {keys:['insurance','medicare','medi-cal','coverage','covered','cost','price','pay','expensive','afford','free'],
   a:"Home Health and Hospice are typically covered 100% by Medicare for qualifying patients, most families pay nothing out of pocket. We also work with Medi-Cal and major insurance plans. Home Care (non-medical caregiving) is private-pay. Our intake team verifies your exact coverage for free before care begins."},
  {keys:['qualify','eligible','eligibility','requirement','homebound','criteria'],
   a:"For Home Health, you generally need a physician's order and to be considered 'homebound', leaving home takes considerable effort. For Hospice, a physician certifies eligibility. The fastest way to know for sure is a quick call with our intake team; they can usually tell you in minutes."},
  {keys:['area','areas','where','serve','county','counties','city','zip','location','office','offices','address','near me'],
   a:"We serve 20 California counties from six offices. Sacramento, Walnut Creek, San Jose, Stockton, Monterey and Fresno. That covers Sacramento, Placer, El Dorado, Yolo, Yuba, Nevada, Solano, Napa, Alameda, Contra Costa, San Mateo, Santa Clara, Santa Cruz, San Benito, Monterey, San Joaquin, Fresno, Madera, Merced and Tulare counties. Tell me your city or zip and I'll confirm."},
  {keys:['phone','number','contact','reach','call','emergency','urgent','24/7','after hours'],
   dyn:()=>`You can reach us toll free at ${PHONE}. Clinical support is on call 24/7 for our patients. ${hoursLine()}`},
  {keys:['job','jobs','career','careers','hiring','vacancy','apply','resume','recruit','rn ','lvn','aide position'],
   a:"We're hiring. RNs, LVNs, PTs, OTs and Home Health Aides across all six offices, with flexible schedules and a culture that values clinicians. You can apply in minutes on our Careers page, or leave your details here and our recruiter will call you.", cta:'careers'},
  {keys:['refer','referral','fax','discharge planner','physician referral'], action:'provider'},
  {keys:['difference','versus',' vs ','hospice or palliative','palliative or hospice'],
   a:"The short version: Palliative care provides comfort and symptom relief at any stage of a serious illness, alongside curative treatment. Hospice provides that same comfort-focused care when treatment is no longer the goal. Our team helps families decide which is right, with no pressure."},
  {keys:['home health','skilled nursing','wound','physical therapy','occupational therapy','speech therapy','rehab'], a:SERVICES.homehealth.info, svc:'Home Health'},
  {keys:['hospice','end of life','comfort care','terminal'], a:SERVICES.hospice.info, svc:'Hospice Care'},
  {keys:['palliative'], a:SERVICES.palliative.info, svc:'Palliative Care'},
  {keys:['home care','caregiver','companion','bathing','meal','24-hour','sitter','non-medical'], a:SERVICES.homecare.info, svc:'Home Care'},
  {keys:['volunteer'], a:"Our Hospice program welcomes volunteers for companionship and family support, it's deeply meaningful work. Leave your details and our volunteer coordinator will reach out."},
  {keys:['privacy','data','delete','hipaa','records','gdpr','ccpa','opt out'],
   a:"We take privacy seriously. Our Privacy Policy and HIPAA Notice of Privacy Practices explain exactly what we collect and why, and you can request access to or deletion of your data anytime using the Data Request form on our site."},
  {keys:['start','begin','next step','sign up','get care','how do i','enroll'],
   a:"Getting started is simple: a quick call with our intake team, we verify insurance and physician orders, and care typically begins within days."},
  {keys:['thank','thanks','bye','goodbye'], dyn:()=>`You're so welcome. We're here whenever you need us, ${PHONE}. Take care!`, noCta:true},
  {keys:['hi','hello','hey','good morning','good afternoon'],
   a:"Hello! Ask me anything about our services, Medicare coverage, our offices, or how to get started, or tap one of the options above.", noCta:true}
];

let leads = [], leadDraft = {};
const body = () => document.getElementById('chatBody');
const panel = () => document.getElementById('chatPanel');

/* the mobile call bar doubles as the chat control: expand / minimise */
function syncChatToggle(){
  const open = panel().classList.contains('open');
  const btn = document.getElementById('chatToggle');
  if(btn){
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    const tx = document.getElementById('chatToggleTx');
    const ic = document.getElementById('chatToggleIc');
    if(tx) tx.textContent = open ? 'Minimise chat' : 'Chat with us';
    if(ic) ic.innerHTML = open
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.7 8.7 0 0 1-3.6-.8L3 21l1.9-5.7a8.3 8.3 0 0 1-.9-3.8A8.4 8.4 0 0 1 12.5 3a8.4 8.4 0 0 1 8.5 8.5z"/></svg>';
  }
  const fab = document.querySelector('.chat-fab');
  if(fab) fab.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function toggleChat(){
  panel().classList.toggle('open');
  if(panel().classList.contains('open') && !body().hasChildNodes()) startFlow();
  syncChatToggle();
}
function openChat(ctx){
  panel().classList.add('open');
  body().innerHTML=''; startFlow(ctx);
  syncChatToggle();
  if(window.innerWidth<=760) panel().scrollIntoView({block:'nearest'});
}
function addMsg(text, who='bot'){ const m=document.createElement('div'); m.className='msg '+who; m.textContent=text; body().appendChild(m); body().scrollTop=body().scrollHeight; return m; }
function addTyping(){ const t=document.createElement('div'); t.className='msg bot typing'; t.innerHTML='<i></i><i></i><i></i>'; body().appendChild(t); body().scrollTop=body().scrollHeight; return t; }
function addOptions(opts){
  const w=document.createElement('div'); w.className='chat-options';
  opts.forEach(o=>{ const b=document.createElement('button'); b.className='chat-opt'; b.textContent=o.label;
    b.onclick=()=>{ w.remove(); addMsg(o.label,'user'); o.action(); }; w.appendChild(b); });
  body().appendChild(w); body().scrollTop=body().scrollHeight;
}

function startFlow(ctx){
  paintHours();
  addMsg("Hi! I'm the ProHealth Care Guide. Tap an option below, or just type your question. Medicare, costs, eligibility, our offices, anything.");
  const h = hoursState();
  if(!h.open) addMsg(`Heads up: our offices are closed right now. We open again ${h.gap}, on ${h.next} ${h.tz}. You can still leave your details and we'll call you then. Urgent? Our on-call clinical line is staffed 24/7 at ${PHONE}.`, 'note');
  if(ctx==='provider') return providerFlow();
  if(ctx && SERVICES[ctx]) return serviceInfo(ctx);
  if(ctx==='self') addMsg("Let's find the right care for you. Which of these sounds closest?");
  else if(ctx==='family') addMsg("You're in the right place. Which of these sounds closest to what your loved one needs?");
  addOptions([
    ...Object.entries(SERVICES).map(([k,v])=>({label:v.label, action:()=>serviceInfo(k)})),
    {label:"I'm a provider referring a patient", action:providerFlow}
  ]);
}

function serviceInfo(key, asked){
  const s=SERVICES[key]; leadDraft={service:s.label};
  asked = asked || [];
  if(!asked.length) addMsg(s.info);
  addMsg(asked.length ? "Anything else on your mind?" : "People usually want to know one of these next:");
  const left=(s.follow||[]).filter((f,i)=>!asked.includes(i));
  const opts=left.slice(0,4).map(f=>({label:f[0], action:()=>{
    const idx=s.follow.indexOf(f);
    addMsg(f[1]);
    serviceInfo(key, asked.concat([idx]));
  }}));
  opts.push({label:"Request a callback", action:()=>leadForm('callback')});
  if(asked.length) opts.push({label:"Ask about another service", action:()=>{
    addMsg("Of course. Which one?");
    addOptions(Object.entries(SERVICES).map(([k,v])=>({label:v.label, action:()=>serviceInfo(k)})));
  }});
  addOptions(opts);
}

function providerFlow(){
  leadDraft={service:"Provider referral"};
  const h = hoursState();
  addMsg("Thank you for thinking of ProHealth.");
  addMsg(h.open
    ? `Our intake team responds to referrals within 2 hours during business hours, with same-day patient contact.`
    : `Our intake team is offline right now and opens again ${h.gap}, on ${h.next} ${h.tz}. Send the referral and it is first in the queue. For an urgent referral, our on-call line is staffed 24/7 at ${PHONE}.`);
  addMsg("Leave your details and the best number and intake will call you back.");
  leadForm('referral');
}

function matchIntent(text){
  const t = ' ' + text.toLowerCase().replace(/[^a-z0-9\s\/-]/g,' ') + ' ';
  let best=null, bestScore=0;
  for(const item of KB){
    let score=0;
    for(const k of item.keys){
      if(k.length<=3){ if(new RegExp('\\b'+k.trim()+'\\b').test(t)) score+=1; }
      else if(t.includes(k)) score+=2;
    }
    if(score>bestScore){ bestScore=score; best=item; }
  }
  return bestScore>0 ? best : null;
}

/* ---- guard: politely refuse sensitive identifiers and clinical detail ---- */
const PII=[
 {re:/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/, what:"a Social Security number"},
 {re:/\b(?:ssn|social security)\b/i, what:"a Social Security number"},
 {re:/\b(?:member|policy|subscriber|medicare|medicaid|medi-?cal|insurance|group|claim)\s*(?:id|#|no\.?|number)\b/i, what:"an insurance or policy number"},
 {re:/\b[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{3,4}\b/, what:"a card number"},
 {re:/\b[A-Z]{3}\d{6,12}\b/, what:"a policy or member number"},
 {re:/\b(?:my|his|her|their)\s+(?:mrn|medical record number|chart number)\b/i, what:"a medical record number"},
 {re:/\b(?:date of birth|dob|birthdate)\b/i, what:"a date of birth"},
 {re:/\b(?:credit card|debit card|cvv|routing|account number|bank account)\b/i, what:"payment details"},
 {re:/\b(?:hiv|aids)\b/i, what:"sensitive health details", clinical:true},
 {re:/\b(?:diagnos(?:is|ed)|prognosis|biopsy|tumou?r|chemo|oncolog|dementia|alzheimer|stage\s*(?:1|2|3|4|i|ii|iii|iv)\b)/i, what:"medical details", clinical:true},
 {re:/\b(?:mg|milligrams?)\b|\b(?:morphine|oxycodone|fentanyl|hydrocodone|warfarin|insulin)\b/i, what:"medication details", clinical:true},
];
function piiHit(text){ for(const p of PII){ if(p.re.test(text)) return p; } return null; }
function piiWarn(hit){
  const h=hoursState();
  addMsg(`I need to stop you there, kindly. Please don't share ${hit.what} in this chat. It isn't a secure or private channel, and I'm not a clinician, so I genuinely can't help with it here.`,'warn');
  addMsg(hit.clinical
    ? `For anything about a diagnosis, symptoms or medication, please speak to a nurse on ${PHONE}. That line is staffed 24/7 for our patients and everything you say there is protected.`
    : `Our intake team will take those details securely over the phone on ${PHONE}, or you can leave just your name and number below and we'll call you.`);
  addOptions([
    {label:"Leave my name and number", action:()=>leadForm('callback')},
    {label:`I'll call ${PHONE}`, action:()=>addMsg(`Perfect. ${hoursLine()}`)}
  ]);
}

function sendFree(e){
  e.preventDefault();
  const input=document.getElementById('freeInput');
  const text=input.value.trim();
  if(!text) return false;
  panel().classList.add('open'); syncChatToggle();
  const hit=piiHit(text);
  addMsg(hit ? text.replace(/[0-9]/g,'•') : text, 'user');   // never echo raw identifiers back
  input.value='';
  document.querySelectorAll('.chat-options').forEach(el=>el.remove());
  const typing=addTyping();
  setTimeout(()=>{ typing.remove(); hit ? piiWarn(hit) : routeFree(text); }, 550);
  return false;
}

function routeFree(text){
  const hit = matchIntent(text);
  if(hit){
    if(hit.action==='provider') return providerFlow();
    if(hit.svc) leadDraft={service:hit.svc};
    addMsg(hit.dyn ? hit.dyn() : hit.a);
    if(!hit.noCta){
      addOptions([
        {label: hit.cta==='careers' ? "Have a recruiter call me" : "Request a callback",
         action:()=>{ if(hit.cta==='careers') leadDraft={service:"Careers inquiry"}; leadForm('callback'); }},
        {label:"Ask another question", action:()=>addMsg("Go ahead. I'm listening.")}
      ]);
    }
    return;
  }
  aiFallback(text);
}

async function aiFallback(text){
  const typing=addTyping();
  const h = hoursState();
  try{
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1000, messages:[{role:"user", content:
        `You are the ProHealth Care Guide on the website of ProHealth Home Care, Inc. a locally owned, Medicare-certified home health and hospice agency serving 20 California counties from six offices (Sacramento, Walnut Creek, San Jose, Stockton, Monterey, Fresno). Services: Home Health (skilled nursing, PT/OT/speech at home, Medicare-covered when qualifying), Hospice (comfort-focused end-of-life care, Medicare-covered), Palliative Care (symptom relief alongside treatment), Home Care (private-pay non-medical caregiving). Toll free: ${PHONE}. Office hours Mon-Fri 8:30am-5:00pm Pacific; 24/7 on-call clinical line for patients. Right now the office is ${h.open?'OPEN':'CLOSED'}${h.open?'':' (reopens '+h.next+' '+h.tz+')'}. Answer the visitor's question warmly in under 60 words. Never give medical advice or diagnoses, for anything clinical or uncertain, suggest calling ${PHONE}. Never promise a 2-hour response when the office is closed. Visitor's question: ${text}`}]})
    });
    const data = await response.json();
    const reply = (data.content||[]).map(i=>i.type==="text"?i.text:"").join("").trim();
    typing.remove();
    if(!reply) throw new Error("empty");
    addMsg(reply);
    addOptions([
      {label:"Request a callback", action:()=>leadForm('callback')},
      {label:"Ask another question", action:()=>addMsg("Go ahead. I'm listening.")}
    ]);
  }catch(err){
    typing.remove();
    addMsg(`That's a great question, and I want to make sure you get exactly the right answer. Our care team can help directly, want a callback? ${h.open?'':'We\u2019ll reach you '+h.next+' '+h.tz+'.'}`);
    addOptions([
      {label:"Yes, request a callback", action:()=>leadForm('callback')},
      {label:"I'll call instead", action:()=>addMsg(`Perfect, ${PHONE}, toll free. ${hoursLine()}`)}
    ]);
  }
}

function ctaCallback(){
  panel().classList.add('open'); syncChatToggle();
  if(!body().hasChildNodes()) startFlow();
  if(document.querySelector('.chat-form')){ document.querySelector('#cf-name').focus(); return; }
  document.querySelectorAll('.chat-options').forEach(el=>el.remove());
  const h=hoursState();
  addMsg(h.open ? "Happy to help, our care team will call you shortly. Just your name and number:"
                : `Of course. We're closed right now, so we'll call you ${h.next} ${h.tz}. Just your name and number:`);
  leadForm('callback');
}
function ctaDone(name){
  const c=document.getElementById('chatCta'); if(!c) return;
  c.classList.add('done');
  c.innerHTML='<p><b>\u2713 Got it, '+name+'.</b> Our team will be in touch.</p>';
}
function leadForm(kind){
  const f=document.createElement('form'); f.className='chat-form';
  f.innerHTML=`
    <label for="cf-name">Your name</label>
    <input id="cf-name" required autocomplete="name" placeholder="Full name">
    <label for="cf-phone">Phone number</label>
    <input id="cf-phone" required type="tel" autocomplete="tel" placeholder="(555) 555-5555">
    <button class="btn btn-blue" type="submit">${kind==='referral'?'Send to intake team':'Request my callback'}</button>`;
  f.onsubmit=(e)=>{
    e.preventDefault();
    const lead={ ...leadDraft, name:f.querySelector('#cf-name').value, phone:f.querySelector('#cf-phone').value,
                 type:kind, page:location.pathname, ts:new Date().toISOString() };
    leads.push(lead);
    console.log('LEAD CAPTURED (POST to /api/leads in production):', lead);
    f.remove();
    addMsg(`${lead.name} · ${lead.phone}`,'user');
    const h = hoursState();
    if(kind==='referral'){
      addMsg(h.open
        ? "Got it. Your referral is with our intake team now and they aim to respond within 2 hours during business hours. Thank you."
        : `Got it, and thank you. Our intake team is offline right now, so this will be waiting for them when we open ${h.gap}, on ${h.next} ${h.tz}. They will call you back from there. If the patient needs something sooner, our on-call clinical line is staffed 24/7 at ${PHONE}.`);
    } else {
      const who = lead.name.split(' ')[0];
      addMsg(h.open
        ? `Thank you, ${who}. Our care team has your details and will call you shortly about ${leadDraft.service||'your enquiry'}.`
        : `Thank you, ${who}. We are closed at the moment, so nobody will call you tonight. We open ${h.gap}, on ${h.next} ${h.tz}, and our care team will be in touch then about ${leadDraft.service||'your enquiry'}. If you need someone sooner, our on-call clinical line is 24/7 at ${PHONE}.`);
    }
    ctaDone(lead.name.split(' ')[0]);
  };
  body().appendChild(f); body().scrollTop=body().scrollHeight;
  f.querySelector('#cf-name').focus();
}
