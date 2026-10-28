/**
 * NAGARAKSHA — Frontend API Service
 * 
 * Thin HTTP client that connects the frontend to the Express/SQLite backend.
 * All UI components continue to use the same props/callbacks as before —
 * only this layer actually talks to the server.
 * 
 * Base URL: /api  (proxied by Vite to http://localhost:5000 in dev)
 */

const BASE_URL = '/api';
const TOKEN_KEY = 'nagarakshak_auth_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

/**
 * Generic fetch wrapper with error handling and Authorization header
 */
async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const opts = {
    method,
    headers,
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, opts);
  } catch (networkErr) {
    throw new Error('Cannot reach the Nagarakshak server. Please verify the backend is running.');
  }

  const json = await res.json().catch(() => ({ success: false, error: 'Invalid server response.' }));
  if (!res.ok || !json.success) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json;
}

// ── Complaint APIs ──────────────────────────────────────────────────────────

/**
 * Fetch all complaints from the backend
 * @returns {Promise<Array>} list of complaint objects
 */
export async function apiGetComplaints() {
  const json = await request('GET', '/complaints');
  return json.data;
}

/**
 * Fetch a single complaint by ID
 * @param {string} id
 */
export async function apiGetComplaint(id) {
  const json = await request('GET', `/complaints/${id}`);
  return json.data;
}

/**
 * Create a new complaint
 * @param {Object} complaintPayload — the full ticket object built by ReportIssueView
 */
export async function apiCreateComplaint(complaintPayload) {
  const json = await request('POST', '/complaints', complaintPayload);
  return json.data;
}

/**
 * Full update of a complaint (for status syncs from the detail modal)
 * @param {Object} complaint — updated complaint object
 */
export async function apiUpdateComplaint(complaint) {
  const json = await request('PUT', `/complaints/${complaint.id}`, complaint);
  return json.data;
}

/**
 * Transition complaint status
 * @param {string} id
 * @param {{ nextStatus, reason, actor, actorRole }} payload
 */
export async function apiUpdateStatus(id, payload) {
  const json = await request('PATCH', `/complaints/${id}/status`, payload);
  return json.data;
}

/**
 * Assign complaint to department/officer
 * @param {string} id
 * @param {{ assignedTo, department, assignedBy }} payload
 */
export async function apiAssignComplaint(id, payload) {
  const json = await request('PATCH', `/complaints/${id}/assign`, payload);
  return json.data;
}

/**
 * Submit resolution evidence (field worker)
 * @param {string} id
 * @param {{ workerNotes, resolutionPhotoUrl, submittedBy }} payload
 */
export async function apiSubmitResolution(id, payload) {
  const json = await request('PATCH', `/complaints/${id}/resolve`, payload);
  return json.data;
}

/**
 * Official reviewer decision (Approved / Rejected / Needs Re-investigation)
 * @param {string} id
 * @param {{ decision, decisionNotes, reviewer }} payload
 */
export async function apiMakeDecision(id, payload) {
  const json = await request('PATCH', `/complaints/${id}/decision`, payload);
  return json.data;
}

/**
 * Toggle community appreciation/upvote
 * @param {string} id
 * @param {string} citizenId
 */
export async function apiToggleAppreciation(id, citizenId) {
  const json = await request('PATCH', `/complaints/${id}/appreciate`, { citizenId });
  return json.data;
}

/**
 * Submit citizen feedback/rating
 * @param {string} id
 * @param {{ rating, comment, citizenId }} payload
 */
export async function apiSubmitFeedback(id, payload) {
  const json = await request('PATCH', `/complaints/${id}/feedback`, payload);
  return json.data;
}

/**
 * Reopen a resolved complaint with new evidence (evidence-based reopening)
 * @param {string} id
 * @param {{ reason, evidencePhotoUrl, reopenedBy, role }} payload
 */
export async function apiReopenComplaint(id, payload) {
  const json = await request('PATCH', `/complaints/${id}/reopen`, payload);
  return json.data;
}

// ── SLA & Demo ──────────────────────────────────────────────────────────────

/**
 * Trigger SLA deadline check and auto-escalations on the backend
 * @returns {{ newlyEscalated: number, data: Array }} updated complaints
 */
export async function apiCheckSLA() {
  const json = await request('POST', '/complaints/check-sla', {});
  return json;
}

/**
 * Reset database to demo seed data
 * @returns {{ data: Array, auditLogs: Array }}
 */
export async function apiResetDemo() {
  const json = await request('POST', '/complaints/reset-demo', {});
  return json;
}

// ── Audit Logs ──────────────────────────────────────────────────────────────

/**
 * Fetch all audit logs
 */
export async function apiGetAuditLogs() {
  const json = await request('GET', '/audit-logs');
  return json.data;
}

/**
 * Append a new audit log entry
 * @param {{ complaintId, type, actor, title, description }} entry
 */
export async function apiAddAuditLog(entry) {
  const json = await request('POST', '/audit-logs', entry);
  return json.data;
}

// ── File Upload ─────────────────────────────────────────────────────────────

/**
 * Upload an image file as evidence
 * @param {File} file — browser File object
 * @returns {{ url: string, filename: string }} uploaded file info
 */
export async function apiUploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  let res;
  try {
    res = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: formData });
  } catch {
    throw new Error('Cannot reach the upload server. Make sure the backend is running.');
  }

  const json = await res.json().catch(() => ({ success: false, error: 'Invalid server response.' }));
  if (!res.ok || !json.success) throw new Error(json.error || 'Upload failed.');
  return json.data;
}

// ── Authentication & Session APIs ──────────────────────────────────────────

/**
 * Register a new citizen account
 * @param {{ username, password, name, phone, email, ward }} payload
 */
export async function apiRegister(payload) {
  const json = await request('POST', '/auth/register', payload);
  if (json.token) setStoredToken(json.token);
  return json;
}

/**
 * Log in with credentials
 * @param {{ identifier, password }} credentials
 */
export async function apiLogin(credentials) {
  const json = await request('POST', '/auth/login', credentials);
  if (json.token) setStoredToken(json.token);
  return json;
}

/**
 * Log out active session
 */
export async function apiLogout() {
  try {
    await request('POST', '/auth/logout', {});
  } finally {
    setStoredToken(null);
  }
  return true;
}

/**
 * Verify active session and retrieve current user
 */
export async function apiGetMe() {
  const token = getStoredToken();
  if (!token) return null;
  const json = await request('GET', '/auth/me');
  return json.user;
}

// ── Admin & Security Management APIs ────────────────────────────────────────

/**
 * Fetch all registered users (Authority / Admin only)
 */
export async function apiGetAdminUsers() {
  const json = await request('GET', '/admin/users');
  return json.data;
}

/**
 * Fetch login activity audit log (Authority / Admin only)
 */
export async function apiGetLoginActivity() {
  const json = await request('GET', '/admin/login-activity');
  return json.data;
}

/**
 * Provision new official account (Admin only)
 */
export async function apiCreateOfficer(payload) {
  const json = await request('POST', '/admin/create-officer', payload);
  return json.data;
}

// ── Health Check (Real SQLite Connectivity) ─────────────────────────────────

/**
 * Check if the backend is reachable and retrieve real database health
 * @returns {Promise<{ ok: boolean, data?: Object }>}
 */
export async function apiHealthCheck() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const json = await res.json();
    return { ok: res.ok && json.status === 'ok', data: json };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
