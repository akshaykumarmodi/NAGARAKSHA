/**
 * NAGARAKSHA — Demo Seed Data for Backend
 * Creates realistic demo complaints in PostgreSQL / SQLite on first startup.
 * Seed data is clearly marked with isDemo=true.
 */

import { getDb, complaintToRow, hashPassword } from './db.js';
import { v4 as uuidv4 } from 'uuid';

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}
function calculateDeadline(createdAt, slaHours) {
  return new Date(new Date(createdAt).getTime() + slaHours * 3600 * 1000).toISOString();
}

export async function seedUsers() {
  const db = getDb();
  const existingUsers = await db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  const count = Number(existingUsers?.cnt || 0);

  if (count === 0) {
    const now = new Date().toISOString();
    const defaultUsers = [
      {
        id: 'CIT-2026-9042',
        username: '9876543210',
        password_hash: hashPassword('123456'),
        role: 'CITIZEN',
        name: 'Arun Kumar',
        email: 'citizen@nagarakshak.demo',
        phone: '9876543210',
        ward: 'Ward 42 (Indiranagar)',
        department: null,
        badge_number: null,
        designation: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'OFF-BBMP-402',
        username: 'KA-GOV-8821',
        password_hash: hashPassword('admin123'),
        role: 'AUTHORITY',
        name: 'Rajesh Varma',
        email: 'officer@nagarakshak.demo',
        phone: '+91 98450-12345',
        ward: null,
        department: 'Municipal Operations Command',
        badge_number: 'KA-GOV-8821',
        designation: 'Zonal Dispatch Officer',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'ADM-BBMP-001',
        username: 'admin',
        password_hash: hashPassword('admin123'),
        role: 'ADMIN',
        name: 'Commissioner S. Sharma',
        email: 'admin@nagarakshak.demo',
        phone: '+91 98450-99999',
        ward: null,
        department: 'Municipal Headquarters',
        badge_number: 'KA-ADMIN-01',
        designation: 'Chief Municipal Administrator',
        created_at: now,
        updated_at: now,
      }
    ];

    for (const u of defaultUsers) {
      const exists = await db.prepare('SELECT id FROM users WHERE id = ? OR username = ?').get(u.id, u.username);
      if (!exists) {
        await db.prepare(`
          INSERT INTO users (id, username, password_hash, role, name, email, phone, ward, department, badge_number, designation, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run([u.id, u.username, u.password_hash, u.role, u.name, u.email, u.phone, u.ward, u.department, u.badge_number, u.designation, u.created_at, u.updated_at]);
      }
    }
    console.log('[Seed] ✅ Default users seeded (Citizen, Officer, Admin).');
  }
}

const SAMPLE_IMAGES = {
  pothole1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23334155"/><path d="M0 260 L600 260" stroke="%23cbd5e1" stroke-width="4" stroke-dasharray="15,15"/><ellipse cx="320" cy="240" rx="140" ry="60" fill="%230f172a"/><ellipse cx="330" cy="245" rx="110" ry="40" fill="%23020617"/><circle cx="270" cy="235" r="15" fill="%23475569"/><text x="40" y="60" fill="%23f8fafc" font-family="sans-serif" font-weight="bold" font-size="22">CIVIC-SAMPLE: Deep Road Pothole</text><text x="40" y="90" fill="%2394a3b8" font-family="sans-serif" font-size="14">Location: Hillview 5th Cross • Hazard: 2-Wheelers at night</text></svg>`,
  garbage1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f1f5f9"/><rect x="180" y="160" width="240" height="180" rx="8" fill="%2315803d"/><path d="M160 160 L440 160" stroke="%2314532d" stroke-width="8"/><circle cx="220" cy="220" r="28" fill="%23ea580c"/><rect x="280" y="190" width="70" height="90" fill="%23e2e8f0"/><text x="40" y="60" fill="%230f172a" font-family="sans-serif" font-weight="bold" font-size="22">CIVIC-SAMPLE: Overflowing Dumpster</text><text x="40" y="90" fill="%23475569" font-family="sans-serif" font-size="14">Location: Sector 4 Market • Stench affecting residential area</text></svg>`,
  garbageDuplicate: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f8fafc"/><rect x="190" y="170" width="220" height="170" rx="6" fill="%23166534"/><circle cx="230" cy="230" r="30" fill="%23f97316"/><rect x="290" y="200" width="80" height="100" fill="%23cbd5e1"/><text x="40" y="60" fill="%230f172a" font-family="sans-serif" font-weight="bold" font-size="22">CIVIC-SAMPLE: Waste Spillage Near School Gate</text><text x="40" y="90" fill="%2364748b" font-family="sans-serif" font-size="14">Location: Sector 4 Main Road • Reported by School Teacher</text></svg>`,
  streetlight1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23090d16"/><line x1="300" y1="120" x2="300" y2="380" stroke="%23475569" stroke-width="12"/><path d="M300 120 C300 70, 360 70, 370 100" fill="none" stroke="%23475569" stroke-width="8"/><circle cx="370" cy="110" r="16" fill="%23334155"/><text x="40" y="60" fill="%23f8fafc" font-family="sans-serif" font-weight="bold" font-size="22">CIVIC-SAMPLE: Dark Streetlight</text><text x="40" y="90" fill="%2394a3b8" font-family="sans-serif" font-size="14">Location: Oakridge Ward 8 • Pedestrians avoiding stretch</text></svg>`,
  waterLeak1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f0f9ff"/><ellipse cx="300" cy="270" rx="200" ry="70" fill="%2338bdf8"/><ellipse cx="300" cy="270" rx="140" ry="45" fill="%230284c7"/><line x1="280" y1="180" x2="320" y2="240" stroke="%230369a1" stroke-width="16"/><text x="40" y="60" fill="%230f172a" font-family="sans-serif" font-weight="bold" font-size="22">CIVIC-SAMPLE: Water Pipeline Burst</text><text x="40" y="90" fill="%230369a1" font-family="sans-serif" font-size="14">Location: Riverdale Lane • Clean water flooding road</text></svg>`,
  resolvedEvidence: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e293b"/><rect x="0" y="240" width="600" height="160" fill="%230f172a"/><circle cx="530" cy="70" r="34" fill="%2322c55e"/><path d="M518 70 L527 79 L544 60" fill="none" stroke="%23ffffff" stroke-width="4" stroke-linecap="round"/><text x="40" y="60" fill="%23f8fafc" font-family="sans-serif" font-weight="bold" font-size="22">RESOLUTION PROOF: Road Repaired</text><text x="40" y="90" fill="%2386efac" font-family="sans-serif" font-size="14">Contractor Team: Roads Div 3 • Verified by Engineer</text></svg>`
};

export async function seedDemoData() {
  const db = getDb();

  // Always ensure default users exist
  await seedUsers();

  // Check if demo complaints already exist
  const existing = await db.prepare('SELECT COUNT(*) as cnt FROM complaints WHERE is_demo = 1').get();
  const count = Number(existing?.cnt || 0);
  if (count > 0) {
    console.log(`[Seed] Demo data already present (${count} demo complaints). Skipping complaint seeding.`);
    return;
  }

  console.log('[Seed] Inserting demo complaints...');

  const tOverdue = hoursAgo(54);
  const tDuplicate1 = hoursAgo(18);
  const tDuplicate2 = hoursAgo(3);
  const tReview = hoursAgo(12);
  const tInProgress = hoursAgo(8);
  const tResolved = hoursAgo(72);

  const demoComplaints = [
    {
      id: 'CFX-2026-1001',
      title: 'Dangerous 2-foot crater pothole near primary school crosswalk',
      description: 'Massive pothole opened up right after heavy rains. Multiple two-wheelers have skidded and students from the nearby primary school cross here daily.',
      category: 'Pothole/Road Damage',
      area: 'Oakridge Ward 8, Opp. City Primary School',
      department: 'Roads & Infrastructure Department',
      priority: 'Critical',
      slaHours: 12,
      status: 'Escalated',
      createdAt: tOverdue,
      deadline: calculateDeadline(tOverdue, 12),
      photoUrl: SAMPLE_IMAGES.pothole1,
      citizenId: 'CIT-2026-8812',
      citizenName: 'Meera Sharma (Parent Assoc.)',
      citizenContactMasked: '+91 98450-XXXXX',
      citizenWard: 'Ward 8 (Oakridge)',
      isDemo: true,
      duplicateIds: [],
      analysis: {
        engineType: 'Rule-based triage (NAGARAKSHAK Engine)',
        suggestedCategory: 'Pothole/Road Damage',
        categoryConfidence: 'Keyword analysis (crater, road, school)',
        recommendedDepartment: 'Roads & Infrastructure Department',
        recommendedPriority: 'Critical',
        slaHours: 12,
        reasoning: [
          'High pedestrian footfall and school zone detected.',
          'Critical 12-hour SLA assigned due to active injury hazard for two-wheelers.',
          'Flagged for immediate asphalt cold-mix dispatch.'
        ],
        possibleDuplicates: [],
        hasDuplicates: false,
        recommendedNextAction: 'Dispatch emergency road repair gang.',
        timestamp: tOverdue,
      },
      evidence: [{ id: 'EVD-1001-1', complaintId: 'CFX-2026-1001', fileName: 'pothole_crater_evidence.jpg', url: SAMPLE_IMAGES.pothole1, uploadedBy: 'Meera Sharma', uploadedAt: tOverdue, verificationStatus: 'AI Verified' }],
      statusHistory: [
        { id: 'SH-1001-1', complaintId: 'CFX-2026-1001', fromStatus: null, toStatus: 'Submitted', changedBy: 'Citizen Portal', actorRole: 'CITIZEN', reason: 'Initial citizen report registered.', timestamp: tOverdue },
        { id: 'SH-1001-2', complaintId: 'CFX-2026-1001', fromStatus: 'Submitted', toStatus: 'AI Verified', changedBy: 'NAGARAKSHAK Triage Engine', actorRole: 'system_ai', reason: 'Critical priority validated (school zone keywords).', timestamp: tOverdue },
        { id: 'SH-1001-3', complaintId: 'CFX-2026-1001', fromStatus: 'AI Verified', toStatus: 'Escalated', changedBy: 'NAGARAKSHAK SLA Sentinel', actorRole: 'system_ai', reason: 'Automated escalation: 12-hour SLA expired without field dispatch.', timestamp: hoursAgo(2) }
      ],
      slaEvents: [
        { id: 'SLA-1001-1', complaintId: 'CFX-2026-1001', eventType: 'DEADLINE_ASSIGNED', timestamp: tOverdue, hoursRemaining: 12, actor: 'System', notes: 'Critical 12h SLA initialized.' },
        { id: 'SLA-1001-2', complaintId: 'CFX-2026-1001', eventType: 'ESCALATION_TRIGGERED', timestamp: hoursAgo(2), hoursRemaining: 0, actor: 'NAGARAKSHAK SLA Sentinel', notes: 'Overdue by 40+ hours. Auto-escalated to Zonal Authority.' }
      ],
    },
    {
      id: 'CFX-2026-1002',
      title: 'Overflowing municipal dumpster spilling onto pedestrian footpath',
      description: 'The green community bin behind Sector 4 vegetable market has not been emptied for 4 days. Waste is spilling over into the drainage channel and attracting stray animals.',
      category: 'Garbage',
      area: 'Sector 4 Market Lane, Indiranagar',
      department: 'Sanitation Department',
      priority: 'High',
      slaHours: 24,
      status: 'In Progress',
      createdAt: tDuplicate1,
      deadline: calculateDeadline(tDuplicate1, 24),
      photoUrl: SAMPLE_IMAGES.garbage1,
      citizenId: 'CIT-2026-9042',
      citizenName: 'Arun Kumar',
      citizenContactMasked: '+91 98765-XXXXX',
      citizenWard: 'Ward 42 (Indiranagar)',
      isDemo: true,
      duplicateIds: ['CFX-2026-1005'],
      assignment: { assignedTo: 'Sanitation Truck 14 (Crew B)', assignedDepartment: 'Sanitation Department', assignedAt: tInProgress, assignedBy: 'Zonal Dispatch Officer' },
      statusHistory: [
        { id: 'SH-1002-1', complaintId: 'CFX-2026-1002', fromStatus: null, toStatus: 'Submitted', changedBy: 'Citizen Portal', actorRole: 'CITIZEN', reason: 'Report filed.', timestamp: tDuplicate1 },
        { id: 'SH-1002-2', complaintId: 'CFX-2026-1002', fromStatus: 'Submitted', toStatus: 'In Progress', changedBy: 'Inspector Rajesh Verma', actorRole: 'AUTHORITY', reason: 'Sanitation Truck 14 dispatched for container replacement.', timestamp: tInProgress }
      ],
      slaEvents: [{ id: 'SLA-1002-1', complaintId: 'CFX-2026-1002', eventType: 'DEADLINE_ASSIGNED', timestamp: tDuplicate1, hoursRemaining: 24, actor: 'System', notes: '24h SLA set.' }],
    },
    {
      id: 'CFX-2026-1003',
      title: 'Underground drinking water main cracked and flooding road',
      description: 'Major potable water pipe burst under the asphalt. Clean drinking water has been flowing constantly for over 6 hours, creating waterlogging up to 1 foot deep.',
      category: 'Water Leakage',
      area: 'Riverdale Lane, 3rd Block, Jayanagar',
      department: 'Water Supply & Sewerage Board',
      priority: 'High',
      slaHours: 24,
      status: 'Awaiting Verification',
      createdAt: hoursAgo(14),
      deadline: calculateDeadline(hoursAgo(14), 24),
      photoUrl: SAMPLE_IMAGES.waterLeak1,
      citizenId: 'CIT-2026-3190',
      citizenName: 'Deepa Narayanan',
      citizenContactMasked: '+91 97401-XXXXX',
      citizenWard: 'Ward 15 (Jayanagar)',
      isDemo: true,
      duplicateIds: [],
      resolutionData: {
        submittedAt: hoursAgo(2),
        submittedBy: 'Field Worker Sundar (Water Div)',
        notes: 'Main 6-inch GI pipe clamp replaced with heavy-duty sleeve. Flow restored and road trench filled with gravel. Requesting official closure.',
        evidencePhotoUrl: SAMPLE_IMAGES.resolvedEvidence,
        status: 'Pending Review',
        officialDecision: null,
      },
      statusHistory: [
        { id: 'SH-1003-1', complaintId: 'CFX-2026-1003', fromStatus: null, toStatus: 'Submitted', changedBy: 'Citizen Portal', actorRole: 'CITIZEN', reason: 'Pipe burst reported.', timestamp: hoursAgo(14) },
        { id: 'SH-1003-2', complaintId: 'CFX-2026-1003', fromStatus: 'Submitted', toStatus: 'In Progress', changedBy: 'Water Board Dispatch', actorRole: 'AUTHORITY', reason: 'Plumbing gang deployed.', timestamp: hoursAgo(10) },
        { id: 'SH-1003-3', complaintId: 'CFX-2026-1003', fromStatus: 'In Progress', toStatus: 'Awaiting Verification', changedBy: 'Field Worker Sundar', actorRole: 'AUTHORITY', reason: 'Pipe repaired and photographic proof uploaded.', timestamp: hoursAgo(2) }
      ],
      slaEvents: [{ id: 'SLA-1003-1', complaintId: 'CFX-2026-1003', eventType: 'DEADLINE_ASSIGNED', timestamp: hoursAgo(14), hoursRemaining: 24, actor: 'System', notes: '24h SLA set.' }],
    },
    {
      id: 'CFX-2026-1004',
      title: 'Four consecutive streetlights unlit near metro walkway',
      description: 'Entire 100-meter stretch completely dark every night after 7 PM. Working women and elderly citizens feel unsafe returning from metro station.',
      category: 'Streetlight',
      area: 'Metro Feeder Road, Ward 22, Rajajinagar',
      department: 'Electrical & Lighting Department',
      priority: 'Medium',
      slaHours: 48,
      status: 'Needs More Evidence',
      createdAt: tReview,
      deadline: calculateDeadline(tReview, 48),
      photoUrl: null,
      citizenId: 'CIT-2026-4401',
      citizenName: 'Kavitha R.',
      citizenContactMasked: '+91 99002-XXXXX',
      citizenWard: 'Ward 22 (Rajajinagar)',
      isDemo: true,
      duplicateIds: [],
      statusHistory: [{ id: 'SH-1004-1', complaintId: 'CFX-2026-1004', fromStatus: null, toStatus: 'Needs More Evidence', changedBy: 'NAGARAKSHAK Triage Engine', actorRole: 'system_ai', reason: 'Submitted without photo proof. Flagged for review.', timestamp: tReview }],
      slaEvents: [{ id: 'SLA-1004-1', complaintId: 'CFX-2026-1004', eventType: 'DEADLINE_ASSIGNED', timestamp: tReview, hoursRemaining: 48, actor: 'System', notes: '48h SLA set.' }],
    },
    {
      id: 'CFX-2026-1005',
      title: 'Commercial garbage piled up outside market entrance near fruit stalls',
      description: 'Vendor waste and rotten fruit boxes dumped directly on the pavement. Flies and severe foul smell spreading into nearby medical store.',
      category: 'Garbage',
      area: 'Sector 4 Main Road (Outside Market Gate 2)',
      department: 'Sanitation Department',
      priority: 'High',
      slaHours: 24,
      status: 'Flagged for Review',
      createdAt: tDuplicate2,
      deadline: calculateDeadline(tDuplicate2, 24),
      photoUrl: SAMPLE_IMAGES.garbageDuplicate,
      citizenId: 'CIT-2026-7821',
      citizenName: 'Suresh Gowda (Shopkeeper)',
      citizenContactMasked: '+91 94480-XXXXX',
      citizenWard: 'Ward 42 (Indiranagar)',
      isDemo: true,
      duplicateIds: ['CFX-2026-1002'],
      analysis: {
        engineType: 'Rule-based triage (NAGARAKSHAK Engine)',
        suggestedCategory: 'Garbage',
        categoryConfidence: 'Category overlap (Garbage)',
        recommendedDepartment: 'Sanitation Department',
        recommendedPriority: 'High',
        slaHours: 24,
        reasoning: [
          'High location proximity match with existing active ticket CFX-2026-1002 in Sector 4 Market.',
          'Semantic token similarity: 84% match on "dumpster / garbage / waste / pavement".',
          'Flagged as likely duplicate. Reviewer can merge or cross-link tickets.'
        ],
        possibleDuplicates: [{ matchedId: 'CFX-2026-1002', matchedTitle: 'Overflowing municipal dumpster spilling onto pedestrian footpath', matchedStatus: 'In Progress', score: 84, reasons: ['Identical Category: Garbage', 'Geographic proximity: Sector 4 Market', 'Strong keyword overlap (waste, dumpster, pavement)'] }],
        hasDuplicates: true,
        recommendedNextAction: 'Review duplicate relation and link with CFX-2026-1002 before independent truck dispatch.',
        timestamp: tDuplicate2,
      },
      statusHistory: [{ id: 'SH-1005-1', complaintId: 'CFX-2026-1005', fromStatus: null, toStatus: 'Flagged for Review', changedBy: 'NAGARAKSHAK Intelligence Engine', actorRole: 'system_ai', reason: 'Potential duplicate of CFX-2026-1002 (84% score). Flagged for review.', timestamp: tDuplicate2 }],
      slaEvents: [{ id: 'SLA-1005-1', complaintId: 'CFX-2026-1005', eventType: 'DEADLINE_ASSIGNED', timestamp: tDuplicate2, hoursRemaining: 24, actor: 'System', notes: '24h SLA set.' }],
    },
    {
      id: 'CFX-2026-1006',
      title: 'Broken stormwater drain cover replaced and asphalt restored',
      description: 'Heavy iron storm drain grate broke under heavy truck axle. Paved over with new bitumen frame and verified by ward junior engineer.',
      category: 'Pothole/Road Damage',
      area: 'Brigade Road Junction, Ward 11, Central Zone',
      department: 'Roads & Infrastructure Department',
      priority: 'Medium',
      slaHours: 48,
      status: 'Resolved',
      createdAt: tResolved,
      deadline: calculateDeadline(tResolved, 48),
      photoUrl: SAMPLE_IMAGES.resolvedEvidence,
      citizenId: 'CIT-2026-1049',
      citizenName: 'Tanvi Saxena',
      citizenContactMasked: '+91 96111-XXXXX',
      citizenWard: 'Ward 11 (Central)',
      isDemo: true,
      duplicateIds: [],
      resolutionData: {
        submittedAt: hoursAgo(30),
        submittedBy: 'Maintenance Lead R. Nair',
        notes: 'Reinforced 12mm steel mesh grate installed. Concrete cure complete and asphalt sealed.',
        evidencePhotoUrl: SAMPLE_IMAGES.resolvedEvidence,
        status: 'Approved',
        officialDecision: 'Approved',
        decisionNotes: 'Work inspected on site by Junior Engineer. Grate flush with road surface, safe for two-wheeler traffic.',
        approvedAt: hoursAgo(28),
        approvedBy: 'Engineer Priya Sundaram (Ward 11)',
      },
      evidence: [{ id: 'EVD-1006-1', complaintId: 'CFX-2026-1006', fileName: 'resolved_evidence.jpg', url: SAMPLE_IMAGES.resolvedEvidence, uploadedBy: 'Maintenance Lead R. Nair', uploadedAt: hoursAgo(30), verificationStatus: 'AI Verified' }],
      statusHistory: [{ id: 'SH-1006-1', complaintId: 'CFX-2026-1006', fromStatus: 'Awaiting Verification', toStatus: 'Resolved', changedBy: 'Engineer Priya Sundaram', actorRole: 'AUTHORITY', reason: 'Resolution approved.', timestamp: hoursAgo(28) }],
      slaEvents: [{ id: 'SLA-1006-1', complaintId: 'CFX-2026-1006', eventType: 'DEADLINE_ASSIGNED', timestamp: tResolved, hoursRemaining: 48, actor: 'System', notes: '48h SLA set.' }],
    },
  ];

  for (const c of demoComplaints) {
    const exists = await db.prepare('SELECT id FROM complaints WHERE id = ?').get(c.id);
    if (!exists) {
      const row = complaintToRow(c);
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
    }
  }

  // Seed initial audit logs
  const demoLogs = [
    { id: 'LOG-5001', complaint_id: 'CFX-2026-1001', type: 'ESCALATION', actor: 'NAGARAKSHAK SLA Sentinel', title: 'SLA Breach: Auto-Escalated to Zonal Chief', description: 'Complaint exceeded 12-hour critical response window by 42 hours without resolution.', timestamp: hoursAgo(2) },
    { id: 'LOG-5002', complaint_id: 'CFX-2026-1003', type: 'EVIDENCE_SUBMITTED', actor: 'Field Worker Sundar', title: 'Resolution Proof Uploaded for Verification', description: 'Worker reported pipeline clamp replacement and uploaded post-repair verification photo.', timestamp: hoursAgo(2) },
    { id: 'LOG-5003', complaint_id: 'CFX-2026-1005', type: 'DUPLICATE_FLAGGED', actor: 'NAGARAKSHAK Intelligence Engine', title: 'Potential Duplicate Flagged (84% Match)', description: 'Matched with existing ticket CFX-2026-1002 in Sector 4 Market area.', timestamp: hoursAgo(3) },
    { id: 'LOG-5004', complaint_id: 'CFX-2026-1006', type: 'RESOLUTION_APPROVED', actor: 'Engineer Priya Sundaram', title: 'Resolution Evidence Approved & Closed', description: 'Verified photographic evidence of repaired iron drainage grate. Ticket marked Resolved.', timestamp: hoursAgo(28) },
    { id: 'LOG-5005', complaint_id: 'CFX-2026-1002', type: 'WORK_STARTED', actor: 'Inspector Rajesh Verma', title: 'Sanitation Crew Dispatched', description: 'Assigned Sanitation Truck 14 for container lifting and site bleaching.', timestamp: hoursAgo(10) },
  ];

  for (const l of demoLogs) {
    const exists = await db.prepare('SELECT id FROM audit_logs WHERE id = ?').get(l.id);
    if (!exists) {
      await db.prepare(`
        INSERT INTO audit_logs (id, complaint_id, type, actor, title, description, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run([l.id, l.complaint_id, l.type, l.actor, l.title, l.description, l.timestamp]);
    }
  }

  console.log('[Seed] ✅ Demo data verified and seeded.');
}
