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
import { 
  getStoredComplaints, 
  saveComplaints, 
  getStoredAuditLogs, 
  saveAuditLogs, 
  appendAuditLog, 
  resetDemoStorage 
} from './utils/storage'
import { getDeadlineStatus } from './utils/timeUtils'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [complaints, setComplaints] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Initialize from storage on mount
  useEffect(() => {
    const loadedComplaints = getStoredComplaints()
    const loadedLogs = getStoredAuditLogs()
    setComplaints(loadedComplaints)
    setAuditLogs(loadedLogs)
  }, [])

  // Toast notification helper
  const showToast = (msg, duration = 3500) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, duration)
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
      actor: 'Citizen Portal',
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
          actor: 'CivicFix SLA Sentinel',
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

  // Jump to complaint from audit log
  const handleSelectComplaintById = (id) => {
    const target = complaints.find(c => c.id === id)
    if (target) {
      setSelectedComplaint(target)
    }
  }

  return (
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetClick={() => setIsResetOpen(true)}
        onCheckDeadlines={handleCheckDeadlines}
        overdueCount={overdueCount}
      />

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <LandingPage 
            setActiveTab={setActiveTab} 
            onSelectSample={() => setActiveTab('complaints')}
          />
        )}

        {activeTab === 'dashboard' && (
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
          />
        )}

        {activeTab === 'report' && (
          <ReportIssueView 
            existingComplaints={complaints}
            onComplaintCreated={handleComplaintCreated}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogView 
            auditLogs={auditLogs}
            onSelectComplaintById={handleSelectComplaintById}
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
