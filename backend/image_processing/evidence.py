"""
ProgressIQ - Evidence & Heatmap Processing Layer
Backend Developer 2 (Person 4)

Handles model-generated evidence (Grad-CAM heatmaps), colormap blending,
visual thresholding, and side-by-side evidence composition.
"""

from typing import Any, Dict, Optional, Tuple, Union
import cv2
import numpy as np


def create_gradcam_overlay(
    image_bgr: np.ndarray,
    heatmap: np.ndarray,
    alpha: float = 0.42,
    colormap: int = cv2.COLORMAP_JET,
    threshold_low_activations: float = 0.15,
) -> np.ndarray:
    """
    Blends a model-generated Grad-CAM heatmap onto a retinal fundus image.

    Args:
        image_bgr: Base fundus image in BGR format
        heatmap: 2D array of activations (values between 0.0-1.0 or 0-255)
        alpha: Blending weight for the heatmap overlay (0.0 to 1.0)
        colormap: OpenCV colormap (default cv2.COLORMAP_JET)
        threshold_low_activations: Minimum activation threshold below which
                                   the original fundus scan remains unshaded.

    Returns:
        Blended BGR image containing model evidence overlay.
    """
    h, w = image_bgr.shape[:2]

    # Normalize heatmap to [0.0, 1.0]
    norm_heatmap = heatmap.astype(np.float32)
    if norm_heatmap.max() > 1.0:
        norm_heatmap = norm_heatmap / 255.0

    # Resize heatmap to match image dimensions if needed
    if norm_heatmap.shape[:2] != (h, w):
        norm_heatmap = cv2.resize(norm_heatmap, (w, h), interpolation=cv2.INTER_LINEAR)

    norm_heatmap = np.clip(norm_heatmap, 0.0, 1.0)

    # Convert to 8-bit for colormapping
    heatmap_uint8 = (norm_heatmap * 255.0).astype(np.uint8)
    heatmap_color = cv2.applyColorMap(heatmap_uint8, colormap)

    # Create mask for regions above threshold
    # Retinal background mask (prevent heatmap from bleeding into black margins)
    gray_fundus = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    fundus_mask = gray_fundus > 12

    activation_mask = (norm_heatmap >= threshold_low_activations) & fundus_mask

    # Weight mask smoothly based on activation strength
    blend_weights = np.zeros((h, w, 1), dtype=np.float32)
    blend_weights[activation_mask] = (
        (norm_heatmap[activation_mask, np.newaxis] - threshold_low_activations)
        / (1.0 - threshold_low_activations + 1e-6)
    ) * alpha

    # Blend: base * (1 - w) + heatmap * w
    blended = image_bgr.astype(np.float32) * (1.0 - blend_weights) + heatmap_color.astype(np.float32) * blend_weights
    return np.clip(blended, 0, 255).astype(np.uint8)


def create_side_by_side_evidence(
    original_bgr: np.ndarray,
    evidence_bgr: np.ndarray,
    left_label: str = "Original Retinal Scan",
    right_label: str = "Model Evidence (Grad-CAM)",
    subtitle: str = "Model-generated visual explanation. Not validated lesion segmentation.",
) -> np.ndarray:
    """
    Creates a standardized side-by-side composite of the original scan and its evidence overlay
    with clinical headers and required disclaimer labels.
    """
    h_orig, w_orig = original_bgr.shape[:2]
    h_evid, w_evid = evidence_bgr.shape[:2]

    # Standardize heights if differing
    target_h = 512
    w1 = int(w_orig * (target_h / h_orig))
    w2 = int(w_evid * (target_h / h_evid))

    img1 = cv2.resize(original_bgr, (w1, target_h), interpolation=cv2.INTER_AREA)
    img2 = cv2.resize(evidence_bgr, (w2, target_h), interpolation=cv2.INTER_AREA)

    # Header bar
    header_h = 75
    border_gap = 12
    total_w = w1 + w2 + border_gap
    total_h = target_h + header_h + 35  # extra space for footer disclaimer

    # Dark slate clinical background
    canvas = np.full((total_h, total_w, 3), (24, 28, 32), dtype=np.uint8)

    # Place images
    y_start = header_h
    canvas[y_start : y_start + target_h, 0:w1] = img1
    canvas[y_start : y_start + target_h, w1 + border_gap : w1 + border_gap + w2] = img2

    # Draw vertical divider
    canvas[y_start : y_start + target_h, w1 : w1 + border_gap] = (45, 52, 60)

    # Draw clinical headers
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(canvas, left_label, (20, 42), font, 0.75, (230, 235, 240), 2, cv2.LINE_AA)
    cv2.putText(canvas, right_label, (w1 + border_gap + 20, 42), font, 0.75, (100, 200, 255), 2, cv2.LINE_AA)

    # Footer disclaimer
    cv2.putText(
        canvas,
        subtitle,
        (20, total_h - 12),
        font,
        0.45,
        (160, 170, 180),
        1,
        cv2.LINE_AA,
    )

    return canvas


def generate_synthetic_heatmap(
    width: int = 512,
    height: int = 512,
    severity: str = "Moderate",
    seed: int = 42,
) -> np.ndarray:
    """
    Generates a realistic synthetic 2D Grad-CAM attention heatmap for testing or fallback.
    Simulates attention over macula and microaneurysm/exudate pathology clusters.
    """
    np.random.seed(seed)
    heatmap = np.zeros((height, width), dtype=np.float32)

    # Primary attention focal centers
    centers = [
        (int(width * 0.58), int(height * 0.52), int(width * 0.12)),  # Macular region
    ]

    sev_lower = severity.lower()
    if "mild" in sev_lower:
        centers.append((int(width * 0.50), int(height * 0.40), int(width * 0.08)))
    elif "moderate" in sev_lower:
        centers.extend([
            (int(width * 0.48), int(height * 0.38), int(width * 0.09)),
            (int(width * 0.65), int(height * 0.62), int(width * 0.08)),
        ])
    elif "severe" in sev_lower or "proliferative" in sev_lower:
        centers.extend([
            (int(width * 0.45), int(height * 0.35), int(width * 0.10)),
            (int(width * 0.66), int(height * 0.63), int(width * 0.11)),
            (int(width * 0.55), int(height * 0.70), int(width * 0.09)),
            (int(width * 0.38), int(height * 0.50), int(width * 0.08)),
        ])

    Y, X = np.ogrid[:height, :width]
    for cx, cy, radius in centers:
        dist_sq = (X - cx) ** 2 + (Y - cy) ** 2
        blob = np.exp(-dist_sq / (2.0 * (radius ** 2)))
        weight = np.random.uniform(0.6, 1.0)
        heatmap += (blob * weight).astype(np.float32)

    if heatmap.max() > 0:
        heatmap = heatmap / heatmap.max()

    return cv2.GaussianBlur(heatmap, (21, 21), 0)
