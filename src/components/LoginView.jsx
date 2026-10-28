import React, { useState } from 'react'
import { 
  UserCheck, 
  Building2, 
  ShieldCheck, 
  Lock, 
  Phone, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Sun,
  Moon,
  Languages,
  BadgeCheck,
  FileText
} from 'lucide-react'
import { NagarakshakLogo } from './NagarakshakLogo'
import { authService, DEMO_CREDENTIALS } from '../services/authService'
import { useLanguage } from '../utils/LanguageContext'

export function LoginView({ onLoginSuccess, theme = 'light', toggleTheme }) {
  const { lang, setLang, t } = useLanguage()
  const [activeRoleTab, setActiveRoleTab] = useState('citizen') // 'citizen' or 'authority'
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Citizen Form State
  const [citizenId, setCitizenId] = useState(DEMO_CREDENTIALS.citizen.mobile)
  const [citizenPasscode, setCitizenPasscode] = useState(DEMO_CREDENTIALS.citizen.defaultPasscode)

  // Citizen Registration State
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [regName, setRegName] = useState('')
  const [regMobile, setRegMobile] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regWard, setRegWard] = useState('Ward 42 (Indiranagar)')

  // Authority Form State
  const [authorityBadge, setAuthorityBadge] = useState(DEMO_CREDENTIALS.authority.badgeNumber)
  const [authorityPassword, setAuthorityPassword] = useState(DEMO_CREDENTIALS.authority.defaultPasscode)

  const handleCitizenSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    if (!citizenId.trim()) {
      setErrorMessage('Please enter your registered mobile number or citizen ID.')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await authService.loginAsCitizen({
        identifier: citizenId,
        passcode: citizenPasscode
      })
      if (user) {
        onLoginSuccess(user)
      } else {
        setErrorMessage('Login failed. Please check credentials.')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCitizenRegister = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    if (!regName.trim() || !regMobile.trim() || !regPassword.trim()) {
      setErrorMessage('Please enter your full name, mobile number, and password.')
      return
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await authService.registerCitizen({
        username: regMobile.trim(),
        password: regPassword.trim(),
        name: regName.trim(),
        phone: regMobile.trim(),
        ward: regWard.trim() || 'Ward 42 (Indiranagar)'
      })
      if (user) {
        onLoginSuccess(user)
      } else {
        setErrorMessage('Registration failed. Please try again.')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAuthoritySubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    if (!authorityBadge.trim()) {
      setErrorMessage('Please enter your officer badge ID or official email.')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await authService.loginAsAuthority({
        badgeOrEmail: authorityBadge,
        password: authorityPassword
      })
      if (user) {
        onLoginSuccess(user)
      } else {
        setErrorMessage('Login failed. Please verify officer badge ID.')
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickLogin = async (roleType) => {
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      const user = await authService.quickDemoLogin(roleType)
      if (user) {
        onLoginSuccess(user)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Demo login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-main)',
      color: 'var(--navy-900)'
    }}>
      {/* Top Bar for Language & Theme */}
      <div style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--slate-200)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <NagarakshakLogo size={24} />
          <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
            NAGARA<span style={{ color: 'var(--accent-saffron)' }}>KSHAK</span>
          </span>
          <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
            {t('login_official_portal', 'Official Portal')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Language Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--slate-300)',
            borderRadius: 'var(--radius-md)',
            padding: '0.15rem 0.45rem',
            height: '30px'
          }}>
            <Languages size={14} color="var(--primary)" />
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
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="te">తెలుగు (Telugu)</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button 
            className="btn btn-subtle btn-sm"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            style={{ height: '30px', padding: '0 0.5rem' }}
          >
            {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Main Login Card Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div className="card" style={{
          width: '100%',
          maxWidth: '520px',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--slate-200)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          padding: 0
        }}>
          {/* Portal Header Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--navy-950) 0%, var(--navy-900) 100%)',
            color: '#ffffff',
            padding: '2rem 1.75rem 1.5rem',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.16) 0%, rgba(15, 29, 56, 0.7) 100%)',
                padding: '0.75rem',
                borderRadius: '16px',
                border: '1.5px solid rgba(217, 119, 6, 0.4)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), 0 0 16px rgba(217, 119, 6, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px'
              }}>
                <NagarakshakLogo size={46} />
              </div>
            </div>

            <h1 style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.04em',
              marginBottom: '0.35rem'
            }}>
              NAGARA<span style={{ color: 'var(--accent-saffron)' }}>KSHAK</span> PORTAL
            </h1>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--slate-300)',
              margin: 0
            }}>
              {t('login_gateway_sub', 'Smarter Cities, Safer Communities • Secure Access Gateway')}
            </p>
          </div>

          {/* Role Navigation Switcher Tabs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--slate-200)',
            padding: '0.35rem'
          }}>
            <button
              type="button"
              onClick={() => { setActiveRoleTab('citizen'); setErrorMessage('') }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 0.5rem',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: activeRoleTab === 'citizen' ? 'var(--bg-card)' : 'transparent',
                color: activeRoleTab === 'citizen' ? 'var(--primary)' : 'var(--slate-500)',
                fontWeight: activeRoleTab === 'citizen' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: activeRoleTab === 'citizen' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <UserCheck size={16} />
              <span>{t('citizen_login_tab', 'Citizen Login')}</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveRoleTab('authority'); setErrorMessage('') }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 0.5rem',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: activeRoleTab === 'authority' ? 'var(--bg-card)' : 'transparent',
                color: activeRoleTab === 'authority' ? 'var(--primary)' : 'var(--slate-500)',
                fontWeight: activeRoleTab === 'authority' ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: activeRoleTab === 'authority' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Building2 size={16} />
              <span>{t('authority_staff_tab', 'Authority Staff')}</span>
            </button>
          </div>

          {/* Form Body */}
          <div style={{ padding: 'clamp(1rem, 3.5vw, 1.75rem)' }}>
            {errorMessage && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: CITIZEN LOGIN & REGISTRATION */}
            {activeRoleTab === 'citizen' && (
              <div>
                {/* Sign In vs Register Toggle */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--slate-200)', paddingBottom: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => { setIsRegisterMode(false); setErrorMessage('') }}
                    style={{
                      background: !isRegisterMode ? 'var(--primary)' : 'transparent',
                      color: !isRegisterMode ? '#ffffff' : 'var(--slate-600)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t('sign_in_tab', 'Sign In')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsRegisterMode(true); setErrorMessage('') }}
                    style={{
                      background: isRegisterMode ? 'var(--primary)' : 'transparent',
                      color: isRegisterMode ? '#ffffff' : 'var(--slate-600)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t('register_citizen_tab', '+ Register New Citizen')}
                  </button>
                </div>

                {!isRegisterMode ? (
                  <form onSubmit={handleCitizenSubmit}>
                    <div style={{ marginBottom: '1.15rem' }}>
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.2rem' }}>
                        <span>{t('reg_mobile_label', 'Registered Mobile or Citizen ID')}</span>
                        <span style={{ color: 'var(--slate-400)', fontWeight: 400, fontSize: '0.72rem' }}>Demo: 9876543210</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. 9876543210 or CIT-2026-9042"
                          value={citizenId}
                          onChange={(e) => setCitizenId(e.target.value)}
                          style={{ paddingLeft: '2.5rem' }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.2rem' }}>
                        <span>{t('reg_passcode_label', 'Passcode / Mock OTP')}</span>
                        <span style={{ color: 'var(--slate-400)', fontWeight: 400, fontSize: '0.72rem' }}>Demo: 123456</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <KeyRound size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="Enter 6-digit passcode"
                          value={citizenPasscode}
                          onChange={(e) => setCitizenPasscode(e.target.value)}
                          style={{ paddingLeft: '2.5rem' }}
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', marginBottom: '1.25rem' }}
                      disabled={isSubmitting}
                    >
                      <span>{isSubmitting ? 'Authenticating...' : t('sign_in_citizen_btn', 'Sign In as Citizen')}</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCitizenRegister}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label">{t('full_name_label', 'Full Name')}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Sunita Devi"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label">{t('mobile_number_label', 'Mobile Number')}</label>
                      <input 
                        type="tel" 
                        className="form-input" 
                        placeholder="e.g. 9811223344"
                        value={regMobile}
                        onChange={(e) => setRegMobile(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label">{t('create_pass_label', 'Create Password (min 6 characters)')}</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="Enter secure password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label className="form-label">{t('residential_ward_label', 'Residential Ward')}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Ward 42 (Indiranagar)"
                        value={regWard}
                        onChange={(e) => setRegWard(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', marginBottom: '1.25rem' }}
                      disabled={isSubmitting}
                    >
                      <span>{isSubmitting ? 'Creating Account in Database...' : t('register_access_btn', 'Register & Access Portal')}</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>
                )}

                {/* Instant Demo Shortcut Card */}
                <div style={{
                  background: 'var(--primary-subtle)',
                  border: '1px solid var(--primary-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {t('instant_evaluator_access', '⚡ Instant Evaluator Access')}
                    </span>
                    <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>
                      Ready
                    </span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--slate-600)', marginBottom: '0.65rem', lineHeight: 1.4 }}>
                    {t('instant_evaluator_desc', 'Test the complete citizen experience: file grievances, upload evidence, and track ticket status.')}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleQuickLogin('CITIZEN')}
                    style={{ width: '100%', justifyContent: 'center', whiteSpace: 'normal', height: 'auto', padding: '0.6rem 0.75rem', lineHeight: 1.35 }}
                  >
                    <span>{t('one_click_citizen', 'One-Click Login: Arun Kumar (Citizen)')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: AUTHORITY / GOVERNMENT STAFF LOGIN */}
            {activeRoleTab === 'authority' && (
              <form onSubmit={handleAuthoritySubmit}>
                <div style={{ marginBottom: '1.15rem' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.2rem' }}>
                    <span>{t('officer_badge_label', 'Officer Badge ID or Official Email')}</span>
                    <span style={{ color: 'var(--slate-400)', fontWeight: 400, fontSize: '0.72rem' }}>Demo: KA-GOV-8821</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <BadgeCheck size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. KA-GOV-8821 or OFF-BBMP-402"
                      value={authorityBadge}
                      onChange={(e) => setAuthorityBadge(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.2rem' }}>
                    <span>{t('dept_password_label', 'Department Security Password')}</span>
                    <span style={{ color: 'var(--slate-400)', fontWeight: 400, fontSize: '0.72rem' }}>Demo: admin123</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="Enter security password"
                      value={authorityPassword}
                      onChange={(e) => setAuthorityPassword(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', marginBottom: '1.25rem' }}
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Verifying Credentials...' : t('sign_in_dispatch_btn', 'Sign In to Municipal Dispatch')}</span>
                  <ArrowRight size={16} />
                </button>

                {/* Instant Demo Shortcut Card */}
                <div style={{
                  background: 'var(--accent-saffron-subtle)',
                  border: '1px solid var(--accent-saffron-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-saffron-hover)' }}>
                      {t('authority_command_access', '⚡ Authority Command Access')}
                    </span>
                    <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>
                      Supervisor
                    </span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--slate-600)', marginBottom: '0.65rem', lineHeight: 1.4 }}>
                    {t('authority_command_desc', 'Access Authority Queue, review AI-verified tickets, assign field crews, inspect repair photos, and approve/reject closures.')}
                  </p>
                  <button
                    type="button"
                    className="btn btn-warning btn-sm"
                    onClick={() => handleQuickLogin('AUTHORITY')}
                    style={{ width: '100%', justifyContent: 'center', whiteSpace: 'normal', height: 'auto', padding: '0.6rem 0.75rem', lineHeight: 1.35, marginBottom: '0.5rem' }}
                  >
                    <span>{t('one_click_officer', 'One-Click Login: Rajesh Varma (Zonal Officer)')}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-subtle btn-sm"
                    onClick={() => handleQuickLogin('ADMIN')}
                    style={{ width: '100%', justifyContent: 'center', whiteSpace: 'normal', height: 'auto', padding: '0.5rem 0.75rem', border: '1px solid var(--slate-300)' }}
                  >
                    <span>{t('one_click_admin', 'One-Click Login: Commissioner Sharma (Admin)')}</span>
                  </button>
                </div>

                {/* Security Audit Notice */}
                <div style={{
                  fontSize: '0.72rem',
                  color: 'var(--slate-500)',
                  lineHeight: 1.45,
                  borderTop: '1px solid var(--slate-200)',
                  paddingTop: '0.75rem'
                }}>
                  {t('municipal_security_notice', 'Municipal Security Notice: All administrative dispatch actions, crew assignments, and resolution sign-offs are logged into the immutable operational audit ledger.')}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
