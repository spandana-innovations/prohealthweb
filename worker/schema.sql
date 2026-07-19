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
