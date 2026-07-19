# Backend + Admin

## First time

```bash
cd worker && ./setup.sh
```

Creates the database, tables, resume storage and config store, writes the IDs into
`wrangler.toml`, deploys, and offers to connect the website. Then `cd .. && ./deploy.sh`.

## After every fresh unzip

```bash
cd worker && ./setup.sh          # NOT `wrangler deploy`
cd .. && ./deploy.sh
```

**Always `./setup.sh`, never `wrangler deploy` on a fresh unzip.** The zip ships
placeholder IDs; only `setup.sh` fills them in. `wrangler deploy` will fail with
*"KV namespace 'PASTE_ID_FROM__...' is not valid"*.

`setup.sh` caches your resource IDs in `~/.prohealth-ids`, so after the first run
a fresh unzip restores them instantly with no lookups. It is always safe to re-run.

## Signing in

| | |
|---|---|
| URL | `<your-worker-url>/admin` |
| Username | `admin` |
| Password | `admin@2026` |

Sessions last 8 hours. The cookie is HMAC-signed, HttpOnly, Secure, SameSite=Strict.
Eight failed attempts locks that IP for 15 minutes.

### Change the password

`admin@2026` sits in `wrangler.toml` in plaintext, and one shared login means the
audit log records *what* changed but never *who*. On a dashboard holding referral
data, resumes and dates of birth, that is the bit that stings in an incident.

```bash
node hash-password.mjs "a long passphrase you like"
wrangler secret put ADMIN_PASS_HASH     # paste the output
# then delete the ADMIN_PASS line from wrangler.toml
wrangler secret put SESSION_SECRET      # openssl rand -hex 32
wrangler deploy
```

The hash automatically overrides the plaintext.

## The dashboard

| Tab | |
|---|---|
| **Overview** | What needs you today, most urgent first: overdue data requests, leads waiting over 2 hours, new applicants. Live activity feed. Says "All clear" when there is nothing. |
| **Leads** | Status, autosaving notes, click-to-call, CSV export, filters by status and type. |
| **Applicants** | One-click resume view. Filters by status, role group, office, resume attached. |
| **Data requests** | 45-day CCPA countdown, overdue in red, and **Find & erase**: searches every table for that email, shows what is held, deletes permanently including R2 files. The request itself is kept as your compliance record. |
| **Openings** | Publishes to the careers page within a minute, no deploy. Seeded with demo roles on first run so the admin and the site always agree. |
| **Settings** | Which inbox gets which lead type, office hours, closure dates. |

Every admin action is written to `audit_log` with who, what and when.

## Email

Leads save to the database immediately but email nobody until:

```bash
wrangler secret put RESEND_API_KEY      # resend.com, free tier
```

Then set the routing in the dashboard's **Settings** tab. No redeploy needed.

## Tests

```bash
node worker_test.mjs        # 28 API tests
node worker/auth_test.mjs   # 18 auth tests
```

## Everyday

```bash
wrangler tail                                   # live logs
wrangler d1 execute prohealth-leads --remote --command "SELECT COUNT(*) FROM leads WHERE status='new'"
wrangler d1 execute prohealth-leads --remote --command "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 20"
```
