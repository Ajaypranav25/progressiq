import os
from pathlib import Path
import torch

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
EVIDENCE_DIR = STATIC_DIR / "evidence"
SAMPLES_DIR = STATIC_DIR / "samples"
WEIGHTS_DIR = BASE_DIR / "ml" / "weights"

# Ensure runtime directories exist
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

# DR Severity Classes
# 0: No DR, 1: Mild DR, 2: Moderate DR, 3: Severe DR, 4: Proliferative DR
SEVERITY_CLASSES = [
    "No DR",
    "Mild",
    "Moderate",
    "Severe",
    "Proliferative DR"
]

SEVERITY_MAPPING = {i: name for i, name in enumerate(SEVERITY_CLASSES)}

# Device configuration
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Preprocessing Constants
INPUT_IMAGE_SIZE = (224, 224)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# Quality check thresholds
MIN_IMAGE_DIMENSION = 180
MIN_LAPLACIAN_VARIANCE = 40.0  # Blur detection threshold
MIN_BRIGHTNESS_MEAN = 20.0     # Underexposure threshold
MAX_BRIGHTNESS_MEAN = 235.0    # Overexposure threshold

# Model checkpoint filename
DEFAULT_MODEL_WEIGHTS_PATH = WEIGHTS_DIR / "dr_resnet50_weights.pt"
