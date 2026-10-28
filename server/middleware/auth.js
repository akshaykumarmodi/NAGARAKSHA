/**
 * NAGARAKSHAK — Authentication & Authorization Middleware
 * Validates persistent session tokens against Supabase PostgreSQL / SQLite and enforces RBAC.
 */

import { getDb, sanitizeUser } from '../db.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7).trim() 
    : req.headers['x-session-token'];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const db = getDb();
    const session = await db.prepare(`
      SELECT s.token, s.user_id, s.expires_at, u.*
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ?
    `).get(token);

    if (!session) {
      req.user = null;
      return next();
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      req.user = null;
      return next();
    }

    req.user = sanitizeUser(session);
    req.sessionToken = token;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err.message);
    req.user = null;
    next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }
  next();
}

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
    }
    const userRole = String(req.user.role || '').toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        error: `Access denied. Role '${userRole}' is not authorized to access this resource.` 
      });
    }
    next();
  };
}
