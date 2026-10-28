-- ============================================================================
-- NAGARAKSHAK — Supabase PostgreSQL Database Schema
-- Run this script in your Supabase Project -> SQL Editor
-- ============================================================================

-- 1. Complaints Table (Core Entity)
CREATE TABLE IF NOT EXISTS complaints (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,
  area            TEXT NOT NULL,
  department      TEXT NOT NULL,
  priority        TEXT NOT NULL DEFAULT 'Medium',
  sla_hours       INTEGER NOT NULL DEFAULT 48,
  status          TEXT NOT NULL DEFAULT 'Submitted',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline        TIMESTAMPTZ,
  photo_url       TEXT,
  citizen_id      TEXT,
  citizen_name    TEXT,
  citizen_phone   TEXT,
  citizen_ward    TEXT,
  is_demo         INTEGER NOT NULL DEFAULT 0,
  duplicate_ids   TEXT NOT NULL DEFAULT '[]',
  analysis        TEXT,
  resolution_data TEXT,
  evidence        TEXT NOT NULL DEFAULT '[]',
  status_history  TEXT NOT NULL DEFAULT '[]',
  sla_events      TEXT NOT NULL DEFAULT '[]',
  appreciations   TEXT NOT NULL DEFAULT '[]',
  feedback        TEXT,
  ai_verification TEXT,
  assignment      TEXT
);

-- 2. Audit Logs Table (Tamper-evident operational ledger)
CREATE TABLE IF NOT EXISTS audit_logs (
  id            TEXT PRIMARY KEY,
  complaint_id  TEXT,
  type          TEXT NOT NULL,
  actor         TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_audit_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL
);

-- 3. Users Table (Citizens, Officers, Administrators)
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'CITIZEN',
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  ward          TEXT,
  department    TEXT,
  badge_number  TEXT,
  designation   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Sessions Table (Stateful session tokens with TTL)
CREATE TABLE IF NOT EXISTS sessions (
  token         TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Login Activity Table (Security audit ledger)
CREATE TABLE IF NOT EXISTS login_activity (
  id            TEXT PRIMARY KEY,
  user_id       TEXT,
  username      TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  role          TEXT,
  ip_address    TEXT,
  user_agent    TEXT,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_complaint ON audit_logs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_login_activity_timestamp ON login_activity(timestamp DESC);

-- Disable Row Level Security (RLS) so Express backend has full access
ALTER TABLE complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE login_activity DISABLE ROW LEVEL SECURITY;
