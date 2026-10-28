/**
 * NAGARAKSHAK — Centralized Authentication & Session Service
 * 
 * Manages user authentication, registration, persistent session tokens,
 * and role-based access control connected to the Express/SQLite backend.
 */

import { USER_ROLES, KYC_STATUS, ACCOUNT_STATUS } from './schema.js';
import { 
  apiLogin, 
  apiRegister, 
  apiLogout, 
  apiGetMe, 
  getStoredToken, 
  setStoredToken 
} from './apiService.js';

const AUTH_STORAGE_KEY = 'nagarakshak_auth_session_v1';

// Pre-configured Verified Demo Accounts for hackathon presentations
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
  },
  admin: {
    role: USER_ROLES.ADMIN,
    officerId: 'ADM-BBMP-001',
    badgeNumber: 'KA-ADMIN-01',
    name: 'Commissioner S. Sharma',
    department: 'Municipal Headquarters',
    designation: 'Chief Municipal Administrator',
    email: 'admin@nagarakshak.demo',
    defaultPasscode: 'admin123'
  }
};

function normalizeUser(raw) {
  if (!raw) return null;
  const role = String(raw.role || 'CITIZEN').toUpperCase();
  const normalizedRole = role.includes('CITIZEN') ? 'CITIZEN' : (role.includes('ADMIN') ? 'ADMIN' : 'AUTHORITY');

  return {
    userId: raw.id || raw.userId,
    citizenId: raw.id || raw.citizenId || raw.userId,
    officerId: raw.id || raw.officerId || raw.userId,
    badgeNumber: raw.badge_number || raw.badgeNumber || null,
    role: normalizedRole,
    name: raw.name || 'User',
    username: raw.username || raw.email || raw.phone,
    email: raw.email || null,
    phone: raw.phone || null,
    maskedPhone: raw.phone ? `+91 ${raw.phone.slice(0, 5)}-XXXXX` : '+91 98765-XXXXX',
    ward: raw.ward || 'Ward 42 (Indiranagar)',
    department: raw.department || 'Municipal Operations Command',
    designation: raw.designation || (normalizedRole === 'ADMIN' ? 'Chief Municipal Administrator' : (normalizedRole === 'AUTHORITY' ? 'Zonal Dispatch Officer' : 'Resident Citizen')),
    kycStatus: KYC_STATUS.VERIFIED_MOCK,
    accountStanding: ACCOUNT_STATUS.ACTIVE,
    loginTime: new Date().toISOString()
  };
}

class AuthService {
  constructor() {
    this._listeners = new Set();
  }

  /**
   * Get active authenticated session from local cache
   */
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.userId) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  isAuthenticated() {
    return this.getCurrentUser() !== null && Boolean(getStoredToken());
  }

  isCitizen(user = this.getCurrentUser()) {
    if (!user) return false;
    return String(user.role).toUpperCase() === 'CITIZEN';
  }

  isAuthority(user = this.getCurrentUser()) {
    if (!user) return false;
    const r = String(user.role).toUpperCase();
    return r === 'AUTHORITY' || r === 'ADMIN';
  }

  isAdmin(user = this.getCurrentUser()) {
    if (!user) return false;
    return String(user.role).toUpperCase() === 'ADMIN';
  }

  /**
   * Real Citizen Login via Backend API
   */
  async loginAsCitizen({ identifier, passcode }) {
    const res = await apiLogin({
      identifier: identifier.trim(),
      password: passcode.trim()
    });

    if (!res.success || !res.user) {
      throw new Error(res.error || 'Authentication failed.');
    }

    const session = normalizeUser(res.user);
    return this._saveSession(session);
  }

  /**
   * Real Citizen Registration via Backend API
   */
  async registerCitizen({ username, password, name, phone, email, ward }) {
    const res = await apiRegister({
      username: username.trim(),
      password: password.trim(),
      name: name.trim(),
      phone: phone ? phone.trim() : undefined,
      email: email ? email.trim() : undefined,
      ward: ward ? ward.trim() : undefined,
    });

    if (!res.success || !res.user) {
      throw new Error(res.error || 'Registration failed.');
    }

    const session = normalizeUser(res.user);
    return this._saveSession(session);
  }

  /**
   * Real Authority / Officer Login via Backend API
   */
  async loginAsAuthority({ badgeOrEmail, password }) {
    const res = await apiLogin({
      identifier: badgeOrEmail.trim(),
      password: password.trim()
    });

    if (!res.success || !res.user) {
      throw new Error(res.error || 'Authentication failed.');
    }

    const session = normalizeUser(res.user);
    return this._saveSession(session);
  }

  /**
   * One-Click Demo Login using Real Backend Seed Accounts
   */
  async quickDemoLogin(roleType) {
    const r = String(roleType).toUpperCase();
    if (r === 'CITIZEN') {
      return this.loginAsCitizen({
        identifier: DEMO_CREDENTIALS.citizen.mobile,
        passcode: DEMO_CREDENTIALS.citizen.defaultPasscode
      });
    } else if (r === 'ADMIN') {
      return this.loginAsAuthority({
        badgeOrEmail: DEMO_CREDENTIALS.admin.badgeNumber,
        password: DEMO_CREDENTIALS.admin.defaultPasscode
      });
    } else {
      return this.loginAsAuthority({
        badgeOrEmail: DEMO_CREDENTIALS.authority.badgeNumber,
        password: DEMO_CREDENTIALS.authority.defaultPasscode
      });
    }
  }

  /**
   * Real Session Verification against Backend
   */
  async syncSessionWithBackend() {
    try {
      const token = getStoredToken();
      if (!token) {
        this.logout();
        return null;
      }
      const remoteUser = await apiGetMe();
      if (!remoteUser) {
        this.logout();
        return null;
      }
      const session = normalizeUser(remoteUser);
      return this._saveSession(session);
    } catch {
      // If server unreachable, keep existing session if present
      return this.getCurrentUser();
    }
  }

  /**
   * Real Logout via Backend API
   */
  async logout() {
    try {
      await apiLogout().catch(() => {});
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setStoredToken(null);
      this._notify(null);
    }
    return true;
  }

  _saveSession(sessionData) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (err) {
      console.warn('Failed to persist auth session:', err);
    }
    this._notify(sessionData);
    return sessionData;
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify(session) {
    this._listeners.forEach(fn => {
      try { fn(session); } catch (e) {}
    });
  }
}

export const authService = new AuthService();
