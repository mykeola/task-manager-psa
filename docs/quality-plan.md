# Software Quality Assurance (SQA) Plan & Verification Report

**Project:** Multi-Tenant Task Management SaaS with Integrated ML Prediction  
**Document Version:** 1.0.0  
**Standard:** IEEE 730-2014 (Standard for Software Quality Assurance Processes)  
**Status:** Approved & Verified  

---

## 1. Quality Objectives & Acceptance Criteria

The primary quality objective is to deliver a robust, highly maintainable, and secure multi-tenant SaaS prototype demonstrating seamless architectural convergence between Machine Learning, Project Management, and Cybersecurity.

| Quality Dimension | Metric / Target | Achieved Result | Verification Method |
| :--- | :--- | :--- | :--- |
| **Data Isolation Integrity** | $0$ cross-tenant data leaks allowed across IDOR tests. | **0 leaks (100% isolated)** | `tests/security.test.js` |
| **Authentication & RBAC** | 100% enforcement of role-based route permissions. | **100% enforced** | `tests/auth_rbac.test.js` |
| **ML Inference Performance** | Sub-100ms prediction response time. | **~28ms average** | FastAPI TestClient benchmarks |
| **Simulation Accuracy** | Monte Carlo percentiles strictly ordered ($P_{50} \le P_{85} \le P_{95}$). | **Ordered & verified** | `ml-service/tests/test_ml_service.py` |
| **Automated Test Pass Rate** | $100\%$ pass rate on all committed test suites. | **100% (21/21 passed)** | Jest + Pytest CI runners |
| **Frontend Production Build** | Zero build errors or unhandled hydration mismatches. | **Clean build (10/10 routes)** | Next.js `npm run build` |

---

## 2. Test Strategy & Architectural Verification Levels

```mermaid
graph TD
    subgraph Level 3: End-to-End System & Security Verification
        S1[Security Invariants 1-6: IDOR & NoSQL Injection]
        S2[SuperAdmin Cross-Tenant Auditing]
    end

    subgraph Level 2: Integration & Contract Testing
        I1[Node.js REST API Integration via Supertest]
        I2[FastAPI Microservice Internal RPC Contract]
        I3[Mongoose Multi-Tenant Pre/Post Hooks]
    end

    subgraph Level 1: Unit & Component Testing
        U1[Python Monte Carlo Vectorized Simulator]
        U2[Scikit-Learn Preprocessor & Model Predictor]
        U3[Token Generation & Tenant Scope Helper]
    end

    Level 1 --> Level 2
    Level 2 --> Level 3
```

---

## 3. Automated Test Suite Execution Results

### 3.1 Node.js Backend & Cybersecurity Test Suite (Jest + Supertest)
**Test Runner:** Jest 29.7 (ESM Mode with `--runInBand`)  
**Execution Command:** `npm test`  
**Total Test Suites:** 3 passed, 3 total  
**Total Tests:** 13 passed, 13 total  

#### Suite 1: `tests/security.test.js` (Cybersecurity & Tenant Isolation)
* `[PASS]` **SECURITY INVARIANT 1:** Org A admin cannot read Org B task via IDOR enumeration (`HTTP 404`).
* `[PASS]` **SECURITY INVARIANT 2:** Org A admin cannot inject Org B `organizationId` in request body (forged parameter stripped).
* `[PASS]` **SECURITY INVARIANT 3:** `GET /api/tasks` returns strictly Org A tasks, zero Org B tasks (isolation verified).
* `[PASS]` **SECURITY INVARIANT 4:** Org A admin cannot delete Org B project (`HTTP 404`).
* `[PASS]` **SECURITY INVARIANT 5:** SuperAdmin cross-tenant inspection is audit-logged to `AuditLog` with actor and target tenant.
* `[PASS]` **SECURITY INVARIANT 6:** NoSQL operator injection (`$gt`, `$ne`) in request query/body is neutralized (`HTTP 400`).

#### Suite 2: `tests/auth_rbac.test.js` (Authentication & RBAC)
* `[PASS]` `POST /api/auth/register` (Self-Service: Creates Organization + Admin role).
* `[PASS]` `POST /api/auth/login` (Valid credentials issue JWT token pair).
* `[PASS]` `POST /api/auth/login` (Invalid password correctly yields `HTTP 401`).
* `[PASS]` `POST /api/auth/login` (Suspended organization correctly yields `HTTP 403`).
* `[PASS]` `RBAC:` Member attempting to access admin-only team deletion yields `HTTP 403 Forbidden`.

#### Suite 3: `tests/mlClient.test.js` (ML Microservice Client & Resilience)
* `[PASS]` `predictTaskDuration` sanitizes missing/partial feature inputs cleanly with default baselines.
* `[PASS]` `forecastProjectCompletion` formats simulation payload correctly and asserts $P_{50} \le P_{85}$.

---

### 3.2 Python ML Microservice Test Suite (Pytest)
**Test Runner:** Pytest 9.1.1 (Python 3.11.3)  
**Execution Command:** `pytest ml-service/tests -v`  
**Total Tests:** 8 passed, 8 total  

* `[PASS]` `test_health_check_public_access`: Confirms `GET /health` is publicly available without credentials.
* `[PASS]` `test_predict_endpoint_missing_token`: Rejects unauthenticated requests with `HTTP 401`.
* `[PASS]` `test_predict_endpoint_invalid_token`: Rejects spoofed header tokens with `HTTP 401`.
* `[PASS]` `test_forecast_endpoint_missing_token`: Rejects unauthenticated forecast calls with `HTTP 401`.
* `[PASS]` `test_predict_task_duration_valid`: Generates valid duration estimates, bounds, and days.
* `[PASS]` `test_predict_validation_ranges`: Validates Pydantic boundary checks for story points ($1 \le x \le 21$).
* `[PASS]` `test_monte_carlo_forecast_valid`: Validates 10,000-run simulation output and percentile ordering ($P_{50} \le P_{85} \le P_{95}$).
* `[PASS]` `test_monte_carlo_unit_function`: Pure mathematical validation of NumPy vectorized simulation kernel.

---

## 4. Code Standards & Static Analysis Compliance

1. **ECMAScript Standards:**
   * Backend code strictly follows modern ES6+ ESM specification (`"type": "module"` in `package.json`).
   * Asynchronous flow control exclusively utilizes `async/await` rather than nested callback chains.
2. **Python Standards:**
   * ML service code conforms to PEP 8 style guidelines.
   * Input models and response bodies are strictly type-annotated utilizing Pydantic models.
3. **Frontend Standards:**
   * Next.js App Router component isolation between server and client components (`"use client"` directive).
   * Centralized HTTP interceptor with automatic token injection and 401 unauthenticated redirect logic.
   * Strict cleanup functions attached to `useEffect` listeners to prevent client memory leaks.

---

## 5. Defect Management & Resolution Log

| Defect ID | Severity | Description | Root Cause | Resolution Applied |
| :---: | :---: | :--- | :--- | :--- |
| **BUG-01** | High | `BSONError: Cast to ObjectId failed` during project creation. | In `authController.js`, `user.organization` was populated as a document object; calling `.toString()` on the populated document produced a multi-line representation instead of the hex ID string. | Updated `generateAccessToken` in `auth.js` to extract `user.organization._id.toString()`. Added defensive ObjectId regex extraction in `tenantScope.js`. |
| **BUG-02** | Medium | Reference error in `taskController.js`: `estimatedDuration is not defined`. | Local variable typo in `logAuditEvent` inside the task creation route. | Corrected reference to `predictedDuration`. |
| **BUG-03** | Medium | Operator precedence issue in `mlServiceClient.js` produced `NaN` for `points_adjust`. | Missing parentheses around fallback ternary logic during numeric conversion. | Explicitly cast and sanitized all numeric payload parameters prior to outbound HTTP dispatch. |
| **BUG-04** | Low | Uncaught `TypeError: email.toLowerCase is not a function` during NoSQL injection test. | In `authController.js`, an object payload `{ $gt: "" }` was passed to `.toLowerCase()`. | Added strict string type verification (`typeof email === 'string'`) prior to calling string methods. |
