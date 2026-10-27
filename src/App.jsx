import React, { useState, useEffect } from 'react'
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
import { authService } from './services/authService'
import { 
  getStoredComplaints, 
  saveComplaints, 
  getStoredAuditLogs, 
  saveAuditLogs, 
  appendAuditLog, 
  resetDemoStorage 
} from './utils/storage'
import { getDeadlineStatus } from './utils/timeUtils'
import { LanguageProvider } from './utils/LanguageContext'

export default function App() {
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

  // Subscribe to auth service changes across components / tabs
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

  // Theme state: 'light' or 'dark'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('nagarakshak_theme') || 'light'
    } catch (e) {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('nagarakshak_theme', theme)
    } catch (e) {}
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  // Initialize from storage on mount
  useEffect(() => {
    const loadedComplaints = getStoredComplaints()
    const loadedLogs = getStoredAuditLogs()
    setComplaints(loadedComplaints)
    setAuditLogs(loadedLogs)
  }, [])

  // Determine role safely
  const isCitizen = currentUser && String(currentUser.role).toUpperCase() === 'CITIZEN'
  const isAuthority = currentUser && !isCitizen

  // Enforce role-based access rules: prevent citizens from entering authority views
  useEffect(() => {
    if (isCitizen) {
      if (activeTab === 'dashboard' || activeTab === 'audit') {
        setActiveTab('complaints')
        showToast('⚠️ Access Restricted: Municipal Command Center requires Authority credentials.')
      }
    }
  }, [isCitizen, activeTab])

  // Toast notification helper
  const showToast = (msg, duration = 3500) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, duration)
  }

  // Login handler
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

  // Logout handler
  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
    setActiveTab('home')
    setSelectedComplaint(null)
    showToast('🔒 Session ended. You have been returned to the Login Portal.')
  }

  // Count active overdue complaints
  const overdueCount = complaints.filter(c => {
    if (c.status === 'Resolved') return false
    const s = getDeadlineStatus(c.deadline, c.status)
    return s.isOverdue || c.status === 'Escalated'
  }).length

  // Add new complaint
  const handleComplaintCreated = (newComplaint) => {
    const updated = [newComplaint, ...complaints]
    setComplaints(updated)
    saveComplaints(updated)

    // Audit log
    const updatedLogs = appendAuditLog({
      complaintId: newComplaint.id,
      type: 'COMPLAINT_CREATED',
      actor: currentUser?.name || 'Citizen Portal',
      title: 'New Complaint Registered',
      description: `Classified as ${newComplaint.category} and routed to ${newComplaint.department}. Priority: ${newComplaint.priority} (${newComplaint.slaHours}h SLA).`
    })
    setAuditLogs(updatedLogs)
    showToast(`✅ Complaint ${newComplaint.id} registered and triaged!`)
  }

  // Update existing complaint (e.g. status transition, reviewer sign-off, reassignment)
  const handleUpdateComplaint = (updatedComplaint) => {
    const updatedList = complaints.map(c => c.id === updatedComplaint.id ? updatedComplaint : c)
    setComplaints(updatedList)
    saveComplaints(updatedList)
    setSelectedComplaint(updatedComplaint)
    showToast(`Updated ticket ${updatedComplaint.id} (Status: ${updatedComplaint.status})`)
  }

  // Append new audit log
  const handleAddAuditLog = (entry) => {
    const updated = appendAuditLog(entry)
    setAuditLogs(updated)
  }

  // Check SLA deadlines & trigger auto-escalations
  const handleCheckDeadlines = () => {
    let newlyEscalated = 0
    const updated = complaints.map(c => {
      if (c.status === 'Resolved') return c
      const stat = getDeadlineStatus(c.deadline, c.status)
      if (stat.isOverdue && c.status !== 'Escalated') {
        newlyEscalated++
        appendAuditLog({
          complaintId: c.id,
          type: 'AUTO_ESCALATION',
          actor: 'NAGARAKSHAK SLA Sentinel',
          title: 'Deadline Exceeded: Auto-Escalated',
          description: `Complaint exceeded designated SLA deadline without confirmed resolution. Flagged for senior municipal attention.`
        })
        return {
          ...c,
          status: 'Escalated'
        }
      }
      return c
    })

    setComplaints(updated)
    saveComplaints(updated)
    setAuditLogs(getStoredAuditLogs())

    if (newlyEscalated > 0) {
      showToast(`⚠️ SLA Sentinel: Found ${newlyEscalated} overdue complaints and triggered escalations!`)
    } else {
      showToast(`⏱️ SLA Sentinel: All active complaints audited. ${overdueCount} issue(s) in escalation status.`)
    }
  }

  // Reset demo
  const handleConfirmReset = () => {
    const { complaints: newComplaints, auditLogs: newLogs } = resetDemoStorage()
    setComplaints(newComplaints)
    setAuditLogs(newLogs)
    setSelectedComplaint(null)
    setIsResetOpen(false)
    showToast('🔄 Demo data reset to initial presentation defaults!')
  }

  // Reload state from storage (e.g. after database JSON import)
  const handleReloadFromStorage = () => {
    setComplaints(getStoredComplaints())
    setAuditLogs(getStoredAuditLogs())
    showToast('💾 Database snapshot imported and state refreshed!')
  }

  // Jump to complaint from audit log
  const handleSelectComplaintById = (id) => {
    const target = complaints.find(c => c.id === id)
    if (target) {
      setSelectedComplaint(target)
    }
  }

  // If no active session, render dedicated Login Page as entry point
  if (!currentUser) {
    return (
      <LanguageProvider>
        <LoginView 
          onLoginSuccess={handleLoginSuccess}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </LanguageProvider>
    )
  }

  return (
    <LanguageProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            background: 'var(--navy-950)',
            color: '#ffffff',
            padding: '0.85rem 1.4rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            fontSize: '0.88rem',
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'modalIn 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {toastMessage}
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
        />

        {/* Main View Router */}
        <main style={{ flex: 1 }}>
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
        </main>

        {/* Footer */}
        <Footer setActiveTab={setActiveTab} />

        {/* Detail Inspection Modal */}
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
    </LanguageProvider>
  )
}
