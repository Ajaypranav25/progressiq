# ProgressIQ — Core ML Model & Diagnostic Inference Service
> **Diagnostic Intelligence with Longitudinal Context**  
> *Disease*: Diabetic Retinopathy (DR) | *Modality*: Retinal Fundus Photography | *Role*: Backend/ML Developer 1

---

## 1. Overview & Architecture

This service powers the core AI diagnostic layer of ProgressIQ. It accepts retinal fundus photographs, validates their quality, predicts Diabetic Retinopathy (DR) severity according to the international 5-stage scale (0–4), outputs model confidence, and generates visual evidence heatmaps via Grad-CAM.

```
       Retinal Fundus Image
                ↓
    Image Quality Assessment (Resolution, Blur, Exposure)
                ↓
    Preprocessing (Smart Resize & Normalization)
                ↓
    DR Severity Classification (5-Class ResNet-50)
                ↓
    Model Confidence & Probability Distribution
                ↓
    Grad-CAM Evidence Localization (Activation Heatmap Overlay)
                ↓
    JSON Diagnostic Response + Static Evidence Image (/static/evidence/...)
```

### Supported DR Severity Scale
| Severity Index | Category | Clinical Features |
|:---:|:---|:---|
| **0** | **No DR** | Clear retina, normal optic disc, crisp vessel arches, sharp fovea |
| **1** | **Mild** | Microaneurysms only |
| **2** | **Moderate** | Microaneurysms, dot-and-blot hemorrhages, hard exudates |
| **3** | **Severe** | Severe hemorrhages in 4 quadrants, venous beading, cotton-wool spots |
| **4** | **Proliferative DR** | Neovascularization (NV) and/or pre-retinal/vitreous hemorrhages |

---

## 2. Quick Start & Execution

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- PyTorch & Torchvision

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the FastAPI Service
```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive Swagger API documentation will be available at: **`http://localhost:8000/docs`**

### 3. Run Automated Tests
```bash
pytest backend/tests/test_ml.py -v
```

### 4. Run Developer Client Demo
```bash
python test_client.py
```

---

## 3. API Contract & Integration Specification

### Endpoint: `POST /api/diagnose`
Primary diagnostic inference endpoint.

- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file` (*required*): Fundus image file (`image/jpeg`, `image/png`, `image/webp`).
  - `patient_id` (*optional*): String identifier (e.g. `"DEMO-PATIENT-001"`).
  - `scan_id` (*optional*): String scan identifier (e.g. `"SCAN-2026-05"`).
  - `generate_evidence` (*optional*, default `true`): Boolean to toggle Grad-CAM evidence heatmap generation.

#### Example Request (cURL)
```bash
curl -X POST "http://localhost:8000/api/diagnose" \
  -F "file=@backend/static/samples/sample_2_moderate_dr.jpg" \
  -F "patient_id=DEMO-001" \
  -F "scan_id=SCAN-001"
```

#### Example Request (JavaScript / Fetch)
```javascript
const formData = new FormData();
formData.append('file', fundusFileInput.files[0]);
formData.append('patient_id', 'DEMO-001');

const response = await fetch('http://localhost:8000/api/diagnose', {
  method: 'POST',
  body: formData,
});
const data = await response.json();
console.log(data);
```

#### Example Response (JSON)
```json
{
  "severity": "Moderate",
  "severity_index": 2,
  "confidence": 0.9997,
  "quality": "acceptable",
  "evidence_url": "/static/evidence/evidence_18ed6cb6c220.jpg",
  "details": {
    "probabilities": {
      "No DR": 0.0001,
      "Mild": 0.0001,
      "Moderate": 0.9997,
      "Severe": 0.0001,
      "Proliferative DR": 0.0001
    },
    "quality_assessment": {
      "quality": "acceptable",
      "quality_score": 1.0,
      "issues": [],
      "metrics": {
        "width": 512,
        "height": 512,
        "blur_metric": 60.04,
        "mean_brightness": 56.24,
        "contrast": 44.07
      }
    },
    "latency_ms": 258.2,
    "device": "cpu",
    "patient_id": "DEMO-001",
    "scan_id": "SCAN-001"
  },
  "disclaimer": "Model-generated analysis for clinical research prototype. Requires clinical review."
}
```

---

### Endpoint: `POST /api/quality-check`
Rapid pre-check for fundus image quality, blur, and exposure before running inference.

#### Example Request (cURL)
```bash
curl -X POST "http://localhost:8000/api/quality-check" \
  -F "file=@my_scan.jpg"
```

#### Example Response
```json
{
  "quality": "poor",
  "quality_score": 0.4,
  "issues": [
    "Image appears blurry (sharpness metric: 18.4)",
    "Image is severely underexposed or dark"
  ],
  "metrics": {
    "width": 512,
    "height": 512,
    "blur_metric": 18.4,
    "mean_brightness": 12.1,
    "contrast": 11.2
  }
}
```

---

### Endpoint: `GET /api/samples`
Returns 5 pre-generated synthetic demo fundus images corresponding to each of the 5 severity stages for rapid frontend testing.

#### Response
```json
{
  "samples": [
    {
      "filename": "sample_0_no_dr.jpg",
      "severity_index": 0,
      "severity": "No DR",
      "description": "Clear retina with crisp optic disc, macula, and vessels",
      "exists": true,
      "url": "/static/samples/sample_0_no_dr.jpg"
    },
    ...
  ]
}
```

---

### Endpoint: `GET /api/health`
Monitors backend ML status, loaded weights, and device acceleration.

```json
{
  "status": "healthy",
  "model_loaded": true,
  "weights_path": ".../backend/ml/weights/dr_resnet50_weights.pt",
  "weights_exist": true,
  "device": "cpu",
  "cuda_available": false,
  "severity_classes": [
    "No DR",
    "Mild",
    "Moderate",
    "Severe",
    "Proliferative DR"
  ]
}
```

---

## 4. Team Integration Guide

### Person 1 & 2 (Frontend Lead & Visualization)
- **CORS**: Fully configured with `allow_origins=["*"]`.
- **Upload Flow**: Send image file directly to `POST /api/diagnose`.
- **Evidence Heatmap**: Display `http://localhost:8000` + `response.evidence_url`.
- **One-Click Demo Samples**: Fetch `GET /api/samples` to give users quick buttons to test different disease stages without needing external images.

### Person 4 (Image Processing)
- You can import `check_image_quality` from `backend.ml.quality`.
- Grad-CAM heatmap generator is reusable from `backend.ml.gradcam`.

### Person 5 (Longitudinal Integration & Database)
- You can directly import `run_diagnostic_pipeline` from `backend.ml.inference`:
  ```python
  from backend.ml.inference import run_diagnostic_pipeline
  result = run_diagnostic_pipeline(image_path_or_bytes)
  severity = result["severity"]
  severity_index = result["severity_index"]
  confidence = result["confidence"]
  ```

---

## 5. Medical Prototype Safety & Disclaimers

> [!WARNING]
> **Hackathon Prototype**: This system provides model-generated diagnostic evidence and visual attention localization for research and demonstration purposes. Outputs are probabilistic model predictions, **not** confirmed clinical diagnoses. Never present results as medical certainty or treatment advice. Always indicate: *"Model prediction — requires clinical review"*.
