import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Search, 
  RefreshCw, 
  Key, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
  ShieldAlert,
  UserPlus,
  FileCheck,
  Check,
  ChevronDown
} from 'lucide-react';
import { apiGetAdminUsers, apiGetLoginActivity, apiCreateOfficer } from '../services/apiService';
import { formatDateTime } from '../utils/timeUtils';
import { useLanguage } from '../utils/LanguageContext';

export function AdminView({ currentUser }) {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users', 'permissions', 'provision', 'activity'
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Provisioning Form State
  const [badgeNumber, setBadgeNumber] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerPhone, setOfficerPhone] = useState('');
  const [officerDept, setOfficerDept] = useState('Roads & Infrastructure Department');
  const [officerDesignation, setOfficerDesignation] = useState('Zonal Dispatch Officer');
  const [officerRole, setOfficerRole] = useState('AUTHORITY');
  const [officerPassword, setOfficerPassword] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState(null);
  const [provisionError, setProvisionError] = useState(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [fetchedUsers, fetchedActivity] = await Promise.all([
        apiGetAdminUsers(),
        apiGetLoginActivity()
      ]);
      setUsers(fetchedUsers || []);
      setActivity(fetchedActivity || []);
    } catch (err) {
      console.error('[AdminView] Error loading data:', err.message);
      setErrorMessage(err.message || 'Failed to load administrative security records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    setProvisionError(null);
    setProvisionSuccess(null);

    if (!badgeNumber.trim() || !officerName.trim() || !officerPassword.trim()) {
      setProvisionError('Badge number, full name, and temporary password are required.');
      return;
    }

    setIsProvisioning(true);
    try {
      await apiCreateOfficer({
        badgeNumber: badgeNumber.trim().toUpperCase(),
        name: officerName.trim(),
        email: officerEmail.trim() || null,
        phone: officerPhone.trim() || null,
        department: officerDept,
        designation: officerDesignation,
        password: officerPassword.trim()
      });

      setProvisionSuccess(`Officer ${officerName.trim()} (Badge: ${badgeNumber.trim().toUpperCase()}) created successfully!`);
      setBadgeNumber('');
      setOfficerName('');
      setOfficerEmail('');
      setOfficerPhone('');
      setOfficerPassword('');
      await loadAdminData();
    } catch (err) {
      setProvisionError(err.message || 'Failed to create officer account.');
    } finally {
      setIsProvisioning(false);
    }
  };

  const citizenCount = users.filter(u => u.role === 'CITIZEN').length;
  const officerCount = users.filter(u => u.role === 'AUTHORITY' || u.role === 'ADMIN').length;

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.ward && u.ward.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  const filteredActivity = activity.filter(a => {
    const q = searchQuery.toLowerCase();
    return (
      (a.username && a.username.toLowerCase().includes(q)) ||
      (a.event_type && a.event_type.toLowerCase().includes(q)) ||
      (a.role && a.role.toLowerCase().includes(q))
    );
  });

  const getEventBadge = (eventType) => {
    switch (eventType) {
      case 'LOGIN_SUCCESS':
        return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}><CheckCircle2 size={12} /> {t('event_login_success', 'Login Success')}</span>;
      case 'LOGIN_FAILED':
        return <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}><XCircle size={12} /> {t('event_login_failed', 'Failed Login')}</span>;
      case 'LOGOUT':
        return <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}><Clock size={12} /> {t('event_logout', 'Session Logout')}</span>;
      case 'REGISTER_LOGIN':
        return <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}><UserCheck size={12} /> {t('event_account_created', 'Account Created')}</span>;
      default:
        return <span className="badge badge-neutral" style={{ whiteSpace: 'nowrap' }}>{eventType}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '1.5rem 1rem 3rem', width: '100%', maxWidth: '1280px', boxSizing: 'border-box' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', width: '100%', minWidth: 0 }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <ShieldCheck size={26} color="var(--primary)" style={{ flexShrink: 0 }} />
            <h1 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.5rem)', fontWeight: 800, margin: 0, color: 'var(--navy-900)', wordBreak: 'break-word' }}>
              {t('admin_title', 'Municipal Access Directory & Security Console')}
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--slate-600)', wordBreak: 'break-word', lineHeight: 1.45 }}>
            {t('admin_sub', 'Role-based access control (RBAC), user identities, and security audit log tracking.')}
          </p>
        </div>

        <button 
          className="btn btn-secondary btn-sm"
          onClick={loadAdminData}
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
          <span>{isLoading ? t('refreshing', 'Refreshing...') : t('refresh_directory', 'Refresh Directory')}</span>
        </button>
      </div>

      {errorMessage && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger)',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          boxSizing: 'border-box'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span style={{ wordBreak: 'break-word' }}>{errorMessage}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="card" style={{ padding: '1rem 1.25rem', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('kpi_total_users', 'Total User Accounts')}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)' }}>
            {users.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('kpi_verified_db', '✓ Live Database Connected')}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('kpi_registered_citizens', 'Registered Citizens')}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            {citizenCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('kpi_citizens_sub', 'Grievance filers & tracking')}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('kpi_officers_admins', 'Officers & Admins')}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-saffron)' }}>
            {officerCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('kpi_officers_sub', 'Municipal command & dispatch')}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem 1.25rem', minWidth: 0, boxSizing: 'border-box' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('kpi_security_events', 'Security Events')}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-800)' }}>
            {activity.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t('kpi_events_sub', 'Logins, logouts & attempts')}
          </div>
        </div>
      </div>

      {/* Main Tab Controller & Search */}
      <div className="card" style={{ padding: '1.25rem', width: '100%', boxSizing: 'border-box', minWidth: 0 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '0.75rem', 
          marginBottom: '1.25rem', 
          borderBottom: '1px solid var(--slate-200)', 
          paddingBottom: '0.85rem',
          width: '100%',
          minWidth: 0
        }}>
          {/* Sub Tabs Navigation */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxWidth: '100%' }}>
            <button
              className={`btn btn-sm ${activeSubTab === 'users' ? 'btn-primary' : 'btn-subtle'}`}
              onClick={() => setActiveSubTab('users')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
            >
              <Users size={14} />
              <span>{t('tab_user_directory', 'User Directory')} ({users.length})</span>
            </button>

            <button
              className={`btn btn-sm ${activeSubTab === 'permissions' ? 'btn-primary' : 'btn-subtle'}`}
              onClick={() => setActiveSubTab('permissions')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
            >
              <Key size={14} />
              <span>{t('tab_permissions_matrix', 'Role Permissions (RBAC)')}</span>
            </button>

            <button
              className={`btn btn-sm ${activeSubTab === 'provision' ? 'btn-primary' : 'btn-subtle'}`}
              onClick={() => setActiveSubTab('provision')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
            >
              <UserPlus size={14} />
              <span>{t('tab_provision_officer', 'Provision Officer')}</span>
            </button>

            <button
              className={`btn btn-sm ${activeSubTab === 'activity' ? 'btn-primary' : 'btn-subtle'}`}
              onClick={() => setActiveSubTab('activity')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
            >
              <Clock size={14} />
              <span>{t('tab_security_audit', 'Security Audit')} ({activity.length})</span>
            </button>
          </div>

          {/* Search Input (Only shown on Directory & Activity tabs) */}
          {(activeSubTab === 'users' || activeSubTab === 'activity') && (
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px', flex: '1 1 200px' }}>
              <Search size={14} color="var(--slate-400)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="form-input"
                placeholder={activeSubTab === 'users' ? t('search_users_place', 'Search by name, ID, ward...') : t('search_activity_place', 'Search activity logs...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', height: '34px', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          )}
        </div>

        {/* ── SUB-TAB 1: USER DIRECTORY TABLE ─────────────────────────────────── */}
        {activeSubTab === 'users' && (
          <div className="table-responsive-container">
            <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-600)', background: 'var(--bg-subtle)' }}>
                  <th style={{ padding: '0.75rem 0.85rem', width: '28%' }}>{t('th_user_name', 'User / Full Name')}</th>
                  <th style={{ padding: '0.75rem 0.85rem', width: '22%' }}>{t('th_identifier', 'Identifier (Username)')}</th>
                  <th style={{ padding: '0.75rem 0.85rem', width: '15%' }}>{t('th_role', 'Role')}</th>
                  <th style={{ padding: '0.75rem 0.85rem', width: '20%' }}>{t('th_ward_dept', 'Ward / Department')}</th>
                  <th style={{ padding: '0.75rem 0.85rem', width: '15%' }}>{t('th_registered_at', 'Registered At')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--slate-500)' }}>
                      {t('no_users_found', 'No user accounts match the search criteria.')}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--slate-200)' }}>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                            background: u.role === 'CITIZEN' ? 'var(--primary-subtle)' : 'var(--accent-saffron-subtle)',
                            color: u.role === 'CITIZEN' ? 'var(--primary)' : 'var(--accent-saffron)',
                            border: u.role === 'CITIZEN' ? '1px solid var(--primary-border)' : '1px solid var(--accent-saffron-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.78rem'
                          }}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} title={u.name}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 400, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={u.id}>
                              {u.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'monospace', color: 'var(--slate-700)' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={u.username}>
                          {u.username}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap' }}>
                        <span className={`badge ${
                          u.role === 'ADMIN' ? 'badge-danger' : 
                          u.role === 'AUTHORITY' ? 'badge-warning' : 'badge-primary'
                        }`}>
                          {u.role === 'CITIZEN' ? t('role_citizen', 'Citizen') : (u.role === 'ADMIN' ? t('role_admin', 'Admin') : t('role_officer', 'Officer'))}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', color: 'var(--slate-700)' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '190px' }} title={u.department || u.ward || 'N/A'}>
                          {u.department || u.ward || 'N/A'}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem 0.85rem', color: 'var(--slate-500)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {formatDateTime(u.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── SUB-TAB 2: ROLE PERMISSIONS MATRIX (RBAC) ───────────────────────── */}
        {activeSubTab === 'permissions' && (
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-900)', margin: '0 0 0.35rem 0' }}>
                {t('rbac_matrix_title', 'Role-Based Access Control (RBAC) Specification')}
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                {t('rbac_matrix_sub', 'Cryptographic session tokens with role constraints enforce access boundaries across the grievance lifecycle.')}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: '1.25rem',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {/* Role Card 1: Citizen */}
              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <UserCheck size={18} color="var(--primary)" />
                    <span style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.95rem' }}>Citizen</span>
                  </div>
                  <span className="badge badge-primary">Tier 1-2 Public</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  Civic stakeholders registering neighborhood infrastructure reports and tracking resolution proof.
                </p>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Granted Permissions:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> File civic grievance with photo proof</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Real-time SLA countdown tracking</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Upvote & endorse community issues</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Submit 1–5 star resolution feedback</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Reopen ticket with new photographic evidence</li>
                </ul>
              </div>

              {/* Role Card 2: Field Worker */}
              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={18} color="var(--accent-saffron)" />
                    <span style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.95rem' }}>Field Worker</span>
                  </div>
                  <span className="badge badge-warning">Operations</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  Departmental field repair gangs, contractors, and on-site maintenance crews executing physical work.
                </p>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Granted Permissions:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> View assigned department tasks</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Update ticket status to In Progress</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Upload on-site repair photograph</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Submit technical resolution notes</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Request official closure inspection</li>
                </ul>
              </div>

              {/* Role Card 3: Zonal Supervisor */}
              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldAlert size={18} color="var(--purple)" />
                    <span style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.95rem' }}>Zonal Supervisor</span>
                  </div>
                  <span className="badge badge-purple">Authority</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  Assistant Executive Engineers and dispatch desk supervisors managing triage and verified closures.
                </p>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Granted Permissions:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Automated rule-based triage review</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Cross-ticket semantic duplicate linking</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Reassign tickets across municipal boards</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Inspect repair photos and approve closure</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Reject poor evidence and mandate rework</li>
                </ul>
              </div>

              {/* Role Card 4: Municipal Admin */}
              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={18} color="var(--danger)" />
                    <span style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.95rem' }}>Municipal Admin</span>
                  </div>
                  <span className="badge badge-danger">Executive</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  Commissioner command, security leads, and headquarters directors with system-wide oversight.
                </p>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Granted Permissions:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Ward-wide SLA & grievance analytics</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Provision official officer credentials</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Access full immutable operational ledger</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Audit login events & IP access records</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Check size={14} color="var(--success)" style={{ flexShrink: 0 }} /> Trigger SLA Sentinel automated checks</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-TAB 3: PROVISION OFFICER FORM ───────────────────────────────── */}
        {activeSubTab === 'provision' && (
          <div style={{ width: '100%', maxWidth: '820px', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-900)', margin: '0 0 0.35rem 0' }}>
                {t('provision_title', 'Provision New Municipal Officer Account')}
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                {t('provision_sub', 'Create authorized field or supervisory credentials with department badge assignment.')}
              </p>
            </div>

            {provisionSuccess && (
              <div style={{
                background: 'var(--success-bg)',
                border: '1px solid var(--success-border)',
                color: 'var(--success)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem'
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{provisionSuccess}</span>
              </div>
            )}

            {provisionError && (
              <div style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{provisionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOfficer} style={{ width: '100%', boxSizing: 'border-box' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                gap: '1rem',
                marginBottom: '1.25rem',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                    Badge Number / ID *
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. KA-GOV-9042" 
                    value={badgeNumber} 
                    onChange={(e) => setBadgeNumber(e.target.value)} 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required 
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>
                    Will serve as the officer username for login
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                    Officer Full Name *
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Anand Deshmukh" 
                    value={officerName} 
                    onChange={(e) => setOfficerName(e.target.value)} 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required 
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                    Official Email
                  </label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. officer@bbmp.gov.in" 
                    value={officerEmail} 
                    onChange={(e) => setOfficerEmail(e.target.value)} 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                    Official Contact Number
                  </label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    placeholder="e.g. +91 98450-77112" 
                    value={officerPhone} 
                    onChange={(e) => setOfficerPhone(e.target.value)} 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                    Department *
                  </label>
                  <select 
                    className="form-select" 
                    value={officerDept} 
                    onChange={(e) => setOfficerDept(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="Roads & Infrastructure Department">Roads & Infrastructure Department</option>
                    <option value="Sanitation Department">Sanitation Department</option>
                    <option value="Electrical & Lighting Department">Electrical & Lighting Department</option>
                    <option value="Water Supply & Sewerage Board">Water Supply & Sewerage Board</option>
                    <option value="Municipal Operations Command">Municipal Operations Command</option>
                    <option value="General Civic Services">General Civic Services</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                    Designation / Title
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Zonal Dispatch Officer" 
                    value={officerDesignation} 
                    onChange={(e) => setOfficerDesignation(e.target.value)} 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                    Administrative Role *
                  </label>
                  <select 
                    className="form-select" 
                    value={officerRole} 
                    onChange={(e) => setOfficerRole(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="AUTHORITY">AUTHORITY (Field Officer & Dispatcher)</option>
                    <option value="ADMIN">ADMIN (Municipal Administrator)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                    Temporary Password *
                  </label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="min 6 characters" 
                    value={officerPassword} 
                    onChange={(e) => setOfficerPassword(e.target.value)} 
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isProvisioning}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <UserPlus size={16} />
                  <span>{isProvisioning ? 'Creating Account in Database...' : 'Provision Officer Account'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── SUB-TAB 4: LOGIN SECURITY AUDIT TABLE ───────────────────────────── */}
        {activeSubTab === 'activity' && (
          <div className="table-responsive-container">
            <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--slate-200)', color: 'var(--slate-600)', background: 'var(--bg-subtle)' }}>
                  <th style={{ padding: '0.75rem 0.85rem', width: '22%' }}>{t('th_timestamp', 'Timestamp')}</th>
                  <th style={{ padding: '0.75rem 0.85rem', width: '20%' }}>{t('th_event_type', 'Event Type')}</th>
                  <th style={{ padding: '0.75rem 0.85rem', width: '24%' }}>{t('th_identifier_attempted', 'Identifier Attempted')}</th>
                  <th style={{ padding: '0.75rem 0.85rem', width: '16%' }}>{t('th_assigned_role', 'Assigned Role')}</th>
                  <th style={{ padding: '0.75rem 0.85rem', width: '18%' }}>{t('th_client_ip', 'Client IP')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivity.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--slate-500)' }}>
                      {t('no_events_found', 'No authentication events recorded yet.')}
                    </td>
                  </tr>
                ) : (
                  filteredActivity.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--slate-200)' }}>
                      <td style={{ padding: '0.75rem 0.85rem', color: 'var(--slate-600)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {formatDateTime(a.timestamp)}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        {getEventBadge(a.event_type)}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: 'var(--navy-900)' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} title={a.username}>
                          {a.username}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                          {a.role || 'Unspecified'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--slate-500)', whiteSpace: 'nowrap' }}>
                        {a.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
