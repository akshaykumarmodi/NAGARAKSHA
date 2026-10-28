/**
 * NAGARAKSHA — Express Backend Server
 * 
 * Port: 5001 (frontend Vite proxies /api/* to this)
 * Database: Supabase PostgreSQL (via pg) or local SQLite fallback (data/nagaraksha.db)
 * 
 * Start: node server/index.js
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { getDb, isUsingPostgres } from './db.js';
import { seedDemoData } from './seed.js';
import complaintsRouter from './routes/complaints.js';
import auditLogsRouter from './routes/auditLogs.js';
import uploadsRouter from './routes/uploads.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5001;

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Health Check (Real Database Connectivity Test) ─────────────────────────

app.get('/api/health', async (req, res) => {
  try {
    const db = getDb();
    const complaintsRow = await db.prepare('SELECT count(*) as count FROM complaints').get();
    const usersRow = await db.prepare('SELECT count(*) as count FROM users').get();
    const loginRow = await db.prepare('SELECT count(*) as count FROM login_activity').get();

    const complaintsCount = Number(complaintsRow?.count || 0);
    const usersCount = Number(usersRow?.count || 0);
    const loginActivityCount = Number(loginRow?.count || 0);

    const isPg = isUsingPostgres();

    res.json({
      status: 'ok',
      service: 'Nagarakshak Civic API',
      database: {
        status: 'connected',
        engine: isPg ? 'Supabase PostgreSQL' : 'SQLite (WAL Mode)',
        driver: isPg ? 'pg (node-postgres Pool)' : 'better-sqlite3',
        complaintsCount,
        usersCount,
        loginActivityCount,
      },
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } catch (dbErr) {
    console.error('[Health Check DB Error]', dbErr.message);
    res.status(503).json({
      status: 'error',
      service: 'Nagarakshak Civic API',
      database: {
        status: 'disconnected',
        error: dbErr.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

// ── API Routes ──────────────────────────────────────────────────────────────

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/upload', uploadsRouter);

// ── 404 handler ─────────────────────────────────────────────────────────────

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  // Never expose internal errors to clients
  res.status(err.status || 500).json({ success: false, error: 'An unexpected error occurred. Please try again.' });
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  const isPg = isUsingPostgres();
  console.log(`\n🏛️  Nagaraksha API running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Database Engine: ${isPg ? 'Supabase PostgreSQL (via pg.Pool)' : 'data/nagaraksha.db (SQLite)'}\n`);
  
  // Seed demo data on startup if DB is empty
  try {
    await seedDemoData();
  } catch (seedErr) {
    console.error('[Startup Seed Error]', seedErr.message);
  }
});

export default app;
