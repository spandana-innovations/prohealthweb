# Legal review checklist — internal, not published

The public compliance pages carry no "draft" banner, per request. **They have still not been reviewed by a lawyer.** They were drafted to cover the right obligations for a California home health and hospice agency, but they are not legal advice, and I am not a lawyer.

Work this list with counsel before launch.

---

## Page by page

| Page | What counsel must confirm |
|---|---|
| `/privacy-policy/` | Retention periods match actual practice: **24 months** website enquiries, **7 years** patient records, **3 years** job applications, **14 months** analytics. Name the analytics vendor. The page states **absolutely** that ProHealth never sells personal information and never shares it for cross-context behavioral advertising — confirm that is true, because it is written without qualification. |
| `/notice-of-privacy-practices/` | Must match the NPP handed to patients on admission, with the same effective date, and be posted at all six offices. It commits to California's stricter **15-day** records response (Health & Safety Code § 123110) rather than HIPAA's 30. Confirm operations can meet that. |
| `/nondiscrimination/` | The 15 language taglines must be checked against current **DHCS threshold-language data for your 20 counties**, and each translation professionally verified. I generated these from standard Section 1557 taglines; they have not been reviewed by a translator. |
| `/accessibility/` | The conformance claim is deliberately honest ("partially conformant"), with real known limitations listed. An **independent WCAG 2.1 AA audit is strongly recommended** for this sector before launch. |
| `/terms/` | Governing law and venue (Sacramento County, California) is what counsel wants. The medical disclaimer and the chatbot disclaimer both need sign-off. |
| `/data-request/` | The form collects a penalty-of-perjury declaration and promises **10 business days** to acknowledge and **45 calendar days** to respond. Confirm someone owns that queue and can meet it. |

---

## Commitments the site makes on your behalf

These addresses are printed on live pages and **must be monitored**:

- `privacy@prohealth.us` — Privacy Officer
- `accessibility@prohealth.us` — Accessibility Coordinator
- `civilrights@prohealth.us` — Civil Rights Coordinator

Assign a **named** Privacy Officer and Civil Rights Coordinator. Several pages refer to these roles as existing.

Other promises in the copy to verify operationally:

- **Referrals answered within 2 hours** during business hours (Mon–Fri 8:30am–5:00pm PT)
- **Same-day patient contact**, first home health visit within **24–48 hours**
- **24/7 on-call clinical line** for patients
- **Free** insurance and coverage verification before care begins
- Hospice **bereavement support for 13 months** after a death
- Job applications retained **3 years**; deletion honoured on request with no effect on candidacy

---

## Company age: CONFLICTING SOURCES, confirm before launch

The site now says **21 years** and **founded 2005**, set in one place: `FOUNDED = 2005` in `build/gen2_base.py`. Change that line and every page updates.

Two sources disagree:

| Source | Says |
|---|---|
| **ZoomInfo** | Founded **2005** (would make it 21 years in 2026) |
| **prohealth.us/about-us**, your own current site | "In our **15 years** as a health care provider" |

These reconcile if the "15 years" copy was written around 2020 and never updated. That is the likeliest explanation, and why I used 2005. **But confirm it with the client**, because an inflated company age in marketing copy is exactly the sort of thing a competitor enjoys pointing out.

Verified and safe to state as-is:
- **Medicare certified 8 November 2016** (CMS, Sacramento agency)
- **4.5 star** CMS Care Compare rating

## Structured data (this one is a Google penalty risk)

The homepage `MedicalBusiness` schema claims:

- `AggregateRating` of **4.9 from 120 reviews**
- Medicare Care Compare rating of **4.5** (displayed in the reviews section)

**These must be the real current numbers.** Google cross-checks review markup against your Business Profile, and inflated ratings are a manual action, not a soft ranking penalty. Pull the true figures and update before the domain is pointed.

The four reviews shown are real, taken from your current website. If you add more, they must be real too.

---

## AI automation claims

The new "Fully tech enabled" section claims AI-assisted intake triage, automated care-gap detection, point-of-care documentation validated against Medicare requirements, self-rebalancing scheduling, and continuous compliance monitoring.

I wrote these as **operational** claims and deliberately kept them away from clinical decision-making ("Clinicians still make every clinical decision"). That distinction matters: claiming AI influences clinical judgement invites scrutiny you do not want.

**Confirm each capability actually exists** before publishing. If, say, care-gap detection is roadmap rather than reality, cut that card. Marketing a compliance capability you do not have is a genuinely bad idea in this sector.

## Footer status widget

`build/gen2_base.py` → `STATUS_JS` carries a hardcoded US federal holiday list running to **end of 2027**. On a holiday the footer reads "Closed for Thanksgiving Day" and asks people to check availability. Extend the list, or adjust it if ProHealth observes different days (the list currently includes Christmas Eve and the day after Thanksgiving, which are common but not universal).
