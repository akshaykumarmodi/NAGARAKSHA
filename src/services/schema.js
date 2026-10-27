/**
 * NAGARAKSHAK — Civic Complaint & Operations System
 * Centralized Data Models & Schemas
 * 
 * Note: In this demo, data is stored via a centralized storage adapter in the browser.
 * These schemas define the exact contract for future database migration (e.g., PostgreSQL, MongoDB, Supabase).
 */

/**
 * Roles for Role-Based Access Control (RBAC)
 */
export const USER_ROLES = {
  CITIZEN: 'CITIZEN',
  AUTHORITY: 'AUTHORITY',
  AUTHORITY_DISPATCHER: 'AUTHORITY',
  ZONAL_SUPERVISOR: 'AUTHORITY',
  MUNICIPAL_ADMIN: 'ADMIN',
  ADMIN: 'ADMIN',
  SYSTEM: 'system_ai'
};

/**
 * KYC & Identity Status
 */
export const KYC_STATUS = {
  VERIFIED_MOCK: 'Verified (Mock KYC)',
  PENDING: 'Pending Verification',
  UNVERIFIED: 'Unverified'
};

/**
 * Account Status
 */
export const ACCOUNT_STATUS = {
  ACTIVE: 'Active',
  UNDER_REVIEW: 'Under Review',
  RESTRICTED: 'Restricted'
};

/**
 * Evidence Verification Status
 */
export const EVIDENCE_STATUS = {
  PENDING_CHECK: 'Pending Check',
  AI_VERIFIED: 'AI Verified',
  NEEDS_MORE_EVIDENCE: 'Needs More Evidence',
  REJECTED: 'Rejected'
};

/**
 * Workflow Statuses
 */
export const COMPLAINT_STATUS = {
  SUBMITTED: 'Submitted',
  AI_VERIFIED: 'AI Verified',                // AI verification passed -> directly to Authority Queue
  NEEDS_MORE_EVIDENCE: 'Needs More Evidence',  // Missing proof or low confidence
  FLAGGED_FOR_REVIEW: 'Flagged for Review',    // Potential spam/duplicate/abuse
  ASSIGNED: 'Assigned',                        // Assigned to field crew
  IN_PROGRESS: 'In Progress',                  // Work underway
  AWAITING_VERIFICATION: 'Awaiting Verification', // Worker submitted proof of repair
  RESOLVED: 'Resolved',                        // Official reviewer approved closure
  REOPENED: 'Reopened',                        // Reviewer or citizen rejected proof
  ESCALATED: 'Escalated'                       // SLA breached or supervisory escalation
};

/**
 * Official Authority Decision Types
 */
export const OFFICIAL_DECISION = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_REINVESTIGATION: 'Needs Re-investigation'
};

/**
 * Factory for creating a standardized Citizen Entity
 */
export function createCitizenModel({
  id = `CIT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
  name = 'Anonymous Citizen',
  maskedContact = '+91 98765-XXXXX',
  ward = 'Ward 8',
  kycStatus = KYC_STATUS.VERIFIED_MOCK,
  accountStatus = ACCOUNT_STATUS.ACTIVE,
  createdAt = new Date().toISOString()
} = {}) {
  return {
    id,
    name,
    maskedContact,
    ward,
    kycStatus,
    accountStatus,
    createdAt
  };
}

/**
 * Factory for creating Evidence Metadata
 */
export function createEvidenceModel({
  id = `EVD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
  complaintId,
  fileName = 'evidence_photo.jpg',
  fileType = 'image/jpeg',
  fileSizeBytes = 245000,
  url = '',
  storageDriver = 'demo_inline', // In production: 's3_presigned_url'
  uploadedBy = 'Citizen Portal',
  uploadedAt = new Date().toISOString(),
  verificationStatus = EVIDENCE_STATUS.AI_VERIFIED,
  hashSha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
} = {}) {
  return {
    id,
    complaintId,
    fileName,
    fileType,
    fileSizeBytes,
    url,
    storageDriver,
    uploadedBy,
    uploadedAt,
    verificationStatus,
    hashSha256
  };
}

/**
 * Factory for creating a Status History Entry
 */
export function createStatusHistoryEntry({
  id = `SH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
  complaintId,
  fromStatus = null,
  toStatus,
  changedBy = 'NAGARAKSHAK System',
  actorRole = USER_ROLES.SYSTEM,
  reason = 'Status updated',
  timestamp = new Date().toISOString()
} = {}) {
  return {
    id,
    complaintId,
    fromStatus,
    toStatus,
    changedBy,
    actorRole,
    reason,
    timestamp
  };
}

/**
 * Factory for creating an SLA Event
 */
export function createSlaEventModel({
  id = `SLA-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
  complaintId,
  eventType = 'DEADLINE_ASSIGNED',
  timestamp = new Date().toISOString(),
  hoursRemaining = 24,
  actor = 'NAGARAKSHAK SLA Sentinel',
  notes = ''
} = {}) {
  return {
    id,
    complaintId,
    eventType,
    timestamp,
    hoursRemaining,
    actor,
    notes
  };
}
