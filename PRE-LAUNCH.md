# Going live on prohealth.us

Read this before running `./golive.sh`. It replaces a working business website.

---

## The one that can actually hurt you: email

Moving nameservers to Cloudflare makes Cloudflare authoritative for **all** DNS on
`prohealth.us`, not just the website. If your mail records don't come across, **email
stops** — and it fails quietly, so you find out when someone asks why you never replied.

**Before touching anything, capture what exists today:**

```bash
dig prohealth.us MX +short
dig prohealth.us TXT +short
dig prohealth.us A +short
dig www.prohealth.us CNAME +short
dig prohealth.us NS +short
dig _dmarc.prohealth.us TXT +short
dig google._domainkey.prohealth.us TXT +short
dig selector1._domainkey.prohealth.us TXT +short
```

**Save that output somewhere outside this folder.** It is your rollback.

When you add the domain, Cloudflare scans your existing DNS and imports what it finds.
It is usually right. It is not always complete — DKIM selectors and less common records
get missed. **Compare Cloudflare's imported list against the `dig` output above,
record by record, before you change the nameservers.**

Records that must survive:

| Type | Why |
|---|---|
| **MX** | Inbound email. Miss this and mail bounces. |
| **TXT (SPF)** | `v=spf1 ...` — miss it and your outbound mail goes to spam. |
| **TXT (DKIM)** | `google._domainkey`, `selector1._domainkey`, etc. Signing breaks silently. |
| **TXT (DMARC)** | `_dmarc.prohealth.us` |
| **Any A/CNAME for mail, webmail, vpn, ftp** | Anything that isn't the website. |
| **Verification TXT** | Google, Microsoft, Facebook domain verification. |

**Test after the switch:** send an email *to* an address at prohealth.us from an outside
account, and send one *from* it. Both directions. Do it before you go home.

---

## Rolling back

Nameservers can be pointed back at the old host at any time. Propagation takes minutes
to a few hours. **Do not cancel the old WordPress hosting for at least 30 days.** It is
your only way back, and it costs one month's hosting to keep that option open.

---

## The order

1. **Cloudflare dashboard → Add a domain → `prohealth.us` → Free**
2. **Check the imported DNS against your `dig` output.** Fix anything missing. Especially MX.
3. **Change the nameservers at your registrar** to the two Cloudflare gives you.
4. Wait for Cloudflare to show **Active** (minutes to a few hours).
5. `./golive.sh --check` — read-only, confirms the zone is live and email records resolve.
6. `./golive.sh` — attaches the domain to Pages, moves the API to `api.prohealth.us`,
   reconnects the site, redeploys, and verifies.
7. **Send a test email both ways.**

---

## Before you point the domain: three things I could not verify for you

These are on live pages right now and they are your name, not mine.

**1. The review numbers are unverified.** The homepage JSON-LD claims `AggregateRating`
of **4.9 from 120 reviews**, and the reviews section shows a Care Compare rating of
**4.5**. Google cross-checks review markup against your Business Profile. Inflated
ratings are a **manual action**, not a gentle ranking nudge. Pull the real numbers and
correct them, or strip the `aggregateRating` block.

**2. Nobody has had counsel read the compliance pages.** Privacy Policy, HIPAA Notice,
Nondiscrimination, Accessibility, Terms, and the data-request flow are drafted to cover
the right obligations for a California home health and hospice agency. They are not
legal advice and I am not a lawyer. See `LEGAL-REVIEW.md` — it lists exactly what to ask.

**3. The NAP conflict is still unresolved.** Your site says **1420 River Park Drive**.
HCAI and Kaiser directories say **1375 Exposition Blvd**. SeniorCare lists that address
with a **different phone number** — (877) 246-3830 versus 877.667.8770. Google reads
these inconsistencies as a trust signal. Launching the new site amplifies whichever is
wrong. Pick the truth and fix it everywhere.

None of these block the deploy. All three are worth an hour before your traffic moves.

---

## Also worth doing on day one

- **Email for leads:** `cd worker && wrangler secret put RESEND_API_KEY`, then set the
  routing in the admin's Settings tab. Until then leads save to the database but email nobody.
- **Change the admin password:** `node hash-password.mjs "a long passphrase"` then
  `wrangler secret put ADMIN_PASS_HASH`, and delete `ADMIN_PASS` from `wrangler.toml`.
- **Search Console:** verify the domain, submit `sitemap.xml`, request indexing on
  `/home-care/` and `/locations/` (the two URLs that moved), and watch Coverage for 404s
  for 30 days.

---

## What happens to the old URLs

Six of eight resolve natively with **no redirect at all**, because every page is a real
directory: `/about-us/`, `/home-health-care/`, `/hospice/`, `/palliative-care/`,
`/careers/`, `/contact/`.

Two redirect, because they were semantically broken on the old site:

| Old | New | Why |
|---|---|---|
| `/volunteer/` | `/home-care/` | That URL held the Home Care page. It is why Home Care never ranked for "home care". |
| `/volunteer-2/` | `/volunteer/` | A WordPress collision artifact. |
| `/coverage/` | `/locations/` | Merged into one page. |

`golive.sh` tests these automatically after deploying.

**Before you switch, crawl the old site** with the free Screaming Frog tier (500 URLs is
plenty) and confirm every indexed URL is either native or in `_redirects`. There may be
old posts or landing pages that were never in the navigation.
