# NAGARAKSHAK 🏛️⚡
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
- **Dynamic SLA Escalation Sentinel:** Computes turnaround deadlines (12h, 24h, 48h, or 72h) and automatically flags/escalates breached deadlines to supervisory attention.
- **Two-Party Evidence Verification:** Requires field workers to submit repair notes and photographic proof, which a supervising reviewer must explicitly inspect and approve or reject.
- **Local Activity & Audit Trail:** Logs triage recommendations, status transitions, and supervisor sign-offs directly in browser storage for full session traceability.

> **Architecture & AI Transparency:**  
> The current application is a frontend prototype. It runs entirely in the browser using `localStorage` for state persistence and a deterministic rule-based demo analysis engine (keyword matching, text tokenization, and heuristic scoring). It **does not** require or connect to external cloud AI APIs (like OpenAI or Gemini), a remote database, live government APIs, or cryptographic blockchain auditing.

---

## 2. Technology Stack (from `package.json`)

- **Frontend Library:** React 18 (`react` ^18.3.1, `react-dom` ^18.3.1)
- **Build Tool & Dev Server:** Vite 5 (`vite` ^5.4.14, `@vitejs/plugin-react` ^4.3.4)
- **UI Icons:** Lucide React (`lucide-react` ^1.16.0)
- **Styling:** Custom Vanilla CSS Design System (`src/index.css` with responsive layout and dark/light accents)
- **Data Persistence:** Browser `localStorage` (Keys: `civicfix_ai_complaints_v1`, `civicfix_ai_audit_v1`)
- **Analysis Engine:** Local rule-based NLP tokenization, Jaccard keyword overlap, and heuristic priority classification (`src/utils/aiEngine.js`, labeled as **Rule-based demo analysis**)

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

## 4. How the Demo Data & Persistence Work

- **Local Storage:** All complaints, status changes, and audit entries persist in your browser's `localStorage`.
- **Session Persistence:** Refreshing the page or closing your browser preserves newly created complaints and supervisor actions.
- **"Reset Demo" Feature:** To reset the application back to its clean initial state for pitches or grading, click the **Reset Demo** button in the top navigation bar. It instantly restores the default set of sample civic tickets.

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
