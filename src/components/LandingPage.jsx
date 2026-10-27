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

export function LandingPage({ setActiveTab, onSelectSample }) {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-pill">
            <Sparkles size={14} />
            <span>CivicTech Innovation • Hackathon Edition</span>
          </div>

          <h1 className="hero-title">
            From Citizen Reports to <span className="gradient-text">Verified Resolution</span>.
          </h1>

          <p className="hero-subtitle">
            Traditional civic complaint portals suffer from duplicate reports, misrouted departments, missed deadlines, and unverified closures. CivicFix AI intelligently triages civic issues and ensures real accountability.
          </p>

          <div className="hero-cta-group">
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => setActiveTab('report')}
            >
              <PlusCircle size={18} />
              <span>Report an Issue</span>
            </button>
            <button 
              className="btn btn-secondary btn-lg"
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Open Dashboard</span>
            </button>
          </div>

          <div className="hero-meta">
            <div className="hero-meta-item">
              <CheckCircle2 size={16} color="var(--success)" />
              <span>Deduplication Engine</span>
            </div>
            <div className="hero-meta-item">
              <CheckCircle2 size={16} color="var(--primary)" />
              <span>SLA Escalation Sentinel</span>
            </div>
            <div className="hero-meta-item">
              <CheckCircle2 size={16} color="var(--teal-600)" />
              <span>Evidence Verification</span>
            </div>
          </div>
        </div>
      </section>

      {/* The 4-Step End-to-End Civic Workflow */}
      <section style={{ padding: '4rem 0', background: '#ffffff', borderBottom: '1px solid var(--slate-200)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>Full Lifecycle</span>
            <h2>How CivicFix AI Works</h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              A closed-loop workflow ensuring every grievance moves from submission to verified on-ground proof.
            </p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <div className="step-icon-wrap">
                <PlusCircle size={22} />
              </div>
              <h3 className="step-title">Citizen Reports</h3>
              <p className="step-desc">
                Citizens submit issue details and photos. The system accepts location coordinates and category tags.
              </p>
            </div>

            <div className="workflow-step">
              <div className="step-number">2</div>
              <div className="step-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                <Sparkles size={22} />
              </div>
              <h3 className="step-title">Intelligent Triage</h3>
              <p className="step-desc">
                Rule-based intelligence extracts urgency keywords, matches departments, assigns SLA deadlines, and flags duplicate tickets.
              </p>
            </div>

            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="step-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
                <Clock size={22} />
              </div>
              <h3 className="step-title">Dispatch & SLA Tracking</h3>
              <p className="step-desc">
                Issues are routed to field engineers. The SLA Sentinel counts down hours and auto-escalates overdue work to senior supervisors.
              </p>
            </div>

            <div className="workflow-step">
              <div className="step-number">4</div>
              <div className="step-icon-wrap" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <FileCheck size={22} />
              </div>
              <h3 className="step-title">Verified Resolution</h3>
              <p className="step-desc">
                Workers submit photo evidence of completed repairs. A municipal reviewer must explicitly approve evidence before closure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ padding: '4.5rem 0', background: 'var(--bg-main)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
            <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>Platform Features</span>
            <h2>Solving Real Municipal Friction</h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              Civic authorities lose thousands of hours handling duplicate requests and unverified contractor claims. CivicFix AI provides clear guardrails.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Copy size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Semantic Deduplication</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
                Detects multiple citizens reporting the same overflowing dumpster or crater on the same street. Links tickets instead of dispatching duplicate repair crews.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Building2 size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Transparent Department Routing</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
                Categorizes grievances directly to Roads & Infrastructure, Sanitation, Electrical, or Water Board with explainable reasoning rules.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>SLA Escalation Sentinel</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
                Every complaint carries a deterministic 12h, 24h, or 48h deadline based on hazard level. Breached SLAs trigger urgent escalation flags in red.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <FileCheck size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Evidence Review & Anti-Ghosting</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
                Workers cannot close tickets without photographic proof. Municipal supervisors can approve or reject evidence with mandatory audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Judge Demo Launcher */}
      <section style={{ padding: '3.5rem 0 5rem', background: '#ffffff', borderTop: '1px solid var(--slate-200)' }}>
        <div className="container">
          <div style={{ 
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
            borderRadius: 'var(--radius-xl)', 
            padding: '2.5rem', 
            color: '#ffffff',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
              <div style={{ maxWidth: '580px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(2, 132, 199, 0.25)', border: '1px solid #0284c7', color: '#7dd3fc', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  <Zap size={13} />
                  <span>Interactive Judge Walkthrough</span>
                </div>
                <h3 style={{ fontSize: '1.75rem', color: '#ffffff', marginBottom: '0.75rem' }}>
                  Experience the End-to-End Demo in 60 Seconds
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  Our prototype is pre-seeded with 6 realistic scenarios: an overdue pothole requiring escalation, duplicate garbage reports, and a pipeline repair waiting for photographic proof approval.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '240px' }}>
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                  onClick={() => setActiveTab('complaints')}
                >
                  <span>Explore All Complaints</span>
                  <ArrowRight size={16} />
                </button>
                <button 
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'space-between', color: 'var(--navy-900)' }}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <span>View Live Metrics</span>
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
