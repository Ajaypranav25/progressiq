"""
ProgressIQ - Longitudinal Image Comparison and Alignment Layer
Backend Developer 2 (Person 4)

Provides side-by-side visual composites, optional OpenCV-based retinal feature alignment
with fail-safe fallback, visual difference mapping, and clinical presentation formatting.
"""

from typing import Any, Dict, Optional, Tuple
import cv2
import numpy as np


def align_retinal_images(
    reference_img: np.ndarray,
    moving_img: np.ndarray,
    max_features: int = 800,
) -> Tuple[np.ndarray, bool, Dict[str, Any]]:
    """
    Attempts feature-based registration to align moving_img (e.g. current scan)
    to reference_img (previous scan) using ORB and Homography with RANSAC.

    Gracefully falls back to unaligned view if landmark matching is insufficient,
    preventing any pipeline disruption or distorted warping.

    Returns:
        (aligned_or_original_moving_img, alignment_applied, alignment_metadata)
    """
    h_ref, w_ref = reference_img.shape[:2]
    # Resize moving image to match reference dimensions first
    moving_resized = cv2.resize(moving_img, (w_ref, h_ref), interpolation=cv2.INTER_AREA)

    gray_ref = cv2.cvtColor(reference_img, cv2.COLOR_BGR2GRAY)
    gray_moving = cv2.cvtColor(moving_resized, cv2.COLOR_BGR2GRAY)

    # Use ORB feature detector
    orb = cv2.ORB_create(nfeatures=max_features)
    kp_ref, des_ref = orb.detectAndCompute(gray_ref, None)
    kp_moving, des_moving = orb.detectAndCompute(gray_moving, None)

    if des_ref is None or des_moving is None or len(kp_ref) < 15 or len(kp_moving) < 15:
        return moving_resized, False, {
            "alignment_applied": False,
            "status": "Fallback: Insufficient retinal feature keypoints detected.",
            "match_count": 0,
        }

    # Match features using BFMatcher with Hamming distance
    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = matcher.match(des_moving, des_ref)
    matches = sorted(matches, key=lambda x: x.distance)

    # Filter good matches
    good_matches = [m for m in matches if m.distance < 55.0]

    if len(good_matches) < 10:
        return moving_resized, False, {
            "alignment_applied": False,
            "status": f"Fallback: Insufficient strong feature matches ({len(good_matches)} < 10).",
            "match_count": len(good_matches),
        }

    pts_moving = np.zeros((len(good_matches), 2), dtype=np.float32)
    pts_ref = np.zeros((len(good_matches), 2), dtype=np.float32)

    for i, match in enumerate(good_matches):
        pts_moving[i, :] = kp_moving[match.queryIdx].pt
        pts_ref[i, :] = kp_ref[match.trainIdx].pt

    # Find homography with RANSAC
    homography, inliers = cv2.findHomography(pts_moving, pts_ref, cv2.RANSAC, 5.0)

    if homography is None:
        return moving_resized, False, {
            "alignment_applied": False,
            "status": "Fallback: Homography computation did not converge.",
            "match_count": len(good_matches),
        }

    # Sanity check transformation matrix: determinant and scale should be realistic (0.7 to 1.4)
    det = np.linalg.det(homography[:2, :2])
    if det < 0.6 or det > 1.6:
        return moving_resized, False, {
            "alignment_applied": False,
            "status": f"Fallback: Estimated transformation scale ({det:.2f}) exceeds anatomical bounds.",
            "match_count": len(good_matches),
        }

    # Warp moving image to aligned perspective
    aligned = cv2.warpPerspective(
        moving_resized,
        homography,
        (w_ref, h_ref),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0),
    )

    inlier_count = int(np.sum(inliers)) if inliers is not None else len(good_matches)
    return aligned, True, {
        "alignment_applied": True,
        "status": "Feature registration successful via ORB landmarks.",
        "match_count": len(good_matches),
        "inlier_count": inlier_count,
    }


def compute_visual_difference_map(
    reference_bgr: np.ndarray,
    target_bgr: np.ndarray,
    threshold: float = 28.0,
) -> Tuple[np.ndarray, float, Dict[str, Any]]:
    """
    Computes visual difference between two registered or standardized retinal scans.

    Returns:
        (difference_overlay_bgr, visual_difference_score, metadata)

    Notice: Terminology is strictly 'visual difference' and 'model evidence difference'.
    Never claimed as clinically confirmed lesion growth.
    """
    h_ref, w_ref = reference_bgr.shape[:2]
    target_resized = cv2.resize(target_bgr, (w_ref, h_ref), interpolation=cv2.INTER_AREA)

    gray_ref = cv2.cvtColor(reference_bgr, cv2.COLOR_BGR2GRAY)
    gray_target = cv2.cvtColor(target_resized, cv2.COLOR_BGR2GRAY)

    # Smooth high-frequency camera noise
    blur_ref = cv2.GaussianBlur(gray_ref, (5, 5), 0)
    blur_target = cv2.GaussianBlur(gray_target, (5, 5), 0)

    # Compute absolute pixel difference
    abs_diff = cv2.absdiff(blur_ref, blur_target)

    # Retinal field mask (ignore outside black borders)
    fundus_mask = (gray_ref > 15) & (gray_target > 15)
    total_fundus_pixels = int(np.sum(fundus_mask))

    if total_fundus_pixels == 0:
        total_fundus_pixels = h_ref * w_ref
        fundus_mask = np.ones((h_ref, w_ref), dtype=bool)

    # Difference mask above threshold
    diff_mask = (abs_diff > threshold) & fundus_mask
    diff_pixels = int(np.sum(diff_mask))

    # Normalized visual difference score (0.0 to 1.0)
    diff_score = float(diff_pixels / total_fundus_pixels)

    # Create visual heatmap overlay on dimmed current scan
    dimmed_target = (target_resized * 0.55).astype(np.uint8)

    # Normalize diff for color map
    diff_norm = np.zeros_like(abs_diff, dtype=np.float32)
    diff_norm[fundus_mask] = abs_diff[fundus_mask] / 255.0
    diff_norm = np.clip(diff_norm * 2.2, 0.0, 1.0)  # Enhance visual contrast of changes

    heatmap_uint8 = (diff_norm * 255.0).astype(np.uint8)
    diff_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_HOT)

    # Blend difference where noticeable
    overlay = dimmed_target.copy()
    overlay_mask = (diff_norm > (threshold / 255.0)) & fundus_mask
    overlay[overlay_mask] = cv2.addWeighted(
        dimmed_target[overlay_mask], 0.35, diff_color[overlay_mask], 0.65, 0
    )

    metadata = {
        "visual_difference_score": round(diff_score, 4),
        "visual_difference_percentage": round(diff_score * 100, 2),
        "difference_pixels": diff_pixels,
        "fundus_pixels": total_fundus_pixels,
        "disclaimer": "Model-derived visual difference between available images. Requires clinical review.",
    }

    return overlay, diff_score, metadata


def create_side_by_side_comparison(
    previous_bgr: np.ndarray,
    current_bgr: np.ndarray,
    prev_title: str = "Previous Scan",
    curr_title: str = "Current Scan",
    prev_date: str = "",
    curr_date: str = "",
    banner_text: Optional[str] = None,
    target_height: int = 512,
) -> np.ndarray:
    """
    Creates a clinical-grade longitudinal comparison composite image.
    Features dark slate styling, crisp borders, dates, and optional status banner.
    """
    h_prev, w_prev = previous_bgr.shape[:2]
    h_curr, w_curr = current_bgr.shape[:2]

    w1 = int(w_prev * (target_height / h_prev))
    w2 = int(w_curr * (target_height / h_curr))

    img1 = cv2.resize(previous_bgr, (w1, target_height), interpolation=cv2.INTER_AREA)
    img2 = cv2.resize(current_bgr, (w2, target_height), interpolation=cv2.INTER_AREA)

    header_h = 75
    banner_h = 32 if banner_text else 0
    border_gap = 12
    footer_h = 28

    total_w = w1 + w2 + border_gap
    total_h = target_height + header_h + banner_h + footer_h

    # Slate clinical canvas
    canvas = np.full((total_h, total_w, 3), (22, 26, 30), dtype=np.uint8)

    # Optional status banner at top
    if banner_text:
        cv2.rectangle(canvas, (0, 0), (total_w, banner_h), (35, 45, 55), -1)
        cv2.putText(
            canvas,
            banner_text.upper(),
            (20, banner_h - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (240, 200, 80),
            1,
            cv2.LINE_AA,
        )

    y_header = banner_h
    # Draw headers
    font = cv2.FONT_HERSHEY_SIMPLEX
    p_header = f"{prev_title}  ({prev_date})" if prev_date else prev_title
    c_header = f"{curr_title}  ({curr_date})" if curr_date else curr_title

    cv2.putText(canvas, p_header, (20, y_header + 42), font, 0.72, (200, 210, 220), 2, cv2.LINE_AA)
    cv2.putText(canvas, c_header, (w1 + border_gap + 20, y_header + 42), font, 0.72, (100, 210, 255), 2, cv2.LINE_AA)

    # Place images
    y_img = y_header + header_h
    canvas[y_img : y_img + target_height, 0:w1] = img1
    canvas[y_img : y_img + target_height, w1 + border_gap : w1 + border_gap + w2] = img2

    # Vertical divider line
    canvas[y_img : y_img + target_height, w1 : w1 + border_gap] = (40, 48, 56)

    # Footer note
    y_footer = y_img + target_height
    cv2.putText(
        canvas,
        "Longitudinal Comparative View - ProgressIQ Diagnostic Workstation",
        (20, y_footer + 18),
        font,
        0.42,
        (130, 140, 150),
        1,
        cv2.LINE_AA,
    )

    return canvas


def compare_scans_and_evidence(
    prev_scan: np.ndarray,
    curr_scan: np.ndarray,
    prev_evidence: Optional[np.ndarray] = None,
    curr_evidence: Optional[np.ndarray] = None,
    prev_label: str = "Previous Scan",
    curr_label: str = "Current Scan",
    prev_date: str = "",
    curr_date: str = "",
    try_alignment: bool = True,
) -> Dict[str, Any]:
    """
    Complete high-level comparison pipeline producing scan comparison,
    evidence comparison (if heatmaps provided), alignment check, and visual difference map.
    """
    # 1. Image alignment (with fallback)
    aligned_curr = curr_scan
    alignment_meta = {"alignment_applied": False, "status": "Alignment skipped"}

    if try_alignment:
        aligned_curr, applied, alignment_meta = align_retinal_images(prev_scan, curr_scan)

    # 2. Side-by-side scans composite
    scan_comparison = create_side_by_side_comparison(
        previous_bgr=prev_scan,
        current_bgr=aligned_curr,
        prev_title=prev_label,
        curr_title=curr_label,
        prev_date=prev_date,
        curr_date=curr_date,
    )

    # 3. Visual difference map
    diff_map, diff_score, diff_meta = compute_visual_difference_map(prev_scan, aligned_curr)

    # 4. Optional Evidence comparison
    evidence_comparison: Optional[np.ndarray] = None
    if prev_evidence is not None and curr_evidence is not None:
        evidence_comparison = create_side_by_side_comparison(
            previous_bgr=prev_evidence,
            current_bgr=curr_evidence,
            prev_title=f"{prev_label} Evidence",
            curr_title=f"{curr_label} Evidence",
            prev_date=prev_date,
            curr_date=curr_date,
            banner_text="Model Evidence Localization (Grad-CAM)",
        )

    return {
        "scan_comparison": scan_comparison,
        "difference_map": diff_map,
        "evidence_comparison": evidence_comparison,
        "alignment": alignment_meta,
        "difference_metrics": diff_meta,
    }
