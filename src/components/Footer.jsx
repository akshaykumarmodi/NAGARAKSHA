import React from 'react'
import { ShieldCheck, Sparkles, Heart } from 'lucide-react'

export function Footer({ setActiveTab }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          {/* Col 1 */}
          <div style={{ maxWidth: '360px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div className="brand-icon" style={{ width: '2rem', height: '2rem' }}>
                <ShieldCheck size={18} />
              </div>
              <span style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1.1rem' }}>CivicFix AI</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', lineHeight: 1.6 }}>
              A smart civic complaint management prototype designed to organize complaints, detect duplicates, assign departments, enforce SLA deadlines, and verify resolution evidence.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>
              Navigation
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
              <a href="#overview" onClick={(e) => { e.preventDefault(); setActiveTab('home'); }} style={{ color: 'var(--slate-600)' }}>Platform Overview</a>
              <a href="#dashboard" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }} style={{ color: 'var(--slate-600)' }}>Analytics Dashboard</a>
              <a href="#complaints" onClick={(e) => { e.preventDefault(); setActiveTab('complaints'); }} style={{ color: 'var(--slate-600)' }}>Complaints Board</a>
              <a href="#report" onClick={(e) => { e.preventDefault(); setActiveTab('report'); }} style={{ color: 'var(--slate-600)' }}>Report an Issue</a>
              <a href="#audit" onClick={(e) => { e.preventDefault(); setActiveTab('audit'); }} style={{ color: 'var(--slate-600)' }}>System Audit Trail</a>
            </div>
          </div>

          {/* Col 3 */}
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>
              Demo Capabilities
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              <span>• Semantic Duplicate Detection</span>
              <span>• Automated Department Routing</span>
              <span>• Real-Time SLA Escalation Sentinel</span>
              <span>• Evidence Verification Workflow</span>
              <span>• Browser LocalStorage Persistence</span>
            </div>
          </div>

          {/* Col 4 */}
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>
              Hackathon Disclaimer
            </h4>
            <div style={{ background: 'var(--slate-100)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--slate-600)', maxWidth: '280px', lineHeight: 1.5 }}>
              This project is an academic hackathon prototype with sample data. Department assignments and resolution reviews are simulated for demonstration.
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © 2026 CivicFix AI • Hackathon Team Prototype • Built with React & Vite
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Designed for transparency and civic accountability</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
