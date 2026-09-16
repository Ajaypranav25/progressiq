import os
import io
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from PIL import Image

from .ml.config import (
    STATIC_DIR,
    EVIDENCE_DIR,
    SAMPLES_DIR,
    SEVERITY_CLASSES,
    SEVERITY_MAPPING,
    DEVICE,
    DEFAULT_MODEL_WEIGHTS_PATH,
)
from .ml.quality import check_image_quality
from .ml.inference import run_diagnostic_pipeline, get_model

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-loads the DR model weights during server boot to ensure instant first-request inference."""
    try:
        print("[Startup] Initializing and preloading DRClassifier model into memory...")
        model = get_model()
        print(f"[Startup] Model loaded successfully on device: {DEVICE}")
    except Exception as e:
        print(f"[Startup] Warning during model initialization: {e}")
    yield

# Initialize FastAPI Application
app = FastAPI(
    title="ProgressIQ — Core Diagnostic Intelligence ML API",
    description=(
        "Core ML inference service for Diabetic Retinopathy (DR) severity classification, "
        "model confidence estimation, fundus image quality assessment, and Grad-CAM evidence localization."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for evidence heatmaps and demo fundus samples
STATIC_DIR.mkdir(parents=True, exist_ok=True)
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

SUPPORTED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/octet-stream"
}


@app.get("/", tags=["General"])
def root():
    """Root status and API overview."""
    return {
        "service": "ProgressIQ Diagnostic Intelligence ML API",
        "disease": "Diabetic Retinopathy (DR)",
        "modality": "Retinal Fundus Photography",
        "status": "online",
        "documentation": "/docs",
        "endpoints": {
            "diagnose": "POST /api/diagnose",
            "quality_check": "POST /api/quality-check",
            "health": "GET /api/health",
            "samples": "GET /api/samples",
        },
        "disclaimer": "Research and hackathon demo prototype. Outputs are model predictions, not confirmed clinical diagnoses."
    }


@app.get("/api/health", tags=["Monitoring"])
def health_check():
    """Health check reporting device, model status, and supported severity classes."""
    model_loaded = get_model() is not None
    return {
        "status": "healthy",
        "model_loaded": model_loaded,
        "weights_path": str(DEFAULT_MODEL_WEIGHTS_PATH),
        "weights_exist": DEFAULT_MODEL_WEIGHTS_PATH.exists(),
        "device": str(DEVICE),
        "cuda_available": DEVICE.type == "cuda",
        "severity_classes": SEVERITY_CLASSES,
    }


@app.post("/api/diagnose", tags=["Diagnostic Inference"])
async def diagnose(
    file: UploadFile = File(..., description="Retinal fundus image (JPEG, PNG)"),
    patient_id: Optional[str] = Form(None, description="Optional Patient Identifier"),
    scan_id: Optional[str] = Form(None, description="Optional Scan Identifier"),
    generate_evidence: bool = Form(True, description="Whether to generate Grad-CAM visual evidence heatmap"),
):
    """
    Core Diagnostic Endpoint.
    Analyzes one retinal fundus image and returns DR severity, confidence, quality check, and Grad-CAM evidence URL.
    
    Target Contract:
    {
      "severity": "Moderate",
      "severity_index": 2,
      "confidence": 0.87,
      "quality": "acceptable",
      "evidence_url": "/static/evidence/..."
    }
    """
    if file.content_type and file.content_type not in SUPPORTED_IMAGE_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. Please upload a JPEG or PNG fundus image."
        )

    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes)."
            )

        # Run complete ML diagnostic pipeline
        result = run_diagnostic_pipeline(
            image_input=contents,
            generate_evidence=generate_evidence,
            patient_id=patient_id,
            scan_id=scan_id,
        )
        return result

    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing diagnostic inference: {str(e)}"
        )


@app.post("/api/quality-check", tags=["Image Processing"])
async def quality_check_endpoint(
    file: UploadFile = File(..., description="Retinal fundus image to inspect for quality and blur"),
):
    """
    Fast quality check for retinal fundus photographs.
    Evaluates resolution, blurriness (sharpness), and illumination exposure before full analysis.
    """
    try:
        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
        pil_image = Image.open(io.BytesIO(contents))
        quality_result = check_image_quality(pil_image)
        return quality_result

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image for quality check: {str(e)}")


@app.get("/api/samples", tags=["Demo Utilities"])
def list_sample_images():
    """
    Returns available demo fundus images across all 5 severity levels.
    Useful for frontend testing and one-click demo workflows.
    """
    samples = []
    sample_files = [
        ("sample_0_no_dr.jpg", 0, "No DR", "Clear retina with crisp optic disc, macula, and vessels"),
        ("sample_1_mild_dr.jpg", 1, "Mild", "Early microaneurysms detected"),
        ("sample_2_moderate_dr.jpg", 2, "Moderate", "Multiple microaneurysms, dot-blot hemorrhages, hard exudates"),
        ("sample_3_severe_dr.jpg", 3, "Severe", "Extensive 4-quadrant hemorrhages and cotton-wool spots"),
        ("sample_4_proliferative_dr.jpg", 4, "Proliferative DR", "Neovascularization and pre-retinal hemorrhage"),
    ]
    for filename, stage, label, desc in sample_files:
        filepath = SAMPLES_DIR / filename
        samples.append({
            "filename": filename,
            "severity_index": stage,
            "severity": label,
            "description": desc,
            "exists": filepath.exists(),
            "url": f"/static/samples/{filename}",
        })
    return {"samples": samples}
