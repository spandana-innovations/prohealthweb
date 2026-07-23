-- ProHealth D1 schema

CREATE TABLE IF NOT EXISTS leads (
  id         TEXT PRIMARY KEY,
  type       TEXT,
  service    TEXT,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email      TEXT,
  message    TEXT,
  page       TEXT,
  status     TEXT DEFAULT 'new',
  notes      TEXT,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads(status);

CREATE TABLE IF NOT EXISTS applications (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email      TEXT,
  role       TEXT,
  office     TEXT,
  license    TEXT,
  resume_key TEXT,
  status     TEXT DEFAULT 'new',
  notes      TEXT,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_apps_created ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_apps_status  ON applications(status);

CREATE TABLE IF NOT EXISTS data_requests (
  id           TEXT PRIMARY KEY,
  ref          TEXT,
  request_type TEXT,
  relationship TEXT,
  name         TEXT NOT NULL,
  dob          TEXT,
  email        TEXT NOT NULL,
  phone        TEXT,
  details      TEXT,
  is_agent     INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'new',
  notes        TEXT,
  due_by       TEXT,
  created_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_dr_due    ON data_requests(due_by);
CREATE INDEX IF NOT EXISTS idx_dr_status ON data_requests(status);

-- who did what in the admin, required for a HIPAA-adjacent system
CREATE TABLE IF NOT EXISTS audit_log (
  id         TEXT PRIMARY KEY,
  actor      TEXT,
  action     TEXT,
  target     TEXT,
  detail     TEXT,
  created_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- ============================================================
-- Attendance (NFC / QR clock-in + clock-out)
-- ============================================================

-- Office locations. Each carries two keys: nfc_key is the secret written to the
-- physical wall tag; qr_key is the (public) value printed in the QR. lat/lng +
-- radius define the geofence used as the QR failsafe.
CREATE TABLE IF NOT EXISTS att_locations (
  id         TEXT PRIMARY KEY,     -- short code, e.g. SAC
  name       TEXT NOT NULL,
  lat        REAL,
  lng        REAL,
  radius     INTEGER DEFAULT 150,  -- geofence radius in metres
  nfc_key    TEXT,
  qr_key     TEXT,
  active     INTEGER DEFAULT 1,
  created_at TEXT
);

-- Staff who clock in. Superadmins are NOT stored here (they sign in with their
-- website-admin credentials); this table is the field/office workforce.
CREATE TABLE IF NOT EXISTS att_employees (
  id              TEXT PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,   -- @prohealth.us
  name            TEXT,
  pass_hash       TEXT,                   -- '' until they set a password (unused when Google login is on)
  picture         TEXT,                   -- Google profile photo URL
  assigned_office TEXT,                   -- location id they normally work at
  shift_id        TEXT,                   -- att_shifts.id they normally work
  active          INTEGER DEFAULT 1,
  created_at      TEXT,
  created_by      TEXT
);
CREATE INDEX IF NOT EXISTS idx_att_emp_email ON att_employees(email);

-- Shift templates (start/end + weekdays). An employee's assigned shift sets the
-- daily-hours goal shown on the phone, and drives the monthly report's expected
-- days. (Per-day rota can layer on top of these later.)
CREATE TABLE IF NOT EXISTS att_shifts (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  start      TEXT,     -- 'HH:MM' local
  end        TEXT,     -- 'HH:MM' local
  days       TEXT,     -- CSV of Mon,Tue,Wed,Thu,Fri,Sat,Sun
  created_at TEXT
);

-- Every clock event. A shift is an 'in' followed by an 'out' for the same
-- employee; hours is filled on the 'out' row.
CREATE TABLE IF NOT EXISTS att_punches (
  id          TEXT PRIMARY KEY,
  employee_id TEXT,
  email       TEXT,
  loc_id      TEXT,
  loc_name    TEXT,
  kind        TEXT,     -- 'in' | 'out'
  method      TEXT,     -- 'nfc' | 'qr' | 'manual' | 'auto'
  lat         REAL,
  lng         REAL,
  accuracy    REAL,
  distance    REAL,     -- metres from the office geofence centre (QR only)
  selfie_key  TEXT,     -- R2 key (QR only)
  device_id   TEXT,
  flagged     TEXT,     -- '' or a reason: long-shift, auto-closed, manual, no-geo
  note        TEXT,
  hours       REAL,     -- filled on 'out'
  created_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_att_punch_emp     ON att_punches(employee_id, created_at);
CREATE INDEX IF NOT EXISTS idx_att_punch_created ON att_punches(created_at);
CREATE INDEX IF NOT EXISTS idx_att_punch_flagged ON att_punches(flagged);
