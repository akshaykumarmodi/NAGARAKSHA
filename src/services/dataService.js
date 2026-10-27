/**
 * NAGARAKSHA — Centralized Data & Service Layer
 * 
 * Architecture Note:
 * This service layer acts as the single source of truth and data access boundary for the entire application.
 * All UI components interact exclusively through this service.
 * In this demo edition, an in-memory cache synchronized with browser storage is used.
 * When migrating to a real backend (e.g. Node/Express, FastAPI, PostgreSQL, Supabase),
 * only the storage driver functions in this file need to be replaced with HTTP/Fetch calls.
 * UI components will require zero rewrites.
 */

import { generateSeedData } from '../data/seedData.js';
import { 
  USER_ROLES, 
  COMPLAINT_STATUS, 
  KYC_STATUS, 
  ACCOUNT_STATUS,
  createCitizenModel, 
  createStatusHistoryEntry, 
  createSlaEventModel,
  createEvidenceModel
} from './schema.js';
import { getDeadlineStatus } from '../utils/timeUtils.js';

// Storage keys
const DB_VERSION = 'v2';
const NAGARAKSHA_DB_KEY = `nagaraksha_civic_db_${DB_VERSION}`;

// Legacy keys for seamless migration from earlier session
const LEGACY_COMPLAINTS_KEY = 'civicfix_ai_complaints_v1';
const LEGACY_AUDIT_KEY = 'civicfix_ai_audit_v1';

/**
 * Default mock authority staff roster
 */
export const DEFAULT_AUTHORITY_USERS = [
  { id: 'AUTH-ROAD-101', name: 'Engineer Priya Sundaram', department: 'Roads & Infrastructure Department', role: USER_ROLES.AUTHORITY },
  { id: 'AUTH-SANI-102', name: 'Inspector Rajesh Verma', department: 'Sanitation Department', role: USER_ROLES.AUTHORITY },
  { id: 'AUTH-ELEC-103', name: 'Officer Amit Kulkarni', department: 'Electrical & Lighting Department', role: USER_ROLES.AUTHORITY },
  { id: 'AUTH-WATR-104', name: 'Superintendent Sarah Khan', department: 'Water Supply & Sewerage Board', role: USER_ROLES.AUTHORITY },
  { id: 'AUTH-ZONL-105', name: 'Zonal Chief Administrator', department: 'Municipal Administration', role: USER_ROLES.ADMIN }
];

/**
 * Normalize and enrich a raw complaint object with relational models
 */
function normalizeComplaintRecord(raw, index = 0) {
  const citizenId = raw.citizenId || `CIT-2026-${1000 + (index % 50) + 1}`;
  const now = new Date().toISOString();

  // Ensure evidence array
  const evidence = Array.isArray(raw.evidence) ? raw.evidence : [
    createEvidenceModel({
      complaintId: raw.id,
      fileName: 'initial_grievance_proof.jpg',
      url: raw.photoUrl || '',
      uploadedBy: citizenId,
      uploadedAt: raw.createdAt || now
    })
  ];

  // Ensure statusHistory array
  const statusHistory = Array.isArray(raw.statusHistory) && raw.statusHistory.length > 0 
    ? raw.statusHistory 
    : [
        createStatusHistoryEntry({
          complaintId: raw.id,
          fromStatus: null,
          toStatus: raw.status || COMPLAINT_STATUS.SUBMITTED,
          changedBy: raw.isDemo ? 'NAGARAKSHA Demo Engine' : 'Citizen Portal',
          actorRole: raw.isDemo ? USER_ROLES.SYSTEM : USER_ROLES.CITIZEN,
          reason: 'Initial grievance submission and automated triage',
          timestamp: raw.createdAt || now
        })
      ];

  // Ensure SLA timeline events
  const slaEvents = Array.isArray(raw.slaEvents) ? raw.slaEvents : [
    createSlaEventModel({
      complaintId: raw.id,
      eventType: 'DEADLINE_ASSIGNED',
      timestamp: raw.createdAt || now,
      hoursRemaining: raw.slaHours || 24,
      actor: 'NAGARAKSHA Intelligence Engine',
      notes: `Deterministic SLA deadline set to ${raw.slaHours || 24} hours.`
    })
  ];

  return {
    ...raw,
    citizenId,
    citizenName: raw.citizenName || 'Verified Citizen',
    citizenContactMasked: raw.citizenContactMasked || '+91 98765-XXXXX',
    citizenWard: raw.citizenWard || 'Ward 8',
    isDemo: raw.isDemo !== undefined ? raw.isDemo : true,
    evidence,
    statusHistory,
    slaEvents,
    appreciations: Array.isArray(raw.appreciations) ? raw.appreciations : [],
    feedback: raw.feedback || null,
    resolutionData: raw.resolutionData ? {
      ...raw.resolutionData,
      officialDecision: raw.resolutionData.officialDecision || (raw.resolutionData.status === 'Approved' ? 'Approved' : null)
    } : null
  };
}

/**
 * Internal Database Store State
 */
class NagarakshaDataService {
  constructor() {
    this.complaints = [];
    this.auditLogs = [];
    this.citizens = [];
    this.authorities = DEFAULT_AUTHORITY_USERS;
    this.initialized = false;
  }

  /**
   * Initialize state from local database or seed
   */
  init() {
    if (this.initialized) return;

    try {
      const rawDb = localStorage.getItem(NAGARAKSHA_DB_KEY);
      if (rawDb) {
        const parsed = JSON.parse(rawDb);
        if (parsed && Array.isArray(parsed.complaints)) {
          this.complaints = parsed.complaints.map(normalizeComplaintRecord);
          this.auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [];
          this.citizens = Array.isArray(parsed.citizens) ? parsed.citizens : [];
          this.authorities = Array.isArray(parsed.authorities) ? parsed.authorities : DEFAULT_AUTHORITY_USERS;
          this.initialized = true;
          return;
        }
      }

      // Check legacy v1 keys for upgrade
      const legacyComplaintsRaw = localStorage.getItem(LEGACY_COMPLAINTS_KEY);
      const legacyAuditRaw = localStorage.getItem(LEGACY_AUDIT_KEY);

      if (legacyComplaintsRaw) {
        const legacyComplaints = JSON.parse(legacyComplaintsRaw);
        const legacyAudit = legacyAuditRaw ? JSON.parse(legacyAuditRaw) : [];

        this.complaints = (Array.isArray(legacyComplaints) ? legacyComplaints : []).map(normalizeComplaintRecord);
        this.auditLogs = Array.isArray(legacyAudit) ? legacyAudit : [];
        this.seedCitizens();
        this.persist();
        this.initialized = true;
        return;
      }

      // Fresh seed initialization
      this.resetToDefaults();
    } catch (err) {
      console.error('Error initializing NagarakshaDataService:', err);
      this.resetToDefaults();
    }
    this.initialized = true;
  }

  seedCitizens() {
    this.citizens = [
      createCitizenModel({ id: 'CIT-2026-1001', name: 'Aarav Sharma', maskedContact: '+91 98765-XXXXX', ward: 'Ward 8' }),
      createCitizenModel({ id: 'CIT-2026-1002', name: 'Meera Iyer', maskedContact: '+91 98234-XXXXX', ward: 'Sector 4' }),
      createCitizenModel({ id: 'CIT-2026-1003', name: 'Rohan Deshmukh', maskedContact: '+91 97112-XXXXX', ward: 'Central Ward' }),
      createCitizenModel({ id: 'CIT-2026-1004', name: 'Kavita Reddy', maskedContact: '+91 96443-XXXXX', ward: 'Ward 8' })
    ];
  }

  /**
   * Persist current state to storage
   */
  persist() {
    try {
      const payload = {
        version: DB_VERSION,
        exportedAt: new Date().toISOString(),
        isMockDatabase: true, // Clearly documented mock storage
        complaints: this.complaints,
        auditLogs: this.auditLogs,
        citizens: this.citizens,
        authorities: this.authorities
      };
      localStorage.setItem(NAGARAKSHA_DB_KEY, JSON.stringify(payload));
      
      // Also write to legacy keys for backwards-compatibility with any external hooks
      localStorage.setItem(LEGACY_COMPLAINTS_KEY, JSON.stringify(this.complaints));
      localStorage.setItem(LEGACY_AUDIT_KEY, JSON.stringify(this.auditLogs));
    } catch (err) {
      console.error('Error persisting Nagaraksha database:', err);
    }
  }

  /**
   * Reset database back to default presentation seed
   */
  resetToDefaults() {
    const { complaints: rawComplaints, auditLogs } = generateSeedData();
    this.complaints = rawComplaints.map(normalizeComplaintRecord);
    this.auditLogs = auditLogs || [];
    this.seedCitizens();
    this.authorities = DEFAULT_AUTHORITY_USERS;
    this.persist();
    return {
      complaints: this.complaints,
      auditLogs: this.auditLogs
    };
  }

  // =========================================================================
  // Complaints API Interface
  // =========================================================================

  getComplaints() {
    this.init();
    return [...this.complaints];
  }

  getComplaintById(id) {
    this.init();
    return this.complaints.find(c => c.id === id) || null;
  }

  /**
   * Create a new complaint record with relational citizen link & evidence
   */
  createComplaint(complaintDraft, citizenInfo = {}) {
    this.init();
    const citizenId = citizenInfo.id || `CIT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create or register citizen if not exists
    if (!this.citizens.find(c => c.id === citizenId)) {
      this.citizens.push(createCitizenModel({
        id: citizenId,
        name: citizenInfo.name || 'Verified Citizen',
        maskedContact: citizenInfo.maskedContact || '+91 98765-XXXXX',
        ward: complaintDraft.area || 'Ward 8'
      }));
    }

    const normalized = normalizeComplaintRecord({
      ...complaintDraft,
      citizenId,
      citizenName: citizenInfo.name || 'Verified Citizen',
      citizenContactMasked: citizenInfo.maskedContact || '+91 98765-XXXXX',
      isDemo: false // User-created tickets are not presentation demo tickets
    });

    this.complaints = [normalized, ...this.complaints];
    this.persist();
    return normalized;
  }

  /**
   * Generic complaint update
   */
  updateComplaint(updatedComplaint) {
    this.init();
    this.complaints = this.complaints.map(c => c.id === updatedComplaint.id ? updatedComplaint : c);
    this.persist();
    return updatedComplaint;
  }

  /**
   * Record a formal Status Transition with immutable statusHistory entry
   */
  recordStatusTransition(complaintId, { nextStatus, reason, actor = 'Authorized Officer', actorRole = USER_ROLES.AUTHORITY }) {
    this.init();
    const target = this.getComplaintById(complaintId);
    if (!target) return null;

    const historyEntry = createStatusHistoryEntry({
      complaintId,
      fromStatus: target.status,
      toStatus: nextStatus,
      changedBy: actor,
      actorRole,
      reason: reason || `Status updated to ${nextStatus}`,
      timestamp: new Date().toISOString()
    });

    const updated = {
      ...target,
      status: nextStatus,
      statusHistory: [...(target.statusHistory || []), historyEntry]
    };

    return this.updateComplaint(updated);
  }

  /**
   * Assign complaint to department/field crew
   */
  assignComplaint(complaintId, { assignedTo, department, assignedBy = 'Dispatch Desk' }) {
    this.init();
    const target = this.getComplaintById(complaintId);
    if (!target) return null;

    const now = new Date().toISOString();
    const historyEntry = createStatusHistoryEntry({
      complaintId,
      fromStatus: target.status,
      toStatus: COMPLAINT_STATUS.IN_PROGRESS,
      changedBy: assignedBy,
      actorRole: USER_ROLES.AUTHORITY,
      reason: `Assigned to ${assignedTo} (${department}) for on-site inspection and repair`,
      timestamp: now
    });

    const updated = {
      ...target,
      status: COMPLAINT_STATUS.IN_PROGRESS,
      department: department || target.department,
      assignment: {
        assignedTo,
        assignedDepartment: department || target.department,
        assignedAt: now,
        assignedBy
      },
      statusHistory: [...(target.statusHistory || []), historyEntry]
    };

    this.appendAuditLog({
      complaintId,
      type: 'WORK_STARTED',
      actor: assignedBy,
      title: 'Field Crew Dispatched & Work Started',
      description: `Assigned to ${assignedTo} from ${department || target.department}. Status updated to In Progress.`
    });

    return this.updateComplaint(updated);
  }

  /**
   * Field Worker submits resolution evidence for official review
   */
  submitResolutionEvidence(complaintId, { workerNotes, resolutionPhotoUrl, submittedBy = 'Field Officer' }) {
    this.init();
    const target = this.getComplaintById(complaintId);
    if (!target) return null;

    const now = new Date().toISOString();
    const historyEntry = createStatusHistoryEntry({
      complaintId,
      fromStatus: target.status,
      toStatus: COMPLAINT_STATUS.AWAITING_VERIFICATION,
      changedBy: submittedBy,
      actorRole: USER_ROLES.AUTHORITY,
      reason: `Worker submitted resolution evidence: "${workerNotes}"`,
      timestamp: now
    });

    const updated = {
      ...target,
      status: COMPLAINT_STATUS.AWAITING_VERIFICATION,
      resolutionData: {
        submittedAt: now,
        submittedBy,
        notes: workerNotes,
        evidencePhotoUrl: resolutionPhotoUrl,
        status: 'Pending Review',
        officialDecision: null
      },
      statusHistory: [...(target.statusHistory || []), historyEntry]
    };

    this.appendAuditLog({
      complaintId,
      type: 'EVIDENCE_SUBMITTED',
      actor: submittedBy,
      title: 'Resolution Proof Uploaded for Verification',
      description: `Worker reported repair completion: "${workerNotes}". Status moved to Awaiting Verification.`
    });

    return this.updateComplaint(updated);
  }

  /**
   * Official Authority Decision (Approve / Reject / Re-investigate)
   */
  decideOfficialResolution(complaintId, { decision, decisionNotes = '', reviewer = 'Senior Reviewer (Demo)' }) {
    this.init();
    const target = this.getComplaintById(complaintId);
    if (!target) return null;

    const now = new Date().toISOString();
    let nextStatus = COMPLAINT_STATUS.RESOLVED;
    let auditType = 'RESOLUTION_APPROVED';
    let auditTitle = 'Official Resolution Approved & Case Closed';

    if (decision === 'Rejected') {
      nextStatus = COMPLAINT_STATUS.REOPENED;
      auditType = 'RESOLUTION_REJECTED';
      auditTitle = 'Resolution Proof Rejected • Ticket Reopened';
    } else if (decision === 'Needs Re-investigation') {
      nextStatus = COMPLAINT_STATUS.IN_PROGRESS;
      auditType = 'REINVESTIGATION_REQUESTED';
      auditTitle = 'Additional On-Site Investigation Requested';
    }

    const historyEntry = createStatusHistoryEntry({
      complaintId,
      fromStatus: target.status,
      toStatus: nextStatus,
      changedBy: reviewer,
      actorRole: USER_ROLES.AUTHORITY,
      reason: `Official Reviewer Decision: ${decision}. Notes: ${decisionNotes || 'Official sign-off recorded.'}`,
      timestamp: now
    });

    const updated = {
      ...target,
      status: nextStatus,
      resolutionData: {
        ...(target.resolutionData || {}),
        status: decision,
        officialDecision: decision,
        decisionNotes,
        decidedAt: now,
        decidedBy: reviewer,
        ...(decision === 'Approved' ? { approvedAt: now, approvedBy: reviewer } : {}),
        ...(decision === 'Rejected' ? { rejectedAt: now, rejectedBy: reviewer, rejectionReason: decisionNotes } : {})
      },
      statusHistory: [...(target.statusHistory || []), historyEntry]
    };

    this.appendAuditLog({
      complaintId,
      type: auditType,
      actor: reviewer,
      title: auditTitle,
      description: decisionNotes ? `Decision: ${decision} — "${decisionNotes}"` : `Reviewer recorded official decision: ${decision}.`
    });

    return this.updateComplaint(updated);
  }

  /**
   * Citizen Feedback
   */
  submitCitizenFeedback(complaintId, { rating, comment, citizenId }) {
    this.init();
    const target = this.getComplaintById(complaintId);
    if (!target) return null;

    const feedback = {
      rating,
      comment,
      citizenId: citizenId || target.citizenId,
      submittedAt: new Date().toISOString()
    };

    const updated = {
      ...target,
      feedback
    };

    this.appendAuditLog({
      complaintId,
      type: 'CITIZEN_FEEDBACK',
      actor: 'Citizen Portal',
      title: `Citizen Rated Resolution (${rating}/5 Stars)`,
      description: comment ? `Feedback: "${comment}"` : `Citizen recorded a ${rating}-star satisfaction score.`
    });

    return this.updateComplaint(updated);
  }

  /**
   * Community Appreciation / Upvote
   */
  toggleCitizenAppreciation(complaintId, citizenId = 'CIT-CURRENT') {
    this.init();
    const target = this.getComplaintById(complaintId);
    if (!target) return null;

    const existing = target.appreciations || [];
    const hasAppreciated = existing.includes(citizenId);
    const updatedAppreciations = hasAppreciated 
      ? existing.filter(id => id !== citizenId)
      : [...existing, citizenId];

    const updated = {
      ...target,
      appreciations: updatedAppreciations
    };

    return this.updateComplaint(updated);
  }

  // =========================================================================
  // Audit Logs API Interface
  // =========================================================================

  getAuditLogs() {
    this.init();
    return [...this.auditLogs];
  }

  appendAuditLog(entry) {
    this.init();
    const newEntry = {
      id: entry.id || `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.auditLogs = [newEntry, ...this.auditLogs];
    this.persist();
    return [...this.auditLogs];
  }

  /**
   * Check SLA compliance and trigger escalations
   */
  checkSlaEscalations() {
    this.init();
    let newlyEscalated = 0;

    const updated = this.complaints.map(c => {
      if (c.status === COMPLAINT_STATUS.RESOLVED) return c;

      const stat = getDeadlineStatus(c.deadline, c.status);
      if (stat.isOverdue && c.status !== COMPLAINT_STATUS.ESCALATED) {
        newlyEscalated++;
        
        const now = new Date().toISOString();
        const historyEntry = createStatusHistoryEntry({
          complaintId: c.id,
          fromStatus: c.status,
          toStatus: COMPLAINT_STATUS.ESCALATED,
          changedBy: 'NAGARAKSHA SLA Sentinel',
          actorRole: USER_ROLES.SYSTEM,
          reason: 'Automated escalation triggered: Response window exceeded without verified closure',
          timestamp: now
        });

        const slaEvent = createSlaEventModel({
          complaintId: c.id,
          eventType: 'BREACHED',
          timestamp: now,
          hoursRemaining: 0,
          actor: 'NAGARAKSHA SLA Sentinel',
          notes: 'SLA threshold breached. Dispatched alert to Zonal Chief.'
        });

        this.appendAuditLog({
          complaintId: c.id,
          type: 'AUTO_ESCALATION',
          actor: 'NAGARAKSHA SLA Sentinel',
          title: 'Deadline Exceeded: Auto-Escalated',
          description: `Complaint exceeded designated ${c.slaHours}h SLA deadline. Auto-escalated to Zonal Authority.`
        });

        return {
          ...c,
          status: COMPLAINT_STATUS.ESCALATED,
          statusHistory: [...(c.statusHistory || []), historyEntry],
          slaEvents: [...(c.slaEvents || []), slaEvent]
        };
      }
      return c;
    });

    this.complaints = updated;
    this.persist();
    return {
      newlyEscalated,
      updatedComplaints: [...this.complaints],
      updatedLogs: [...this.auditLogs]
    };
  }

  // =========================================================================
  // Database Migration & Export / Import Interface
  // =========================================================================

  /**
   * Generates a complete, relational JSON payload ready for migration to PostgreSQL or MongoDB
   */
  exportDatabasePayload() {
    this.init();
    return {
      meta: {
        system: 'NAGARAKSHA Civic Management Platform',
        version: DB_VERSION,
        exportedAt: new Date().toISOString(),
        format: 'relational_json_dump',
        note: 'Formatted for direct import into PostgreSQL DDL tables or MongoDB collections.'
      },
      entities: {
        citizens: this.citizens,
        authorities: this.authorities,
        complaints: this.complaints,
        auditLogs: this.auditLogs
      }
    };
  }

  /**
   * Imports and validates a database payload
   */
  importDatabasePayload(input) {
    try {
      const data = typeof input === 'string' ? JSON.parse(input) : input;
      const entities = data.entities || data;

      if (!Array.isArray(entities.complaints)) {
        throw new Error('Invalid database payload: missing complaints array.');
      }

      this.complaints = entities.complaints.map(normalizeComplaintRecord);
      this.auditLogs = Array.isArray(entities.auditLogs) ? entities.auditLogs : [];
      this.citizens = Array.isArray(entities.citizens) ? entities.citizens : [];
      this.authorities = Array.isArray(entities.authorities) ? entities.authorities : DEFAULT_AUTHORITY_USERS;
      this.persist();

      return {
        success: true,
        complaintsCount: this.complaints.length,
        auditLogsCount: this.auditLogs.length
      };
    } catch (err) {
      console.error('Failed to import database payload:', err);
      return { success: false, error: err.message };
    }
  }
}

// Singleton export
export const dataService = new NagarakshaDataService();
