#!/usr/bin/env python3
import sys, os
ROOT = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, ROOT)
from gen2_base import *


# Verified from the live site: prohealth.us/careers/ embeds exactly this one video.
CAREERS_VIDEO = 'EfZZgqSnk-8'

def video_block(vid,title,sub,lead,meta='Straight from our clinical team &middot; YouTube'):
    return f'''<section class="tex" style="padding-top:0">{wm('l')}<div class="wrap">
<div style="text-align:center"><p class="kicker reveal">Watch</p><h2 class="reveal">{title}</h2>
<p class="section-lead reveal" style="margin:0 auto 34px">{lead}</p></div>
<div class="vid reveal" style="max-width:840px;margin:0 auto">
<div class="frame" data-yt="{vid}" role="button" tabindex="0" aria-label="Play video: {sub}">
{yt_thumb(vid, sub)}
<div class="play"><span>{ICONS['play']}</span></div></div>
<div class="meta"><h3>{sub}</h3><p>{meta}</p></div></div></div></section>'''

YT_JS = '''
document.querySelectorAll('.frame[data-yt]').forEach(f=>{
  const go=()=>{ const id=f.dataset.yt;
    f.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0" title="ProHealth video" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe>';
    f.style.cursor='default'; };
  f.addEventListener('click',go);
  f.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
});
'''


# ---------- USP: tech-enabled end to end ----------
TECH_ITEMS=[('send','Referrals that never wait','Physicians and discharge planners refer from our apps or the web form. Intake is triaged automatically the moment it lands, so nothing sits in a queue overnight waiting for someone to notice it.'),
 ('shield','Care gaps flagged before they happen','Our systems watch every plan of care against its schedule and its orders. If a visit, a reassessment or a signature is drifting toward late, the team is alerted while there is still time to act. Care does not lapse because a diary was missed.'),
 ('pulse','Documentation at the point of care','Clinicians chart in the home, on the visit. Notes are validated against Medicare requirements as they are written, so errors surface in the room rather than in an audit six weeks later.'),
 ('clock','Scheduling that reorganises itself','Visits are matched to clinician, geography and acuity automatically, and a cancellation is rebalanced across the region in minutes. Less windscreen time, more bedside time.'),
 ('doc','Compliance checked continuously','Eligibility, authorisations and certification windows are monitored in the background, every day, across all six offices. Problems are caught early, while they are still small.'),
 ('users','Everyone on the same live record','Nurse, therapist, coordinator, physician and family all work from one current picture. One call reaches someone who can already see everything.')]
def tech_section(kicker='Fully tech enabled', h2='Old-fashioned care. Cutting-edge everything else.', lead=None):
    if lead is None:
        lead=(f'ProHealth has spent {YEARS_TEXT} learning where home health quietly goes wrong: a missed reassessment, '
              f'a certification that lapsed, a note written from memory at 9pm. We now run AI-assisted automation across '
              f'the whole pathway, from referral to final visit note, so those failures are caught by a system rather than '
              f'discovered by a family. Clinicians still make every clinical decision. The technology exists to make sure '
              f'nothing ever reaches them late.')
    cards=''.join(f'<article class="d-card reveal{["", " d1", " d2"][i%3]}"><span class="ic">{ICONS[ic]}</span><h3>{t}</h3><p>{d}</p></article>'
                  for i,(ic,t,d) in enumerate(TECH_ITEMS))
    return f'''<section class="disciplines has-bg on-g50"><div class="sec-bg" aria-hidden="true"><img src="/assets/photos/homecare-seated.jpg" alt="" loading="lazy" onerror="this.remove()"></div><div class="wrap">
<div style="text-align:center"><p class="kicker reveal">{kicker}</p><h2 class="reveal">{h2}</h2>
<p class="section-lead reveal" style="margin:0 auto 42px">{lead}</p></div>
<div class="grid3">{cards}</div>
<p style="text-align:center;font-size:.86rem;color:var(--slate);margin-top:28px" class="reveal">Every one of these exists for a single reason: so a clinician spends the visit looking at you, not at a clipboard.</p>
</div></section>'''

TECH_STRIP = f'''<div class="tech-strip reveal">
<span class="ts-ic">{ICONS['shield']}</span>
<div><b>Fully tech enabled, end to end</b><p>AI-assisted intake, automated care-gap detection and live scheduling across all six offices. Referrals are triaged the moment they land, and nothing waits on someone to remember it.</p></div>
</div>'''


BIZ={"@type":"MedicalBusiness","name":"ProHealth Home Care, Inc.","telephone":"+1-877-667-8770",
     "url":"https://prohealth.us","image":LOGO,
     "address":{"@type":"PostalAddress","streetAddress":"1420 River Park Drive, Suite 200","addressLocality":"Sacramento","addressRegion":"CA","postalCode":"95815","addressCountry":"US"},
     "openingHoursSpecification":{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"08:30","closes":"17:00"},
     "areaServed":[{"@type":"AdministrativeArea","name":c+" County, CA"} for c in COUNTIES],
     "aggregateRating":{"@type":"AggregateRating","ratingValue":"4.9","reviewCount":"120"}}

def service_page(d):
    cards=''.join(f'<article class="d-card reveal{["", " d1", " d2"][i%3]}"><span class="ic">{ICONS[ic]}</span><h3>{t}</h3><p>{p}</p></article>' for i,(ic,t,p) in enumerate(d['included']))
    steps=''.join(f'<div class="step reveal{["", " d1", " d2", " d3"][i]}"><h3>{t}</h3><p>{p}</p></div>' for i,(t,p) in enumerate(d['steps']))
    fit=''.join(f'<li>{CHECK}{x}</li>' for x in d['fit'])
    body=f'''<div class="hero"><div class="hero-bg" aria-hidden="true"><img src="{d['hero_bg']}" alt="" loading="eager" onerror="this.remove()"></div><div class="wrap">{crumbs([('/','Home'),('/services/','Services'),(None,d['name'])])}
<div class="hero-grid"><div><p class="kicker">{d['name']}</p><h1>{d['h1']}</h1><p class="lead">{d['lead']}</p>
<div class="hero-cta"><a class="btn btn-blue" href="tel:+18776678770">Talk to intake · {PHONE}</a><a class="btn btn-outline" href="#how">See how it works</a></div></div>
<div class="hero-photo"><div class="ph"><img src="{d['img']}" alt="{d['img_alt']}" loading="eager" onerror="this.remove()"></div>
<div class="float-card fc-visit"><span class="ic-round">{ICONS[d['float_icon']]}</span><div><div class="fc-title">{d['float_title']}</div><div class="fc-sub">{d['float_sub']}</div></div></div></div>
</div></div></div>
<section class="tex">{wm('r')}<div class="wrap fit"><div><p class="kicker reveal">{d['fit_kicker']}</p><h2 class="reveal">{d['fit_h2']}</h2>
<p class="section-lead reveal" style="margin-bottom:0">{d['fit_lead']}</p></div>
<div class="fit-card reveal d1"><h3>{d['fit_card_title']}</h3><ul class="checks">{fit}</ul>
<p style="font-size:.86rem;color:var(--slate);margin-top:16px">Not sure? Send us your details and our intake team will check your eligibility and coverage for you, at no cost. <a href="/contact/?topic=coverage" style="color:var(--blue-dark);font-weight:600">Ask us to check &rarr;</a></p></div></div></section>
<section class="disciplines has-bg on-g50"><div class="sec-bg" aria-hidden="true"><img src="/assets/photos/homehealth-vitals.jpg" alt="" loading="lazy" onerror="this.remove()"></div><div class="wrap"><p class="kicker reveal">What's included</p><h2 class="reveal">{d['inc_h2']}</h2>
<p class="section-lead reveal">{d['inc_lead']}</p><div class="grid3">{cards}</div></div></section>
<section id="how"><div class="wrap"><p class="kicker reveal">How it works</p><h2 class="reveal">{d['how_h2']}</h2>
<p class="section-lead reveal">Simple steps, and we handle the paperwork at every one of them.</p><div class="steps">{steps}</div></div></section>
<section style="padding-top:0"><div class="wrap"><div class="coverage reveal"><img class="cov-wm" src="{MONO_WHITE}" alt="" aria-hidden="true">
<div><p class="kicker" style="color:var(--sky)">Coverage</p><h2>{d['cov_h2']}</h2><p>{d['cov_p']}</p></div>
<div class="coverage-actions"><div class="big">{d['cov_big']}<span style="font-size:1rem;color:#C8DFF0;font-weight:500"> {d['cov_big_sub']}</span></div>
<a class="btn btn-white" href="/contact/?topic=coverage">Ask us to check your coverage</a>
<a class="btn btn-ghost" href="/refer-a-patient/">Are you a provider? Refer a patient</a></div></div></div></section>
<section class="faq-sec"><div class="wrap"><div class="faq-cta reveal">
<span class="ic">{ICONS['help']}</span>
<div><h3>{d['name']} questions, answered</h3>
<p>{d['faq_teaser']} We keep the full set on one page, grouped by topic and searchable, so you can find yours in seconds.</p></div>
<a class="btn btn-blue" href="/faqs/#{d['faq_anchor']}">Read the {d['name']} FAQs</a>
</div></div></section>
{d.get('video_html','')}
<section class="dots"><div class="wrap quote-strip reveal"><span class="stars" aria-hidden="true">★★★★★</span><p>"{d['quote']}"</p><footer>{d['quote_by']}</footer>{G_BADGE}</div></section>
<section class="final-cta has-bg on-warm" style="padding:64px 0"><div class="sec-bg" aria-hidden="true"><img src="/assets/photos/homecare-seated.jpg" alt="" loading="lazy" onerror="this.remove()"></div><div class="wrap"><h2 class="reveal">{d['cta_h2']}</h2>
<p class="section-lead reveal" style="margin:0 auto 24px">One call and we take it from there, eligibility, coverage, and scheduling.</p>
<a class="btn btn-blue reveal d1" href="tel:+18776678770">Call {PHONE}, toll free</a></div></section>'''
    ld={"@context":"https://schema.org","@graph":[
        {"@type":"Service","name":d['name'],"provider":BIZ,"areaServed":[c+" County, CA" for c in COUNTIES],"serviceType":d['name']},
        {"@type":"BreadcrumbList","itemListElement":[
          {"@type":"ListItem","position":1,"name":"Home","item":"https://prohealth.us/"},
          {"@type":"ListItem","position":2,"name":"Services","item":"https://prohealth.us/services/"},
          {"@type":"ListItem","position":3,"name":d['name']}]}, faq_ld(d['faqs'])]}
    shell(d['slug'], d['title'], d['desc'], d['canon'], body, ld, active='/services/', extra_js=YT_JS+YT_THUMB_JS)

SERVICES_DATA=[
 dict(faq_anchor='coverage-cost', faq_teaser='Does Medicare cover it? Do I qualify? How fast can it start?', hero_bg='/assets/photos/homehealth-tea.jpg', slug='home-health-care', canon='home-health-care/', name='Home Health',
  title='Home Health Care in California | ProHealth',
  desc=f'Medicare-covered home health across 20 California counties: skilled nursing, physical, occupational & speech therapy at home. First visit within 24–48 hours. Call {PHONE}.',
  h1='Skilled care at home, <em>covered by Medicare.</em>',
  lead="Skilled nursing and physical, occupational and speech therapy, delivered where recovery happens fastest: your own home. First visit typically within 24–48 hours of referral.",
  img='/assets/photos/homehealth-vitals.jpg',
  img_alt='An older adult at home with their ProHealth clinician',
  float_icon='clock', float_title='First visit in 24–48 hrs', float_sub='After your referral',
  fit_kicker='Is home health right for you?', fit_h2='Made for recovery, rehabilitation and managing conditions at home',
  fit_lead="Home health is physician-ordered, skilled medical care. It's a fit if you're recovering from surgery or a hospital stay, managing a chronic condition, healing a wound, or regaining strength, and leaving home takes real effort.",
  fit_card_title='You likely qualify if:',
  fit=["Your doctor has ordered (or would order) skilled care at home","Leaving home takes considerable effort or assistance","You need nursing care or therapy on a part-time basis","You have Medicare or another qualifying insurance plan"],
  inc_h2='One coordinated team, six disciplines', inc_lead='Your physician sets the goals; our clinicians build a personalized plan around them and coordinate every visit.',
  included=[('pulse','Skilled Nursing','Wound care, medication management, injections, disease education, and post-surgical monitoring.'),
            ('users','Physical Therapy','Rebuild strength, balance and mobility after surgery, injury, stroke or a hospital stay, safely, at home.'),
            ('home','Occupational Therapy','Regain independence in daily living, dressing, bathing, cooking, with home-safety guidance.'),
            ('chat','Speech Therapy','Speech, language, swallowing and cognitive therapy after stroke, illness or neurological conditions.'),
            ('shield','Medical Social Services','Help navigating resources, benefits, and care planning, support for the whole family.'),
            ('heart','Home Health Aides','Hands-on personal care, bathing, grooming, mobility, supervised by your nursing team.')],
  how_h2='From referral to first visit in as little as a day',
  steps=[('Referral',f"Your doctor, discharge planner, or you, calls {PHONE}. We respond within 2 hours during business hours."),
         ('Verification',"We verify your Medicare or insurance coverage for free and coordinate the physician's order."),
         ('First visit',"A nurse visits within 24–48 hours to assess your needs and build your personalized care plan."),
         ('Recovery',"Your team visits on schedule, tracks progress with your doctor, and adjusts the plan until you meet your goals.")],
  cov_h2='Covered 100% by Medicare for qualifying patients',
  cov_p="Most families pay nothing out of pocket for home health. We also work with Medi-Cal and major insurance plans, and our intake team verifies your exact coverage for free, before care begins.",
  cov_big='$0', cov_big_sub='out-of-pocket for most Medicare patients',
  faqs=[("Does Medicare cover home health care?","Yes. For qualifying patients, Medicare covers home health services at 100%, most families pay nothing out of pocket. Our intake team verifies your coverage for free before care begins."),
        ("How quickly can care start?","Our intake team responds to every referral within 2 hours during business hours (Mon–Fri, 8:30am–5:00pm PT), and the first visit typically happens within 24 to 48 hours."),
        ("Do I need a doctor's order?","Yes, home health requires a physician's order. If you don't have one yet, call us anyway: we coordinate directly with your doctor's office to arrange it."),
        ("What does it mean to be \u201chomebound\u201d?","Homebound means leaving home takes considerable effort, you need help, a device, or another person to leave safely. You can still leave for medical appointments or short, infrequent outings."),
        ("Which areas do you serve?","We serve 20 California counties from six offices. Sacramento, Walnut Creek, San Jose, Stockton, Monterey and Fresno. See our Coverage page for the full list, or call us with your zip code.")],
  video_html=video_block('W3oxBep7T5s','Learn how Home Health is different at ProHealth','How Home Health works at ProHealth','Two minutes with our team on what makes recovery at home work, and what to expect from your first visit.'),
  quote="Nurse, Physical Therapist and Occupational Therapist are excellent, very detailed and pay close attention to my needs. So much better than my previous agency.",
  quote_by='Antoinette C. · Home Health patient', cta_h2='Recovery is easier with the right team behind you'),

 dict(faq_anchor='services', faq_teaser='Is it too early? Is it giving up? Who pays for it?', hero_bg='/assets/photos/hospice-portrait.jpg', slug='hospice', canon='hospice/', name='Hospice Care',
  title='Hospice Care at Home, California | ProHealth',
  desc='Compassionate hospice care at home across 20 California counties, pain and symptom relief, 24/7 on-call nursing, and family support. Covered by the Medicare Hospice Benefit.',
  h1='Comfort and dignity, <em>at home.</em>',
  lead="Hospice helps patients live as fully as possible, for as long as possible, managing pain and symptoms at home while supporting the entire family, emotionally and spiritually.",
  img='/assets/photos/palliative-bed.jpg',
  img_alt='Holding the hand of an elderly hospice patient at home',
  float_icon='heart', float_title='24/7 on-call nursing', float_sub='Whenever you need us',
  fit_kicker='Is it time for hospice?', fit_h2='Choosing comfort is not giving up, it\u2019s choosing how to live',
  fit_lead="Hospice is for patients whose focus has shifted from treating an illness to comfort and quality of life. Families consistently tell us they wish they had called sooner.",
  fit_card_title='Hospice may be right when:',
  fit=["A physician believes the illness is life-limiting","Treatments are no longer working, or no longer wanted","Symptoms like pain or shortness of breath need expert relief","The family needs support, guidance and time together"],
  inc_h2='Everything comfort requires, brought to you',
  inc_lead='One team, nurses, aides, social workers, chaplains and volunteers, coordinating around your loved one.',
  included=[('pulse','Pain & symptom management','Expert relief from pain, shortness of breath, nausea and restlessness, reviewed continuously.'),
            ('clock','Nursing visits & 24/7 on-call','Scheduled visits plus a nurse on call around the clock, every day of the year.'),
            ('heart','Emotional & spiritual support','Social workers and chaplains support the patient and family, on your terms and in your tradition.'),
            ('users','Home health aides','Gentle help with bathing, grooming and personal care that preserves dignity.'),
            ('shield','Medications, equipment & supplies','Everything related to the hospice diagnosis, delivered to the home and fully covered.'),
            ('chat','Bereavement support','Grief support for the family that continues for 13 months after a loss, plus trained <a href="/volunteer/" style="color:var(--blue-dark);font-weight:600">volunteers</a> who simply sit with you.')],
  how_h2='Care can begin within a day of your call',
  steps=[('Reach out',f"Call {PHONE}, a caring intake coordinator listens and answers every question, with no pressure."),
         ('Eligibility',"We coordinate with the physician the same day to confirm hospice eligibility and wishes."),
         ('Care begins',"Nursing visits start, and medications, equipment and supplies are delivered to the home."),
         ('Ongoing support',"The full team surrounds your family, and bereavement support continues afterward.")],
  cov_h2='Fully covered by the Medicare Hospice Benefit',
  cov_p="For eligible patients, Medicare covers hospice care at 100%, including medications, equipment and supplies related to the diagnosis. Medi-Cal and most private insurance offer similar benefits. We verify everything for free.",
  cov_big='$0', cov_big_sub='out-of-pocket for eligible Medicare patients',
  faqs=[("Is choosing hospice giving up?","No. Hospice patients often feel better and live more fully once symptoms are controlled, hospice is about making the time that remains as good as it can be, at home, surrounded by family."),
        ("Who pays for hospice?","The Medicare Hospice Benefit covers eligible patients at 100%, including related medications, equipment and supplies. Medi-Cal and most private plans offer similar coverage. We verify your benefits for free."),
        ("Can we keep our own doctor?","Yes. Your physician can remain involved in your care and works alongside our hospice medical director."),
        ("What if we change our minds?","You can leave hospice at any time and return to curative treatment, and return to hospice later if you wish. Nothing is locked in."),
        ("Where is hospice care provided?","Wherever the patient calls home, a private residence, an assisted living community, or a skilled nursing facility.")],
  video_html=video_block('ZMo_s33qi58','Learn how Hospice is different at ProHealth','How Hospice works at ProHealth','What hospice really means, explained gently by the people who provide it every day.'),
  quote="Extremely satisfied and very thankful with the Hospice team, that they are there for my mom.",
  quote_by='Dorothy N. · Family member', cta_h2='The kindest call you can make is often the hardest one'),

 dict(faq_anchor='services', faq_teaser='How is this different from hospice? Do I have to stop treatment?', hero_bg='/assets/photos/hospice-hands.jpg', slug='palliative-care', canon='palliative-care/', name='Palliative Care',
  title='Palliative Care at Home, California | ProHealth',
  desc=f'Palliative care at home across 20 California counties: relief from the symptoms and stress of serious illness at any stage, alongside your current treatment. Call {PHONE}.',
  h1='Relief from serious illness, <em>alongside treatment.</em>',
  lead="Palliative care brings comfort, symptom relief and an extra layer of support at any stage of a serious illness, without giving up your current treatment or your own doctors.",
  img='/assets/photos/review-smile.jpg',
  img_alt='An older adult in a wheelchair with their carer at home',
  float_icon='shield', float_title='At any stage of illness', float_sub='Alongside your treatment',
  fit_kicker='Is palliative care right for you?', fit_h2='For anyone whose illness is heavier than it should be',
  fit_lead="You don't have to be at the end of treatment, or of anything, to deserve relief. Palliative care works alongside your specialists from diagnosis onward.",
  fit_card_title='Palliative care helps when:',
  fit=["A serious illness brings pain, fatigue, nausea or anxiety","Treatments and appointments are becoming overwhelming","You want help thinking through goals and options","Your family needs guidance and support too"],
  inc_h2='An extra layer of support around your existing care',
  inc_lead='Our program bridges treatment, home health, and, only if it\u2019s ever needed, the comfort-focused care of hospice.',
  included=[('pulse','Symptom management','Relief from pain, breathlessness, nausea, fatigue and anxiety, so treatment is easier to carry.'),
            ('users','Care coordination','We communicate with your specialists and primary doctor so nothing falls through the cracks.'),
            ('chat','Goals-of-care conversations','Unhurried conversations about what matters to you, and plans that honor it.'),
            ('home','Seamless transitions','Continuity across home health, palliative care, and hospice, one agency, one familiar team.'),
            ('heart','Family support','Guidance, education and a listening ear for the people caring for you.'),
            ('shield','Advance care planning','Help putting your wishes in writing so they\u2019re known and respected.')],
  how_h2='Getting started is one conversation',
  steps=[('Reach out',f"Call {PHONE} or ask your doctor about a ProHealth palliative referral."),
         ('Assessment',"A clinician visits at home to understand your symptoms, treatments and goals."),
         ('Your plan',"We build a comfort plan around your existing care and coordinate with your doctors."),
         ('Ongoing relief',"Regular visits keep symptoms managed, and the plan evolves as your needs do.")],
  cov_h2='Coverage verified for free, before care begins',
  cov_p="Palliative care coverage varies by plan. Medicare, Medi-Cal and many private plans cover palliative services in different ways. Our intake team checks your exact benefits at no cost, so you always know where you stand.",
  cov_big='Free', cov_big_sub='benefits check with our intake team',
  faqs=[("How is palliative care different from hospice?","Palliative care provides comfort and symptom relief at any stage of a serious illness, alongside curative treatment. Hospice provides comfort-focused care when treatment is no longer the goal. Our team helps families understand both, with no pressure."),
        ("Do I have to stop my treatment?","No, that's the point. Palliative care works alongside chemotherapy, dialysis, heart failure treatment and other ongoing care."),
        ("Who is on the palliative team?","Nurses and clinicians experienced in symptom management, supported by social workers, all coordinating with your existing doctors."),
        ("Is palliative care covered by insurance?","Coverage varies by plan. Medicare and many private plans cover palliative services; our intake team verifies your exact benefits for free."),
        ("Can palliative care lead into hospice?","If an illness progresses, our program transitions seamlessly into hospice with the same agency, familiar faces, no starting over.")],
  quote="Very impressed! Improving with therapy, the team is really great. Grateful that the care is working out so well.",
  quote_by='Dessie F. · ProHealth patient family', cta_h2='You deserve to feel better while you fight'),

 dict(faq_anchor='coverage-cost', faq_teaser='What does it cost? Does insurance cover it? Are caregivers screened?', hero_bg='/assets/photos/homecare-seated.jpg', slug='home-care', canon='home-care/', name='Home Care',
  title='Home Care & Caregivers, California | ProHealth',
  desc='Non-medical home care across 20 California counties: bathing, meals, companionship and 24-hour caregiving on a flexible schedule. Free in-home assessment.',
  h1='A helping hand at home, <em>on your schedule.</em>',
  lead="Home Care is non-medical caregiving, bathing, meals, companionship and more, from a few hours a day to around-the-clock support. Flexible, personal, and built around your routines.",
  img='/assets/photos/homecare-walk.jpg',
  img_alt='An older couple walking together outdoors',
  float_icon='clock', float_title='A few hours to 24/7', float_sub='You choose the schedule',
  fit_kicker='Is home care right for your family?', fit_h2='Independence at home, with just the right amount of help',
  fit_lead="Home care keeps people safe, comfortable and independent at home, and gives family caregivers room to breathe. No physician order required.",
  fit_card_title='Families choose home care when:',
  fit=["Daily tasks like bathing, dressing or meals are getting harder","A loved one living alone needs company and a watchful eye","Family caregivers need respite and reliable backup","Extra support is needed alongside home health or hospice"],
  inc_h2='Help shaped around your day', inc_lead='Every care plan is customized, start small and adjust anytime.',
  included=[('heart','Personal care','Respectful help with bathing, dressing, grooming and safe transfers.'),
            ('home','Meals & homemaking','Meal preparation, light housekeeping, laundry and medication reminders.'),
            ('chat','Companionship','Conversation, activities, walks and a friendly face, loneliness is a health risk too.'),
            ('clock','Respite for family','Scheduled relief so family caregivers can rest, work and recharge.'),
            ('users','24-hour & live-in care','Around-the-clock support for those who need someone always near.'),
            ('shield','Works with clinical care','Combines seamlessly with our home health, palliative and hospice programs.')],
  how_h2='From first call to a matched caregiver',
  steps=[('Call us',f"Tell us what's going on, {PHONE}. We listen first."),
         ('Free assessment',"A care coordinator visits your home to understand needs, routines and preferences."),
         ('Caregiver match',"We match a screened, background-checked caregiver to your loved one's personality and needs."),
         ('Ongoing check-ins',"Supervisory visits and easy schedule adjustments keep care fitting just right.")],
  cov_h2='Private-pay, transparent, and flexible',
  cov_p="Home care is private-pay with straightforward hourly rates and no long-term contracts, from a few hours a week to 24-hour care. Long-term care insurance often applies; we'll help you check.",
  cov_big='Free', cov_big_sub='in-home care assessment',
  faqs=[("How much does home care cost?","Home care is private-pay with transparent hourly rates that depend on the schedule and level of care. After a free in-home assessment we give you an exact quote, no surprises, no long-term contracts."),
        ("Are caregivers screened?","Yes. Every caregiver is background-checked, trained, insured and supervised by our care coordinators."),
        ("Is there a minimum number of hours?","Schedules are flexible, from a few hours a day up to 24-hour and live-in care. We'll build around your routine."),
        ("Can home care work alongside home health or hospice?","Absolutely, many families combine them. Clinical visits handle the medical side while caregivers help with daily living in between."),
        ("How fast can a caregiver start?","Often within days. After the free assessment we match a caregiver and can begin as soon as you're ready.")],
  quote="Very helpful in time of need, no problems or complaints. Our team is a God send. We are very satisfied.",
  quote_by='Lizzie L. · ProHealth family', cta_h2='More good days at home, starting this week'),
]
for d in SERVICES_DATA: service_page(d)

# ---------------- SERVICES HUB ----------------
HUB=[('/home-health-care/','/assets/photos/homehealth-vitals.jpg','Home Health',
      'Skilled nursing plus physical, occupational and speech therapy, delivered where recovery happens fastest: your own home. First visit is usually within 24 to 48 hours of a referral.',
      ['Medicare covered','Physician ordered','24 to 48 hr start']),
     ('/hospice/','/assets/photos/hospice-portrait.jpg','Hospice Care',
      'Comfort, dignity and expert symptom relief at home, with a nurse on call around the clock and support for the whole family, including bereavement care afterwards.',
      ['Medicare covered','24/7 on-call','Family support']),
     ('/palliative-care/','/assets/photos/palliative-bed.jpg','Palliative Care',
      'Relief from the symptoms and stress of serious illness at any stage, running alongside the treatment you are already having. It bridges home health and hospice so care never starts over.',
      ['Any stage','Alongside treatment','Free benefits check']),
     ('/home-care/','/assets/photos/homecare-seated.jpg','Home Care',
      'Non-medical caregiving shaped around your routine: bathing, meals, transfers and companionship, from a few hours a day up to 24 hour and live-in care.',
      ['No referral needed','Private pay','Free assessment']),
]
hub=''.join(f'''<a class="card reveal{["", " d1", " d2", " d3"][i]}" href="{h}"><div class="photo"><img src="{im}" alt="{t}" loading="lazy" onerror="this.remove()"></div>
<div class="body"><h3>{t}</h3><p>{d}</p><div class="svc-tags">{"".join(f"<span>{g}</span>" for g in tags)}</div><span class="learn">Explore {t} &rarr;</span></div></a>''' for i,(h,im,t,d,tags) in enumerate(HUB))
shell('services','Our Services | Home Health & Hospice, CA | ProHealth',
 'Explore ProHealth\u2019s four levels of care across 20 California counties: Medicare-covered home health, hospice, palliative care, and flexible private-pay home care.',
 'services/', f'''<div class="hero"><div class="hero-bg" aria-hidden="true"><img src="/assets/photos/team-greeting.jpg" alt="" loading="eager" onerror="this.remove()"></div><div class="wrap">{crumbs([('/','Home'),(None,'Services')])}
<div class="hero-solo"><p class="kicker">Care. We provide.</p><h1>Four levels of care, <em>one trusted team.</em></h1>
<p class="lead">Wherever you are in the journey, recovering, managing a serious illness, or focusing on comfort, the right care meets you at home, across 20 California counties. Not sure which you need? Call {PHONE} and we'll help you figure it out in minutes.</p></div></div></div>
<section class="tex">{wm('r')}<div class="wrap"><div class="cards two-up">{hub}</div></div></section>
<section style="padding-top:0"><div class="wrap"><div class="coverage reveal"><img class="cov-wm" src="{MONO_WHITE}" alt="" aria-hidden="true">
<div><p class="kicker" style="color:var(--sky)">For physicians &amp; discharge planners</p><h2>Refer a patient in under 60 seconds</h2>
<p>Online or by fax, our intake team verifies insurance, coordinates orders, and contacts your patient the same day.</p></div>
<div class="coverage-actions"><a class="btn btn-white" href="/refer-a-patient/">Start a referral</a>
<a class="btn btn-ghost" href="tel:+18776678770">Call intake · {PHONE}</a></div></div></div></section>''', active='/services/')

# ---------------- LOCATIONS & COVERAGE (one page) ----------------
counties=''.join(f'<span class="county">{c} County</span>' for c in COUNTIES)
loc_faqs=[("Which office would look after me?","Whichever is closest to you. Every office fields its own local nurses, therapists and caregivers, so your clinician is genuinely from your area rather than driving three hours to reach you."),
 ("Do you serve my city?",f"If you are in any of our 20 counties, almost certainly yes. Send us your address or call {PHONE} and we will confirm in under a minute."),
 ("Do you travel to rural areas?","Yes. Our coverage reaches rural communities across the Central Valley, the Sierra foothills and the Central Coast. Give us the address and we will tell you straight."),
 ("Can I visit an office?",f"You are welcome to, though you never need to. All our care happens in your home. If you would like to come in, call {PHONE} first so the right person is there for you."),
 ("Do all six offices offer every service?","Home Health, Hospice, Palliative Care and Home Care are available across our service area. A few specific programmes vary slightly by county, and intake confirms when you call."),
 ("Can you check whether my insurance covers me?","Yes, for free, before anything starts. We cannot verify insurance automatically on a website and would rather not guess with something this important, so send your details and a person checks it properly.")]
shell('locations','Locations & Coverage | ProHealth Home Care',
 'ProHealth Home Care offices in Sacramento, Walnut Creek, San Jose, Stockton, Monterey and Fresno, serving 20 California counties. Addresses, directions, and a free coverage check.',
 'locations/', f'''<div class="hero"><div class="hero-bg" aria-hidden="true"><img src="/assets/team-building.jpg" alt="" loading="eager" onerror="this.remove()"></div><div class="wrap">{crumbs([('/','Home'),(None,'Locations & Coverage')])}
<div class="hero-solo"><p class="kicker">Locations and coverage</p><h1>Six offices. <em>Twenty counties.</em> One standard of care.</h1>
<p class="lead">From the Central Coast to the Sierra foothills, every location fields its own clinical team, so the nurse at your door lives near your door. Find your nearest office below, or let us check your address and insurance for you.</p>
<div class="hero-cta"><a class="btn btn-blue" href="/contact/?topic=coverage">Check if we cover you</a><a class="btn btn-outline" href="#counties">See all 20 counties</a></div></div></div></div>

<section><div class="wrap"><div class="offices">
<div><p class="kicker reveal">Our offices</p><h2 class="reveal">Find your nearest team</h2>
<p class="section-lead reveal" style="margin-bottom:26px">Tap any marker on the map to jump to that office. Every address links straight to directions.</p>
{office_list()}</div>
<div class="reveal d1">{ca_map_svg()}</div></div></div></section>

<section id="counties" class="tex">{wm('r')}<div class="wrap"><div style="text-align:center"><p class="kicker reveal">Service area</p><h2 class="reveal">The 20 counties we cover</h2>
<p class="section-lead reveal" style="margin:0 auto 40px">Home Health, Hospice, Palliative Care and Home Care are available throughout these California counties.</p></div>
<div class="county-grid reveal">{counties}</div></div></section>

<section class="disciplines"><div class="wrap">
<div class="team-band reveal"><img src="/assets/team-building.jpg" alt="The ProHealth Home Care team outside the Sacramento office" loading="lazy" onerror="this.remove()">
<div class="team-cap"><b>The people behind the care</b><span>Our team outside the Sacramento office.</span></div></div></div></section>

<section style="padding-top:0"><div class="wrap"><div class="coverage reveal"><img class="cov-wm" src="{MONO_WHITE}" alt="" aria-hidden="true">
<div><p class="kicker" style="color:var(--sky)">Checking coverage</p><h2>We will not guess, we will check</h2>
<p>A website cannot honestly verify your insurance or confirm a service area, and this matters far too much for a maybe. Send us your address and plan, and our intake team checks it properly, at no cost, then calls you back with a straight answer.</p></div>
<div class="coverage-actions"><div class="big">Free<span style="font-size:1rem;color:#C8DFF0;font-weight:500"> coverage and benefits check</span></div>
<a class="btn btn-white" href="/contact/?topic=coverage">Ask us to check</a>
<a class="btn btn-ghost" href="tel:+18776678770">Call {PHONE}</a></div></div></div></section>

{tech_section(kicker='Fully tech enabled', h2='Twenty counties, one intelligent system', lead=f'A footprint this size only works if nothing slips between the cracks. After {YEARS_TEXT} of doing this we run AI-assisted automation from referral to final visit note, so a nurse in Fresno and a coordinator in Sacramento see the same record at the same moment, and no visit, order or signature is ever waiting on someone to remember it.')}

<section class="faq-sec"><div class="wrap"><div class="faq-cta reveal">
<span class="ic">{ICONS['help']}</span>
<div><h3>Questions about offices and coverage</h3><p>Which office serves you, whether we reach your town, how rural is too rural, and how we check your insurance.</p></div>
<a class="btn btn-blue" href="/faqs/#areas">Read the FAQs</a></div></div></section>

<section class="final-cta has-bg on-warm" style="padding:64px 0"><div class="sec-bg" aria-hidden="true"><img src="/assets/photos/homecare-seated.jpg" alt="" loading="lazy" onerror="this.remove()"></div><div class="wrap">
<h2 class="reveal">Not sure which office is yours?</h2>
<p class="section-lead reveal" style="margin:0 auto 24px">Send us your address and we will tell you, along with whether your insurance covers the care you need. Free, and no obligation.</p>
<a class="btn btn-blue reveal d1" href="/contact/?topic=coverage">Ask us to check</a></div></section>''',
 {"@context":"https://schema.org","@graph":[
   {**BIZ,"foundingDate":str(FOUNDED),"department":[{"@type":"MedicalBusiness","name":f"ProHealth Home Care {n}","telephone":"+1-877-667-8770","address":{"@type":"PostalAddress","streetAddress":a.split(', CA')[0],"addressRegion":"CA","addressCountry":"US"}} for n,a,_x,_y,_h in OFFICE_PX]},
   {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://prohealth.us/"},{"@type":"ListItem","position":2,"name":"Locations & Coverage"}]},
   faq_ld(loc_faqs)]}, active='/locations/', extra_js=MAP_JS)

# ---------------- REFER ----------------
refer_faqs=[("How do you communicate after the referral?","You get confirmation when the patient is contacted, when care starts, and at discharge, by your preferred channel (fax, phone or email)."),
 ("Which insurance do you accept?","Medicare, Medi-Cal and most major plans for home health and hospice. Our intake team verifies benefits before the first visit and flags any issues immediately."),
 ("How fast is the first visit?","Typically within 24–48 hours of the referral, sooner for urgent needs."),
 ("What are your intake hours?",f"Our intake team is available Monday–Friday, 8:30am–5:00pm Pacific, and responds to referrals within 2 hours during those hours. Referrals sent after hours are first in the queue the next business morning. For urgent clinical needs, our on-call line is staffed 24/7 at {PHONE}."),
 ("How else can I send a referral?",f"Three ways: the form on this page, our iOS and Android apps (fastest for repeat referrers, send in seconds and track through intake), or call {PHONE} and our intake team will take it over the phone.")]
shell('refer-a-patient','Refer a Patient | ProHealth Home Care',
 f'Refer a patient to ProHealth in under 60 seconds. Response within 2 hours during business hours, same-day patient contact. Medicare, Medi-Cal and major insurance accepted.',
 'refer-a-patient/', f'''<div class="hero"><div class="hero-bg" aria-hidden="true"><img src="/assets/photos/therapy-weights.jpg" alt="" loading="eager" onerror="this.remove()"></div><div class="wrap">{crumbs([('/','Home'),(None,'Refer a Patient')])}
<div class="hero-grid"><div><p class="kicker">For physicians &amp; discharge planners</p><h1>Refer a patient in <em>under 60 seconds.</em></h1>
<p class="lead">Send it and forget it: we verify insurance, coordinate physician orders, and contact your patient the same day.</p>
<ul class="checks" style="margin-bottom:26px"><li>{CHECK}Response within 2 hours during business hours (Mon–Fri 8:30am–5:00pm PT)</li>
<li>{CHECK}Same-day patient contact and scheduling</li><li>{CHECK}Medicare, Medi-Cal and major insurance accepted</li>
<li>{CHECK}Six offices covering 20 California counties</li></ul>
<div class="hero-cta"><a class="btn btn-blue" href="tel:+18776678770">Call intake · {PHONE}</a>
</div>
{TECH_STRIP}
<div class="app-hero reveal">
<div><p class="kicker">Fastest way to refer</p><h3>Send a referral from your phone in seconds</h3>
<p>Built for people who refer often. Save your details once, send in a few taps between patients, and watch it move through intake in real time. Referrals are triaged automatically on arrival, so yours is never sitting in an inbox waiting for Monday.</p>
{APP_BADGES}</div>
<svg class="app-phone" viewBox="0 0 120 220" fill="none" aria-hidden="true">
<rect x="4" y="4" width="112" height="212" rx="18" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.3)" stroke-width="2"/>
<rect x="12" y="20" width="96" height="180" rx="8" fill="rgba(255,255,255,.08)"/>
<rect x="46" y="9" width="28" height="5" rx="2.5" fill="rgba(255,255,255,.35)"/>
<rect x="22" y="34" width="52" height="6" rx="3" fill="rgba(143,209,239,.85)"/>
<rect x="22" y="50" width="76" height="4" rx="2" fill="rgba(255,255,255,.28)"/>
<rect x="22" y="62" width="64" height="4" rx="2" fill="rgba(255,255,255,.28)"/>
<rect x="22" y="82" width="76" height="22" rx="6" fill="rgba(255,255,255,.16)"/>
<rect x="22" y="112" width="76" height="22" rx="6" fill="rgba(255,255,255,.16)"/>
<rect x="22" y="142" width="76" height="22" rx="6" fill="rgba(143,209,239,.9)"/>
<rect x="40" y="150" width="40" height="6" rx="3" fill="rgba(11,58,82,.55)"/>
</svg></div></div>
<div class="form-card reveal"><h3>Online referral</h3><p class="form-sub">Takes about a minute. Our intake team calls you back to confirm.</p>
<form id="referForm"><label for="rf-patient">Patient name</label><input id="rf-patient" required placeholder="Full name">
<div class="row2"><div><label for="rf-dob">Date of birth</label><input id="rf-dob" type="date"></div>
<div><label for="rf-ins">Insurance</label><input id="rf-ins" placeholder="e.g. Medicare"></div></div>
<label for="rf-county">Patient county</label><select id="rf-county">{''.join(f'<option>{c}</option>' for c in COUNTIES)}<option>Other / not listed</option></select>
<label for="rf-svc">Service needed</label><select id="rf-svc"><option>Home Health</option><option>Hospice</option><option>Palliative Care</option><option>Home Care</option><option>Not sure, please advise</option></select>
<label for="rf-notes">Clinical notes (optional)</label><textarea id="rf-notes" rows="2" placeholder="Diagnosis, needs, urgency…"></textarea>
<hr class="form-hr"><div class="row2"><div><label for="rf-name">Your name</label><input id="rf-name" required placeholder="Referrer name"></div>
<div><label for="rf-org">Organization</label><input id="rf-org" placeholder="Practice / hospital"></div></div>
<label for="rf-phone">Callback phone</label><input id="rf-phone" required type="tel" placeholder="(555) 555-5555">
{captcha('rf')}
<button class="btn btn-blue" type="submit" style="width:100%;margin-top:14px">Send referral to intake</button>
<p class="form-note">Protected health information is transmitted over an encrypted connection and handled under our <a href="/notice-of-privacy-practices/">Notice of Privacy Practices</a>. Prototype note: submissions are logged locally.</p></form>
<div id="referOk" class="form-ok" hidden><h3>Referral received ✓</h3><p>Thank you, our intake team will call you back within 2 hours during business hours. Urgent? Call <a href="tel:+18776678770"><b>{PHONE}</b></a>, staffed 24/7.</p></div></div>
</div></div></div>
<section class="faq-sec"><div class="wrap"><div class="faq-cta reveal">
<span class="ic">{ICONS['help']}</span>
<div><h3>What referring providers can expect</h3><p>Communication after the referral, insurance we accept, first visit timing, intake hours and how else to send one.</p></div>
<a class="btn btn-blue" href="/faqs/#getting-started">Read the FAQs</a></div></div></section>''',
 {"@context":"https://schema.org","@graph":[faq_ld(refer_faqs)]}, active='/refer-a-patient/',
 extra_js=CAPTCHA_JS+'''
const _rf=document.getElementById('referForm'); const _rfCap=initCap('rf',_rf);
_rf.addEventListener('submit',function(e){e.preventDefault(); if(!_rfCap()) return;
const g=id=>document.getElementById(id).value;
console.log('REFERRAL CAPTURED (POST /leads in production):',{patient:g('rf-patient'),dob:g('rf-dob'),insurance:g('rf-ins'),county:g('rf-county'),service:g('rf-svc'),notes:g('rf-notes'),referrer:g('rf-name'),org:g('rf-org'),phone:g('rf-phone'),type:'referral',ts:new Date().toISOString()});
this.hidden=true;document.getElementById('referOk').hidden=false;});''')

# ---------------- CAREERS ----------------
OPENINGS_JS = '''
/* Openings are config-driven: the admin dashboard publishes them, and
   /data/openings.json is the bundled fallback so the page is never bare. */
let OPENINGS=[], F_OFFICE='All', F_ROLE='All';
const ROLE_GROUPS=[['All','All roles'],['Nursing','Nursing'],['Therapy','Therapy'],['Care','Aides & care'],['Office','Office & social']];
function roleGroup(title){
  const t=(title||'').toLowerCase();
  if(/\b(rn|lvn|lpn|nurse|nursing)\b/.test(t)) return 'Nursing';
  if(/therap|physical|occupational|speech|slp|\bpt\b|\bot\b/.test(t)) return 'Therapy';
  if(/aide|hha|caregiver|companion/.test(t)) return 'Care';
  if(/social|msw|admin|office|coordinator|scheduler/.test(t)) return 'Office';
  return 'Office';
}
async function loadOpenings(){
  const wrap=document.getElementById('roles');
  try{
    /* The admin is the source of truth once the API is connected. Only fall
       back to the bundled file if the API is unreachable: an empty list from a
       working API genuinely means "no openings", and pretending otherwise would
       resurrect roles the admin just deleted. */
    let data=null;
    if(API_BASE){
      try{ const r=await fetch(API_BASE+'/openings.json',{cache:'no-store'});
           if(r.ok) data=await r.json(); }catch(e){ data=null; }
    }
    if(!data){
      const r2=await fetch('/data/openings.json',{cache:'no-store'});
      if(!r2.ok) throw new Error('no config');
      data=await r2.json();
    }
    OPENINGS=(data.openings||[]).filter(o=>o.active!==false);
  }catch(e){
    wrap.innerHTML='<div class="op-empty">We could not load our current openings. Please call <b>877.667.8770</b> or apply below &mdash; we review every application.</div>';
    return;
  }
  const offices=['All',...new Set(OPENINGS.flatMap(o=>o.offices||[]))];
  const roles=ROLE_GROUPS.filter(([k])=>k==='All'||OPENINGS.some(o=>roleGroup(o.title)===k));
  document.getElementById('opFilters').innerHTML =
    '<div class="op-row"><span class="op-lbl">Role</span>' +
      roles.map(([k,l])=>`<button class="op-chip" data-r="${k}">${l}</button>`).join('') + '</div>' +
    '<div class="op-row"><span class="op-lbl">Office</span>' +
      offices.map(o=>`<button class="op-chip" data-o="${o}">${o==='All'?'All offices':o}</button>`).join('') +
      '<span class="op-count" id="opCount"></span></div>';
  document.querySelectorAll('#opFilters [data-r]').forEach(c=>c.onclick=()=>{F_ROLE=c.dataset.r; paintOpenings();});
  document.querySelectorAll('#opFilters [data-o]').forEach(c=>c.onclick=()=>{F_OFFICE=c.dataset.o; paintOpenings();});
  paintOpenings();
}
function paintOpenings(){
  document.querySelectorAll('#opFilters [data-r]').forEach(c=>c.classList.toggle('on',c.dataset.r===F_ROLE));
  document.querySelectorAll('#opFilters [data-o]').forEach(c=>c.classList.toggle('on',c.dataset.o===F_OFFICE));
  const wrap=document.getElementById('roles');
  const list=OPENINGS.filter(o=>
    (F_OFFICE==='All'||(o.offices||[]).includes(F_OFFICE)) &&
    (F_ROLE==='All'||roleGroup(o.title)===F_ROLE));
  const cnt=document.getElementById('opCount');
  if(cnt) cnt.textContent=list.length+(list.length===1?' role':' roles');
  if(!list.length){
    const none = !OPENINGS.length;
    wrap.innerHTML='<div class="op-empty">'+(none
      ? 'We have no advertised openings at the moment, but we are always glad to hear from good people. Apply below and we will call when something fits.'
      : 'Nothing open for that combination right now &mdash; but we&rsquo;d still like to hear from you. Apply below and we&rsquo;ll call when something fits.')+'</div>';
    return;
  }
  wrap.innerHTML=list.map(o=>`<div class="role">
    <div><h3>${o.title}</h3><p>${o.summary||''}</p>
    <div class="tags">${(o.type?`<span class="tg type">${o.type}</span>`:'')}${(o.offices||[]).map(x=>`<span class="tg">${x}</span>`).join('')}</div></div>
    <button class="btn btn-outline" onclick="applyFor('${o.title.replace(/'/g,"\\'")}')">Apply</button></div>`).join('');
}
function applyFor(title){
  const sel=document.getElementById('ap-role');
  if(sel){ const m=[...sel.options].find(o=>o.value===title); if(m) sel.value=title; }
  document.getElementById('apply').scrollIntoView({behavior:'smooth'});
}
document.addEventListener('DOMContentLoaded',loadOpenings);
'''


shell('careers','Careers | Nursing & Caregiver Jobs | ProHealth',
 'Join ProHealth Home Care: RN, LVN, PT, OT and Home Health Aide roles across six California offices with flexible schedules and a culture that values clinicians. Apply in minutes.',
 'careers/', f'''<div class="hero"><div class="hero-bg" aria-hidden="true"><img src="/assets/team-careers.jpg" alt="" loading="eager" onerror="this.remove()"></div><div class="wrap">{crumbs([('/','Home'),(None,'Careers')])}
<div class="hero-grid"><div><p class="kicker">Careers at ProHealth</p><h1>Your turn to <em>make a move.</em></h1>
<p class="lead">We're looking for people with great attitudes who want to do meaningful work, and enjoy the ride. Flexible schedules, a choice of six locations, and a culture built around valuing our clinicians.</p>
<div class="hero-cta"><a class="btn btn-blue" href="#apply">Apply in minutes</a><a class="btn btn-outline" href="#openings">See open roles</a></div></div>
<div class="hero-photo"><div class="ph"><img src="/assets/photos/careers-team.jpg" alt="A caregiver sitting with an older client at home" loading="eager" onerror="this.remove()"></div>
<div class="float-card fc-visit"><span class="ic-round">{ICONS['heart']}</span><div><div class="fc-title">We're hiring</div><div class="fc-sub">RNs · LVNs · PTs · OTs · HHAs</div></div></div></div></div></div></div>
{video_block(CAREERS_VIDEO, 'Why join ProHealth?', 'Why join ProHealth',
  'Two minutes with the people you would actually be working alongside. No recruiter script, just our team on what the work is really like.',
  meta='Our team &middot; YouTube')}

<section id="openings" class="tex">{wm('r')}<div class="wrap"><p class="kicker reveal">Open roles</p><h2 class="reveal">Current openings</h2>
<p class="section-lead reveal">Don't see your role? Apply anyway, great people always have a place here.</p><div class="op-filters" id="opFilters"></div><div class="roles" id="roles"><div class="op-empty">Loading current openings…</div></div></div></section>
<section id="apply" class="disciplines"><div class="wrap" style="max-width:720px">
<div style="text-align:center"><p class="kicker reveal">Apply now</p><h2 class="reveal">Two minutes, and we'll call you</h2>
<p class="section-lead reveal" style="margin:0 auto 34px">Upload a resume, tell us your license, and our recruiter reaches out, usually within one business day.</p></div>
<div class="form-card reveal"><form id="applyForm">
<div class="row2"><div><label for="ap-name">Full name</label><input id="ap-name" required placeholder="Your name"></div>
<div><label for="ap-phone">Phone</label><input id="ap-phone" required type="tel" placeholder="(555) 555-5555"></div></div>
<label for="ap-email">Email</label><input id="ap-email" type="email" required placeholder="you@example.com">
<div class="row2"><div><label for="ap-role">Role</label><select id="ap-role"><option>Registered Nurse (RN)</option><option>Licensed Vocational Nurse (LVN)</option><option>Physical Therapist (PT)</option><option>Occupational Therapist (OT)</option><option>Home Health Aide (HHA) / Caregiver</option><option>Other / general application</option></select></div>
<div><label for="ap-office">Preferred office</label><select id="ap-office">{''.join(f'<option>{n}</option>' for n,_a,_x,_y,_h in OFFICE_PX)}<option>Flexible / any</option></select></div></div>
<label for="ap-lic">License # (if applicable)</label><input id="ap-lic" placeholder="e.g. RN-123456">
{DROPZONE}
<label style="display:flex;gap:9px;align-items:flex-start;margin-top:16px;font-weight:400;color:var(--slate);font-size:.82rem">
<input type="checkbox" id="ap-consent" required style="width:auto;margin-top:3px"> I agree to ProHealth's <a href="/privacy-policy/" style="color:var(--blue-dark)">Privacy Policy</a> and consent to ProHealth storing my application and resume for recruitment purposes. I can request deletion at any time.</label>
{captcha('ap')}
<button class="btn btn-blue" type="submit" style="width:100%;margin-top:14px">Submit application</button>
<p class="form-note">ProHealth is an equal opportunity employer. Your resume is stored securely and shared only with our hiring team. See our <a href="/privacy-policy/">Privacy Policy</a> or submit a <a href="/data-request/">data deletion request</a> anytime.</p></form>
<div id="applyOk" class="form-ok" hidden><h3>Application received ✓</h3><p>Thank you! Our recruiter will call you within one business day. Questions? <a href="tel:+18776678770"><b>{PHONE}</b></a>.</p></div></div></div></section>''',
 {"@context":"https://schema.org","@type":"JobPosting","title":"Registered Nurse (RN). Home Health & Hospice",
  "description":"ProHealth Home Care is hiring Registered Nurses for home health and hospice across our six California offices. Flexible schedules, choice of locations, and a culture built around valuing clinicians.",
  "hiringOrganization":{"@type":"Organization","name":"ProHealth Home Care, Inc.","logo":LOGO},
  "employmentType":["FULL_TIME","PART_TIME"],"datePosted":"2026-07-01","validThrough":"2026-12-31",
  "jobLocation":[{"@type":"Place","address":{"@type":"PostalAddress","streetAddress":a.split(', CA')[0],"addressRegion":"CA","addressCountry":"US"}} for n,a,_x,_y,_h in OFFICE_PX]},
 active='/careers/',
 extra_js=YT_JS+YT_THUMB_JS+FILE_JS+CAPTCHA_JS+OPENINGS_JS+'''
const _af=document.getElementById('applyForm'); const _afCap=initCap('ap',_af);
_af.addEventListener('submit',function(e){e.preventDefault(); if(!_afCap()) return;
const g=id=>document.getElementById(id).value;const file=document.getElementById('ap-resume').files[0];
if(file && (file.size>2*1024*1024 || !/pdf$/i.test(file.type+file.name))){alert('Please attach a PDF under 2 MB.');return;}
console.log('APPLICATION CAPTURED (POST /applications in production):',{name:g('ap-name'),phone:g('ap-phone'),email:g('ap-email'),role:g('ap-role'),office:g('ap-office'),license:g('ap-lic'),resume:file?file.name:'(none)',consent:true,ts:new Date().toISOString()});
this.hidden=true;document.getElementById('applyOk').hidden=false;});''')

# ---------------- CONTACT (form-focused) ----------------
shell('contact',f'Contact ProHealth Home Care | California, {PHONE}',
 f'Contact ProHealth Home Care: call toll free {PHONE}, send a message, or chat. Offices Mon–Fri 8:30am–5:00pm PT, 24/7 on-call for patients.',
 'contact/', f'''<div class="hero"><div class="hero-bg" aria-hidden="true"><img src="/assets/photos/team-greeting.jpg" alt="" loading="eager" onerror="this.remove()"></div><div class="wrap">{crumbs([('/','Home'),(None,'Contact')])}
<div class="hero-grid"><div><p class="kicker">Contact us</p><h1>We answer. <em>Really.</em></h1>
<p class="lead">Call toll free, send a message, or start a chat. A real person from our team gets back to you the same business day.</p>
<div class="legal-note" style="border-left-color:var(--blue);margin-bottom:20px"><b style="color:var(--navy)">Checking coverage?</b> We can&rsquo;t verify insurance or service areas automatically on a website, and we&rsquo;d rather not guess with something this important. Send your address and plan below and our intake team checks it properly, for free, then calls you back with a straight answer.</div>
<ul class="checks" style="margin-bottom:22px">
<li>{CHECK}<span><b>Toll free:</b>&nbsp;<a href="tel:+18776678770" style="color:var(--blue-dark);font-weight:600;text-decoration:none">{PHONE}</a></span></li>
<li>{CHECK}<span><b>Office hours:</b>&nbsp;Mon–Fri, 8:30am–5:00pm Pacific</span></li>
<li>{CHECK}<span><b>On-call clinical support:</b>&nbsp;24/7 for our patients</span></li>
<li>{CHECK}<span><b>Six offices</b>&nbsp;across 20 California counties, <a href="/locations/" style="color:var(--blue-dark);font-weight:600;text-decoration:none">see offices &amp; coverage →</a></span></li></ul>
<div class="map-ph reveal">{ICONS['pin']}<span>Looking for an address or directions? All six office locations are on our <a href="/locations/" style="color:var(--blue-dark);font-weight:600">Offices &amp; Coverage</a> page.</span></div>
<div class="team-band reveal" style="margin-top:22px;aspect-ratio:16/9">
<img src="/assets/team-building.jpg" alt="The ProHealth Home Care team outside the Sacramento office" loading="lazy" onerror="this.remove()">
<div class="team-cap"><b>Real people, one phone call away</b><span>The ProHealth team outside our Sacramento office.</span></div></div></div>
<div class="form-card reveal"><h3>Send us a message</h3><p class="form-sub">Same-day reply during business hours.</p>
<form id="contactForm"><label for="ct-name">Your name</label><input id="ct-name" required placeholder="Full name">
<div class="row2"><div><label for="ct-phone">Phone</label><input id="ct-phone" required type="tel" placeholder="(555) 555-5555"></div>
<div><label for="ct-email">Email (optional)</label><input id="ct-email" type="email" placeholder="you@example.com"></div></div>
<label for="ct-topic">I'm asking about</label><select id="ct-topic"><option value="coverage">Check my coverage or service area</option><option>Home Health</option><option>Hospice</option><option>Palliative Care</option><option>Home Care</option><option>Volunteering</option><option>Careers</option><option>Privacy or data request</option><option>Something else</option></select>
<div id="covFields" hidden>
<label for="ct-addr">Your address, city or zip</label><input id="ct-addr" placeholder="e.g. Elk Grove, CA 95757">
<label for="ct-ins">Insurance you have (optional)</label><input id="ct-ins" placeholder="e.g. Medicare, Medi-Cal, Blue Shield">
<p class="form-note" style="margin-top:8px">We check both for free and call you back with a plain answer. Please don&rsquo;t enter policy or member numbers here.</p></div>
<label for="ct-msg">Message</label><textarea id="ct-msg" rows="3" placeholder="How can we help?"></textarea>
{captcha('ct')}
<button class="btn btn-blue" type="submit" style="width:100%;margin-top:14px">Send message</button>
<p class="form-note">Please don't include medical details here, for anything clinical or urgent, call {PHONE}. Submissions are handled under our <a href="/privacy-policy/">Privacy Policy</a>.</p></form>
<div id="contactOk" class="form-ok" hidden><h3>Message sent ✓</h3><p>Thank you, we'll get back to you the same business day. Urgent? Call <a href="tel:+18776678770"><b>{PHONE}</b></a>.</p></div></div>
</div></div></div>''',
 {"@context":"https://schema.org","@graph":[BIZ]}, active='/contact/',
 extra_js=CAPTCHA_JS+'''
const _cf=document.getElementById('contactForm'); const _cfCap=initCap('ct',_cf);
_cf.addEventListener('submit',function(e){e.preventDefault(); if(!_cfCap()) return;
const g=id=>document.getElementById(id).value;
console.log('CONTACT CAPTURED (POST /leads in production):',{name:g('ct-name'),phone:g('ct-phone'),email:g('ct-email'),topic:g('ct-topic'),message:g('ct-msg'),type:'contact',ts:new Date().toISOString()});
this.hidden=true;document.getElementById('contactOk').hidden=false;});''')

# ---------------- ABOUT ----------------
vals=''.join(f'<article class="d-card reveal{["", " d1", " d2", " d3"][i]}"><span class="ic">{ICONS[ic]}</span><h3>{t}</h3><p>{p}</p></article>'
 for i,(ic,t,p) in enumerate([('heart','Compassion','Every patient is someone\u2019s whole world. We care like it\u2019s ours too.'),
   ('pulse','Clinical excellence','Great outcomes come from great clinicians, held to high standards.'),
   ('shield','Reliability','We answer, we show up, and we do what we said, every time.'),
   ('users','Respect','Dignity for patients, families and our own team, without exception.')]))
shell('about-us','About ProHealth Home Care | California',
 'ProHealth Home Care is a locally owned, Medicare-certified home health and hospice agency serving 20 California counties from six offices, clinical excellence and compassion, one patient at a time.',
 'about-us/', f'''<div class="hero"><div class="hero-bg" aria-hidden="true"><img src="/assets/team-building.jpg" alt="" loading="eager" onerror="this.remove()"></div><div class="wrap">{crumbs([('/','Home'),(None,'About')])}
<div class="hero-solo"><p class="kicker">About ProHealth</p><h1>Locally owned. <em>Personally accountable.</em></h1>
<p class="lead">ProHealth Home Care is a locally owned Home Health and Hospice agency focused on clinical excellence and compassion, one patient at a time. We have been doing this for {YEARS} years, Medicare-certified since {MEDICARE_SINCE}, and we still believe what we believed on day one: health care is a right, not a privilege, and no family should struggle to find the right care at the worst moment of their lives. Today that means six offices, clinical teams across 20 California counties, and a {CMS_STARS}-star rating from Medicare's own Care Compare.</p></div></div></div>
<section class="tex">{wm('r')}<div class="wrap"><p class="kicker reveal">What we stand for</p><h2 class="reveal">The values behind every visit</h2>
<p class="section-lead reveal">{YEARS} years in, the awards are nice. The Top 5 2026 BusinessRate recognition, powered by Google Reviews, means a great deal to us. But the real measure is still what a family says after the care is over.</p>
<div class="grid3" style="grid-template-columns:repeat(4,1fr)">{vals}</div></div></section>
<section class="disciplines"><div class="wrap"><div class="team-band reveal">
<img src="/assets/photos/team-greeting.jpg" alt="Two ProHealth clinicians with a client" loading="lazy" onerror="this.remove()">
<div class="team-cap"><b>One patient at a time</b><span>Nurses, therapists, aides, social workers and chaplains across six California offices.</span></div></div></div></section>
<section style="padding-top:0"><div class="wrap"><div class="coverage reveal"><img class="cov-wm" src="{MONO_WHITE}" alt="" aria-hidden="true">
<div><p class="kicker" style="color:var(--sky)">Recognition</p><h2>Top 5 · 2026 BusinessRate Award</h2>
<p>Powered by Google Reviews, and earned across {YEARS} years and thousands of patients. Medicare-certified since {MEDICARE_SINCE}, and rated {CMS_STARS} stars by Medicare's own Care Compare, which measures outcomes rather than opinions.</p></div>
<div class="coverage-actions"><div class="big">4.9★<span style="font-size:1rem;color:#C8DFF0;font-weight:500"> Google review rating</span></div>
<a class="btn btn-white" href="/#stories">Read what families say</a><a class="btn btn-ghost" href="/locations/">See our offices</a></div></div></div></section>
{video_block(CAREERS_VIDEO, 'Meet the people behind the care', 'Why our team chooses ProHealth',
  'The clinicians who would be looking after you, in their own words. How a company treats its staff tends to show up in how its staff treat you.',
  meta='Our team &middot; YouTube')}

<section class="final-cta" style="padding:64px 0"><div class="wrap"><h2 class="reveal">Meet the team behind the care</h2>
<p class="section-lead reveal" style="margin:0 auto 24px">Questions about our services, our team, or whether we're the right fit? We'd love to talk.</p>
<a class="btn btn-blue reveal d1" href="/contact/">Contact us</a></div></section>''',
 {"@context":"https://schema.org","@graph":[BIZ]}, active='/about-us/', extra_js=YT_JS+YT_THUMB_JS)

# ---------------- VOLUNTEER ----------------
vol=''.join(f'<article class="d-card reveal{["", " d1", " d2"][i%3]}"><span class="ic">{ICONS[ic]}</span><h3>{t}</h3><p>{pp}</p></article>'
 for i,(ic,t,pp) in enumerate([
  ('users','Companionship','Sit with a patient, talk, read aloud, play their music, or simply be present so nobody faces this alone.'),
  ('heart','Family respite','Give a family caregiver two hours to shower, shop, sleep or cry somewhere other than the living room.'),
  ('home','Errands and practical help','Groceries, a lift to an appointment, a load of laundry. Small things that lift a very heavy season.'),
  ('chat','Bereavement support','Follow-up calls and gentle company for families in the 13 months of grief support after a death.'),
  ('doc','Office and admin','Behind the scenes work that keeps the hospice programme running for the families who need it.'),
  ('shield','Veteran to veteran','Veterans supporting veteran patients through our We Honor Veterans work. That bond does what nothing else can.')]))
vol_faqs=[("Do I need any experience?","None at all. We provide full training and orientation before you ever meet a patient. What matters is warmth, reliability and respect for the families you will meet."),
 ("How much time does it take?","Most volunteers give 2 to 4 hours a week on a schedule that fits their life. There is no minimum beyond turning up when you said you would, because families are counting on it."),
 ("Is there a screening process?","Yes. A conversation, a background check, health clearance including TB, and training. Our patients are vulnerable and we protect them carefully."),
 ("Where would I volunteer?","Wherever patients call home in your area, across our six offices. We match you close to where you live so the travel is never the hard part."),
 ("Is this only for hospice patients?","Yes. Volunteering at ProHealth sits inside our Hospice programme specifically. Our Home Health, Palliative and Home Care services are delivered by paid clinical and care staff, so if you are looking for that kind of work, our <a href=\"/careers/\">Careers page</a> is the place to go."),
 ("Do I have to sit with someone who is dying?","Not unless you want to. Volunteers do errands, admin, respite and bereavement calls too. We match the role to what you can genuinely give, and it is fine to change your mind.")]
shell('volunteer','Hospice Volunteer Opportunities | ProHealth',
 'Become a ProHealth hospice volunteer across 20 California counties: companionship, family respite, veteran to veteran support and bereavement care. Full training, flexible hours.',
 'volunteer/', f'''<div class="hero"><div class="hero-bg" aria-hidden="true"><img src="/assets/photos/volunteer-music.jpg" alt="" loading="eager" onerror="this.remove()"></div><div class="wrap">{crumbs([('/','Home'),('/hospice/','Hospice'),(None,'Volunteer')])}
<div class="hero-grid"><div><p class="kicker">A ProHealth Hospice programme</p><h1>Give the gift of <em>presence.</em></h1>
<p class="lead">Hospice volunteers do the one thing no clinician can prescribe. They show up, sit down, and stay. A few hours a week can change what a family remembers about the hardest season of their lives.</p>
<div class="hero-cta"><a class="btn btn-blue" href="#" onclick="openChat();return false;">Ask about volunteering</a><a class="btn btn-outline" href="tel:+18776678770">Call {PHONE}</a></div></div>
<div class="hero-photo"><div class="ph"><img src="/assets/photos/hospice-portrait.jpg" alt="A nurse and an older woman sharing a warm moment" loading="eager" onerror="this.remove()"></div>
<div class="float-card fc-visit"><span class="ic-round">{ICONS['clock']}</span><div><div class="fc-title">2 to 4 hours a week</div><div class="fc-sub">Full training provided</div></div></div></div></div></div></div>

<section class="tex">{wm('r')}<div class="wrap fit">
<div><p class="kicker reveal">Why hospice, specifically</p><h2 class="reveal">Volunteers are not an extra. They are part of the care.</h2>
<p class="section-lead reveal" style="margin-bottom:0">Volunteering at ProHealth sits inside our Hospice programme, and that is deliberate. Hospice is the one service where the need is as much human as it is clinical: someone to sit with a patient while their daughter sleeps, someone to hold a hand at 3pm on a Tuesday. Medicare recognises this too. Hospice is the only benefit that formally requires volunteers to be part of the team, because comfort at the end of life was never meant to come only from people being paid to provide it.</p></div>
<div class="fit-card reveal d1"><h3>You might be right for this if:</h3><ul class="checks">
<li>{CHECK}You can give two to four hours most weeks, reliably</li>
<li>{CHECK}You are comfortable being present without needing to fix anything</li>
<li>{CHECK}You can hold a confidence, absolutely and always</li>
<li>{CHECK}You want to do something that matters to someone this month, not eventually</li></ul>
<p style="font-size:.86rem;color:var(--slate);margin-top:16px">Many of our volunteers came to us after their own family was cared for by a hospice team. You do not need a reason like that. It just tends to be the reason.</p></div>
</div></section>

<section class="disciplines has-bg on-g50"><div class="sec-bg" aria-hidden="true"><img src="/assets/photos/homecare-seated.jpg" alt="" loading="lazy" onerror="this.remove()"></div><div class="wrap">
<p class="kicker reveal">Ways to help</p><h2 class="reveal">Find the way that fits you</h2>
<p class="section-lead reveal">Every role here is real support for a real family, and none of them require you to be a clinician.</p><div class="grid3">{vol}</div></div></section>

<section id="how"><div class="wrap"><p class="kicker reveal">How it works</p><h2 class="reveal">From first call to first visit</h2>
<p class="section-lead reveal">Take your time with this. There is no pressure at any step, including the last one.</p>
<div class="steps">
<div class="step reveal"><h3>Reach out</h3><p>Call {PHONE} or leave your details in the chat. Our volunteer coordinator calls you back for a proper conversation.</p></div>
<div class="step reveal d1"><h3>Screening</h3><p>Background check, health clearance including TB, and references. It protects patients, and it protects you.</p></div>
<div class="step reveal d2"><h3>Training</h3><p>Orientation on hospice care, communication, boundaries, confidentiality and what to expect emotionally.</p></div>
<div class="step reveal d3"><h3>Your match</h3><p>We match you to a patient or a role near where you live, and you are supported by the team from then on.</p></div>
</div></div></section>

<section style="padding-top:0"><div class="wrap"><div class="coverage reveal"><img class="cov-wm" src="{MONO_WHITE}" alt="" aria-hidden="true">
<div><p class="kicker" style="color:var(--sky)">Support for you, too</p><h2>You will never be sent in alone</h2>
<p>Volunteers are part of the hospice interdisciplinary team, alongside nurses, aides, social workers and chaplains. You get a named coordinator, ongoing supervision, and support after a patient dies, because that part is real and we do not pretend otherwise.</p></div>
<div class="coverage-actions"><a class="btn btn-white" href="tel:+18776678770">Talk to our coordinator</a>
<a class="btn btn-ghost" href="/hospice/">Read about our Hospice programme</a></div></div></div></section>

<section class="faq-sec"><div class="wrap"><div class="faq-cta reveal">
<span class="ic">{ICONS['help']}</span>
<div><h3>Volunteer questions</h3><p>Experience needed, time commitment, screening, and whether you have to sit with someone who is dying. Answered honestly on our careers FAQ page.</p></div>
<a class="btn btn-blue" href="/faqs/careers/#volunteering">Read the volunteer FAQs</a></div></div></section>

<section class="final-cta has-bg on-warm" style="padding:64px 0"><div class="sec-bg" aria-hidden="true"><img src="/assets/photos/homecare-seated.jpg" alt="" loading="lazy" onerror="this.remove()"></div><div class="wrap">
<h2 class="reveal">A few hours. An enormous difference.</h2>
<p class="section-lead reveal" style="margin:0 auto 24px">Tell us a little about yourself and our volunteer coordinator will call you back for a proper conversation.</p>
<a class="btn btn-blue reveal d1" href="tel:+18776678770">Call {PHONE}</a></div></section>''',
 {"@context":"https://schema.org","@graph":[faq_ld(vol_faqs),
   {"@type":"BreadcrumbList","itemListElement":[
     {"@type":"ListItem","position":1,"name":"Home","item":"https://prohealth.us/"},
     {"@type":"ListItem","position":2,"name":"Hospice","item":"https://prohealth.us/hospice/"},
     {"@type":"ListItem","position":3,"name":"Volunteer"}]}]}, active='')

print('pages part 1 done')
