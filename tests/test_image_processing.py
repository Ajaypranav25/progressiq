"""
Unit and Integration Tests for Image & Evidence Processing Layer
ProgressIQ - Backend Developer 2 (Person 4)
"""

import io
from pathlib import Path
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from backend.main import app
from backend.storage import StorageManager, default_storage, generate_synthetic_fundus
from backend.image_processing.preprocess import (
    validate_image,
    preprocess_fundus_image,
    assess_image_quality,
    apply_clahe_enhancement,
)
from backend.image_processing.evidence import (
    create_gradcam_overlay,
    create_side_by_side_evidence,
    generate_synthetic_heatmap,
)
from backend.image_processing.comparison import (
    align_retinal_images,
    compute_visual_difference_map,
    create_side_by_side_comparison,
    compare_scans_and_evidence,
)


@pytest.fixture
def test_client():
    return TestClient(app)


def test_storage_manager(tmp_path):
    """Verify storage creation, persistence, and URL generation."""
    storage = StorageManager(media_root=tmp_path / "media")
    raw_data = b"\xFF\xD8\xFF\xE0" + b"\x00" * 50  # Fake jpeg header bytes

    file_path, url = storage.save_bytes(raw_data, "scan.jpg", category="scans")
    assert file_path.exists()
    assert url.startswith("/media/scans/")

    resolved = storage.resolve_to_path(url)
    assert resolved is not None
    assert resolved.samefile(file_path)


def test_synthetic_fundus_generation():
    """Verify synthetic fundus generator creates valid 3-channel image."""
    img = generate_synthetic_fundus(width=256, height=256, severity="Moderate")
    assert img.shape == (256, 256, 3)
    assert img.dtype == np.uint8
    assert np.mean(img) > 10  # Non-empty


def test_image_validation():
    """Verify validation passes for valid images and fails for corrupt/undersized inputs."""
    valid_img = np.zeros((200, 200, 3), dtype=np.uint8)
    ok, msg, decoded = validate_image(valid_img)
    assert ok is True
    assert decoded is not None

    # Undersized image (<100px)
    tiny_img = np.zeros((50, 50, 3), dtype=np.uint8)
    ok_tiny, msg_tiny, _ = validate_image(tiny_img)
    assert ok_tiny is False
    assert "too small" in msg_tiny

    # Invalid bytes
    ok_bad, msg_bad, _ = validate_image(b"invalid_bytes_not_an_image")
    assert ok_bad is False


def test_image_quality_assessment():
    """Verify sharpness and exposure quality metrics."""
    # Sharp fundus
    fundus = generate_synthetic_fundus(width=256, height=256, severity="Moderate")
    res = assess_image_quality(fundus)
    assert "quality" in res
    assert "sharpness_score" in res
    assert res["quality"] in ["acceptable", "suboptimal_blur", "suboptimal_exposure"]


def test_preprocessing_and_clahe():
    """Verify standardized resizing and CLAHE enhancement."""
    fundus = generate_synthetic_fundus(width=300, height=200, severity="Mild")
    preprocessed, meta = preprocess_fundus_image(fundus, target_size=(512, 512), maintain_aspect_ratio=True)
    assert preprocessed.shape == (512, 512, 3)
    assert meta["processed_width"] == 512
    assert meta["processed_height"] == 512

    enhanced = apply_clahe_enhancement(preprocessed)
    assert enhanced.shape == preprocessed.shape


def test_gradcam_overlay_and_evidence():
    """Verify heatmap blending and side-by-side evidence visualization."""
    fundus = generate_synthetic_fundus(width=256, height=256, severity="Moderate")
    heatmap = generate_synthetic_heatmap(width=256, height=256, severity="Moderate")

    overlay = create_gradcam_overlay(fundus, heatmap, alpha=0.45)
    assert overlay.shape == fundus.shape
    assert overlay.dtype == np.uint8

    sbs = create_side_by_side_evidence(fundus, overlay)
    assert sbs.shape[0] > 512  # Includes headers
    assert sbs.shape[1] >= 512 * 2


def test_visual_difference_and_alignment():
    """Verify visual difference map calculation and alignment safety."""
    v1 = generate_synthetic_fundus(width=256, height=256, severity="Moderate")
    v2 = generate_synthetic_fundus(width=256, height=256, severity="Severe")

    # Alignment fallback should not crash
    aligned, applied, meta = align_retinal_images(v1, v2)
    assert aligned.shape == v1.shape
    assert isinstance(applied, bool)

    # Visual difference map
    diff_map, diff_score, diff_meta = compute_visual_difference_map(v1, v2)
    assert diff_map.shape == v1.shape
    assert 0.0 <= diff_score <= 1.0
    assert "visual_difference_percentage" in diff_meta


def test_api_health(test_client):
    """Verify /api/health endpoint."""
    resp = test_client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"


def test_api_demo_pair(test_client):
    """Verify /api/images/demo-pair endpoint returns complete comparison data."""
    resp = test_client.get("/api/images/demo-pair")
    assert resp.status_code == 200
    data = resp.json()
    assert "previous_image_url" in data
    assert "current_image_url" in data
    assert "comparison_image_url" in data
    assert "difference_map_url" in data
    assert "metadata" in data
    assert "visual_difference_score" in data["metadata"]
    assert "clinical_notice" in data["metadata"]


def test_api_image_compare(test_client):
    """Verify POST /api/image-compare with existing stored scans."""
    # Generate two files directly in storage
    v1 = generate_synthetic_fundus(width=256, height=256, severity="Mild")
    v2 = generate_synthetic_fundus(width=256, height=256, severity="Moderate")

    _, url1 = default_storage.save_cv2_image(v1, "test_v1", "scans")
    _, url2 = default_storage.save_cv2_image(v2, "test_v2", "scans")

    payload = {
        "previous_image_url": url1,
        "current_image_url": url2,
        "previous_date": "Visit 1",
        "current_date": "Visit 2",
        "align": True,
    }

    resp = test_client.post("/api/image-compare", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["comparison_image_url"].startswith("/media/comparisons/")
    assert data["difference_map_url"].startswith("/media/comparisons/")
    assert "metadata" in data


def test_api_preprocess_upload(test_client):
    """Verify POST /api/images/preprocess multipart upload."""
    fundus = generate_synthetic_fundus(width=256, height=256, severity="Moderate")
    is_success, buffer = cv2.imencode(".jpg", fundus)
    assert is_success

    files = {"file": ("test_scan.jpg", buffer.tobytes(), "image/jpeg")}
    resp = test_client.post("/api/images/preprocess", files=files, data={"apply_clahe": "true"})
    assert resp.status_code == 200
    data = resp.json()
    assert "image_url" in data
    assert "enhanced_url" in data
    assert data["quality"]["quality"] in ["acceptable", "suboptimal_blur", "suboptimal_exposure"]


def test_api_evidence_generation(test_client):
    """Verify POST /api/images/evidence endpoint."""
    fundus = generate_synthetic_fundus(width=256, height=256, severity="Moderate")
    _, scan_url = default_storage.save_cv2_image(fundus, "test_evid_scan", "scans")

    payload = {
        "image_url": scan_url,
        "severity": "Moderate",
        "alpha": 0.45,
    }
    resp = test_client.post("/api/images/evidence", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "evidence_url" in data
    assert "side_by_side_url" in data
    assert "clinical_notice" in data

