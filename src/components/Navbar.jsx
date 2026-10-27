import React from 'react'
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Activity, 
  RotateCcw, 
  Home, 
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react'

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  onResetClick, 
  onCheckDeadlines,
  overdueCount = 0 
}) {
  return (
    <>
      {/* Top Hackathon Demo Notice */}
      <div className="prototype-banner">
        <span className="badge">Hackathon Prototype</span>
        <span>CivicFix AI uses simulated rule-based logic and sample data. Not connected to real municipal authorities.</span>
        {overdueCount > 0 && (
          <button 
            onClick={onCheckDeadlines}
            style={{ 
              marginLeft: '0.75rem', 
              background: 'rgba(220, 38, 38, 0.25)', 
              border: '1px solid #ef4444', 
              color: '#fecaca', 
              borderRadius: '9999px',
              padding: '0.15rem 0.6rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <AlertTriangle size={12} />
            {overdueCount} SLA Alert(s)
          </button>
        )}
      </div>

      <header className="navbar">
        <div className="container nav-container">
          {/* Brand Wordmark */}
          <div className="nav-brand" onClick={() => setActiveTab('home')}>
            <div className="brand-icon">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="brand-title">
                CivicFix <span className="ai-chip">AI</span>
              </div>
              <div className="brand-subtitle">Citizen Reports to Verified Resolution</div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="nav-links">
            <button 
              className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <Home size={16} />
              <span>Overview</span>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'complaints' ? 'active' : ''}`}
              onClick={() => setActiveTab('complaints')}
            >
              <FileText size={16} />
              <span>Complaints Board</span>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              <PlusCircle size={16} />
              <span>Report Issue</span>
            </button>
            <button 
              className={`nav-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <Activity size={16} />
              <span>Audit Trail</span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="nav-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={onCheckDeadlines}
              title="Inspect timestamps and flag overdue tickets"
            >
              <Clock size={14} />
              <span>Check SLAs</span>
            </button>
            <button 
              className="btn btn-subtle btn-sm"
              onClick={onResetClick}
              title="Reset all complaints and audit logs to demo defaults"
            >
              <RotateCcw size={14} />
              <span>Reset Demo</span>
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab('report')}
            >
              <PlusCircle size={14} />
              <span>File Complaint</span>
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
