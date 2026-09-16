# ProgressIQ — Diagnostic Intelligence with Longitudinal Context

**Universal Project Context & Source of Truth**

---

## 1. Project Overview
ProgressIQ is an AI-powered medical diagnostic intelligence system for **Diabetic Retinopathy (DR)** from **retinal fundus photography**, designed for clinicians and medical professionals.
It augments traditional single-scan AI by integrating longitudinal context:
> *"How does the current diagnostic evidence compare with this patient's previous evidence?"*

---

## 2. Core Product Pipeline
```
Fundus Image 
  → Image Quality Check 
  → DR Severity Classification (0-4) 
  → Confidence Score 
  → Evidence Localization (Grad-CAM) 
  → Previous + Current Diagnostic Evidence 
  → Longitudinal Analysis 
  → Diagnostic Trajectory Timeline 
  → Explainable Diagnostic Report
```

---

## 3. Severity Categories & Output
- **0 — No DR**
- **1 — Mild DR**
- **2 — Moderate DR**
- **3 — Severe DR**
- **4 — Proliferative DR**

Outputs: Predicted severity, severity index (0-4), model confidence (e.g. 87%), image quality, evidence visualization.
*Note: Hackathon prototype; outputs are model predictions requiring clinical review.*

---

## 4. Evidence Localization & Explainability
- Lightweight explainability (e.g., Grad-CAM / saliency / model attention).
- Non-clinical terminology: "Model evidence", "Model attention", "Evidence visualization".

---

## 5. Longitudinal Diagnostic Intelligence & Metrics
Compares previous scan/result/evidence vs. current scan/result/evidence.
**MVP Required:**
1. Severity change (e.g., Moderate -> Severe)
2. Direction of change (Increased, Stable, Decreased)
3. Longitudinal status message
4. Diagnostic trajectory timeline across visits
5. Side-by-side visual comparison (Previous vs Current)

*Progression Language Rule:* Only describe change between available past scans ("Progression detected between visits"). Never predict future patient outcomes.

---

## 6. System Architecture & API

- **Frontend**: React (clinical diagnostic workstation design, clean, information-dense, minimal)
- **Backend API**: FastAPI + SQLite
- **ML Layer**: PyTorch / Torchvision / ONNX DR classifier + Grad-CAM

### Key Endpoints:
- `POST /api/diagnose`: Fundus image → severity, severity_index, confidence, quality, evidence_url
- `GET /api/patients`: List patients
- `GET /api/patients/{patient_id}`: Patient profile
- `GET /api/patients/{patient_id}/scans`: Patient longitudinal scan history
- `POST /api/patients`: Create demo patient
- `POST /api/scans`: Store analyzed scan
- `POST /api/compare`: Compare previous vs. current diagnostic observation

---

## 7. 5-Person Team Structure
- **Person 1 (Frontend Lead)**: App shell, routing, navigation, patient workflow, API client layer.
- **Person 2 (Frontend Specialist)**: Diagnostic results, severity/confidence gauges, evidence viewer, comparison, trajectory timeline, report view.
- **Person 3 (Backend / ML)**: DR classification model, preprocessing, inference, confidence, Grad-CAM generator, `/api/diagnose`.
- **Person 4 (Backend / Image Processing)**: Image storage, evidence processing, visual comparison utilities.
- **Person 5 (Backend / Integration)**: SQLite models, database migrations/seed, longitudinal engine, API orchestration, `/api/compare`, `/api/patients`.
