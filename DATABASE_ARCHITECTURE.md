# NAGARAKSHAK — Database Architecture & Backend Migration Specification

## 1. Executive Summary & Architecture Overview

**NAGARAKSHAK** is designed as a mission-critical municipal governance platform. The application is architecturally partitioned to separate user interface presentation components from the underlying data access layer.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      NAGARAKSHAK React UI Components                    │
│   (DashboardView, ComplaintsListView, ComplaintDetailModal, Report)    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Invokes UI-agnostic operations
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│              Centralized Data & Service Abstraction Layer              │
│       src/services/dataService.js  |  src/services/schema.js           │
│       src/services/evidenceService.js                                 │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │ Current Demo Mode              │ Production Backend Ready
                    ▼                                ▼
       ┌────────────────────────┐      ┌───────────────────────────────┐
       │ Browser Storage Cache  │      │ REST / GraphQL Backend API    │
       │ (JSON Encoded Service) │      │ (Express / Fastify / Go / Py) │
       └────────────────────────┘      └──────────────┬────────────────┘
                                                      │
                                                      ▼
                                       ┌───────────────────────────────┐
                                       │ Relational Database (Postgres)│
                                       │ Object Storage (AWS S3 / R2)  │
                                       │ Redis Cache & SLA Sentinel    │
                                       └───────────────────────────────┘
```

### Key Principles Implemented
- **Centralized Data Service (`src/services/dataService.js`)**: All persistence, state lookups, complaint updates, status changes, and audit records funnel through single-responsibility methods (`getComplaints`, `saveComplaint`, `updateComplaintStatus`, `reassignDepartment`, `exportDatabasePayload`, `importDatabasePayload`).
- **Zero Component Coupling to Storage Engine**: UI components never make direct calls to storage engines. Replacing the client-side storage adapter with `fetch()` calls to a real backend requires zero changes to UI components.
- **Strict Separation of Demo vs. User Data**: Presentation seed records are marked with `isDemo: true`, whereas live citizen reports are marked with `isDemo: false`. Demo records can be reset independently without destroying live citizen complaints.
- **Audit Trails**: Audit records in the demo mode are labeled as client-side presentation records, and the production design mandates an append-only, server-side immutable audit ledger.

---

## 2. Relational Database Schema (PostgreSQL DDL)

In production, NAGARAKSHAK is backed by a PostgreSQL database with strict foreign key constraints, check constraints, and role-based row-level security.

```sql
-- ============================================================================
-- NAGARAKSHAK PRODUCTION RELATIONAL DATABASE SCHEMA (PostgreSQL 15+)
-- ============================================================================

-- Extensions for UUID generation and full-text search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role_enum AS ENUM (
    'CITIZEN', 
    'AUTHORITY_DISPATCHER', 
    'FIELD_WORKER', 
    'ZONAL_SUPERVISOR', 
    'MUNICIPAL_ADMIN'
);

CREATE TYPE kyc_status_enum AS ENUM (
    'UNVERIFIED', 
    'TIER1_OTP_MOCK', 
    'TIER2_DIGILOCKER_VERIFIED', 
    'TIER3_BIOMETRIC_OFFICIAL'
);

CREATE TYPE account_standing_enum AS ENUM (
    'GOOD_STANDING', 
    'UNDER_REVIEW', 
    'RESTRICTED', 
    'SUSPENDED'
);

CREATE TYPE complaint_priority_enum AS ENUM (
    'Low', 
    'Medium', 
    'High', 
    'Critical'
);

CREATE TYPE complaint_status_enum AS ENUM (
    'Submitted', 
    'AI Verified', 
    'Needs More Evidence', 
    'Flagged for Review', 
    'In Progress', 
    'Awaiting Verification', 
    'Resolved', 
    'Escalated', 
    'Reopened'
);

CREATE TYPE official_decision_enum AS ENUM (
    'PENDING_REVIEW', 
    'APPROVED_CLOSED', 
    'REJECTED_REWORK_REQUIRED', 
    'DISMISSED_INVALID'
);

-- ----------------------------------------------------------------------------
-- 1. Citizens Table (Decoupled Identity with Privacy Safeguards)
-- ----------------------------------------------------------------------------
CREATE TABLE citizens (
    citizen_id VARCHAR(32) PRIMARY KEY, -- e.g. CIT-2026-9042
    display_name VARCHAR(120) NOT NULL,
    masked_phone VARCHAR(20) NOT NULL, -- e.g. +91 98765-XXXXX
    phone_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 for account lookup without exposing raw phone
    ward VARCHAR(64) NOT NULL,
    kyc_status kyc_status_enum NOT NULL DEFAULT 'UNVERIFIED',
    kyc_reference_token VARCHAR(128), -- Non-reversible reference ID from DigiLocker/UIDAI
    account_standing account_standing_enum NOT NULL DEFAULT 'GOOD_STANDING',
    abuse_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. Authority Staff & Municipal Users Table
-- ----------------------------------------------------------------------------
CREATE TABLE authority_users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_number VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    department VARCHAR(80) NOT NULL,
    role user_role_enum NOT NULL,
    zone VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. Complaints Table (Core Entity)
-- ----------------------------------------------------------------------------
CREATE TABLE complaints (
    complaint_id VARCHAR(32) PRIMARY KEY, -- e.g. NAG-2026-0842
    citizen_id VARCHAR(32) NOT NULL REFERENCES citizens(citizen_id) ON DELETE RESTRICT, -- Decoupled citizen ID
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    department VARCHAR(80) NOT NULL,
    priority complaint_priority_enum NOT NULL DEFAULT 'Medium',
    status complaint_status_enum NOT NULL DEFAULT 'Submitted',
    sla_hours INTEGER NOT NULL DEFAULT 48,
    area VARCHAR(120) NOT NULL,
    ward VARCHAR(64) NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    deadline TIMESTAMPTZ NOT NULL,
    ai_confidence_score INTEGER NOT NULL DEFAULT 0, -- 0-100%
    ai_verification_status VARCHAR(64) NOT NULL DEFAULT 'AI Verified',
    duplicate_of_id VARCHAR(32) REFERENCES complaints(complaint_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_department ON complaints(department);
CREATE INDEX idx_complaints_deadline ON complaints(deadline);
CREATE INDEX idx_complaints_citizen ON complaints(citizen_id);

-- ----------------------------------------------------------------------------
-- 4. Evidence Files Table (Object Storage Pointers with Checksums)
-- ----------------------------------------------------------------------------
CREATE TABLE evidence_files (
    evidence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id VARCHAR(32) NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    storage_provider VARCHAR(32) NOT NULL DEFAULT 'AWS_S3',
    storage_key VARCHAR(512) NOT NULL, -- S3 Bucket Object Key
    storage_url TEXT NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,
    evidence_type VARCHAR(32) NOT NULL DEFAULT 'CITIZEN_SUBMISSION', -- 'CITIZEN_SUBMISSION' | 'WORKER_RESOLUTION'
    uploaded_by VARCHAR(64) NOT NULL,
    is_malware_scanned BOOLEAN NOT NULL DEFAULT FALSE,
    scan_result VARCHAR(32) DEFAULT 'CLEAN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. Status Transition History (Immutable Workflow Audit Log)
-- ----------------------------------------------------------------------------
CREATE TABLE status_history (
    transition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id VARCHAR(32) NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    from_status complaint_status_enum NOT NULL,
    to_status complaint_status_enum NOT NULL,
    changed_by_user_id VARCHAR(64) NOT NULL,
    changed_by_role user_role_enum NOT NULL,
    change_reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_complaint ON status_history(complaint_id);

-- ----------------------------------------------------------------------------
-- 6. Resolution & Official Decision Records (Two-Party Sign-off)
-- ----------------------------------------------------------------------------
CREATE TABLE resolution_records (
    resolution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id VARCHAR(32) NOT NULL UNIQUE REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    worker_notes TEXT,
    worker_evidence_id UUID REFERENCES evidence_files(evidence_id),
    worker_user_id VARCHAR(64),
    worker_submitted_at TIMESTAMPTZ,
    supervisor_user_id VARCHAR(64),
    official_decision official_decision_enum NOT NULL DEFAULT 'PENDING_REVIEW',
    supervisor_decision_notes TEXT,
    decision_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. SLA Events & Breach Records
-- ----------------------------------------------------------------------------
CREATE TABLE sla_events (
    sla_event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id VARCHAR(32) NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL, -- 'DEADLINE_CHECK', 'WARNING_THRESHOLD', 'ESCALATION_TRIGGERED'
    sla_target_hours INTEGER NOT NULL,
    elapsed_hours NUMERIC(6, 2) NOT NULL,
    triggered_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_SLA_SENTINEL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. Citizen Feedback & Appreciation
-- ----------------------------------------------------------------------------
CREATE TABLE citizen_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id VARCHAR(32) NOT NULL UNIQUE REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    citizen_id VARCHAR(32) NOT NULL REFERENCES citizens(citizen_id),
    rating_score SMALLINT NOT NULL CHECK (rating_score BETWEEN 1 AND 5),
    feedback_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaint_appreciations (
    complaint_id VARCHAR(32) NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    citizen_id VARCHAR(32) NOT NULL REFERENCES citizens(citizen_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (complaint_id, citizen_id)
);
```

---

## 3. NoSQL / Document Database Model (MongoDB / AWS DocumentDB)

For teams adopting a document store, NAGARAKSHAK entities map naturally into normalized collections with embedded sub-documents for fast queries:

```json
// Collection: complaints
{
  "_id": "NAG-2026-0842",
  "title": "Severe Water Main Rupture flooding arterial junction",
  "description": "Continuous high-pressure leak from underground 12-inch municipal pipeline...",
  "category": "water",
  "department": "Water Supply & Sewerage Board",
  "priority": "Critical",
  "status": "AI Verified",
  "slaHours": 12,
  "area": "17th Cross, Indiranagar Stage 2",
  "ward": "Ward 42",
  "coordinates": { "lat": 12.9716, "lng": 77.5946 },
  "isDemo": false,
  "createdAt": "2026-10-28T02:00:00.000Z",
  "deadline": "2026-10-28T14:00:00.000Z",
  "citizen": {
    "citizenId": "CIT-2026-9042",
    "name": "Arun Kumar",
    "maskedPhone": "+91 98765-XXXXX",
    "kycTier": "TIER1_OTP_MOCK",
    "standing": "GOOD_STANDING"
  },
  "evidence": [
    {
      "evidenceId": "550e8400-e29b-41d4-a716-446655440000",
      "fileName": "water_leak_junction.jpg",
      "fileSize": 184320,
      "mimeType": "image/jpeg",
      "storageKey": "evidence/NAG-2026-0842/water_leak_junction.jpg",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "type": "CITIZEN_SUBMISSION"
    }
  ],
  "statusHistory": [
    {
      "id": "trans-1",
      "timestamp": "2026-10-28T02:00:00.000Z",
      "fromStatus": "Submitted",
      "toStatus": "AI Verified",
      "changedBy": "NAGARAKSHA AI Core",
      "role": "AI_SENTINEL",
      "reason": "Automated vision analysis detected high-confidence municipal damage and routed to Water Board."
    }
  ],
  "resolution": {
    "officialDecision": "PENDING_REVIEW",
    "workerNotes": null,
    "evidenceUrl": null
  },
  "appreciations": ["CIT-2026-9042"],
  "feedback": null
}
```

---

## 4. RESTful API Specification

The NAGARAKSHAK frontend expects to connect to a standard REST API backend providing the following contracts:

| HTTP Method | Endpoint | Description | Auth Role Required |
|---|---|---|---|
| `GET` | `/api/v1/complaints` | Retrieve paginated complaints list with filtering | Citizen, Authority, Admin |
| `GET` | `/api/v1/complaints/:id` | Get single complaint with full evidence and status history | Citizen (owner), Authority, Admin |
| `POST` | `/api/v1/complaints` | File a new complaint with evidence metadata | Citizen |
| `POST` | `/api/v1/evidence/presigned-url` | Generate pre-signed upload URL for S3/R2 direct upload | Citizen, Field Worker |
| `PATCH` | `/api/v1/complaints/:id/route` | Reassign responsible municipal department | Zonal Supervisor, Admin |
| `PATCH` | `/api/v1/complaints/:id/status` | Advance status (e.g., dispatch crew, start work) | Authority Dispatcher, Field Worker |
| `POST` | `/api/v1/complaints/:id/submit-resolution` | Worker submits proof photo & completion notes | Field Worker |
| `POST` | `/api/v1/complaints/:id/decision` | Official supervisor approve or reject decision | Zonal Supervisor, Municipal Admin |
| `POST` | `/api/v1/complaints/:id/escalate` | Manual or SLA Sentinel escalation | System, Supervisor |
| `POST` | `/api/v1/complaints/:id/feedback` | Citizen satisfaction rating (1-5 stars) | Citizen (verified author) |
| `POST` | `/api/v1/complaints/:id/appreciate` | Toggle community appreciation | Citizen |
| `GET` | `/api/v1/audit/logs` | Query server-side immutable audit ledger | Authority, Admin |
| `GET` | `/api/v1/admin/export` | Download full relational database snapshot JSON | Municipal Admin |
| `POST` | `/api/v1/admin/import` | Restore database snapshot JSON | Municipal Admin |

### Sample Payload: `POST /api/v1/evidence/presigned-url`
**Request:**
```json
{
  "complaintId": "NAG-2026-0842",
  "fileName": "pothole_leak.jpg",
  "fileSize": 184320,
  "mimeType": "image/jpeg",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```
**Response:**
```json
{
  "uploadUrl": "https://nagaraksha-media.s3.ap-south-1.amazonaws.com/evidence/NAG-2026-0842/pothole_leak.jpg?X-Amz-Signature=...",
  "fileKey": "evidence/NAG-2026-0842/pothole_leak.jpg",
  "expiresInSeconds": 300
}
```

---

## 5. Evidence & Secure Media Pipeline

In the production deployment, raw binary files (photos, videos) **must never be stored in the relational database or browser localStorage**.

### Direct-to-Object-Storage Architecture
1. **Client-Side Pre-Validation**: `src/services/evidenceService.js` validates:
   - File size $\le$ 5MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`
   - Generates client-side SHA-256 checksum
2. **Pre-Signed URL Generation**: The client requests a signed S3 PUT URL from `/api/v1/evidence/presigned-url`.
3. **Direct Streaming to S3/Cloudflare R2**: The client streams the binary payload directly to the storage bucket.
4. **Asynchronous Malware Scanning**: AWS GuardDuty / S3 bucket trigger executes ClamAV to verify media integrity.
5. **EXIF GPS Stripping**: Server-side Lambda function strips private EXIF metadata (camera serials, device fingerprints) while preserving municipal latitude/longitude coordinates.
6. **Metadata Persistence**: Only the public CDN/presigned URL, checksum, and storage key are saved in the `evidence_files` database table.

---

## 6. Citizen Identity & Statutory Privacy Safeguards

### Aadhaar / DigiLocker Regulatory Roadmap
1. **Decoupled Citizen ID**: The application uses stable internal IDs (`CIT-2026-XXXX`) as primary and foreign keys.
2. **Strict Prohibition on Biometrics & Raw Aadhaar Numbers**:
   - Storing 12-digit Aadhaar numbers, OTPs, or biometric scans is strictly prohibited under the **Aadhaar Act, 2016** and the **Digital Personal Data Protection (DPDP) Act, 2023**.
   - Violations carry severe criminal penalties.
3. **Production KYC Integration**:
   - Integration with an authorized **UIDAI Authentication User Agency (AUA)** or **DigiLocker API**.
   - The user authorizes via DigiLocker OAuth consent screen.
   - The system receives an anonymous, non-reversible **Virtual ID (VID) / OAuth token**.
   - No sensitive citizen identity documents are retained in the application database.
4. **Abuse Mitigation Without Discrimination**:
   - Suspicious activity triggers an `UNDER_REVIEW` flag on the account.
   - Account suspensions require manual municipal officer sign-off; automated algorithms cannot ban citizens.

---

## 7. Migration Guide: Connecting a Real Database & Backend

When transitioning NAGARAKSHAK from the current demonstration environment to a live production database, follow these steps:

### Step 1: Export Current Demo Records
In the NAGARAKSHAK interface:
1. Navigate to the **Audit Log** tab.
2. Click **Export DB JSON**.
3. Save the resulting `nagaraksha_db_export_YYYY-MM-DD.json` file. This JSON file contains fully normalized entities (`citizens`, `complaints`, `evidenceFiles`, `statusHistory`, `resolutionRecords`, `slaEvents`, `auditLogs`).

### Step 2: Initialize PostgreSQL Database
1. Provision a PostgreSQL 15+ instance (e.g., AWS RDS, Supabase, Neon, or local PostgreSQL).
2. Execute the DDL script in Section 2 of this document.

### Step 3: Run Database Seed / Migration Script
Run a one-time migration script (Node.js or Python) to ingest the exported JSON into PostgreSQL:

```bash
node scripts/migrate_json_to_postgres.js nagaraksha_db_export_2026-10-28.json
```

*(Sample migration script imports `complaints`, `citizens`, and `status_history` into PostgreSQL using parameterized transactions).*

### Step 4: Swap the Client-Side Data Adapter
In `src/services/dataService.js`:
Change `storageAdapter` from the current localStorage provider to an HTTP client:

```javascript
// Example: src/services/dataService.js with real backend API
class DataService {
  async getComplaints() {
    const res = await fetch('/api/v1/complaints')
    return await res.json()
  }

  async saveComplaint(complaint) {
    const res = await fetch('/api/v1/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaint)
    })
    return await res.json()
  }

  async updateComplaintStatus(complaintId, nextStatus, officer, role, reason) {
    const res = await fetch(`/api/v1/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nextStatus, officer, role, reason })
    })
    return await res.json()
  }
}
```
Because the UI components (`ComplaintsListView`, `ComplaintDetailModal`, `DashboardView`) only interface with `dataService`, **no UI components need to be edited or redesigned**.
