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
  Clock,
  Database,
  Download,
  Upload,
  ShieldAlert
} from 'lucide-react'
import { formatDateTime } from '../utils/timeUtils'
import { useLanguage } from '../utils/LanguageContext'
import { dataService } from '../services/dataService'

export function AuditLogView({ auditLogs = [], onSelectComplaintById, onReloadFromStorage }) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [isExporting, setIsExporting] = useState(false)

  const handleExportData = () => {
    try {
      setIsExporting(true)
      const payload = dataService.exportDatabasePayload()
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `nagaraksha_db_export_${new Date().toISOString().slice(0, 10)}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      setTimeout(() => setIsExporting(false), 800)
    } catch (err) {
      alert('Error exporting database payload: ' + err.message)
      setIsExporting(false)
    }
  }

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const success = dataService.importDatabasePayload(event.target.result)
        if (success) {
          alert('Database payload successfully imported and restored into local data service!')
          if (onReloadFromStorage) onReloadFromStorage()
          else window.location.reload()
        } else {
          alert('Failed to import database payload. Please verify JSON format.')
        }
      } catch (err) {
        alert('Invalid JSON file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (!log) return false

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matches = 
          (log.complaintId && log.complaintId.toLowerCase().includes(q)) ||
          (log.title && log.title.toLowerCase().includes(q)) ||
          (log.description && log.description.toLowerCase().includes(q)) ||
          (log.actor && log.actor.toLowerCase().includes(q))
        if (!matches) return false
      }

      if (selectedType !== 'ALL') {
        if (!log.type || !log.type.includes(selectedType)) return false
      }

      return true
    })
  }, [auditLogs, searchTerm, selectedType])

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.85rem' }}>{t('audit_title')}</h1>
            <span className="badge badge-purple">{auditLogs.length} {t('events', 'Events')}</span>
          </div>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>
            {t('audit_sub')}
          </p>
        </div>

        {/* Database Migration & Export/Import Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleExportData}
            title="Download full relational JSON snapshot for database migration"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={15} />
            <span>{isExporting ? 'Exporting...' : 'Export DB JSON'}</span>
          </button>

          <label 
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', margin: 0 }}
            title="Import previously exported NAGARAKSHAK database JSON"
          >
            <Upload size={15} />
            <span>Import DB JSON</span>
            <input 
              type="file" 
              accept=".json,application/json" 
              onChange={handleImportFile} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </div>

      {/* Security Architecture & Audit Integrity Notice */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--slate-50)', border: '1px solid var(--slate-200)', padding: '0.85rem 1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <ShieldAlert size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-900)' }}>
            Database-Ready Security & Audit Architecture Notice
          </span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--slate-600)', lineHeight: 1.5, margin: 0 }}>
          This interface currently reflects operational audit events captured in the centralized data service layer for demonstration purposes. In production deployment, audit logs are immutable, append-only records written via server-side middleware with write-locked database permissions and cryptographic timestamping. Client-side storage cannot guarantee tamper-proof audit trails.
        </p>
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
              placeholder={t('audit_search_placeholder')}
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
              <option value="ALL">{t('all_event_types')}</option>
              <option value="COMPLAINT">{t('new_registrations')}</option>
              <option value="RESOLUTION">{t('verifications_closures')}</option>
              <option value="ESCALAT">{t('sla_escalations')}</option>
              <option value="EVIDENCE">{t('evidence_submissions')}</option>
              <option value="DUPLICATE">{t('duplicate_flags')}</option>
              <option value="DEPARTMENT">{t('dept_reassignments')}</option>
              <option value="WORK">{t('work_starts')}</option>
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
              const logType = log.type || ''
              const isEscalation = logType.includes('ESCALAT')
              const isResolved = logType.includes('RESOLUTION_APPROVED')
              const isRejected = logType.includes('RESOLUTION_REJECTED')
              const isDuplicate = logType.includes('DUPLICATE')
              const isEvidence = logType.includes('EVIDENCE')

              return (
                <div 
                  key={log.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '1rem', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-md)', 
                    background: isEscalation ? 'var(--danger-bg)' : isResolved ? 'var(--success-bg)' : isRejected ? 'var(--danger-bg)' : 'var(--slate-50)',
                    border: '1px solid',
                    borderColor: isEscalation ? 'var(--danger-border)' : isResolved ? 'var(--success-border)' : isRejected ? 'var(--danger-border)' : 'var(--slate-200)'
                  }}
                >
                  <div style={{ 
                    width: '2.5rem', 
                    height: '2.5rem', 
                    borderRadius: 'var(--radius-md)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: isEscalation ? 'var(--danger-bg)' : isResolved ? 'var(--success-bg)' : isEvidence ? 'var(--info-bg)' : 'var(--bg-main)',
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
                      {t('actor', 'Authorized Actor')}: <strong style={{ color: 'var(--navy-900)' }}>{log.actor}</strong>
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
