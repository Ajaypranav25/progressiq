"""
ProgressIQ - Image Comparison & Processing API Router
Backend Developer 2 (Person 4)

Exposes POST /api/image-compare, image preprocessing, evidence generation,
and demo pair utilities for the clinical workstation.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
import cv2
import numpy as np

from backend.storage import default_storage, generate_synthetic_fundus
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
    compare_scans_and_evidence,
    create_side_by_side_comparison,
    compute_visual_difference_map,
    align_retinal_images,
)

router = APIRouter(prefix="/api", tags=["Image Processing & Comparison"])


# ---------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------

class ImageCompareRequest(BaseModel):
    previous_image_url: str = Field(..., description="URL or relative path to previous fundus scan")
    current_image_url: str = Field(..., description="URL or relative path to current fundus scan")
    previous_evidence_url: Optional[str] = Field(None, description="Optional URL to previous Grad-CAM evidence")
    current_evidence_url: Optional[str] = Field(None, description="Optional URL to current Grad-CAM evidence")
    previous_date: Optional[str] = Field("Previous Visit", description="Date or visit label for previous scan")
    current_date: Optional[str] = Field("Current Visit", description="Date or visit label for current scan")
    align: bool = Field(True, description="Attempt feature alignment before comparison")


class ComparisonMetadata(BaseModel):
    alignment_applied: bool
    alignment_status: str
    visual_difference_score: float
    visual_difference_percentage: float
    difference_detected: bool
    message: str
    clinical_notice: str = "Model-derived visual comparison. Results require clinical review."


class ImageCompareResponse(BaseModel):
    previous_image_url: str
    current_image_url: str
    previous_evidence_url: Optional[str] = None
    current_evidence_url: Optional[str] = None
    comparison_image_url: str
    evidence_comparison_url: Optional[str] = None
    difference_map_url: str
    metadata: ComparisonMetadata


class QualityAssessmentResponse(BaseModel):
    quality: str
    sharpness_score: float
    is_sharp: bool
    mean_luminance: float
    is_well_exposed: bool
    details: str


class PreprocessScanResponse(BaseModel):
    image_url: str
    enhanced_url: Optional[str] = None
    quality: QualityAssessmentResponse
    metadata: Dict[str, Any]


class EvidenceGenerateRequest(BaseModel):
    image_url: str
    heatmap_matrix: Optional[List[List[float]]] = None
    severity: Optional[str] = "Moderate"
    alpha: float = 0.42


class EvidenceGenerateResponse(BaseModel):
    image_url: str
    evidence_url: str
    side_by_side_url: str
    clinical_notice: str = "Model attention visualization. Not validated lesion segmentation."


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------

@router.post(
    "/image-compare",
    response_model=ImageCompareResponse,
    summary="Compare previous and current retinal scans and evidence",
)
def compare_images(payload: ImageCompareRequest):
    """
    Compares two retinal fundus scans (and optional evidence overlays).
    Produces side-by-side comparative views, visual difference mapping,
    and alignment metadata.
    """
    # Resolve image paths
    prev_path = default_storage.resolve_to_path(payload.previous_image_url)
    curr_path = default_storage.resolve_to_path(payload.current_image_url)

    if not prev_path or not prev_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Previous image not found: {payload.previous_image_url}",
        )
    if not curr_path or not curr_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Current image not found: {payload.current_image_url}",
        )

    # Validate and read images
    ok_prev, msg_prev, prev_bgr = validate_image(prev_path)
    ok_curr, msg_curr, curr_bgr = validate_image(curr_path)

    if not ok_prev or prev_bgr is None:
        raise HTTPException(status_code=400, detail=f"Invalid previous image: {msg_prev}")
    if not ok_curr or curr_bgr is None:
        raise HTTPException(status_code=400, detail=f"Invalid current image: {msg_curr}")

    # Standardize image sizes
    prev_std, _ = preprocess_fundus_image(prev_bgr, target_size=(512, 512))
    curr_std, _ = preprocess_fundus_image(curr_bgr, target_size=(512, 512))

    # Optional evidence images
    prev_evid_bgr = None
    curr_evid_bgr = None

    if payload.previous_evidence_url:
        p_evid_path = default_storage.resolve_to_path(payload.previous_evidence_url)
        if p_evid_path and p_evid_path.is_file():
            _, _, prev_evid_bgr = validate_image(p_evid_path)
            if prev_evid_bgr is not None:
                prev_evid_bgr, _ = preprocess_fundus_image(prev_evid_bgr, target_size=(512, 512))

    if payload.current_evidence_url:
        c_evid_path = default_storage.resolve_to_path(payload.current_evidence_url)
        if c_evid_path and c_evid_path.is_file():
            _, _, curr_evid_bgr = validate_image(c_evid_path)
            if curr_evid_bgr is not None:
                curr_evid_bgr, _ = preprocess_fundus_image(curr_evid_bgr, target_size=(512, 512))

    # Run comparison pipeline
    comp_results = compare_scans_and_evidence(
        prev_scan=prev_std,
        curr_scan=curr_std,
        prev_evidence=prev_evid_bgr,
        curr_evidence=curr_evid_bgr,
        prev_label="Previous Scan",
        curr_label="Current Scan",
        prev_date=payload.previous_date or "",
        curr_date=payload.current_date or "",
        try_alignment=payload.align,
    )

    # Save outputs to disk
    _, comp_url = default_storage.save_cv2_image(
        comp_results["scan_comparison"],
        filename_or_prefix="scan_comparison",
        category="comparisons",
    )
    _, diff_url = default_storage.save_cv2_image(
        comp_results["difference_map"],
        filename_or_prefix="difference_map",
        category="comparisons",
    )

    evid_comp_url = None
    if comp_results.get("evidence_comparison") is not None:
        _, evid_comp_url = default_storage.save_cv2_image(
            comp_results["evidence_comparison"],
            filename_or_prefix="evidence_comparison",
            category="comparisons",
        )

    # Prepare metadata
    diff_score = comp_results["difference_metrics"]["visual_difference_score"]
    diff_pct = comp_results["difference_metrics"]["visual_difference_percentage"]
    diff_detected = diff_score > 0.05

    message = (
        f"Visual difference detected between available scans ({diff_pct}% change)."
        if diff_detected
        else "Minimal visual difference observed between available scans."
    )

    metadata = ComparisonMetadata(
        alignment_applied=comp_results["alignment"]["alignment_applied"],
        alignment_status=comp_results["alignment"]["status"],
        visual_difference_score=diff_score,
        visual_difference_percentage=diff_pct,
        difference_detected=diff_detected,
        message=message,
        clinical_notice="Model-derived visual comparison. Results require clinical review.",
    )

    return ImageCompareResponse(
        previous_image_url=payload.previous_image_url,
        current_image_url=payload.current_image_url,
        previous_evidence_url=payload.previous_evidence_url,
        current_evidence_url=payload.current_evidence_url,
        comparison_image_url=comp_url,
        evidence_comparison_url=evid_comp_url,
        difference_map_url=diff_url,
        metadata=metadata,
    )


@router.post(
    "/image-compare/upload",
    response_model=ImageCompareResponse,
    summary="Upload two scans directly for immediate comparison",
)
async def compare_images_upload(
    previous_file: UploadFile = File(...),
    current_file: UploadFile = File(...),
    previous_date: str = Form("Previous Visit"),
    current_date: str = Form("Current Visit"),
    align: bool = Form(True),
):
    """
    Direct file upload variant for quick comparison testing without prior storage.
    """
    prev_bytes = await previous_file.read()
    curr_bytes = await current_file.read()

    # Save uploaded files into scans/
    _, prev_url = default_storage.save_bytes(
        prev_bytes, original_filename=previous_file.filename or "prev.jpg", category="scans", prefix="scan_prev"
    )
    _, curr_url = default_storage.save_bytes(
        curr_bytes, original_filename=current_file.filename or "curr.jpg", category="scans", prefix="scan_curr"
    )

    # Delegate to compare logic
    req = ImageCompareRequest(
        previous_image_url=prev_url,
        current_image_url=curr_url,
        previous_date=previous_date,
        current_date=current_date,
        align=align,
    )
    return compare_images(req)


@router.post(
    "/images/preprocess",
    response_model=PreprocessScanResponse,
    summary="Validate and preprocess an uploaded fundus scan",
)
async def preprocess_uploaded_scan(
    file: UploadFile = File(...),
    apply_clahe: bool = Form(False),
):
    """
    Validates, standardizes, evaluates quality, and saves an incoming fundus scan.
    Returns public URL and quality assessment.
    """
    file_bytes = await file.read()
    ok, err_msg, img_bgr = validate_image(file_bytes)
    if not ok or img_bgr is None:
        raise HTTPException(status_code=400, detail=f"Image validation failed: {err_msg}")

    # Assess quality
    quality_dict = assess_image_quality(img_bgr)

    # Preprocess standard size
    std_img, meta = preprocess_fundus_image(img_bgr, target_size=(512, 512), apply_clahe=False)
    _, scan_url = default_storage.save_cv2_image(std_img, filename_or_prefix="scan_std", category="scans")

    enhanced_url = None
    if apply_clahe:
        enhanced_img = apply_clahe_enhancement(std_img)
        _, enhanced_url = default_storage.save_cv2_image(
            enhanced_img, filename_or_prefix="scan_enhanced", category="scans"
        )

    return PreprocessScanResponse(
        image_url=scan_url,
        enhanced_url=enhanced_url,
        quality=QualityAssessmentResponse(**quality_dict),
        metadata=meta,
    )


@router.post(
    "/images/evidence",
    response_model=EvidenceGenerateResponse,
    summary="Generate and store Grad-CAM evidence overlay on a fundus scan",
)
def generate_evidence(payload: EvidenceGenerateRequest):
    """
    Accepts an existing scan image URL and either a 2D heatmap matrix
    (from Person 3 ML) or generates a synthetic evidence overlay.
    """
    img_path = default_storage.resolve_to_path(payload.image_url)
    if not img_path or not img_path.is_file():
        raise HTTPException(status_code=404, detail="Scan image not found")

    ok, _, img_bgr = validate_image(img_path)
    if not ok or img_bgr is None:
        raise HTTPException(status_code=400, detail="Unable to decode scan image")

    h, w = img_bgr.shape[:2]

    # Use supplied heatmap or synthetic
    if payload.heatmap_matrix:
        heatmap_arr = np.array(payload.heatmap_matrix, dtype=np.float32)
    else:
        heatmap_arr = generate_synthetic_heatmap(width=w, height=h, severity=payload.severity or "Moderate")

    # Create blended overlay
    overlay = create_gradcam_overlay(img_bgr, heatmap_arr, alpha=payload.alpha)
    _, evidence_url = default_storage.save_cv2_image(overlay, filename_or_prefix="evidence", category="evidence")

    # Create side-by-side evidence preview
    sbs = create_side_by_side_evidence(img_bgr, overlay)
    _, sbs_url = default_storage.save_cv2_image(sbs, filename_or_prefix="evidence_sbs", category="evidence")

    return EvidenceGenerateResponse(
        image_url=payload.image_url,
        evidence_url=evidence_url,
        side_by_side_url=sbs_url,
        clinical_notice="Model attention visualization. Not validated lesion segmentation.",
    )


@router.get(
    "/images/demo-pair",
    response_model=ImageCompareResponse,
    summary="Generate and retrieve a sample longitudinal comparison pair for immediate UI testing",
)
def get_demo_pair():
    """
    Creates high-fidelity synthetic demo scans representing a longitudinal progression:
    Visit 1 (January 2026, Moderate DR) vs Visit 2 (September 2026, Severe DR).
    Instantly returns complete comparison URLs and difference analysis.
    """
    # 1. Generate Visit 1 fundus (Moderate DR)
    v1_fundus = generate_synthetic_fundus(width=512, height=512, severity="Moderate", visit_label="Visit 1")
    v1_heatmap = generate_synthetic_heatmap(width=512, height=512, severity="Moderate", seed=42)
    v1_evidence = create_gradcam_overlay(v1_fundus, v1_heatmap, alpha=0.42)

    # 2. Generate Visit 2 fundus (Severe DR, additional exudates)
    v2_fundus = generate_synthetic_fundus(width=512, height=512, severity="Severe", visit_label="Visit 2")
    v2_heatmap = generate_synthetic_heatmap(width=512, height=512, severity="Severe", seed=126)
    v2_evidence = create_gradcam_overlay(v2_fundus, v2_heatmap, alpha=0.42)

    # 3. Save scans & evidence
    _, v1_scan_url = default_storage.save_cv2_image(v1_fundus, filename_or_prefix="demo_v1_moderate", category="scans")
    _, v1_evid_url = default_storage.save_cv2_image(v1_evidence, filename_or_prefix="demo_v1_evid", category="evidence")
    _, v2_scan_url = default_storage.save_cv2_image(v2_fundus, filename_or_prefix="demo_v2_severe", category="scans")
    _, v2_evid_url = default_storage.save_cv2_image(v2_evidence, filename_or_prefix="demo_v2_evid", category="evidence")

    # 4. Perform comparison
    req = ImageCompareRequest(
        previous_image_url=v1_scan_url,
        current_image_url=v2_scan_url,
        previous_evidence_url=v1_evid_url,
        current_evidence_url=v2_evid_url,
        previous_date="Jan 2026 (Moderate DR)",
        current_date="Sep 2026 (Severe DR)",
        align=True,
    )
    return compare_images(req)
