# Project Charter: AI-Powered Multi-Tenant Task Management SaaS

**Project Title:** Multi-Tenant Task Management SaaS with Integrated ML Effort Estimation & Monte Carlo Scheduling  
**Acronym:** PSA Task Manager (PTM)  
**Academic Module:** Project Assessment (PSA) — AI/ML, Software Project Management & Cybersecurity Integration  
**Date:** September 2026  
**Document Version:** 1.0.0  
**Status:** Approved & Implemented  

---

## 1. Executive Summary & Problem Statement

Modern software engineering organizations routinely suffer from poor project predictability, inaccurate delivery forecasts, and fragmented management tooling. Traditional task tracking platforms (e.g., Jira, Asana, Trello) operate as passive digital repositories: they record human estimations without providing empirical, data-driven validation. Consequently, development teams frequently fall prey to the **Planning Fallacy** and cognitive biases, yielding systemic project delays, budget overruns, and developer burnout.

Simultaneously, existing commercial SaaS solutions often fail to integrate machine learning and cybersecurity natively at the architectural foundation. When machine learning features are introduced, they are frequently appended as fragile afterthoughts or third-party plugins that risk exposing sensitive intellectual property and proprietary development metrics across organizational boundaries.

The **PSA Task Manager** project resolves these deficiencies by engineering a production-grade, three-tier multi-tenant SaaS platform featuring:
1. **Empirically Grounded AI/ML Effort Estimation:** A specialized regression model trained on canonical software engineering historical datasets (Desharnais PROMISE repository) to compute objective effort estimates based on task complexity, story points, and team experience.
2. **Probabilistic Monte Carlo Schedule Forecasting:** A vectorized simulation engine executing 10,000 randomized iterations over historical sprint throughput to deliver 50th, 85th, and 95th percentile completion dates rather than brittle single-point commitments.
3. **Defense-in-Depth Cybersecurity & Tenant Isolation:** A pooled multi-tenant architecture strictly enforcing authorization, zero-trust internal microservice networking, NoSQL injection neutralization, and full audit logging of cross-tenant SuperAdmin operations.

---

## 2. Business Case & Value Proposition

| Stakeholder Group | Existing Pain Point | Solution Delivered by PTM |
| :--- | :--- | :--- |
| **Software Engineers** | Unrealistic deadlines imposed by subjective stakeholder pressure. | Objective effort baselines validated against historical data and function-point metrics. |
| **Engineering Managers / Scrum Masters** | Inability to communicate uncertainty or statistical confidence to non-technical leadership. | Interactive Kanban board accompanied by 50%/85%/95% confidence intervals generated via Monte Carlo simulation. |
| **Enterprise Executives & Clients** | Multi-tenant data breach risks and vendor lock-in. | Cryptographic JWT isolation, strict tenant scoping at the ORM layer, and tamper-evident audit logging. |
| **Platform Operators / SuperAdmins** | Blind spots in multi-tenant fleets and lack of governance tooling. | Centralized management dashboard enabling tenant suspension, fleet monitoring, and audited cross-tenant drill-down. |

---

## 3. Project Objectives & Success Criteria

### 3.1 Quantitative Objectives
* **Estimation Accuracy:** Achieve Median Magnitude of Relative Error ($\text{MdMRE}$) $\le 35\%$ and $\text{PRED}(25) \ge 40\%$ across benchmark test partitions.
* **Inference Latency:** Deliver sub-100ms response times for task duration inference and sub-350ms response times for 10,000-run Monte Carlo project forecasts.
* **Zero Cross-Tenant Leakage:** Maintain $100\%$ pass rate on automated Insecure Direct Object Reference (IDOR) and cross-tenant data leakage test suites ($0$ unauthorized data reads or writes permitted).
* **Test Coverage:** Exceed $90\%$ unit and integration test coverage across security invariants, RBAC policies, and internal microservice communication.

### 3.2 Qualitative Objectives
* Genuine architectural integration between AI/ML, Software Engineering, and Cybersecurity (the ML microservice is an organic internal subsystem, not an external mock).
* Clean separation of concerns adhering to modular microservice principles (Next.js UI, Node.js Orchestrator & Security Gatekeeper, Python FastAPI ML Engine).
* Intuitive, responsive enterprise user experience requiring zero specialized machine learning training to operate.

---

## 4. Scope Baseline

### 4.1 In-Scope Deliverables
* **Three-Tier Architecture:**
  * **Frontend:** Responsive Next.js (App Router, Tailwind CSS) client with authentication state, Kanban boards, project settings, forecasting views, and SuperAdmin governance panels.
  * **Backend:** Node.js Express REST API utilizing Mongoose ODM, JWT access/refresh token rotation, rate limiting, and tenant scoping middleware.
  * **ML Microservice:** Python 3.11 FastAPI microservice delivering machine learning inference (`/predict/task-duration`) and probabilistic simulations (`/forecast/project-completion`).
* **Multi-Tenant Data Layer:** MongoDB database with collection-level discriminator keys (`organization`) backed by programmatic scoping helpers.
* **Role-Based Access Control (RBAC):** Hierarchical permission enforcement across `superadmin`, `admin`, `manager`, and `member` roles.
* **Automated Test Suites:** End-to-end Jest and Pytest suites verifying security invariants, cryptographic tokens, and forecasting bounds.
* **Project Management Documentation:** Comprehensive software project management artefacts in `/docs`.

### 4.2 Out-of-Scope (Deferred to Future Iterations)
* Real-time collaborative multi-cursor canvas editing (WebSocket presence).
* Direct integration with third-party issue trackers (Jira API sync, GitHub Issues importer).
* Production Kubernetes orchestration and multi-region database sharding.

---

## 5. Key Stakeholders & Governance

| Role | Name / Title | Key Responsibilities |
| :--- | :--- | :--- |
| **Project Sponsor / Evaluator** | University Academic Panel | Assessment evaluation, rubric compliance verification, and viva examination. |
| **Technical Lead & Architect** | Senior Full-Stack Engineer | End-to-end architectural design, implementation, security enforcement, and testing. |
| **Data Science Lead** | AI/ML Specialist | Dataset acquisition, exploratory data analysis, feature engineering, and model training. |
| **Cybersecurity Officer** | Security Auditor | Threat modeling, IDOR vulnerability auditing, penetration testing, and compliance. |

---

## 6. Assumptions, Constraints & Dependencies

### 6.1 Assumptions
* Organizations utilize standard Agile Scrum or Kanban methodologies with sprint cadences ranging from 1 to 4 weeks.
* Software tasks can be characterized by standard metrics (Story Points, Complexity ratings, Transactions, and Team Experience).
* The internal network boundary between the Node.js backend and Python ML microservice is private and secured.

### 6.2 Constraints
* **Platform Compatibility:** System must run seamlessly across standard local and cloud development environments (Windows/Linux/macOS) utilizing standard runtime engines (Node.js 20+, Python 3.11+, MongoDB 7+).
* **Programming Languages:** Strict adherence to modern plain JavaScript (Node.js ESM, Next.js React) and Python.

### 6.3 Dependencies
* **Data Sources:** Desharnais Software Estimation Dataset from the PROMISE Software Engineering Repository.
* **Core Libraries:** `scikit-learn`, `numpy`, `pandas`, `fastapi`, `mongoose`, `express`, `next`, `tailwindcss`.

---

## 7. Sign-off & Authorization

| Role | Representative | Signature Status | Date |
| :--- | :--- | :--- | :--- |
| Lead Software Architect | Senior Full-Stack Engineer | Approved | 2026-09-17 |
| Project Assessment Lead | Academic Reviewer | Pending Final Viva | — |
