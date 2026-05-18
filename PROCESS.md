# RiskStream AI Execution Process

> **Gemini CLI Instructions:**
>
> - This file serves as your master execution plan.
> - As you complete each step, update the corresponding `[ ]` to `[x]`.
> - Immediately after checking off a step, you MUST write a detailed entry in `LOGS.md`.
> - **Dynamic Expansion:** If you encounter a necessary intermediate step (e.g., resolving a dependency issue, refactoring for modularity, or setting up a required configuration not explicitly listed), you MUST add it to this file as a new checklist item under the appropriate phase, check it off when done, and document the addition in `LOGS.md`.

---

## Phase 1: The Core Engine (Backend & AI)

_Target: Establish database, AI orchestration, and secure BFF middleware._

- [x] **Step 1.1: Database Setup**
  - [x] Initialize SQLite/PostgreSQL database.
  - [x] Create schema with tables: `Users` (Analysts), `Transactions` (Mock transfers >$10k), and `Risk_Assessments`.
  - [x] Seed database with mock banking data.
- [x] **Step 1.2: The LangGraph Agent (Python Microservice)**
  - [x] Set up Python environment and install LangChain/LangGraph dependencies.
  - [x] Create Tool 1: `mock_news_search(entity_name)` returning hardcoded adverse media JSON.
  - [x] Create Tool 2: `check_sanctions_list(entity_name)` checking against a local CSV of flagged entities.
  - [x] Develop the LangGraph DAG state machine to route between entity extraction, tool usage, and evaluation.
  - [x] Implement Prompt Engineering to enforce strict JSON output (`{ "risk_score": 85, "reasoning": "...", "sources_checked": [...] }`).
- [x] **Step 1.3: The BFF API (Node.js / Express)**
  - [x] Initialize Node.js environment and Express server.
  - [x] Implement robust RBAC middleware (requiring `Compliance_Officer` role).
  - [x] Create endpoint: `GET /transactions` (fetch pending transactions).
  - [x] Create endpoint: `POST /transactions/:id/analyze` (trigger Python microservice).

## Phase 2: The Enterprise Dashboard (Frontend)

_Target: Build a high-density, performant, and secure React UI._

- [x] **Step 2.1: React & Style Architecture Setup**
  - [x] Initialize React application.
  - [x] Configure SASS/SCSS compiler.
  - [x] Establish strict BEM (Block Element Modifier) folder structure and naming conventions.
- [x] **Step 2.2: Dashboard Layout & Virtualization**
  - [x] Build global layout (Side-navigation, Header).
  - [x] Implement the main view: High-density table of pending transactions.
  - [x] Integrate `react-window` for performant virtualization of the transaction list.
- [x] **Step 2.3: The "Analysis" View & Animations**
  - [x] Develop the slide-out panel for deep-dive transaction analysis.
  - [x] Integrate agent reasoning data into the UI.
  - [x] Create CSS3 animations (smooth loading spinners) to visualize the AI "thinking" state.
- [x] **Step 2.4: Security Integration**
  - [x] Build a mock login screen to issue JWTs.
  - [x] Configure global Axios/Fetch interceptors to pass JWT in headers for all BFF API calls.

## Phase 3: The "RiskStream Polish" (Testing & Enterprise Signals)

_Target: Ensure production-grade code quality, accessibility, and auditability._

- [x] **Step 3.1: Unit Testing (Jest)**
  - [x] Write Jest tests for Node.js RBAC middleware (Validate access denial for unauthorized roles).
  - [x] Write Jest tests for React components (Ensure high-risk items render correctly based on props).
- [x] **Step 3.2: Accessibility (AODA/WCAG)**
  - [x] Audit application with Lighthouse.
  - [x] Ensure 100% semantic HTML (ARIA labels, keyboard navigability on data tables/panels).
- [x] **Step 3.3: Audit Logging**
  - [x] Implement backend interceptor/logger to record all dashboard actions (e.g., "Analyst approved transaction").
  - [x] Ensure audit logs are written to the database with exact timestamps and User IDs.

---

## Phase 4: Production Data Transition

_Target: Replace mock/simulated data with live enterprise-grade APIs._

- [x] **Step 4.1: Live Adverse Media Integration**
  - [x] Integrate Tavily Search API for real-time web investigations.
  - [x] Refactor `tools.py` to support live queries with simulated fallbacks.
  - [x] Enable the NVIDIA NIM agent to reason over current, real-world headlines.
- [x] **Step 4.2: Live Watchlist Integration**
  - [x] Connect to official government sanction list APIs (e.g., OpenSanctions).
  - [x] Replace CSV-based lookup with live API validation and fallback logic.
- [x] **Step 4.3: Real-Time Transaction Ingestion**
  - [x] Implement a webhook endpoint (`/api/ingest`) for real-time transaction ingestion.
  - [x] Migrated database logic to support PostgreSQL for production-scale data handling.

---

## Phase 5: Productization & Dashboard Completion

_Target: Finalize the product by removing all mocks and making the dashboard fully functional._

- [x] **Step 5.1: Functional Dashboard Implementation**
  - [x] Create `Dashboard.tsx` view with real-time analytics.
  - [x] Implement summary cards (Total Volume, Flagged Count, Risk Distribution).
  - [x] Add visualization charts (Risk Score Trends).
  - [x] Integrate Dashboard into `App.tsx` routing.
- [x] **Step 5.2: Remove AI Engine Mock Data**
  - [x] Remove hardcoded `adverse_media_db` from `tools.py`.
  - [x] Ensure strict adherence to live API data with robust error handling.
  - [x] Refactor CSV sanctions check to act as a secondary local cache rather than mock fallback.
  - [x] **Production Transition:** Purge all mock transactional data from the database.
- [x] **Step 5.3: Secure Authentication & Backend Hardening**
  - [x] Implement password hashing for user accounts using `bcrypt`.
  - [x] Update `seed.py` to generate secure initial credentials.
  - [x] Final audit of all endpoints to remove any hardcoded prototype logic.
- [x] **Step 5.4: Automated AI Analysis on Ingestion**
  - [x] Update `/api/ingest` to automatically trigger the AI agent for high-value transactions.
  - [x] Implement a notification system for high-risk flags in the UI.

---

## Dynamically Added Steps

- [x] **Step 6.1.1: Fix missing AI Engine dependency**
  - [x] Add `langchain-google-genai==4.2.2` to `ai_engine/requirements.txt` to resolve `ModuleNotFoundError`.
- [x] **Step 7.1.1: Fix Backend Native Dependencies in Docker**
  - [x] Create `.dockerignore` to prevent host `node_modules` pollution.
  - [x] Update `backend/Dockerfile` with build tools and `npm rebuild` for native modules.
  - [x] Switch to named volumes in `docker-compose.yml` for robust isolation.
  - [x] Decouple database path in `db.js` via `DATABASE_URL`.
- [x] **Step 7.1.2: Fix Frontend Sass Variables**
  - [x] Resolve `Undefined variable: $border-radius-lg` in `_dashboard.scss`.
  - [x] Standardize design tokens in `_variables.scss`.
- [x] **Step 7.3: Real-Time Event System (Socket.io)**
  - [x] Integrate `socket.io` into Node.js BFF for event broadcasting.
  - [x] Implement real-time notification toasts in React frontend.
  - [x] Hook ingestion and AI analysis phases into the WebSocket stream.

---

## Phase 6: LLM Provider Flexibility (Google Gemini)

_Target: Enable cost-effective scaling by supporting the Gemini free tier._

- [x] **Step 6.1: Gemini Integration**
  - [x] Install `langchain-google-genai` and update `requirements.txt`.
  - [x] Refactor `get_llm()` to support the `GEMINI` provider using `gemini-1.5-flash`.
  - [x] Update `.env.example` and `README.md` to document the new provider configuration.

---

## Phase 7: Orchestration & Containerization

_Target: Enable single-command startup for the entire ecosystem._

- [x] **Step 7.1: Multi-Container Dockerization**
  - [x] Create optimized `Dockerfile`s for AI Engine, Backend, and Frontend.
  - [x] Implement `docker-compose.yml` for unified service orchestration.
  - [x] Configure volume mapping for real-time code updates and database persistence.
- [x] **Step 7.2: Root NPM Orchestration**
  - [x] Initialize root `package.json` with `concurrently`.
  - [x] Implement unified `npm start` command for local non-Docker development.
