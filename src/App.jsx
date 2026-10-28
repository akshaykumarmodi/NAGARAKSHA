import React, { useState, useEffect, useCallback } from 'react'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { LandingPage } from './components/LandingPage'
import { DashboardView } from './components/DashboardView'
import { ComplaintsListView } from './components/ComplaintsListView'
import { ReportIssueView } from './components/ReportIssueView'
import { AuditLogView } from './components/AuditLogView'
import { ComplaintDetailModal } from './components/ComplaintDetailModal'
import { ResetModal } from './components/ResetModal'
import { LoginView } from './components/LoginView'
import { AdminView } from './components/AdminView'
import { authService } from './services/authService'
import { getDeadlineStatus } from './utils/timeUtils'
import { useLanguage } from './utils/LanguageContext'
import {
  apiGetComplaints,
  apiGetAuditLogs,
  apiCreateComplaint,
  apiUpdateComplaint,
  apiAddAuditLog,
  apiCheckSLA,
  apiResetDemo,
  apiHealthCheck,
} from './services/apiService'

// ── Fallback: keep the localStorage service as safety net ──
// If the backend is unreachable, we degrade gracefully to localStorage.
import {
  getStoredComplaints,
  saveComplaints,
  getStoredAuditLogs,
  appendAuditLog as localAppendAuditLog,
  resetDemoStorage,
} from './utils/storage'

export default function App() {
  const { t } = useLanguage()
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser())
  const [activeTab, setActiveTab] = useState(() => {
    const user = authService.getCurrentUser()
    if (!user) return 'home'
    const isCit = String(user.role).toUpperCase() === 'CITIZEN'
    return isCit ? 'complaints' : 'dashboard'
  })
  const [complaints, setComplaints] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [backendOnline, setBackendOnline] = useState(false)
  const [backendHealth, setBackendHealth] = useState({ ok: false, data: null })
  const [isLoading, setIsLoading] = useState(true)

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((newUser) => {
      setCurrentUser(newUser)
      if (!newUser) {
        setActiveTab('home')
        setSelectedComplaint(null)
      }
    })
    return () => unsubscribe()
  }, [])

  // Theme
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('nagarakshak_theme') || 'light' } catch { return 'light' }
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('nagarakshak_theme', theme) } catch {}
  }, [theme])
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  // ── Data Loading ────────────────────────────────────────────────────────────

  const loadFromBackend = useCallback(async () => {
    try {
      const [fetchedComplaints, fetchedLogs] = await Promise.all([
        apiGetComplaints(),
        apiGetAuditLogs(),
      ])
      setComplaints(fetchedComplaints)
      setAuditLogs(fetchedLogs)
      setBackendOnline(true)
      return true
    } catch (err) {
      console.warn('[App] Backend unreachable, falling back to localStorage:', err.message)
      return false
    }
  }, [])

  // Initialize data and check live health on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)

      const health = await apiHealthCheck()
      setBackendHealth(health)
      setBackendOnline(health.ok)

      if (health.ok) {
        await loadFromBackend()
        // Sync & verify token with backend
        await authService.syncSessionWithBackend()
      } else {
        // Fallback for reading previously cached seed complaints if server not yet started
        setComplaints(getStoredComplaints())
        setAuditLogs(getStoredAuditLogs())
      }

      setIsLoading(false)
    }
    init()

    // Periodic live health check every 12 seconds
    const interval = setInterval(async () => {
      const health = await apiHealthCheck()
      setBackendHealth(health)
      setBackendOnline(health.ok)
    }, 12000)

    return () => clearInterval(interval)
  }, [loadFromBackend])

  // Role helpers
  const isCitizen = currentUser && String(currentUser.role).toUpperCase() === 'CITIZEN'
  const isAuthority = currentUser && !isCitizen

  // Block citizens from authority views
  useEffect(() => {
    if (isCitizen && (activeTab === 'dashboard' || activeTab === 'audit')) {
      setActiveTab('complaints')
      showToast('⚠️ Access Restricted: Municipal Command Center requires Authority credentials.')
    }
  }, [isCitizen, activeTab])

  // Toast notification
  const showToast = (msg, duration = 3500) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), duration)
  }

  // ── Auth handlers ─────────────────────────────────────────────────────────

  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
    const isCit = String(user?.role).toUpperCase() === 'CITIZEN'
    if (isCit) {
      setActiveTab('complaints')
      showToast(`✅ Welcome, ${user.name}! Citizen Grievance Portal active.`)
    } else {
      setActiveTab('dashboard')
      showToast(`🏛️ Welcome, Officer ${user.name}! Municipal Command Center active.`)
    }
  }

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
    setActiveTab('home')
    setSelectedComplaint(null)
    showToast('🔒 Session ended. You have been returned to the Login Portal.')
  }

  // ── Dashboard: overdue count ──────────────────────────────────────────────

  const overdueCount = complaints.filter(c => {
    if (c.status === 'Resolved') return false
    const s = getDeadlineStatus(c.deadline, c.status)
    return s.isOverdue || c.status === 'Escalated'
  }).length

  // ── Complaint handlers (Real Database Operations) ─────────────────────────

  /**
   * Called by ReportIssueView after the user fills out the form.
   * Persists directly to the Express / SQLite backend database.
   */
  const handleComplaintCreated = async (newComplaint) => {
    if (!backendOnline) {
      showToast('❌ Backend Offline: Cannot save complaint to database. Please start the server.')
      return
    }

    try {
      const saved = await apiCreateComplaint({
        ...newComplaint,
        currentUser: currentUser || null,
      })
      const refreshed = await apiGetComplaints()
      setComplaints(refreshed)
      const logs = await apiGetAuditLogs()
      setAuditLogs(logs)
      const health = await apiHealthCheck()
      setBackendHealth(health)
      showToast(`✅ Complaint ${saved.id} registered and saved to live database!`)
    } catch (err) {
      console.error('[handleComplaintCreated] Backend error:', err.message)
      showToast(`❌ Database Error: ${err.message}`)
    }
  }

  /**
   * Called whenever a complaint is updated in the detail modal.
   * Syncs the change to the backend and refreshes state.
   */
  const handleUpdateComplaint = async (updatedComplaint) => {
    if (!backendOnline) {
      showToast('❌ Backend Offline: Cannot update complaint in database.')
      return
    }

    try {
      const saved = await apiUpdateComplaint(updatedComplaint)
      setComplaints(prev => prev.map(c => c.id === saved.id ? saved : c))
      setSelectedComplaint(saved)
      const logs = await apiGetAuditLogs()
      setAuditLogs(logs)
      showToast(`✅ Updated ticket ${saved.id} (Status: ${saved.status})`)
    } catch (err) {
      console.error('[handleUpdateComplaint] Backend error:', err.message)
      showToast(`❌ Update failed: ${err.message}`)
    }
  }

  /**
   * Append a new audit log entry.
   */
  const handleAddAuditLog = async (entry) => {
    if (!backendOnline) return
    try {
      await apiAddAuditLog(entry)
      const logs = await apiGetAuditLogs()
      setAuditLogs(logs)
    } catch (err) {
      console.error('[handleAddAuditLog] Backend error:', err.message)
    }
  }

  /**
   * Check SLA deadlines and trigger auto-escalations.
   */
  const handleCheckDeadlines = async () => {
    if (backendOnline) {
      try {
        const result = await apiCheckSLA()
        setComplaints(result.data)
        const logs = await apiGetAuditLogs()
        setAuditLogs(logs)

        if (result.newlyEscalated > 0) {
          showToast(`⚠️ SLA Sentinel: ${result.newlyEscalated} complaint(s) auto-escalated!`)
        } else {
          showToast(`⏱️ SLA Sentinel: All complaints audited. ${overdueCount} in escalation status.`)
        }
        return
      } catch (err) {
        console.error('[handleCheckDeadlines] Backend error:', err.message)
      }
    }

    // Fallback: client-side escalation (existing logic)
    let newlyEscalated = 0
    const updated = complaints.map(c => {
      if (c.status === 'Resolved') return c
      const stat = getDeadlineStatus(c.deadline, c.status)
      if (stat.isOverdue && c.status !== 'Escalated') {
        newlyEscalated++
        localAppendAuditLog({
          complaintId: c.id, type: 'AUTO_ESCALATION',
          actor: 'NAGARAKSHAK SLA Sentinel', title: 'Deadline Exceeded: Auto-Escalated',
          description: `Complaint exceeded SLA deadline without confirmed resolution.`
        })
        return { ...c, status: 'Escalated' }
      }
      return c
    })
    setComplaints(updated)
    saveComplaints(updated)
    setAuditLogs(getStoredAuditLogs())
    if (newlyEscalated > 0) {
      showToast(`⚠️ SLA Sentinel: Found ${newlyEscalated} overdue complaints!`)
    } else {
      showToast(`⏱️ SLA Sentinel: All active complaints audited.`)
    }
  }

  /**
   * Reset demo data back to seed defaults.
   */
  const handleConfirmReset = async () => {
    if (backendOnline) {
      try {
        const result = await apiResetDemo()
        setComplaints(result.data || [])
        setAuditLogs(result.auditLogs || [])
        setSelectedComplaint(null)
        setIsResetOpen(false)
        showToast('🔄 Demo data reset to initial presentation defaults!')
        return
      } catch (err) {
        console.error('[handleConfirmReset] Backend error:', err.message)
        showToast('⚠️ Reset failed on backend. Try again.')
        setIsResetOpen(false)
        return
      }
    }

    // Fallback
    const { complaints: newComplaints, auditLogs: newLogs } = resetDemoStorage()
    setComplaints(newComplaints)
    setAuditLogs(newLogs)
    setSelectedComplaint(null)
    setIsResetOpen(false)
    showToast('🔄 Demo data reset to initial presentation defaults!')
  }

  /**
   * Reload data from backend (e.g. after import).
   */
  const handleReloadFromStorage = async () => {
    if (backendOnline) {
      await loadFromBackend()
      showToast('💾 Data refreshed from database!')
    } else {
      setComplaints(getStoredComplaints())
      setAuditLogs(getStoredAuditLogs())
      showToast('💾 Data refreshed from local storage!')
    }
  }

  /**
   * Jump to a complaint by ID (from audit log).
   */
  const handleSelectComplaintById = (id) => {
    const target = complaints.find(c => c.id === id)
    if (target) setSelectedComplaint(target)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  // Not logged in — show login page
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Backend status indicator (small, non-intrusive) */}
      {!backendOnline && !isLoading && (
        <div style={{
          background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 600,
          textAlign: 'center', padding: '0.35rem', borderBottom: '1px solid #fde68a'
        }}>
          {t('backend_offline_banner', '⚠️ Backend offline — running in local-only mode. Start the server with npm run server')}
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
          background: 'var(--navy-950)', color: '#ffffff',
          padding: '0.85rem 1.4rem', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)', fontSize: '0.88rem', fontWeight: 600,
          border: '1px solid rgba(255,255,255,0.1)', animation: 'modalIn 0.2s ease',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Loading overlay for initial data fetch */}
      {isLoading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(15,23,42,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem'
        }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ color: 'white', fontWeight: 600 }}>{t('loading_data', 'Loading Nagaraksha data...')}</div>
        </div>
      )}

        {/* Main Navigation */}
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onResetClick={() => setIsResetOpen(true)}
          onCheckDeadlines={handleCheckDeadlines}
          overdueCount={overdueCount}
          theme={theme}
          toggleTheme={toggleTheme}
          backendHealth={backendHealth}
        />

        {/* Main View Router — all existing views unchanged */}
        <main style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: '100%' }}>
          {activeTab === 'home' && (
            <LandingPage
              setActiveTab={setActiveTab}
              onSelectSample={() => setActiveTab('complaints')}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'dashboard' && isAuthority && (
            <DashboardView
              complaints={complaints}
              setActiveTab={setActiveTab}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
              onCheckDeadlines={handleCheckDeadlines}
            />
          )}

          {activeTab === 'complaints' && (
            <ComplaintsListView
              complaints={complaints}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
              setActiveTab={setActiveTab}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'report' && (
            <ReportIssueView
              existingComplaints={complaints}
              onComplaintCreated={handleComplaintCreated}
              setActiveTab={setActiveTab}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'audit' && isAuthority && (
            <AuditLogView
              auditLogs={auditLogs}
              onSelectComplaintById={handleSelectComplaintById}
              onReloadFromStorage={handleReloadFromStorage}
            />
          )}

          {activeTab === 'users' && isAuthority && (
            <AdminView currentUser={currentUser} />
          )}
        </main>

        {/* Footer */}
        <Footer setActiveTab={setActiveTab} />

        {/* Complaint Detail Modal */}
        {selectedComplaint && (
          <ComplaintDetailModal
            complaint={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
            onUpdateComplaint={handleUpdateComplaint}
            onAddAuditLog={handleAddAuditLog}
            auditLogs={auditLogs}
            currentUser={currentUser}
          />
        )}

        {/* Reset Confirmation Modal */}
        <ResetModal
          isOpen={isResetOpen}
          onClose={() => setIsResetOpen(false)}
          onConfirm={handleConfirmReset}
        />
      </div>
  )
}
