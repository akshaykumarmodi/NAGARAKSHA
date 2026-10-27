# NAGRAKSHAK 🏛️⚡

**Tagline:** From Citizen Reports to Verified Resolution.

**Hackathon Prototype Notice:** Nagrakshak is a working academic prototype built for demonstration using sample data and simulated municipal workflows. It is not connected to real government or municipal production systems.

━━━━━━━━━━━━━━━━━━━━

## 1. PROJECT OVERVIEW & PROBLEM STATEMENT

### THE PROBLEM

Modern municipalities face several challenges in managing civic complaints:

1. **Duplicate Overload:** Multiple citizens report the same overflowing garbage container or road pothole, leading to duplicate crew dispatches and wasted municipal resources.

2. **Wrong Department Routing:** Citizens often do not know which municipal department handles a particular issue. For example, a burst water pipe might be assigned to General Sanitation instead of the Water Board.

3. **Unverified Resolutions:** Field workers or contractors may mark complaints as resolved without providing verifiable proof or obtaining independent approval.

4. **Ignored Deadlines:** Complaints can remain unresolved for weeks without escalation or accountability.

### THE SOLUTION: NAGRAKSHAK

Nagrakshak is an intelligent civic complaint management prototype that transforms citizen grievances into an organized, trackable workflow from reporting to verified resolution.

Its key capabilities include:

- **Semantic Deduplication:** Analyzes complaint descriptions, keywords, and locations to identify potentially duplicate tickets and reduce unnecessary duplicate dispatches.
- **Explainable Department Triage:** Classifies complaints and routes them to the appropriate departments, such as Roads, Sanitation, Water Board, or Electrical, with transparent reasoning.
- **Dynamic SLA Escalation:** Assigns turnaround targets of 12, 24, 48, or 72 hours based on priority and flags overdue complaints for supervisory attention.
- **Two-Party Evidence Verification:** Requires field workers to submit repair notes and photographic evidence. A supervising reviewer must inspect the submission and explicitly approve or reject the resolution.
- **Local Activity and Audit Trail:** Records complaint creation, recommendations, status changes, escalations, and reviewer decisions in browser storage for session-level traceability.

━━━━━━━━━━━━━━━━━━━━

## 2. TECHNOLOGY STACK

- **Frontend Library:** React 18
- **Build Tool and Development Server:** Vite 5
- **UI Icons:** Lucide React
- **Styling:** Custom CSS design system with responsive layouts and dark/light accents
- **Data Persistence:** Browser localStorage
- **Analysis Engine:** Local rule-based text tokenization, Jaccard keyword similarity, and heuristic priority classification

### AI TRANSPARENCY

The current application is a frontend prototype. Its analysis engine uses deterministic, rule-based logic, including keyword matching, text tokenization, and heuristic scoring.

It does not connect to external cloud AI APIs such as OpenAI or Gemini. It also does not use a remote database, live government APIs, production municipal systems, or cryptographic blockchain auditing.

━━━━━━━━━━━━━━━━━━━━

## 3. INSTALLATION AND RUN INSTRUCTIONS

### Prerequisites

- Node.js version 18 or higher is recommended.
- npm, which is bundled with Node.js.

### Step 1: Navigate to the Project Folder

Open the terminal and navigate to the project directory.

Command: `cd nagrakshak`

Note: This command assumes the project folder has been renamed to `nagrakshak`. If it still has its previous name, use that folder name instead.

### Step 2: Install Dependencies

Command: `npm install`

### Step 3: Start the Development Server

Command: `npm run dev`

Vite will display the local development URL in the terminal. If the configured port is 3000, open:

http://localhost:3000/

The application can be opened in Google Chrome, Safari, Microsoft Edge, Brave, or Firefox.

━━━━━━━━━━━━━━━━━━━━

## 4. DEMO DATA AND PERSISTENCE

- **Local Storage:** Complaints, status changes, and audit entries are stored in the browser's localStorage.
- **Session Persistence:** Refreshing the page or reopening the browser preserves stored data for the same browser and origin.
- **Reset Demo:** The Reset Demo button in the top navigation restores the default sample complaints and provides a clean demonstration environment.

Note: Browser storage is local to the browser and origin. It is not a shared municipal database.

━━━━━━━━━━━━━━━━━━━━

## 5. FEATURE BREAKDOWN

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

## 6. KNOWN PROTOTYPE LIMITATIONS

- **Offline Demonstration:** Sample repair photos use lightweight inline SVG graphics so the demo can function without external image CDN dependencies.
- **Client-Side Storage:** Data is stored in the browser rather than a remote SQL or NoSQL database.
- **Rule-Based Analysis:** The demo uses predefined rules and heuristics instead of a live large language model. It requires no external AI API keys and has no external AI API rate limits.
- **Simulated Environment:** The application does not communicate with actual government departments or municipal dispatch systems.
- **Demonstration Data:** Sample complaints and simulated workflows are intended for academic evaluation, not real-world municipal operations.

━━━━━━━━━━━━━━━━━━━━

## 7. TROUBLESHOOTING

### Port 3000 Already in Use?

Run the following command to use port 3001:

`npm run dev -- --port 3001`

### Page Appears Blank?

Open the browser developer tools using F12 or, on Mac, Command + Option + I. Check the console for JavaScript errors.

### Want to Restore Clean Demo Data?

Click the Reset Demo button in the application header. Alternatively, clear the site data for the application's local address.

━━━━━━━━━━━━━━━━━━━━

## 8. HACKATHON PRESENTATION MATERIALS

Refer to `PRESENTATION_GUIDE.md` for:

- The 90-second, three-speaker pitch script
- The five-slide presentation deck structure
- Feature-to-impact explanations for judges
