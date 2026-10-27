import React, { useState, useMemo } from 'react'
import { 
  Activity, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Send,
  Building2,
  FileCheck,
  Clock
} from 'lucide-react'
import { formatDateTime } from '../utils/timeUtils'

export function AuditLogView({ auditLogs = [], onSelectComplaintById }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matches = 
          (log.complaintId && log.complaintId.toLowerCase().includes(q)) ||
          log.title.toLowerCase().includes(q) ||
          log.description.toLowerCase().includes(q) ||
          log.actor.toLowerCase().includes(q)
        if (!matches) return false
      }

      if (selectedType !== 'ALL') {
        if (!log.type.includes(selectedType)) return false
      }

      return true
    })
  }, [auditLogs, searchTerm, selectedType])

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.85rem' }}>System Audit Trail & Governance Log</h1>
            <span className="badge badge-purple">{auditLogs.length} Events</span>
          </div>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>
            Tamper-evident record of all AI classifications, crew dispatches, SLA escalations, and supervisor verification sign-offs.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by Complaint ID, actor, or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Event Type Filter */}
          <div>
            <select 
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="ALL">All Event Types</option>
              <option value="RESOLUTION">Verifications & Closures</option>
              <option value="ESCALAT">SLA Escalations</option>
              <option value="EVIDENCE">Evidence Submissions</option>
              <option value="DUPLICATE">Duplicate Detection Flags</option>
              <option value="DEPARTMENT">Department Reassignments</option>
              <option value="WORK">Dispatches & Work Starts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--slate-500)' }}>
            <Activity size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
            <p style={{ fontWeight: 600 }}>No audit events found matching filters.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredLogs.map(log => {
              const isEscalation = log.type.includes('ESCALAT')
              const isResolved = log.type.includes('RESOLUTION_APPROVED')
              const isRejected = log.type.includes('RESOLUTION_REJECTED')
              const isDuplicate = log.type.includes('DUPLICATE')
              const isEvidence = log.type.includes('EVIDENCE')

              return (
                <div 
                  key={log.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '1rem', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-md)', 
                    background: isEscalation ? '#fff5f5' : isResolved ? '#f0fdf4' : isRejected ? '#fff1f2' : 'var(--slate-50)',
                    border: '1px solid',
                    borderColor: isEscalation ? '#fecaca' : isResolved ? '#bbf7d0' : isRejected ? '#fca5a5' : 'var(--slate-200)'
                  }}
                >
                  <div style={{ 
                    width: '2.5rem', 
                    height: '2.5rem', 
                    borderRadius: 'var(--radius-md)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: isEscalation ? '#fee2e2' : isResolved ? '#dcfce7' : isEvidence ? '#dbeafe' : '#f1f5f9',
                    color: isEscalation ? 'var(--danger)' : isResolved ? 'var(--success)' : isEvidence ? 'var(--primary)' : 'var(--slate-600)',
                    flexShrink: 0
                  }}>
                    {isEscalation ? <AlertTriangle size={18} /> : 
                     isResolved ? <CheckCircle2 size={18} /> : 
                     isEvidence ? <FileCheck size={18} /> : <Activity size={18} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.92rem' }}>
                          {log.title}
                        </span>
                        {log.complaintId && (
                          <button 
                            className="btn btn-subtle btn-sm"
                            style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}
                            onClick={() => onSelectComplaintById(log.complaintId)}
                          >
                            {log.complaintId}
                          </button>
                        )}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        <span>{formatDateTime(log.timestamp)}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--slate-700)', lineHeight: 1.5, marginBottom: '0.4rem' }}>
                      {log.description}
                    </p>

                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      Authorized Actor: <strong style={{ color: 'var(--navy-900)' }}>{log.actor}</strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
