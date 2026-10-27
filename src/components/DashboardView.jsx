import React from 'react'
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  TrendingUp, 
  ShieldAlert, 
  ChevronRight, 
  ArrowUpRight,
  Filter,
  BarChart2,
  RefreshCw
} from 'lucide-react'
import { getDeadlineStatus, formatRelativeTime } from '../utils/timeUtils'
import { CATEGORIES } from '../data/constants'
import { useLanguage } from '../utils/LanguageContext'

export function DashboardView({ 
  complaints = [], 
  setActiveTab, 
  onSelectComplaint, 
  onCheckDeadlines 
}) {
  const { t, tCat, tStatus } = useLanguage()

  // Real dynamic calculations from complaints state
  const total = complaints.length
  const submitted = complaints.filter(c => c.status === 'Submitted' || c.status === 'AI Verified' || c.status === 'Needs More Evidence' || c.status === 'Flagged for Review').length
  const inProgress = complaints.filter(c => c.status === 'In Progress').length
  const awaitingReview = complaints.filter(c => c.status === 'Awaiting Verification').length
  const resolved = complaints.filter(c => c.status === 'Resolved').length
  const escalated = complaints.filter(c => c.status === 'Escalated').length
  
  // Real overdue check
  const overdueCount = complaints.filter(c => {
    if (c.status === 'Resolved') return false
    const stat = getDeadlineStatus(c.deadline, c.status)
    return stat.isOverdue || c.status === 'Escalated'
  }).length

  // High Priority / Critical items
  const highPriorityItems = complaints.filter(
    c => (c.priority === 'Critical' || c.priority === 'High' || c.status === 'Escalated') && c.status !== 'Resolved'
  )

  // Category breakdown calculation
  const categoryCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: complaints.filter(c => c.category === cat.id).length,
    percentage: total > 0 ? Math.round((complaints.filter(c => c.category === cat.id).length / total) * 100) : 0
  }))

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      {/* Dashboard Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.85rem' }}>{t('dash_title')}</h1>
            <span className="badge badge-primary">{t('live_state')}</span>
          </div>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>
            {t('dash_sub')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={onCheckDeadlines}
          >
            <Clock size={16} />
            <span>{t('nav_check_slas')}</span>
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('report')}
          >
            <PlusCircle size={16} />
            <span>{t('nav_file_complaint')}</span>
          </button>
        </div>
      </div>

      {/* Primary 5 Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">{t('total_complaints')}</div>
            <div className="stat-value">{total}</div>
            <div className="stat-subtext">{t('active_archived')}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <FileText size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">{t('submitted')}</div>
            <div className="stat-value" style={{ color: 'var(--info)' }}>{submitted}</div>
            <div className="stat-subtext">{t('awaiting_triage')}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">{t('in_progress')}</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{inProgress}</div>
            <div className="stat-subtext">{t('crew_dispatched')}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Clock size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">{t('awaiting_review')}</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{awaitingReview}</div>
            <div className="stat-subtext">{t('proof_uploaded')}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">{t('resolved')}</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{resolved}</div>
            <div className="stat-subtext">{t('evidence_verified')}</div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: overdueCount > 0 ? 'var(--danger-border)' : 'var(--slate-200)', background: overdueCount > 0 ? 'var(--danger-bg)' : 'var(--bg-card)' }}>
          <div>
            <div className="stat-label" style={{ color: overdueCount > 0 ? 'var(--danger)' : 'var(--slate-500)' }}>
              {t('overdue_escalated')}
            </div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{overdueCount}</div>
            <div className="stat-subtext" style={{ color: overdueCount > 0 ? 'var(--danger)' : 'var(--slate-500)' }}>
              {overdueCount > 0 ? t('exceeded_deadline') : t('within_sla')}
            </div>
          </div>
          <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <ShieldAlert size={20} />
          </div>
        </div>
      </div>

      {/* Visual Analytics & Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Category Distribution Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={18} color="var(--primary)" />
              <span>{t('category_dist')}</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{total} Total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categoryCounts.map(cat => (
              <div key={cat.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{tCat(cat.label)}</span>
                  <span style={{ color: 'var(--slate-500)' }}>{cat.count} ({cat.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--slate-100)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${cat.percentage}%`, 
                      height: '100%', 
                      background: cat.color, 
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLA & Resolution Health Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--teal-600)" />
              <span>{t('sla_health')}</span>
            </h3>
            <span className="badge badge-success">Demo Engine</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('resolution_compliance')}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {total > 0 ? Math.round(((total - overdueCount) / total) * 100) : 100}%
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--slate-500)', lineHeight: 1.4 }}>
                Percentage of active complaints currently within their designated SLA window.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'var(--success-bg)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--success-border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)' }}>{t('closed_verified')}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>{resolved}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--success)' }}>Photo proof approved</div>
              </div>

              <div style={{ background: 'var(--info-bg)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--info-border)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--info)' }}>{t('pending_audit')}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--info)' }}>{awaitingReview}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--info)' }}>Ready for inspection</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Priority / Escalated Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--danger)" />
              <span>{t('urgent_attention')}</span>
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
              {t('urgent_attention_sub')}
            </p>
          </div>
          <button 
            className="btn btn-subtle btn-sm"
            onClick={() => setActiveTab('complaints')}
          >
            <span>{t('view_all')}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {highPriorityItems.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)' }}>
            <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontWeight: 600 }}>{t('no_urgent_escalations')}</p>
            <p style={{ fontSize: '0.8rem' }}>{t('all_within_params')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1rem' }}>
            {highPriorityItems.slice(0, 3).map(c => {
              const deadlineInfo = getDeadlineStatus(c.deadline, c.status)
              return (
                <div 
                  key={c.id} 
                  className="card card-interactive"
                  onClick={() => onSelectComplaint(c)}
                  style={{ borderLeft: c.status === 'Escalated' || deadlineInfo.isOverdue ? '4px solid var(--danger)' : '4px solid var(--warning)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', fontFamily: 'var(--font-mono)' }}>
                      {c.id}
                    </span>
                    <span className={`badge ${deadlineInfo.badgeClass}`}>
                      {deadlineInfo.label}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: 'var(--navy-900)' }}>
                    {c.title}
                  </h4>

                  <p style={{ fontSize: '0.82rem', color: 'var(--slate-600)', marginBottom: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebKitLineClamp: 2, WebKitBoxOrient: 'vertical' }}>
                    {c.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--slate-500)', borderTop: '1px solid var(--slate-200)', paddingTop: '0.5rem' }}>
                    <span>{c.department}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      {t('review_action')} <ArrowUpRight size={12} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Activity Mini List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>{t('recent_registry')}</h2>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('complaints')}
          >
            <span>{t('full_board')}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('ticket_id')}</th>
                <th>{t('category')}</th>
                <th>{t('location_area')}</th>
                <th>{t('department')}</th>
                <th>{t('status')}</th>
                <th>{t('sla_deadline')}</th>
                <th>{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {complaints.slice(0, 5).map(c => {
                const deadline = getDeadlineStatus(c.deadline, c.status)
                return (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--navy-900)' }}>
                      {c.id}
                    </td>
                    <td>
                      <span className="badge badge-neutral">{tCat(c.category)}</span>
                    </td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.area}
                    </td>
                    <td>{c.department}</td>
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
                        className="btn btn-subtle btn-sm"
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
      </div>
    </div>
  )
}
