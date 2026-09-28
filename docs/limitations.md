# AI/ML Architectural Constraints & Project Limitations

**Project:** AI-Powered Multi-Tenant Task Management SaaS (PSA)  
**Component:** Python ML Service & Effort Estimation Subsystem  

---

## 1. Domain Shift & Historical Dataset Limitations

### 1.1 Dataset Provenance & Antiquity
* **The Desharnais Dataset (PROMISE Repository):** The core regression model was trained on the benchmark Desharnais dataset ($N=81$ projects). While canonical and extensively cited in academic software effort estimation literature, the dataset originates from commercial projects developed in the late 1980s and 1990s.
* **Technology Evolution:** Software development paradigms have evolved drastically since the collection of this dataset (shift from monolithic waterfall COBOL/4GL development toward modern agile, microservices, containerization, and automated CI/CD).
* **Sample Size ($N=81$):** With only 81 total observations (of which 4 required median imputation for missing team/manager experience), statistical power is inherently constrained. Outliers in extreme project sizes exert noticeable leverage on evaluation metrics.

---

## 2. Multi-Tenancy & Model Generalization Boundaries

### 2.1 Shared Global Model vs. Tenant-Specific Variance
* **Current Implementation (Tenant-Agnostic Global Model):** To strictly enforce security boundaries and protect tenant privacy, the Python ML microservice is intentionally decoupled and tenant-agnostic. It receives zero organization identifiers and applies the exact same pre-trained model weights across all tenants.
* **The Organizational Velocity Discrepancy:** In real-world enterprise environments, development velocity varies drastically across organizations due to differing tech stacks, automated testing maturity, developer skill levels, and architectural complexity. A task rated at 50 function points might take 16 hours in a high-velocity team but 60 hours in a heavily regulated enterprise.
* **Cold-Start Invariance:** New organizations immediately receive baseline predictions from day one, but these predictions do not yet reflect their unique organizational throughput.

---

## 3. Microservice Network Boundary & Reliability Trade-Offs

### 3.1 Synchronous vs. Asynchronous Inference
* **Current Pattern:** The Node.js backend invokes the ML service over internal HTTP (`POST /predict/task-duration`) during task creation/update.
* **Failure Mode & Resilience:** If the Python ML microservice becomes unavailable or experiences network latency:
  * The backend must employ defensive fault tolerance (timeouts, circuit breaking, or graceful fallback to user-specified manual estimates) so that a failure in the ML tier never halts primary task management operations.
* **Internal Security:** The ML service does not enforce tenant scoping itself; tenant isolation is strictly the responsibility of the Node.js backend prior to dispatching requests.

---

## 4. Future Roadmap & Proposed Mitigations

To transition this university prototype into an enterprise-grade commercial SaaS, the following evolutions are recommended:

1. **Continuous Per-Tenant Fine-Tuning (Transfer Learning):**
   * Maintain the global Desharnais/TAWOS model as a foundational prior.
   * Once a tenant accumulates $\ge 30$ completed tasks with recorded `actualDuration`, trigger an asynchronous fine-tuning worker that trains an organization-specific adapter or gradient booster, isolated in a dedicated tenant model registry.
2. **Online Learning & Closed-Loop Feedback:**
   * When users transition tasks to `Done`, log the variance between `estimatedDuration` and `actualDuration`. Use this feedback loop to calculate rolling organizational calibration factors.
3. **Queue-Decoupled Asynchronous Inference:**
   * Transition task prediction calls to an event-driven message queue (e.g., Redis Streams or BullMQ) to ensure 100% decoupling between CRUD operations and ML service liveness.
