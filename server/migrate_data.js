/**
 * NAGARAKSHA — SQLite to Supabase PostgreSQL Data Migration Script
 * 
 * Safely copies existing data from data/nagaraksha.db.backup into Supabase PostgreSQL.
 * Run with: node server/migrate_data.js
 */

import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DB_PATH = path.join(__dirname, '..', 'data', 'nagaraksha.db.backup');
const LIVE_DB_PATH = path.join(__dirname, '..', 'data', 'nagaraksha.db');

const SOURCE_PATH = fs.existsSync(BACKUP_DB_PATH) ? BACKUP_DB_PATH : LIVE_DB_PATH;

function getPoolConfig() {
  if (process.env.PGPASSWORD) {
    return {
      host: process.env.PGHOST || 'aws-0-ap-northeast-2.pooler.supabase.com',
      port: parseInt(process.env.PGPORT || '6543', 10),
      user: process.env.PGUSER || 'postgres.uoqbvsntktftalqglkqo',
      password: String(process.env.PGPASSWORD),
      database: process.env.PGDATABASE || 'postgres',
      ssl: { rejectUnauthorized: false },
    };
  }
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL.trim(),
      ssl: { rejectUnauthorized: false },
    };
  }
  return null;
}

const poolConfig = getPoolConfig();
if (!poolConfig) {
  console.error('\n❌ Neither PGPASSWORD nor DATABASE_URL is set in environment or .env file.');
  console.error('Please configure PGPASSWORD=your_password in .env\n');
  process.exit(1);
}

if (!fs.existsSync(SOURCE_PATH)) {
  console.error(`\n❌ Source SQLite database not found at ${SOURCE_PATH}\n`);
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool(poolConfig);

async function runMigration() {
  console.log('\n🚀 Starting SQLite -> Supabase PostgreSQL Data Migration...');
  console.log(`📁 Source SQLite DB: ${SOURCE_PATH}`);
  console.log('🌐 Target: Supabase PostgreSQL (pooler)\n');

  const sqlite = new Database(SOURCE_PATH, { readonly: true });

  try {
    // 1. Migrate Users
    const users = sqlite.prepare('SELECT * FROM users').all();
    console.log(`👥 Migrating ${users.length} users...`);
    let usersMigrated = 0;
    for (const u of users) {
      await pool.query(`
        INSERT INTO users (
          id, username, password_hash, role, name, email, phone, ward,
          department, badge_number, designation, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          ward = EXCLUDED.ward,
          department = EXCLUDED.department,
          badge_number = EXCLUDED.badge_number,
          designation = EXCLUDED.designation,
          updated_at = EXCLUDED.updated_at
      `, [
        u.id, u.username, u.password_hash, u.role, u.name, u.email, u.phone, u.ward,
        u.department, u.badge_number, u.designation, u.created_at, u.updated_at
      ]);
      usersMigrated++;
    }
    console.log(`   ✅ ${usersMigrated} users migrated.`);

    // 2. Migrate Complaints
    const complaints = sqlite.prepare('SELECT * FROM complaints').all();
    console.log(`\n📋 Migrating ${complaints.length} complaints...`);
    let complaintsMigrated = 0;
    for (const c of complaints) {
      await pool.query(`
        INSERT INTO complaints (
          id, title, description, category, area, department, priority, sla_hours,
          status, created_at, deadline, photo_url, citizen_id, citizen_name,
          citizen_phone, citizen_ward, is_demo, duplicate_ids, analysis,
          resolution_data, evidence, status_history, sla_events, appreciations,
          feedback, ai_verification, assignment
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          area = EXCLUDED.area,
          department = EXCLUDED.department,
          priority = EXCLUDED.priority,
          sla_hours = EXCLUDED.sla_hours,
          status = EXCLUDED.status,
          deadline = EXCLUDED.deadline,
          photo_url = EXCLUDED.photo_url,
          citizen_id = EXCLUDED.citizen_id,
          citizen_name = EXCLUDED.citizen_name,
          citizen_phone = EXCLUDED.citizen_phone,
          citizen_ward = EXCLUDED.citizen_ward,
          is_demo = EXCLUDED.is_demo,
          duplicate_ids = EXCLUDED.duplicate_ids,
          analysis = EXCLUDED.analysis,
          resolution_data = EXCLUDED.resolution_data,
          evidence = EXCLUDED.evidence,
          status_history = EXCLUDED.status_history,
          sla_events = EXCLUDED.sla_events,
          appreciations = EXCLUDED.appreciations,
          feedback = EXCLUDED.feedback,
          ai_verification = EXCLUDED.ai_verification,
          assignment = EXCLUDED.assignment
      `, [
        c.id, c.title, c.description, c.category, c.area, c.department, c.priority, c.sla_hours,
        c.status, c.created_at, c.deadline, c.photo_url, c.citizen_id, c.citizen_name,
        c.citizen_phone, c.citizen_ward, c.is_demo, c.duplicate_ids, c.analysis,
        c.resolution_data, c.evidence, c.status_history, c.sla_events, c.appreciations,
        c.feedback, c.ai_verification, c.assignment
      ]);
      complaintsMigrated++;
    }
    console.log(`   ✅ ${complaintsMigrated} complaints migrated.`);

    // 3. Migrate Audit Logs
    const auditLogs = sqlite.prepare('SELECT * FROM audit_logs').all();
    console.log(`\n📜 Migrating ${auditLogs.length} audit logs...`);
    let logsMigrated = 0;
    for (const l of auditLogs) {
      await pool.query(`
        INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [l.id, l.complaint_id, l.type, l.actor, l.title, l.description, l.timestamp]);
      logsMigrated++;
    }
    console.log(`   ✅ ${logsMigrated} audit logs migrated.`);

    // 4. Migrate Login Activity
    const loginActivity = sqlite.prepare('SELECT * FROM login_activity').all();
    console.log(`\n🔒 Migrating ${loginActivity.length} login activity records...`);
    let activityMigrated = 0;
    for (const a of loginActivity) {
      await pool.query(`
        INSERT INTO login_activity (id, user_id, username, event_type, role, ip_address, user_agent, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [a.id, a.user_id, a.username, a.event_type, a.role, a.ip_address, a.user_agent, a.timestamp]);
      activityMigrated++;
    }
    console.log(`   ✅ ${activityMigrated} login activities migrated.`);

    console.log('\n🎉 ALL DATA MIGRATED SUCCESSFULLY TO SUPABASE POSTGRESQL!\n');
  } catch (err) {
    console.error('\n❌ Migration Failed:', err.message);
    throw err;
  } finally {
    sqlite.close();
    await pool.end();
  }
}

runMigration().catch(() => process.exit(1));
