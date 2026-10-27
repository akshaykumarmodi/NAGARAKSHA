import { generateSeedData } from '../data/seedData.js'

const COMPLAINTS_KEY = 'civicfix_ai_complaints_v1';
const AUDIT_KEY = 'civicfix_ai_audit_v1';

export function getStoredComplaints() {
  try {
    const raw = localStorage.getItem(COMPLAINTS_KEY);
    if (!raw) {
      const { complaints, auditLogs } = generateSeedData();
      saveComplaints(complaints);
      saveAuditLogs(auditLogs);
      return complaints;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : generateSeedData().complaints;
  } catch (err) {
    console.error('Error reading complaints from localStorage:', err);
    return generateSeedData().complaints;
  }
}

export function saveComplaints(complaints) {
  try {
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
  } catch (err) {
    console.error('Error saving complaints to localStorage:', err);
  }
}

export function getStoredAuditLogs() {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (!raw) {
      const { auditLogs } = generateSeedData();
      saveAuditLogs(auditLogs);
      return auditLogs;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading audit logs:', err);
    return [];
  }
}

export function saveAuditLogs(logs) {
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Error saving audit logs:', err);
  }
}

export function appendAuditLog(entry) {
  const current = getStoredAuditLogs();
  const newEntry = {
    id: `LOG-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };
  const updated = [newEntry, ...current];
  saveAuditLogs(updated);
  return updated;
}

export function resetDemoStorage() {
  try {
    localStorage.removeItem(COMPLAINTS_KEY);
    localStorage.removeItem(AUDIT_KEY);
    const { complaints, auditLogs } = generateSeedData();
    saveComplaints(complaints);
    saveAuditLogs(auditLogs);
    return { complaints, auditLogs };
  } catch (err) {
    console.error('Error resetting demo storage:', err);
    return generateSeedData();
  }
}
