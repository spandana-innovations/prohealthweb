#!/usr/bin/env python3
import sys, re, os
ROOT = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, ROOT)
from gen2_base import *

def _match_div(s, start):
    """Return index just past the </div> that closes the <div> opening at `start`."""
    import re as _re
    i = s.index('>', start) + 1
    depth = 1
    for m in _re.finditer(r'<div\b[^>]*>|</div>', s[i:]):
        depth += 1 if m.group(0)[1] != '/' else -1
        if depth == 0:
            return i + m.end()
    raise ValueError('unbalanced div from %d' % start)


GOOGLE_SVG_SM = '<svg viewBox="0 0 48 48" style="width:11px;height:11px;flex:none" aria-hidden="true"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.5v5.4h7.1c4.1-3.8 6.6-9.4 6.6-15.9z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.4c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.6C8.1 41.2 15.5 46 24 46z"/><path fill="#FBBC05" d="M11.8 28.4c-.4-1.3-.7-2.7-.7-4.4s.3-3.1.7-4.4v-5.6H4.5C2.9 17.2 2 20.5 2 24s.9 6.8 2.5 10l7.3-5.6z"/><path fill="#EA4335" d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 29.9 2 24 2 15.5 2 8.1 6.8 4.5 14l7.3 5.6c1.7-5.2 6.5-9.2 12.2-9.2z"/></svg>'

REVIEWS_SEC = '\n<section id="stories" class="alt tex">\n  <div class="wrap">\n    <div style="text-align:center">\n      <p class="kicker reveal">Clients speak</p>\n      <h2 class="reveal">Trusted by California families</h2>\n      <p class="section-lead reveal" style="margin:0 auto 30px">Health care is a right, not a privilege. Here\'s what the families we serve say, in their own words, on Google.</p>\n    </div>\n    <div class="rv-head reveal">\n      <div class="rv-score">\n        <svg class="rv-g" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.5v5.4h7.1c4.1-3.8 6.6-9.4 6.6-15.9z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.4c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.6C8.1 41.2 15.5 46 24 46z"/><path fill="#FBBC05" d="M11.8 28.4c-.4-1.3-.7-2.7-.7-4.4s.3-3.1.7-4.4v-5.6H4.5C2.9 17.2 2 20.5 2 24s.9 6.8 2.5 10l7.3-5.6z"/><path fill="#EA4335" d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 29.9 2 24 2 15.5 2 8.1 6.8 4.5 14l7.3 5.6c1.7-5.2 6.5-9.2 12.2-9.2z"/></svg>\n        <span class="rv-num">4.9</span>\n        <span class="rv-meta"><span class="stars" aria-hidden="true">★★★★★</span><small>Google reviews · Top 5 BusinessRate 2026</small></span>\n      </div>\n      <div class="rv-score">\n        <span class="rv-num" style="color:var(--blue)">4.5</span>\n        <span class="rv-meta"><span class="stars" aria-hidden="true">★★★★☆</span><small>Medicare Care Compare rating</small></span>\n      </div>\n    </div>\n    <div class="rv-grid"><article class="rv reveal"><div class="top">\n<span class="av" style="background:#138AC0">L</span>\n<span class="who">Lizzie L.<small>{GOOGLE_SVG_SM}Home Health on Google</small></span></div>\n<span class="stars" aria-hidden="true">★★★★★</span><p>Very helpful in time of need, no problems or complaints. Our team is a God send. We are very satisfied.</p></article><article class="rv reveal"><div class="top">\n<span class="av" style="background:#2F7A63">A</span>\n<span class="who">Antoinette C.<small>{GOOGLE_SVG_SM}Home Health on Google</small></span></div>\n<span class="stars" aria-hidden="true">★★★★★</span><p>Nurse, Physical Therapist and Occupational Therapist are excellent and I wished they didn\'t have to leave. They are all very detailed and pay very close attention to my needs. I had Home Health before but your company is so much better.</p></article><article class="rv reveal"><div class="top">\n<span class="av" style="background:#B0663C">D</span>\n<span class="who">Dorothy N.<small>{GOOGLE_SVG_SM}Hospice on Google</small></span></div>\n<span class="stars" aria-hidden="true">★★★★★</span><p>Extremely satisfied and very thankful with the Hospice team that they are there for my mom.</p></article><article class="rv reveal"><div class="top">\n<span class="av" style="background:#5B4FA3">D</span>\n<span class="who">Dessie F.<small>{GOOGLE_SVG_SM}Home Health on Google</small></span></div>\n<span class="stars" aria-hidden="true">★★★★★</span><p>Very impressed! OT is helping with getting a hospital bed. Improving with therapy, OT and PT are really great. We are very happy with the care… grateful that the care is working out very well.</p></article></div>\n    <div style="text-align:center;margin-top:26px">\n      <a class="btn btn-outline reveal" href="__GMB__" target="_blank" rel="noopener"><svg class="rv-g" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.5v5.4h7.1c4.1-3.8 6.6-9.4 6.6-15.9z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.4c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.6C8.1 41.2 15.5 46 24 46z"/><path fill="#FBBC05" d="M11.8 28.4c-.4-1.3-.7-2.7-.7-4.4s.3-3.1.7-4.4v-5.6H4.5C2.9 17.2 2 20.5 2 24s.9 6.8 2.5 10l7.3-5.6z"/><path fill="#EA4335" d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 29.9 2 24 2 15.5 2 8.1 6.8 4.5 14l7.3 5.6c1.7-5.2 6.5-9.2 12.2-9.2z"/></svg> Read all our Google reviews</a>\n    </div>\n  </div>\n</section>\n\n<section class="tex" id="videos" style="padding-top:0">\n  <div class="wrap">\n    <div style="text-align:center">\n      <p class="kicker reveal">Watch</p>\n      <h2 class="reveal">See how our care is different</h2>\n      <p class="section-lead reveal" style="margin:0 auto 34px">Two minutes each, straight from the clinicians who do this every day.</p>\n    </div>\n    <div class="vid-grid">\n      <article class="vid reveal">\n        <div class="frame" data-yt="W3oxBep7T5s" role="button" tabindex="0" aria-label="Play: how Home Health is different at ProHealth">\n          <img src="https://i.ytimg.com/vi/W3oxBep7T5s/hqdefault.jpg" alt="How Home Health is different at ProHealth" loading="lazy" data-yt-thumb="W3oxBep7T5s" style="object-fit:cover">\n          <div class="play"><span><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></div>\n        </div>\n        <div class="meta"><h3>Home Health at ProHealth</h3><p>How recovery at home actually works</p></div>\n      </article>\n      <article class="vid reveal d1">\n        <div class="frame" data-yt="ZMo_s33qi58" role="button" tabindex="0" aria-label="Play: how Hospice is different at ProHealth">\n          <img src="https://i.ytimg.com/vi/ZMo_s33qi58/hqdefault.jpg" alt="How Hospice is different at ProHealth" loading="lazy" data-yt-thumb="ZMo_s33qi58" style="object-fit:cover">\n          <div class="play"><span><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></div>\n        </div>\n        <div class="meta"><h3>Hospice at ProHealth</h3><p>What hospice really means, explained gently</p></div>\n      </article>\n    </div>\n  </div>\n</section>\n'
GOOGLE_SVG = '<svg class="rv-g" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.5v5.4h7.1c4.1-3.8 6.6-9.4 6.6-15.9z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.4c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.6C8.1 41.2 15.5 46 24 46z"/><path fill="#FBBC05" d="M11.8 28.4c-.4-1.3-.7-2.7-.7-4.4s.3-3.1.7-4.4v-5.6H4.5C2.9 17.2 2 20.5 2 24s.9 6.8 2.5 10l7.3-5.6z"/><path fill="#EA4335" d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 29.9 2 24 2 15.5 2 8.1 6.8 4.5 14l7.3 5.6c1.7-5.2 6.5-9.2 12.2-9.2z"/></svg>'
YT_JS = '''
document.querySelectorAll('.frame[data-yt]').forEach(f=>{
  const go=()=>{ const id=f.dataset.yt;
    f.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0" title="ProHealth video" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe>';
    f.style.cursor='default'; };
  f.addEventListener('click',go);
  f.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
});
'''

v3 = open(os.path.join(ROOT,'prohealth-homepage-v3.html'), encoding='utf-8').read()


# 0) strip em-dashes from the inherited v3 markup
def _dedash(t):
    out=[];i=0
    while True:
        j=t.find(' \u2014 ', i)
        if j<0: out.append(t[i:]); break
        before=t[max(0,j-90):j]; after=t[j+3:j+93]
        per = before.count(',')>=1 and after[:1].isupper()
        out.append(t[i:j]); out.append('. ' if per else ', ')
        i=j+3
        if not per and t[i:i+1].isupper() and not t[i:i+3].isupper():
            w=t[i:i+40].split(' ')[0]
            if w not in ('I','Medicare','Medi-Cal','California','ProHealth','Google','Home','Hospice','Palliative','Sacramento','Top','RNs','US'):
                out.append(t[i].lower()); i+=1
    return ''.join(out)
v3 = _dedash(v3)
v3 = v3.replace(' \u2014','').replace('\u2014 ','')

# 1) strip v3's chat HTML + chat JS (replaced by themed versions)
i = v3.index('<!-- Chat widget -->'); j = v3.index('<script>', i)
v3 = v3[:i] + '__CHAT_HTML__\n' + v3[j:]
i = v3.index('/* ============================================================'); j = v3.index('</script>', i)
v3 = v3[:i] + '__CHAT_JS__\n' + v3[j:]

# 2) append new design system so it overrides v3's CSS (later rules win)
v3 = v3.replace('</style>', '\n/* ===== v4 design system override ===== */\n' + CSS + '\n</style>', 1)

# 3) head: favicon, fonts, canonical, OG, business schema
v3 = v3.replace('<link rel="canonical" href="https://prohealth.us/">',
 f'''<link rel="canonical" href="https://prohealth.us/">
{FAVICON_TAGS}
<meta property="og:title" content="ProHealth Home Care, Inc.. Professional Care, Right at Home">
<meta property="og:description" content="Award-winning home health, hospice, palliative and home care across 20 California counties. Medicare-certified, locally owned.">
<meta property="og:type" content="website"><meta property="og:url" content="https://prohealth.us/">
<meta property="og:image" content="https://prohealth.us/assets/og-card.png"><meta name="twitter:card" content="summary_large_image">''', 1)
v3 = v3.replace('family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Inter',
                'family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Outfit:wght@400;500;600;700&family=Inter', 1)
v3 = re.sub(r'<title>.*?</title>',
 '<title>ProHealth Home Care | Home Health & Hospice, CA</title>', v3, count=1)
v3 = re.sub(r'<meta name="description" content="[^"]*"',
 '<meta name="description" content="Award-winning home health, hospice, palliative and home care across 20 California counties from six offices. Medicare-certified, locally owned. Call 877.667.8770."', v3, count=1)

# richer homepage schema

# Approximate geo-coordinates per office, for LocalBusiness schema. These sharpen
# the "near me" signal Google uses for the local pack. Verify against the real
# suite addresses if you want them pin-accurate.
OFFICE_GEO = {
  'Sacramento':   (38.5980, -121.4400),
  'Walnut Creek': (37.9200, -122.0300),
  'San Jose':     (37.4030, -121.9420),
  'Stockton':     (37.9760, -121.3100),
  'Monterey':     (36.6000, -121.8940),
  'Fresno':       (36.8360, -119.7900),
}

SHOW_RATING = True   # <-- set False until 4.9/120 is verified against your Google Business Profile
BIZ_LD = {"@context":"https://schema.org","@graph":[
 {"@type":"MedicalBusiness","@id":"https://prohealth.us/#org","name":"ProHealth Home Care, Inc.",
  "description":"Locally owned Home Health and Hospice agency serving 20 California counties from six offices.",
  "telephone":"+1-877-667-8770","url":"https://prohealth.us","image":LOGO,"logo":LOGO,
  "address":{"@type":"PostalAddress","streetAddress":"1420 River Park Drive, Suite 200","addressLocality":"Sacramento","addressRegion":"CA","postalCode":"95815","addressCountry":"US"},
  "openingHoursSpecification":{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"08:30","closes":"17:00"},
  "areaServed":[{"@type":"AdministrativeArea","name":c+" County, CA"} for c in COUNTIES],
  "medicalSpecialty":["HomeHealth","Hospice","PalliativeCare"],
  "geo":{"@type":"GeoCoordinates","latitude":38.5980,"longitude":-121.4400},
  "hasMap":"https://maps.app.goo.gl/53fT9qNGvwQmFLNMA",
  "priceRange":"Medicare, Medicaid and most major insurance accepted",
  "foundingDate":"2005","slogan":"Professional care, right at home.",
  "knowsAbout":["Skilled nursing","Physical therapy","Occupational therapy","Speech therapy","Hospice care","Palliative care","Home health aide services","Medical social work"],
  "sameAs":["https://www.facebook.com/phhcinc","https://www.linkedin.com/company/prohealth-home-care-inc/","https://www.instagram.com/prohealth.home.care.inc","https://maps.app.goo.gl/53fT9qNGvwQmFLNMA"],
  # Review markup is a Google manual-action risk if the numbers are not real and
  # backed by your Business Profile. Set SHOW_RATING=False to remove it entirely.
  **({"aggregateRating":{"@type":"AggregateRating","ratingValue":"4.9","reviewCount":"120","bestRating":"5"}} if SHOW_RATING else {}),
  "department":[{"@type":"MedicalBusiness","name":f"ProHealth Home Care, {n}","telephone":"+1-877-667-8770",
    "parentOrganization":{"@id":"https://prohealth.us/#org"},
    "address":{"@type":"PostalAddress","streetAddress":a.split(', CA')[0].split(', ')[0],"addressLocality":n,"addressRegion":"CA","addressCountry":"US"},
    **({"geo":{"@type":"GeoCoordinates","latitude":OFFICE_GEO[n][0],"longitude":OFFICE_GEO[n][1]}} if n in OFFICE_GEO else {}),
    "openingHoursSpecification":{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"08:30","closes":"17:00"}} for n,a,_x,_y,_h in OFFICE_PX]},
 {"@type":"WebSite","url":"https://prohealth.us","name":"ProHealth Home Care, Inc.","publisher":{"@id":"https://prohealth.us/#org"},
  "potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://prohealth.us/faqs/?q={search_term_string}"},"query-input":"required name=search_term_string"}}]}
v3 = v3.replace('</head>', '<script type="application/ld+json">'+json.dumps(BIZ_LD)+'</script>\n</head>', 1)

# 4) header: new nav to real URLs
i = v3.index('<header>'); j = v3.index('</header>', i)+9
v3 = v3[:i] + header('') + v3[j:]

# 5) footer: white logo, legal links, hours
i = v3.index('<footer class="site">'); j = v3.index('</footer>', i)+9
v3 = v3[:i] + FOOTER + v3[j:]

# 6) callbar
i = v3.index('<!-- Mobile sticky call bar -->'); j = _match_div(v3, v3.index('<div class="callbar">', i))
v3 = v3[:i] + CALLBAR + v3[j:]

# 7) service card links -> real URLs
for old,new in [("openChat('homehealth');return false;\">Learn more","'#'\">Learn more"),]:
    pass
v3 = v3.replace('href="#" onclick="openChat(\'homehealth\');return false;">Learn more','href="/home-health-care/">Learn more')
v3 = v3.replace('href="#" onclick="openChat(\'hospice\');return false;">Learn more','href="/hospice/">Learn more')
v3 = v3.replace('href="#" onclick="openChat(\'palliative\');return false;">Learn more','href="/palliative-care/">Learn more')
v3 = v3.replace('href="#" onclick="openChat(\'homecare\');return false;">Learn more','href="/home-care/">Learn more')
v3 = v3.replace('<a class="btn btn-blue reveal d3" href="#" onclick="openChat(\'homehealth\');return false;">Check if you qualify</a>',
                '<a class="btn btn-blue reveal d3" href="/home-health-care/">Check if you qualify</a>')
v3 = v3.replace('<a class="btn btn-white" href="#" onclick="openChat(\'provider\');return false;">Start a referral</a>',
                '<a class="btn btn-white" href="/refer-a-patient/">Start a referral</a>')
v3 = v3.replace('<a class="btn btn-blue reveal d3" href="#">Apply now</a>','<a class="btn btn-blue reveal d3" href="/careers/">Apply now</a>')
v3 = v3.replace('<a class="logo" href="#" aria-label','<a class="logo" href="/" aria-label')

# 8) statewide copy fixes
v3 = v3.replace('Serving Sacramento &amp; surrounding communities','Six offices · 20 California counties')
v3 = v3.replace('ProHealth is a locally owned, Medicare-certified home health and hospice agency delivering clinical excellence and compassion, one patient, one family, one home at a time.',
 'Locally owned, Medicare-certified, and doing this for over 20 years. Six offices and clinical teams across 20 California counties, with clinical excellence and compassion, one patient, one family, one home at a time.')
v3 = v3.replace('<b data-count="12">0</b><span>Years serving Sacramento</span>','<b data-count="21">0</b><span>Years caring for California</span>')
v3 = v3.replace('<b data-count="4000" data-suffix="+">0</b><span>Patients cared for at home</span>','<b data-count="20">0</b><span>Counties served</span>')
v3 = v3.replace('Trusted by Sacramento families','Trusted by California families')
v3 = v3.replace('Wherever you are in the journey, recovering, managing a serious illness, or focusing on comfort, the right care meets you at home.',
 'Wherever you are in the journey, recovering, managing a serious illness, or focusing on comfort, the right care meets you at home, in any of our 20 counties.')

# 8b) hero washed-out stock layer
v3 = v3.replace('<div class="hero">\n  <div class="wrap">',
  '<div class="hero">\n  <div class="hero-bg" aria-hidden="true"><img src="/assets/photos/homehealth-tea.jpg" alt="" loading="eager" onerror="this.remove()"></div>\n  <div class="wrap">', 1)



# 8c) care finder: primary entry point, made prominent
_s = v3.index('<div class="care-finder">')
_e = _match_div(v3, _s)
_cf = ('<div class="care-finder">'
  '<div class="cf-head"><span class="cf-badge">' + ICONS['clock'] + 'Under a minute</span></div>'
  '<p>Not sure which care you need? Start here.</p>'
  '<div class="chips">'
  '<button class="chip" onclick="openChat(\'self\')"><span class="ci">' + ICONS['heart'] + '</span><span>I need care<br>for myself</span></button>'
  '<button class="chip" onclick="openChat(\'family\')"><span class="ci">' + ICONS['users'] + '</span><span>I am caring for<br>a loved one</span></button>'
  '<button class="chip" onclick="openChat(\'provider\')"><span class="ci">' + ICONS['send'] + '</span><span>I am referring<br>a patient</span></button>'
  '</div>'
  '<p class="cf-foot">' + ICONS['shield'] + 'Free, no obligation, and no one calls unless you ask.</p>'
  '</div>')
v3 = v3[:_s] + _cf + v3[_e:]

# 8d) washed-out image behind content sections (never a standalone band)
v3 = v3.replace('<section id="services" class="tex">',
  '<section id="services" class="has-bg"><div class="sec-bg" aria-hidden="true"><img src="/assets/photos/homehealth-vitals.jpg" alt="" loading="lazy" onerror="this.remove()"></div>', 1)
v3 = v3.replace('<section class="video-sec">',
  '<section class="video-sec has-bg on-warm"><div class="sec-bg" aria-hidden="true"><img src="/assets/photos/homecare-seated.jpg" alt="" loading="lazy" onerror="this.remove()"></div>', 1)


# 8e) real photography from the client
v3 = v3.replace('/assets/photos/homehealth-tea-sq.jpg','/assets/team-careers.jpg')
v3 = v3.replace('/assets/photos/homehealth-tea-sq.jpg','/assets/team-careers.jpg')
v3 = v3.replace('alt="A warm, smiling ProHealth caregiver"','alt="The ProHealth Home Care team outside the Sacramento office"')
v3 = v3.replace('alt="A ProHealth clinician ready to make a difference"','alt="The ProHealth Home Care team"')


# 8f) the testimonial carousel markup was replaced by the reviews section, so its
# JS now references #track / #dots which no longer exist. Left in place it throws
# and takes every later script with it (drawer, status, map, video, chatbot).
_c0 = v3.index('/* ---------- testimonial carousel ---------- */')
_c1 = v3.index('__CHAT_JS__')
v3 = v3[:_c0] + v3[_c1:]


# 8g) keep the ProHealth sign on the building clear of the floating cards
v3 = v3.replace('.fc-award{left:-4%;top:8%;animation:floaty 6s ease-in-out infinite}',
                '.fc-award{left:-6%;top:46%;animation:floaty 6s ease-in-out infinite}')
v3 = v3.replace('.fc-response{left:-8%;bottom:20%;animation:floaty2 7s ease-in-out infinite}',
                '.fc-response{left:-8%;bottom:14%;animation:floaty2 7s ease-in-out infinite}')
v3 = v3.replace('.fc-award{left:-6px;top:-14px}', '.fc-award{left:-6px;top:auto;bottom:38%}')
# landscape frames get the landscape shot: full height keeps the sign, sides crop harmlessly
# the careers block frame is landscape (4/3.4): use the landscape shot so the
# building sign survives the crop. The hero collage stays portrait.
# careers block frame is landscape: use the landscape team shot so the sign survives
import re as _re
v3 = _re.sub(r'(<div class="ph"><img src=")/assets/team-careers\.jpg(" alt="[^"]*" loading="lazy")',
             r'\1/assets/team-building.jpg\2', v3, count=1)



# 8h) USP: fully tech enabled, end to end
_TECH = ('<section class="disciplines has-bg on-g50"><div class="sec-bg" aria-hidden="true">'
 '<img src="/assets/photos/homecare-seated.jpg" alt="" loading="lazy" onerror="this.remove()"></div><div class="wrap">'
 '<div style="text-align:center"><p class="kicker reveal">Fully tech enabled</p>'
 '<h2 class="reveal">Old-fashioned care. Cutting-edge everything else.</h2>'
 '<p class="section-lead reveal" style="margin:0 auto 42px">Two decades in home health teaches you exactly where it quietly goes wrong: '
 'a missed reassessment, a certification that lapsed, a note written from memory at 9pm. We now run AI-assisted automation across the whole '
 'pathway, from referral to final visit note, so those failures are caught by a system rather than discovered by a family. Clinicians still make '
 'every clinical decision. The technology exists to make sure nothing ever reaches them late.</p></div>'
 '<div class="grid3">'
 '<article class="d-card reveal"><span class="ic">' + ICONS['send'] + '</span><h3>Referrals that never wait</h3><p>Intake is triaged automatically the moment a referral lands, so nothing sits in a queue overnight waiting for someone to notice it.</p></article>'
 '<article class="d-card reveal d1"><span class="ic">' + ICONS['shield'] + '</span><h3>Care gaps flagged before they happen</h3><p>Every plan of care is watched against its schedule and orders. If a visit or reassessment drifts toward late, the team is alerted while there is still time to act.</p></article>'
 '<article class="d-card reveal d2"><span class="ic">' + ICONS['pulse'] + '</span><h3>Documentation at the point of care</h3><p>Clinicians chart in the home, on the visit, validated against Medicare requirements as they write. Errors surface in the room, not in an audit six weeks later.</p></article>'
 '<article class="d-card reveal"><span class="ic">' + ICONS['clock'] + '</span><h3>Scheduling that reorganises itself</h3><p>Visits are matched to clinician, geography and acuity automatically, and a cancellation is rebalanced across the region in minutes.</p></article>'
 '<article class="d-card reveal d1"><span class="ic">' + ICONS['doc'] + '</span><h3>Compliance checked continuously</h3><p>Eligibility, authorisations and certification windows are monitored in the background, every day, across all six offices.</p></article>'
 '<article class="d-card reveal d2"><span class="ic">' + ICONS['users'] + '</span><h3>Everyone on the same live record</h3><p>Nurse, therapist, coordinator, physician and family work from one current picture. One call reaches someone who can already see everything.</p></article>'
 '</div><p style="text-align:center;font-size:.86rem;color:var(--slate);margin-top:28px" class="reveal">'
 'Every one of these exists for a single reason: so a clinician spends the visit looking at you, not at a clipboard.</p></div></section>')
v3 = v3.replace('<section class="video-sec has-bg on-warm">', _TECH + '\n<section class="video-sec has-bg on-warm">', 1)


# 8i0) hero collage: a caregiver with an older adult, not the group team shot.
#      Unsplash's top FREE result for "caregiver" (Dulcey Lima). The nurse-in-scrubs
#      shots Unsplash ranks highest are all Unsplash+ (paid), so this is the closest
#      free match. Replace with real ProHealth photography when consent allows.
_m = re.search(r'<div class="main">\s*<img [^>]*>', v3)
if _m:
    v3 = v3.replace(_m.group(0),
      '<div class="main">\n          <img src="/assets/photos/team-greeting.jpg"'
      ' alt="A ProHealth caregiver with an older adult at home" loading="eager" onerror="this.remove()">')
else:
    raise SystemExit('hero collage image not found')


# 8i0) HERO: the four services, up front, before any scroll. A single stock
#      photo said nothing; four tiles say exactly what ProHealth does and take
#      you straight there. Reviews float around them and rotate.
_SVC = [
 ('/home-health-care/','Home Health','Skilled nursing and therapy at home','Medicare covered',
  '/assets/photos/homehealth-tea-sq.jpg'),
 ('/hospice/','Hospice Care','Comfort, dignity and 24/7 support','Medicare covered',
  '/assets/photos/hospice-portrait-sq.jpg'),
 ('/palliative-care/','Palliative Care','Relief alongside your treatment','Any stage',
  '/assets/photos/palliative-bed-sq.jpg'),
 ('/home-care/','Home Care','Caregivers and companionship','No referral needed',
  '/assets/photos/homecare-walk-sq.jpg'),
]
_ARROW = ('<span class="hsgo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" '
          'stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span>')
_tiles = ''.join(
  f'<a class="hs" href="{u}"><img src="{img}" alt="{t}" loading="eager" onerror="this.remove()">'
  f'<span class="hs-tag">{tag}</span>{_ARROW}'
  f'<span class="hsx"><b>{t}</b><small>{d}</small></span></a>'
  for u,t,d,tag,img in _SVC)

_r0 = HERO_REVIEWS[0]
_STAR = ('<span class="aw-star"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
         '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>'
         '</svg></span>')
_r0 = HERO_REVIEWS[0]
_collage_start = v3.index('<div class="collage">')
_collage_end = _match_div(v3, _collage_start)
v3 = v3[:_collage_start] + (
  '<div class="collage">'
  # one large review leads the hero, rotating every 5.5s
  '<div class="hero-revs"><div class="hr-card">'
    '<div class="rvh">' + G_MARK +
      '<span class="stars" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span>'
      '<span class="rvn">4.9 on Google</span></div>'
    f'<q>{_r0[0]}</q>'
    '<div class="hr-foot">'
      f'<span class="rvw">{_r0[1]} &middot; {_r0[2]} &middot; Google</span>'
      '<span class="hr-dots"></span>'
    '</div>'
  '</div></div>'
  f'<div class="hero-svc">{_tiles}</div>'
  # award: one slim gold line
  '<div class="hp-award">' + _STAR +
    '<b>Top 5 &middot; 2026 BusinessRate Award</b>'
    '<span class="aw-sep"></span>'
    '<small>Ranked on real Google reviews</small>'
  '</div>'
  '</div>'
) + v3[_collage_end:]

# v3's floating cards all sat on top of the tiles: retire them
v3 = v3.replace('.collage .main{', '.collage .main{display:none;')
v3 = v3.replace('.collage{position:relative;min-height:520px}', '.collage{position:relative;min-height:0}')
for _c in ['fc-award','fc-response','fc-review']:
    v3 = v3.replace('.' + _c + '{', '.' + _c + '{display:none;')

# 8i) every stock photo -> a verified elderly one (the v3 markup carries its own)
for _a,_b in {
  'photo-1576091160399-112ba8d25d1d':'photo-1508963493744-76fce69379c0',
  'photo-1544027993-37dbfe43562a':'photo-1584515933487-779824d29309',
  'photo-1584515933487-779824d29309_X':'x',
  'photo-1600880292203-757bb62b4baf':'photo-1559234938-b60fff04894d',
  'photo-1519494026892-80bbd2d6fd0d':'photo-1559234938-b60fff04894d',
  'photo-1559839734-2b71ea197ec2':'photo-1508963493744-76fce69379c0',
  'photo-1582750433449-648ed127bb54':'photo-1508963493744-76fce69379c0',
  'photo-1631217868264-e5b90bb7e133':'photo-1508963493744-76fce69379c0',
}.items():
    if _a.endswith('_X'): continue
    v3 = v3.replace(_a, _b)
# palliative card must not duplicate hospice
v3 = v3.replace('<img src="/assets/photos/hospice-portrait-sq.jpg" alt="Clinician providing palliative care guidance"',
                '<img src="/assets/photos/palliative-bed-sq.jpg" alt="An older adult in a wheelchair with their carer at home"')
v3 = v3.replace('alt="Skilled nurse reviewing a patient\'s home health plan"','alt="An older adult at home with their ProHealth clinician"')
v3 = v3.replace('alt="Holding hands with a hospice patient"','alt="Holding the hand of an elderly hospice patient"')
v3 = v3.replace('alt="Caregiver sharing a warm conversation at home"','alt="An older couple walking together outdoors"')
v3 = v3.replace('alt="Clinician providing palliative care guidance"','alt="An older adult in a wheelchair with their carer"')


# 8j) The inherited v3 section embedded a RAW YouTube iframe, so every homepage
#     visit downloaded the YouTube player (~1MB, third-party cookies before any
#     consent) whether or not anyone pressed play. It also duplicated the very
#     same video that the facade showcase below already offers. Replace it with
#     a still image; the showcase keeps the (click-to-load) videos.
import re as _re2
_vf = _re2.search(r'<div class="video-frame reveal">\s*<iframe[^>]*></iframe>\s*</div>', v3)
if _vf:
    v3 = v3.replace(_vf.group(0),
      '<div class="hero-photo reveal"><div class="ph" style="aspect-ratio:16/9">'
      '<img src="/assets/photos/homehealth-tea-sq.jpg" '
      'alt="An older adult recovering at home with their ProHealth clinician" loading="lazy" onerror="this.remove()">'
      '</div></div>')
else:
    raise SystemExit('v3 video iframe not found: check before assuming it is gone')

# 9) textures on sections
v3 = v3.replace('<section id="services">','<section id="services" class="tex">',1)
v3 = v3.replace('<div class="wrap">\n    <p class="kicker reveal">Care. We provide.</p>',
                f'<div class="wrap">\n    {wm("r")}\n    <p class="kicker reveal">Care. We provide.</p>',1)

# 9b) replace testimonial carousel with Google reviews + video showcase
_i = v3.index('<section id="stories" class="alt">'); _j = v3.index('<section id="careers"', _i)
v3 = v3[:_i] + REVIEWS_SEC.replace('__GMB__', GMB).replace('{GOOGLE_SVG_SM}', GOOGLE_SVG_SM) + '\n' + v3[_j:]

# 10) NEW offices teaser section before careers
teaser = f'''
<section class="tex" id="offices">
  <div class="wrap">
    <div class="offices">
      <div>
        <p class="kicker reveal">Offices &amp; coverage</p>
        <h2 class="reveal">Local teams, six offices, twenty counties</h2>
        <p class="section-lead reveal" style="margin-bottom:24px">From Monterey to Yuba, ProHealth clinicians are genuinely local, because good care shouldn't depend on your zip code.</p>
        {office_list()}
        <a class="btn btn-outline reveal" style="margin-top:18px" href="/locations/">See all counties &amp; directions →</a>
      </div>
      <div class="reveal d1">{ca_map_svg()}</div>
    </div>
  </div>
</section>
'''
v3 = v3.replace('<section id="careers">', teaser + '\n<section id="careers" class="dots">', 1)

# 12) inject themed chat + hours-aware JS + map JS
v3 = v3.replace('__CHAT_HTML__', CHAT_HTML)
import json as _j
v3 = v3.replace('__CHAT_JS__', API_JS + '\n' + STAFF_JS + '\n'
  + REVIEW_JS.replace('__HERO_REVIEWS__', _j.dumps(HERO_REVIEWS)) + '\n' + MEGA_JS + '\n' + DRAWER_JS + '\n' + PRINT_JS + '\n' + STATUS_JS + '\n' + MAP_JS + '\n' + YT_JS + '\n' + YT_THUMB_JS + '\n' + CHAT_JS)


# --- final sweep: localise any unsplash URL still in the inherited v3 markup ---
import re as _relz
_IDMAP = {
  '1508963493744': '/assets/photos/homehealth-tea.jpg',
  '1584515933487': '/assets/photos/hospice-portrait.jpg',
  '1543333995':    '/assets/photos/palliative-bed.jpg',
  '1559234938':    '/assets/photos/homecare-seated.jpg',
  '1589061434060': '/assets/photos/team-greeting.jpg',
}
v3 = _relz.sub(r'https://images\.unsplash\.com/photo-(\d+)[-\w]*\?[^"\')\s]*',
               lambda m: _IDMAP.get(m.group(1), m.group(0)), v3)

# --- homepage: give every body slot a DISTINCT photo (no repeats) ---
# the four "Four levels of care" rows, in document order
# Home Health row is the 2nd homehealth-tea (1st is the hero bg). Replace 2nd occurrence.
_first = v3.find('/assets/photos/homehealth-tea.jpg')
_second = v3.find('/assets/photos/homehealth-tea.jpg', _first+1)
if _second != -1:
    v3 = v3[:_second] + '/assets/photos/homehealth-vitals.jpg' + v3[_second+len('/assets/photos/homehealth-tea.jpg'):]
# Hospice + Palliative rows both start as hospice-portrait. Hospice (1st) keeps
# the warm portrait; Palliative (2nd) gets the clinical image. Replace the SECOND.
_h1 = v3.find('/assets/photos/hospice-portrait.jpg')
_h2 = v3.find('/assets/photos/hospice-portrait.jpg', _h1+1)
if _h2 != -1:
    v3 = v3[:_h2] + '/assets/photos/hospice-hands.jpg' + v3[_h2+len('/assets/photos/hospice-portrait.jpg'):]
    # correct the alt that travelled from the old portrait slot
    _altpos = v3.find('alt="', _h2)
    _altend = v3.find('"', _altpos+5)
    if _altpos != -1 and _altend-_altpos < 120:
        v3 = v3[:_altpos] + 'alt="A nurse supporting an older patient"' + v3[_altend+1:]
# Home Care row
v3 = v3.replace('/assets/photos/homecare-seated.jpg', '/assets/photos/homecare-walk.jpg', 1)

# section backgrounds: each distinct
# 1st homecare-seated bg (AI/tech section) -> team-greeting
v3 = v3.replace('/assets/photos/homecare-seated.jpg', '/assets/photos/team-greeting.jpg', 1)
# next homecare-seated bg -> review-smile
v3 = v3.replace('/assets/photos/homecare-seated.jpg', '/assets/photos/review-smile.jpg', 1)
# "Recovery happens faster" inline (homehealth-tea-sq) -> therapy-weights
v3 = v3.replace('/assets/photos/homehealth-tea-sq.jpg', '/assets/photos/therapy-weights.jpg', 1)
# careers band bg = the LAST homehealth-tea only (rindex, not replace-all)
_last = v3.rfind('/assets/photos/homehealth-tea.jpg')
if _last != -1:
    v3 = v3[:_last] + '/assets/photos/careers-team.jpg' + v3[_last+len('/assets/photos/homehealth-tea.jpg'):]

v3 = add_img_dims_and_preload(v3)
open(os.path.join(SITE,'index.html'),'w',encoding='utf-8').write(v3)
print('wrote index.html', len(v3)//1024, 'KB')
