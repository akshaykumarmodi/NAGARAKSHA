/**
 * NAGARAKSHA — Storage Gateway (Backwards Compatibility Layer)
 * 
 * Proxies calls directly to the centralized dataService layer.
 * Ensures existing component hooks continue to work smoothly while routing
 * all reads, writes, and schema normalizations through the centralized service architecture.
 */

import { dataService } from '../services/dataService.js';

export function getStoredComplaints() {
  return dataService.getComplaints();
}

export function saveComplaints(complaints) {
  // If array is passed from old handler, update dataService
  complaints.forEach(c => dataService.updateComplaint(c));
  dataService.persist();
}

export function getStoredAuditLogs() {
  return dataService.getAuditLogs();
}

export function saveAuditLogs(logs) {
  dataService.auditLogs = logs;
  dataService.persist();
}

export function appendAuditLog(entry) {
  return dataService.appendAuditLog(entry);
}

export function resetDemoStorage() {
  return dataService.resetToDefaults();
}

export { dataService };
