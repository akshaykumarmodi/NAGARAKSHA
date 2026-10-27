import React from 'react'
import { Sparkles, Heart } from 'lucide-react'
import { NagarakshakLogo } from './NagarakshakLogo'
import { useLanguage } from '../utils/LanguageContext'

export function Footer({ setActiveTab }) {
  const { t } = useLanguage()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          {/* Col 1 */}
          <div style={{ maxWidth: '360px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div className="brand-icon" style={{ width: '2.2rem', height: '2.2rem', padding: '2px' }}>
                <NagarakshakLogo size={22} />
              </div>
              <span style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1.1rem' }}>NAGARA<span style={{ color: 'var(--accent-saffron)' }}>KSHAK</span></span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', lineHeight: 1.6 }}>
              {t('footer_desc', 'Technology that empowers citizens to report civic issues, improve urban safety, and build cleaner, better-connected communities.')}
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>
              {t('footer_nav')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
              <a href="#overview" onClick={(e) => { e.preventDefault(); setActiveTab('home'); }} style={{ color: 'var(--slate-600)' }}>{t('nav_overview')}</a>
              <a href="#dashboard" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }} style={{ color: 'var(--slate-600)' }}>{t('nav_dashboard')}</a>
              <a href="#complaints" onClick={(e) => { e.preventDefault(); setActiveTab('complaints'); }} style={{ color: 'var(--slate-600)' }}>{t('nav_complaints')}</a>
              <a href="#report" onClick={(e) => { e.preventDefault(); setActiveTab('report'); }} style={{ color: 'var(--slate-600)' }}>{t('nav_report')}</a>
              <a href="#audit" onClick={(e) => { e.preventDefault(); setActiveTab('audit'); }} style={{ color: 'var(--slate-600)' }}>{t('nav_audit')}</a>
            </div>
          </div>

          {/* Col 3 */}
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>
              {t('footer_demo_cap')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              <span>{t('footer_cap_1', '• Semantic Duplicate Detection')}</span>
              <span>{t('footer_cap_2', '• Automated Department Routing')}</span>
              <span>{t('footer_cap_3', '• Real-Time SLA Escalation Sentinel')}</span>
              <span>{t('footer_cap_4', '• Evidence Verification Workflow')}</span>
              <span>{t('footer_cap_5', '• Browser LocalStorage Persistence')}</span>
            </div>
          </div>

          {/* Col 4 */}
          <div>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>
              {t('footer_about_title', 'About NAGARAKSHAK')}
            </h4>
            <div style={{ background: 'var(--slate-100)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--slate-600)', maxWidth: '280px', lineHeight: 1.5 }}>
              {t('footer_about_text', 'Technology that empowers citizens to report civic issues, improve urban safety, and build cleaner, better-connected communities.')}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            {t('footer_copy', '© 2026 NAGARAKSHAK • Smarter Cities, Safer Communities • Built with React & Vite')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>{t('designed_transparency')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
