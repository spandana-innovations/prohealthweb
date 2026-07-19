# ProHealth SEO: how to win the segment

The honest version. Your website is now in the top tier technically — but in home
health and hospice, **the website is the floor, not where the race is won.** Below is
what actually moves rankings, ordered by impact, with the on-site work already done
marked ✓.

---

## The uncomfortable truth first

For "home health near me" / "hospice [city]" searches, roughly **70% of the outcome is
your Google Business Profile and reviews**, not your website. A perfect site with a
weak GBP loses to a mediocre site with 200 recent reviews and six well-optimised office
listings. Spend your energy accordingly.

The three levers, in order:

1. **Google Business Profile + reviews** (off-site) — the biggest lever by far
2. **Local citations + NAP consistency** (off-site) — the multiplier
3. **On-page + technical** (this website) — the foundation, now largely done ✓

---

## 1. Google Business Profile — do this first, this week

You have six offices. That's **six separate GBP listings**, each its own local-pack
entry for its city. This is your single biggest opportunity.

For **each** of the six offices:

- **Claim and verify** the listing at the exact suite address.
- **Primary category:** "Home health care service." Secondary: "Hospice," "Nursing
  agency," as applicable. Category choice is a top-3 ranking factor.
- **Service area:** list the counties that office covers — you serve territories, not
  an address, and GBP lets you say so.
- **NAP identical to the website**, character for character: `ProHealth Home Care, Inc.`
  · the suite address · `877.667.8770`. (See the NAP warning below — this is currently
  broken and it is costing you.)
- **Photos:** 10+ per listing. Real staff, real offices, exterior with signage. Google
  favours listings with recent photos. Add one a week.
- **Google Posts:** one a week per listing. An update, a service highlight, a seasonal
  reminder. Dormant profiles rank worse.
- **Q&A:** seed 8–10 real questions per listing and answer them — "Do you accept
  Medicare?", "How fast can care start?", "Which counties do you cover?". You can post
  and answer these yourself. Monitor weekly.

## 2. Reviews — the compounding asset

Review **volume, recency, and response rate** are all ranking factors, and they're what
families actually read.

- **Ask every satisfied family and discharge, every time.** A simple card or a texted
  link to the office's Google review page. This is the highest-ROI activity in the whole
  plan.
- **Aim for steady flow, not spikes.** 4–8 new reviews per office per month beats 50 in
  one week (which looks manufactured and can be filtered).
- **Respond to every review within 48 hours** — good and bad. Response rate is a signal,
  and it's visible to every family reading.
- **Spread them across all six listings**, not just Sacramento.

⚠️ **Do NOT buy or incentivise reviews.** For a Medicare-certified agency this is both a
Google violation and a compliance problem. Slow and real wins.

## 3. NAP consistency — fix the conflict that's actively hurting you

Right now your name/address/phone is **inconsistent across the web**, and Google reads
that as an untrustworthiness signal:

- Website says **1420 River Park Drive**.
- HCAI and Kaiser directories say **1375 Exposition Blvd**.
- SeniorCare lists that address with a **different phone** — (877) 246-3830 vs 877.667.8770.

**Pick the truth. Then make every one of these identical:** Google Business Profile,
website, HCAI, Medicare Care Compare, Kaiser, Yelp, Healthgrades, Caring.com,
SeniorCare, Facebook, LinkedIn, the Better Business Bureau, and every insurance
directory. Use a service like Yext or do it manually with a spreadsheet. Until this is
consistent, you are leaking authority on every search.

## 4. Local citations & directories

Get listed, with identical NAP, on:

- **Healthcare-specific:** Medicare Care Compare, Healthgrades, Caring.com, A Place for
  Mom, SeniorAdvisor, Aging.com.
- **General local:** Google, Bing Places, Apple Business Connect, Yelp, BBB, Facebook.
- **Local/community:** county senior-services directories, local hospital referral
  lists, Chambers of Commerce for each office city.

A few high-quality healthcare citations beat dozens of low-quality ones.

## 5. Backlinks — the authority lever

The hardest and slowest, but it's what separates page 1 from the 3-pack in saturated
markets:

- **Local hospitals and discharge planners** linking to your referral page.
- **Senior centres, assisted-living facilities, physician groups** you partner with.
- **Local press** — sponsor a community event, get the local paper to link you.
- **Professional associations** — California Association for Health Services at Home
  (CAHSAH), NAHC.

---

## What's already done on the website ✓

You don't need to touch these — they're built and tested:

- ✓ **Every page has a unique, keyword-aware title and meta description** within Google's
  length limits.
- ✓ **Rich structured data**: MedicalBusiness with geo-coordinates, per-office
  departments with their own geo + hours, Service, FAQPage (real Q&A on every page),
  BreadcrumbList, JobPosting, WebSite. This is what feeds Google's rich results and AI
  overviews.
- ✓ **`priceRange`, `areaServed` (all 20 counties), `knowsAbout`, `sameAs`** — the
  completeness signals Google wants for the local pack.
- ✓ **Core Web Vitals**: images sized to prevent layout shift (CLS), hero image
  preloaded for faster LCP, click-to-load videos so nothing heavy loads until asked,
  CSS inlined, fonts preconnected, images optimised (whole site's imagery is ~2MB).
- ✓ **Mobile-first** — 60%+ of your searches are a worried family member on a phone at
  night. Every page tested at phone width.
- ✓ **Directory-style URLs** matching the old site, with redirects for the two that
  moved — so you keep the ranking equity you already have.
- ✓ **Clean canonicals, XML sitemap, robots.txt.**
- ✓ **Accessibility** — a genuine ADA requirement for a healthcare provider, and a
  quality signal Google uses.

### One thing on the website to decide: the review numbers

The homepage structured data claims **AggregateRating 4.9 from 120 reviews**. If that's
real and matches your Google Business Profile, leave it — star ratings in search results
lift click-through meaningfully. If it's aspirational, **it's a manual-action risk.**
There's now a switch in `build/gen2_home.py`: set `SHOW_RATING = False` to remove the
rating markup entirely until the numbers are verified. Same goes for the "4.5 Care
Compare" figure in the reviews section.

---

## Day-one launch checklist (search-specific)

The moment `prohealth.us` goes live:

1. **Google Search Console** — verify the domain, submit `sitemap.xml`.
2. **Bing Webmaster Tools** — same. (Bing feeds ChatGPT and Copilot.)
3. **Request indexing** on `/home-care/` and `/locations/` — the two URLs that moved.
4. **Update all six Google Business Profiles** to point at the new domain.
5. **Google Analytics 4** — put the tag in so you can measure what's working.
6. Watch **Search Console → Coverage** for 404s for 30 days.

---

## What to measure

- **Local pack position** for "home health [city]" and "hospice [city]" for all six
  cities. Free tool: search in an incognito window from each city, or use a rank tracker.
- **GBP insights** — calls, direction requests, website clicks, per listing.
- **Review count and average** per listing, monthly.
- **Search Console** — impressions, clicks, average position, by query and page.
- **Referral form submissions** — the number that actually matters. Your admin dashboard
  already tracks these.

---

## The 90-day priority order

**Weeks 1–2:** Fix the NAP conflict everywhere. Claim/verify all six GBP listings.
**Weeks 3–4:** Photos and Posts on every listing. Set up the review-request habit.
**Month 2:** Citations across the healthcare directories. Start on local backlinks.
**Month 3:** Consistent Posts, steady reviews, chase hospital/discharge-planner links.

The website is done. The next move is a phone call to claim your first Google Business
Profile — that's where the segment is actually won.

---

## Update: page titles and sitelinks (from the Google snippet review)

**Titles — fixed ✓.** Your homepage title was 88 characters and Google was cutting it
to "...Right at ...". All 20 page titles are now under 60 characters, so they show in
full. Each front-loads the keyword families actually search and ends with the brand:
"Home Health Care in California | ProHealth". A build guard now fails if any title
creeps back over 60.

**Sitelinks — the honest explanation.** Those extra page links stacked under a result
(Home Health, Hospice, Careers, etc.) are **sitelinks**, and here's the thing: you can't
directly turn them on. Google generates them algorithmically, and only once it decides
your site is authoritative and its structure is clear. What you *can* do — and now have:

- ✓ **Clean, crawlable navigation** with descriptive anchor text (done — your nav and
  footer link every key page in plain words).
- ✓ **A logical URL structure** where each page is an obvious top-level directory (done).
- ✓ **Sitelinks searchbox schema** declared, so if Google chooses to show a search box in
  your result, it can (just added to the WebSite schema).
- ✓ **Unique, descriptive titles** per page (Google often pulls sitelink labels from these).

The rest is **authority and time**. Sitelinks almost always appear for a brand-name
search ("ProHealth Home Care") once the site has been indexed for a while and has earned
some trust — which loops right back to the GBP, reviews, and citations work above. New
domain migrations often take a few weeks to a couple of months to develop them. Nothing
more to build; it comes with the authority you're about to earn.
