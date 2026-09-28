# Cybersecurity & Project Risk Register: PSA Task Manager

**Project:** Multi-Tenant Task Management SaaS with Integrated ML Prediction  
**Document Version:** 1.0.0  
**Framework:** ISO/IEC 27005 & NIST SP 800-30 Risk Assessment Standards  
**Status:** Active Governance Baseline  

---

## 1. Risk Scoring Methodology

Risks are evaluated using a standard $5 \times 5$ Qualitative Risk Matrix:

$$\text{Risk Magnitude (Score)} = \text{Likelihood (1–5)} \times \text{Impact (1–5)}$$

* **Likelihood Scale:** 1 (Rare), 2 (Unlikely), 3 (Possible), 4 (Likely), 5 (Almost Certain)
* **Impact Scale:** 1 (Negligible), 2 (Minor), 3 (Moderate), 4 (Major), 5 (Catastrophic)
* **Severity Levels:**
  * **Critical (16–25):** Immediate architectural mitigation mandatory before deployment.
  * **High (10–15):** Strict automated controls and tests required.
  * **Medium (5–9):** Compensating controls and operational monitoring.
  * **Low (1–4):** Acceptable risk with periodic review.

---

## 2. Risk Matrix Heatmap

| Likelihood \ Impact | 1 (Negligible) | 2 (Minor) | 3 (Moderate) | 4 (Major) | 5 (Catastrophic) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **5 (Almost Certain)** | — | — | — | — | — |
| **4 (Likely)** | — | — | R-04 (12) | — | — |
| **3 (Possible)** | — | — | R-03 (9) | R-01 (12), R-02 (12) | — |
| **2 (Unlikely)** | — | — | R-06 (6) | R-05 (8) | — |
| **1 (Rare)** | — | — | — | — | — |

---

## 3. Comprehensive Risk Register

### R-01: Insecure Direct Object Reference (IDOR) & Cross-Tenant Data Leakage
* **Category:** Cybersecurity / Data Privacy
* **Pre-Mitigation Score:** Likelihood: 4, Impact: 5 $\rightarrow$ **Score: 20 (Critical)**
* **Description:** In a pooled multi-tenant database, an authenticated attacker belonging to Organization $A$ manipulates the URL parameter (e.g., `/api/tasks/:id` or `/api/projects/:id`) substituting an ObjectId belonging to Organization $B$. Without explicit tenant filtering, the database returns private tasks or proprietary project documentation.
* **Mitigation Strategy (Implemented):**
  1. `tenantScope.js` middleware dynamically extracts the verified tenant identity exclusively from the cryptographic server-side JWT session (`req.user.organization`).
  2. Programmatic query helper `withTenantScope(query, req)` automatically merges `{ organization: req.user.organization }` into every database read and write.
  3. Client-supplied `organizationId` in request payloads is discarded/stripped.
  4. Automated Jest security test suite (`tests/security.test.js`) verifies that attempting to access a foreign tenant's task ID yields an immediate HTTP 404/403.
* **Post-Mitigation Residual Score:** Likelihood: 1, Impact: 5 $\rightarrow$ **Score: 5 (Low / Managed)**

---

### R-02: SuperAdmin Cross-Tenant Blast Radius & Abuse of Privilege
* **Category:** Cybersecurity / Insider Threat
* **Pre-Mitigation Score:** Likelihood: 3, Impact: 4 $\rightarrow$ **Score: 12 (High)**
* **Description:** A platform SuperAdmin possesses system-wide permissions to inspect any tenant's workspace for maintenance or compliance. A compromised SuperAdmin account or malicious insider could exfiltrate multi-tenant customer data undetected.
* **Mitigation Strategy (Implemented):**
  1. SuperAdmins cannot arbitrarily perform unlogged cross-tenant reads; the backend wraps all SuperAdmin tenant inspections in mandatory audit hooks.
  2. Immutable audit log records are written to `AuditLog` capturing the SuperAdmin's user ID, target organization ID, action, client IP, and UTC timestamp.
  3. SuperAdmins are forbidden from viewing plain-text user passwords (bcrypt hashing with work factor 10).
  4. Tenant suspension controls allow instant revoking of compromised organizations without database drops.
* **Post-Mitigation Residual Score:** Likelihood: 1, Impact: 4 $\rightarrow$ **Score: 4 (Low)**

---

### R-03: Machine Learning Service Downtime & Cascading Failure
* **Category:** System Reliability & Architecture
* **Pre-Mitigation Score:** Likelihood: 3, Impact: 3 $\rightarrow$ **Score: 9 (Medium)**
* **Description:** The Python FastAPI ML microservice crashes, suffers high latency, or exhausts memory during intense Monte Carlo simulations (10,000 iterations), causing the Node.js API to hang or fail during standard task creation.
* **Mitigation Strategy (Implemented):**
  1. Circuit breaking and strict network timeouts (2500ms) implemented in `server/services/mlServiceClient.js`.
  2. Built-in deterministic fallback heuristic ($8 \times \text{StoryPoints} \times \text{Multiplier}$) activates automatically if the ML service does not respond within the timeout window.
  3. Task creation succeeds regardless of ML liveness, tagging the task with `source: 'fallback'`.
  4. Microservice health endpoint (`GET /health`) enables container orchestrators to auto-restart faulted instances.
* **Post-Mitigation Residual Score:** Likelihood: 2, Impact: 1 $\rightarrow$ **Score: 2 (Low)**

---

### R-04: Dataset Domain Shift & Software Estimation Bias
* **Category:** AI/ML Engineering & Validity
* **Pre-Mitigation Score:** Likelihood: 4, Impact: 3 $\rightarrow$ **Score: 12 (High)**
* **Description:** The underlying regression model was trained on the historic Desharnais dataset ($N=81$ projects from late 1980s/1990s). Modern software stacks, automated testing, and CI/CD pipelines exhibit fundamentally different velocity profiles, leading to inaccurate task duration estimates for agile teams.
* **Mitigation Strategy (Implemented):**
  1. Transparent confidence intervals (10th to 90th percentile bounds) and transparent feature explanations are presented in the UI to prevent users from treating predictions as infallible gospel.
  2. Monte Carlo project forecasting derives throughput distributions directly from the tenant's *own* recent sprint velocity rather than historical static datasets.
  3. Actual duration is captured upon task completion, creating a foundation for future organization-specific continuous fine-tuning (see `docs/limitations.md`).
* **Post-Mitigation Residual Score:** Likelihood: 3, Impact: 2 $\rightarrow$ **Score: 6 (Medium / Accepted Constraint)**

---

### R-05: NoSQL Injection & Query Operator Tampering
* **Category:** Cybersecurity / Application Hardening
* **Pre-Mitigation Score:** Likelihood: 2, Impact: 4 $\rightarrow$ **Score: 8 (High)**
* **Description:** Attackers supply JSON payloads containing MongoDB query operators (e.g., `{ "email": { "$gt": "" }, "password": "..." }`) to bypass authentication checks or enumerate records without credentials.
* **Mitigation Strategy (Implemented):**
  1. Strict input type checking in `authController.js` verifying that incoming fields (`email`, `password`) are non-empty strings.
  2. Automated testing in `tests/security.test.js` (Invariant 6) validating that operator injection payloads are neutralized and rejected with HTTP 400 Bad Request.
  3. Mongoose schema strict typing preventing arbitrary schema pollution.
* **Post-Mitigation Residual Score:** Likelihood: 1, Impact: 4 $\rightarrow$ **Score: 4 (Low)**

---

### R-06: Internal Microservice Spoofing & Token Exposure
* **Category:** Cybersecurity / Microservice Networking
* **Pre-Mitigation Score:** Likelihood: 2, Impact: 3 $\rightarrow$ **Score: 6 (Medium)**
* **Description:** Unauthorized external clients attempt to query the Python ML microservice directly to consume compute or manipulate Monte Carlo models.
* **Mitigation Strategy (Implemented):**
  1. The Python microservice requires a shared secret header `X-Internal-Token` on all prediction and forecasting routes (`app/dependencies.py`).
  2. Public internet routing is restricted to the Node.js gateway; the FastAPI service listens on private localhost/internal network interfaces.
  3. Verified by automated pytest suite (`test_predict_endpoint_missing_token`, `test_predict_endpoint_invalid_token`).
* **Post-Mitigation Residual Score:** Likelihood: 1, Impact: 2 $\rightarrow$ **Score: 2 (Low)**

---

## 4. Risk Treatment Action Plan

| Risk ID | Treatment Strategy | Responsible Owner | Target Verification Mechanism |
| :---: | :---: | :---: | :--- |
| **R-01** | Mitigate | Lead Security Architect | Automated Jest IDOR integration suite (`npm run test:security`). |
| **R-02** | Mitigate | Full-Stack Engineer | `AuditLog` collection assertion tests on SuperAdmin cross-tenant inspection. |
| **R-03** | Mitigate | Backend Lead | Unit test in `tests/mlClient.test.js` asserting graceful heuristic fallback. |
| **R-04** | Accept & Disclose | Data Science Lead | Disclosed in `docs/limitations.md`; mitigated via Monte Carlo tenant throughput. |
| **R-05** | Mitigate | Backend Lead | Jest NoSQL injection assertion test in `tests/security.test.js`. |
| **R-06** | Mitigate | Infrastructure Engineer | Pytest unauthorized access tests in `ml-service/tests/test_ml_service.py`. |
