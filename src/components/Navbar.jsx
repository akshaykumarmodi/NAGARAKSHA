import React, { useState, useEffect, useRef } from 'react'
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Activity, 
  RotateCcw, 
  Home, 
  Clock,
  Sparkles, 
  AlertTriangle, 
  Sun, 
  Moon, 
  Languages, 
  LogOut, 
  UserCheck, 
  ShieldCheck, 
  Users, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react'
import { NagarakshakLogo } from './NagarakshakLogo'
import { useLanguage } from '../utils/LanguageContext'

export function Navbar({ 
  currentUser,
  onLogout,
  activeTab, 
  setActiveTab, 
  onResetClick, 
  onCheckDeadlines,
  overdueCount = 0,
  theme = 'light',
  toggleTheme,
  backendHealth
}) {
  const { lang, setLang, t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const moreRef = useRef(null)

  const isCitizen = currentUser && String(currentUser.role).toUpperCase() === 'CITIZEN'
  const isAuthority = currentUser && !isCitizen

  const handleNavigate = (tab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
    setMoreMenuOpen(false)
  }

  const handleMobileLogout = () => {
    setMobileMenuOpen(false)
    setMoreMenuOpen(false)
    onLogout()
  }

  // Close More dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* Top Brand Banner */}
      <div className="prototype-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '0.4rem', padding: '0.35rem 0.85rem' }}>
        <span>{t('brand_tagline', 'NAGARAKSHAK — Smarter Cities, Safer Communities.')}</span>

        {/* Real Live Database & Backend Status Pill (Never Hardcoded) */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          marginLeft: '0.5rem',
          fontSize: '0.72rem',
          fontWeight: 700,
          background: backendHealth?.ok ? 'rgba(34, 197, 94, 0.22)' : 'rgba(239, 68, 68, 0.25)',
          border: backendHealth?.ok ? '1px solid rgba(34, 197, 94, 0.6)' : '1px solid rgba(239, 68, 68, 0.6)',
          color: backendHealth?.ok ? '#86efac' : '#fca5a5',
          borderRadius: '9999px',
          padding: '0.12rem 0.6rem'
        }} title={backendHealth?.ok ? `Database: ${backendHealth.data?.database?.engine || 'Connected'} (${backendHealth.data?.database?.complaintsCount || 0} complaints, ${backendHealth.data?.database?.usersCount || 0} users)` : 'Backend server unreachable'}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: backendHealth?.ok ? '#22c55e' : '#ef4444'
          }} />
          {backendHealth?.ok 
            ? `${backendHealth.data?.database?.engine || 'Live DB'} • ${backendHealth.data?.database?.complaintsCount || 0} ${t('nav_complaints_count', 'Complaints')}` 
            : t('nav_backend_offline', 'Backend Offline')}
        </span>
        {isAuthority && overdueCount > 0 && (
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
            {overdueCount} {t('sla_alerts', 'SLA Alert(s)')}
          </button>
        )}
      </div>

      <header className="navbar">
        <div className="container nav-container">
          {/* Brand Wordmark with mandatory final K */}
          <div className="nav-brand" onClick={() => handleNavigate('home')}>
            <div className="brand-icon">
              <NagarakshakLogo size={28} />
            </div>
            <div>
              <div className="brand-title">NAGARA<span style={{ color: 'var(--accent-saffron)' }}>KSHAK</span></div>
              <div className="brand-subtitle">{t('brand_sub', 'Citizen Reports to Verified Resolution')}</div>
            </div>
          </div>

          {/* Role-Based Nav Links (Desktop) */}
          <nav className="nav-links">
            <button 
              className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => handleNavigate('home')}
            >
              <Home size={15} />
              <span>{t('nav_overview', 'Overview')}</span>
            </button>

            {/* Authority Links (Primary + More Dropdown) */}
            {isAuthority && (
              <>
                <button 
                  className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => handleNavigate('dashboard')}
                >
                  <LayoutDashboard size={15} />
                  <span>{t('nav_dashboard', 'Dashboard')}</span>
                </button>
                <button 
                  className={`nav-btn ${activeTab === 'complaints' ? 'active' : ''}`}
                  onClick={() => handleNavigate('complaints')}
                >
                  <FileText size={15} />
                  <span>{t('nav_authority_queue', 'Authority Queue')}</span>
                </button>
                <button 
                  className={`nav-btn ${activeTab === 'report' ? 'active' : ''}`}
                  onClick={() => handleNavigate('report')}
                >
                  <PlusCircle size={15} />
                  <span>{t('nav_report', 'Report Issue')}</span>
                </button>

                {/* More Dropdown for Secondary Authority Tools */}
                <div className="nav-dropdown-wrapper" ref={moreRef}>
                  <button 
                    className={`nav-btn ${(activeTab === 'audit' || activeTab === 'users' || moreMenuOpen) ? 'active' : ''}`}
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span>{t('nav_more', 'More')}</span>
                    <ChevronDown size={14} style={{ transform: moreMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                  </button>

                  {moreMenuOpen && (
                    <div className="nav-dropdown-menu">
                      <button 
                        className={`nav-dropdown-item ${activeTab === 'audit' ? 'active' : ''}`}
                        onClick={() => handleNavigate('audit')}
                      >
                        <Activity size={15} color="var(--primary)" />
                        <span>{t('nav_audit', 'Audit Trail')}</span>
                      </button>

                      <button 
                        className={`nav-dropdown-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => handleNavigate('users')}
                      >
                        <Users size={15} color="var(--accent-saffron)" />
                        <span>{t('nav_access_directory', 'Access Directory')}</span>
                      </button>

                      <div style={{ height: '1px', background: 'var(--slate-200)', margin: '0.3rem 0' }} />

                      <button 
                        className="nav-dropdown-item"
                        onClick={() => { onCheckDeadlines(); setMoreMenuOpen(false); }}
                        title="Inspect timestamps and flag overdue tickets"
                      >
                        <Clock size={15} color="var(--navy-700)" />
                        <span>{t('nav_check_slas', 'Check SLAs')}</span>
                      </button>

                      <button 
                        className="nav-dropdown-item"
                        onClick={() => { onResetClick(); setMoreMenuOpen(false); }}
                        title="Reset all complaints and audit logs to demo defaults"
                      >
                        <RotateCcw size={15} color="var(--slate-500)" />
                        <span>{t('nav_reset_demo', 'Reset Demo')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Citizen-Only Links */}
            {isCitizen && (
              <>
                <button 
                  className={`nav-btn ${activeTab === 'report' ? 'active' : ''}`}
                  onClick={() => handleNavigate('report')}
                >
                  <PlusCircle size={15} />
                  <span>{t('nav_file_grievance', 'File Grievance')}</span>
                </button>
                <button 
                  className={`nav-btn ${activeTab === 'complaints' ? 'active' : ''}`}
                  onClick={() => handleNavigate('complaints')}
                >
                  <FileText size={15} />
                  <span>{t('nav_my_complaints', 'My Complaints & Tracking')}</span>
                </button>
              </>
            )}
          </nav>

          {/* Quick Actions & Account Controls */}
          <div className="nav-actions">
            {/* 5-Language Switcher */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.3rem', 
                background: 'var(--bg-subtle)', 
                border: '1px solid var(--slate-300)', 
                borderRadius: 'var(--radius-md)', 
                padding: '0.12rem 0.4rem',
                height: '30px'
              }}
              title="Select Portal Language"
            >
              <Languages size={13} color="var(--primary)" />
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--navy-900)', 
                  fontSize: '0.78rem', 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  outline: 'none'
                }}
                aria-label="Select Language"
              >
                <option value="en" style={{ background: 'var(--bg-card)', color: 'var(--navy-900)' }}>English</option>
                <option value="hi" style={{ background: 'var(--bg-card)', color: 'var(--navy-900)' }}>हिन्दी</option>
                <option value="pa" style={{ background: 'var(--bg-card)', color: 'var(--navy-900)' }}>ਪੰਜਾਬੀ</option>
                <option value="kn" style={{ background: 'var(--bg-card)', color: 'var(--navy-900)' }}>ಕನ್ನಡ</option>
                <option value="te" style={{ background: 'var(--bg-card)', color: 'var(--navy-900)' }}>తెలుగు</option>
              </select>
            </div>

            {/* Dark / Light Mode Switcher */}
            <button 
              className="btn btn-subtle btn-sm"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
              style={{ height: '30px', padding: '0 0.45rem' }}
            >
              {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} />}
            </button>

            {/* Desktop User Session Badge */}
            {currentUser && (
              <div className="desktop-only" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'var(--bg-subtle)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--slate-300)',
                fontSize: '0.78rem'
              }}>
                {isCitizen ? (
                  <UserCheck size={13} color="var(--primary)" />
                ) : (
                  <ShieldCheck size={13} color="var(--accent-saffron)" />
                )}
                <span style={{ fontWeight: 600, color: 'var(--navy-900)', maxWidth: '90px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={currentUser.name}>
                  {currentUser.name}
                </span>
                <span className={`badge ${
                  isCitizen ? 'badge-primary' : 
                  currentUser.role === 'ADMIN' ? 'badge-danger' : 'badge-warning'
                }`} style={{ fontSize: '0.62rem', padding: '0.08rem 0.3rem' }}>
                  {isCitizen ? t('role_citizen', 'Citizen') : (currentUser.role === 'ADMIN' ? t('role_admin', 'Admin') : t('role_officer', 'Officer'))}
                </span>
              </div>
            )}

            {/* Desktop Logout Button — ALWAYS visible and prominent */}
            {currentUser && (
              <button 
                className="btn btn-outline-danger btn-sm desktop-only"
                onClick={onLogout}
                title="End active session and return to login screen"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.35rem', 
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  height: '30px',
                  padding: '0 0.65rem',
                  fontSize: '0.78rem'
                }}
              >
                <LogOut size={13} />
                <span>{t('nav_logout', 'Logout')}</span>
              </button>
            )}

            {/* Mobile / Tablet Menu Toggle */}
            <button
              className="btn btn-subtle btn-sm mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              title="Menu"
              style={{ alignItems: 'center', justifyContent: 'center', padding: '0.35rem', width: '32px', height: '32px' }}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Drawer Menu */}
        {mobileMenuOpen && (
          <div className="mobile-drawer">
            {/* User Profile Overview */}
            {currentUser && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-subtle)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--slate-300)',
                marginBottom: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {isCitizen ? (
                    <UserCheck size={20} color="var(--primary)" />
                  ) : (
                    <ShieldCheck size={20} color="var(--accent-saffron)" />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--navy-900)' }}>
                      {currentUser.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      {currentUser.email || currentUser.maskedPhone || currentUser.citizenId || currentUser.badgeNumber}
                    </div>
                  </div>
                </div>
                <span className={`badge ${isCitizen ? 'badge-primary' : 'badge-warning'}`}>
                  {isCitizen ? t('role_citizen', 'Citizen') : (currentUser.role === 'ADMIN' ? t('role_admin', 'Admin') : t('role_officer', 'Officer'))}
                </span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
              <button 
                className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
                onClick={() => handleNavigate('home')}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 0.85rem' }}
              >
                <Home size={18} />
                <span>{t('nav_overview', 'Overview')}</span>
              </button>

              {isAuthority && (
                <>
                  <button 
                    className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => handleNavigate('dashboard')}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 0.85rem' }}
                  >
                    <LayoutDashboard size={18} />
                    <span>{t('nav_dashboard', 'Dashboard')}</span>
                  </button>
                  <button 
                    className={`nav-btn ${activeTab === 'complaints' ? 'active' : ''}`}
                    onClick={() => handleNavigate('complaints')}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 0.85rem' }}
                  >
                    <FileText size={18} />
                    <span>{t('nav_authority_queue', 'Authority Queue')}</span>
                  </button>
                  <button 
                    className={`nav-btn ${activeTab === 'report' ? 'active' : ''}`}
                    onClick={() => handleNavigate('report')}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 0.85rem' }}
                  >
                    <PlusCircle size={18} />
                    <span>{t('nav_report', 'Report Issue')}</span>
                  </button>
                  <button 
                    className={`nav-btn ${activeTab === 'audit' ? 'active' : ''}`}
                    onClick={() => handleNavigate('audit')}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 0.85rem' }}
                  >
                    <Activity size={18} />
                    <span>{t('nav_audit', 'Audit Trail')}</span>
                  </button>
                  <button 
                    className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => handleNavigate('users')}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 0.85rem' }}
                  >
                    <Users size={18} />
                    <span>{t('nav_access_directory', 'Access Directory')}</span>
                  </button>
                </>
              )}

              {isCitizen && (
                <>
                  <button 
                    className={`nav-btn ${activeTab === 'report' ? 'active' : ''}`}
                    onClick={() => handleNavigate('report')}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 0.85rem' }}
                  >
                    <PlusCircle size={18} />
                    <span>{t('nav_file_grievance', 'File Grievance')}</span>
                  </button>
                  <button 
                    className={`nav-btn ${activeTab === 'complaints' ? 'active' : ''}`}
                    onClick={() => handleNavigate('complaints')}
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.65rem 0.85rem' }}
                  >
                    <FileText size={18} />
                    <span>{t('nav_my_complaints', 'My Complaints & Tracking')}</span>
                  </button>
                </>
              )}
            </div>

            {/* Quick Actions for Authority */}
            {isAuthority && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => { onCheckDeadlines(); setMobileMenuOpen(false); }}
                  style={{ justifyContent: 'center' }}
                >
                  <Clock size={14} />
                  <span>{t('nav_check_slas', 'Check SLAs')}</span>
                </button>
                <button 
                  className="btn btn-subtle btn-sm"
                  onClick={() => { onResetClick(); setMobileMenuOpen(false); }}
                  style={{ justifyContent: 'center' }}
                >
                  <RotateCcw size={14} />
                  <span>{t('nav_reset_demo', 'Reset Demo')}</span>
                </button>
              </div>
            )}

            {/* Mobile Logout Button */}
            {currentUser && (
              <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: '0.75rem' }}>
                <button 
                  className="btn btn-outline-danger"
                  onClick={handleMobileLogout}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                >
                  <LogOut size={16} />
                  <span>{t('nav_logout', 'Logout')} ({currentUser.name})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  )
}
