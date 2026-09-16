# ProgressIQ — Image & Evidence Processing Layer
**Developer:** Backend Developer 2 (Person 4)  
**Downstream from:** Person 3 (Backend / ML)  
**Upstream to:** Person 5 (Backend / Integration), Person 1 (Frontend Lead), Person 2 (Frontend Visualizations)

---

## 1. Overview & Responsibilities

This layer handles:
1. **Image Storage Handling**: Persistent local storage for raw scans, Grad-CAM evidence maps, and comparison composites under `/media/...`.
2. **Evidence Image Handling**: Colormapping, blending, and formatting model-generated Grad-CAM heatmaps into clinical evidence images and side-by-side previews.
3. **Fundus Image Preprocessing**: Validation, standardized 512x512 resizing (letterboxed or direct), CLAHE contrast enhancement for retinal vessels/exudates, and automated blur/exposure screening.
4. **Longitudinal Comparison**: Side-by-side comparative views of previous vs. current scans and previous vs. current model evidence.
5. **Image Alignment**: Feature-based registration (ORB + RANSAC homography) with graceful fallback to unaligned mode if landmarks are insufficient.
6. **Visual Difference Mapping**: Normalized pixel and evidence difference calculation with heatmaps and difference scores.

---

## 2. Medical Safety & Terminology Compliance

In adherence with the **ProgressIQ Universal Project Context**:
- Outputs are **model-derived visual comparisons**, not clinically confirmed diagnoses.
- Never use phrases like:
  - ❌ *"Detected lesion growth"*
  - ❌ *"The patient's disease is progressing"*
- Always use approved terminology:
  - ✅ *"Visual difference detected between available scans"*
  - ✅ *"Model evidence regions differ between visits"*
  - ✅ *"Visual difference indicates model evidence discrepancy between scans. Results require clinical review."*

---

## 3. Integration Guide for Team Members

### For Person 3 (Backend / ML): How to Save Heatmaps & Evidence

When your model generates a 2D Grad-CAM heatmap array or tensor:

```python
import numpy as np
from backend.storage import default_storage
from backend.image_processing.evidence import create_gradcam_overlay, create_side_by_side_evidence

# 1. Base image as BGR numpy array or file path
# 2. heatmap as 2D numpy array (values 0.0 to 1.0 or 0 to 255)
overlay_bgr = create_gradcam_overlay(
    image_bgr=raw_fundus_bgr,
    heatmap=gradcam_heatmap_2d,
    alpha=0.42
)

# Save evidence overlay to /media/evidence/
_, evidence_url = default_storage.save_cv2_image(
    overlay_bgr,
    filename_or_prefix="gradcam",
    category="evidence"
)

# Optionally save side-by-side evidence
sbs_bgr = create_side_by_side_evidence(raw_fundus_bgr, overlay_bgr)
_, sbs_url = default_storage.save_cv2_image(sbs_bgr, "gradcam_sbs", "evidence")

# Return evidence_url in POST /api/diagnose response:
# {
#    "severity": "Moderate",
#    "severity_index": 2,
#    "confidence": 0.87,
#    "quality": "acceptable",
#    "evidence_url": evidence_url
# }
```

### For Person 5 (Backend / Integration & DB): Mounting & Invoking

#### Option A: Direct API Router Inclusion
In your main FastAPI application:
```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from backend.storage import MEDIA_ROOT, default_storage
from backend.routers.image_compare import router as image_compare_router

app = FastAPI()

# Mount media static directory
default_storage._ensure_directories()
app.mount("/media", StaticFiles(directory=str(MEDIA_ROOT)), name="media")

# Mount comparison and processing endpoints
app.include_router(image_compare_router)
```

#### Option B: Direct Python Function Call inside `/api/compare`
```python
from backend.storage import default_storage
from backend.image_processing import (
    validate_image,
    preprocess_fundus_image,
    compare_scans_and_evidence,
)

# Fetch previous and current scan paths from database
prev_path = default_storage.resolve_to_path(prev_scan_record.image_path)
curr_path = default_storage.resolve_to_path(curr_scan_record.image_path)

_, _, prev_bgr = validate_image(prev_path)
_, _, curr_bgr = validate_image(curr_path)

prev_std, _ = preprocess_fundus_image(prev_bgr)
curr_std, _ = preprocess_fundus_image(curr_bgr)

comp_result = compare_scans_and_evidence(
    prev_scan=prev_std,
    curr_scan=curr_std,
    prev_date=prev_scan_record.visit_date,
    curr_date=curr_scan_record.visit_date,
)

_, comparison_url = default_storage.save_cv2_image(
    comp_result["scan_comparison"],
    filename_or_prefix="comparison",
    category="comparisons"
)
_, diff_map_url = default_storage.save_cv2_image(
    comp_result["difference_map"],
    filename_or_prefix="diff_map",
    category="comparisons"
)
```

---

## 4. API Reference

### `POST /api/image-compare`
Compares previous and current diagnostic scans and evidence overlays.

#### Request Body
```json
{
  "previous_image_url": "/media/scans/demo_v1_moderate_e850b5557cae.jpg",
  "current_image_url": "/media/scans/demo_v2_severe_6b00bbdd109e.jpg",
  "previous_evidence_url": "/media/evidence/demo_v1_evid_29910d6e6ab0.jpg",
  "current_evidence_url": "/media/evidence/demo_v2_evid_f70ea9711652.jpg",
  "previous_date": "Jan 2026",
  "current_date": "Sep 2026",
  "align": true
}
```

#### Response Body
```json
{
  "previous_image_url": "/media/scans/demo_v1_moderate_e850b5557cae.jpg",
  "current_image_url": "/media/scans/demo_v2_severe_6b00bbdd109e.jpg",
  "previous_evidence_url": "/media/evidence/demo_v1_evid_29910d6e6ab0.jpg",
  "current_evidence_url": "/media/evidence/demo_v2_evid_f70ea9711652.jpg",
  "comparison_image_url": "/media/comparisons/scan_comparison_864e2d4d5464.jpg",
  "evidence_comparison_url": "/media/comparisons/evidence_comparison_35a6bb9cefe6.jpg",
  "difference_map_url": "/media/comparisons/difference_map_bb053bc13a4a.jpg",
  "metadata": {
    "alignment_applied": true,
    "alignment_status": "Feature registration successful via ORB landmarks.",
    "visual_difference_score": 0.1422,
    "visual_difference_percentage": 14.22,
    "difference_detected": true,
    "message": "Visual difference detected between available scans (14.22% change).",
    "clinical_notice": "Model-derived visual comparison. Results require clinical review."
  }
}
```

---

### `POST /api/image-compare/upload`
Multipart form upload to immediately compare two raw files without prior storage.
- Fields: `previous_file`, `current_file`, `previous_date`, `current_date`, `align`.

---

### `POST /api/images/preprocess`
Uploads and standardizes an image. Runs image quality screening.
- Fields: `file` (UploadFile), `apply_clahe` (bool).
- Returns `image_url`, `enhanced_url`, and `quality` metrics (`acceptable`, `suboptimal_blur`, or `suboptimal_exposure`).

---

### `POST /api/images/evidence`
Blends a Grad-CAM heatmap array onto an existing fundus scan.
- Payload: `image_url`, `heatmap_matrix` (optional), `severity` (optional), `alpha` (float).
- Returns `evidence_url` and `side_by_side_url`.

---

### `GET /api/images/demo-pair`
Convenience endpoint for frontend developers (Person 1 & 2):
- Generates high-fidelity synthetic Visit 1 (Moderate DR) and Visit 2 (Severe DR) fundus scans with Grad-CAM heatmaps.
- Instantly returns all comparison URLs and metadata so the UI comparison view can be built and demonstrated immediately.

---

## 5. Running the Service & Tests

### Start the Server
```bash
py -3.13 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger docs: `http://localhost:8000/docs`

### Run Test Suite
```bash
py -3.13 -m pytest tests/test_image_processing.py -v
```
All 12 unit and integration tests pass cleanly.
