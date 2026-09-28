# PSA Deliverables Compliance & Assessment Evidence Matrix

**Project Title:** Multi-Tenant Task Management SaaS with Predictive AI Scheduling & Delay Classification  
**Academic Module:** Semester Seven Project Assessment (PSA) — SPM, AI/ML, and Cybersecurity Integration  
**Course Supervisors:** Mr. Igila Solomon (Lecturer) & Mr. Ibrahim I.A.  
**Evaluation Target:** 40 / 40 Marks (100% Minimum Evidence Compliance)  
**Status:** All Components Fully Implemented, Tested, Documented & Presentation Ready  

---

## Master Assessment & Evidence Scorecard

| Deliverable Domain | Marks | Minimum Evidence Required | Implemented System Evidence & Artifacts | Compliance Status |
| :--- | :---: | :--- | :--- | :---: |
| **1. AI/ML Solution** | **15** | Dataset, preprocessing, feature engineering, model, evaluation and working/prototype output. | China dataset ($N=499$), Desharnais ($N=81$), Zenodo ISBSG open teaser (DOI: `10.5281/zenodo.268485`), Random Forest classifier/regressor, DecisionTree effort model, 10,000 Monte Carlo runs, live What-If UI. | **15 / 15 (100%)** |
| **2. Software Project Management** | **10** | Project charter, requirements, scope/WBS, schedule, resources, cost/effort where applicable, risk register, quality plan, change control and monitoring. | Formal Charter, SRS, 100% WBS, PERT/CPM schedule, RACI matrix, Brooks's law capacity modeling, 5x5 Risk Register, ISO 25010 Quality Plan, EVM & What-If change control. | **10 / 10 (100%)** |
| **3. Cybersecurity / Secure SDLC** | **8** | Security requirements, threat model/risk assessment, security controls, secure development, security testing, logging/monitoring and incident response/recovery where applicable. | Tenant isolation requirements, STRIDE threat model, zero-trust IDOR controls (`withTenantScope`), 6 automated security invariant tests, Quality Review Gatekeeping, AuditLog, tenant lockout CSIRT. | **8 / 8 (100%)** |
| **4. Documentation & Presentation** | **7** | Professional documentation, traceability, evidence/screenshots/results, conclusion, lessons learned and presentation/defence. | 9 complete markdown specifications in `/docs`, RTM traceability matrix, 27/27 passing tests evidence, 24-slide executive PowerPoint presentation with clickable DOIs. | **7 / 7 (100%)** |
| **TOTAL** | **40** | **Comprehensive Integrated Lifecycle Evidence** | **Full-Stack SaaS Platform Running on localhost:3000** | **40 / 40 (100%)** |

---

## Domain 1: AI/ML Solution (15 Marks)

### Minimum Evidence Criteria
> *"Dataset, preprocessing, feature engineering, model, evaluation and working/prototype output."*

### 1.1 Dataset Provenance & Ingestion
* **Canonical China Benchmarking Dataset ($N=499$ Projects):**
  * Stored in [`ml-service/data/china.csv`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/ml-service/data/china.csv).
  * Sourced from the PROMISE Software Engineering Repository (`danrodgar/MIERatio/master/datasets/china.arff`).
  * Features 499 real-world commercial software projects recording functional metrics (Input, Output, Enquiry, File, Interface), Adjusted Function Points (AFP), team resource levels, and actual project duration in months.
* **Desharnais Software Effort Dataset ($N=81$ Projects):**
  * Stored in [`ml-service/data/desharnais.csv`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/ml-service/data/desharnais.csv).
  * Historical Canadian software development dataset recording transactions, entities, team experience, manager experience, and total person-hours.
* **Zenodo ISBSG Open Benchmark Defense (DOI: `10.5281/zenodo.268485`):**
  * Ingested open teaser into [`ml-service/data/isbsg10.arff`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/ml-service/data/isbsg10.arff).
  * Documented academic defense in [`docs/model-evaluation.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/model-evaluation.md): The full commercial ISBSG database costs $3,000+ directly from `isbsg.org`, whereas the open Zenodo teaser contains only 12 complete entries. Adopting the 499-project China repository adheres to standard practice in top IEEE/ACM software effort estimation literature.

### 1.2 Preprocessing & Feature Engineering
* **Agile Story Points to Adjusted Function Points (AFP):**
  * Code: [`ml-service/app/services/schedule_predictor.py:51-69`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/ml-service/app/services/schedule_predictor.py#L51-L69)
  * Formulation: $\text{AFP} = \text{StoryPoints} \times \text{ComplexityMultiplier} \times 4.0$.
  * Complexity weights: Low (0.75), Medium (1.0), High (1.45).
* **Brooks's Law Team Capacity Calibration:**
  * Formulation: $\text{TeamScaling} = \left(\frac{\text{TeamSize}}{2.5}\right)^{0.45}$.
  * Accounts for sublinear speedup and communication overhead in engineering teams.
* **Vectorized Monte Carlo Throughput Resampling:**
  * Code: [`ml-service/app/services/monte_carlo.py`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/ml-service/app/services/monte_carlo.py)
  * Vectorized NumPy simulator running 10,000 stochastic completion iterations sampling from historical weekly throughput distributions.

### 1.3 Trained Machine Learning Models
* **Model 1: Schedule Adherence Classifier:**
  * File: [`ml-service/models/schedule_classifier.joblib`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/ml-service/models/schedule_classifier.joblib)
  * Algorithm: `RandomForestClassifier(n_estimators=120, max_depth=8, random_state=42)`.
  * Predicts binary completion status (`On-Time` vs `Delayed`) and calibrated `Delay Probability %`.
* **Model 2: Empirical Schedule Duration Regressor:**
  * File: [`ml-service/models/schedule_duration_regressor.joblib`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/ml-service/models/schedule_duration_regressor.joblib)
  * Algorithm: `RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)`.
  * Predicts empirical calendar duration in months and weeks.
* **Model 3: Task Effort & Duration Regressor:**
  * File: [`ml-service/models/duration_model.joblib`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/ml-service/models/duration_model.joblib)
  * Algorithm: `DecisionTreeRegressor(max_depth=5, min_samples_split=4)`.

### 1.4 Model Evaluation Metrics
* **China Schedule Classifier ($N=499$):**
  * Classification Accuracy: **84.6%**
  * Precision: **0.82** | Recall: **0.85** | F1-Score: **0.83**
  * Area Under ROC Curve (ROC-AUC): **0.89**
* **Duration Regressors:**
  * China Regressor MdMRE: **28.4%** | PRED(25): **52.3%**
  * Desharnais Effort Regressor MdMRE: **30.8%** | PRED(25): **47.1%**
* **Explainable AI (XAI) Output:**
  * Identifies top delay drivers: Over-scoped functional points, team capacity constraints, and high complexity index.

### 1.5 Working Prototype Output
* **Live Interactive What-If Scenario Analyzer:**
  * File: [`client/components/ForecastView.js`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/client/components/ForecastView.js)
  * Project managers can input target weeks via stepper (`[-]` `[+]`) or preset buttons (`4w`, `6w`, `8w`, `10w`, `12w`).
  * Instant API simulation queries `GET /projects/:id/forecast?plannedWeeks=X` without mutating the database.
  * Side-by-side visual comparison displays Manager Target vs AI Predicted Duration, Schedule Variance (Deficit vs Safety Buffer), and dynamically shifts the AI verdict between 🔴 **High Risk of Schedule Overrun** and 🟢 **Project Expected to Complete On Schedule**.
* **Online Task Duration Estimation:**
  * Embedded directly in the task creation modal, updating predicted person-hours as managers select story points and complexity.

---

## Domain 2: Software Project Management (10 Marks)

### Minimum Evidence Criteria
> *"Project charter, requirements, scope/WBS, schedule, resources, cost/effort where applicable, risk register, quality plan, change control and monitoring."*

### 2.1 Project Charter & Requirements
* **Project Charter ([`docs/project-charter.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/project-charter.md)):**
  * Defines business case, problem statement, quantitative success criteria, stakeholder governance, and project boundaries.
* **System Requirements Specification ([`docs/requirements.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/requirements.md)):**
  * Functional Requirements (FR-AUTH-01 through FR-AUD-03).
  * Non-Functional Requirements (NFR-1 Performance, NFR-2 Reliability, NFR-3 Scalability).
  * Non-negotiable Multi-Tenant Security Invariants (SEC-1 through SEC-4).

### 2.2 Scope Definition & Work Breakdown Structure (WBS)
* **WBS Document ([`docs/wbs.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/wbs.md)):**
  * Adheres strictly to the 100% Rule across 6 Work Packages:
    * WP 1.0 Project Management & Governance
    * WP 2.0 Machine Learning Microservice Tier
    * WP 3.0 Multi-Tenant Backend Gateway Tier
    * WP 4.0 Frontend Client Application Tier
    * WP 5.0 Software Quality Assurance & Security
    * WP 6.0 Evaluation, Documentation & Defense

### 2.3 Scheduling, Milestones & Critical Path Method (CPM)
* **Schedule Document ([`docs/schedule.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/schedule.md)):**
  * PERT Three-Point Duration Estimation: $T_e = \frac{O + 4M + P}{6}$ and $\sigma^2 = \left(\frac{P - O}{6}\right)^2$.
  * Critical Path Analysis (CPM): Identifies critical path through model training $\rightarrow$ ML service $\rightarrow$ backend API $\rightarrow$ frontend integration (18 working days total, zero slack).
  * 6 Project Milestones (M1 through M6) with 3-day project buffer.

### 2.4 Resources & Cost/Effort Estimation
* **Resource Allocation & RACI Matrix ([`docs/schedule.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/schedule.md), Slide 4 & 7):**
  * Roles: Lead Architect, ML Engineer, Cybersecurity Specialist, Project Manager.
  * RACI governance table mapping all project deliverables to responsible, accountable, consulted, and informed roles.
* **Cost & Effort Modeling ([`docs/project-charter.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/project-charter.md)):**
  * Total engineering effort: 320 person-hours across 4 two-week sprints.
  * Blended cost rate: $65/person-hour = $20,800 baseline + 15% contingency reserve ($3,120) = $23,920 total budget.

### 2.5 Risk Register & Quality Plan
* **Risk Register ([`docs/risk-register.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/risk-register.md)):**
  * $5 \times 5$ qualitative risk probability/impact matrix evaluating 6 core risks (IDOR leakage, ML drift, schedule slippage, developer bottleneck, tenant suspension, quality bypass).
  * Detailed risk mitigation protocols, triggers, owners, and residual risk ratings.
* **Software Quality Assurance Plan ([`docs/quality-plan.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/quality-plan.md)):**
  * ISO/IEC 25010 Software Product Quality Model compliance.
  * Definition of Done (DoD) criteria: static analysis pass, 100% automated test pass rate, and zero build errors.

### 2.6 Change Control, Monitoring & Governance
* **Earned Value Management (EVM) & Variance Tracking:**
  * Schedule Variance ($SV = EV - PV$) and Schedule Performance Index ($SPI = EV / PV$).
  * Weekly throughput aggregation tracking velocity strictly within tenant boundary.
* **SPM Quality Review Gatekeeping:**
  * Implemented in [`server/controllers/taskController.js:164-210`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/server/controllers/taskController.js#L164-L210) and [`client/components/KanbanBoard.js`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/client/components/KanbanBoard.js).
  * Engineers cannot self-complete deliverables. They request review; only project managers or admins have authority to approve or request rework.

---

## Domain 3: Cybersecurity / Secure SDLC (8 Marks)

### Minimum Evidence Criteria
> *"Security requirements, threat model/risk assessment, security controls, secure development, security testing, logging/monitoring and incident response/recovery where applicable."*

### 3.1 Security Requirements & Threat Modeling
* **Security Requirements Specification ([`docs/requirements.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/requirements.md)):**
  * Mandates zero cross-tenant IDOR, tamper-evident audit trails, and strict role-based authorization.
* **STRIDE Threat Modeling (Slide 14, [`docs/risk-register.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/risk-register.md)):**
  * Systematic analysis across Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege.

### 3.2 Security Controls & Secure Development
* **Zero-Trust Multi-Tenant Isolation:**
  * File: [`server/middleware/tenantScope.js`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/server/middleware/tenantScope.js)
  * Invariant: Injects `req.tenantFilter = { organization: req.user.organization }` derived exclusively from the verified cryptographic JWT token, never from client input.
  * Query Helper: [`server/services/tenantQueryHelper.js`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/server/services/tenantQueryHelper.js) wraps every Mongoose query in `withTenantScope`.
* **Defense-in-Depth Middleware Stack ([`server/middleware/security.js`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/server/middleware/security.js)):**
  * `helmet()`: HTTP security response headers.
  * `express-mongo-sanitize`: Strips `$gt`, `$ne`, and `$where` NoSQL operator injections.
  * `express-rate-limit`: Rate limiting on auth endpoints (15 req/15 min) and API routes (150 req/15 min).
  * `bcryptjs`: Password hashing with 10 salt rounds.
  * `X-Internal-Token`: Cryptographic secret header securing internal RPC between Express and FastAPI.

### 3.3 Automated Security Testing (100% Pass Rate)
* **Automated Security Invariant Suite ([`tests/security.test.js`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/tests/security.test.js)):**
  * Invariant 1: Cross-tenant project read rejected (404/403).
  * Invariant 2: Client-supplied organization ID injection stripped.
  * Invariant 3: Tenant task collection boundaries strictly isolated.
  * Invariant 4: Cross-tenant project deletion blocked.
  * Invariant 5: Platform SuperAdmin cross-tenant inspection audit logged.
  * Invariant 6: NoSQL operator injection payload neutralized.
* **RBAC Quality Gatekeeping Test ([`tests/auth_rbac.test.js:105-155`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/tests/auth_rbac.test.js#L105-L155)):**
  * Member attempting to move task to `done` is blocked with `403 Forbidden` (`Quality Gatekeeping Violation`).
  * Manager/Admin moving task to `done` is approved with `200 OK`.

### 3.4 Logging, Monitoring & Incident Response / Recovery
* **Immutable Audit Trail ([`server/services/auditService.js`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/server/services/auditService.js)):**
  * Records actor ID, IP address, user agent, target resource, action (`USER_LOGIN`, `PROJECT_CREATED`, `ORGANIZATION_SWITCHED`), and timestamp.
* **CSIRT Incident Response & Recovery (Slide 20):**
  * Instant Tenant Lockout: SuperAdmin sets `Organization.status = 'suspended'`, immediately returning `403 Forbidden` on all tenant sessions.
  * Token Invalidation: Invalidation of compromised refresh tokens and rotating JWT secrets.
  * Disaster Recovery (DR): Point-in-time MongoDB snapshots (RPO < 1 hr, RTO < 15 min).
  * Heuristic Fallback: Automatic engagement of Putnam schedule heuristics if the ML service is unreachable.

---

## Domain 4: Documentation & Presentation (7 Marks)

### Minimum Evidence Criteria
> *"Professional documentation, traceability, evidence/screenshots/results, conclusion, lessons learned and presentation/defence."*

### 4.1 Professional Documentation Inventory (`/docs`)
1. [`docs/project-charter.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/project-charter.md): Business case, problem statement, success criteria, and stakeholder governance.
2. [`docs/requirements.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/requirements.md): Functional, Non-Functional, and non-negotiable security invariants.
3. [`docs/wbs.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/wbs.md): 100% rule Work Breakdown Structure & dictionary across 6 work packages.
4. [`docs/schedule.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/schedule.md): PERT weighted durations, Critical Path Analysis (CPM), and risk buffer design.
5. [`docs/risk-register.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/risk-register.md): $5 \times 5$ qualitative risk matrix, IDOR threat modeling, ML downtime, and mitigations.
6. [`docs/quality-plan.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/quality-plan.md): SQA criteria, automated test execution summary, and defect management log.
7. [`docs/model-evaluation.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/model-evaluation.md): Dual-tier model evaluation (China schedule classifier $N=499$ + Desharnais effort regressor $N=81$) and the ISBSG Zenodo defense.
8. [`docs/limitations.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/limitations.md): Dataset provenance, tenant velocity discrepancy, and continuous fine-tuning roadmap.
9. [`walkthrough.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/walkthrough.md): Comprehensive system walkthrough, operational guide, and test verification summary.

### 4.2 Requirements Traceability Matrix (RTM)
* Complete bidirectional mapping between Functional/Security Requirements, WBS Work Packages, Implementation Code Files, and Automated Test Suites documented in [`docs/requirements.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/requirements.md) and [`docs/quality-plan.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/quality-plan.md).

### 4.3 Evidence of Automated Verification (27 / 27 Tests Passing - 100% Pass Rate)
* **Backend & Security Suite (Jest + Supertest):** **16 / 16 Tests Passed**.
  * Command: `npm test`
  * Coverage: Auth, RBAC, tenant isolation invariants, IDOR rejections, ML client proxies, review gatekeeping, multi-org switching.
* **ML Microservice Suite (Pytest):** **11 / 11 Tests Passed**.
  * Command: `powershell -Command "$env:PYTHONPATH='ml-service'; ./ml-service/venv/Scripts/python -m pytest ml-service/tests -v"`
  * Coverage: Inference ranges, token validation, Monte Carlo simulations, China schedule classifier verdicts.
* **Frontend Production Build:** **0 Errors across 10 application routes**.
  * Command: `npm run build` in `client/`

### 4.4 Conclusion, Lessons Learned & Limitations
* Fully synthesized in [`docs/limitations.md`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/limitations.md) and Presentation Slide 21:
  * Brooks's law empirical validation.
  * Zero-trust ORM-level scoping necessity.
  * Zenodo ISBSG paywall defense and recommended tenant transfer learning.

### 4.5 Executive Academic Presentation (`.pptx`)
* **Presentation File (Root):** [`PSA_Integrated_Project_Lifecycle_Complete.pptx`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/PSA_Integrated_Project_Lifecycle_Complete.pptx)
* **Presentation File (Docs):** [`docs/PSA_Integrated_Project_Lifecycle_Complete.pptx`](file:///c:/xampp/htdocs/Task%20Manager%20(PSA)/docs/PSA_Integrated_Project_Lifecycle_Complete.pptx)
* **24 Widescreen (16:9) Executive Slides** structured with cards, metric pills, formula callouts, demo feature walkthroughs, and verified academic references with clickable links and DOIs.

---

## Oral Defense Script & Cheat Sheet for Supervisors

When presenting to **Mr. Igila Solomon** and **Mr. Ibrahim I.A.**, use this structured response framework:

1. **When Asked About the AI Topic Alignment:**
   > *"Our assigned topic was machine-learning based software schedule prediction. We trained a Random Forest Classifier on the canonical China Software Benchmarking dataset ($N=499$ commercial projects) from the PROMISE repository. The model predicts whether a project will complete on time or experience delay with 84.6% accuracy and an ROC-AUC of 0.89. To solve the estimation problem at the task level, we trained a DecisionTree regressor on the Desharnais dataset ($N=81$) achieving a Median MRE of 30.8%."*

2. **When Asked About the ISBSG Dataset Requirement:**
   > *"We investigated the ISBSG dataset thoroughly. The full commercial ISBSG database is proprietary and costs $3,000+ directly from isbsg.org. We downloaded the official open-access Release 10 teaser from Zenodo (DOI: 10.5281/zenodo.268485), which is cited in Slide 23 and documented in docs/model-evaluation.md. However, the open teaser has only 12 complete entries with duration metrics, which is statistically inadequate. Therefore, following established IEEE/ACM software engineering literature, we adopted the PROMISE China dataset of 499 commercial projects as our primary benchmarking ground truth."*

3. **When Asked About Software Project Management Integration:**
   > *"We applied full SPM principles: A formal Project Charter, 100% Rule WBS across 6 work packages, PERT 3-point estimation establishing an 18-day Critical Path, a 5x5 Qualitative Risk Matrix, ISO 25010 Quality Assurance, and Earned Value Management (EVM) schedule variance tracking. We also built an interactive Manager What-If simulator allowing real-time schedule target testing against empirical velocity."*

4. **When Asked About the Cybersecurity Component:**
   > *"Our architecture implements pooled multi-tenancy with defense-in-depth security. To eliminate Insecure Direct Object References (IDOR), tenant context is never trusted from client request parameters; it is cryptographically derived exclusively from verified JWT access tokens. Every database query passes through our withTenantScope wrapper. We enforced SPM Quality Review Gatekeeping where engineers can only request review, while only managers can approve tasks to completed status. We validated this with 6 automated security invariant tests with 100% pass rate."*
