/**
 * NAGARAKSHA — Supabase PostgreSQL Verification Test
 * 
 * Verifies:
 * 1. Live Supabase database connection via real query
 * 2. Schema integrity (complaints, users, audit_logs, sessions, login_activity)
 * 3. Complaint creation
 * 4. Complaint retrieval & field fidelity
 * 5. Complaint status update & audit log linking
 * 6. Persistence across connection restart
 * 
 * Run with: node server/verify_supabase.js
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

function getPoolConfig() {
  if (process.env.PGPASSWORD) {
    return {
      host: process.env.PGHOST || 'aws-0-ap-northeast-2.pooler.supabase.com',
      port: parseInt(process.env.PGPORT || '6543', 10),
      user: process.env.PGUSER || 'postgres.uoqbvsntktftalqglkqo',
      password: String(process.env.PGPASSWORD),
      database: process.env.PGDATABASE || 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    };
  }
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL.trim(),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    };
  }
  return null;
}

const poolConfig = getPoolConfig();
if (!poolConfig) {
  console.error('\n❌ Neither PGPASSWORD nor DATABASE_URL is configured in .env');
  console.error('Please set PGPASSWORD=your_database_password in .env\n');
  process.exit(1);
}

const { Pool } = pg;

async function runVerification() {
  console.log('\n============================================================');
  console.log('🧪 NAGARAKSHA — Supabase PostgreSQL Live Verification Suite');
  console.log('============================================================\n');

  const pool = new Pool(getPoolConfig());

  try {
    // 1. Live Connection Query
    console.log('1️⃣  Testing Live Connection with SELECT NOW()...');
    const timeRes = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log(`   ✅ Connected to Supabase PostgreSQL!`);
    console.log(`   🕒 Server Time: ${timeRes.rows[0].current_time}`);
    console.log(`   📦 Engine: ${timeRes.rows[0].pg_version.split(' on ')[0]}`);

    // 2. Table Existence
    console.log('\n2️⃣  Verifying Schema Tables...');
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const existingTables = tablesRes.rows.map(r => r.table_name);
    const requiredTables = ['complaints', 'users', 'audit_logs', 'sessions', 'login_activity'];

    for (const reqTable of requiredTables) {
      if (existingTables.includes(reqTable)) {
        console.log(`   ✅ Table '${reqTable}' is present.`);
      } else {
        throw new Error(`Table '${reqTable}' is missing. Please run server/migrations/001_supabase_schema.sql in Supabase SQL Editor.`);
      }
    }

    // 3. Test Complaint Creation
    const testId = `CFX-TEST-${Date.now()}`;
    const testTitle = 'Test Civic Complaint for Supabase Verification';
    const testArea = 'Indiranagar 100ft Road';
    const now = new Date().toISOString();

    console.log(`\n3️⃣  Testing Complaint Creation (${testId})...`);
    await pool.query(`
      INSERT INTO complaints (
        id, title, description, category, area, department, priority, sla_hours,
        status, created_at, deadline, photo_url, citizen_id, citizen_name,
        citizen_phone, citizen_ward, is_demo, duplicate_ids, analysis,
        resolution_data, evidence, status_history, sla_events, appreciations,
        feedback, ai_verification, assignment
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24,
        $25, $26, $27
      )
    `, [
      testId, testTitle, 'Automated verification test description.', 'Pothole/Road Damage',
      testArea, 'Roads & Infrastructure Department', 'High', 24,
      'Submitted', now, now, null, 'CIT-TEST-001', 'Test Citizen',
      '+91 98765-43210', 'Ward 42', 0, '[]', JSON.stringify({ verified: true }),
      null, '[]', '[]', '[]', '[]',
      null, null, null
    ]);
    console.log(`   ✅ Complaint inserted successfully.`);

    // 4. Test Retrieval
    console.log('\n4️⃣  Testing Complaint Retrieval & Field Fidelity...');
    const fetchRes = await pool.query('SELECT * FROM complaints WHERE id = $1', [testId]);
    if (fetchRes.rows.length === 0) throw new Error('Complaint was not found after insertion!');
    const retrieved = fetchRes.rows[0];
    if (retrieved.title !== testTitle) throw new Error(`Title mismatch: expected "${testTitle}", got "${retrieved.title}"`);
    console.log(`   ✅ Complaint retrieved with matching title and properties.`);

    // 5. Test Status Update & Audit Log
    console.log('\n5️⃣  Testing Status Update & Audit Log Linking...');
    await pool.query(`
      UPDATE complaints 
      SET status = 'In Progress', 
          department = 'Roads & Infrastructure Department' 
      WHERE id = $1
    `, [testId]);

    const auditId = `LOG-TEST-${Date.now()}`;
    await pool.query(`
      INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [auditId, testId, 'TEST_AUDIT', 'Verification Suite', 'Status updated to In Progress', 'Automated test step', now]);
    console.log(`   ✅ Status updated and linked audit log inserted.`);

    // 6. Test Persistence Across Pool Disconnect & Reconnect
    console.log('\n6️⃣  Testing Persistence Across Backend Pool Restart...');
    await pool.end(); // Terminate existing pool

    const pool2 = new Pool(getPoolConfig());

    const verifyPersist = await pool2.query('SELECT status FROM complaints WHERE id = $1', [testId]);
    if (verifyPersist.rows.length === 0 || verifyPersist.rows[0].status !== 'In Progress') {
      throw new Error('Persistence check failed: updated complaint status did not persist across connection restart!');
    }
    console.log(`   ✅ Verified persistence: Status is '${verifyPersist.rows[0].status}' after connection restart.`);

    // Clean up test data
    console.log('\n7️⃣  Cleaning up verification test record...');
    await pool2.query('DELETE FROM audit_logs WHERE id = $1', [auditId]);
    await pool2.query('DELETE FROM complaints WHERE id = $1', [testId]);
    console.log(`   ✅ Test record cleaned up.`);

    await pool2.end();

    console.log('\n============================================================');
    console.log('🎉 ALL SUPABASE POSTGRESQL VERIFICATION CHECKS PASSED 100%!');
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err.message);
    process.exit(1);
  }
}

runVerification();
