import pytest
from pathlib import Path
from PIL import Image
import numpy as np
from fastapi.testclient import TestClient

from backend.main import app
from backend.ml.config import SAMPLES_DIR, EVIDENCE_DIR, SEVERITY_CLASSES
from backend.ml.quality import check_image_quality
from backend.ml.model import load_dr_model, DRClassifier
from backend.ml.inference import run_diagnostic_pipeline, get_model

client = TestClient(app)

def test_health_endpoint():
    """Verify the health check endpoint reports online status and device."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["weights_exist"] is True
    assert len(data["severity_classes"]) == 5

def test_samples_endpoint():
    """Verify sample fundus images are listed."""
    response = client.get("/api/samples")
    assert response.status_code == 200
    data = response.json()
    assert "samples" in data
    assert len(data["samples"]) == 5

def test_quality_check_valid_image():
    """Test image quality analysis on standard sample image."""
    sample_path = SAMPLES_DIR / "sample_0_no_dr.jpg"
    assert sample_path.exists(), "Sample image should exist"
    img = Image.open(sample_path)
    result = check_image_quality(img)
    assert result["quality"] == "acceptable"
    assert result["quality_score"] > 0.7
    assert "blur_metric" in result["metrics"]

def test_quality_check_blurry_image():
    """Test image quality flags low-resolution/blurry images."""
    tiny_blurry = Image.new("RGB", (64, 64), color=(100, 100, 100))
    result = check_image_quality(tiny_blurry)
    assert result["quality"] == "poor"
    assert len(result["issues"]) > 0

def test_model_loading():
    """Test DRClassifier instance and target layer availability."""
    model = get_model()
    assert isinstance(model, DRClassifier)
    assert model.get_target_layer() is not None

@pytest.mark.parametrize("stage", [0, 1, 2, 3, 4])
def test_diagnostic_pipeline_inference(stage):
    """Test complete inference pipeline and Grad-CAM generation for each severity sample."""
    sample_files = {
        0: "sample_0_no_dr.jpg",
        1: "sample_1_mild_dr.jpg",
        2: "sample_2_moderate_dr.jpg",
        3: "sample_3_severe_dr.jpg",
        4: "sample_4_proliferative_dr.jpg",
    }
    sample_path = SAMPLES_DIR / sample_files[stage]
    assert sample_path.exists()
    
    result = run_diagnostic_pipeline(sample_path, generate_evidence=True)
    
    # Contract validation
    assert "severity" in result
    assert "severity_index" in result
    assert "confidence" in result
    assert "quality" in result
    assert "evidence_url" in result
    
    # Value checks
    assert result["severity"] in SEVERITY_CLASSES
    assert 0 <= result["severity_index"] <= 4
    assert 0.0 <= result["confidence"] <= 1.0
    assert result["quality"] in ["acceptable", "poor"]
    assert result["evidence_url"] is not None
    assert result["evidence_url"].startswith("/static/evidence/")

    # Check generated evidence file exists on disk
    evidence_filename = result["evidence_url"].split("/")[-1]
    evidence_disk_path = EVIDENCE_DIR / evidence_filename
    assert evidence_disk_path.exists(), f"Evidence file {evidence_disk_path} was not created"

def test_diagnose_api_post():
    """Verify POST /api/diagnose via FastAPI TestClient."""
    sample_path = SAMPLES_DIR / "sample_2_moderate_dr.jpg"
    with open(sample_path, "rb") as f:
        response = client.post(
            "/api/diagnose",
            files={"file": ("sample_2_moderate_dr.jpg", f, "image/jpeg")},
            data={"patient_id": "DEMO-001", "scan_id": "SCAN-2026-09"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["severity"] in SEVERITY_CLASSES
    assert 0 <= data["severity_index"] <= 4
    assert 0.0 <= data["confidence"] <= 1.0
    assert data["quality"] == "acceptable"
    assert data["evidence_url"].startswith("/static/evidence/")
    assert data["details"]["patient_id"] == "DEMO-001"

def test_quality_check_api_post():
    """Verify POST /api/quality-check via FastAPI TestClient."""
    sample_path = SAMPLES_DIR / "sample_0_no_dr.jpg"
    with open(sample_path, "rb") as f:
        response = client.post(
            "/api/quality-check",
            files={"file": ("sample_0_no_dr.jpg", f, "image/jpeg")}
        )
    assert response.status_code == 200
    data = response.json()
    assert "quality" in data
    assert "metrics" in data
