#!/usr/bin/env python3
import sys, os
ROOT = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, ROOT)
from gen2_base import *

SEARCH_JS = '''
/* one question open at a time */
document.querySelectorAll('.faq details').forEach(d=>{
  d.addEventListener('toggle',()=>{ if(!d.open) return;
    document.querySelectorAll('.faq details').forEach(o=>{ if(o!==d) o.open=false; }); });
});
/* sticky topic index highlights the group in view */
const tps=[...document.querySelectorAll('.topic')], grps=[...document.querySelectorAll('.faq-group')];
if(grps.length){
  const go=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting) tps.forEach(a=>a.classList.toggle('on', a.dataset.t===e.target.id));
  }),{rootMargin:'-110px 0px -65% 0px'});
  grps.forEach(g=>go.observe(g));
}
/* deep links from service pages: /faqs/#coverage-cost */
function openHash(){
  const h=location.hash.slice(1); if(!h) return;
  const g=document.getElementById(h); if(!g) return;
  const first=g.querySelector('details'); if(first) first.open=true;
  setTimeout(()=>g.scrollIntoView({behavior:'smooth',block:'start'}),60);
}
addEventListener('hashchange',openHash); openHash();
function quickSearch(w){
  const q=document.getElementById('faqQ'); if(!q) return;
  q.value=w; q.dispatchEvent(new Event('input'));
  document.querySelector('.faq-layout').scrollIntoView({behavior:'smooth',block:'start'});
}
/* live search */
const q=document.getElementById('faqQ');
if(q){
  q.addEventListener('input',()=>{
    const t=q.value.trim().toLowerCase(); let hits=0;
    document.querySelectorAll('.faq-group').forEach(g=>{
      let gh=0;
      g.querySelectorAll('details').forEach(d=>{
        const txt=d.textContent.toLowerCase(); const m=!t||txt.includes(t);
        d.style.display=m?'':'none'; if(m){gh++;hits++;}
        if(t&&m) d.open=true; if(!t) d.open=false;
      });
      g.style.display=gh?'':'none';
    });
    document.getElementById('faqNone').style.display=hits?'none':'block';
    document.querySelectorAll('.topic').forEach(a=>a.style.opacity=t?'.45':'1');
  });
}
'''

def faq_page(slug, canon, title, desc, kicker, h1, lead, groups, tab, hero_bg, extra_ld=None, hint_words=None):
    hints=''.join(f'<button type="button" onclick="quickSearch(\'{w}\')">{w}</button>' for w in (hint_words or []))
    tabs = f'''<div class="faq-nav">
<a class="faq-tab" href="/faqs/"{' aria-current="page"' if tab=='patients' else ''}>{ICONS['heart']}For patients &amp; families</a>
<a class="faq-tab" href="/faqs/careers/"{' aria-current="page"' if tab=='careers' else ''}>{ICONS['briefcase']}For job seekers</a></div>'''
    topics=''.join(f'''<a class="topic" href="#{gid}" data-t="{gid}"><span class="ic">{ICONS[ic]}</span><span class="tx"><b>{gt}</b><small>{len(qs)} questions</small></span></a>'''
                   for gid,ic,gt,qs in groups)
    body_groups=''
    for gid,ic,gt,qs in groups:
        body_groups+=f'''<div class="faq-group" id="{gid}"><h3><span class="ic">{ICONS[ic]}</span>{gt}</h3>{faq_html(qs,False)}</div>'''
    allq=[q for _g,_i,_t,qs in groups for q in qs]
    body=f'''<div class="hero"><div class="hero-bg" aria-hidden="true"><img src="{hero_bg}" alt="" loading="eager" onerror="this.remove()"></div><div class="wrap">
{crumbs([('/','Home'),(None,'FAQs') if tab=='patients' else ('/faqs/','FAQs'),*([] if tab=='patients' else [(None,'Careers')])])}
<div class="hero-solo" style="max-width:720px"><p class="kicker">{kicker}</p><h1>{h1}</h1><p class="lead" style="margin-bottom:0">{lead}</p>
<div class="faq-hero-search"><span class="si">{ICONS['search']}</span>
<label for="faqQ" style="position:absolute;left:-9999px">Search the FAQs</label>
<input id="faqQ" type="search" placeholder="Ask a question, e.g. does Medicare cover this?" autocomplete="off"></div>
<div class="faq-hint"><b>Popular:</b>{hints}</div>
</div></div></div>
<section class="tex" style="padding-top:44px">{wm('r')}<div class="wrap">
{tabs}
<div class="faq-layout">
<aside class="faq-side"><h3>Browse by topic</h3><div class="faq-topics" id="faqTopics">{topics}</div></aside>
<div class="faq-main">
<div class="faq">{body_groups}<div class="faq-none" id="faqNone">No questions matched that. Try another word, or just call us on <a href="tel:+18776678770" style="color:var(--blue-dark);font-weight:600">{PHONE}</a>. We would rather talk anyway.</div></div>
</div></div>
</div></section>
<section class="final-cta tex" style="padding:56px 0"><div class="wrap">
<h2 class="reveal">Still have a question?</h2>
<p class="section-lead reveal" style="margin:0 auto 22px">Real people answer our phone, Mon–Fri 8:30am–5:00pm PT, and our on-call clinical line is staffed 24/7 for patients.</p>
<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
<a class="btn btn-blue reveal" href="tel:+18776678770">Call {PHONE}</a>
<button class="btn btn-outline reveal d1" onclick="openChat()">Ask our Care Guide</button></div></div></section>'''
    ld={"@context":"https://schema.org","@graph":[faq_ld(allq),
        {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://prohealth.us/"},
         {"@type":"ListItem","position":2,"name":"FAQs","item":"https://prohealth.us/faqs/"}]+([{"@type":"ListItem","position":3,"name":"Careers FAQs"}] if tab=='careers' else [])}]}
    shell(slug,title,desc,canon,body,ld,active='/faqs/',extra_js=SEARCH_JS)

# ================= PATIENT FAQs =================
PATIENT=[
 ('getting-started','play','Getting started',[
  ("How do I start care with ProHealth?",f"One phone call to {PHONE}. Our intake team listens, works out which service fits, verifies your insurance for free, and coordinates the physician order if one is needed. For home health, the first visit is usually within 24–48 hours."),
  ("Do I need a doctor's referral?","For Home Health, Hospice and Palliative Care, yes, a physician's order is required. If you don't have one, call us anyway: we contact your doctor's office directly and arrange it. Home Care (non-medical caregiving) needs no order at all, you can start that today."),
  ("How quickly can care begin?","Home Health typically starts within 24–48 hours of a referral. Hospice can begin within a day of your call, sometimes the same day. Home Care usually begins within a few days of the free in-home assessment."),
  ("What happens on the first visit?","A nurse or coordinator comes to your home, listens to what's going on, reviews medications and safety, and builds a care plan around your goals, not a template. Nothing is decided without you."),
  ("Can we choose which office serves us?","Your care comes from whichever of our six offices is closest, so your clinician is genuinely local. Tell us your zip code and we'll tell you which team you'd have."),
 ]),
 ('services','grid','Choosing the right service',[
  ("What's the difference between Home Health and Home Care?","Home Health is skilled <b>medical</b> care, nursing and therapy, ordered by a physician and usually covered by Medicare. Home Care is <b>non-medical</b> help with daily living: bathing, meals, companionship. It's private-pay and needs no order. Many families use both."),
  ("What's the difference between Hospice and Palliative Care?","Palliative care gives comfort and symptom relief at <b>any</b> stage of a serious illness, alongside treatment that's still trying to cure. Hospice gives that same comfort-focused care when curative treatment is no longer the goal. Our palliative program is deliberately built to bridge into hospice with the same familiar team, if that day ever comes."),
  ("Is hospice giving up?","No, and we say this gently, because it's the question families agonise over most. Hospice patients often feel better and live more fully once symptoms are properly controlled. Families consistently tell us they wish they had called sooner."),
  ("Can we change our minds after starting hospice?","Yes. You can leave hospice at any time and return to curative treatment, and come back to hospice later if you wish. Nothing is locked in, ever."),
  ("Can services be combined?","Absolutely. A very common pattern is Home Health for the clinical visits plus Home Care caregivers filling the hours in between. One agency, coordinated plans, no crossed wires."),
 ]),
 ('coverage-cost','dollar','Coverage &amp; cost',[
  ("Does Medicare cover home health?","For qualifying patients, Medicare covers home health at 100%, most families pay nothing out of pocket. Our intake team verifies your exact coverage for free before any care begins, so there are no surprises."),
  ("Who pays for hospice?","The Medicare Hospice Benefit covers eligible patients at 100%, including medications, equipment and supplies related to the hospice diagnosis. Medi-Cal and most private insurance offer similar benefits."),
  ("How much does Home Care cost?","Home Care is private-pay with transparent hourly rates that depend on the schedule and level of care. After a free in-home assessment we give you an exact quote, no long-term contracts. Long-term care insurance often applies and we'll help you check."),
  ("Which insurance do you accept?","Medicare, Medi-Cal and most major insurance plans for Home Health and Hospice. Palliative coverage varies by plan, we check yours free of charge."),
  ("What does \u201chomebound\u201d actually mean?","It means leaving home takes considerable effort, you need help, a device, or another person to do it safely. You can still be homebound and leave for medical appointments, religious services, or the occasional short outing. It's a common misunderstanding that stops people getting care they qualify for."),
  ("Will I get a surprise bill?","Not from us. We verify benefits before care starts and tell you in plain language what's covered and what isn't. If something wouldn't be covered, you hear it from us first, not from a statement later."),
 ]),
 ('your-care','pulse','Your care &amp; team',[
  ("Can I keep my own doctor?","Yes. Your physician stays involved and works alongside our clinical team, for hospice, alongside our medical director too."),
  ("Who will be coming to my home?","Depending on your plan: registered nurses, physical/occupational/speech therapists, home health aides, medical social workers, and for hospice, chaplains and volunteers. Every one is licensed where required, background-checked, insured and supervised."),
  ("How often are the visits?","Your physician's orders and your care plan set the frequency, commonly 1–3 visits a week for home health, adjusted as you progress. Hospice adds a nurse on call 24/7, every day of the year."),
  ("What if I need someone at 2am?","Our on-call clinical line is staffed 24/7 for our patients, a real nurse, not an answering service. For a life-threatening emergency, always call 911 first."),
  ("Where can care be provided?","Wherever you call home, a house or apartment, an assisted living community, or a skilled nursing facility."),
  ("Can family be involved?","Please be. We teach families how to help safely, and for hospice we support the whole family, including bereavement support that continues for 13 months after a loss."),
 ]),
 ('privacy','lock','Privacy &amp; your records',[
  ("How is my health information protected?","Under HIPAA and California law, which is stricter still. Our <a href=\"/notice-of-privacy-practices/\">Notice of Privacy Practices</a> explains exactly how we may use and disclose your information, and what always requires your written say-so."),
  ("Can I get a copy of my medical record?","Yes. We respond within 15 days, following California's stricter standard rather than HIPAA's 30. Ask via our <a href=\"/data-request/\">Data Request form</a> or call us."),
  ("Can I ask you to delete my data?","Yes, use the <a href=\"/data-request/\">Data Request form</a>. Some records we're legally required to keep (patient medical records under Medicare and California licensure rules); where that applies we tell you precisely which exception it is and delete everything else."),
  ("Do you sell my information?","No. ProHealth does not sell personal information and does not share it for cross-context behavioral advertising. There's no opt-out link on this site because there's nothing to opt out of."),
  ("Is the website chat secure for medical details?","Please don't put medical details in chat, it's convenient, not clinical. Use it to ask general questions or leave a callback number, and talk to a nurse on the phone for anything about your condition."),
 ]),
 ('areas','map','Areas &amp; offices',[
  ("Which areas do you serve?","20 California counties from six offices: Sacramento, Walnut Creek, San Jose, Stockton, Monterey and Fresno. The full county list and directions are on our <a href=\"/locations/\">Locations &amp; Coverage</a> page."),
  ("Do you cover rural areas?","Yes, our coverage reaches rural communities across the Central Valley, Sierra foothills and Central Coast. Call with your address and we'll confirm in a minute."),
  ("Are services the same at every office?","Home Health, Hospice, Palliative Care and Home Care are available across our service area. Specific programs can vary slightly by county; intake confirms when you call."),
 ]),
]
faq_page('faqs','faqs/','FAQs | Home Health, Hospice & Home Care | ProHealth',
 'Answers to the questions California families ask most about home health, hospice, palliative care and home care. Medicare coverage, eligibility, getting started, and your privacy rights.',
 'Questions &amp; answers','Everything families ask us, <em>answered plainly.</em>',
 "No jargon, no sales pitch. These are the real questions people ask when someone they love needs care, and the honest answers we would give you on the phone.",
 PATIENT,'patients','/assets/photos/homehealth-vitals.jpg',
 hint_words=['Medicare','cost','eligibility','hospice','how to start','service areas'])

# ================= CAREERS FAQs =================
CAREERS=[
 ('applying','send','Applying',[
  ("How do I apply?","Use the form on our <a href=\"/careers/\">Careers page</a>, name, phone, email, role, and your resume as a PDF. It takes about two minutes. Our recruiter usually calls within one business day."),
  ("Why PDF only, and why 2 MB?","PDFs open identically for every reviewer, so your formatting survives, and a 2 MB cap keeps uploads fast on a phone. Exporting from Word to PDF takes one click and virtually always lands well under the limit."),
  ("What if you have no opening for my role?","Apply anyway. Our openings list is live, but great people always have a place here, we keep applications on file for 3 years and call when something fits."),
  ("How long until I hear back?","A recruiter typically calls within one business day. If you applied over a weekend, expect Monday."),
  ("Can I apply for more than one office?","Yes, pick your preferred office on the form, or choose \u201cFlexible / any\u201d. We staff six locations and often have room across several."),
  ("Do you offer a referral bonus for staff?","We do run referral programmes for current employees, ask your recruiter for the current terms, as they change."),
 ]),
 ('roles','briefcase','Roles &amp; requirements',[
  ("Who do you hire?","Registered Nurses, Licensed Vocational Nurses, Physical Therapists, Occupational Therapists, Speech Therapists, Home Health Aides and caregivers, plus medical social workers and office staff."),
  ("Do I need home health experience?","It helps but it isn't required for every role. Many of our clinicians came from hospitals, ERs, skilled nursing and surgery centers, we train for the home health specifics."),
  ("What licensure do you need to see?","An active, unrestricted California license for licensed roles (RN, LVN, PT, OT, SLP), plus current CPR certification. HHAs need current California HHA certification. Bring the number and we'll verify it."),
  ("Is there a background check?","Yes, background check, health clearance including TB, and license verification. Our patients are vulnerable and we protect them carefully."),
  ("Do I need my own car?","For field roles, yes, a reliable vehicle, valid California license and current auto insurance, since you're travelling to patients' homes."),
 ]),
 ('working-here','heart','Working here',[
  ("What are the schedules like?","Flexible, and that's not a slogan, it's the main reason clinicians come to us from hospital settings. Full-time, part-time and per-diem across all six offices."),
  ("How many patients would I see a day?","It depends on role, geography and acuity, your recruiter will give you the honest number for the specific territory rather than a brochure figure."),
  ("What's the culture actually like?","Small enough that leadership knows your name, big enough to have six offices behind you. We're locally owned, which means decisions get made here, not at a corporate HQ in another state."),
  ("Do you support continuing education?","Yes, our clinicians include Doctorate-level therapists and specialty-certified nurses, and we support advancement. Ask your recruiter what's available for your discipline."),
  ("Can I move between offices?","Often, yes. A choice of locations is one of the things we genuinely offer, if you relocate within our footprint, talk to us before you resign."),
 ]),
 ('benefits','shield','Pay &amp; benefits',[
  ("What does it pay?","Compensation depends on discipline, experience and location, our recruiter discusses the specific range for the role on the first call, rather than posting a number that doesn't fit everyone."),
  ("Is ProHealth an equal opportunity employer?","Yes. We make employment decisions without regard to any protected characteristic, and we provide reasonable accommodation for disabilities and sincerely held religious beliefs. See our <a href=\"/nondiscrimination/\">Nondiscrimination Notice</a>."),
  ("I need an accommodation to apply, can you help?",f"Absolutely. If the online form is a barrier for any reason, call {PHONE} and we'll take your application another way. That's a commitment, not a courtesy."),
 ]),
 ('volunteering','users','Volunteering',[
  ("Can I volunteer instead of working?","Yes, our Hospice program welcomes volunteers for companionship, family respite and bereavement support. Full training provided, typically 2–4 hours a week. See the <a href=\"/volunteer/\">Volunteer page</a>."),
  ("Do volunteers need experience?","None. We train you. What matters is warmth, reliability and respect for the families you'll meet."),
  ("Is there screening for volunteers?","Yes, a conversation, background check, health clearance and training, exactly as you'd hope for people entering a patient's home."),
 ]),
 ('your-data','lock','Your data as an applicant',[
  ("What do you do with my resume?","It's used solely for recruitment, hiring and required employment verification, stored in access-controlled storage, and shared only with our hiring team. Full detail in our <a href=\"/privacy-policy/\">Privacy Policy</a>."),
  ("How long do you keep applications?","Three years from application, for EEO recordkeeping and future opportunities, then it's securely deleted."),
  ("Can I have my application deleted?","Yes, any time, no questions and no effect on future candidacy. Use the <a href=\"/data-request/\">Data Request form</a> and pick \u201cWithdraw consent / delete my job application &amp; resume\u201d."),
 ]),
]
faq_page('faqs/careers','faqs/careers/','Careers FAQs | Jobs at ProHealth Home Care',
 'Answers for people applying to ProHealth Home Care: how to apply, licensure and background checks, schedules, six California offices, benefits, volunteering and your data.',
 'Careers Q&amp;A','Thinking of joining us? <em>Start here.</em>',
 "Straight answers about applying, licensure, schedules and what it is actually like, from the people who would be your colleagues.",
 CAREERS,'careers','/assets/team-building.jpg',
 hint_words=['licence','resume','schedule','pay','benefits','volunteering'])
print('faq pages done')
