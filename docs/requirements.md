# System Requirements Specification (SRS): PSA Task Manager

**Project:** Multi-Tenant Task Management SaaS with Integrated ML Prediction  
**Document Version:** 1.0.0  
**Status:** Approved  
**Author:** Lead Architect & Security Lead  

---

## 1. Introduction & Purpose

This document specifies the complete functional, non-functional, data, and security requirements for the **PSA Task Manager (PTM)** platform. It establishes the verifiable engineering requirements against which system validation, acceptance testing, and academic assessment are conducted.

---

## 2. User Roles & Personas

The system enforces a four-tiered hierarchical Role-Based Access Control (RBAC) model:

| Role Identifier | Hierarchy Level | Description & System Rights |
| :--- | :---: | :--- |
| **`superadmin`** | Level 4 | Platform-level administrator. Governs all tenant organizations, activates/suspends organizations, audits system-wide logs, and performs audited cross-tenant diagnostic drill-downs. Does not belong to any single organization. |
| **`admin`** | Level 3 | Organization Administrator. Manages organizational settings, teams, users within their organization, projects, and tasks. Cannot view or alter data belonging to other organizations. |
| **`manager`** | Level 2 | Project/Team Lead. Creates projects, manages team assignments, creates and reassigns tasks, views project-level ML forecasts, and generates reports. |
| **`member`** | Level 1 | Individual Contributor / Engineer. Views assigned projects and tasks, updates task progress across Kanban lanes, logs actual completion hours, and views task ML duration guidance. |

---

## 3. Functional Requirements (FR)

### 3.1 Authentication & Tenant Onboarding
* **FR-AUTH-01 (Self-Service Tenant Creation):** The system shall permit new users to register via `/api/auth/register` with `name`, `email`, `password`, and `organizationName`. Upon successful registration, the system shall provision a new `Organization` entity and assign the user the `admin` role for that organization.
* **FR-AUTH-02 (Member Onboarding via Slug):** The system shall permit users to join an existing organization by supplying a valid `organizationSlug`. Users registering via slug shall be assigned the default `member` role within that tenant.
* **FR-AUTH-03 (JWT Token Pair):** The system shall issue a short-lived JSON Web Token (JWT) access token (15-minute validity) and an HTTP-only refresh token (7-day validity) upon successful authentication.
* **FR-AUTH-04 (Token Refresh & Revocation):** The system shall support transparent token renewal via `/api/auth/refresh` and complete session invalidation via `/api/auth/logout`.
* **FR-AUTH-05 (Suspended Tenant Lockout):** If an organization's status is set to `suspended`, all non-superadmin users belonging to that organization shall be immediately blocked from logging in (returning HTTP 403 Forbidden) and existing active tokens must be rejected.

### 3.2 Organization & Team Management
* **FR-ORG-01 (Organization Profile):** Organization Admins shall be capable of viewing and updating organization metadata (e.g., name, subscription tier, settings).
* **FR-ORG-02 (Team Lifecycle):** Org Admins and Managers shall be capable of creating, updating, and archiving functional teams within their organization.
* **FR-ORG-03 (Member Allocation):** Team managers shall be capable of assigning organization members to specific teams.

### 3.3 Project & Task Management
* **FR-PRJ-01 (Project Lifecycle):** Users with role `admin` or `manager` shall be capable of creating, editing, and archiving projects.
* **FR-PRJ-02 (Sprint Cadence & History):** Projects shall record sprint duration (weeks) and maintain historical throughput records (number of completed tasks per completed sprint) to feed the probabilistic forecasting engine.
* **FR-TSK-01 (Kanban Status Transitions):** Tasks shall support progression across four distinct workflow states: `backlog`, `in_progress`, `review`, and `done`.
* **FR-TSK-02 (Task Attribute Specification):** Each task shall record title, description, assigned user, project reference, priority (`low`, `medium`, `high`, `urgent`), complexity (`low`, `medium`, `high`), story points (Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21), and estimated hours.
* **FR-TSK-03 (Actual Duration Logging):** When a task transitions to `done`, the user shall record `actualDuration` (hours) to close the estimation feedback loop.

### 3.4 AI/ML Effort Estimation & Scheduling
* **FR-ML-01 (Automated Duration Inference):** When creating or updating a task, the backend shall automatically sanitize task metrics (story points, complexity, team experience) and query the internal Python ML microservice (`POST /predict/task-duration`).
* **FR-ML-02 (Prediction Persistence & Logging):** The resulting ML prediction (hours, days, confidence range) shall be persisted in the task document (`predictedDuration`, `predictionMetadata`) and recorded in a tenant-scoped `PredictionLog` collection for auditing and model drift analysis.
* **FR-ML-03 (Probabilistic Completion Forecasting):** When viewing a project dashboard, authorized users shall be capable of requesting a Monte Carlo completion forecast (`POST /forecast/project-completion`) based on current remaining backlog tasks and historical sprint throughput.
* **FR-ML-04 (Confidence Percentiles):** The Monte Carlo engine shall execute 10,000 randomized simulation runs and return the 50th percentile (expected timeline), 85th percentile (high-confidence contractual commitment), and 95th percentile (defensive risk margin) completion schedules.
* **FR-ML-05 (Heuristic Fallback):** If the internal ML microservice is unreachable or times out, the backend shall transparently fall back to an empirical complexity-weighted formula ($8 \times \text{StoryPoints} \times \text{ComplexityMultiplier}$) and flag the response with `source: 'fallback'`.

### 3.5 Governance & Audit Logging
* **FR-AUD-01 (Audit Trail Creation):** The system shall log security-relevant events (`CREATE`, `UPDATE`, `DELETE`, `PERMISSION_CHANGE`, `CROSS_TENANT_READ`) in an append-only `AuditLog` collection.
* **FR-AUD-02 (Org Audit Access):** Organization Admins shall be capable of reviewing their organization's audit log.
* **FR-AUD-03 (SuperAdmin Fleet Operations):** SuperAdmins shall have access to the global administrative console to inspect cross-tenant statistics, update tenant status (`active`/`suspended`), and inspect tenant audit histories.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance & Scalability
* **NFR-PERF-01 (API Latency):** 95% of standard CRUD API requests shall respond within 150ms under nominal load (100 concurrent active users).
* **NFR-PERF-02 (ML Inference Latency):** The ML effort inference endpoint shall respond within 50ms for individual tasks.
* **NFR-PERF-03 (Monte Carlo Simulation Speed):** Vectorized Monte Carlo simulations (10,000 iterations) shall complete within 350ms using NumPy array operations.
* **NFR-PERF-04 (Database Indexing):** All MongoDB queries shall utilize compound indices covering `{ organization: 1, ... }` to ensure $O(\log N)$ index scan execution plans and zero unindexed collection scans.

### 4.2 Reliability & Availability
* **NFR-REL-01 (Graceful Degradation):** Unavailability of the Python ML microservice shall never crash or prevent standard task creation, project management, or user authentication.
* **NFR-REL-02 (Error Sanitization):** Production API responses shall never leak internal database stack traces, file system paths, or raw query objects. Standardized JSON error structures (`{ success: false, error: "..." }`) must be returned.

### 4.3 Maintainability & Code Quality
* **NFR-MAINT-01 (Modularity):** The system shall maintain strict three-tier physical decoupling (Frontend client, Node.js API gateway, Python ML microservice).
* **NFR-MAINT-02 (Strict Coding Standards):** Backend code shall strictly use ECMAScript Modules (ESM) and async/await syntax. ML code shall adhere to PEP 8 standards with full type hinting.

---

## 5. Cybersecurity & Multi-Tenant Data Isolation Invariants (SEC)

> [!CRITICAL]
> The following security invariants are non-negotiable architectural mandates. Violation of any invariant constitutes a critical vulnerability.

### 5.1 Defense-in-Depth Isolation Invariants
* **SEC-INV-01 (Mandatory Discriminator Key):** Every tenant-specific MongoDB document (`User`, `Team`, `Project`, `Task`, `PredictionLog`, `AuditLog`) **MUST** store an immutable `organization` field populated with the tenant's `ObjectId`.
* **SEC-INV-02 (Server-Side Tenant Context Derivation):** The tenant filter (`organization`) **MUST** be derived exclusively from the verified server-side JWT session (`req.user.organization`). Under no circumstances may client-submitted query parameters or request body fields override the tenant context.
* **SEC-INV-03 (IDOR Rejection on Cross-Tenant Lookup):** Any attempt by a user in Organization $A$ to query, view, update, or delete a resource (project, task, team, user) belonging to Organization $B$ via direct ObjectId referencing **MUST** return an immediate HTTP 404 Not Found or HTTP 403 Forbidden.
* **SEC-INV-04 (Payload Parameter Stripping):** If an incoming `POST` or `PUT` request contains a forged `organization` or `organizationId` parameter in the payload, the backend middleware (`tenantScope.js`) and controllers **MUST** overwrite or delete the parameter with the authenticated user's organization before database persistence.
* **SEC-INV-05 (Automated Query Wrapping):** All ORM query expressions across controllers **MUST** be wrapped using the centralized `withTenantScope(query, req)` helper to guarantee that un-scoped queries cannot be accidentally executed.
* **SEC-INV-06 (Audited SuperAdmin Operations):** If a `superadmin` user executes a cross-tenant inspection or administrative action targeting Organization $B$, the system **MUST** immediately write an immutable audit log record to `AuditLog` containing:
  * `actor`: SuperAdmin user ObjectId
  * `action`: Specific operation (e.g., `SUPERADMIN_CROSS_TENANT_INSPECT`)
  * `targetTenant`: Target Organization ObjectId
  * `ipAddress`: Client IP address
  * `timestamp`: Precise UTC timestamp

### 5.2 Application Security Hardening
* **SEC-APP-01 (NoSQL Injection Neutralization):** All incoming request bodies, queries, and parameters shall be sanitized against MongoDB operator injection (`$gt`, `$ne`, `$where`, `$regex`) via express sanitization middleware and explicit type checking.
* **SEC-APP-02 (Brute-Force Rate Limiting):** Authentication endpoints (`/api/auth/login`, `/api/auth/register`) shall enforce strict rate limits (maximum 10 requests per 15 minutes per IP). General API endpoints shall enforce 100 requests per 15 minutes.
* **SEC-APP-03 (Zero-Trust Internal ML Microservice):** The Python ML service shall never be exposed to the public internet. All communication between the Node.js backend and the Python ML service must pass through an internal network channel authenticated by a shared secret header (`X-Internal-Token`). Requests lacking this valid token must be rejected with HTTP 401 Unauthorized.
* **SEC-APP-04 (Data Minimization to ML Service):** The Node.js backend **MUST NEVER** send organization IDs, tenant names, user names, or customer intellectual property to the ML microservice. The ML service receives only sanitized numeric and categorical features (story points, complexity, team experience).
