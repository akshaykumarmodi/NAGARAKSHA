import React, { useState } from 'react'
import { 
  X, 
  Sparkles, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RotateCcw, 
  ShieldAlert, 
  ArrowRight,
  FileCheck,
  Send,
  Camera,
  MapPin,
  Calendar,
  AlertOctagon,
  UserCheck,
  Heart,
  Star
} from 'lucide-react'
import { DEPARTMENTS, PRIORITIES, STATUSES } from '../data/constants'
import { getDeadlineStatus, formatDateTime } from '../utils/timeUtils'
import { SAMPLE_IMAGES } from '../data/seedData'
import { useLanguage } from '../utils/LanguageContext'
import { 
  createStatusHistoryEntry, 
  USER_ROLES, 
  COMPLAINT_STATUS 
} from '../services/schema'

export function ComplaintDetailModal({ 
  complaint, 
  onClose, 
  onUpdateComplaint, 
  onAddAuditLog,
  auditLogs = [],
  currentUser
}) {
  const { t, tCat, tStatus, tPriority } = useLanguage()
  if (!complaint) return null

  const isCitizen = currentUser && String(currentUser.role).toUpperCase() === 'CITIZEN'
  const isAuthority = !isCitizen

  // Resolution submission state (Worker role)
  const [showSubmitResolution, setShowSubmitResolution] = useState(false)
  const [workerNotes, setWorkerNotes] = useState('')
  const [resolutionPhoto, setResolutionPhoto] = useState(SAMPLE_IMAGES.resolvedEvidence)

  // Rejection state (Reviewer role)
  const [showRejectBox, setShowRejectBox] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [feedbackComment, setFeedbackComment] = useState('')

  // Reopen with evidence state (for resolved complaints)
  const [showReopenBox, setShowReopenBox] = useState(false)
  const [reopenReason, setReopenReason] = useState('')
  const [reopenPhoto, setReopenPhoto] = useState(SAMPLE_IMAGES.pothole)

  // Reassign department state
  const [isReassigning, setIsReassigning] = useState(false)
  const [selectedDept, setSelectedDept] = useState(complaint.department || 'General Civic Services')

  const deadline = getDeadlineStatus(complaint.deadline, complaint.status)

  // Filter audit logs for this specific complaint
  const complaintLogs = auditLogs.filter(l => l.complaintId === complaint.id)

  // Handler: Reassign Department
  const handleDepartmentReassign = () => {
    if (selectedDept === complaint.department) {
      setIsReassigning(false)
      return
    }

    const now = new Date().toISOString()
    const historyEntry = createStatusHistoryEntry({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: complaint.status,
      changedBy: 'Municipal Supervisor (Demo)',
      actorRole: USER_ROLES.AUTHORITY,
      reason: `Department reassigned from "${complaint.department}" to "${selectedDept}"`,
      timestamp: now
    })

    const updated = {
      ...complaint,
      department: selectedDept,
      statusHistory: [...(complaint.statusHistory || []), historyEntry]
    }

    onUpdateComplaint(updated)
    onAddAuditLog({
      complaintId: complaint.id,
      type: 'DEPARTMENT_REASSIGNED',
      actor: 'Municipal Supervisor (Demo)',
      title: 'Department Manually Reassigned',
      description: `Reassigned from "${complaint.department}" to "${selectedDept}".`
    })

    setIsReassigning(false)
  }

  // Handler: Start work (Assign / In Progress)
  const handleStartWork = () => {
    const now = new Date().toISOString()
    const historyEntry = createStatusHistoryEntry({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: COMPLAINT_STATUS.IN_PROGRESS,
      changedBy: 'Dispatch Desk',
      actorRole: USER_ROLES.AUTHORITY,
      reason: `Crew mobilized from ${complaint.department} for on-site inspection and repair`,
      timestamp: now
    })

    const updated = {
      ...complaint,
      status: COMPLAINT_STATUS.IN_PROGRESS,
      assignment: {
        assignedTo: 'Field Operations Crew',
        assignedDepartment: complaint.department,
        assignedAt: now,
        assignedBy: 'Dispatch Desk'
      },
      statusHistory: [...(complaint.statusHistory || []), historyEntry]
    }

    onUpdateComplaint(updated)
    onAddAuditLog({
      complaintId: complaint.id,
      type: 'WORK_STARTED',
      actor: 'Dispatch Desk',
      title: 'Field Crew Dispatched & Work Started',
      description: `Crew mobilized from ${complaint.department} for on-site inspection and repair.`
    })
  }

  // Handler: Field worker submits resolution evidence
  const handleWorkerSubmitResolution = (e) => {
    e.preventDefault()
    if (!workerNotes.trim()) return

    const now = new Date().toISOString()
    const historyEntry = createStatusHistoryEntry({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: COMPLAINT_STATUS.AWAITING_VERIFICATION,
      changedBy: 'Field Repair Lead (Demo)',
      actorRole: USER_ROLES.AUTHORITY,
      reason: `Worker submitted resolution evidence: "${workerNotes.trim()}"`,
      timestamp: now
    })

    const updated = {
      ...complaint,
      status: COMPLAINT_STATUS.AWAITING_VERIFICATION,
      resolutionData: {
        submittedAt: now,
        submittedBy: 'Field Repair Lead (Demo)',
        notes: workerNotes.trim(),
        evidencePhotoUrl: resolutionPhoto,
        status: 'Pending Review',
        officialDecision: null
      },
      statusHistory: [...(complaint.statusHistory || []), historyEntry]
    }

    onUpdateComplaint(updated)
    onAddAuditLog({
      complaintId: complaint.id,
      type: 'EVIDENCE_SUBMITTED',
      actor: 'Field Worker (Demo)',
      title: 'Resolution Evidence Submitted',
      description: `Worker submitted repair proof: "${workerNotes.trim()}". Status moved to Awaiting Verification.`
    })

    setShowSubmitResolution(false)
  }

  // Handler: Reviewer approves resolution proof (Official Decision)
  const handleApproveResolution = () => {
    const now = new Date().toISOString()
    const historyEntry = createStatusHistoryEntry({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: COMPLAINT_STATUS.RESOLVED,
      changedBy: 'Senior Municipal Engineer (Demo)',
      actorRole: USER_ROLES.AUTHORITY,
      reason: 'Official Reviewer Approval: Photographic proof verified and case closed.',
      timestamp: now
    })

    const updated = {
      ...complaint,
      status: COMPLAINT_STATUS.RESOLVED,
      resolutionData: {
        ...(complaint.resolutionData || {}),
        status: 'Approved',
        officialDecision: 'Approved',
        approvedAt: now,
        approvedBy: 'Senior Municipal Engineer (Demo)'
      },
      statusHistory: [...(complaint.statusHistory || []), historyEntry]
    }

    onUpdateComplaint(updated)
    onAddAuditLog({
      complaintId: complaint.id,
      type: 'RESOLUTION_APPROVED',
      actor: 'Senior Reviewer (Demo)',
      title: 'Official Resolution Approved & Case Closed',
      description: 'Supervising reviewer inspected photo evidence and recorded official closure approval.'
    })
  }

  // Handler: Reviewer rejects resolution proof (Official Decision)
  const handleRejectResolution = (e) => {
    e.preventDefault()
    if (!rejectReason.trim()) return

    const now = new Date().toISOString()
    const historyEntry = createStatusHistoryEntry({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: COMPLAINT_STATUS.REOPENED,
      changedBy: 'Senior Reviewer (Demo)',
      actorRole: USER_ROLES.AUTHORITY,
      reason: `Official Reviewer Rejection: "${rejectReason.trim()}". Returned to department for rework.`,
      timestamp: now
    })

    const updated = {
      ...complaint,
      status: COMPLAINT_STATUS.REOPENED,
      resolutionData: {
        ...(complaint.resolutionData || {}),
        status: 'Rejected',
        officialDecision: 'Rejected',
        rejectedAt: now,
        rejectedBy: 'Senior Reviewer (Demo)',
        rejectionReason: rejectReason.trim()
      },
      statusHistory: [...(complaint.statusHistory || []), historyEntry]
    }

    onUpdateComplaint(updated)
    onAddAuditLog({
      complaintId: complaint.id,
      type: 'RESOLUTION_REJECTED',
      actor: 'Senior Reviewer (Demo)',
      title: 'Resolution Proof Rejected • Ticket Reopened',
      description: `Evidence rejected due to: "${rejectReason.trim()}". Returned to department for rework.`
    })

    setShowRejectBox(false)
    setRejectReason('')
  }

  // Handler: Reopen resolved ticket with evidence
  const handleReopenWithEvidence = (e) => {
    e.preventDefault()
    if (!reopenReason.trim()) return

    const now = new Date().toISOString()
    const actorName = currentUser?.name || 'Concerned Citizen'
    const actorRole = isCitizen ? USER_ROLES.CITIZEN : USER_ROLES.AUTHORITY

    const newEvidence = reopenPhoto ? [{
      id: `EVD-REOPEN-${Date.now()}`,
      complaintId: complaint.id,
      fileName: 'reopen_evidence.jpg',
      fileType: 'image/jpeg',
      url: reopenPhoto,
      storageDriver: 'demo_inline',
      uploadedBy: actorName,
      uploadedAt: now,
      verificationStatus: 'Reopened Dispute Evidence'
    }] : []

    const historyEntry = createStatusHistoryEntry({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: COMPLAINT_STATUS.REOPENED,
      changedBy: actorName,
      actorRole: actorRole,
      reason: `Evidence-based Reopening: "${reopenReason.trim()}". Returned for departmental reassessment.`,
      timestamp: now
    })

    const updated = {
      ...complaint,
      status: COMPLAINT_STATUS.REOPENED,
      evidence: [...(complaint.evidence || []), ...newEvidence],
      resolutionData: {
        ...(complaint.resolutionData || {}),
        status: 'Reopened',
        officialDecision: null,
        reopenedAt: now,
        reopenedBy: actorName,
        reopenedReason: reopenReason.trim(),
        reopenedEvidencePhotoUrl: reopenPhoto || null
      },
      statusHistory: [...(complaint.statusHistory || []), historyEntry]
    }

    onUpdateComplaint(updated)
    onAddAuditLog({
      complaintId: complaint.id,
      type: 'TICKET_REOPENED',
      actor: actorName,
      title: 'Ticket Reopened with Evidence',
      description: `Dispute registered: "${reopenReason.trim()}". New photo evidence attached. Reopened for field reassessment.`
    })

    setShowReopenBox(false)
    setReopenReason('')
  }

  // Handler: Escalate ticket manually
  const handleEscalate = () => {
    const now = new Date().toISOString()
    const historyEntry = createStatusHistoryEntry({
      complaintId: complaint.id,
      fromStatus: complaint.status,
      toStatus: COMPLAINT_STATUS.ESCALATED,
      changedBy: 'SLA Escalation Officer',
      actorRole: USER_ROLES.AUTHORITY,
      reason: 'Manual supervisory override triggered due to community impact and impending deadline breach.',
      timestamp: now
    })

    const updated = {
      ...complaint,
      status: COMPLAINT_STATUS.ESCALATED,
      statusHistory: [...(complaint.statusHistory || []), historyEntry]
    }
    onUpdateComplaint(updated)
    onAddAuditLog({
      complaintId: complaint.id,
      type: 'MANUAL_ESCALATION',
      actor: 'SLA Escalation Officer',
      title: 'Complaint Escalated to Zonal Authority',
      description: 'Supervisory override triggered due to community impact and impending deadline breach.'
    })
  }

  // Handler: Confirm or dismiss duplicate
  const handleLinkDuplicate = (dupId) => {
    const existing = complaint.duplicateIds || []
    if (existing.includes(dupId)) return

    const updated = {
      ...complaint,
      duplicateIds: [...existing, dupId]
    }
    onUpdateComplaint(updated)
    onAddAuditLog({
      complaintId: complaint.id,
      type: 'DUPLICATE_LINKED',
      actor: 'Triage Reviewer',
      title: 'Duplicate Confirmed & Linked',
      description: `Linked ticket ${complaint.id} to parent ticket ${dupId} to prevent double crew dispatch.`
    })
  }

  // Handler: Citizen Appreciation toggle
  const handleToggleAppreciation = () => {
    const currentAppreciations = complaint.appreciations || []
    const hasAppreciated = currentAppreciations.includes('CIT-CURRENT')
    const updatedList = hasAppreciated 
      ? currentAppreciations.filter(id => id !== 'CIT-CURRENT')
      : [...currentAppreciations, 'CIT-CURRENT']
    
    const updated = {
      ...complaint,
      appreciations: updatedList
    }
    onUpdateComplaint(updated)
  }

  // Handler: Citizen Feedback submission
  const handleRatingSubmit = (score) => {
    const updated = {
      ...complaint,
      feedback: {
        rating: score,
        comment: feedbackComment || 'Resolution verified by community resident.',
        citizenId: complaint.citizenId || 'CIT-CURRENT',
        submittedAt: new Date().toISOString()
      }
    }
    onUpdateComplaint(updated)
    onAddAuditLog({
      complaintId: complaint.id,
      type: 'CITIZEN_FEEDBACK',
      actor: 'Citizen Portal',
      title: `Citizen Satisfaction Rating: ${score}/5 Stars`,
      description: feedbackComment ? `Citizen feedback: "${feedbackComment}"` : 'Citizen recorded satisfaction rating.'
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--navy-900)' }}>
              {complaint.id}
            </span>
            <span className={`badge ${
              complaint.status === 'Resolved' ? 'badge-success' : 
              complaint.status === 'Escalated' ? 'badge-danger' : 
              complaint.status === 'Awaiting Verification' ? 'badge-info' : 
              complaint.status === 'In Progress' ? 'badge-warning' : 'badge-primary'
            }`}>
              {tStatus(complaint.status)}
            </span>
            <span className={`badge ${
              complaint.priority === 'Critical' ? 'badge-danger' : 
              complaint.priority === 'High' ? 'badge-warning' : 'badge-neutral'
            }`}>
              {tPriority(complaint.priority)} {t('priority', 'Priority')}
            </span>
          </div>

          <button 
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Title & Core Details */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
              {complaint.title}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: 'var(--slate-500)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={14} color="var(--primary)" />
                <span>{complaint.area}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} />
                <span>{t('filed', 'Filed')}: {formatDateTime(complaint.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className={`badge ${deadline.badgeClass}`}>
                  <Clock size={12} />
                  {deadline.label}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--slate-700)', lineHeight: 1.6, background: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              {complaint.description}
            </p>
          </div>

          {/* Citizen Photo & Evidence Metadata (if present) */}
          {complaint.photoUrl && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                  {t('citizen_photo')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    {complaint.evidence?.fileName || 'evidence_attachment.jpg'} ({complaint.evidence?.fileSize ? `${Math.round(complaint.evidence.fileSize / 1024)} KB` : '184 KB'})
                  </span>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    {complaint.evidence?.verificationStatus || 'SHA-256 Validated'}
                  </span>
                </div>
              </div>
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--slate-300)', maxHeight: '200px' }}>
                <img src={complaint.photoUrl} alt="Complaint evidence" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              </div>
              <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                * Ready for Cloud Object Storage (S3/R2 presigned URLs). Browser localStorage holds demo cache only.
              </div>
            </div>
          )}

          {/* Citizen Identity & Privacy Safeguards (DB Ready Architecture) */}
          <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--slate-50)', border: '1px solid var(--slate-200)', padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem', color: 'var(--navy-900)' }}>
                <UserCheck size={16} color="var(--primary)" />
                <span>Citizen Identity & Privacy Record</span>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                Internal ID: {complaint.citizenId || 'CIT-2026-9042'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
              <div>
                <span style={{ color: 'var(--slate-400)' }}>Citizen Handle:</span>{' '}
                <strong style={{ color: 'var(--navy-800)' }}>{complaint.citizenName || 'Resident (Ward 42)'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-400)' }}>Protected Contact:</span>{' '}
                <strong style={{ color: 'var(--navy-800)' }}>{complaint.citizenPhone || '+91 98765-XXXXX'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-400)' }}>Identity Tier:</span>{' '}
                <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>Demo Verified</span>
              </div>
              <div>
                <span style={{ color: 'var(--slate-400)' }}>Account Standing:</span>{' '}
                <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>Good Standing</span>
              </div>
            </div>
            <div style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--slate-500)', lineHeight: 1.4, borderTop: '1px dashed var(--slate-200)', paddingTop: '0.4rem' }}>
              <strong>Privacy Architecture:</strong> Internal citizen IDs decouple identity verification from complaint verification. Aadhaar integration requires an authorized UIDAI service agency and statutory consent flows. No raw Aadhaar/biometric data is stored.
            </div>
          </div>

          {/* AI Intelligence Panel */}
          <div className="ai-intelligence-card" style={{ marginBottom: '1.5rem' }}>
            <div className="ai-header">
              <div className="ai-header-title">
                <Sparkles size={18} />
                <span>NAGARAKSHAK</span>
              </div>
              <span className="ai-label-pill">{t('rule_based_demo', 'Rule-based demo analysis')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)' }}>{t('classified_category')}</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy-900)' }}>{tCat(complaint.category)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)' }}>{t('routed_dept')}</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)' }}>{complaint.department}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)' }}>{t('sla_target')}</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-saffron)' }}>{complaint.slaHours || 48} {t('standard_hours')}</div>
              </div>
            </div>

            {/* Reasoning list */}
            {complaint.analysis && complaint.analysis.reasoning && (
              <ul className="ai-reasoning-list" style={{ marginBottom: '1rem' }}>
                {complaint.analysis.reasoning.map((r, i) => (
                  <li key={i} className="ai-reasoning-item">
                    <span style={{ color: 'var(--teal-600)', marginTop: '2px' }}>•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Possible Duplicate Warning Box */}
            {complaint.analysis && complaint.analysis.possibleDuplicates && complaint.analysis.possibleDuplicates.length > 0 && (
              <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warning)', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Copy size={16} />
                    <span>{t('potential_duplicate')} ({complaint.analysis.possibleDuplicates[0].score}% match)</span>
                  </div>
                  <span className="badge badge-warning">{t('action_required_reviewer', 'Action Required')}</span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--navy-800)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  {t('matches_active_complaint')} <strong>{complaint.analysis.possibleDuplicates[0].matchedId}</strong> ("{complaint.analysis.possibleDuplicates[0].matchedTitle}").
                  {' '}{t('both_tickets_similar')}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleLinkDuplicate(complaint.analysis.possibleDuplicates[0].matchedId)}
                    disabled={complaint.duplicateIds && complaint.duplicateIds.includes(complaint.analysis.possibleDuplicates[0].matchedId)}
                  >
                    <Check size={14} />
                    <span>
                      {complaint.duplicateIds && complaint.duplicateIds.includes(complaint.analysis.possibleDuplicates[0].matchedId) 
                        ? t('duplicate_linked') 
                        : t('confirm_link')}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Department Management Section */}
          <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.92rem', color: 'var(--navy-900)' }}>
                <Building2 size={16} color="var(--primary)" />
                <span>{t('dept_routing')}</span>
              </div>
              {isAuthority && (
                !isReassigning ? (
                  <button 
                    className="btn btn-subtle btn-sm"
                    onClick={() => setIsReassigning(true)}
                  >
                    {t('change_dept')}
                  </button>
                ) : (
                  <button 
                    className="btn btn-subtle btn-sm"
                    onClick={() => setIsReassigning(false)}
                  >
                    {t('cancel')}
                  </button>
                )
              )}
            </div>

            {!isReassigning ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                {t('assigned_to')}: <strong style={{ color: 'var(--navy-900)' }}>{complaint.department}</strong>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select 
                  className="form-select"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {Object.values(DEPARTMENTS).map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleDepartmentReassign}
                >
                  {t('save_route')}
                </button>
              </div>
            )}
          </div>

          {/* Two-Party Resolution Verification Workflow Box */}
          <div className="card" style={{ 
            marginBottom: '1.5rem', 
            border: complaint.status === 'Awaiting Verification' ? '2px solid var(--primary)' : '1px solid var(--slate-200)',
            background: complaint.status === 'Awaiting Verification' ? 'var(--info-bg)' : 'var(--bg-card)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy-900)' }}>
                <FileCheck size={18} color="var(--primary)" />
                <span>{t('resolution_workflow')}</span>
              </div>
              <span className={`badge ${
                complaint.status === 'Resolved' ? 'badge-success' : 
                complaint.status === 'Awaiting Verification' ? 'badge-info' : 'badge-neutral'
              }`}>
                {complaint.status === 'Resolved' ? t('verified_closed') : 
                 complaint.status === 'Awaiting Verification' ? t('action_required_reviewer') : t('in_field_queue')}
              </span>
            </div>

            {/* State A: Complaint is Resolved */}
            {complaint.status === 'Resolved' && (
              <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 700, marginBottom: '0.4rem' }}>
                  <CheckCircle2 size={18} />
                  <span>{t('verified_closed_by_supervisor')}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--success)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  {complaint.resolutionData && complaint.resolutionData.notes ? complaint.resolutionData.notes : t('default_resolution_notes', 'Field repair executed and photographic proof signed off.')}
                </p>
                {complaint.resolutionData && complaint.resolutionData.evidencePhotoUrl && (
                  <div style={{ maxHeight: '160px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success-border)', marginBottom: '0.75rem' }}>
                    <img src={complaint.resolutionData.evidencePhotoUrl} alt="Approved repair proof" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  </div>
                )}

                {/* Citizen Community Appreciation & Satisfaction Rating */}
                <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--success-border)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button 
                      className={`btn btn-sm ${complaint.appreciations?.includes('CIT-CURRENT') ? 'btn-primary' : 'btn-subtle'}`}
                      onClick={handleToggleAppreciation}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Heart size={14} fill={complaint.appreciations?.includes('CIT-CURRENT') ? 'currentColor' : 'none'} />
                      <span>{complaint.appreciations?.includes('CIT-CURRENT') ? 'Appreciated' : 'Appreciate Crew'} ({complaint.appreciations?.length || 0})</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--slate-600)' }}>Resident Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRatingSubmit(star)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem' }}
                          title={`Rate ${star} Stars`}
                        >
                          <Star 
                            size={16} 
                            color={star <= (complaint.feedback?.rating || 5) ? '#f59e0b' : '#cbd5e1'} 
                            fill={star <= (complaint.feedback?.rating || 5) ? '#f59e0b' : 'none'} 
                          />
                        </button>
                      ))}
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-900)', marginLeft: '0.25rem' }}>
                        {complaint.feedback?.rating ? `${complaint.feedback.rating}/5` : '5/5 Verified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evidence-Based Reopening Action */}
                {!showReopenBox ? (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--success-border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => setShowReopenBox(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <RotateCcw size={14} />
                      <span>{t('reopen_issue_persists', 'Issue Persists? Reopen with Evidence')}</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleReopenWithEvidence} style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--danger-border)', background: 'var(--danger-bg)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <RotateCcw size={15} />
                      <span>{t('reopen_evidence_title', 'Evidence-Based Reopening')}</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                      {t('reopen_evidence_desc', 'If the issue was not resolved properly or has reappeared, explain the problem and submit evidence to reopen this ticket.')}
                    </p>
                    <textarea 
                      className="form-textarea"
                      rows="2"
                      placeholder={t('reopen_reason_place', 'e.g. Patch broke open again after heavy rainfall; asphalt washed away...')}
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      required
                      style={{ marginBottom: '0.5rem', width: '100%', fontSize: '0.82rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button type="submit" className="btn btn-danger btn-sm">
                        {t('confirm_reopen_evidence', 'Confirm Reopening with Evidence')}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-subtle btn-sm"
                        onClick={() => { setShowReopenBox(false); setReopenReason('') }}
                      >
                        {t('cancel', 'Cancel')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* State B: Complaint is Awaiting Verification (Reviewer must approve or reject) */}
            {complaint.status === 'Awaiting Verification' && (
              <div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--info-border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--info)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    {t('worker_submitted_proof')}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--navy-800)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    "{complaint.resolutionData?.notes || t('worker_default_notes', 'Field repair completed as per municipal standard.')}"
                  </p>

                  {complaint.resolutionData?.evidencePhotoUrl && (
                    <div style={{ maxHeight: '180px', overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid var(--info-border)', marginBottom: '0.75rem' }}>
                      <img src={complaint.resolutionData.evidencePhotoUrl} alt="Worker evidence" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    {t('submitted_by', 'Submitted by')}: <strong>{complaint.resolutionData?.submittedBy || 'Field Worker'}</strong> • {formatDateTime(complaint.resolutionData?.submittedAt)}
                  </div>
                </div>

                {isAuthority ? (
                  !showRejectBox ? (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-success"
                        onClick={handleApproveResolution}
                      >
                        <CheckCircle2 size={16} />
                        <span>{t('approve_resolution')}</span>
                      </button>
                      <button 
                        className="btn btn-outline-danger"
                        onClick={() => setShowRejectBox(true)}
                      >
                        <RotateCcw size={16} />
                        <span>{t('reject_evidence')}</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRejectResolution} style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                        {t('reason_for_rejecting')}
                      </div>
                      <textarea 
                        className="form-textarea"
                        rows="2"
                        placeholder="e.g. Incomplete repair, debris left on street, or photo does not match location..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        style={{ marginBottom: '0.75rem' }}
                        required
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-danger btn-sm">
                          {t('confirm_rejection')}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-subtle btn-sm"
                          onClick={() => setShowRejectBox(false)}
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </form>
                  )
                ) : (
                  <div style={{ background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', fontSize: '0.82rem', color: 'var(--info)' }}>
                    🕒 <strong>{t('pending_signoff_notice', 'Pending Official Sign-off: Field repair proof has been submitted by the assigned department and is currently undergoing supervisory review.')}</strong>
                  </div>
                )}
              </div>
            )}

            {/* State C: Complaint is Submitted, AI Verified, In Progress, or Reopened */}
            {complaint.status !== 'Resolved' && complaint.status !== 'Awaiting Verification' && (
              <div>
                {complaint.status === 'AI Verified' && (
                  <div style={{ background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--info)' }}>
                    ✓ <strong>AI Verified:</strong> Ticket routed directly to Authority Queue for field crew dispatch.
                  </div>
                )}
                {complaint.status === 'Needs More Evidence' && (
                  <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--warning)' }}>
                    ⚠ <strong>Needs More Evidence:</strong> Low confidence score requires citizen clarification or officer inspection.
                  </div>
                )}

                {isAuthority ? (
                  !showSubmitResolution ? (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {(complaint.status === 'Submitted' || complaint.status === 'AI Verified' || complaint.status === 'Needs More Evidence' || complaint.status === 'Flagged for Review') && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={handleStartWork}
                        >
                          <Send size={14} />
                          <span>{t('dispatch_crew')}</span>
                        </button>
                      )}

                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowSubmitResolution(true)}
                      >
                        <Camera size={14} />
                        <span>{t('simulate_worker_upload')}</span>
                      </button>

                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleEscalate}
                        title="Trigger supervisor escalation"
                      >
                        <AlertOctagon size={14} />
                        <span>{t('escalate_manually', 'Escalate to Zonal Supervisor')}</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleWorkerSubmitResolution} style={{ background: 'var(--slate-50)', border: '1px solid var(--slate-200)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy-900)', marginBottom: '0.4rem' }}>
                        {t('simulate_worker_upload', 'Field Worker Resolution Proof Submission')}
                      </div>
                      <textarea 
                        className="form-textarea"
                        rows="2"
                        placeholder="e.g. Pothole filled with cold-mix asphalt, leveled with static roller. Road reopened to traffic."
                        value={workerNotes}
                        onChange={(e) => setWorkerNotes(e.target.value)}
                        style={{ marginBottom: '0.75rem' }}
                        required
                      />

                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '0.35rem' }}>
                          {t('simulated_repair_proof_photo', 'Simulated Repair Proof Photo:')}
                        </div>
                        <div style={{ maxHeight: '140px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-300)' }}>
                          <img src={resolutionPhoto} alt="Proof" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary btn-sm">
                          {t('submit_review')}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-subtle btn-sm"
                          onClick={() => setShowSubmitResolution(false)}
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </form>
                  )
                ) : (
                  <div style={{ background: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '0.85rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={15} color="var(--primary)" />
                      <span>Citizen Tracking Status</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', margin: 0, lineHeight: 1.45 }}>
                      Your report is registered in the municipal dispatch system. Real-time updates and timestamped status events will appear below as municipal teams take action.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Transition History (Workflow Audit) */}
          {complaint.statusHistory && complaint.statusHistory.length > 0 && (
            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-900)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={15} color="var(--primary)" />
                <span>Status Transition History ({complaint.statusHistory.length} Recorded Steps)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {complaint.statusHistory.map((step, idx) => (
                  <div key={step.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.8rem', padding: '0.5rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ minWidth: '130px', color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                      {formatDateTime(step.timestamp)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', marginRight: '0.35rem' }}>{step.fromStatus}</span>
                        →
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', marginLeft: '0.35rem' }}>{step.toStatus}</span>
                      </div>
                      <div style={{ color: 'var(--slate-600)', marginTop: '0.2rem' }}>
                        {step.reason}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', marginTop: '0.15rem' }}>
                        Officer/Actor: <strong>{step.changedBy}</strong> ({step.role})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline / Audit Trail */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              {t('chronological_audit')} ({complaintLogs.length} {t('events', 'Events')}):
            </div>

            {complaintLogs.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', fontStyle: 'italic' }}>
                {t('no_events_yet')}
              </div>
            ) : (
              <div className="timeline">
                {complaintLogs.map(log => (
                  <div key={log.id} className="timeline-item">
                    <div className={`timeline-dot ${
                      log.type?.includes('ESCALAT') ? 'danger' : 
                      log.type?.includes('RESOLV') ? 'success' : 'warning'
                    }`} />
                    <div className="timeline-title">{log.title}</div>
                    <div className="timeline-meta">
                      {formatDateTime(log.timestamp)} • {t('actor', 'Actor')}: {log.actor}
                    </div>
                    <div className="timeline-desc">{log.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('close_inspection')}
          </button>
        </div>
      </div>
    </div>
  )
}
