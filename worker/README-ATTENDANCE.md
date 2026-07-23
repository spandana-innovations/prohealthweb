# Attendance backend (`/attend/*`)

NFC / QR clock-in for ProHealth staff, bolted onto this Worker. The phone app
lives in the separate `prohealthattendance` repo; this is its API + data.

## What was added

- `src/attendance.js` — all attendance logic (auth, punch, admin, cron).
- `src/index.js` — routes `/attend/*` to it, adds a `scheduled()` cron handler,
  allowlists the attendance app origins for CORS, and allows the `Authorization`
  header + `DELETE`.
- `schema.sql` — three new tables: `att_locations`, `att_employees`, `att_punches`.
- `wrangler.toml` — a nightly `[triggers] crons` entry (`10 12 * * *`, ~04:10 PT).
- Attendance **selfies** reuse the existing `RESUMES` R2 bucket under the
  `att/selfies/` prefix — no new bucket to provision.

`./setup.sh` picks all of this up automatically (it re-runs `schema.sql` and
`wrangler deploy`). No new secrets are required.

## Auth model

- The app authenticates with a **Bearer token** (`POST /attend/login` returns it;
  the app sends `Authorization: Bearer <token>`). Tokens are HMAC-signed with the
  same `SESSION_SECRET` as the dashboard but carry `aud:"att"`, so an attendance
  token can never be used as an `/admin` session (and vice-versa).
- **Employees** live in `att_employees` (email + PBKDF2 hash). They are *not* in
  the admin roster, so they never get dashboard access.
- **Superadmins** sign in with their existing `@prohealth.us` dashboard email +
  password (verified against the KV admin roster). They get the management API.

## Endpoints

```
POST /attend/login        {email,password} -> {token, role, name, assignedOffice, open, offices}
GET  /attend/me           -> identity + current open shift
POST /attend/punch        nfc: JSON {loc,k,method:'nfc',deviceId}
                          qr:  multipart {loc,k,method:'qr',deviceId,selfie,[lat,lng,accuracy]}
GET  /attend/setpw?token= | POST /attend/setpw   (employee set-password)

POST /attend/google       {idToken}  -> verify Google ID token, sign in

# superadmin (role must be "super")
GET/POST            /attend/admin/locations           list / upsert
DELETE POST         /attend/admin/locations/:id[/rotate]
GET/POST            /attend/admin/employees           list / add (mode: invite|manual|magic)
DELETE POST         /attend/admin/employees/:email[/reset]
POST /attend/admin/employees/:email/assign  {assignedOffice?, shiftId?}
GET/POST DELETE     /attend/admin/shifts[/:id]        shift templates
GET/PUT             /attend/admin/holidays            {text} — separate from the site's
GET  /attend/admin/report?month=YYYY-MM   monthly per-employee summary + totals
GET  /attend/admin/overview     who's on the clock + flag count
GET  /attend/admin/punches      punch list (filters: from,to,emp,loc)
GET  /attend/admin/selfie?key=  serve a clock-in photo
POST /attend/admin/punch        manual add / correction (the override)
```

Google directory **import** is client-side (the admin consents to
`admin.directory.user.readonly` in-app); the browser calls the Admin SDK directly and
bulk-adds via `POST /attend/admin/employees` with `mode:"invite"`.

New config: `GOOGLE_CLIENT_ID` (wrangler var). New tables: `att_shifts`, plus
`att_employees.shift_id`/`picture`. Attendance holidays live in KV `att_holidays`.

## Punch responses the app handles

- `200` — success `{kind:'in'|'out', locName, hours?, hoursText?, flagged?, message}`
- `422 {need:'selfie'}` — QR with no photo
- `422 {need:'gps'}` — QR looked fishy; app asks for location and retries
- `403 {error:'geofence', distance, radius, message}` — off-site when GPS was required
- `400` — unknown/inactive office, or a tag key that doesn’t match

## Tests

`node attendance_test.mjs` (also runs under `npm test`). Covers the geofence math,
the timezone/fishy logic, tag-key validation, the NFC-instant vs QR-selfie-vs-GPS
paths, hours at clock-out, and the nightly auto-close.
