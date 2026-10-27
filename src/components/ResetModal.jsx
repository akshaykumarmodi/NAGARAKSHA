import React from 'react'
import { RotateCcw, AlertTriangle, X } from 'lucide-react'

export function ResetModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 700 }}>
            <AlertTriangle size={18} />
            <span>Reset Demo Data</span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem' }}>
          <p style={{ fontSize: '0.92rem', color: 'var(--navy-800)', lineHeight: 1.5, marginBottom: '1rem' }}>
            This will reset all complaints, status transitions, and audit trails back to the default 6 fictional hackathon seed tickets.
          </p>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '0.85rem', fontSize: '0.82rem', color: '#991b1b' }}>
            Ideal before starting a new live presentation to judges or rehearsing your 90-second pitch.
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <RotateCcw size={14} />
            <span>Confirm Reset</span>
          </button>
        </div>
      </div>
    </div>
  )
}
