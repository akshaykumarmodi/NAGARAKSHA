/**
 * NAGARAKSHA — Audit Logs REST API
 * Supports Supabase PostgreSQL and SQLite.
 */

import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// GET /api/audit-logs
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const logs = await db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC').all();
    res.json({ success: true, data: logs.map(row => ({
      id: row.id,
      complaintId: row.complaint_id,
      type: row.type,
      actor: row.actor,
      title: row.title,
      description: row.description,
      timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
    })) });
  } catch (err) {
    console.error('[GET /audit-logs]', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve audit logs.' });
  }
});

// POST /api/audit-logs
router.post('/', async (req, res) => {
  try {
    const { complaintId, type, actor, title, description } = req.body;
    if (!type || !title) return res.status(400).json({ success: false, error: 'type and title required.' });

    const db = getDb();
    const now = new Date().toISOString();
    const id = `LOG-${Date.now()}-${Math.floor(Math.random() * 900) + 100}`;

    await db.prepare('INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, complaintId || null, type, actor || 'System', title, description || '', now);

    res.status(201).json({ success: true, data: { id, complaintId, type, actor, title, description, timestamp: now } });
  } catch (err) {
    console.error('[POST /audit-logs]', err.message);
    res.status(500).json({ success: false, error: 'Failed to create audit log.' });
  }
});

export default router;
