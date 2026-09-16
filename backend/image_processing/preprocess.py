"""
ProgressIQ - Image Preprocessing and Quality Assessment
Backend Developer 2 (Person 4)

Provides image validation, consistent standardized resizing,
CLAHE contrast enhancement for fundus structures, and objective image quality screening.
"""

from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union
import cv2
import numpy as np


def validate_image(
    image_input: Union[np.ndarray, bytes, Path, str],
) -> Tuple[bool, str, Optional[np.ndarray]]:
    """
    Validate that an input can be parsed into a valid BGR retinal fundus image.
    Returns: (is_valid, error_or_success_message, image_bgr)
    """
    img_bgr: Optional[np.ndarray] = None

    if isinstance(image_input, np.ndarray):
        img_bgr = image_input
    elif isinstance(image_input, bytes):
        nparr = np.frombuffer(image_input, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif isinstance(image_input, (Path, str)):
        p = Path(image_input)
        if not p.is_file():
            return False, f"File not found: {image_input}", None
        img_bgr = cv2.imread(str(p), cv2.IMREAD_COLOR)
    else:
        return False, f"Unsupported input type: {type(image_input)}", None

    if img_bgr is None or img_bgr.size == 0:
        return False, "Failed to decode image data into valid pixels.", None

    if len(img_bgr.shape) == 2:
        img_bgr = cv2.cvtColor(img_bgr, cv2.COLOR_GRAY2BGR)
    elif len(img_bgr.shape) == 3 and img_bgr.shape[2] == 4:
        img_bgr = cv2.cvtColor(img_bgr, cv2.COLOR_BGRA2BGR)

    h, w = img_bgr.shape[:2]
    if h < 100 or w < 100:
        return False, f"Image dimensions ({w}x{h}) are too small for diagnostic analysis (min 100x100).", None

    return True, "Valid image", img_bgr


def assess_image_quality(image_bgr: np.ndarray) -> Dict[str, Any]:
    """
    Evaluates retinal fundus image quality based on sharpness (Laplacian variance)
    and illumination distribution.

    Returns diagnostic quality result: 'acceptable', 'suboptimal_blur', or 'suboptimal_exposure'.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    # Sharpness via Laplacian variance
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpness_score = float(laplacian.var())

    # Exposure via Luminance (LAB color space)
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l_channel = lab[:, :, 0]
    mean_luminance = float(np.mean(l_channel))

    # Mask out black background border commonly present in fundus photographs
    fundus_mask = l_channel > 15
    if np.sum(fundus_mask) > 100:
        fundus_luminance = float(np.mean(l_channel[fundus_mask]))
        underexposed_pct = float(np.sum(l_channel[fundus_mask] < 30) / np.sum(fundus_mask))
        overexposed_pct = float(np.sum(l_channel[fundus_mask] > 230) / np.sum(fundus_mask))
    else:
        fundus_luminance = mean_luminance
        underexposed_pct = 0.0
        overexposed_pct = 0.0

    # Decision thresholds tailored for retinal fundus imaging
    is_sharp = sharpness_score >= 45.0
    is_well_exposed = (fundus_luminance >= 35.0) and (underexposed_pct < 0.40) and (overexposed_pct < 0.25)

    if not is_sharp:
        quality = "suboptimal_blur"
        details = "Reduced image focus detected; fine vascular structures may have lower visibility."
    elif not is_well_exposed:
        quality = "suboptimal_exposure"
        details = "Suboptimal illumination detected (under/over-exposure in retinal field)."
    else:
        quality = "acceptable"
        details = "Image quality is acceptable for model evaluation."

    return {
        "quality": quality,
        "sharpness_score": round(sharpness_score, 2),
        "is_sharp": is_sharp,
        "mean_luminance": round(fundus_luminance, 2),
        "is_well_exposed": is_well_exposed,
        "details": details,
    }


def apply_clahe_enhancement(
    image_bgr: np.ndarray,
    clip_limit: float = 2.0,
    tile_grid_size: Tuple[int, int] = (8, 8),
) -> np.ndarray:
    """
    Applies Contrast-Limited Adaptive Histogram Equalization (CLAHE) on the L-channel
    in LAB space. This is standard in clinical fundus photography to accentuate
    microaneurysms, hemorrhages, and exudates without artificial color distorting.
    """
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    cl = clahe.apply(l)

    enhanced_lab = cv2.merge((cl, a, b))
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
    return enhanced_bgr


def preprocess_fundus_image(
    image_bgr: np.ndarray,
    target_size: Tuple[int, int] = (512, 512),
    maintain_aspect_ratio: bool = True,
    apply_clahe: bool = False,
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Standardizes a retinal fundus image for inference and longitudinal comparison.

    Args:
        image_bgr: Input BGR image array
        target_size: (width, height) desired output resolution
        maintain_aspect_ratio: If True, uses letterbox padding with black borders;
                               otherwise performs standard bicubic resize.
        apply_clahe: If True, applies CLAHE contrast enhancement.

    Returns:
        (preprocessed_image_bgr, metadata_dict)
    """
    orig_h, orig_w = image_bgr.shape[:2]
    target_w, target_h = target_size

    if maintain_aspect_ratio:
        # Calculate scale to fit inside target box
        scale = min(target_w / orig_w, target_h / orig_h)
        new_w = int(orig_w * scale)
        new_h = int(orig_h * scale)

        resized = cv2.resize(image_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA if scale < 1.0 else cv2.INTER_CUBIC)

        # Pad onto black canvas
        canvas = np.zeros((target_h, target_w, 3), dtype=np.uint8)
        pad_x = (target_w - new_w) // 2
        pad_y = (target_h - new_h) // 2
        canvas[pad_y : pad_y + new_h, pad_x : pad_x + new_w] = resized
        processed_img = canvas
        scale_info = {"scale": scale, "pad_x": pad_x, "pad_y": pad_y}
    else:
        processed_img = cv2.resize(image_bgr, (target_w, target_h), interpolation=cv2.INTER_AREA if orig_w > target_w else cv2.INTER_CUBIC)
        scale_info = {"scale_x": target_w / orig_w, "scale_y": target_h / orig_h}

    if apply_clahe:
        processed_img = apply_clahe_enhancement(processed_img)

    metadata = {
        "original_width": orig_w,
        "original_height": orig_h,
        "processed_width": target_w,
        "processed_height": target_h,
        "clahe_applied": apply_clahe,
        **scale_info,
    }

    return processed_img, metadata
