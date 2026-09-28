# Work Breakdown Structure (WBS) & Dictionary: PSA Task Manager

**Project:** Multi-Tenant Task Management SaaS with Integrated ML Prediction  
**Document Version:** 1.0.0  
**Methodology:** Hybrid Agile-Engineering Breakdown  
**Status:** Approved Baseline  

---

## 1. WBS Tree Diagram (100% Rule Decomposition)

```text
1.0 PSA Task Management SaaS Platform
├── 2.0 AI/ML Subsystem & Data Engineering
│   ├── 2.1 Dataset Acquisition & Data Hygiene
│   │   ├── 2.1.1 Desharnais ARFF Ingestion & Parsing
│   │   ├── 2.1.2 Missing Value Imputation (Median Experience)
│   │   └── 2.1.3 Continuous Feature Scaling & Categorical Encoding
│   ├── 2.2 Exploratory Data Analysis (EDA) & Visualization
│   │   ├── 2.2.1 Effort Distribution Analysis & Skewness Profiling
│   │   ├── 2.2.2 Pearson Correlation Matrix Heatmaps
│   │   └── 2.2.3 Functional Point vs. Effort Regression Visualizations
│   ├── 2.3 Model Exploration, Training & Benchmark Validation
│   │   ├── 2.3.1 Baseline Linear Regression Formulation
│   │   ├── 2.3.2 Non-Linear DecisionTreeRegressor Fitting
│   │   ├── 2.3.3 Ensemble RandomForestRegressor Tuning
│   │   └── 2.3.4 Domain Metric Evaluation (MAE, RMSE, MdMRE, PRED25)
│   └── 2.4 Model Persistence & Serialized Pipeline Export
│       ├── 2.4.1 Fitted Scaler & Preprocessor Serialization (.joblib)
│       └── 2.4.2 Champion Model Export (.joblib)
├── 3.0 Machine Learning Microservice (FastAPI)
│   ├── 3.1 Service Framework & Application Bootstrap
│   │   ├── 3.1.1 FastAPI App Setup & Lifespan Artifact Loading
│   │   └── 3.1.2 Public Health Check Endpoint (GET /health)
│   ├── 3.2 Security & Authentication
│   │   └── 3.2.1 Internal Token Gatekeeping Middleware (X-Internal-Token)
│   ├── 3.3 Inference Engine
│   │   ├── 3.3.1 Pydantic Request/Response Schema Validation
│   │   └── 3.3.2 Online Task Duration Predictor (POST /predict/task-duration)
│   └── 3.4 Probabilistic Forecasting Engine
│       ├── 3.4.1 Vectorized Monte Carlo Core (10,000 Iterations via NumPy)
│       └── 3.4.2 Completion Percentile Calculator (50th, 85th, 95th Percentiles)
├── 4.0 Backend API Tier & Multi-Tenant Core (Node.js Express)
│   ├── 4.1 Architecture & Database Infrastructure
│   │   ├── 4.1.1 Express ESM Server Bootstrap
│   │   ├── 4.1.2 Mongoose Schema Definitions (Tenant-Aware)
│   │   └── 4.1.3 Compound Multi-Tenant Indexing Strategy
│   ├── 4.2 Security, Authentication & Isolation Middleware
│   │   ├── 4.2.1 JWT Access & Refresh Token Service
│   │   ├── 4.2.2 Defense-in-Depth Tenant Scoping Middleware (tenantScope.js)
│   │   ├── 4.2.3 Programmatic Query Scoping Helper (withTenantScope)
│   │   ├── 4.2.4 Role-Based Access Control Middleware (rbac.js)
│   │   └── 4.2.5 Security Hardening (Helmet, Rate Limiter, Mongo Sanitize)
│   ├── 4.3 Business Logic Controllers & Routing
│   │   ├── 4.3.1 Auth Controller (Register, Login, Refresh, Logout)
│   │   ├── 4.3.2 Organization & Team Controllers
│   │   ├── 4.3.3 Project Controller (CRUD + Forecast Aggregation)
│   │   ├── 4.3.4 Task Controller (Kanban Transitions + Live ML Inference)
│   │   └── 4.3.5 Audit & SuperAdmin Governance Controllers
│   └── 4.4 Internal Service Communication Client
│       ├── 4.4.1 Axios Client with Header Injection (mlServiceClient.js)
│       ├── 4.4.2 Feature Sanitization & Missing Data Imputation
│       └── 4.4.3 Graceful Fallback Heuristic on Service Timeout
├── 5.0 Frontend Client Application (Next.js & Tailwind CSS)
│   ├── 5.1 Architecture, Styling & State
│   │   ├── 5.1.1 Next.js App Router Structure & Layouts
│   │   ├── 5.1.2 Tailwind CSS Dark/Zinc Enterprise Theme
│   │   └── 5.1.3 Centralized AuthContext & Axios Interceptor
│   ├── 5.2 Common & Shared Component Library
│   │   ├── 5.2.1 Navbar with Active Tenant Badge & Switcher
│   │   ├── 5.2.2 Sidebar Navigation with Role-Aware Route Filtering
│   │   └── 5.2.3 Reusable UI Primitives (Badges, StatCards, Modals)
│   ├── 5.3 Tenant Application Views
│   │   ├── 5.3.1 Authentication Views (Login, Self-Service Register)
│   │   ├── 5.3.2 Tenant Overview Dashboard (KPI Cards & Recent Work)
│   │   ├── 5.3.3 Project Board & Interactive Kanban Lane View
│   │   ├── 5.3.4 Task Creation/Edit Modal with Live ML Duration Preview
│   │   ├── 5.3.5 Project Forecast View (Interactive Monte Carlo Distributions)
│   │   ├── 5.3.6 Team & Member Management Interface
│   │   └── 5.3.7 Tenant Audit Trail Viewer
│   └── 5.4 SuperAdmin Fleet Management Views
│       ├── 5.4.1 Platform Overview & Fleet Statistics
│       ├── 5.4.2 Tenant Management & Status Toggle (Active/Suspended)
│       └── 5.4.3 Audited Cross-Tenant Inspection Interface
├── 6.0 Quality Assurance, Verification & Documentation
│   ├── 6.1 Automated Testing Suites
│   │   ├── 6.1.1 Pytest Suite for ML Microservice (8 Test Cases)
│   │   ├── 6.1.2 Jest Backend Integration Suite (Auth, RBAC, ML Client)
│   │   └── 6.1.3 Jest Security & Tenant Isolation Invariant Suite (6 Invariants)
│   └── 6.2 Project Management & Academic Deliverables (/docs)
│       ├── 6.2.1 Project Charter (docs/project-charter.md)
│       ├── 6.2.2 System Requirements Specification (docs/requirements.md)
│       ├── 6.2.3 Work Breakdown Structure & Dictionary (docs/wbs.md)
│       ├── 6.2.4 Schedule & Critical Path Analysis (docs/schedule.md)
│       ├── 6.2.5 Cybersecurity Risk Register (docs/risk-register.md)
│       ├── 6.2.6 Quality Assurance Plan (docs/quality-plan.md)
│       ├── 6.2.7 Model Evaluation Report (docs/model-evaluation.md)
│       └── 6.2.8 Architectural Constraints & Limitations (docs/limitations.md)
```

---

## 2. WBS Dictionary & Component Details

### Work Package 2.0: AI/ML Subsystem & Data Engineering
* **Objective:** Ingest the benchmark Desharnais dataset, clean incomplete features, evaluate competing regression models on domain-specific metrics, and persist the champion model artifacts.
* **Deliverables:** `ml-service/data/desharnais.csv`, `ml-service/scripts/preprocess.py`, `ml-service/models/duration_model.joblib`, `ml-service/models/preprocessor.joblib`.
* **Owner:** Lead AI/ML Specialist.

### Work Package 3.0: Machine Learning Microservice (FastAPI)
* **Objective:** Expose the trained model and vectorized Monte Carlo simulation via a secure, tenant-agnostic REST microservice.
* **Deliverables:** `ml-service/app/main.py`, `ml-service/app/services/predictor.py`, `ml-service/app/services/monte_carlo.py`, `ml-service/tests/test_ml_service.py`.
* **Owner:** Backend & ML Systems Engineer.

### Work Package 4.0: Backend API Tier & Multi-Tenant Core (Node.js Express)
* **Objective:** Construct the multi-tenant data layer, enforce strict data isolation and IDOR prevention, manage user authentication/authorization, and orchestrate ML communication.
* **Deliverables:** `server/app.js`, `server/models/*`, `server/middleware/tenantScope.js`, `server/controllers/*`, `server/services/mlServiceClient.js`.
* **Owner:** Senior Full-Stack / Security Engineer.

### Work Package 5.0: Frontend Client Application (Next.js & Tailwind CSS)
* **Objective:** Deliver an enterprise-grade, responsive user interface supporting tenant-aware dashboards, interactive Kanban task management, live ML effort feedback, and SuperAdmin fleet management.
* **Deliverables:** `client/app/*`, `client/components/*`, `client/context/AuthContext.js`.
* **Owner:** Frontend UI/UX Engineer.

### Work Package 6.0: Quality Assurance, Verification & Documentation
* **Objective:** Implement comprehensive automated test suites verifying all security and functional requirements, and produce complete project management documentation in accordance with assessment criteria.
* **Deliverables:** `tests/*.test.js`, `ml-service/tests/*.py`, `/docs/*.md`.
* **Owner:** QA Engineer, Lead Architect & Security Lead.
