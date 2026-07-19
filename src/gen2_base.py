#!/usr/bin/env python3
import os, json, shutil, re, sys
ROOT = os.path.dirname(os.path.abspath(__file__))          # the src/ directory
OUT  = os.environ.get('PROHEALTH_OUT', os.path.join(os.path.dirname(ROOT), 'site'))
sys.path.insert(0, ROOT)
from chat_assets import CHAT_CSS, CHAT_HTML
exec(open(os.path.join(ROOT,'ca_data.py')).read())   # CA_PATH, OFFICE_PX

SITE=OUT; os.makedirs(SITE, exist_ok=True)
LOGO='/assets/logo.png'
LOGO_WHITE='/assets/logo-white.png'
MONO='/assets/mono.png'
MONO_WHITE='/assets/mono-white.png'
FB='https://www.facebook.com/phhcinc?mibextid=wwXIfr'
LI='https://www.linkedin.com/company/prohealth-home-care-inc/'
IG='https://www.instagram.com/prohealth.home.care.inc?igsh=NTc4MTIwNjQ2YQ%3D%3D&utm_source=qr'
GMB='https://maps.app.goo.gl/53fT9qNGvwQmFLNMA'
PHONE='877.667.8770'

# ---------- verified company facts ----------
# Founded 2005 per ZoomInfo. NOTE: prohealth.us/about-us currently says
# "In our 15 years as a health care provider", which reads like copy written
# around 2020. Confirm with the client, then change FOUNDED here and every
# page updates. Medicare certification date is verified from CMS.
FOUNDED = 2005
THIS_YEAR = 2026
YEARS = THIS_YEAR - FOUNDED                      # 21
YEARS_TEXT = "two decades"
MEDICARE_SINCE = 2016                            # CMS certified 8 Nov 2016, verified
CMS_STARS = "4.5"                                # CMS Care Compare, verified


CSS = open(os.path.join(ROOT,'inner2.css'), encoding='utf-8').read() + CHAT_CSS
CHAT_HTML = CHAT_HTML.replace('__LOGO_WHITE__', LOGO_WHITE)
CHAT_JS = open(os.path.join(ROOT,'chat2.js'), encoding='utf-8').read()

FAVICON_TAGS = ("""<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/icon-192.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#138AC0">""")

PHONE_SVG='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9z"/></svg>'
CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
ICONS={
 'pulse':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
 'heart':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
 'home':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9h13v-9"/></svg>',
 'clock':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
 'users':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
 'chat':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.7 8.7 0 0 1-3.6-.8L3 21l1.9-5.7a8.3 8.3 0 0 1-.9-3.8A8.4 8.4 0 0 1 12.5 3a8.4 8.4 0 0 1 8.5 8.5z"/></svg>',
 'shield':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
 'pin':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
 'doc':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
 'play':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
 'search':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 'help':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
 'briefcase':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
 'map':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m1 6 7-3 8 3 7-3v15l-7 3-8-3-7 3z"/><path d="M8 3v15M16 6v15"/></svg>',
 'compare':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h7M3 12h7M3 18h7"/><path d="M14 6h7M14 12h7M14 18h7"/><path d="M10.5 3v18M13.5 3v18" opacity=".35"/></svg>',
 'grid':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
 'info':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>',
 'mail':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
 'send':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>',
 'dollar':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
 'star':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
 'lock':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
}
G_SVG='<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.5v5.4h7.1c4.1-3.8 6.6-9.4 6.6-15.9z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.4c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.6C8.1 41.2 15.5 46 24 46z"/><path fill="#FBBC05" d="M11.8 28.4c-.4-1.3-.7-2.7-.7-4.4s.3-3.1.7-4.4v-5.6H4.5C2.9 17.2 2 20.5 2 24s.9 6.8 2.5 10l7.3-5.6z"/><path fill="#EA4335" d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 29.9 2 24 2 15.5 2 8.1 6.8 4.5 14l7.3 5.6c1.7-5.2 6.5-9.2 12.2-9.2z"/></svg>'
G_BADGE=f'<span class="g-badge">{G_SVG} Google review</span>'

NAV=[('/services/','Services','grid'),('/locations/','Locations','map'),('/about-us/','About','info')]
NAV_ICONS=[('/volunteer/','Hospice volunteering','heart'),('/faqs/','FAQs','help'),('/contact/','Contact us','mail')]
NAV_PILLS=[('/refer-a-patient/','Refer a patient','send'),('/careers/','Careers','briefcase')]

MEGA_SERVICES=[
 ('/home-health-care/','Home Health','Skilled nursing and therapy at home, covered by Medicare.',
  '/assets/photos/homehealth-tea-sq.jpg'),
 ('/hospice/','Hospice Care','Comfort, dignity and 24/7 support when quality of life comes first.',
  '/assets/photos/hospice-portrait-sq.jpg'),
 ('/palliative-care/','Palliative Care','Symptom relief at any stage, alongside your current treatment.',
  '/assets/photos/palliative-bed-sq.jpg'),
 ('/home-care/','Home Care','Caregivers and companionship, from a few hours to 24 hour care.',
  '/assets/photos/homecare-walk-sq.jpg'),
]
MEGA_LOC_EXTRA=[('/locations/#counties','All 20 counties','Check whether we cover your address','shield'),
 ('/contact/?topic=coverage','Free coverage check','We verify insurance and service area','help')]
CHEV='<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'

def header(active=''):
    mega_cards=''.join(
        f'<a class="mega-card" href="{u}"><div class="mega-img"><img src="{img}" alt="{t}" loading="lazy" onerror="this.remove()"></div>'
        f'<div class="mega-tx"><b>{t}</b><span>{d}</span></div></a>' for u,t,d,img in MEGA_SERVICES)
    mega=(f'<div class="mega" role="menu"><div class="mega-grid">{mega_cards}</div>'
          f'<div class="mega-foot"><p><b>Not sure which you need?</b> Our team works it out with you in one call. <a href="/volunteer/" style="color:var(--blue-dark);font-weight:600;text-decoration:none">Hospice volunteering &rarr;</a></p>'
          f'<a class="btn btn-outline" href="/services/">{ICONS["compare"]}Compare all services</a>'
          f'<a class="btn btn-blue" href="tel:+18776678770">{PHONE_SVG} {PHONE}</a></div></div>')
    loc_cards=''.join(
        f'<a class="loc-card{" hq" if hq else ""}" href="{gmaps(a)}" target="_blank" rel="noopener">'
        f'<span class="lp">{ICONS["pin"]}</span><span><b>{n}{" &middot; HQ" if hq else ""}</b>'
        f'<small>{a.split(",")[0]}</small></span></a>' for n,a,_x,_y,hq in OFFICE_PX)
    loc_cards+=''.join(
        f'<a class="loc-card" href="{u}"><span class="lp">{ICONS[ic]}</span>'
        f'<span><b>{t}</b><small>{d}</small></span></a>' for u,t,d,ic in MEGA_LOC_EXTRA)
    mega_loc=(f'<div class="mega mega-loc" role="menu"><div class="mega-grid">{loc_cards}</div>'
              f'<div class="mega-foot"><p><b>Six offices, 20 counties.</b> Every location fields its own local clinical team.</p>'
              f'<a class="btn btn-outline" href="/locations/">All locations &amp; coverage</a>'
              f'<a class="btn btn-blue" href="tel:+18776678770">{PHONE_SVG} {PHONE}</a></div></div>')
    links=''
    for h,t,ic in NAV:
        cur=' aria-current="page"' if h==active else ''
        if h=='/services/':
            links+=(f'<span class="has-mega" data-mega><a href="{h}"{cur} aria-haspopup="true" aria-expanded="false">'
                    f'{ICONS[ic]}{t}{CHEV}</a>{mega}</span>')
        elif h=='/locations/':
            links+=(f'<span class="has-mega" data-mega-loc><a href="{h}"{cur} aria-haspopup="true" aria-expanded="false">'
                    f'{ICONS[ic]}{t}{CHEV}</a>{mega_loc}</span>')
        else:
            links+=f'<a href="{h}"{cur}>{ICONS[ic]}{t}</a>'
    icons=''.join(f'<a class="nav-ic" href="{h}"{" aria-current=\"page\"" if h==active else ""} aria-label="{t}">{ICONS[ic]}<span class="tip">{t}</span></a>' for h,t,ic in NAV_ICONS)
    pills=''.join(f'<a class="nav-pill" href="{h}"{" aria-current=\"page\"" if h==active else ""}>{ICONS[ic]}{t}</a>' for h,t,ic in NAV_PILLS)
    DRAWER=[('/services/','Services','grid'),('/home-health-care/','Home Health','pulse'),('/hospice/','Hospice','heart'),
            ('/palliative-care/','Palliative Care','shield'),('/home-care/','Home Care','home')]
    DRAWER2=[('/locations/','Locations &amp; coverage','map'),
             ('/refer-a-patient/','Refer a patient','send'),('/careers/','Careers','briefcase'),
             ('/volunteer/','Hospice volunteering','users'),('/faqs/','FAQs','help'),
             ('/about-us/','About us','info'),('/contact/','Contact','mail')]
    dlinks=''.join(f'<a href="{h}"{" aria-current=\"page\"" if h==active else ""}>{ICONS[ic]}{t}</a>' for h,t,ic in DRAWER)
    dlinks+='<div class="drawer-sep"></div><div class="drawer-lbl">More</div>'
    dlinks+=''.join(f'<a href="{h}"{" aria-current=\"page\"" if h==active else ""}>{ICONS[ic]}{t}</a>' for h,t,ic in DRAWER2)
    return f'''<header><div class="wrap nav">
<a class="logo" href="/" aria-label="ProHealth Home Care home"><img src="{LOGO}" alt="ProHealth Home Care, Inc." width="755" height="220" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="logo-fallback">ProHealth Home Care</span></a>
<nav class="links" aria-label="Primary">{links}</nav>
<div class="nav-actions">
<div class="nav-icons">{icons}</div>
{pills}
<a class="nav-call" href="tel:+18776678770">{PHONE_SVG} {PHONE}</a>
</div>
<button class="menu-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false" aria-controls="drawer">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button></div></header>
<div class="drawer-veil" id="drawerVeil" hidden></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Menu" hidden>
<div class="drawer-top"><img src="{LOGO}" alt="ProHealth Home Care, Inc."><button class="drawer-x" id="drawerX" aria-label="Close menu">&times;</button></div>
<nav aria-label="Mobile">{dlinks}</nav>
<div class="drawer-foot">
<a class="btn btn-blue" href="tel:+18776678770">{PHONE_SVG} Call {PHONE}</a>
<div class="status" id="dwStatus">
  <div class="status-row"><span class="status-dot" id="dwDot"></span><span id="dwState">Checking&hellip;</span></div>
  <div class="status-time" id="dwTime">&nbsp;</div>
  <div class="status-note" id="dwNote">Mon to Fri, 8:30am to 5:00pm Pacific</div>
</div></div></aside>'''

SOC_ICONS={
 'fb':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>',
 'li':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.75-1.95C20.5 8.75 21 11.1 21 14.2V21h-4v-6c0-1.4 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V21H9z"/></svg>',
 'ig':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none"/></svg>',
 'gg':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'}

FOOTER=f'''<footer class="site"><img class="foot-wm" src="{MONO_WHITE}" alt="" aria-hidden="true"><div class="wrap">
<div class="foot-grid">
<div><img class="foot-logo" src="{LOGO_WHITE}" alt="ProHealth Home Care, Inc." width="756" height="220"><p style="max-width:36ch">Locally owned Home Health and Hospice agency serving 20 California counties from six offices, with clinical excellence and compassion, one patient at a time.</p></div>
<div class="foot-col"><h4>Services</h4><a href="/home-health-care/">Home Health</a><a href="/hospice/">Hospice</a><a href="/palliative-care/">Palliative Care</a><a href="/home-care/">Home Care</a><a href="/volunteer/">Volunteer</a></div>
<div class="foot-col"><h4>Company</h4><a href="/about-us/">About us</a><a href="/locations/">Locations &amp; coverage</a><a href="/careers/">Careers</a><a href="/faqs/">FAQs</a><a href="/refer-a-patient/">Refer a patient</a><a href="/contact/">Contact</a></div>
<div class="foot-col foot-contact"><h4>Contact</h4>
<a class="foot-phone" href="tel:+18776678770">{PHONE_SVG} {PHONE}</a>
<div class="status" id="ftStatus">
  <div class="status-row"><span class="status-dot" id="ftDot"></span><span id="ftState">Checking&hellip;</span></div>
  <div class="status-time" id="ftTime">&nbsp;</div>
  <div class="status-note" id="ftNote">Mon to Fri, 8:30am to 5:00pm Pacific</div>
</div>
<nav class="socials" aria-label="Social media">
<a class="soc" href="{FB}" target="_blank" rel="noopener" aria-label="ProHealth on Facebook">{SOC_ICONS['fb']}</a>
<a class="soc" href="{LI}" target="_blank" rel="noopener" aria-label="ProHealth on LinkedIn">{SOC_ICONS['li']}</a>
<a class="soc" href="{IG}" target="_blank" rel="noopener" aria-label="ProHealth on Instagram">{SOC_ICONS['ig']}</a>
<a class="soc" href="{GMB}" target="_blank" rel="noopener" aria-label="ProHealth on Google Maps and Reviews">{SOC_ICONS['gg']}</a>
</nav></div>
</div>
<div class="foot-bottom"><span>© 2026 ProHealth Home Care, Inc. · Medicare certified · Equal opportunity employer</span>
<nav class="foot-legal" aria-label="Legal"><a href="/privacy-policy/">Privacy</a><a href="/notice-of-privacy-practices/">HIPAA Notice</a><a href="/terms/">Terms</a><a href="/accessibility/">Accessibility</a><a href="/nondiscrimination/">Nondiscrimination</a><a href="/data-request/">Data Requests</a>
</nav></div>
</div></footer>'''

# ---------- live footer status: PT clock + open/closed + public holidays ----------
# Staff-login button was removed from the footer. Staff reach the admin
# directly at the Worker's /admin URL, so no public link is rendered.
STAFF_JS = ''

API_JS = '''
/* Point this at your Worker once it is deployed. Until then submissions are
   logged to the console so the site is usable without a backend. */
const API_BASE = window.PROHEALTH_API || '';
async function postJSON(path, data){
  if(!API_BASE){ console.log('[no API_BASE] would POST', path, data); return {ok:true, offline:true}; }
  const r = await fetch(API_BASE+path, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  if(!r.ok) throw new Error((await r.json().catch(()=>({}))).error || 'Could not send. Please call 877.667.8770.');
  return r.json();
}
async function postForm(path, fd){
  if(!API_BASE){ console.log('[no API_BASE] would POST', path, [...fd.keys()]); return {ok:true, offline:true}; }
  const r = await fetch(API_BASE+path, {method:'POST', body:fd});
  if(!r.ok) throw new Error((await r.json().catch(()=>({}))).error || 'Could not send. Please call 877.667.8770.');
  return r.json();
}
'''


# Real reviews, taken verbatim from the client's own site.
# Verbatim from the client's own site. Kept close in length so the fixed-height
# quote box never has to grow or shrink between rotations.
HERO_REVIEWS=[
 ("Very helpful in time of need. Our team is a God send. We are very satisfied.","Lizzie L.","Home Health"),
 ("Nurse, Physical Therapist and Occupational Therapist are excellent. So much better than my previous agency.","Antoinette C.","Home Health"),
 ("Extremely satisfied and very thankful with the Hospice team, that they are there for my mom.","Dorothy N.","Hospice"),
 ("Very impressed! Improving with therapy. We are very happy with the care it is working out so well.","Dessie F.","Home Health"),
]
STAR_SVG='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>' 
G_MARK='<svg class="rvg" viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.5v5.4h7.1c4.1-3.8 6.6-9.4 6.6-15.9z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.4c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.6C8.1 41.2 15.5 46 24 46z"/><path fill="#FBBC05" d="M11.8 28.4c-.4-1.3-.7-2.7-.7-4.4s.3-3.1.7-4.4v-5.6H4.5C2.9 17.2 2 20.5 2 24s.9 6.8 2.5 10l7.3-5.6z"/><path fill="#EA4335" d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 29.9 2 24 2 15.5 2 8.1 6.8 4.5 14l7.3 5.6c1.7-5.2 6.5-9.2 12.2-9.2z"/></svg>'

REVIEW_JS = '''
/* One large Google review above the service tiles, rotating every 5.5s.
   The card height is fixed in CSS, so a long quote can never shove the tiles
   down mid-rotation. Hovering pauses it; the dots jump straight to a review. */
(function(){
  const HR=__HERO_REVIEWS__;
  const card=document.querySelector('.hr-card');
  if(!card || HR.length<2) return;
  const q=card.querySelector('q'), w=card.querySelector('.rvw'), dots=card.querySelector('.hr-dots');
  if(!q || !w) return;
  let i=0, t=null;
  function show(n){
    card.classList.add('fading');
    setTimeout(function(){
      i=n;
      q.textContent=HR[i][0];
      w.textContent=HR[i][1]+' \u00b7 '+HR[i][2]+' \u00b7 Google';
      if(dots) [].forEach.call(dots.children,function(d,k){ d.className = k===i?'on':''; });
      card.classList.remove('fading');
    },400);
  }
  function run(){ clearInterval(t); t=setInterval(function(){ show((i+1)%HR.length); }, 5500); }
  if(dots){
    dots.innerHTML=HR.map(function(_,k){ return '<i class="'+(k?'':'on')+'"></i>'; }).join('');
    [].forEach.call(dots.children,function(d,k){
      d.addEventListener('click',function(){ if(k!==i){ show(k); } run(); });
    });
  }
  run();
  card.addEventListener('mouseenter',function(){ clearInterval(t); });   // let people finish reading
  card.addEventListener('mouseleave',run);
})();
'''


MEGA_JS = '''
/* Hover opens, click PINS. A pinned panel ignores mouseleave entirely, so you
   can travel to it at your own pace. It closes on an outside click, on Escape,
   or when you pin a different one. */
(function(){
  const wraps=[...document.querySelectorAll('[data-mega],[data-mega-loc]')];
  if(!wraps.length) return;
  const coarse=window.matchMedia('(hover:none)').matches;
  let closeT=null;

  function open(w){
    clearTimeout(closeT);
    wraps.forEach(x=>{ if(x!==w){ x.classList.remove('open','pinned'); mark(x,false); } });
    w.classList.add('open'); mark(w,true);
  }
  function close(w){ w.classList.remove('open','pinned'); mark(w,false); }
  function closeAll(){ wraps.forEach(close); }
  function mark(w,on){ const a=w.querySelector('a'); if(a) a.setAttribute('aria-expanded', on?'true':'false'); }

  wraps.forEach(wrap=>{
    const link=wrap.querySelector('a');

    link.addEventListener('click', e=>{
      // first click pins instead of navigating; a second click follows the link
      if(!wrap.classList.contains('pinned')){
        e.preventDefault();
        open(wrap); wrap.classList.add('pinned');
      }
    });

    if(!coarse){
      wrap.addEventListener('mouseenter', ()=>{ clearTimeout(closeT); open(wrap); });
      wrap.addEventListener('mouseleave', ()=>{
        if(wrap.classList.contains('pinned')) return;   // pinned: stay put
        clearTimeout(closeT);
        closeT=setTimeout(()=>close(wrap), 320);        // grace period for the trip down
      });
    }
  });

  document.addEventListener('click', e=>{ if(!wraps.some(w=>w.contains(e.target))) closeAll(); });
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){ closeAll(); const a=document.activeElement; if(a&&a.blur) a.blur(); }
  });
  addEventListener('resize', closeAll);
})();
'''


PRINT_JS = '''
/* expand every accordion for print, restore afterwards */
(function(){
  let reopened=[];
  function expand(){ reopened=[]; document.querySelectorAll('details:not([open])').forEach(d=>{ d.open=true; reopened.push(d); }); }
  function restore(){ reopened.forEach(d=>d.open=false); reopened=[]; }
  if(window.matchMedia){
    const mq=window.matchMedia('print');
    (mq.addEventListener?mq.addEventListener.bind(mq,'change'):mq.addListener.bind(mq))(e=>{ e.matches?expand():restore(); });
  }
  addEventListener('beforeprint',expand);
  addEventListener('afterprint',restore);
})();
'''

DRAWER_JS = '''
(function(){
  const btn=document.getElementById('menuBtn'), dw=document.getElementById('drawer'),
        veil=document.getElementById('drawerVeil'), x=document.getElementById('drawerX');
  if(!btn||!dw) return;
  let last=null;
  function open(){
    last=document.activeElement;
    dw.hidden=false; veil.hidden=false;
    requestAnimationFrame(()=>{ dw.classList.add('open'); veil.classList.add('open'); });
    document.body.classList.add('locked');
    btn.setAttribute('aria-expanded','true');
    setTimeout(()=>{ const a=dw.querySelector('a'); if(a) a.focus(); },60);
  }
  function close(){
    dw.classList.remove('open'); veil.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
    document.body.classList.remove('locked');
    setTimeout(()=>{ dw.hidden=true; veil.hidden=true; if(last) last.focus(); },320);
  }
  btn.addEventListener('click',open);
  x.addEventListener('click',close);
  veil.addEventListener('click',close);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && dw.classList.contains('open')) close(); });
  dw.querySelectorAll('a[href]').forEach(a=>a.addEventListener('click',close));
  // focus trap
  dw.addEventListener('keydown',e=>{
    if(e.key!=='Tab') return;
    const f=[...dw.querySelectorAll('a[href],button')].filter(el=>el.offsetParent!==null);
    if(!f.length) return;
    const first=f[0], lastEl=f[f.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); lastEl.focus(); }
    else if(!e.shiftKey && document.activeElement===lastEl){ e.preventDefault(); first.focus(); }
  });
  // never leave the drawer stuck open when resizing up to desktop
  addEventListener('resize',()=>{ if(innerWidth>760 && dw.classList.contains('open')) close(); });
})();
'''

STATUS_JS = '''
/* US federal holidays (observed). Extend as needed; the admin can drive this later. */
const HOLIDAYS={
 "2026-01-01":"New Year\u2019s Day","2026-01-19":"Martin Luther King Jr. Day","2026-02-16":"Presidents\u2019 Day",
 "2026-05-25":"Memorial Day","2026-06-19":"Juneteenth","2026-07-03":"Independence Day (observed)",
 "2026-09-07":"Labor Day","2026-10-12":"Columbus Day","2026-11-11":"Veterans Day",
 "2026-11-26":"Thanksgiving Day","2026-11-27":"Day after Thanksgiving","2026-12-24":"Christmas Eve",
 "2026-12-25":"Christmas Day","2027-01-01":"New Year\u2019s Day","2027-01-18":"Martin Luther King Jr. Day",
 "2027-02-15":"Presidents\u2019 Day","2027-05-31":"Memorial Day","2027-06-18":"Juneteenth (observed)",
 "2027-07-05":"Independence Day (observed)","2027-09-06":"Labor Day","2027-11-11":"Veterans Day",
 "2027-11-25":"Thanksgiving Day","2027-11-26":"Day after Thanksgiving","2027-12-24":"Christmas Eve (observed)"
};
function ptParts(d){
  const f=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',year:'numeric',month:'2-digit',
    day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZoneName:'short'}).formatToParts(d||new Date());
  const g=t=>(f.find(p=>p.type===t)||{}).value;
  const days={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  return {iso:`${g('year')}-${g('month')}-${g('day')}`,dow:days[g('weekday')],
          mins:(+g('hour'))*60+(+g('minute')),tz:g('timeZoneName')||'PT'};
}
/* minutes until the office next opens, holidays and weekends respected */
function minsUntilOpen(){
  const p=ptParts(); let d=new Date();
  for(let step=0; step<14*24*60; step+=5){
    const t=ptParts(new Date(Date.now()+step*60000));
    const hol=HOLIDAYS[t.iso], wk=t.dow>=1&&t.dow<=5, inH=t.mins>=510&&t.mins<1020;
    if(wk && inH && !hol) return step;
  }
  return null;
}
function humanGap(m){
  if(m===null) return '';
  if(m<1) return 'in under a minute';
  if(m<60) return 'in '+m+' minute'+(m===1?'':'s');
  const h=Math.floor(m/60), mm=m%60;
  if(h<24) return 'in '+h+' hour'+(h===1?'':'s')+(mm?' '+mm+' minute'+(mm===1?'':'s'):'');
  const d=Math.floor(h/24), hh=h%24;
  return 'in '+d+' day'+(d===1?'':'s')+(hh?' '+hh+' hour'+(hh===1?'':'s'):'');
}
function ftPaint(){
  const el=document.getElementById('ftStatus'); if(!el) return;
  const p=ptParts(), hol=HOLIDAYS[p.iso];
  const weekday=p.dow>=1&&p.dow<=5, inHours=p.mins>=510&&p.mins<1020;
  const open=weekday&&inHours&&!hol;
  const set=(a,b)=>{const e=document.getElementById(a); if(e) e[b.k]=b.v;};
  const dot=document.getElementById('ftDot'), st=document.getElementById('ftState'),
        tm=document.getElementById('ftTime'), nt=document.getElementById('ftNote');
  tm.textContent=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'long',month:'short',
    day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date())+' '+p.tz;
  el.classList.toggle('is-holiday',!!hol);
  dot.className='status-dot'+(hol?' holiday':(open?'':' shut'));
  const gap = open ? null : humanGap(minsUntilOpen());
  if(hol){
    st.textContent='Closed for '+hol;
    nt.innerHTML='Closed today for <b>'+hol+'</b>. We reopen <b>'+gap+'</b>. Please <b>check availability</b> on 877.667.8770; our on-call clinical line is staffed 24/7 for patients.';
  } else if(open){
    st.textContent='Open now';
    nt.innerHTML='We reply <b>within 2 hours</b> today. Mon to Fri, 8:30am to 5:00pm Pacific.';
  } else {
    st.textContent='Closed \u00b7 opens '+gap;
    nt.innerHTML='We open <b>'+gap+'</b>. Office hours are Mon to Fri, 8:30am to 5:00pm Pacific. Our <b>on-call clinical line is 24/7</b> for patients.';
  }
  // mirror into the mobile drawer
  const d2=document.getElementById('dwStatus');
  if(d2){
    document.getElementById('dwDot').className=dot.className;
    document.getElementById('dwState').textContent=st.textContent;
    document.getElementById('dwTime').textContent=tm.textContent;
    document.getElementById('dwNote').innerHTML=nt.innerHTML;
    d2.classList.toggle('is-holiday',el.classList.contains('is-holiday'));
  }
}
ftPaint(); setInterval(ftPaint,30000);
'''

CALLBAR=f'''<div class="callbar">
<a class="btn btn-blue" href="tel:+18776678770">{PHONE_SVG} Call now</a>
<button class="btn btn-outline" id="chatToggle" onclick="toggleChat()" aria-expanded="false" aria-controls="chatPanel">
<span class="ct-ic" id="chatToggleIc">{ICONS['chat']}</span><span id="chatToggleTx">Chat with us</span></button>
</div>'''

REVEAL="const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.15});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));"


def add_img_dims_and_preload(html):
    """Core Web Vitals: give every local <img> explicit width/height to kill layout
    shift (CLS), and <link rel=preload> the hero image so LCP fires sooner."""
    import re as _re
    from PIL import Image as _Img
    import os as _os
    _dims = {}
    for _dir, _pref in [(os.path.join(ROOT,'assets','photos'), '/assets/photos/'),
                        (os.path.join(ROOT,'assets'), '/assets/')]:
        if not _os.path.isdir(_dir): continue
        for _f in _os.listdir(_dir):
            if _f.lower().endswith(('.jpg','.jpeg','.png')):
                try: _dims[_pref+_f] = _Img.open(_os.path.join(_dir,_f)).size
                except Exception: pass
    def _add(m):
        _tag = m.group(0)
        if 'width=' in _tag or 'height=' in _tag: return _tag
        _s = _re.search(r'src="([^"]+)"', _tag)
        if not _s or _s.group(1) not in _dims: return _tag
        _w,_h = _dims[_s.group(1)]
        return _tag[:-1] + f' width="{_w}" height="{_h}">'
    html = _re.sub(r'<img[^>]*>', _add, html)
    # preload the first eager hero image (the LCP element)
    _hero = _re.search(r'<img src="(/assets/photos/[^"]+)"[^>]*loading="eager"', html)
    if _hero:
        _link = f'<link rel="preload" as="image" href="{_hero.group(1)}" fetchpriority="high">'
        if _link not in html:
            html = html.replace('</head>', _link + '\n</head>', 1)
    return html

def shell(slug,title,desc,canon,bodyhtml,jsonld=None,active='',extra_js=''):
    ld=f'<script type="application/ld+json">{json.dumps(jsonld)}</script>' if jsonld else ''
    d=os.path.join(SITE,slug); os.makedirs(d,exist_ok=True)
    _html = f'''<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}">
<link rel="canonical" href="https://prohealth.us/{canon}">
{FAVICON_TAGS}
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<meta property="og:type" content="website"><meta property="og:url" content="https://prohealth.us/{canon}">
<meta property="og:image" content="https://prohealth.us/assets/og-card.png"><meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
{ld}<style>{CSS}</style></head><body>
{header(active)}{bodyhtml}{FOOTER}{CALLBAR}{CHAT_HTML}
<script>{REVEAL}
{API_JS}
{STAFF_JS}
{MEGA_JS}
{DRAWER_JS}
{PRINT_JS}
{STATUS_JS}
{extra_js}
{CHAT_JS}</script></body></html>'''
    _html = add_img_dims_and_preload(_html)
    open(os.path.join(d,'index.html'),'w',encoding='utf-8').write(_html)
    print('wrote /'+slug+('/' if slug else ''))

def crumbs(items):
    return '<nav class="crumbs" aria-label="Breadcrumb">'+' / '.join(f'<a href="{h}">{t}</a>' if h else f'<strong>{t}</strong>' for h,t in items)+'</nav>'
def faq_html(faqs,o=True):
    return ''.join(f'<details{" open" if (o and i==0) else ""}><summary>{q}</summary><div class="a">{a}</div></details>' for i,(q,a) in enumerate(faqs))
def faq_ld(faqs):
    return {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":re.sub('<[^>]+>','',a)}} for q,a in faqs]}
def wm(side='r'):
    return f'<div class="wm wm-{side}" aria-hidden="true"><img src="{MONO}" alt="" width="520" height="520"></div>'

COUNTIES=["Alameda","Contra Costa","El Dorado","Fresno","Madera","Merced","Monterey","Napa","Nevada","Placer",
          "Sacramento","San Benito","San Joaquin","San Mateo","Santa Clara","Santa Cruz","Solano","Tulare","Yolo","Yuba"]
MAPS_LINK="https://maps.app.goo.gl/53fT9qNGvwQmFLNMA"

def gmaps(addr):
    from urllib.parse import quote
    return "https://www.google.com/maps/search/?api=1&query="+quote("ProHealth Home Care "+addr)


# Highway waypoints (lat,lng) -> projected. Gives the map real texture.
HWY = {
 'I-5':  [(42.0,-122.6),(41.3,-122.4),(40.58,-122.39),(39.7,-122.2),(38.9,-121.7),(38.58,-121.49),
          (37.96,-121.29),(37.4,-121.1),(36.8,-120.5),(36.0,-120.1),(35.2,-119.2),(34.8,-118.9),
          (34.4,-118.5),(34.05,-118.25),(33.7,-117.8),(33.1,-117.3),(32.7,-117.1)],
 'US-101':[(41.75,-124.2),(40.8,-124.16),(39.4,-123.35),(38.44,-122.71),(37.77,-122.42),(37.34,-121.89),
          (36.68,-121.65),(35.63,-121.15),(35.28,-120.66),(34.64,-120.46),(34.42,-119.7),(34.28,-119.29),
          (34.15,-118.6),(34.05,-118.25)],
 'I-80': [(37.8,-122.27),(38.1,-122.15),(38.36,-121.99),(38.58,-121.49),(38.9,-121.08),(39.1,-120.8),(39.33,-120.18),(39.5,-120.0)],
 'CA-99':[(35.37,-119.02),(36.0,-119.35),(36.74,-119.79),(37.3,-120.48),(37.64,-120.99),(37.96,-121.29),(38.58,-121.49),(39.15,-121.6),(39.73,-121.84),(40.18,-122.24)],
}
CITIES = [('Redding',40.58,-122.39),('Chico',39.73,-121.84),('Santa Rosa',38.44,-122.71),
          ('San Francisco',37.77,-122.42),('Modesto',37.64,-120.99),('Salinas',36.68,-121.65),
          ('Bakersfield',35.37,-119.02),('Santa Barbara',34.42,-119.7),('Los Angeles',34.05,-118.25),
          ('San Diego',32.72,-117.16),('Eureka',40.8,-124.16),('South Lake Tahoe',38.94,-119.98)]
def _pt(lat,lng):
    x=(lng-(-124.5))/((-114.0)-(-124.5))*660
    y=(42.2-lat)/(42.2-32.4)*760
    return round(x,1),round(y,1)
def roads_svg():
    out=''
    for name,pts in HWY.items():
        d='M'+' L'.join(f'{_pt(a,b)[0]},{_pt(a,b)[1]}' for a,b in pts)
        cls='major' if name in ('I-5','US-101') else 'minor'
        out+=f'<path class="ca-roads {cls}" d="{d}"/>'
    for n,la,lo in CITIES:
        x,y=_pt(la,lo)
        out+=f'<circle class="ca-city" cx="{x}" cy="{y}" r="2.6"/>'
        anchor='end' if lo < -121.0 else 'start'
        dx=-5 if anchor=='end' else 5
        out+=f'<text class="ca-city-lbl" x="{x+dx}" y="{y+3.4}" text-anchor="{anchor}">{n}</text>'
    return out


# Thumbnail helper: hqdefault always exists; cover-crop removes the letterbox.
def yt_thumb(vid, alt):
    return (f'<img src="https://i.ytimg.com/vi/{vid}/hqdefault.jpg" alt="{alt}" loading="lazy" '
            f'data-yt-thumb="{vid}" style="object-fit:cover">')

# Belt and braces: if a grey placeholder ever slips through (naturalWidth<=120),
# swap to mqdefault which is generated for every upload.
YT_THUMB_JS = '''
document.querySelectorAll('img[data-yt-thumb]').forEach(img=>{
  const swap=()=>{ const id=img.dataset.ytThumb;
    if(!img.dataset.fallback){ img.dataset.fallback='1'; img.src='https://i.ytimg.com/vi/'+id+'/mqdefault.jpg'; } };
  img.addEventListener('error',swap);
  img.addEventListener('load',()=>{ if(img.naturalWidth<=120) swap(); });
  if(img.complete && img.naturalWidth && img.naturalWidth<=120) swap();
});
'''

# ---------- CA map component ----------
def ca_map_svg():
    blips=''
    for name,addr,x,y,hq in OFFICE_PX:
        h=' hq' if hq else ''
        dx,dy=(12,4)
        anchor='start'
        if name in ('Monterey','Walnut Creek','San Jose'): dx,anchor=-12,'end'
        blips+=f'''<g class="blip-hit" data-office="{name}" tabindex="0" role="button" aria-label="{name} office">
<circle class="blip-ring{h}" cx="{x}" cy="{y}" r="8"/><circle class="blip-ring{h} r2" cx="{x}" cy="{y}" r="8"/><circle class="blip-ring{h} r3" cx="{x}" cy="{y}" r="8"/>
<circle class="blip-core{h}" cx="{x}" cy="{y}" r="7"/>
<text class="blip-label" x="{x+dx}" y="{y+dy}" text-anchor="{anchor}">{name}</text></g>'''
    return f'''<div class="ca-map-wrap"><svg class="ca-map" viewBox="0 0 660 760" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Map of California showing ProHealth's six offices">
<defs><linearGradient id="cag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F4FAFE"/></linearGradient></defs>
<path class="ca-outline" d="{CA_PATH}" fill="url(#cag)"/><g clip-path="url(#caclip)">{roads_svg()}</g>{blips}</svg></div>'''

def office_list():
    out='<div class="office-list">'
    for name,addr,x,y,hq in OFFICE_PX:
        tag='<span class="tag">HQ</span>' if hq else ''
        out+=f'''<div class="office{' hq' if hq else ''}" data-office="{name}" tabindex="0">
<span class="pin">{ICONS['pin']}</span><div><h3>{name} {tag}</h3><p>{addr}</p>
<a class="dirs" href="{gmaps(addr)}" target="_blank" rel="noopener">Get directions →</a></div></div>'''
    return out+'</div>'

MAP_JS='''
document.querySelectorAll('.blip-hit,.office').forEach(el=>{
  const n=el.dataset.office;
  const sync=on=>document.querySelectorAll('[data-office="'+n+'"]').forEach(t=>t.classList.toggle('active',on));
  el.addEventListener('mouseenter',()=>sync(true));
  el.addEventListener('mouseleave',()=>sync(false));
  el.addEventListener('focus',()=>sync(true));
  el.addEventListener('blur',()=>sync(false));
  if(el.classList.contains('blip-hit')) el.addEventListener('click',()=>{
    const card=document.querySelector('.office[data-office="'+n+'"]');
    if(card) card.scrollIntoView({behavior:'smooth',block:'center'});
  });
});'''

# ---------- themed PDF-only file input ----------
FILE_JS='''
(function(){
  const inp=document.getElementById('ap-resume'); if(!inp) return;
  const dz=document.getElementById('dz'), main=document.getElementById('dzMain'), sub=document.getElementById('dzSub'), err=document.getElementById('dzErr');
  const MAX=2*1024*1024;
  function reset(){dz.classList.remove('has-file','err');main.textContent='Choose a PDF or drag it here';sub.textContent='PDF only · 2 MB maximum';err.classList.remove('show');}
  function fail(m){dz.classList.add('err');dz.classList.remove('has-file');err.textContent=m;err.classList.add('show');main.textContent='Choose a PDF or drag it here';sub.textContent='PDF only · 2 MB maximum';inp.value='';}
  function accept(f){
    const isPdf = f.type==='application/pdf' || /\\.pdf$/i.test(f.name);
    if(!isPdf) return fail('That file isn\\u2019t a PDF. Please upload your resume as a PDF.');
    if(f.size>MAX) return fail('That file is '+(f.size/1048576).toFixed(1)+' MB \\u2014 the limit is 2 MB. Try exporting a smaller PDF.');
    dz.classList.add('has-file');dz.classList.remove('err');err.classList.remove('show');
    main.textContent=f.name;sub.textContent=(f.size/1024).toFixed(0)+' KB \\u00b7 ready to send \\u00b7 click to replace';
    return true;
  }
  dz.addEventListener('click',()=>inp.click());
  dz.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inp.click();}});
  inp.addEventListener('change',()=>{const f=inp.files[0]; f?accept(f):reset();});
  ['dragenter','dragover'].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.add('drag');}));
  ['dragleave','drop'].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.remove('drag');}));
  dz.addEventListener('drop',e=>{const f=e.dataTransfer.files[0]; if(f){inp.files=e.dataTransfer.files; accept(f);}});
  reset();
})();'''

DROPZONE=f'''<div class="file-field">
<label for="ap-resume">Resume (PDF only, 2 MB max)</label>
<div class="dropzone" id="dz" role="button" tabindex="0" aria-controls="ap-resume">
<span class="dz-ic">{ICONS['doc']}</span>
<span><span class="dz-main" id="dzMain">Choose a PDF or drag it here</span><span class="dz-sub" id="dzSub">PDF only · 2 MB maximum</span></span></div>
<input id="ap-resume" type="file" accept="application/pdf,.pdf">
<div class="file-err" id="dzErr"></div></div>'''

# ---------- human check (slider captcha + honeypot + timing) ----------
def captcha(idp):
    return f'''<input class="hp" type="text" id="{idp}-hp" name="company_website" tabindex="-1" autocomplete="off" aria-hidden="true">
<div class="cap" id="{idp}-cap">
  <div class="cap-top">{ICONS['shield']}<span id="{idp}-cap-label">Quick human check</span></div>
  <div class="cap-track">
    <div class="cap-fill" id="{idp}-cap-fill"></div>
    <div class="cap-hint" id="{idp}-cap-hint">Slide all the way right to confirm</div>
    <input class="cap-range" type="range" min="0" max="100" value="0" id="{idp}-cap-range"
           aria-label="Slide to confirm you are human">
    <div class="cap-knob" id="{idp}-cap-knob">{ICONS['send']}</div>
  </div>
</div>'''

CAPTCHA_JS = '''
function initCap(p, form){
  const cap=document.getElementById(p+'-cap'), r=document.getElementById(p+'-cap-range'),
        fill=document.getElementById(p+'-cap-fill'), knob=document.getElementById(p+'-cap-knob'),
        hint=document.getElementById(p+'-cap-hint'), label=document.getElementById(p+'-cap-label');
  const t0=Date.now(); let passed=false;
  function paint(){
    const v=+r.value; fill.style.width=v+'%';
    knob.style.left='calc(3px + '+(v/100)*(r.offsetWidth-46)+'px)';
    if(v>=98 && !passed){
      passed=true; cap.classList.add('ok');
      hint.textContent='Verified, thank you'; label.textContent='Verified';
      knob.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
    } else if(v<98 && passed){ passed=false; cap.classList.remove('ok'); hint.textContent='Slide all the way right to confirm'; label.textContent='Quick human check'; }
  }
  r.addEventListener('input',paint);
  r.addEventListener('change',()=>{ if(+r.value<98){ r.value=0; paint(); } });
  window.addEventListener('resize',paint); paint();
  form.dataset.capReady='1';
  return function check(){
    if(document.getElementById(p+'-hp').value){ return false; }        // honeypot tripped
    if(Date.now()-t0 < 2500){ alert('Just a moment, please take a second to review your details.'); return false; }
    if(!passed){ cap.scrollIntoView({behavior:'smooth',block:'center'}); hint.textContent='Please slide to confirm'; cap.style.borderColor='#E9A0A0'; return false; }
    return true;
  };
}
'''

# ---------- app badges (referrals via app, not PDF) ----------
APP_BADGES = f'''<div class="apps">
<a class="app-badge" href="#" onclick="alert('App Store link goes here once the iOS app is published.');return false;">
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.6 2.3 2.8 2.2 1.1 0 1.6-.7 2.9-.7s1.7.7 2.9.7 2-1.1 2.7-2.2c.9-1.2 1.2-2.4 1.2-2.5 0 0-2.4-.9-2.4-3.5zM14.2 5.9c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 0 2.1-.5 2.7-1.3z"/></svg>
<span><small>Download on the</small><b>App Store</b></span></a>
<a class="app-badge" href="#" onclick="alert('Google Play link goes here once the Android app is published.');return false;">
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.6 2.2c-.3.3-.5.8-.5 1.4v16.8c0 .6.2 1.1.5 1.4l.1.1 9.4-9.4v-.2L3.7 2.1zM16.4 15.6l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2l-3.8 2zM15.5 16.5 12.3 13.3l-9.4 9.4c.4.4 1 .4 1.7.1l10.9-6.3M15.5 7.5 4.6 1.2C3.9.8 3.3.9 2.9 1.3l9.4 9.4z"/></svg>
<span><small>Get it on</small><b>Google Play</b></span></a></div>'''

print('generator loaded')
