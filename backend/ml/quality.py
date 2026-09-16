import numpy as np
import cv2
from PIL import Image
from typing import Dict, Any, Tuple
from .config import (
    MIN_IMAGE_DIMENSION,
    MIN_LAPLACIAN_VARIANCE,
    MIN_BRIGHTNESS_MEAN,
    MAX_BRIGHTNESS_MEAN,
)

def check_image_quality(image: Image.Image) -> Dict[str, Any]:
    """
    Evaluates image suitability for retinal fundus DR diagnostic analysis.
    
    Checks:
    - Minimum image dimensions / resolution
    - Blur check (Laplacian variance)
    - Exposure check (mean brightness and contrast)
    
    Returns:
        dict with:
            - quality: 'acceptable' or 'poor'
            - quality_score: float (0.0 - 1.0)
            - issues: list of detected issues (if any)
            - metrics: raw measurements
    """
    issues = []
    
    # 1. Dimension Check
    width, height = image.size
    if width < MIN_IMAGE_DIMENSION or height < MIN_IMAGE_DIMENSION:
        issues.append(f"Low resolution ({width}x{height}, minimum recommended {MIN_IMAGE_DIMENSION}x{MIN_IMAGE_DIMENSION})")

    # Convert to OpenCV RGB/BGR and Grayscale for CV analysis
    np_img = np.array(image.convert("RGB"))
    gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)

    # 2. Blur / Sharpness Check via Laplacian Variance
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if laplacian_var < MIN_LAPLACIAN_VARIANCE:
        issues.append(f"Image appears blurry (sharpness metric: {laplacian_var:.1f})")

    # 3. Illumination / Brightness Check
    mean_brightness = float(np.mean(gray))
    std_contrast = float(np.std(gray))
    
    if mean_brightness < MIN_BRIGHTNESS_MEAN:
        issues.append("Image is severely underexposed or dark")
    elif mean_brightness > MAX_BRIGHTNESS_MEAN:
        issues.append("Image is overexposed or washed out")
        
    if std_contrast < 15.0:
        issues.append("Very low contrast detected")

    # Compute a normalized quality score (0.0 to 1.0)
    score = 1.0
    if issues:
        score -= min(0.3 * len(issues), 0.7)
    
    quality_status = "acceptable" if len(issues) == 0 else "poor"

    return {
        "quality": quality_status,
        "quality_score": round(score, 2),
        "issues": issues,
        "metrics": {
            "width": width,
            "height": height,
            "blur_metric": round(laplacian_var, 2),
            "mean_brightness": round(mean_brightness, 2),
            "contrast": round(std_contrast, 2),
        }
    }
