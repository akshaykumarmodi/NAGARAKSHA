/**
 * NAGARAKSHAK — Centralized Authentication & Session Service
 * 
 * Manages user authentication, demo credentials, role-based access tokens,
 * and session state. Built to be decoupled from React UI components so
 * real OAuth2 / OpenID Connect / DigiLocker / JWT endpoints can replace
 * this service layer in production without altering UI views.
 */

import { USER_ROLES, KYC_STATUS, ACCOUNT_STATUS } from './schema.js'

const AUTH_STORAGE_KEY = 'nagarakshak_auth_session_v1'

// Pre-configured Verified Demo Accounts
export const DEMO_CREDENTIALS = {
  citizen: {
    role: USER_ROLES.CITIZEN,
    citizenId: 'CIT-2026-9042',
    name: 'Arun Kumar',
    maskedPhone: '+91 98765-XXXXX',
    mobile: '9876543210',
    email: 'citizen@nagarakshak.demo',
    ward: 'Ward 42 (Indiranagar)',
    kycStatus: KYC_STATUS.VERIFIED_MOCK,
    accountStanding: ACCOUNT_STATUS.ACTIVE,
    defaultPasscode: '123456'
  },
  authority: {
    role: USER_ROLES.AUTHORITY,
    officerId: 'OFF-BBMP-402',
    badgeNumber: 'KA-GOV-8821',
    name: 'Rajesh Varma',
    department: 'Municipal Corporation (Zonal Command)',
    designation: 'Zonal Dispatch Officer',
    zone: 'East Zone - BBMP',
    email: 'officer@nagarakshak.demo',
    defaultPasscode: 'admin123'
  }
}

class AuthService {
  constructor() {
    this._listeners = new Set()
  }

  /**
   * Get the active authenticated session from storage
   * @returns {Object|null} user session object or null if unauthenticated
   */
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || !parsed.userId) return null

      // Normalize role for robust equality checks
      if (parsed.role) {
        const r = String(parsed.role).toUpperCase()
        parsed.role = r.includes('CITIZEN') ? 'CITIZEN' : 'AUTHORITY'
      } else {
        parsed.role = 'AUTHORITY'
      }

      return parsed
    } catch (err) {
      console.warn('Error reading auth session from storage:', err)
      return null
    }
  }

  /**
   * Checks if user has an active session
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null
  }

  /**
   * Checks if user has Citizen role
   * @param {Object} [user] Optional user object, defaults to current session
   * @returns {boolean}
   */
  isCitizen(user = this.getCurrentUser()) {
    if (!user) return false
    return String(user.role).toUpperCase() === 'CITIZEN'
  }

  /**
   * Checks if user has Authority/Staff role
   * @param {Object} [user] Optional user object, defaults to current session
   * @returns {boolean}
   */
  isAuthority(user = this.getCurrentUser()) {
    if (!user) return false
    const r = String(user.role).toUpperCase()
    return r === 'AUTHORITY' || r === 'ADMIN' || r === 'AUTHORITY_DISPATCHER'
  }

  /**
   * Citizen Login Handler
   * In demo: Accepts phone/email and passcode/OTP.
   * In production: Calls POST /api/v1/auth/citizen-login or DigiLocker OAuth2
   */
  loginAsCitizen({ identifier, passcode }) {
    const trimmedId = (identifier || '').trim().toLowerCase()
    const trimmedPass = (passcode || '').trim()

    // Demo validation: accept demo mobile, demo email, or prefilled credentials
    const isMatch = 
      trimmedId === DEMO_CREDENTIALS.citizen.mobile ||
      trimmedId === DEMO_CREDENTIALS.citizen.email.toLowerCase() ||
      trimmedId === DEMO_CREDENTIALS.citizen.citizenId.toLowerCase() ||
      trimmedId === 'citizen' ||
      trimmedId === 'arun'

    if (!isMatch && trimmedId.length > 0) {
      // Allow custom citizen registration/login in demo
      const customCitizen = {
        userId: `CIT-${Date.now().toString().slice(-4)}`,
        citizenId: `CIT-${Date.now().toString().slice(-4)}`,
        role: USER_ROLES.CITIZEN,
        name: identifier.includes('@') ? identifier.split('@')[0] : `Citizen (${identifier})`,
        maskedPhone: identifier.includes('@') ? '+91 98765-XXXXX' : `+91 ${identifier.slice(0, 5)}-XXXXX`,
        email: identifier.includes('@') ? identifier : `${identifier}@citizen.nagarakshak.gov.in`,
        ward: 'Ward 42 (Indiranagar)',
        kycStatus: KYC_STATUS.VERIFIED_MOCK,
        accountStanding: ACCOUNT_STATUS.ACTIVE,
        loginTime: new Date().toISOString()
      }
      return this._saveSession(customCitizen)
    }

    const session = {
      userId: DEMO_CREDENTIALS.citizen.citizenId,
      citizenId: DEMO_CREDENTIALS.citizen.citizenId,
      role: USER_ROLES.CITIZEN,
      name: DEMO_CREDENTIALS.citizen.name,
      maskedPhone: DEMO_CREDENTIALS.citizen.maskedPhone,
      email: DEMO_CREDENTIALS.citizen.email,
      ward: DEMO_CREDENTIALS.citizen.ward,
      kycStatus: DEMO_CREDENTIALS.citizen.kycStatus,
      accountStanding: DEMO_CREDENTIALS.citizen.accountStanding,
      loginTime: new Date().toISOString()
    }

    return this._saveSession(session)
  }

  /**
   * Authority / Government Staff Login Handler
   * In demo: Accepts staff badge or email and password.
   * In production: Calls POST /api/v1/auth/authority-login with 2FA
   */
  loginAsAuthority({ badgeOrEmail, password }) {
    const trimmedBadge = (badgeOrEmail || '').trim().toLowerCase()
    const trimmedPass = (password || '').trim()

    const isMatch = 
      trimmedBadge === DEMO_CREDENTIALS.authority.badgeNumber.toLowerCase() ||
      trimmedBadge === DEMO_CREDENTIALS.authority.officerId.toLowerCase() ||
      trimmedBadge === DEMO_CREDENTIALS.authority.email.toLowerCase() ||
      trimmedBadge === 'officer' ||
      trimmedBadge === 'admin'

    if (!isMatch && trimmedBadge.length > 0) {
      // Custom authority staff
      const customAuthority = {
        userId: `OFF-${Date.now().toString().slice(-4)}`,
        officerId: `OFF-${Date.now().toString().slice(-4)}`,
        badgeNumber: `KA-GOV-${Date.now().toString().slice(-4)}`,
        role: USER_ROLES.AUTHORITY,
        name: badgeOrEmail.includes('@') ? badgeOrEmail.split('@')[0] : `Officer (${badgeOrEmail})`,
        department: 'Municipal Operations Command',
        designation: 'Municipal Officer',
        zone: 'Central Zone - Municipal Admin',
        email: badgeOrEmail.includes('@') ? badgeOrEmail : `${badgeOrEmail}@nagarakshak.gov.in`,
        loginTime: new Date().toISOString()
      }
      return this._saveSession(customAuthority)
    }

    const session = {
      userId: DEMO_CREDENTIALS.authority.officerId,
      officerId: DEMO_CREDENTIALS.authority.officerId,
      badgeNumber: DEMO_CREDENTIALS.authority.badgeNumber,
      role: USER_ROLES.AUTHORITY,
      name: DEMO_CREDENTIALS.authority.name,
      department: DEMO_CREDENTIALS.authority.department,
      designation: DEMO_CREDENTIALS.authority.designation,
      zone: DEMO_CREDENTIALS.authority.zone,
      email: DEMO_CREDENTIALS.authority.email,
      loginTime: new Date().toISOString()
    }

    return this._saveSession(session)
  }

  /**
   * Instant One-Click Demo Login
   * @param {'CITIZEN'|'AUTHORITY'} roleType 
   */
  quickDemoLogin(roleType) {
    const r = String(roleType).toUpperCase()
    if (r === 'CITIZEN') {
      return this.loginAsCitizen({
        identifier: DEMO_CREDENTIALS.citizen.mobile,
        passcode: DEMO_CREDENTIALS.citizen.defaultPasscode
      })
    } else {
      return this.loginAsAuthority({
        badgeOrEmail: DEMO_CREDENTIALS.authority.badgeNumber,
        password: DEMO_CREDENTIALS.authority.defaultPasscode
      })
    }
  }

  /**
   * Log out active session
   * Clears only session authentication state; does NOT touch complaint or audit data.
   */
  logout() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      localStorage.removeItem('nagarakshak_auth_session')
      localStorage.removeItem('nagaraksha_auth_session')
      localStorage.removeItem('civicfix_session')
      sessionStorage.clear()
    } catch (err) {
      console.warn('Error clearing auth session:', err)
    }
    this._notify(null)
    return true
  }

  /**
   * Save session to storage and notify listeners
   */
  _saveSession(sessionData) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData))
    } catch (err) {
      console.warn('Failed to persist auth session:', err)
    }
    this._notify(sessionData)
    return sessionData
  }

  /**
   * Subscribe to auth changes
   */
  subscribe(listener) {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  _notify(session) {
    this._listeners.forEach(fn => {
      try { fn(session) } catch (e) {}
    })
  }
}

export const authService = new AuthService()
