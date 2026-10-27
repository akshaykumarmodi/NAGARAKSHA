# NAGARAKSHAK 🛡️🏛️⚡
> **Tagline:** *From Citizen Reports to Verified Resolution.*  
> **Hackathon Prototype Notice:** NAGARAKSHAK is a working academic prototype built for demonstration using sample data and simulated municipal workflows. It is not connected to real government or municipal production systems.

━━━━━━━━━━━━━━━━━━━━

## 1. PROJECT OVERVIEW & PROBLEM STATEMENT

### THE PROBLEM

Modern municipalities face several challenges in managing civic complaints:

1. **Duplicate Overload:** Multiple citizens report the same overflowing garbage container or road pothole, leading to duplicate crew dispatches and wasted municipal resources.
2. **Wrong Department Routing:** Citizens often do not know which municipal department handles a particular issue. For example, a burst water pipe might be assigned to General Sanitation instead of the Water Board.
3. **Unverified Resolutions:** Field workers or contractors may mark complaints as resolved without providing verifiable proof or obtaining independent approval.
4. **Ignored Deadlines:** Complaints can remain unresolved for weeks without escalation or accountability.

### THE SOLUTION: NAGARAKSHAK

NAGARAKSHAK is an intelligent civic complaint management prototype that transforms citizen grievances into an organized, trackable workflow from reporting to verified resolution:

- **Semantic Deduplication:** Analyzes complaint descriptions, keywords, and locations to identify potentially duplicate tickets and link them rather than double-booking crews.
- **Explainable Department Triage:** Classifies complaints and routes them to the appropriate departments (Roads, Sanitation, Water Board, Electrical) with transparent reasoning.
- **AI Verification States:** Distinguishes between `AI Verified` (routed immediately to Authority Queue), `Needs More Evidence` (requires photo/clarification), and `Flagged for Review` (similarity check).
- **Dynamic SLA Escalation Sentinel:** Assigns turnaround targets (12h, 24h, 48h, or 72h) based on priority and hazard level, automatically flagging overdue complaints with urgent red alerts.
- **Two-Party Evidence Verification:** Requires field workers to submit repair notes and photographic evidence. A supervising municipal reviewer must inspect the submission and explicitly approve or reject the resolution before closure.
- **Centralized Data & Service Abstraction:** Pure separation between UI components and the centralized persistence layer (`src/services/dataService.js`), fully prepared for immediate production database and REST API migration.
- **Citizen Privacy Safeguards:** Decoupled internal citizen IDs (`CIT-2026-XXXX`), masked contacts, and strict prohibition on raw Aadhaar or biometric data.
- **Local Activity and Audit Trail:** Records complaint creation, triage recommendations, status changes, escalations, and reviewer decisions in browser storage for session-level traceability.

> **Architecture & Database Readiness Notice:**  
> The current hackathon demo uses a centralized data service layer (`dataService.js`) with structured relational models. In demo presentation mode, data persists reliably in the browser. Full PostgreSQL DDL schemas, REST API specifications, S3 presigned URL workflows, and database migration scripts are documented in [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md).

━━━━━━━━━━━━━━━━━━━━

## 2. TECHNOLOGY STACK

- **Frontend Framework:** React 18 (`react` ^18.3.1, `react-dom` ^18.3.1)
- **Build Tool and Development Server:** Vite 5 (`vite` ^5.4.14, `@vitejs/plugin-react` ^4.3.4)
- **UI Icons:** Lucide React (`lucide-react` ^1.16.0)
- **Styling:** Custom Vanilla CSS Design System (`src/index.css` with responsive layout, glassmorphism, and dark/light themes)
- **Centralized Data Layer:**
  - `src/services/dataService.js`: Singleton data & migration manager (normalized CRUD, relational mapping, JSON DB export/import).
  - `src/services/schema.js`: Domain schemas (`Citizen`, `Complaint`, `Evidence`, `StatusHistory`, `ResolutionRecord`, `SlaEvent`).
  - `src/services/evidenceService.js`: File validation (<= 5MB, MIME checking, SHA-256 generation, S3 presigned URL contract).
- **Data Persistence:** Browser `localStorage` (Keys: `civicfix_ai_complaints_v1`, `civicfix_ai_audit_v1`, with JSON export/import support)
- **Analysis Engine:** Local rule-based NLP text tokenization, Jaccard keyword overlap, and heuristic priority classification (`src/utils/aiEngine.js`, labeled as **Rule-based demo analysis**)
- **Database Architecture:** Production PostgreSQL DDL, REST API endpoints, and direct S3 object storage specifications defined in [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md).

### AI TRANSPARENCY

The current application is a frontend prototype. Its analysis engine uses deterministic, rule-based logic, including keyword matching, text tokenization, and heuristic scoring.

It does not connect to external cloud AI APIs such as OpenAI or Gemini. It also does not require paid external API keys, has no rate limits, and does not communicate with live government or production municipal systems.

━━━━━━━━━━━━━━━━━━━━

## 3. INSTALLATION AND RUN INSTRUCTIONS

### Prerequisites

- Node.js version 18 or higher is recommended.
- npm, which is bundled with Node.js.

### Step 1: Navigate to the Project Folder

Open the terminal and navigate to the project directory.

### Step 2: Install Dependencies

Command: `npm install`

### Step 3: Start the Development Server

Command: `npm run dev`

Vite will display the local development URL in the terminal. If the configured port is 3000, open:

http://localhost:3000/

The application can be opened in Google Chrome, Safari, Microsoft Edge, Brave, or Firefox.

━━━━━━━━━━━━━━━━━━━━

## 4. AUTHENTICATION, DEMO ROLES & CREDENTIALS

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

━━━━━━━━━━━━━━━━━━━━

## 5. DEMO DATA, PERSISTENCE & MIGRATION READINESS

- **Centralized Service Architecture:** All database and storage operations are abstracted behind `src/services/dataService.js`. UI components never access storage APIs directly.
- **Reliable Local Storage:** Complaints, status transitions, resolution sign-offs, and audit entries are reliably stored in the browser's `localStorage`. Refreshing the page or reopening the browser preserves stored data for the same browser and origin.
- **Separation of Demo vs. User Data:** Default presentation records are tagged with `isDemo: true`, while live citizen complaints are tagged with `isDemo: false`.
- **Database Export/Import (JSON Migration Snapshot):** Under the **Audit Log** tab, administrators and evaluators can click **Export DB JSON** to download a structured, relational snapshot (`citizens`, `complaints`, `evidenceFiles`, `statusHistory`, `resolutionRecords`, `slaEvents`) ready for ingestion into a production PostgreSQL or MongoDB database. You can also import previously saved snapshots via **Import DB JSON**.
- **"Reset Demo" Safety:** The **Reset Demo** button in the top navigation restores the default sample complaints and provides a clean demonstration environment.

Note: Browser storage is local to the browser and origin. It is not a shared municipal database.

━━━━━━━━━━━━━━━━━━━━

## 6. FEATURE BREAKDOWN

### 1. Category Classification

**Implementation:** Rule-Based Keyword Matching.

The system evaluates complaint text against predefined civic vocabulary to classify issues such as Roads, Sanitation, Streetlight, and Water Leakage.

### 2. Priority and SLA Assignment

**Implementation:** Deterministic Heuristics.

Safety and urgency keywords, such as accident, live wire, hospital, and deep, help determine priority and turnaround targets:

- Critical: 12 hours
- High: 24 hours
- Medium: 48 hours
- Low: 72 hours

### 3. Duplicate Detection

**Implementation:** Tokenization and Jaccard Similarity.

The system compares complaint titles, descriptions, and location information to flag potentially duplicate tickets and display similarity estimates.

### 4. Department Routing

**Implementation:** Predefined Civic Mapping.

Complaints are routed to suitable departments, including Road Maintenance, Sanitation, Water Board, and Electrical.

### 5. Resolution Verification

**Implementation:** Two-Party Review Workflow.

Field workers submit repair notes and photographic evidence. A municipal reviewer can inspect the submission and approve or reject the proposed resolution before the ticket is closed.

### 6. Activity and Audit Logging

**Implementation:** Client-Side Event Log.

The system records timestamped events, including complaint creation, automatic escalation, and reviewer approval, in browser storage.

━━━━━━━━━━━━━━━━━━━━

## 7. KNOWN PROTOTYPE LIMITATIONS

- **Offline Demonstration:** Sample repair photos use lightweight inline SVG graphics so the demo can function without external image CDN dependencies.
- **Client-Side Storage:** Data is stored in the browser rather than a remote SQL or NoSQL database.
- **Rule-Based Analysis:** The demo uses predefined rules and heuristics instead of a live large language model. It requires no external AI API keys and has no external AI API rate limits.
- **Simulated Environment:** The application does not communicate with actual government departments or municipal dispatch systems.
- **Demonstration Data:** Sample complaints and simulated workflows are intended for academic evaluation, not real-world municipal operations.

━━━━━━━━━━━━━━━━━━━━

## 8. TROUBLESHOOTING

### Port 3000 Already in Use?

Run the following command to use port 3001:

`npm run dev -- --port 3001`

### Page Appears Blank?

Open the browser developer tools using F12 or, on Mac, Command + Option + I. Check the console for JavaScript errors.

### Want to Restore Clean Demo Data?

Click the Reset Demo button in the application header. Alternatively, clear the site data for the application's local address.

━━━━━━━━━━━━━━━━━━━━

## 9. HACKATHON PRESENTATION MATERIALS

Refer to `PRESENTATION_GUIDE.md` for:

- The 90-second, three-speaker pitch script
- The five-slide presentation deck structure
- Feature-to-impact explanations for judges
