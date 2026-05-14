# Scotia-Guard: AML Compliance Orchestrator

![Architecture: Microservices](https://img.shields.io/badge/Architecture-Microservices-blue)
![AI Framework: LangGraph](https://img.shields.io/badge/AI-LangGraph-orange)
![Frontend: React](https://img.shields.io/badge/Frontend-React-61DAFB)
![Backend: Node.js/Python](https://img.shields.io/badge/Backend-Node.js%20%7C%20Python-4CAF50)

## System Overview

**Scotia-Guard** is a state-of-the-art, full-stack application engineered to automate Anti-Money Laundering (AML) and Adverse Media monitoring for enterprise banking environments.

Traditionally, compliance analysts manually search through news streams, international watchlists, and vast transaction logs to flag risky entities—a process that is notoriously slow, costly, and prone to human error. Scotia-Guard revolutionizes this workflow by deploying an **Agentic AI backend** that autonomously ingests high-value transaction logs, queries simulated external news APIs and sanction lists, and processes the retrieved data using Large Language Models (LLMs).

The output is a structured, mathematically robust "Risk Score," presented to compliance officers on a secure, high-density, and highly accessible React dashboard. The system strictly enforces banking security standards, utilizing a Backend-for-Frontend (BFF) architecture to manage Role-Based Access Control (RBAC), JWT authentication, and comprehensive audit logging.

## Conceptual & Mathematical Foundations

### 1. Directed Acyclic Graphs (DAGs) for Agentic State Machines

The AI reasoning engine is built using **LangGraph**, which models the agent's workflow as a cyclical graph or Directed Acyclic Graph (DAG).

- **Concept:** Instead of linear code execution, the investigation process operates as a state machine. Nodes represent actions (e.g., `Extract Entities`, `Search News`, `Evaluate Sentiment`), and edges represent conditional routing based on the results of the previous node.
- **Application:** If the `Search News` node returns high adverse media hits, the graph routes the state to an intensive `Sanctions Verification` node. If no hits are found, it terminates early to save compute resources, generating a low-risk profile.

### 2. Weighted Risk Scoring Algorithm

The ultimate output of the AI orchestration is a quantifiable Risk Score ranging from $0$ to $100$. This is calculated using a weighted probabilistic model based on the severity of the findings:

$$ RiskScore = \min\left(100, \sum\_{i=1}^{n} (W_i \times S_i) + \alpha(V) \right) $$

Where:

- $W_i$: The weight of the risk category (e.g., Sanctions Match $W=0.8$, Negative News $W=0.3$).
- $S_i$: The severity of the specific hit determined by the LLM (Scale 0-100).
- $\alpha(V)$: A risk multiplier based on the transaction volume or anomaly detection.
- _Note: Any direct hit on a global sanctions list instantly acts as an overriding step-function, pushing the score to 100._

### 3. Backend-for-Frontend (BFF) Architecture

To ensure enterprise security, the React frontend never communicates directly with the Python AI microservice.

- **Concept:** A Node.js middleware layer serves as the BFF. It acts as a reverse proxy, shaping the data specifically for the UI, handling JWT validation, rate limiting, and enforcing RBAC. Only users carrying a specific cryptographic claim (e.g., `role: Compliance_Officer`) are permitted to invoke the resource-heavy LangGraph endpoints.

## Technology Stack

### Frontend (The Dynamic Ecosystem)

- **Framework:** React.js (Functional Components, Hooks, Context API)
- **Styling:** SASS/SCSS strictly adhering to the **BEM (Block Element Modifier)** methodology for modular, scalable CSS.
- **Performance:** React Window (virtualization for rendering high-volume transaction lists without DOM lag).
- **Accessibility:** 100% Semantic HTML, fully compliant with AODA/WCAG standards.

### Backend (The Enterprise Bridge - BFF)

- **Runtime/Framework:** Node.js with Express.js
- **Security:** JSON Web Tokens (JWT), Role-Based Access Control (RBAC) middleware, Helmet.js.
- **Integration:** RESTful API design serving as the bridge between the UI and the Python microservices.

### AI Engine (The Orchestrator)

- **Language:** Python 3.10+
- **Framework:** LangChain & LangGraph
- **Capabilities:** Tool-calling agents capable of multi-step reasoning, automated entity extraction, and strict JSON schema generation.

### Data & Quality Assurance

- **Database:** SQLite / PostgreSQL (Managing `Users`, `Transactions`, `Risk_Assessments`, and immutable audit logs).
- **Testing:** **Jest** (Comprehensive unit testing for Node.js RBAC middleware and React UI components).
