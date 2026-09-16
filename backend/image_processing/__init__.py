"""
ProgressIQ Image Processing Package
Backend Developer 2 (Person 4)
"""

from .preprocess import (
    preprocess_fundus_image,
    apply_clahe_enhancement,
    assess_image_quality,
    validate_image,
)
from .evidence import (
    create_gradcam_overlay,
    create_side_by_side_evidence,
    generate_synthetic_heatmap,
)
from .comparison import (
    create_side_by_side_comparison,
    align_retinal_images,
    compute_visual_difference_map,
    compare_scans_and_evidence,
)

__all__ = [
    "preprocess_fundus_image",
    "apply_clahe_enhancement",
    "assess_image_quality",
    "validate_image",
    "create_gradcam_overlay",
    "create_side_by_side_evidence",
    "generate_synthetic_heatmap",
    "create_side_by_side_comparison",
    "align_retinal_images",
    "compute_visual_difference_map",
    "compare_scans_and_evidence",
]
