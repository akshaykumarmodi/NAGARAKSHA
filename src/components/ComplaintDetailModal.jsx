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
  UserCheck
} from 'lucide-react'
import { DEPARTMENTS, PRIORITIES, STATUSES } from '../data/constants'
import { getDeadlineStatus, formatDateTime } from '../utils/timeUtils'
import { SAMPLE_IMAGES } from '../data/seedData'

export function ComplaintDetailModal({ 
  complaint, 
  onClose, 
  onUpdateComplaint, 
  onAddAuditLog,
  auditLogs = [] 
}) {
  if (!complaint) return null

  // Resolution submission state (Worker role)
  const [showSubmitResolution, setShowSubmitResolution] = useState(false)
  const [workerNotes, setWorkerNotes] = useState('')
  const [resolutionPhoto, setResolutionPhoto] = useState(SAMPLE_IMAGES.resolvedEvidence)

  // Rejection state (Reviewer role)
  const [showRejectBox, setShowRejectBox] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

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

    const updated = {
      ...complaint,
      department: selectedDept
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
    const updated = {
      ...complaint,
      status: 'In Progress'
    }
    onUpdateComplaint(updated)
    onAddAuditLog({
      complaintId: complaint.id,
      type: 'WORK_STARTED',
      actor: 'Dispatch Desk',
      title: 'Field Crew Dispatched',
      description: `Crew mobilized from ${complaint.department} for on-site inspection and repair.`
    })
  }

  // Handler: Field worker submits resolution evidence
  const handleWorkerSubmitResolution = (e) => {
    e.preventDefault()
    if (!workerNotes.trim()) return

    const updated = {
      ...complaint,
      status: 'Awaiting Verification',
      resolutionData: {
        submittedAt: new Date().toISOString(),
        submittedBy: 'Field Repair Lead (Demo)',
        notes: workerNotes.trim(),
        evidencePhotoUrl: resolutionPhoto,
        status: 'Pending Review'
      }
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

  // Handler: Reviewer approves resolution proof
  const handleApproveResolution = () => {
    const updated = {
      ...complaint,
      status: 'Resolved',
      resolutionData: {
        ...(complaint.resolutionData || {}),
        status: 'Approved',
        approvedAt: new Date().toISOString(),
        approvedBy: 'Senior Municipal Engineer (Demo)'
      }
    }

    onUpdateComplaint(updated)
    onAddAuditLog({
      complaintId: complaint.id,
      type: 'RESOLUTION_APPROVED',
      actor: 'Senior Reviewer (Demo)',
      title: 'Resolution Evidence Approved & Closed',
      description: 'Supervising reviewer inspected photo evidence and approved complaint closure.'
    })
  }

  // Handler: Reviewer rejects resolution proof
  const handleRejectResolution = (e) => {
    e.preventDefault()
    if (!rejectReason.trim()) return

    const updated = {
      ...complaint,
      status: 'Reopened',
      resolutionData: {
        ...(complaint.resolutionData || {}),
        status: 'Rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: 'Senior Reviewer (Demo)',
        rejectionReason: rejectReason.trim()
      }
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

  // Handler: Escalate ticket manually
  const handleEscalate = () => {
    const updated = {
      ...complaint,
      status: 'Escalated'
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
              {complaint.status}
            </span>
            <span className={`badge ${
              complaint.priority === 'Critical' ? 'badge-danger' : 
              complaint.priority === 'High' ? 'badge-warning' : 'badge-neutral'
            }`}>
              {complaint.priority} Priority
            </span>
          </div>

          <button 
            onClick={onClose}
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
                <span>Filed: {formatDateTime(complaint.createdAt)}</span>
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

          {/* Citizen Photo (if present) */}
          {complaint.photoUrl && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Citizen Submitted Photo Proof:
              </div>
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--slate-300)', maxHeight: '200px' }}>
                <img src={complaint.photoUrl} alt="Complaint evidence" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              </div>
            </div>
          )}

          {/* AI Intelligence Panel */}
          <div className="ai-intelligence-card" style={{ marginBottom: '1.5rem' }}>
            <div className="ai-header">
              <div className="ai-header-title">
                <Sparkles size={18} />
                <span>CivicFix Intelligence Analysis</span>
              </div>
              <span className="ai-label-pill">Rule-based demo analysis</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)' }}>CLASSIFIED CATEGORY</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy-900)' }}>{complaint.category}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)' }}>ROUTED DEPARTMENT</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)' }}>{complaint.department}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)' }}>SLA TARGET</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#d97706' }}>{complaint.slaHours || 48} Hours Standard</div>
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
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '1rem', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#92400e', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Copy size={16} />
                    <span>Potential Duplicate Candidate Detected ({complaint.analysis.possibleDuplicates[0].score}% match)</span>
                  </div>
                  <span className="badge badge-warning">Action Required</span>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#78350f', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  Matches active complaint <strong>{complaint.analysis.possibleDuplicates[0].matchedId}</strong> ("{complaint.analysis.possibleDuplicates[0].matchedTitle}").
                  Both tickets report similar civic grievances in the same area.
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
                        ? 'Duplicate Linked' 
                        : 'Confirm & Link Tickets'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Department Management Section */}
          <div className="card" style={{ marginBottom: '1.5rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.92rem', color: 'var(--navy-900)' }}>
                <Building2 size={16} color="var(--primary)" />
                <span>Department Routing & Assignment</span>
              </div>
              {!isReassigning ? (
                <button 
                  className="btn btn-subtle btn-sm"
                  onClick={() => setIsReassigning(true)}
                >
                  Change Department
                </button>
              ) : (
                <button 
                  className="btn btn-subtle btn-sm"
                  onClick={() => setIsReassigning(false)}
                >
                  Cancel
                </button>
              )}
            </div>

            {!isReassigning ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                Assigned to: <strong style={{ color: 'var(--navy-900)' }}>{complaint.department}</strong> (Simulated demo assignment).
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
                  Save Route
                </button>
              </div>
            )}
          </div>

          {/* Two-Party Resolution Verification Workflow Box */}
          <div className="card" style={{ 
            marginBottom: '1.5rem', 
            border: complaint.status === 'Awaiting Verification' ? '2px solid #2563eb' : '1px solid var(--slate-200)',
            background: complaint.status === 'Awaiting Verification' ? '#f0f7ff' : '#ffffff' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy-900)' }}>
                <FileCheck size={18} color="var(--primary)" />
                <span>Resolution Verification Workflow</span>
              </div>
              <span className={`badge ${
                complaint.status === 'Resolved' ? 'badge-success' : 
                complaint.status === 'Awaiting Verification' ? 'badge-info' : 'badge-neutral'
              }`}>
                {complaint.status === 'Resolved' ? 'Verified Closed' : 
                 complaint.status === 'Awaiting Verification' ? 'Action Required: Reviewer' : 'In Field Queue'}
              </span>
            </div>

            {/* State A: Complaint is Resolved */}
            {complaint.status === 'Resolved' && (
              <div style={{ background: '#f0fdf4', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 700, marginBottom: '0.4rem' }}>
                  <CheckCircle2 size={18} />
                  <span>Verified & Closed by Senior Supervisor</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#166534', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  {complaint.resolutionData && complaint.resolutionData.notes ? complaint.resolutionData.notes : 'Field repair executed and photographic proof signed off.'}
                </p>
                {complaint.resolutionData && complaint.resolutionData.evidencePhotoUrl && (
                  <div style={{ maxHeight: '160px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
                    <img src={complaint.resolutionData.evidencePhotoUrl} alt="Approved repair proof" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            )}

            {/* State B: Complaint is Awaiting Verification (Reviewer must approve or reject) */}
            {complaint.status === 'Awaiting Verification' && (
              <div>
                <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Worker Submitted Proof for Review:
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--navy-800)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    "{complaint.resolutionData?.notes || 'Field repair completed as per municipal standard.'}"
                  </p>

                  {complaint.resolutionData?.evidencePhotoUrl && (
                    <div style={{ maxHeight: '180px', overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid #93c5fd', marginBottom: '0.75rem' }}>
                      <img src={complaint.resolutionData.evidencePhotoUrl} alt="Worker evidence" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    Submitted by: <strong>{complaint.resolutionData?.submittedBy || 'Field Worker'}</strong> • {formatDateTime(complaint.resolutionData?.submittedAt)}
                  </div>
                </div>

                {!showRejectBox ? (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button 
                      className="btn btn-success"
                      onClick={handleApproveResolution}
                    >
                      <CheckCircle2 size={16} />
                      <span>Approve Resolution & Close</span>
                    </button>
                    <button 
                      className="btn btn-outline-danger"
                      onClick={() => setShowRejectBox(true)}
                    >
                      <RotateCcw size={16} />
                      <span>Reject Evidence & Reopen</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRejectResolution} style={{ background: '#fff1f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      Reason for Rejecting Evidence:
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
                        Confirm Rejection & Reopen
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-subtle btn-sm"
                        onClick={() => setShowRejectBox(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* State C: Complaint is Submitted, In Progress, or Reopened */}
            {complaint.status !== 'Resolved' && complaint.status !== 'Awaiting Verification' && (
              <div>
                {!showSubmitResolution ? (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {complaint.status === 'Submitted' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={handleStartWork}
                      >
                        <Send size={14} />
                        <span>Dispatch Field Crew</span>
                      </button>
                    )}

                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowSubmitResolution(true)}
                    >
                      <Camera size={14} />
                      <span>Simulate Worker Resolution Upload</span>
                    </button>

                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={handleEscalate}
                      title="Trigger supervisor escalation"
                    >
                      <AlertOctagon size={14} />
                      <span>Escalate to Zonal Head</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleWorkerSubmitResolution} style={{ background: 'var(--slate-50)', border: '1px solid var(--slate-200)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy-900)', marginBottom: '0.4rem' }}>
                      Field Worker Resolution Proof Submission
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
                        Simulated Repair Proof Photo:
                      </div>
                      <div style={{ maxHeight: '140px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-300)' }}>
                        <img src={resolutionPhoto} alt="Proof" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" className="btn btn-primary btn-sm">
                        Submit for Municipal Review
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-subtle btn-sm"
                        onClick={() => setShowSubmitResolution(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Activity Timeline / Audit Trail */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Chronological Audit Trail ({complaintLogs.length} Events):
            </div>

            {complaintLogs.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', fontStyle: 'italic' }}>
                Initial submission registered. No status changes recorded yet.
              </div>
            ) : (
              <div className="timeline">
                {complaintLogs.map(log => (
                  <div key={log.id} className="timeline-item">
                    <div className={`timeline-dot ${
                      log.type.includes('ESCALAT') ? 'danger' : 
                      log.type.includes('RESOLV') ? 'success' : 'warning'
                    }`} />
                    <div className="timeline-title">{log.title}</div>
                    <div className="timeline-meta">
                      {formatDateTime(log.timestamp)} • Actor: {log.actor}
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
            Close Inspection View
          </button>
        </div>
      </div>
    </div>
  )
}
