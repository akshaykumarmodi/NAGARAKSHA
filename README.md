# NAGARAKSHAK 🛡️🏛️
> **Tagline:** *From Citizen Reports to Verified Resolution.*  
> **Hackathon Prototype Notice:** This project is a working academic prototype built for demonstration with sample data and simulated municipal workflows. It is not connected to real government or municipal production systems.

---

## 1. Project Overview & Problem Statement

### The Problem
In modern municipalities, civic complaint portals often break down:
1. **Duplicate Overload:** Multiple citizens report the same overflowing garbage container or road pothole, leading to duplicate crew dispatches and wasted municipal resources.
2. **Wrong Department Routing:** Citizens do not know municipal hierarchy; a burst water pipe gets assigned to General Sanitation rather than the Water Board.
3. **Ghost Resolutions:** Contractors or field workers mark grievances as "Resolved" without verifiable proof or independent sign-off.
4. **Ignored Deadlines:** Complaints linger for weeks with zero escalation or accountability.

### The Solution: NAGARAKSHAK
NAGARAKSHAK is an intelligent civic complaint management prototype that transforms raw grievance submissions into an organized, closed-loop workflow:
- **Semantic Deduplication:** Analyzes location keywords and complaint vocabulary to flag similarity scores and link duplicate tickets rather than double-booking crews.
- **Explainable Department Triage:** Automatically classifies issues and routes them to Roads, Sanitation, Water Board, or Electrical departments with transparent reasoning.
- **AI Verification States:** Distinguishes between `AI Verified` (routed immediately to Authority Queue), `Needs More Evidence` (requires photo/clarification), and `Flagged for Review` (similarity check).
- **Dynamic SLA Escalation Sentinel:** Computes turnaround deadlines (12h, 24h, 48h, or 72h) and automatically flags/escalates breached deadlines to supervisory attention.
- **Two-Party Evidence Verification:** Requires field workers to submit repair notes and photographic proof, which a supervising reviewer must explicitly inspect and approve or reject.
- **Centralized Data & Service Abstraction:** Pure separation between UI components and the centralized persistence layer (`src/services/dataService.js`), fully prepared for immediate production database and REST API migration.
- **Citizen Privacy Safeguards:** Decoupled internal citizen IDs (`CIT-2026-XXXX`), masked contacts, and strict prohibition on raw Aadhaar or biometric data.

> **Architecture & Database Readiness Notice:**  
> The current hackathon demo uses a centralized data service layer (`dataService.js`) with structured relational models. In demo presentation mode, data persists reliably in the browser. Full PostgreSQL DDL schemas, REST API specifications, S3 presigned URL workflows, and database migration scripts are documented in [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md).

---

## 2. Technology Stack

- **Frontend Framework:** React 18 (`react` ^18.3.1, `react-dom` ^18.3.1)
- **Build Tool & Dev Server:** Vite 5 (`vite` ^5.4.14, `@vitejs/plugin-react` ^4.3.4)
- **UI Icons:** Lucide React (`lucide-react` ^1.16.0)
- **Styling:** Custom Vanilla CSS Design System (`src/index.css` with responsive layout, glassmorphism, and dark/light themes)
- **Centralized Data Layer:**
  - `src/services/dataService.js`: Singleton data & migration manager (normalized CRUD, relational mapping, JSON DB export/import).
  - `src/services/schema.js`: Domain schemas (`Citizen`, `Complaint`, `Evidence`, `StatusHistory`, `ResolutionRecord`, `SlaEvent`).
  - `src/services/evidenceService.js`: File validation (<= 5MB, MIME checking, SHA-256 generation, S3 presigned URL contract).
- **Database Architecture:** Production PostgreSQL DDL, REST API endpoints, and direct S3 object storage specifications defined in [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md).

---

## 3. Quick Start Guide (Installation & Run Instructions)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (comes bundled with Node.js)

### Step 1: Navigate to the Project Folder
Open your terminal and ensure you are in the project root directory:
```bash
cd civicfix-ai
```

### Step 2: Install Dependencies
Install the required packages defined in `package.json`:
```bash
npm install
```

### Step 3: Start the Development Server
Launch Vite's local dev server:
```bash
npm run dev
```

You will see output indicating the server is ready:
```text
  VITE v5.4.14  ready in 150 ms

  ➜  Local:   http://localhost:3000/
```
Open [http://localhost:3000/](http://localhost:3000/) in your browser (Google Chrome, Safari, Edge, Brave, or Firefox).

---

## 4. Authentication, Demo Roles & Credentials

When you open the application without an active session, NAGARAKSHAK displays the **Official Login Portal** as the initial entry point.

### Role 1: Citizen Login
- **Demo Mobile / ID:** `9876543210` (or `CIT-2026-9042` / `citizen@nagaraksha.demo`)
- **Demo Passcode / OTP:** `123456`
- **Instant Access:** Click the **"One-Click Login: Arun Kumar (Citizen)"** button.
- **Citizen Experience:**
  - Files grievances with photos/video evidence and location coordinates.
  - Tracks status changes (`AI Verified`, `Needs More Evidence`, `In Progress`, `Resolved`) with timestamps.
  - Submits 1–5 star satisfaction ratings and toggles community crew appreciations.
  - **UI Access Restrictions:** Municipal command screens (*Dashboard* and *Audit Trail*) as well as crew dispatch/closure approvals are hidden from citizens.

### Role 2: Authority / Government Staff Login
- **Demo Staff Badge / Email:** `KA-GOV-8821` (or `OFF-BBMP-402` / `officer@nagaraksha.demo`)
- **Security Password:** `admin123`
- **Instant Access:** Click the **"One-Click Login: Rajesh Varma (Zonal Officer)"** button.
- **Authority Experience:**
  - Accesses the full **Municipal Operations Command Dashboard** with live telemetry and SLA Sentinel.
  - Manages the **Authority Queue**, dispatches field crews, and inspects AI-verified tickets.
  - Inspects field worker repair proofs and performs official two-party verification (`Approve Resolution` or `Reject Evidence`).
  - Accesses the complete **Audit Trail** and exports/imports database JSON migration snapshots.

### Session Persistence & Logout
- Sessions persist across page refreshes via `authService` in `localStorage`.
- Clicking the **Logout** button in the top navbar terminates the session and immediately returns the user to the Login page.

---

## 5. Data Persistence & Migration Readiness

- **Centralized Service Architecture:** All database and storage operations are abstracted behind `src/services/dataService.js`. UI components never access storage APIs directly.
- **Reliable Persistence:** Complaints, status transitions, resolution sign-offs, and audit entries are reliably persisted. Refreshing the browser preserves newly submitted grievances and live workflow changes.
- **Separation of Demo vs. User Data:** Default presentation records are tagged with `isDemo: true`, while live citizen complaints are tagged with `isDemo: false`.
- **Database Export/Import (JSON Migration Snapshot):** Under the **Audit Log** tab, administrators and evaluators can click **Export DB JSON** to download a structured, relational snapshot (`citizens`, `complaints`, `evidenceFiles`, `statusHistory`, `resolutionRecords`, `slaEvents`) ready for ingestion into a production PostgreSQL or MongoDB database. You can also import previously saved snapshots via **Import DB JSON**.
- **"Reset Demo" Safety:** Clicking **Reset Demo** in the top navigation bar restores presentation defaults while keeping user workflow clean.

---

## 5. Feature Breakdown & Honest System Disclosure

| Feature | Implementation in Source Code | Description |
| :--- | :--- | :--- |
| **Category Classification** | **Rule-Based Keyword Matching** | Evaluates input against curated civic vocabulary (`CATEGORY_KEYWORDS` in `src/utils/aiEngine.js`) to categorize into Roads, Sanitation, Streetlight, or Water Leakage. Transparently labeled as "Rule-based demo analysis". |
| **Priority & SLA Assignment** | **Deterministic Heuristics** | Identifies safety and urgency keywords (*accident, live wire, hospital, deep*) to compute Critical (12h), High (24h), Medium (48h), or Low (72h) turnaround targets. |
| **Duplicate Detection** | **Token & Jaccard Similarity** | Measures token overlap across titles, descriptions, and neighborhood areas to flag potential duplicate tickets with similarity percentages. |
| **Department Routing** | **Predefined Civic Mapping** | Routes categorized tickets to appropriate municipal departments (e.g., Road Maintenance, Sanitation, Water Board, Electrical). |
| **Resolution Verification** | **Two-Party Review Workflow** | Field crew submits repair notes & photo proof; municipal reviewer explicitly approves or rejects before ticket closure. |
| **Activity & Audit Logging** | **Client-Side Event Log** | Appends timestamped events (`COMPLAINT_CREATED`, `AUTO_ESCALATION`, `REVIEWER_APPROVAL`) saved to `localStorage`. |

---

## 6. Known Prototype Limitations

- **Offline Demonstration:** Sample repair photos use lightweight inline SVG graphics so the demo functions 100% offline without external CDN dependencies.
- **Client-Side Storage:** Data is stored locally in the browser rather than on a remote SQL/NoSQL database server.
- **Rule-Based Engine:** Operates without paid external LLM APIs, ensuring zero rate limits, zero API key requirements, and instant responses.
- **Simulated Environment:** Does not interface with real government or city council dispatch software.

---

## 7. Troubleshooting

- **Port 3000 already in use?**  
  Vite will prompt to use the next available port, or you can specify one:
  ```bash
  npm run dev -- --port 3001
  ```
- **Page is blank?**  
  Open developer tools (`F12` or `Cmd + Option + I` on Mac) and verify that JavaScript is enabled.
- **Want to restore clean data?**  
  Click the **"Reset Demo"** button in the header navbar or clear site data for `localhost:3000`.

---

## 8. Hackathon Presentation Materials

See [PRESENTATION_GUIDE.md](PRESENTATION_GUIDE.md) for:
- 🎤 **The 90-Second 3-Speaker Pitch Script**
- 📊 **5-Slide Presentation Deck Structure**
- 💡 **Feature-to-Impact Breakdown for Judges**
- 🎯 **3 Likely Tough Judge Questions & Winning Answers**
