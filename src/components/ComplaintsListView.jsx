import React, { useState, useMemo } from 'react'
import { 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  AlertTriangle, 
  Copy, 
  PlusCircle, 
  Grid, 
  List, 
  ChevronRight,
  ShieldCheck,
  Building2,
  CheckCircle2
} from 'lucide-react'
import { CATEGORIES, STATUSES, PRIORITIES } from '../data/constants'
import { getDeadlineStatus } from '../utils/timeUtils'
import { useLanguage } from '../utils/LanguageContext'

export function ComplaintsListView({ 
  complaints = [], 
  onSelectComplaint, 
  setActiveTab,
  currentUser
}) {
  const { t, tCat, tStatus, tPriority } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedPriority, setSelectedPriority] = useState('ALL')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [citizenScope, setCitizenScope] = useState('ALL') // 'ALL' or 'MY'
  const isCitizen = currentUser && String(currentUser.role).toUpperCase() === 'CITIZEN'

  // Filter & Search logic
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchesQuery = 
          c.id.toLowerCase().includes(query) ||
          c.title.toLowerCase().includes(query) ||
          c.area.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query)) ||
          c.department.toLowerCase().includes(query)
        if (!matchesQuery) return false
      }

      // Category
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) {
        return false
      }

      // Status
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'Overdue') {
          const dl = getDeadlineStatus(c.deadline, c.status)
          if (!dl.isOverdue && c.status !== 'Escalated') return false
        } else if (c.status !== selectedStatus) {
          return false
        }
      }

      // Citizen Scope Filter
      if (isCitizen && citizenScope === 'MY') {
        const isOwner = c.citizenId === currentUser?.citizenId || (!c.isDemo && c.citizenId?.startsWith('CIT'))
        if (!isOwner) return false
      }

      return true
    })
  }, [complaints, searchTerm, selectedCategory, selectedStatus, selectedPriority, citizenScope, currentUser])

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.85rem' }}>
              {isCitizen ? t('board_title_citizen', 'Civic Grievance Tracker') : t('board_title')}
            </h1>
            <span className="badge badge-neutral">{filteredComplaints.length} {t('records')}</span>
          </div>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>
            {isCitizen 
              ? t('board_sub_citizen', 'Track real-time status of your grievances and inspect open community civic reports.')
              : t('board_sub')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Citizen Scope Segmented Toggle */}
          {isCitizen && (
            <div style={{ 
              display: 'flex', 
              gap: '0.25rem', 
              background: 'var(--bg-card)', 
              padding: '0.2rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--slate-300)' 
            }}>
              <button 
                type="button"
                className={`btn btn-sm ${citizenScope === 'ALL' ? 'btn-primary' : 'btn-subtle'}`}
                onClick={() => setCitizenScope('ALL')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                {t('filter_all_issues', 'All Issues')} ({complaints.length})
              </button>
              <button 
                type="button"
                className={`btn btn-sm ${citizenScope === 'MY' ? 'btn-primary' : 'btn-subtle'}`}
                onClick={() => setCitizenScope('MY')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                {t('filter_my_complaints', 'My Complaints')} ({complaints.filter(c => c.citizenId === currentUser.citizenId || (!c.isDemo && c.citizenId?.startsWith('CIT'))).length})
              </button>
            </div>
          )}
          {/* Grid / Table View Switcher */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--slate-300)', borderRadius: 'var(--radius-md)', padding: '0.2rem', display: 'flex', gap: '0.2rem' }}>
            <button 
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-subtle'}`}
              onClick={() => setViewMode('grid')}
              style={{ padding: '0.35rem 0.6rem' }}
              title={t('view_card', 'Card View')}
            >
              <Grid size={15} />
            </button>
            <button 
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-subtle'}`}
              onClick={() => setViewMode('table')}
              style={{ padding: '0.35rem 0.6rem' }}
              title={t('view_table', 'Table View')}
            >
              <List size={15} />
            </button>
          </div>

          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('report')}
          >
            <PlusCircle size={16} />
            <span>{isCitizen ? t('nav_file_grievance', 'File Grievance') : t('nav_file_complaint', 'File Complaint')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Search Input */}
          <div className="filter-search-span" style={{ position: 'relative' }}>
            <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <select 
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">{t('all_categories')}</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{tCat(c.label)}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select 
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">{t('all_statuses')}</option>
              <option value="Submitted">{t('status_submitted')}</option>
              <option value="In Progress">{t('status_in_progress')}</option>
              <option value="Awaiting Verification">{t('status_awaiting_verification')}</option>
              <option value="Resolved">{t('status_resolved')}</option>
              <option value="Escalated">{t('status_escalated')}</option>
              <option value="Overdue">⚠️ {t('status_overdue')}</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select 
              className="form-select"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="ALL">{t('all_priorities')}</option>
              <option value="Critical">{t('prio_critical')}</option>
              <option value="High">{t('prio_high')}</option>
              <option value="Medium">{t('prio_medium')}</option>
              <option value="Low">{t('prio_low')}</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
          <span>{t('quick_filters')}</span>
          <button 
            className={`sample-pill ${selectedStatus === 'Awaiting Verification' ? 'active' : ''}`}
            onClick={() => setSelectedStatus(selectedStatus === 'Awaiting Verification' ? 'ALL' : 'Awaiting Verification')}
          >
            {t('filter_awaiting_proof')} ({complaints.filter(c => c.status === 'Awaiting Verification').length})
          </button>
          <button 
            className={`sample-pill ${selectedStatus === 'Overdue' ? 'active' : ''}`}
            onClick={() => setSelectedStatus(selectedStatus === 'Overdue' ? 'ALL' : 'Overdue')}
          >
            {t('filter_overdue')} ({complaints.filter(c => getDeadlineStatus(c.deadline, c.status).isOverdue || c.status === 'Escalated').length})
          </button>
          <button 
            className={`sample-pill ${selectedCategory === 'Garbage' ? 'active' : ''}`}
            onClick={() => setSelectedCategory(selectedCategory === 'Garbage' ? 'ALL' : 'Garbage')}
          >
            {t('filter_garbage')}
          </button>
          {(searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL') && (
            <button 
              className="sample-pill"
              style={{ background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('ALL')
                setSelectedStatus('ALL')
                setSelectedPriority('ALL')
              }}
            >
              {t('clear_filters')}
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredComplaints.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--slate-500)' }}>
          <Search size={36} color="var(--slate-400)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--navy-900)', marginBottom: '0.35rem' }}>{t('no_matching_complaints')}</h3>
          <p style={{ fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {t('try_adjusting_filters')}
          </p>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('ALL')
              setSelectedStatus('ALL')
              setSelectedPriority('ALL')
            }}
          >
            {t('reset_all_filters')}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Card View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
          {filteredComplaints.map(c => {
            const deadline = getDeadlineStatus(c.deadline, c.status)
            return (
              <div 
                key={c.id} 
                className="card card-interactive"
                onClick={() => onSelectComplaint(c)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderTop: c.status === 'Escalated' || deadline.isOverdue ? '4px solid var(--danger)' : 
                             c.status === 'Resolved' ? '4px solid var(--success)' : 
                             c.status === 'Awaiting Verification' ? '4px solid #2563eb' : '4px solid var(--primary)'
                }}
              >
                <div>
                  {/* Top card metadata */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.78rem', color: 'var(--slate-600)' }}>
                      {c.id}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className={`badge ${
                        c.priority === 'Critical' ? 'badge-danger' : 
                        c.priority === 'High' ? 'badge-warning' : 'badge-neutral'
                      }`}>
                        {tPriority(c.priority)}
                      </span>
                      <span className={`badge ${
                        c.status === 'Resolved' ? 'badge-success' : 
                        c.status === 'Escalated' || c.status === 'Flagged for Review' ? 'badge-danger' : 
                        c.status === 'Awaiting Verification' || c.status === 'AI Verified' ? 'badge-info' : 
                        c.status === 'In Progress' || c.status === 'Needs More Evidence' ? 'badge-warning' : 'badge-primary'
                      }`}>
                        {tStatus(c.status)}
                      </span>
                    </div>
                  </div>

                  {/* Title & Preview Image */}
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.45rem', color: 'var(--navy-900)', lineHeight: 1.35 }}>
                    {c.title}
                  </h3>

                  <p style={{ fontSize: '0.82rem', color: 'var(--slate-600)', marginBottom: '0.85rem', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical' }}>
                    {c.description}
                  </p>

                  {/* Location & Department */}
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ color: 'var(--slate-400)' }}>📍</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.area}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building2 size={13} color="var(--slate-400)" />
                      <span>{c.department}</span>
                    </div>
                  </div>

                  {/* Duplicate notice if linked */}
                  {c.duplicateIds && c.duplicateIds.length > 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                      <Copy size={12} />
                      <span>{t('linked_duplicate_with', 'Linked duplicate with')} {c.duplicateIds[0]}</span>
                    </div>
                  )}
                </div>

                {/* Footer of card: SLA & Action CTA */}
                <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={`badge ${deadline.badgeClass}`} style={{ fontSize: '0.72rem' }}>
                    <Clock size={11} />
                    {deadline.label}
                  </span>

                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    {t('inspect_details')} <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('ticket_id')}</th>
                <th>{t('title')}</th>
                <th>{t('category')}</th>
                <th>{t('location_area')}</th>
                <th>{t('department')}</th>
                <th>{t('priority')}</th>
                <th>{t('status')}</th>
                <th>{t('sla_deadline')}</th>
                <th>{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map(c => {
                const deadline = getDeadlineStatus(c.deadline, c.status)
                return (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{c.id}</td>
                    <td style={{ maxWidth: '240px', fontWeight: 600 }}>{c.title}</td>
                    <td><span className="badge badge-neutral">{tCat(c.category)}</span></td>
                    <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.area}</td>
                    <td>{c.department}</td>
                    <td>
                      <span className={`badge ${
                        c.priority === 'Critical' ? 'badge-danger' : 
                        c.priority === 'High' ? 'badge-warning' : 'badge-neutral'
                      }`}>
                        {tPriority(c.priority)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        c.status === 'Resolved' ? 'badge-success' : 
                        c.status === 'Escalated' || c.status === 'Flagged for Review' ? 'badge-danger' : 
                        c.status === 'Awaiting Verification' || c.status === 'AI Verified' ? 'badge-info' : 
                        c.status === 'In Progress' || c.status === 'Needs More Evidence' ? 'badge-warning' : 'badge-primary'
                      }`}>
                        {tStatus(c.status)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${deadline.badgeClass}`}>
                        {deadline.label}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => onSelectComplaint(c)}
                      >
                        {t('inspect')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
