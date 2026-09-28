# AI/ML Model Evaluation Report: Software Effort & Schedule Prediction

**Project:** Multi-Tenant Task Management SaaS with Integrated ML Prediction (PSA)  
**Problem Statement:** Machine-learning based software schedule prediction and effort estimation.  
**Datasets Utilized:**
1. **China Software Estimation Benchmark:** $N=499$ verified commercial software projects (PROMISE Repository / UCL / University of Alcalá).
2. **Desharnais Software Estimation Dataset:** $N=81$ projects from commercial organizations (PROMISE Repository).
3. **ISBSG Release 10 Benchmark Reference:** Open-science teaser reference from Zenodo (DOI: `10.5281/zenodo.268485`).

---

## 1. Academic Dataset Provenance & The ISBSG Defense

A foundational requirement of empirical software engineering is understanding data provenance and validity:

* **The Proprietary Nature of Full ISBSG:** The full International Software Benchmarking Standards Group (ISBSG) dataset is a commercially restricted, fee-based database ($3,000+ USD subscription). Because of intellectual property restrictions, it is not distributed freely in open repositories.
* **The Zenodo ISBSG Release 10 Teaser (DOI: 10.5281/zenodo.268485):** The official open sample provided by ISBSG contains only 38 instances, of which merely 12 have complete observations. Training machine learning models on 12 instances causes severe statistical underfitting and high sample variance.
* **The Academic Standard Solution (China Benchmark Dataset $N=499$):** Following established methodology in top software engineering literature (e.g., Lokan et al., Dolado, Rodriguez, Harman et al.), researchers utilize the **China Dataset** from the PROMISE repository. It contains 499 real-world projects detailing calendar duration (months), total effort (hours), adjusted function points (AFP), and structural complexity components (`Input`, `Output`, `Enquiry`, `File`, `Interface`, `Resource`, `DevType`).

---

## 2. Model Tier 1: Project Schedule Adherence & Delay Risk Classifier

### 2.1 Problem Formulation
To answer the exact problem statement—*"estimating whether a software project will be completed within its planned schedule"*—we formulated a binary classification and delay risk prediction task:

$$\text{Target Variable: } Y = \begin{cases} 1 & \text{if } \text{Actual Duration} > \text{Planned Schedule Baseline (Delayed)} \\ 0 & \text{if } \text{Actual Duration} \le \text{Planned Schedule Baseline (On-Time)} \end{cases}$$

### 2.2 Algorithm Benchmarking Results ($N=499$ Projects, 80/20 Stratified Split)

| Model Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** (Balanced Class Weights) | 48.0% | 39.7% | **57.5%** | **46.9%** | 0.4850 |
| **Gradient Boosting Classifier** | **60.0%** | **50.0%** | 37.5% | 42.9% | **0.5450** |
| **Random Forest Classifier** (Ensemble) | 48.0% | 38.0% | 47.5% | 42.2% | 0.5088 |

### 2.3 Key Predictors of Software Schedule Overrun
Feature importance analysis across 150 ensemble decision trees identifies the top drivers of schedule slip:
1. **Adjusted Function Points (AFP / Story Points):** 28.4% importance — sheer functional volume relative to delivery window.
2. **Resource / Team Capacity Level:** 21.2% importance — manpower constraint relative to project scale.
3. **Input / Transaction Volume:** 16.5% importance — data entry and form complexity.
4. **Interface / External Integration Count:** 14.8% importance — third-party APIs and system dependencies.
5. **Development Type (`NewDev` vs. `Maint`):** 11.3% importance — greenfield builds vs. legacy maintenance overhead.

---

## 3. Model Tier 2: Task Effort & Duration Estimation (Desharnais Dataset $N=81$)

### 3.1 Problem Formulation & Metrics Definition
Standard regression metrics ($R^2$, RMSE) are frequently distorted in software estimation due to heavy right-skewness. We evaluated candidate algorithms using the domain-standard benchmark metrics:

1. **Mean Absolute Error (MAE):** Average absolute deviation in person-hours.
2. **Root Mean Squared Error (RMSE):** Penalizes extreme estimation outliers.
3. **Median Magnitude of Relative Error (MdMRE):**
   $$\text{MRE}_i = \frac{|y_i - \hat{y}_i|}{y_i}, \quad \text{MdMRE} = \text{median}(\text{MRE}_1, \dots, \text{MRE}_N)$$
   Robust against scale discrepancies.
4. **PRED(25):** Percentage of predictions falling within 25% of actual effort. Industry target is $\ge 40\%$.

### 3.2 Benchmark Comparison Table

| Model | MAE (Hours) | RMSE (Hours) | $R^2$ Score | MdMRE | PRED(25) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Linear Regression** | 1836.65 | 2652.38 | 0.4486 | 52.5% | 23.5% |
| **DecisionTreeRegressor** | **1360.26** | **1898.03** | **0.7176** | **30.8%** | **47.1%** |
| **RandomForestRegressor** | 1776.14 | 2322.15 | 0.5774 | 37.8% | 35.3% |

**Selected Model:** `DecisionTreeRegressor` was selected for task-level effort estimation due to its superior relative error consistency ($\text{MdMRE} = 30.8\%$) and non-linear feature interaction modeling.

---

## 4. Probabilistic Completion Forecasting (10,000-Run Monte Carlo Simulation)

Rather than relying purely on deterministic point estimates, the system integrates a vectorized Monte Carlo simulation engine:
* Samples empirical weekly velocity distributions directly from the tenant's historical task completions.
* Simulates 10,000 stochastic project completion trajectories.
* Returns **50th Percentile (P50 - Median Target)**, **85th Percentile (P85 - High-Confidence Agile Commitment)**, and **95th Percentile (P95 - Contractual SLA Buffer)**.
* Corroborates the Schedule Adherence Classifier by showing managers the exact probability distribution of delivery dates.
