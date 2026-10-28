/**
 * NAGARAKSHAK — Authentication API Router
 * Endpoints for registration, login, logout, and session check.
 * Works seamlessly with Supabase PostgreSQL and SQLite.
 */

import { Router } from 'express';
import crypto from 'crypto';
import { getDb, hashPassword, verifyPassword, sanitizeUser } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
}

function getUserAgent(req) {
  return req.headers['user-agent'] || 'Unknown Client';
}

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, phone, email, ward } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Username must be at least 3 characters.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim() : null;
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    const db = getDb();

    // Check uniqueness
    const existing = await db.prepare('SELECT id FROM users WHERE username = ? OR (phone = ? AND phone IS NOT NULL) OR (email = ? AND email IS NOT NULL)').get(cleanUsername, cleanPhone, cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this username, mobile, or email already exists.' });
    }

    const now = new Date().toISOString();
    const userId = `CIT-${Date.now().toString().slice(-6)}`;
    const passwordHash = hashPassword(password);

    // Enforce role: public registration can ONLY create CITIZEN accounts
    const role = 'CITIZEN';

    await db.prepare(`
      INSERT INTO users (id, username, password_hash, role, name, email, phone, ward, department, badge_number, designation, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)
    `).run(userId, cleanUsername, passwordHash, role, name.trim(), cleanEmail, cleanPhone, ward || 'Ward 42', now, now);

    // Create session token (valid for 7 days)
    const token = `SESSION-${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    await db.prepare(`
      INSERT INTO sessions (token, user_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(token, userId, now, expiresAt);

    // Record login activity (Never log passwords or tokens)
    const logId = `ACT-${Date.now()}-${Math.floor(Math.random() * 900) + 100}`;
    await db.prepare(`
      INSERT INTO login_activity (id, user_id, username, event_type, role, ip_address, user_agent, timestamp)
      VALUES (?, ?, ?, 'REGISTER_LOGIN', ?, ?, ?, ?)
    `).run(logId, userId, cleanUsername, role, getClientIp(req), getUserAgent(req), now);

    const newUser = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    res.status(201).json({
      success: true,
      message: 'Citizen account created successfully.',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('[POST /api/auth/register]', err.message);
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { identifier, username, badgeOrEmail, password, passcode } = req.body;
    const cleanId = (identifier || username || badgeOrEmail || '').trim().toLowerCase();
    const cleanPass = password || passcode;

    if (!cleanId || !cleanPass) {
      return res.status(400).json({ success: false, error: 'Identifier and password are required.' });
    }

    const db = getDb();
    const now = new Date().toISOString();

    // Look up by username, phone, email, badge_number, or officer ID
    const user = await db.prepare(`
      SELECT * FROM users 
      WHERE LOWER(username) = ? 
         OR LOWER(phone) = ? 
         OR LOWER(email) = ? 
         OR LOWER(badge_number) = ?
         OR LOWER(id) = ?
    `).get(cleanId, cleanId, cleanId, cleanId, cleanId);

    // Failed login check
    if (!user || !verifyPassword(cleanPass, user.password_hash)) {
      const logId = `ACT-${Date.now()}-${Math.floor(Math.random() * 900) + 100}`;
      await db.prepare(`
        INSERT INTO login_activity (id, user_id, username, event_type, role, ip_address, user_agent, timestamp)
        VALUES (?, ?, ?, 'LOGIN_FAILED', ?, ?, ?, ?)
      `).run(logId, user ? user.id : null, cleanId, user ? user.role : 'UNKNOWN', getClientIp(req), getUserAgent(req), now);

      return res.status(401).json({ success: false, error: 'Invalid identifier or password.' });
    }

    // Success login
    const token = `SESSION-${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    await db.prepare(`
      INSERT INTO sessions (token, user_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(token, user.id, now, expiresAt);

    const logId = `ACT-${Date.now()}-${Math.floor(Math.random() * 900) + 100}`;
    await db.prepare(`
      INSERT INTO login_activity (id, user_id, username, event_type, role, ip_address, user_agent, timestamp)
      VALUES (?, ?, ?, 'LOGIN_SUCCESS', ?, ?, ?, ?)
    `).run(logId, user.id, user.username, user.role, getClientIp(req), getUserAgent(req), now);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('[POST /api/auth/login]', err.message);
    res.status(500).json({ success: false, error: 'Authentication failed. Please try again.' });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const token = req.sessionToken;
    const now = new Date().toISOString();

    if (token) {
      if (req.user) {
        const logId = `ACT-${Date.now()}-${Math.floor(Math.random() * 900) + 100}`;
        await db.prepare(`
          INSERT INTO login_activity (id, user_id, username, event_type, role, ip_address, user_agent, timestamp)
          VALUES (?, ?, ?, 'LOGOUT', ?, ?, ?, ?)
        `).run(logId, req.user.id, req.user.username, req.user.role, getClientIp(req), getUserAgent(req), now);
      }
      await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('[POST /api/auth/logout]', err.message);
    res.status(500).json({ success: false, error: 'Logout failed.' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'No active session or session expired.' });
  }
  res.json({ success: true, user: req.user });
});

export default router;
