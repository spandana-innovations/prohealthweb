#!/usr/bin/env python3
import sys, os
ROOT = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, ROOT)
from gen2_base import *

UPDATED='July 16, 2026'
LEGAL_JS = '''
const ls=[...document.querySelectorAll('.legal-side a')], hs=[...document.querySelectorAll('.prose h2[id]')];
if(hs.length){
  const so=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){ ls.forEach(a=>a.classList.toggle('on', a.getAttribute('href')==='#'+e.target.id)); }
  }),{rootMargin:'-90px 0px -70% 0px'});
  hs.forEach(h=>so.observe(h));
}
'''

NOTE=''  # review banner intentionally not rendered on the live site (see LEGAL-REVIEW.md)

def legal(slug,title,desc,canon,h1,kicker,sections,intro='',ld=None):
    side='<aside class="legal-side"><h3>On this page</h3><ol>'+''.join(f'<li><a href="#s{i+1}">{h.split(". ",1)[-1]}</a></li>' for i,(h,_b) in enumerate(sections))+'<li><a href="#contact">Questions or complaints</a></li></ol></aside>'
    secs=''.join(f'<h2 id="s{i+1}">{h}</h2>{b}' for i,(h,b) in enumerate(sections))
    body=f'''<div class="hero"><div class="hero-bg" aria-hidden="true"><img src="/assets/photos/homecare-seated.jpg" alt="" loading="eager" onerror="this.remove()"></div><div class="wrap">{crumbs([('/','Home'),(None,h1)])}
<div class="hero-solo legal-hero"><p class="kicker">{kicker}</p><h1 style="font-size:clamp(1.9rem,3.6vw,2.6rem)">{h1}</h1>
<p class="updated">Last updated: {UPDATED} · Effective: {UPDATED}</p></div></div></div>
<section style="padding:44px 0 70px"><div class="wrap"><div class="legal-wrap">{side}<div class="prose">{NOTE}{intro}{secs}
<h2 id="contact">Questions or complaints</h2>
<p>Contact our Privacy Officer: <b>ProHealth Home Care, Inc.</b>, 1420 River Park Drive, Suite 200, Sacramento, CA 95815 · Toll free <a href="tel:+18776678770">{PHONE}</a> · privacy@prohealth.us · Mon–Fri 8:30am–5:00pm Pacific.</p>
<p>You may also submit a request or complaint using our <a href="/data-request/">Data Request form</a>. We will never retaliate against you for exercising your privacy rights.</p>
</div></div></div></section>'''
    shell(slug,title,desc,canon,body,ld,active='',extra_js=LEGAL_JS)

# ============ PRIVACY POLICY ============
legal('privacy-policy','Privacy Policy | ProHealth',
 'ProHealth Home Care\u2019s Privacy Policy: what personal information we collect through this website (including referral and job application data), how we use it, and your California privacy rights.',
 'privacy-policy/','Privacy Policy','Your privacy',
 intro='<p>This Privacy Policy explains how ProHealth Home Care, Inc. ("ProHealth", "we", "us") collects, uses, discloses and protects personal information through <b>prohealth.us</b> and related online forms, including our referral form, careers application, contact form and website chat.</p><p><b>Two different rulebooks apply to us.</b> Health information we hold about our patients as a HIPAA-covered entity is governed by our <a href="/notice-of-privacy-practices/">Notice of Privacy Practices</a>, not by this policy. Everything else, website visitors, job applicants, referring providers, and general enquiries, is governed by this Privacy Policy and by the California Consumer Privacy Act as amended by the CPRA.</p>',
 sections=[
 ("1. Who we are and how to reach us",
  f'<p>ProHealth Home Care, Inc. is a California home health, hospice, palliative care and home care agency operating from six offices and serving 20 California counties. We are the business responsible for the personal information described here.</p><ul><li><b>Mailing address:</b> 1420 River Park Drive, Suite 200, Sacramento, CA 95815</li><li><b>Toll free:</b> {PHONE} (Mon–Fri 8:30am–5:00pm Pacific)</li><li><b>Privacy Officer:</b> privacy@prohealth.us</li></ul>'),
 ("2. The categories of information we collect",
  '''<p>We collect only what we need for the purpose you contacted us about. Depending on how you use the site, that may include:</p>
<table><thead><tr><th>Category (CCPA)</th><th>Examples we actually collect</th><th>Where it comes from</th></tr></thead><tbody>
<tr><td>Identifiers</td><td>Name, phone number, email address, IP address</td><td>Chat, contact form, careers form, referral form</td></tr>
<tr><td>Customer records</td><td>Patient name, date of birth, insurance, county; referrer name and organization</td><td>Referral form (submitted by a provider or family member)</td></tr>
<tr><td>Professional or employment information</td><td>Resume contents, work history, license type and number, preferred office</td><td>Careers application form</td></tr>
<tr><td>Medical / health information</td><td>Free-text clinical notes voluntarily entered on the referral form (e.g. diagnosis, urgency); service of interest</td><td>Referral form</td></tr>
<tr><td>Internet / device activity</td><td>Pages viewed, referring URL, browser and device type, approximate region</td><td>Automatically, via privacy-friendly analytics</td></tr>
<tr><td>Inferences</td><td>Which service you appear interested in, so we route your enquiry to the right team</td><td>Derived from the above</td></tr>
</tbody></table>
<p><b>Sensitive personal information.</b> Health information and government identifiers (such as a professional license number) are "sensitive personal information" under the CPRA. We use it only to provide and improve the service you asked for, or to evaluate your job application, never to infer characteristics about you. You therefore have no need to exercise the "limit the use of my sensitive personal information" right, but you may contact us at any time regardless.</p>
<p><b>Please don't send us medical details you don't have to.</b> Our contact form and chat are not secure channels for protected health information. For anything clinical, call us.</p>'''),
 ("3. Why we collect it (and our legal bases)",
  '''<ul>
<li><b>To respond to you.</b> Callback requests, contact-form messages and chat enquiries are used to contact you about the care you asked about.</li>
<li><b>To process a patient referral.</b> Referral data is used to verify insurance, coordinate physician orders, contact the patient, and begin care. Once a person becomes our patient, that information becomes part of their medical record and is governed by HIPAA and our <a href="/notice-of-privacy-practices/">Notice of Privacy Practices</a>.</li>
<li><b>To evaluate job applications.</b> Resumes and application data are used solely for recruitment, hiring and required employment verification.</li>
<li><b>To operate and secure the site.</b> Aggregate analytics, error logs and spam prevention.</li>
<li><b>To meet legal obligations.</b> Medicare conditions of participation, California licensure requirements, employment law, and records retention.</li>
</ul>
<p>We do <b>not</b> use your information for automated decision-making or profiling that produces legal or similarly significant effects.</p>'''),
 ("4. We do not sell or share your personal information",
  '<p><b>ProHealth does not sell personal information, and does not share it for cross-context behavioral advertising</b>, as those terms are defined by the CCPA/CPRA. We have not done so in the preceding 12 months. We do not knowingly collect information from children under 16, and we would not sell it if we did.</p><p>Because we don\'t sell or share, there is no "Do Not Sell or Share My Personal Information" link on this site, there is nothing to opt out of. You may still exercise every other right described below.</p>'),
 ("5. Who we disclose information to",
  '''<p>We disclose personal information only to parties who help us deliver the service, under written contracts that restrict their use of it:</p>
<ul>
<li><b>Service providers</b>, our website host and content-delivery network, our form/lead database, our transactional email provider, and our secure file storage for resumes. Each is contractually barred from using your information for their own purposes.</li>
<li><b>Our own clinical and hiring teams</b>, on a need-to-know basis.</li>
<li><b>Physicians, hospitals and health plans</b>, where necessary to coordinate the care you asked us to arrange.</li>
<li><b>Legal and regulatory</b>, where required by law, subpoena, or to protect the safety of a patient or the public.</li>
</ul>
<p>We do not allow third-party advertising trackers on this website.</p>'''),
 ("6. How long we keep it",
  '''<table><thead><tr><th>What</th><th>How long</th><th>Why</th></tr></thead><tbody>
<tr><td>Website enquiries and callback requests that don't become patients</td><td>24 months, then deleted</td><td>Follow-up and service quality</td></tr>
<tr><td>Referral data that becomes a patient record</td><td>Per medical-records law, generally 7 years after the last date of service; longer for minors</td><td>Medicare and California licensure requirements</td></tr>
<tr><td>Job applications and resumes (not hired)</td><td>3 years from application</td><td>EEO recordkeeping and future opportunities</td></tr>
<tr><td>Analytics data</td><td>Aggregated after 14 months</td><td>Understanding what's useful on the site</td></tr>
</tbody></table>
<p>When a retention period ends, we securely delete or de-identify the data.</p>'''),
 ("7. Your California privacy rights (CCPA/CPRA)",
  '''<p>If you are a California resident, you have the right to:</p>
<ul>
<li><b>Know / access</b>, what personal information we hold about you, where it came from, why we collected it, and who we disclosed it to.</li>
<li><b>Delete</b>, ask us to delete personal information we collected from you.</li>
<li><b>Correct</b>, ask us to fix inaccurate personal information.</li>
<li><b>Portability</b>, receive a copy in a readily usable format.</li>
<li><b>Limit sensitive information use</b>, restrict use of sensitive personal information to what's necessary to provide the service.</li>
<li><b>Non-discrimination</b>, we will never deny you care, charge you differently, or treat you worse for exercising these rights.</li>
</ul>
<p><b>How to exercise them:</b> use our <a href="/data-request/">Data Request form</a>, call <a href="tel:+18776678770">'''+PHONE+'''</a>, or write to the Privacy Officer at the address above. We will verify your identity before acting, usually by confirming details you already gave us, and for sensitive requests by asking for a signed declaration. An authorized agent may act for you with written permission.</p>
<p><b>Our timeline:</b> we confirm receipt within <b>10 business days</b> and respond within <b>45 calendar days</b>, extendable once by a further 45 days if we tell you why. There is no charge unless a request is manifestly unfounded or excessive.</p>
<p><b>Important limits.</b> Some information we must keep by law, most notably patient medical records under Medicare and California licensure rules, and certain employment records. Where we can't delete something, we'll tell you exactly which exception applies and delete everything else.</p>'''),
 ("8. Other privacy laws",
  '<p><b>HIPAA.</b> Protected health information about our patients is governed by our <a href="/notice-of-privacy-practices/">Notice of Privacy Practices</a>, which grants rights that in some cases exceed those above (including the right to an accounting of disclosures and to request restrictions).</p><p><b>GDPR / UK GDPR.</b> Our services are offered only in California and this site is not directed to the EEA or UK. If you are located there and contact us anyway, we process your information on the basis of your consent or our legitimate interest in replying, and you may exercise access, rectification, erasure, restriction, portability and objection rights via the same channels.</p><p><b>California "Shine the Light" (Civil Code § 1798.83).</b> We do not disclose personal information to third parties for their own direct marketing purposes.</p>'),
 ("9. Cookies and analytics",
  '<p>This site uses only what it needs to work:</p><ul><li><b>Strictly necessary</b>, security, load balancing and form submission. These cannot be switched off.</li><li><b>Privacy-friendly analytics</b>, aggregate page-view counts with no cross-site tracking, no advertising identifiers and no sale of data. </li></ul><p>We honor <b>Global Privacy Control (GPC)</b> browser signals. We do not use advertising cookies, retargeting pixels or social media trackers.</p>'),
 ("10. How we protect information",
  '<p>All traffic to this site is encrypted with TLS. Form submissions are transmitted over encrypted connections to access-controlled storage; resumes are stored in a private bucket that is not publicly listable. Access is limited to staff who need it, protected by unique accounts and multi-factor authentication, and logged. We maintain administrative, physical and technical safeguards consistent with the HIPAA Security Rule for systems that touch protected health information.</p><p>No system is perfectly secure. If a breach affects your unencrypted personal information, we will notify you and the California Attorney General as required by Civil Code §§ 1798.29 and 1798.82, and (where PHI is involved) as required by the HIPAA Breach Notification Rule.</p>'),
 ("11. Third-party links",
  '<p>This site links to third-party sites (Google Maps, our social media profiles, Medicare.gov). Their privacy practices are their own, and we encourage you to read their policies.</p>'),
 ("12. Changes to this policy",
  '<p>We review this policy at least annually. If we make a material change we will update the "Last updated" date above and, where the change is significant, post a notice on our homepage. Continued use of the site after an update means you accept the revised policy.</p>'),
])

# ============ HIPAA NPP ============
legal('notice-of-privacy-practices','Notice of Privacy Practices | ProHealth',
 'ProHealth Home Care\u2019s HIPAA Notice of Privacy Practices: how medical information about you may be used and disclosed, and how you can get access to this information.',
 'notice-of-privacy-practices/','Notice of Privacy Practices','HIPAA',
 intro='<p style="font-size:1.05rem;color:var(--ink);background:var(--ice);border-radius:12px;padding:16px 20px"><b>THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.</b></p><p>ProHealth Home Care, Inc. is required by law to maintain the privacy of your protected health information (PHI), to give you this Notice of our legal duties and privacy practices, and to follow the terms of the Notice currently in effect. This Notice applies to all records of your care generated by ProHealth, whether created by our staff or by others involved in your care.</p>',
 sections=[
 ("1. How we may use and disclose your health information without your authorization",
  '''<h3>Treatment</h3><p>We use and share your PHI to provide, coordinate and manage your care, for example, our nurse discusses your wound care with your physician, or our therapist shares your progress with the hospital that discharged you.</p>
<h3>Payment</h3><p>We use and share your PHI to bill and receive payment, for example, submitting claims to Medicare, Medi-Cal or your insurer, verifying coverage, and obtaining prior authorization.</p>
<h3>Health care operations</h3><p>We use and share your PHI to run our agency well, quality assessment, clinician training and evaluation, licensing and accreditation surveys, care coordination, and business planning.</p>
<h3>Other permitted uses</h3><ul>
<li><b>Appointment reminders</b> and information about treatment alternatives or health-related benefits.</li>
<li><b>People involved in your care</b>, family or friends you identify, to the extent relevant to their involvement, unless you object.</li>
<li><b>Required by law</b>, including reporting to the California Department of Public Health and the Centers for Medicare &amp; Medicaid Services.</li>
<li><b>Public health activities</b>, disease reporting, adverse-event reporting, product recalls.</li>
<li><b>Abuse, neglect or domestic violence</b>, reports to authorities as California law requires (including elder and dependent adult abuse reporting under W&amp;I Code § 15630).</li>
<li><b>Health oversight, judicial and law enforcement</b>, audits, investigations, court orders, subpoenas with proper assurances.</li>
<li><b>Coroners, medical examiners and funeral directors</b>; <b>organ and tissue donation</b>.</li>
<li><b>Research</b>, only with an approved waiver from an Institutional Review Board or Privacy Board, or with your authorization.</li>
<li><b>Serious threat to health or safety</b>; <b>specialized government functions</b>; <b>workers' compensation</b>.</li>
</ul>'''),
 ("2. Uses that always require your written authorization",
  '<p>We will <b>never</b> do any of the following without your specific written authorization:</p><ul><li>Use or disclose <b>psychotherapy notes</b> (except in limited circumstances the law allows).</li><li>Use or disclose your PHI for <b>marketing</b> purposes.</li><li><b>Sell</b> your PHI. ProHealth does not sell protected health information.</li><li>Use your <b>name, image, likeness or story</b> in fundraising, advertising or on this website.</li><li>Most other uses not described in this Notice.</li></ul><p>If you give an authorization, you may revoke it in writing at any time. Revocation stops future uses but cannot undo disclosures we already made in reliance on it.</p>'),
 ("3. Your rights regarding your health information",
  '''<h3>Right to inspect and copy</h3><p>You may inspect and obtain a copy of your medical and billing records, including an electronic copy if we maintain them electronically. We will respond within <b>15 days</b> as required by California Health &amp; Safety Code § 123110 (HIPAA allows 30 days; we follow the stricter California standard). We may charge a reasonable, cost-based fee.</p>
<h3>Right to request an amendment</h3><p>If you believe information in your record is incorrect or incomplete, you may ask us to amend it. We may deny the request if we did not create the record or if we determine it is accurate and complete, and if we deny it, you may file a statement of disagreement that becomes part of your record.</p>
<h3>Right to an accounting of disclosures</h3><p>You may request a list of certain disclosures we made in the six years before your request (excluding disclosures for treatment, payment, operations, and those you authorized). The first accounting in any 12-month period is free.</p>
<h3>Right to request restrictions</h3><p>You may ask us to limit how we use or disclose your PHI. We are not required to agree, <b>except</b> that we must agree to your request to withhold information from a health plan if the disclosure is for payment or operations and you have paid for that item or service in full, out of pocket.</p>
<h3>Right to confidential communications</h3><p>You may ask us to contact you at an alternative address or by an alternative means. We will accommodate reasonable requests without asking why.</p>
<h3>Right to a paper copy of this Notice</h3><p>Even if you agreed to receive it electronically, you may request a paper copy at any time.</p>
<h3>Right to breach notification</h3><p>We will notify you if a breach compromises the privacy or security of your unsecured PHI.</p>
<p><b>To exercise any of these rights</b>, use our <a href="/data-request/">Data Request form</a>, call <a href="tel:+18776678770">'''+PHONE+'''</a>, or write to the Privacy Officer at the address above.</p>'''),
 ("4. Special California protections",
  '<p>California law gives certain information extra protection, and we honor it. Additional consent or specific authorization is generally required before we disclose information concerning <b>HIV/AIDS testing and status</b>, <b>mental health treatment</b>, <b>substance use disorder treatment</b> (including records covered by 42 CFR Part 2), <b>genetic testing</b>, and <b>reproductive and sexual health care</b>. Where California law is stricter than HIPAA, California law governs.</p>'),
 ("5. Our responsibilities",
  '<p>We are required by law to maintain the privacy and security of your PHI; to notify you promptly if a breach occurs that may have compromised it; to follow the duties and privacy practices described in this Notice and give you a copy; and not to use or share your information other than as described here unless you tell us in writing that we may.</p>'),
 ("6. Complaints",
  '''<p>If you believe your privacy rights have been violated, you may complain to us and to the federal government. <b>We will never retaliate against you for filing a complaint.</b></p>
<ul><li><b>ProHealth Privacy Officer</b>, 1420 River Park Drive, Suite 200, Sacramento, CA 95815 · <a href="tel:+18776678770">'''+PHONE+'''</a> · privacy@prohealth.us</li>
<li><b>U.S. Department of Health &amp; Human Services, Office for Civil Rights</b>, 200 Independence Avenue SW, Washington, DC 20201 · 1-877-696-6775 · <a href="https://www.hhs.gov/ocr/privacy/hipaa/complaints/" rel="noopener">hhs.gov/ocr/privacy/hipaa/complaints</a></li>
<li><b>California Department of Public Health, Licensing &amp; Certification</b>, for concerns about the care itself.</li></ul>'''),
 ("7. Changes to this Notice",
  '<p>We may change this Notice at any time, and the changed Notice will apply to information we already hold as well as information we receive in the future. The current Notice is always posted on this page with its effective date, and a copy is available at each of our six offices and on request.</p>'),
], ld={"@context":"https://schema.org","@type":"WebPage","name":"Notice of Privacy Practices","about":"HIPAA privacy practices of ProHealth Home Care, Inc."})

# ============ TERMS ============
legal('terms','Terms of Use | ProHealth',
 'Terms of Use for the ProHealth Home Care website, including the medical disclaimer, acceptable use, and terms for referral and job application submissions.',
 'terms/','Terms of Use','Website terms',
 intro='<p>These Terms govern your use of <b>prohealth.us</b>. By using this site you agree to them. If you don\'t agree, please don\'t use the site.</p>',
 sections=[
 ("1. This website is not medical advice",
  f'<p style="background:var(--ice);border-radius:12px;padding:16px 20px"><b>Nothing on this website, including the chat assistant, is medical advice, diagnosis or treatment, and using this site does not create a clinician–patient relationship.</b> Always seek the advice of your physician or another qualified health provider with any questions about a medical condition. Never disregard professional medical advice or delay seeking it because of something you read here.</p><p><b>In a medical emergency, call 911.</b> Our on-call clinical line ({PHONE}) is for existing ProHealth patients and is not an emergency service.</p>'),
 ("2. About the chat assistant",
  '<p>The chat assistant on this site provides general information about our services and captures contact details so our team can call you. It is automated, it can be wrong, and it is <b>not</b> staffed by a clinician. Do not enter protected health information, diagnoses, or urgent clinical concerns into chat. Chat transcripts and the details you submit are handled under our <a href="/privacy-policy/">Privacy Policy</a>.</p>'),
 ("3. Referral submissions",
  '<p>The referral form is intended for licensed health care providers, discharge planners, patients and their authorized representatives. By submitting it you confirm that you are authorized to share the information you provide, and that any protected health information is disclosed for treatment purposes as permitted by HIPAA. Submitting a referral does not by itself establish care, care begins only after eligibility and coverage are confirmed and a physician order is in place, and we will tell you either way.</p>'),
 ("4. Job applications",
  '<p>By submitting an application you confirm that the information and resume you provide are truthful and that you have the right to share them. Resumes must be PDF files of 2 MB or less. Submitting an application does not create an offer or an employment relationship, and ProHealth employment is at-will where applicable. Application data is handled under our <a href="/privacy-policy/">Privacy Policy</a> and retained as described there.</p>'),
 ("5. Acceptable use",
  '<p>Please don\'t: submit false, misleading or another person\'s information without authority; attempt to access accounts, systems or data you\'re not authorized to reach; probe, scan or test the vulnerability of the site; introduce malware; scrape the site by automated means; submit unlawful, harassing, defamatory or infringing content; or use the site to send spam. We may suspend access to anyone who does.</p>'),
 ("6. Intellectual property",
  '<p>The ProHealth name, logo, site design, text and images are owned by ProHealth Home Care, Inc. or licensed to us, and are protected by copyright and trademark law. You may view and print pages for your personal, non-commercial use. Any other reproduction, distribution or modification requires our written permission.</p>'),
 ("7. Third-party links and content",
  '<p>We link to third-party resources (Google Maps, Medicare.gov, our social profiles) for your convenience. We don\'t control them and aren\'t responsible for their content, accuracy or practices.</p>'),
 ("8. Accuracy and availability",
  '<p>We work hard to keep this site accurate and current, but we make no warranty that it is complete, error-free, or continuously available. Service descriptions, coverage areas and response times may change. To the fullest extent permitted by law, the site is provided "as is" without warranties of any kind.</p>'),
 ("9. Limitation of liability",
  '<p>To the fullest extent permitted by California law, ProHealth is not liable for indirect, incidental, special, consequential or punitive damages arising from your use of this website. Nothing in these Terms limits liability that cannot lawfully be limited, including liability for personal injury caused by negligence in the provision of clinical care, which is governed by law and not by these website Terms.</p>'),
 ("10. Governing law and disputes",
  '<p>These Terms are governed by the laws of the State of California without regard to conflict-of-laws rules. Any dispute relating to this website will be brought in the state or federal courts located in Sacramento County, California, and you consent to their jurisdiction.</p>'),
 ("11. Changes",
  '<p>We may update these Terms; the "Last updated" date shows when. Continued use after an update means you accept the revised Terms.</p>'),
])

# ============ ACCESSIBILITY ============
legal('accessibility','Accessibility Statement | ProHealth',
 'ProHealth Home Care\u2019s commitment to digital accessibility: our WCAG 2.1 AA conformance target, the measures we take, and how to report a barrier or request an accessible format.',
 'accessibility/','Accessibility Statement','Access for everyone',
 intro='<p>ProHealth Home Care believes health care is a right, not a privilege, and that has to include being able to use our website. Many of the people who need us most are living with vision, hearing, motor or cognitive disabilities. We build accordingly.</p>',
 sections=[
 ("1. Our conformance target",
  '<p>We aim to conform to <b>Web Content Accessibility Guidelines (WCAG) 2.1, Level AA</b>, and we design with the expectations of the Americans with Disabilities Act, Section 504 and Section 1557 of the Affordable Care Act in mind. <b>Current status: partially conformant</b>, most of the site meets the standard, and we are actively remediating known gaps listed below.</p>'),
 ("2. What we've done",
  '''<ul>
<li><b>Semantic structure</b>, real headings, landmarks, and lists so screen readers can navigate the page logically.</li>
<li><b>Keyboard access</b>, every interactive element, including the chat assistant, the office map and all forms, is reachable and operable by keyboard with a visible focus indicator.</li>
<li><b>Color contrast</b>, text and interface colors are chosen to meet or exceed the 4.5:1 (and 3:1 for large text) ratios.</li>
<li><b>Reduced motion</b>, all animation is disabled automatically when your device requests reduced motion.</li>
<li><b>Text alternatives</b>, meaningful images have descriptive alternative text; decorative images are hidden from assistive technology.</li>
<li><b>Forms</b>, every field has a persistent visible label, errors are described in text (not by color alone), and required fields are announced.</li>
<li><b>Resizing and zoom</b>, content reflows to 320px and remains usable at 200% zoom without horizontal scrolling.</li>
<li><b>Plain language</b>, we write for people making hard decisions under stress.</li>
</ul>'''),
 ("3. Known limitations",
  '<p>We tell you these honestly rather than claim perfection:</p><ul><li><b>The California office map</b> conveys location visually. Every office it shows is also listed as accessible text with a full address and directions link immediately beside it, so no information is available only in the map.</li><li><b>Embedded third-party content</b> (Google Maps, video players, social media) may not fully meet WCAG 2.1 AA; we\'re limited by the vendor. Contact us and we\'ll provide the information another way.</li><li><b>Older PDF documents</b> may not be fully tagged for screen readers. We will provide an accessible version on request, at no charge.</li></ul>'),
 ("4. Assessment and testing",
  '<p>Our approach includes automated testing during development, manual keyboard-only testing, and screen-reader testing with assistive technology. We review the site against WCAG 2.1 AA at each significant release.</p>'),
 ("5. Alternative ways to reach us",
  f'<p>If any part of this site is a barrier, you never have to use it to reach us:</p><ul><li><b>Call toll free</b>, <a href="tel:+18776678770">{PHONE}</a>, Mon–Fri 8:30am–5:00pm Pacific; on-call clinical support 24/7 for patients.</li><li><b>Relay services</b>, dial <b>711</b> for California Relay (TTY/VCO/HCO) and ask for our toll-free number.</li><li><b>Language assistance</b>, free interpreter services in your language; see our <a href="/nondiscrimination/">Nondiscrimination Notice</a>.</li><li><b>Accessible formats</b>, we provide large print, audio, or accessible electronic formats of any information on this site, free of charge, on request.</li></ul>'),
 ("6. Feedback and complaints",
  f'<p>We treat accessibility problems as bugs, not opinions. Tell us what happened, the page you were on, and the assistive technology you were using, and we will acknowledge within <b>5 business days</b> and aim to resolve within <b>30 days</b>. Contact our Accessibility Coordinator at <a href="tel:+18776678770">{PHONE}</a> or accessibility@prohealth.us, or use our <a href="/contact/">contact form</a>.</p><p>You may also file a civil rights complaint with the U.S. Department of Health &amp; Human Services, Office for Civil Rights, see our <a href="/nondiscrimination/">Nondiscrimination Notice</a> for details.</p>'),
])

# ============ NONDISCRIMINATION ============
LANGS=[("Spanish","ATENCIÓN: si habla español, tiene a su disposición servicios gratuitos de asistencia lingüística."),
 ("Chinese","注意：如果您使用繁體中文，您可以免費獲得語言援助服務。"),
 ("Vietnamese","CHÚ Ý: Nếu bạn nói Tiếng Việt, có các dịch vụ hỗ trợ ngôn ngữ miễn phí dành cho bạn."),
 ("Tagalog","PAUNAWA: Kung nagsasalita ka ng Tagalog, maaari kang gumamit ng mga serbisyo ng tulong sa wika nang walang bayad."),
 ("Korean","주의: 한국어를 사용하시는 경우, 언어 지원 서비스를 무료로 이용하실 수 있습니다."),
 ("Armenian","ՈՒՇԱԴՐՈՒԹՅՈՒՆ՝ Եթե խոսում եք հայերեն, ապա ձեզ անվճար կարող են տրամադրվել լեզվական աջակցության ծառայություններ։"),
 ("Russian","ВНИМАНИЕ: Если вы говорите на русском языке, то вам доступны бесплатные услуги перевода."),
 ("Farsi","توجه: اگر به زبان فارسی گفتگو می کنید، تسهیلات زبانی بصورت رایگان برای شما فراهم می باشد."),
 ("Japanese","注意事項：日本語を話される場合、無料の言語支援をご利用いただけます。"),
 ("Hmong","LUS CEEV: Yog tias koj hais lus Hmoob, cov kev pab txog lus, muaj kev pab dawb rau koj."),
 ("Punjabi","ਧਿਆਨ ਦਿਓ: ਜੇ ਤੁਸੀਂ ਪੰਜਾਬੀ ਬੋਲਦੇ ਹੋ, ਤਾਂ ਭਾਸ਼ਾ ਵਿੱਚ ਸਹਾਇਤਾ ਸੇਵਾ ਤੁਹਾਡੇ ਲਈ ਮੁਫਤ ਉਪਲਬਧ ਹੈ।"),
 ("Arabic","ملحوظة: إذا كنت تتحدث اذكر اللغة، فإن خدمات المساعدة اللغوية تتوافر لك بالمجان."),
 ("Hindi","ध्यान दें: यदि आप हिंदी बोलते हैं तो आपके लिए मुफ्त में भाषा सहायता सेवाएं उपलब्ध हैं।"),
 ("Thai","เรียน: ถ้าคุณพูดภาษาไทย คุณสามารถใช้บริการช่วยเหลือทางภาษาได้ฟรี"),
 ("Cambodian","ប្រយ័ត្ន៖ បើសិនជាអ្នកនិយាយ ភាសាខ្មែរ, សេវាជំនួយផ្នែកភាសា ដោយមិនគិតឈ្នួល។")]
tag=''.join(f'<tr><td><b>{n}</b></td><td>{t}</td></tr>' for n,t in LANGS)
legal('nondiscrimination','Nondiscrimination Notice & Language Assistance | ProHealth',
 'ProHealth Home Care complies with applicable federal and California civil rights laws and does not discriminate. Free language assistance and auxiliary aids are available.',
 'nondiscrimination/','Nondiscrimination Notice','Civil rights & language access',
 intro='<p>ProHealth Home Care, Inc. complies with applicable Federal civil rights laws and California law, and <b>does not discriminate</b> on the basis of race, color, national origin, ancestry, religion, age, disability, sex, gender, gender identity or expression, sexual orientation, marital status, medical condition, genetic information, citizenship, primary language, immigration status, or source of payment. We do not exclude people or treat them differently for any of these reasons.</p>',
 sections=[
 ("1. What we provide, free of charge",
  '''<p><b>To people with disabilities</b>, so they can communicate effectively with us:</p>
<ul><li>Qualified sign language interpreters</li><li>Written information in other formats, large print, audio, accessible electronic formats, other formats on request</li><li>California Relay Service, dial <b>711</b></li></ul>
<p><b>To people whose primary language is not English:</b></p>
<ul><li>Qualified interpreters, including by telephone</li><li>Information written in other languages</li></ul>
<p>These services are always <b>free</b>. You will never be asked to bring your own interpreter, and we will not ask a family member or a child to interpret for you. If you need any of them, simply call <a href="tel:+18776678770">'''+PHONE+'''</a>.</p>'''),
 ("2. Language assistance in your language",
  f'<table><thead><tr><th style="width:120px">Language</th><th>Notice</th></tr></thead><tbody>{tag}</tbody></table>'),
 ("3. How to file a grievance with us",
  f'''<p>If you believe ProHealth failed to provide these services, or discriminated in any way, you may file a grievance with our Civil Rights Coordinator. <b>We will not retaliate against you for filing.</b></p>
<ul><li><b>Civil Rights Coordinator</b>, ProHealth Home Care, Inc. 1420 River Park Drive, Suite 200, Sacramento, CA 95815</li>
<li><b>Phone</b>, <a href="tel:+18776678770">{PHONE}</a> (Relay: 711) · <b>Email</b>, civilrights@prohealth.us</li></ul>
<p>You may file in person, by mail, by phone, by fax or by email. If you need help filing, our Coordinator will help you. We will acknowledge your grievance within <b>5 business days</b> and respond in writing within <b>30 days</b>.</p>'''),
 ("4. How to file a civil rights complaint with the government",
  '''<p>You may also file a complaint with the U.S. Department of Health and Human Services, Office for Civil Rights, electronically at <a href="https://ocrportal.hhs.gov/ocr/portal/lobby.jsf" rel="noopener">ocrportal.hhs.gov</a>, or by mail or phone:</p>
<p style="background:var(--g100);border-radius:12px;padding:14px 18px">U.S. Department of Health and Human Services<br>200 Independence Avenue SW, Room 509F, HHH Building<br>Washington, DC 20201<br>1-800-368-1019 · TDD 1-800-537-7697</p>
<p>Complaint forms are available at <a href="https://www.hhs.gov/ocr/office/file/index.html" rel="noopener">hhs.gov/ocr/office/file</a>.</p>
<p>In California, you may also contact the <b>California Civil Rights Department</b> (calcivilrights.ca.gov) or the <b>California Department of Public Health, Licensing &amp; Certification Program</b> for concerns about care.</p>'''),
 ("5. Employment",
  '<p>ProHealth is an <b>equal opportunity employer</b>. We make employment decisions without regard to any protected characteristic, and we provide reasonable accommodation to applicants and employees with disabilities and for sincerely held religious beliefs. If you need an accommodation to apply for a job, including an alternative to our online application, call <a href="tel:+18776678770">'+PHONE+'</a> and we will arrange it.</p>'),
])

# ============ DATA REQUEST ============
dr_faqs=[("Who can make a request?","Any California resident whose personal information we hold, website visitors, job applicants, referring providers, patients and their authorized representatives. You may also use an authorized agent with written permission."),
 ("How do you verify it's really me?","We match the details you provide against what we already hold. For deletion of sensitive information or patient records, we ask for a signed declaration under penalty of perjury, and may ask for one additional identifier. We never ask for more information than the request requires."),
 ("How long will it take?","We confirm receipt within 10 business days and respond within 45 calendar days. If we need more time we'll tell you why and take up to 45 more days."),
 ("Is there a charge?","No. Requests are free, unless one is manifestly unfounded or excessive, in which case we'll explain before doing anything."),
 ("What if you can't delete my data?","Some records we must keep by law, patient medical records under Medicare and California licensure rules, and certain employment and financial records. We'll tell you exactly which exception applies, delete everything not covered by it, and stop using the rest for anything other than the required purpose."),
 ("Will this affect my care?","Never. Exercising a privacy right cannot and will not affect the care you receive, the price you pay, or your candidacy for a job. That's the law, and it's also just how we operate.")]
shell('data-request','Data Request | Access or Delete Your Data | ProHealth',
 'Submit a request to access, delete, correct or port the personal information ProHealth Home Care holds about you, or to exercise your HIPAA rights. Free, and we respond within 45 days.',
 'data-request/', f'''<div class="hero"><div class="hero-bg" aria-hidden="true"><img src="/assets/photos/homecare-seated.jpg" alt="" loading="eager" onerror="this.remove()"></div><div class="wrap">{crumbs([('/','Home'),(None,'Data Request')])}
<div class="hero-grid"><div><p class="kicker">Your data, your call</p><h1>Request your data, or <em>ask us to delete it.</em></h1>
<p class="lead">You can ask us what personal information we hold about you, get a copy, correct it, or have it deleted. It's free, it takes one form, and it will never affect your care or your job application.</p>
<ul class="checks" style="margin-bottom:22px">
<li>{CHECK}Confirmed within <b>10 business days</b>, answered within <b>45 calendar days</b></li>
<li>{CHECK}No charge, ever, and no retaliation for asking</li>
<li>{CHECK}Covers CCPA/CPRA rights <b>and</b> HIPAA patient rights</li>
<li>{CHECK}Prefer to talk? Call <a href="tel:+18776678770" style="color:var(--blue-dark);font-weight:600;text-decoration:none">{PHONE}</a>, Mon–Fri 8:30am–5:00pm PT</li></ul>
<div class="map-ph reveal">{ICONS['lock']}<span>Requests are transmitted over an encrypted connection and go straight to our Privacy Officer's queue, not to marketing, not to your care team.</span></div></div>
<div class="form-card reveal"><h3>Submit a request</h3><p class="form-sub">One form for every privacy right. We'll verify your identity before we act.</p>
<form id="drForm">
<label for="dr-type">What would you like us to do?</label>
<select id="dr-type" required>
<option value="">Choose a request…</option>
<option>Tell me what personal information you hold about me (Right to Know)</option>
<option>Give me a copy of my data (Access / Portability)</option>
<option>Delete my personal information (Right to Delete)</option>
<option>Correct inaccurate information (Right to Correct)</option>
<option>Limit use of my sensitive personal information</option>
<option>HIPAA: access or copy my medical record</option>
<option>HIPAA: amend my medical record</option>
<option>HIPAA: accounting of disclosures</option>
<option>HIPAA: request a restriction or confidential communications</option>
<option>Withdraw consent / delete my job application &amp; resume</option>
<option>Something else, i'll explain below</option>
</select>
<label for="dr-rel">Your relationship to ProHealth</label>
<select id="dr-rel"><option>Website visitor / made an enquiry</option><option>Job applicant</option><option>Current or former patient</option><option>Family member or authorized representative of a patient</option><option>Referring provider</option><option>Current or former employee</option><option>Other</option></select>
<div class="row2"><div><label for="dr-name">Full name</label><input id="dr-name" required placeholder="Your legal name"></div>
<div><label for="dr-dob">Date of birth <span style="font-weight:400">(patients only)</span></label><input id="dr-dob" type="date"></div></div>
<div class="row2"><div><label for="dr-email">Email</label><input id="dr-email" type="email" required placeholder="you@example.com"></div>
<div><label for="dr-phone">Phone</label><input id="dr-phone" type="tel" required placeholder="(555) 555-5555"></div></div>
<label for="dr-details">Details that help us find your information</label>
<textarea id="dr-details" rows="3" placeholder="e.g. the phone number or email you used, roughly when you contacted us, the office involved…"></textarea>
<hr class="form-hr">
<label style="display:flex;gap:9px;align-items:flex-start;font-weight:400;color:var(--slate);font-size:.82rem">
<input type="checkbox" id="dr-agent" style="width:auto;margin-top:3px"> I'm submitting this as an <b>authorized agent</b> on someone else's behalf (we'll contact you for written authorization)</label>
<label style="display:flex;gap:9px;align-items:flex-start;margin-top:10px;font-weight:400;color:var(--slate);font-size:.82rem">
<input type="checkbox" id="dr-declare" required style="width:auto;margin-top:3px"> I declare under penalty of perjury under the laws of the State of California that the information above is true and that I am the person I claim to be (or their authorized agent).</label>
<button class="btn btn-blue" type="submit" style="width:100%;margin-top:16px">Submit request to the Privacy Officer</button>
<p class="form-note">We use the details above only to verify you and answer this request, then delete them per our <a href="/privacy-policy/">Privacy Policy</a>. Prototype note: in production this posts to the admin's Data Requests queue and emails the Privacy Officer with a tracked due date.</p></form>
<div id="drOk" class="form-ok" hidden><h3>Request received ✓</h3><p>Your reference is <b id="drRef"></b>. Our Privacy Officer will confirm within 10 business days and respond within 45 calendar days. Questions? Call <a href="tel:+18776678770"><b>{PHONE}</b></a>.</p></div></div>
</div></div></div>
<section class="faq-sec"><div class="wrap"><div style="text-align:center"><p class="kicker reveal">How this works</p><h2 class="reveal">Data request questions</h2>
<p class="section-lead reveal" style="margin:0 auto 40px">Straight answers about what happens after you hit submit.</p></div>
<div class="faq reveal">{faq_html(dr_faqs)}</div></div></section>
<section class="tex" style="padding-top:0">{wm('l')}<div class="wrap prose" style="padding-top:20px">
<h2 style="margin-top:0">Related policies</h2>
<ul><li><a href="/privacy-policy/">Privacy Policy</a>, what we collect through this website and why</li>
<li><a href="/notice-of-privacy-practices/">Notice of Privacy Practices</a>, your HIPAA rights as a patient</li>
<li><a href="/nondiscrimination/">Nondiscrimination Notice</a>, civil rights and free language assistance</li>
<li><a href="/accessibility/">Accessibility Statement</a>, and how to request an accessible format of any of this</li></ul>
</div></section>''',
 {"@context":"https://schema.org","@graph":[faq_ld(dr_faqs)]}, active='',
 extra_js='''document.getElementById('drForm').addEventListener('submit',async function(e){e.preventDefault();
const g=id=>document.getElementById(id).value;
const _b=this.querySelector('[type=submit]'); if(_b) _b.disabled=true;
try{
  const _r=await postJSON('/data-requests',{request_type:g('dr-type'),relationship:g('dr-rel'),name:g('dr-name'),dob:g('dr-dob'),email:g('dr-email'),phone:g('dr-phone'),details:g('dr-details'),is_agent:document.getElementById('dr-agent').checked});
  document.getElementById('drRef').textContent=(_r&&_r.ref)?_r.ref:('DR-'+Date.now().toString(36).toUpperCase());
  this.hidden=true;document.getElementById('drOk').hidden=false;
}catch(err){ if(_b) _b.disabled=false; alert(err.message||'Could not send. Please call 877.667.8770.'); }
});''')
print('legal pages done')
