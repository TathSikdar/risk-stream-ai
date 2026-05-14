# Scotia-Guard Execution Process

> **Gemini CLI Instructions:**
>
> - This file serves as your master execution plan.
> - As you complete each step, update the corresponding `[ ]` to `[x]`.
> - Immediately after checking off a step, you MUST write a detailed entry in `LOGS.md`.
> - **Dynamic Expansion:** If you encounter a necessary intermediate step (e.g., resolving a dependency issue, refactoring for modularity, or setting up a required configuration not explicitly listed), you MUST add it to this file as a new checklist item under the appropriate phase, check it off when done, and document the addition in `LOGS.md`.

---

## Phase 1: The Core Engine (Backend & AI)

_Target: Establish database, AI orchestration, and secure BFF middleware._

- [ ] **Step 1.1: Database Setup**
  - [ ] Initialize SQLite/PostgreSQL database.
  - [ ] Create schema with tables: `Users` (Analysts), `Transactions` (Mock transfers >$10k), and `Risk_Assessments`.
  - [ ] Seed database with mock banking data.
- [ ] **Step 1.2: The LangGraph Agent (Python Microservice)**
  - [ ] Set up Python environment and install LangChain/LangGraph dependencies.
  - [ ] Create Tool 1: `mock_news_search(entity_name)` returning hardcoded adverse media JSON.
  - [ ] Create Tool 2: `check_sanctions_list(entity_name)` checking against a local CSV of flagged entities.
  - [ ] Develop the LangGraph DAG state machine to route between entity extraction, tool usage, and evaluation.
  - [ ] Implement Prompt Engineering to enforce strict JSON output (`{ "risk_score": 85, "reasoning": "...", "sources_checked": [...] }`).
- [ ] **Step 1.3: The BFF API (Node.js / Express)**
  - [ ] Initialize Node.js environment and Express server.
  - [ ] Implement robust RBAC middleware (requiring `Compliance_Officer` role).
  - [ ] Create endpoint: `GET /transactions` (fetch pending transactions).
  - [ ] Create endpoint: `POST /transactions/:id/analyze` (trigger Python microservice).

## Phase 2: The Enterprise Dashboard (Frontend)

_Target: Build a high-density, performant, and secure React UI._

- [ ] **Step 2.1: React & Style Architecture Setup**
  - [ ] Initialize React application.
  - [ ] Configure SASS/SCSS compiler.
  - [ ] Establish strict BEM (Block Element Modifier) folder structure and naming conventions.
- [ ] **Step 2.2: Dashboard Layout & Virtualization**
  - [ ] Build global layout (Side-navigation, Header).
  - [ ] Implement the main view: High-density table of pending transactions.
  - [ ] Integrate `react-window` for performant virtualization of the transaction list.
- [ ] **Step 2.3: The "Analysis" View & Animations**
  - [ ] Develop the slide-out panel for deep-dive transaction analysis.
  - [ ] Integrate agent reasoning data into the UI.
  - [ ] Create CSS3 animations (smooth loading spinners) to visualize the AI "thinking" state.
- [ ] **Step 2.4: Security Integration**
  - [ ] Build a mock login screen to issue JWTs.
  - [ ] Configure global Axios/Fetch interceptors to pass JWT in headers for all BFF API calls.

## Phase 3: The "Scotiabank Polish" (Testing & Enterprise Signals)

_Target: Ensure production-grade code quality, accessibility, and auditability._

- [ ] **Step 3.1: Unit Testing (Jest)**
  - [ ] Write Jest tests for Node.js RBAC middleware (Validate access denial for unauthorized roles).
  - [ ] Write Jest tests for React components (Ensure high-risk items render correctly based on props).
- [ ] **Step 3.2: Accessibility (AODA/WCAG)**
  - [ ] Audit application with Lighthouse.
  - [ ] Ensure 100% semantic HTML (ARIA labels, keyboard navigability on data tables/panels).
- [ ] **Step 3.3: Audit Logging**
  - [ ] Implement backend interceptor/logger to record all dashboard actions (e.g., "Analyst approved transaction").
  - [ ] Ensure audit logs are written to the database with exact timestamps and User IDs.

---

## Dynamically Added Steps

_(Gemini CLI: Add any unforeseen steps required to complete the project below this line, categorized by phase.)_

- [ ] _(Placeholder for future dynamic steps)_
