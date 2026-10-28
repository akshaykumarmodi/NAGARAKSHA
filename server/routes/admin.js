/**
 * NAGARAKSHAK — Admin & Security Management Routes
 * Protected endpoints for user management and login activity audit.
 * Only accessible to users with AUTHORITY or ADMIN roles.
 */

import { Router } from 'express';
import { getDb, hashPassword, sanitizeUser } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Enforce that all admin routes require authenticated session with AUTHORITY or ADMIN role
router.use(authenticateToken);
router.use(requireRole(['ADMIN', 'AUTHORITY']));

// ── GET /api/admin/users — list all users ──────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.prepare(`
      SELECT id, username, role, name, email, phone, ward, department, badge_number, designation, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('[GET /api/admin/users]', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve user accounts.' });
  }
});

// ── GET /api/admin/login-activity — list login/logout security events ────────
router.get('/login-activity', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.prepare(`
      SELECT id, user_id, username, event_type, role, ip_address, user_agent, timestamp
      FROM login_activity
      ORDER BY timestamp DESC
      LIMIT 100
    `).all();

    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('[GET /api/admin/login-activity]', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve login activity.' });
  }
});

// ── POST /api/admin/create-officer — Admin-only officer provisioning ─────────
router.post('/create-officer', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { badgeNumber, name, email, phone, department, designation, password } = req.body;

    if (!badgeNumber || !name || !password) {
      return res.status(400).json({ success: false, error: 'Badge number, name, and temporary password are required.' });
    }

    const cleanBadge = badgeNumber.trim().toUpperCase();
    const db = getDb();

    const existing = await db.prepare('SELECT id FROM users WHERE username = ? OR badge_number = ?').get(cleanBadge, cleanBadge);
    if (existing) {
      return res.status(409).json({ success: false, error: 'An officer with this badge number already exists.' });
    }

    const now = new Date().toISOString();
    const officerId = `OFF-${Date.now().toString().slice(-6)}`;
    const passwordHash = hashPassword(password);

    await db.prepare(`
      INSERT INTO users (id, username, password_hash, role, name, email, phone, ward, department, badge_number, designation, created_at, updated_at)
      VALUES (?, ?, ?, 'AUTHORITY', ?, ?, ?, NULL, ?, ?, ?, ?, ?)
    `).run(officerId, cleanBadge, passwordHash, name.trim(), email || null, phone || null, department || 'Municipal Operations', cleanBadge, designation || 'Field Officer', now, now);

    const created = await db.prepare('SELECT * FROM users WHERE id = ?').get(officerId);
    res.status(201).json({ success: true, data: sanitizeUser(created) });
  } catch (err) {
    console.error('[POST /api/admin/create-officer]', err.message);
    res.status(500).json({ success: false, error: 'Failed to create officer account.' });
  }
});

export default router;
