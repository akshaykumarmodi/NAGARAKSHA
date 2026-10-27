import React from 'react'
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  LayoutDashboard, 
  PlusCircle, 
  Copy, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  FileCheck,
  Search,
  Zap
} from 'lucide-react'
import { useLanguage } from '../utils/LanguageContext'

export function LandingPage({ setActiveTab, onSelectSample, currentUser }) {
  const { t } = useLanguage()

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-pill">
            <Sparkles size={14} />
            <span>{t('hero_pill', 'CivicTech Innovation • NAGARAKSHAK')}</span>
          </div>

          <h1 className="hero-title">
            {t('hero_title_1', 'From Citizen Reports to ')}
            <span className="gradient-text">{t('hero_title_2', 'Verified Resolution')}</span>.
          </h1>

          <p className="hero-subtitle">
            {t('hero_sub', 'Technology that empowers citizens to report civic issues, improve urban safety, and build cleaner, better-connected communities.')}
          </p>

          <div className="hero-cta-group">
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => setActiveTab('report')}
            >
              <PlusCircle size={18} />
              <span>{t('hero_report_btn', 'Report an Issue')}</span>
            </button>
            {String(currentUser?.role).toUpperCase() === 'CITIZEN' ? (
              <button 
                className="btn btn-secondary btn-lg"
                onClick={() => setActiveTab('complaints')}
              >
                <FileCheck size={18} />
                <span>Track My Grievances</span>
              </button>
            ) : (
              <button 
                className="btn btn-secondary btn-lg"
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>{t('hero_dash_btn', 'Open Dashboard')}</span>
              </button>
            )}
          </div>

          <div className="hero-meta">
            <div className="hero-meta-item">
              <CheckCircle2 size={16} color="var(--success)" />
              <span>{t('dedup_engine', 'Deduplication Engine')}</span>
            </div>
            <div className="hero-meta-item">
              <CheckCircle2 size={16} color="var(--primary)" />
              <span>{t('sla_sentinel', 'SLA Escalation Sentinel')}</span>
            </div>
            <div className="hero-meta-item">
              <CheckCircle2 size={16} color="var(--teal-600)" />
              <span>{t('evidence_verif', 'Evidence Verification')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* The 4-Step End-to-End Civic Workflow */}
      <section style={{ padding: '4rem 0', background: 'var(--bg-card)', borderBottom: '1px solid var(--slate-200)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>{t('full_lifecycle', 'Full Lifecycle')}</span>
            <h2>{t('how_it_works', 'How NAGARAKSHAK Works')}</h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              {t('how_it_works_sub', 'A closed-loop workflow ensuring every grievance moves from submission to verified on-ground proof.')}
            </p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <div className="step-icon-wrap">
                <PlusCircle size={22} />
              </div>
              <h3 className="step-title">{t('step1_title', 'Citizen Reports')}</h3>
              <p className="step-desc">
                {t('step1_desc', 'Citizens submit issue details and photos. The system accepts location coordinates and category tags.')}
              </p>
            </div>

            <div className="workflow-step">
              <div className="step-number">2</div>
              <div className="step-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                <Sparkles size={22} />
              </div>
              <h3 className="step-title">{t('step2_title', 'Intelligent Triage')}</h3>
              <p className="step-desc">
                {t('step2_desc', 'Rule-based intelligence extracts urgency keywords, matches departments, assigns SLA deadlines, and flags duplicate tickets.')}
              </p>
            </div>

            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="step-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                <Clock size={22} />
              </div>
              <h3 className="step-title">{t('step3_title', 'Dispatch & SLA Tracking')}</h3>
              <p className="step-desc">
                {t('step3_desc', 'Issues are routed to field engineers. The SLA Sentinel counts down hours and auto-escalates overdue work to senior supervisors.')}
              </p>
            </div>

            <div className="workflow-step">
              <div className="step-number">4</div>
              <div className="step-icon-wrap" style={{ background: 'rgba(124, 58, 237, 0.15)', color: 'var(--purple)' }}>
                <FileCheck size={22} />
              </div>
              <h3 className="step-title">{t('step4_title', 'Verified Resolution')}</h3>
              <p className="step-desc">
                {t('step4_desc', 'Workers submit photo evidence of completed repairs. A municipal reviewer must explicitly approve evidence before closure.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ padding: '4.5rem 0', background: 'var(--bg-main)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
            <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>{t('platform_features', 'Platform Features')}</span>
            <h2>{t('solving_friction', 'Solving Real Municipal Friction')}</h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              {t('solving_friction_sub', 'Civic authorities lose thousands of hours handling duplicate requests and unverified contractor claims. NAGARAKSHAK provides clear guardrails.')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Copy size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('dedup_engine', 'Semantic Deduplication')}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
                {t('feature_dedup_desc', 'Detects multiple citizens reporting the same overflowing dumpster or crater on the same street. Links tickets instead of dispatching duplicate repair crews.')}
              </p>
            </div>

            <div className="card">
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Building2 size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('dept_routing_title', 'Transparent Department Routing')}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
                {t('dept_routing_desc', 'Categorizes grievances directly to Roads & Infrastructure, Sanitation, Electrical, or Water Board with explainable reasoning rules.')}
              </p>
            </div>

            <div className="card">
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('sla_sentinel', 'SLA Escalation Sentinel')}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
                {t('sla_sentinel_desc', 'Every complaint carries a deterministic 12h, 24h, or 48h deadline based on hazard level. Breached SLAs trigger urgent escalation flags in red.')}
              </p>
            </div>

            <div className="card">
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(124, 58, 237, 0.15)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <FileCheck size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t('evidence_verif', 'Evidence Review & Anti-Ghosting')}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
                {t('evidence_verif_desc', 'Workers cannot close tickets without photographic proof. Municipal supervisors can approve or reject evidence with mandatory audit logs.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Judge Demo Launcher */}
      <section style={{ padding: '3.5rem 0 5rem', background: 'var(--bg-main)', borderTop: '1px solid var(--slate-200)' }}>
        <div className="container">
          <div style={{ 
            background: 'linear-gradient(135deg, #0a1128 0%, #152243 100%)', 
            borderRadius: 'var(--radius-xl)', 
            padding: '2.5rem', 
            color: '#ffffff',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
              <div style={{ maxWidth: '580px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(217, 119, 6, 0.25)', border: '1px solid #d97706', color: '#fde68a', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  <Zap size={13} />
                  <span>{t('interact_judge_walkthrough', 'Interactive Judge Walkthrough')}</span>
                </div>
                <h3 style={{ fontSize: '1.75rem', color: '#ffffff', marginBottom: '0.75rem' }}>
                  {t('walkthrough_title', 'Experience the End-to-End Demo in 60 Seconds')}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  {t('walkthrough_sub', 'Our prototype is pre-seeded with 6 realistic scenarios: an overdue pothole requiring escalation, duplicate garbage reports, and a pipeline repair waiting for photographic proof approval.')}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '240px' }}>
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                  onClick={() => setActiveTab('complaints')}
                >
                  <span>{t('explore_complaints', 'Explore All Complaints')}</span>
                  <ArrowRight size={16} />
                </button>
                <button 
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'space-between', color: 'var(--navy-900)' }}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <span>{t('view_live_metrics', 'View Live Metrics')}</span>
                  <LayoutDashboard size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
