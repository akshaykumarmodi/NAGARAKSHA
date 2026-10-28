/**
 * NAGARAKSHA — Complaints REST API
 * All complaint CRUD + status transitions + SLA escalations.
 * Fully compatible with Supabase PostgreSQL and local SQLite.
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, rowToComplaint, complaintToRow } from '../db.js';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeStr(val, maxLen = 2000) {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function calculateDeadline(createdAt, slaHours) {
  return new Date(new Date(createdAt).getTime() + slaHours * 3600 * 1000).toISOString();
}

function detectCategory(text) {
  const lower = (text || '').toLowerCase();
  if (/pothole|crater|road|asphalt|gaddha|sadak|rebar|pavement|footpath/.test(lower)) return 'Pothole/Road Damage';
  if (/garbage|trash|waste|dump|kachra|kuda|stench|overflow|rubbish|litter/.test(lower)) return 'Garbage';
  if (/light|dark|lamp|bulb|streetlight|sparking|bijli|blackout/.test(lower)) return 'Streetlight';
  if (/water|pipe|leak|drain|flood|sewage|burst|paani|pani|nali/.test(lower)) return 'Water Leakage';
  return 'Other';
}

function evaluatePriority(text, category) {
  const lower = (text || '').toLowerCase();
  const criticalWords = ['fatal', 'live wire', 'hospital', 'school', 'children', 'emergency', 'collapsed', 'janleva'];
  const highWords = ['accident', 'danger', 'urgent', 'hazardous', 'sparking', 'flooding', 'deep'];
  const lowWords = ['minor', 'faded', 'aesthetic', 'cosmetic', 'small scratch', 'slow drip'];

  if (criticalWords.some(w => lower.includes(w))) return { priority: 'Critical', slaHours: 12 };
  if (highWords.some(w => lower.includes(w))) return { priority: 'High', slaHours: 24 };
  if (lowWords.some(w => lower.includes(w))) return { priority: 'Low', slaHours: 72 };
  return { priority: 'Medium', slaHours: 48 };
}

const DEPARTMENTS = {
  'Garbage': 'Sanitation Department',
  'Pothole/Road Damage': 'Roads & Infrastructure Department',
  'Streetlight': 'Electrical & Lighting Department',
  'Water Leakage': 'Water Supply & Sewerage Board',
  'Other': 'General Civic Services',
};

function findDuplicates(newComplaint, allComplaints) {
  const matches = [];
  const text1 = `${newComplaint.title} ${newComplaint.description}`.toLowerCase();
  const tokens1 = text1.split(/\s+/).filter(t => t.length > 3);

  for (const existing of allComplaints) {
    if (existing.id === newComplaint.id) continue;
    if (existing.status === 'Resolved') continue;

    let score = 0;
    const reasons = [];

    // Category match
    if (newComplaint.category && existing.category === newComplaint.category) {
      score += 25;
      reasons.push(`Identical Category: ${newComplaint.category}`);
    }

    // Location overlap
    const area1 = (newComplaint.area || '').toLowerCase().split(/[\s,]+/).filter(t => t.length > 3);
    const area2 = (existing.area || '').toLowerCase().split(/[\s,]+/).filter(t => t.length > 3);
    const areaOverlap = area1.filter(t => area2.includes(t));
    if (areaOverlap.length >= 2) {
      score += 40;
      reasons.push(`Geographic overlap: "${areaOverlap.join(', ')}"`);
    } else if (areaOverlap.length === 1) {
      score += 15;
      reasons.push(`Nearby location: "${areaOverlap[0]}"`);
    }

    // Text similarity (Jaccard)
    const text2 = `${existing.title} ${existing.description}`.toLowerCase();
    const tokens2 = new Set(text2.split(/\s+/).filter(t => t.length > 3));
    const common = tokens1.filter(t => tokens2.has(t)).length;
    const union = new Set([...tokens1, ...tokens2]).size;
    const jaccard = union > 0 ? common / union : 0;
    if (jaccard > 0.4) { score += 35; reasons.push(`Strong text overlap (${Math.round(jaccard * 100)}%)`); }
    else if (jaccard > 0.2) { score += 20; reasons.push(`Moderate text overlap (${Math.round(jaccard * 100)}%)`); }

    if (score >= 50) {
      matches.push({ matchedId: existing.id, matchedTitle: existing.title, matchedStatus: existing.status, score: Math.min(score, 98), reasons });
    }
  }
  return matches.sort((a, b) => b.score - a.score);
}

// ── Routes ──────────────────────────────────────────────────────────────────

// GET /api/complaints — list all complaints, newest first
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.prepare('SELECT * FROM complaints ORDER BY created_at DESC').all();
    res.json({ success: true, data: rows.map(rowToComplaint) });
  } catch (err) {
    console.error('[GET /complaints]', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve complaints.' });
  }
});

// GET /api/complaints/:id — single complaint
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const row = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Complaint not found.' });
    res.json({ success: true, data: rowToComplaint(row) });
  } catch (err) {
    console.error('[GET /complaints/:id]', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve complaint.' });
  }
});

// POST /api/complaints — create new complaint
router.post('/', async (req, res) => {
  try {
    const { title, description, category, area, photoUrl, citizenId, citizenName, citizenContactMasked, citizenWard, currentUser } = req.body;

    // Validation
    if (!sanitizeStr(title) || sanitizeStr(title).length < 5) {
      return res.status(400).json({ success: false, error: 'Title must be at least 5 characters.' });
    }
    if (!sanitizeStr(description) || sanitizeStr(description).length < 10) {
      return res.status(400).json({ success: false, error: 'Description must be at least 10 characters.' });
    }
    if (!sanitizeStr(area)) {
      return res.status(400).json({ success: false, error: 'Location/area is required.' });
    }

    const db = getDb();
    const now = new Date().toISOString();
    const existingRows = await db.prepare('SELECT * FROM complaints ORDER BY created_at DESC').all();
    const existingComplaints = existingRows.map(rowToComplaint);

    // Auto-detect category if not provided
    const fullText = `${sanitizeStr(title)} ${sanitizeStr(description)} ${sanitizeStr(area)}`;
    const detectedCategory = sanitizeStr(category) || detectCategory(fullText);
    const dept = DEPARTMENTS[detectedCategory] || 'General Civic Services';
    const { priority, slaHours } = evaluatePriority(fullText, detectedCategory);

    // Generate unique complaint ID
    const idNum = String(Date.now()).slice(-6);
    const newId = `CFX-2026-${idNum}`;

    const complaintDraft = {
      id: newId, title: sanitizeStr(title), description: sanitizeStr(description),
      category: detectedCategory, area: sanitizeStr(area),
      department: dept, priority, slaHours,
      createdAt: now, deadline: calculateDeadline(now, slaHours),
      photoUrl: photoUrl || null, isDemo: false,
      citizenId: citizenId || `CIT-${idNum}`,
      citizenName: citizenName || (currentUser?.name) || 'Verified Citizen',
      citizenContactMasked: citizenContactMasked || '+91 98765-XXXXX',
      citizenWard: citizenWard || sanitizeStr(area),
    };

    // Duplicate detection
    const possibleDuplicates = findDuplicates(complaintDraft, existingComplaints);
    const hasDuplicates = possibleDuplicates.length > 0;

    let initialStatus = 'AI Verified';
    let statusReason = 'Automated rule-based triage passed. Routed to Authority queue.';
    if (hasDuplicates) {
      initialStatus = 'Flagged for Review';
      statusReason = `Possible duplicate: ${possibleDuplicates[0].score}% match with ${possibleDuplicates[0].matchedId}.`;
    } else if (!photoUrl) {
      initialStatus = 'Needs More Evidence';
      statusReason = 'Submitted without photographic evidence. Flagged for review.';
    }

    const analysis = {
      engineType: 'Rule-based triage (Nagaraksha Backend)',
      suggestedCategory: detectedCategory,
      categoryConfidence: 'Auto-detected',
      recommendedDepartment: dept,
      recommendedPriority: priority,
      slaHours,
      reasoning: [
        `Routed to ${dept} based on category: ${detectedCategory}.`,
        `Priority: ${priority} (${slaHours}h SLA) — set by keyword analysis.`,
        hasDuplicates ? `⚠️ Possible duplicate: ${possibleDuplicates[0].matchedId} at ${possibleDuplicates[0].score}% match.` : '✅ No duplicates detected.',
      ],
      possibleDuplicates,
      hasDuplicates,
      recommendedNextAction: hasDuplicates ? 'Review possible duplicate before dispatch.' : `Assign field officer from ${dept}.`,
      timestamp: now,
    };

    const evidence = photoUrl ? [{
      id: `EVD-${Date.now()}`,
      complaintId: newId,
      fileName: 'citizen_evidence.jpg',
      fileType: 'image/jpeg',
      url: photoUrl,
      storageDriver: 'demo_inline',
      uploadedBy: complaintDraft.citizenId,
      uploadedAt: now,
      verificationStatus: 'Pending Check',
    }] : [];

    const statusHistory = [{
      id: `SH-${Date.now()}`,
      complaintId: newId,
      fromStatus: null,
      toStatus: initialStatus,
      changedBy: 'NAGARAKSHA Triage Engine',
      actorRole: 'system_ai',
      reason: statusReason,
      timestamp: now,
    }];

    const slaEvents = [{
      id: `SLA-${Date.now()}`,
      complaintId: newId,
      eventType: 'DEADLINE_ASSIGNED',
      timestamp: now,
      hoursRemaining: slaHours,
      actor: 'NAGARAKSHA Engine',
      notes: `${slaHours}h SLA deadline initialized.`,
    }];

    const finalComplaint = {
      ...complaintDraft,
      status: initialStatus,
      duplicateIds: possibleDuplicates.map(d => d.matchedId),
      analysis, evidence, statusHistory, slaEvents,
      appreciations: [], feedback: null,
      aiVerification: { status: initialStatus, verifiedAt: now, confidence: analysis.categoryConfidence, reasoning: analysis.reasoning },
    };

    const row = complaintToRow(finalComplaint);

    // Insert into DB using standard positional placeholders
    await db.prepare(`
      INSERT INTO complaints (
        id, title, description, category, area, department, priority, sla_hours,
        status, created_at, deadline, photo_url, citizen_id, citizen_name,
        citizen_phone, citizen_ward, is_demo, duplicate_ids, analysis,
        resolution_data, evidence, status_history, sla_events, appreciations,
        feedback, ai_verification, assignment
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `).run([
      row.id, row.title, row.description, row.category, row.area, row.department, row.priority, row.sla_hours,
      row.status, row.created_at, row.deadline, row.photo_url, row.citizen_id, row.citizen_name,
      row.citizen_phone, row.citizen_ward, row.is_demo, row.duplicate_ids, row.analysis,
      row.resolution_data, row.evidence, row.status_history, row.sla_events, row.appreciations,
      row.feedback, row.ai_verification, row.assignment
    ]);

    // Auto-create audit log for new complaint
    await db.prepare('INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(`LOG-${Date.now()}`, newId, 'COMPLAINT_CREATED', complaintDraft.citizenName || 'Citizen Portal',
        'New Complaint Registered',
        `Classified as ${detectedCategory} and routed to ${dept}. Priority: ${priority} (${slaHours}h SLA).`, now);

    if (hasDuplicates) {
      await db.prepare('INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(`LOG-${Date.now() + 1}`, newId, 'DUPLICATE_FLAGGED', 'NAGARAKSHA Intelligence Engine',
          `Potential Duplicate Flagged (${possibleDuplicates[0].score}% Match)`,
          `Matched with existing ticket ${possibleDuplicates[0].matchedId}.`, now);
    }

    res.status(201).json({ success: true, data: finalComplaint });
  } catch (err) {
    console.error('[POST /complaints]', err.message);
    res.status(500).json({ success: false, error: 'Failed to create complaint.' });
  }
});

// PUT /api/complaints/:id — full complaint update
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const existing = await db.prepare('SELECT id FROM complaints WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Complaint not found.' });

    const updated = { ...req.body, id: req.params.id };
    const row = complaintToRow(updated);

    await db.prepare(`
      UPDATE complaints SET
        title=?, description=?, category=?, area=?,
        department=?, priority=?, sla_hours=?,
        status=?, deadline=?, photo_url=?,
        citizen_id=?, citizen_name=?, citizen_phone=?,
        citizen_ward=?, is_demo=?, duplicate_ids=?,
        analysis=?, resolution_data=?, evidence=?,
        status_history=?, sla_events=?,
        appreciations=?, feedback=?,
        ai_verification=?, assignment=?
      WHERE id = ?
    `).run([
      row.title, row.description, row.category, row.area,
      row.department, row.priority, row.sla_hours,
      row.status, row.deadline, row.photo_url,
      row.citizen_id, row.citizen_name, row.citizen_phone,
      row.citizen_ward, row.is_demo, row.duplicate_ids,
      row.analysis, row.resolution_data, row.evidence,
      row.status_history, row.sla_events,
      row.appreciations, row.feedback,
      row.ai_verification, row.assignment,
      req.params.id
    ]);

    const fetched = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: rowToComplaint(fetched) });
  } catch (err) {
    console.error('[PUT /complaints/:id]', err.message);
    res.status(500).json({ success: false, error: 'Failed to update complaint.' });
  }
});

// PATCH /api/complaints/:id/status — status transition
router.patch('/:id/status', async (req, res) => {
  try {
    const { nextStatus, reason, actor, actorRole } = req.body;
    if (!nextStatus) return res.status(400).json({ success: false, error: 'nextStatus is required.' });

    const db = getDb();
    const row = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Complaint not found.' });

    const complaint = rowToComplaint(row);
    const now = new Date().toISOString();

    const historyEntry = {
      id: `SH-${Date.now()}`,
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: nextStatus,
      changedBy: actor || 'Authorized Officer',
      actorRole: actorRole || 'AUTHORITY',
      reason: reason || `Status updated to ${nextStatus}`,
      timestamp: now,
    };

    const updated = {
      ...complaint,
      status: nextStatus,
      statusHistory: [...(complaint.statusHistory || []), historyEntry],
    };

    await db.prepare(`UPDATE complaints SET status=?, status_history=? WHERE id=?`)
      .run([nextStatus, JSON.stringify(updated.statusHistory), complaint.id]);

    await db.prepare('INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run([
        `LOG-${Date.now()}`, complaint.id, 'STATUS_CHANGED',
        actor || 'Authorized Officer', `Status Changed → ${nextStatus}`,
        reason || `Status updated to ${nextStatus} by authorized user.`, now
      ]);

    res.json({ success: true, data: { ...updated, status: nextStatus } });
  } catch (err) {
    console.error('[PATCH /complaints/:id/status]', err.message);
    res.status(500).json({ success: false, error: 'Failed to update status.' });
  }
});

// PATCH /api/complaints/:id/assign
router.patch('/:id/assign', async (req, res) => {
  try {
    const { assignedTo, department, assignedBy } = req.body;
    if (!assignedTo) return res.status(400).json({ success: false, error: 'assignedTo is required.' });

    const db = getDb();
    const row = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Complaint not found.' });

    const complaint = rowToComplaint(row);
    const now = new Date().toISOString();
    const assignment = { assignedTo, assignedDepartment: department || complaint.department, assignedAt: now, assignedBy: assignedBy || 'Dispatch Desk' };

    const historyEntry = { id: `SH-${Date.now()}`, complaintId: complaint.id, fromStatus: complaint.status, toStatus: 'In Progress', changedBy: assignedBy || 'Dispatch Desk', actorRole: 'AUTHORITY', reason: `Assigned to ${assignedTo}`, timestamp: now };
    const updated = { ...complaint, status: 'In Progress', department: department || complaint.department, assignment, statusHistory: [...(complaint.statusHistory || []), historyEntry] };

    await db.prepare(`UPDATE complaints SET status='In Progress', department=?, assignment=?, status_history=? WHERE id=?`)
      .run([updated.department, JSON.stringify(assignment), JSON.stringify(updated.statusHistory), complaint.id]);

    await db.prepare('INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run([`LOG-${Date.now()}`, complaint.id, 'WORK_STARTED', assignedBy || 'Dispatch Desk', 'Field Crew Dispatched & Work Started', `Assigned to ${assignedTo} from ${updated.department}.`, now]);

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PATCH /complaints/:id/assign]', err.message);
    res.status(500).json({ success: false, error: 'Failed to assign complaint.' });
  }
});

// PATCH /api/complaints/:id/resolve — submit resolution evidence
router.patch('/:id/resolve', async (req, res) => {
  try {
    const { workerNotes, resolutionPhotoUrl, submittedBy } = req.body;
    if (!workerNotes) return res.status(400).json({ success: false, error: 'workerNotes is required.' });

    const db = getDb();
    const row = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Complaint not found.' });

    const complaint = rowToComplaint(row);
    const now = new Date().toISOString();

    const resolutionData = { submittedAt: now, submittedBy: submittedBy || 'Field Officer', notes: workerNotes, evidencePhotoUrl: resolutionPhotoUrl || null, status: 'Pending Review', officialDecision: null };
    const historyEntry = { id: `SH-${Date.now()}`, complaintId: complaint.id, fromStatus: complaint.status, toStatus: 'Awaiting Verification', changedBy: submittedBy || 'Field Officer', actorRole: 'AUTHORITY', reason: `Resolution evidence submitted: "${workerNotes}"`, timestamp: now };
    const updated = { ...complaint, status: 'Awaiting Verification', resolutionData, statusHistory: [...(complaint.statusHistory || []), historyEntry] };

    await db.prepare(`UPDATE complaints SET status='Awaiting Verification', resolution_data=?, status_history=? WHERE id=?`)
      .run([JSON.stringify(resolutionData), JSON.stringify(updated.statusHistory), complaint.id]);

    await db.prepare('INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run([`LOG-${Date.now()}`, complaint.id, 'EVIDENCE_SUBMITTED', submittedBy || 'Field Officer', 'Resolution Proof Uploaded for Verification', `"${workerNotes}"`, now]);

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PATCH /complaints/:id/resolve]', err.message);
    res.status(500).json({ success: false, error: 'Failed to submit resolution.' });
  }
});

// PATCH /api/complaints/:id/decision — official reviewer decision
router.patch('/:id/decision', async (req, res) => {
  try {
    const { decision, decisionNotes, reviewer } = req.body;
    const valid = ['Approved', 'Rejected', 'Needs Re-investigation'];
    if (!valid.includes(decision)) return res.status(400).json({ success: false, error: 'Invalid decision.' });

    const db = getDb();
    const row = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Complaint not found.' });

    const complaint = rowToComplaint(row);
    const now = new Date().toISOString();
    let nextStatus = 'Resolved';
    if (decision === 'Rejected') nextStatus = 'Reopened';
    else if (decision === 'Needs Re-investigation') nextStatus = 'In Progress';

    const historyEntry = { id: `SH-${Date.now()}`, complaintId: complaint.id, fromStatus: complaint.status, toStatus: nextStatus, changedBy: reviewer || 'Senior Reviewer', actorRole: 'AUTHORITY', reason: `Decision: ${decision}. ${decisionNotes || ''}`, timestamp: now };
    const updatedResolution = { ...(complaint.resolutionData || {}), status: decision, officialDecision: decision, decisionNotes: decisionNotes || '', decidedAt: now, decidedBy: reviewer || 'Senior Reviewer', ...(decision === 'Approved' ? { approvedAt: now, approvedBy: reviewer || 'Senior Reviewer' } : {}), ...(decision === 'Rejected' ? { rejectedAt: now, rejectedBy: reviewer || 'Senior Reviewer' } : {}) };
    const updated = { ...complaint, status: nextStatus, resolutionData: updatedResolution, statusHistory: [...(complaint.statusHistory || []), historyEntry] };

    await db.prepare(`UPDATE complaints SET status=?, resolution_data=?, status_history=? WHERE id=?`)
      .run([nextStatus, JSON.stringify(updatedResolution), JSON.stringify(updated.statusHistory), complaint.id]);

    const auditTypeMap = { 'Approved': 'RESOLUTION_APPROVED', 'Rejected': 'RESOLUTION_REJECTED', 'Needs Re-investigation': 'REINVESTIGATION_REQUESTED' };
    await db.prepare('INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run([
        `LOG-${Date.now()}`, complaint.id, auditTypeMap[decision], reviewer || 'Senior Reviewer',
        `Official Decision: ${decision}`, decisionNotes || `Reviewer recorded: ${decision}.`, now
      ]);

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PATCH /complaints/:id/decision]', err.message);
    res.status(500).json({ success: false, error: 'Failed to record decision.' });
  }
});

// PATCH /api/complaints/:id/reopen — evidence-based reopening
router.patch('/:id/reopen', async (req, res) => {
  try {
    const { reason, evidencePhotoUrl, reopenedBy, role } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Reason for reopening is required.' });
    }

    const db = getDb();
    const row = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Complaint not found.' });

    const complaint = rowToComplaint(row);
    const now = new Date().toISOString();
    const actorName = reopenedBy || 'Concerned Citizen';
    const actorRole = role || 'CITIZEN';

    const newEvidence = evidencePhotoUrl ? [{
      id: `EVD-REOPEN-${Date.now()}`,
      complaintId: complaint.id,
      fileName: 'reopen_evidence.jpg',
      fileType: 'image/jpeg',
      url: evidencePhotoUrl,
      storageDriver: 'demo_inline',
      uploadedBy: actorName,
      uploadedAt: now,
      verificationStatus: 'Reopened Dispute Evidence'
    }] : [];

    const historyEntry = {
      id: `SH-${Date.now()}`,
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: 'Reopened',
      changedBy: actorName,
      actorRole: actorRole,
      reason: `Evidence-based Reopening: "${reason.trim()}"`,
      timestamp: now,
    };

    const updatedResolution = {
      ...(complaint.resolutionData || {}),
      reopenedReason: reason.trim(),
      reopenedEvidencePhotoUrl: evidencePhotoUrl || null,
      reopenedAt: now,
      reopenedBy: actorName,
      status: 'Reopened',
      officialDecision: null,
    };

    const updatedEvidence = [...(complaint.evidence || []), ...newEvidence];
    const updatedHistory = [...(complaint.statusHistory || []), historyEntry];

    await db.prepare(`
      UPDATE complaints SET
        status = 'Reopened',
        resolution_data = ?,
        evidence = ?,
        status_history = ?
      WHERE id = ?
    `).run([
      JSON.stringify(updatedResolution),
      JSON.stringify(updatedEvidence),
      JSON.stringify(updatedHistory),
      complaint.id
    ]);

    await db.prepare('INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run([
        `LOG-${Date.now()}`,
        complaint.id,
        'TICKET_REOPENED',
        actorName,
        'Ticket Reopened with Evidence',
        `Dispute registered: "${reason.trim()}". Status reverted to Reopened for department reassessment.`,
        now
      ]);

    const updated = {
      ...complaint,
      status: 'Reopened',
      resolutionData: updatedResolution,
      evidence: updatedEvidence,
      statusHistory: updatedHistory,
    };

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PATCH /complaints/:id/reopen]', err.message);
    res.status(500).json({ success: false, error: 'Failed to reopen complaint.' });
  }
});

// PATCH /api/complaints/:id/appreciate — toggle upvote
router.patch('/:id/appreciate', async (req, res) => {
  try {
    const { citizenId } = req.body;
    if (!citizenId) return res.status(400).json({ success: false, error: 'citizenId required.' });

    const db = getDb();
    const row = await db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Complaint not found.' });

    const complaint = rowToComplaint(row);
    const existing = complaint.appreciations || [];
    const updated = existing.includes(citizenId) ? existing.filter(id => id !== citizenId) : [...existing, citizenId];

    await db.prepare('UPDATE complaints SET appreciations=? WHERE id=?').run([JSON.stringify(updated), complaint.id]);
    res.json({ success: true, data: { appreciations: updated } });
  } catch (err) {
    console.error('[PATCH /complaints/:id/appreciate]', err.message);
    res.status(500).json({ success: false, error: 'Failed to update appreciation.' });
  }
});

// PATCH /api/complaints/:id/feedback — citizen feedback
router.patch('/:id/feedback', async (req, res) => {
  try {
    const { rating, comment, citizenId } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, error: 'rating must be 1-5.' });

    const db = getDb();
    const row = await db.prepare('SELECT id FROM complaints WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Complaint not found.' });

    const feedback = { rating, comment: comment || '', citizenId: citizenId || 'anonymous', submittedAt: new Date().toISOString() };
    await db.prepare('UPDATE complaints SET feedback=? WHERE id=?').run([JSON.stringify(feedback), req.params.id]);

    await db.prepare('INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run([
        `LOG-${Date.now()}`, req.params.id, 'CITIZEN_FEEDBACK', 'Citizen Portal',
        `Citizen Rated Resolution (${rating}/5 Stars)`, comment || `${rating}-star rating submitted.`, new Date().toISOString()
      ]);

    res.json({ success: true, data: feedback });
  } catch (err) {
    console.error('[PATCH /complaints/:id/feedback]', err.message);
    res.status(500).json({ success: false, error: 'Failed to submit feedback.' });
  }
});

// POST /api/complaints/check-sla — batch escalate overdue complaints
router.post('/check-sla', async (req, res) => {
  try {
    const db = getDb();
    const rows = await db.prepare("SELECT * FROM complaints WHERE status != 'Resolved'").all();
    const now = Date.now();
    let newlyEscalated = 0;

    for (const row of rows) {
      const c = rowToComplaint(row);
      if (c.status === 'Escalated') continue;
      if (!c.deadline) continue;

      const deadlineMs = new Date(c.deadline).getTime();
      if (now > deadlineMs) {
        const timestamp = new Date().toISOString();
        const historyEntry = { id: `SH-${Date.now()}-${c.id}`, complaintId: c.id, fromStatus: c.status, toStatus: 'Escalated', changedBy: 'NAGARAKSHA SLA Sentinel', actorRole: 'system_ai', reason: 'Automated escalation: SLA deadline exceeded.', timestamp };
        const updatedHistory = [...(c.statusHistory || []), historyEntry];
        await db.prepare("UPDATE complaints SET status='Escalated', status_history=? WHERE id=?").run([JSON.stringify(updatedHistory), c.id]);
        await db.prepare('INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run([`LOG-${Date.now()}-${c.id}`, c.id, 'AUTO_ESCALATION', 'NAGARAKSHA SLA Sentinel', 'Deadline Exceeded: Auto-Escalated', `Complaint exceeded ${c.slaHours}h SLA. Auto-escalated to Zonal Authority.`, timestamp]);
        newlyEscalated++;
      }
    }

    const updatedRows = await db.prepare('SELECT * FROM complaints ORDER BY created_at DESC').all();
    res.json({ success: true, newlyEscalated, data: updatedRows.map(rowToComplaint) });
  } catch (err) {
    console.error('[POST /complaints/check-sla]', err.message);
    res.status(500).json({ success: false, error: 'SLA check failed.' });
  }
});

// POST /api/complaints/reset-demo — restore to demo seed
router.post('/reset-demo', async (req, res) => {
  try {
    const db = getDb();
    await db.prepare('DELETE FROM audit_logs').run();
    await db.prepare('DELETE FROM complaints').run();

    const { seedDemoData } = await import('../seed.js');
    await seedDemoData();

    const rows = await db.prepare('SELECT * FROM complaints ORDER BY created_at DESC').all();
    const logs = await db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC').all();
    res.json({
      success: true,
      message: 'Demo data reset successfully.',
      complaintsCount: rows.length,
      data: rows.map(rowToComplaint),
      auditLogs: logs.map(r => ({
        id: r.id, complaintId: r.complaint_id, type: r.type,
        actor: r.actor, title: r.title, description: r.description,
        timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp
      }))
    });
  } catch (err) {
    console.error('[POST /complaints/reset-demo]', err.message);
    res.status(500).json({ success: false, error: 'Reset failed: ' + err.message });
  }
});

export default router;
