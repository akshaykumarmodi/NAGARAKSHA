import React from 'react'
import { RotateCcw, AlertTriangle, X } from 'lucide-react'
import { useLanguage } from '../utils/LanguageContext'

export function ResetModal({ isOpen, onClose, onConfirm }) {
  const { t } = useLanguage()

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 700 }}>
            <AlertTriangle size={18} />
            <span>{t('reset_demo_title', 'Reset Demo Data')}</span>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.92rem', color: 'var(--navy-800)', lineHeight: 1.5, marginBottom: '1rem' }}>
            {t('reset_demo_desc', 'This will reset all complaints, status transitions, and audit trails back to the default 6 fictional hackathon seed tickets.')}
          </p>
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', fontSize: '0.82rem', color: 'var(--danger)' }}>
            {t('reset_demo_warning', 'Ideal before starting a new live presentation to judges or rehearsing your pitch.')}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('cancel', 'Cancel')}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <RotateCcw size={14} />
            <span>{t('confirm_reset', 'Confirm Reset')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

