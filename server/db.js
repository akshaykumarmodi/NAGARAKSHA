/**
 * NAGARAKSHA — Dual-Engine Database Adapter
 * Seamlessly supports Supabase PostgreSQL (via pg.Pool) and local SQLite (via better-sqlite3).
 * Zero credentials in frontend code; purely server-side environment variables.
 */

import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'nagaraksha.db');

const { Pool } = pg;

let sqliteDb = null;
let pgPool = null;

export function isUsingPostgres() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0 && !process.env.DATABASE_URL.includes('[YOUR_PASSWORD]'));
  const hasPgPass = Boolean(process.env.PGPASSWORD && process.env.PGPASSWORD.trim().length > 0 && !process.env.PGPASSWORD.includes('[YOUR_PASSWORD]'));
  return hasDbUrl || hasPgPass;
}

export function getPgPool() {
  if (!pgPool && isUsingPostgres()) {
    const poolConfig = process.env.PGPASSWORD
      ? {
          host: process.env.PGHOST || 'aws-0-ap-northeast-2.pooler.supabase.com',
          port: parseInt(process.env.PGPORT || '6543', 10),
          user: process.env.PGUSER || 'postgres.uoqbvsntktftalqglkqo',
          password: String(process.env.PGPASSWORD),
          database: process.env.PGDATABASE || 'postgres',
          ssl: { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        }
      : {
          connectionString: process.env.DATABASE_URL.trim(),
          ssl: { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        };

    pgPool = new Pool(poolConfig);
    pgPool.on('error', (err) => {
      console.error('[Supabase PostgreSQL Pool Error]', err.message);
    });
  }
  return pgPool;
}

export function getSqliteDb() {
  if (!sqliteDb) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    sqliteDb = new Database(DB_PATH);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');
    initSqliteSchema(sqliteDb);
  }
  return sqliteDb;
}

function initSqliteSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      description   TEXT NOT NULL,
      category      TEXT NOT NULL,
      area          TEXT NOT NULL,
      department    TEXT NOT NULL,
      priority      TEXT NOT NULL DEFAULT 'Medium',
      sla_hours     INTEGER NOT NULL DEFAULT 48,
      status        TEXT NOT NULL DEFAULT 'Submitted',
      created_at    TEXT NOT NULL,
      deadline      TEXT,
      photo_url     TEXT,
      citizen_id    TEXT,
      citizen_name  TEXT,
      citizen_phone TEXT,
      citizen_ward  TEXT,
      is_demo       INTEGER NOT NULL DEFAULT 0,
      duplicate_ids TEXT NOT NULL DEFAULT '[]',
      analysis      TEXT,
      resolution_data TEXT,
      evidence      TEXT NOT NULL DEFAULT '[]',
      status_history TEXT NOT NULL DEFAULT '[]',
      sla_events    TEXT NOT NULL DEFAULT '[]',
      appreciations TEXT NOT NULL DEFAULT '[]',
      feedback      TEXT,
      ai_verification TEXT,
      assignment    TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id            TEXT PRIMARY KEY,
      complaint_id  TEXT,
      type          TEXT NOT NULL,
      actor         TEXT NOT NULL,
      title         TEXT NOT NULL,
      description   TEXT NOT NULL DEFAULT '',
      timestamp     TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL
    );

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
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token         TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      created_at    TEXT NOT NULL,
      expires_at    TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS login_activity (
      id            TEXT PRIMARY KEY,
      user_id       TEXT,
      username      TEXT NOT NULL,
      event_type    TEXT NOT NULL,
      role          TEXT,
      ip_address    TEXT,
      user_agent    TEXT,
      timestamp     TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
    CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_complaint ON audit_logs(complaint_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_login_activity_timestamp ON login_activity(timestamp DESC);
  `);
}

/**
 * Automatically converts '?' positional placeholders to '$1, $2...' for PostgreSQL
 */
export function convertPlaceholders(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

/**
 * Universal async query returning an array of row objects
 */
export async function query(sql, params = []) {
  const flatParams = Array.isArray(params) ? params : [params];
  if (isUsingPostgres()) {
    const pool = getPgPool();
    const pgSql = convertPlaceholders(sql);
    const res = await pool.query(pgSql, flatParams);
    return res.rows;
  } else {
    const db = getSqliteDb();
    return db.prepare(sql).all(...flatParams);
  }
}

/**
 * Universal async query returning a single row object or null
 */
export async function queryOne(sql, params = []) {
  const flatParams = Array.isArray(params) ? params : [params];
  if (isUsingPostgres()) {
    const pool = getPgPool();
    const pgSql = convertPlaceholders(sql);
    const res = await pool.query(pgSql, flatParams);
    return res.rows[0] || null;
  } else {
    const db = getSqliteDb();
    return db.prepare(sql).get(...flatParams) || null;
  }
}

/**
 * Universal async execution for INSERT, UPDATE, DELETE
 */
export async function execute(sql, params = []) {
  const flatParams = Array.isArray(params) ? params : [params];
  if (isUsingPostgres()) {
    const pool = getPgPool();
    const pgSql = convertPlaceholders(sql);
    const res = await pool.query(pgSql, flatParams);
    return { changes: res.rowCount, rowCount: res.rowCount };
  } else {
    const db = getSqliteDb();
    const res = db.prepare(sql).run(...flatParams);
    return { changes: res.changes, rowCount: res.changes };
  }
}

/**
 * Adapter providing .prepare(sql) with async .all(), .get(), and .run()
 */
export function getDb() {
  return {
    prepare(sql) {
      return {
        all: async (...params) => {
          const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return query(sql, p);
        },
        get: async (...params) => {
          const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return queryOne(sql, p);
        },
        run: async (...params) => {
          const p = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return execute(sql, p);
        },
      };
    },
    query,
    queryOne,
    execute,
    isPostgres: isUsingPostgres,
  };
}

// ── Password Hashing Helpers ─────────────────────────────────────────────────

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    if (!stored || !stored.includes(':')) return false;
    const [salt, key] = stored.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    return false;
  }
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

export function rowToComplaint(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    area: row.area,
    department: row.department,
    priority: row.priority,
    slaHours: Number(row.sla_hours || 48),
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    deadline: row.deadline instanceof Date ? row.deadline.toISOString() : (row.deadline || null),
    photoUrl: row.photo_url || null,
    citizenId: row.citizen_id || null,
    citizenName: row.citizen_name || null,
    citizenContactMasked: row.citizen_phone || null,
    citizenWard: row.citizen_ward || null,
    isDemo: Boolean(row.is_demo),
    duplicateIds: safeJsonParse(row.duplicate_ids, []),
    analysis: safeJsonParse(row.analysis, null),
    resolutionData: safeJsonParse(row.resolution_data, null),
    evidence: safeJsonParse(row.evidence, []),
    statusHistory: safeJsonParse(row.status_history, []),
    slaEvents: safeJsonParse(row.sla_events, []),
    appreciations: safeJsonParse(row.appreciations, []),
    feedback: safeJsonParse(row.feedback, null),
    aiVerification: safeJsonParse(row.ai_verification, null),
    assignment: safeJsonParse(row.assignment, null),
  };
}

export function complaintToRow(c) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    area: c.area,
    department: c.department,
    priority: c.priority || 'Medium',
    sla_hours: c.slaHours || 48,
    status: c.status || 'Submitted',
    created_at: c.createdAt || new Date().toISOString(),
    deadline: c.deadline || null,
    photo_url: c.photoUrl || null,
    citizen_id: c.citizenId || null,
    citizen_name: c.citizenName || null,
    citizen_phone: c.citizenContactMasked || null,
    citizen_ward: c.citizenWard || null,
    is_demo: c.isDemo ? 1 : 0,
    duplicate_ids: JSON.stringify(c.duplicateIds || []),
    analysis: c.analysis ? JSON.stringify(c.analysis) : null,
    resolution_data: c.resolutionData ? JSON.stringify(c.resolutionData) : null,
    evidence: JSON.stringify(c.evidence || []),
    status_history: JSON.stringify(c.statusHistory || []),
    sla_events: JSON.stringify(c.slaEvents || []),
    appreciations: JSON.stringify(c.appreciations || []),
    feedback: c.feedback ? JSON.stringify(c.feedback) : null,
    ai_verification: c.aiVerification ? JSON.stringify(c.aiVerification) : null,
    assignment: c.assignment ? JSON.stringify(c.assignment) : null,
  };
}

function safeJsonParse(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); }
  catch { return fallback; }
}
