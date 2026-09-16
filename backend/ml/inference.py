import io
import time
from pathlib import Path
from typing import Dict, Any, Union, Optional
import torch
import torchvision.transforms as transforms
from PIL import Image

from .config import (
    DEVICE,
    INPUT_IMAGE_SIZE,
    IMAGENET_MEAN,
    IMAGENET_STD,
    SEVERITY_CLASSES,
    SEVERITY_MAPPING,
)
from .quality import check_image_quality
from .gradcam import generate_gradcam_evidence
from .model import DRClassifier, load_dr_model

# Global cached model instance for fast inference
_CACHED_MODEL: Optional[DRClassifier] = None

def get_model() -> DRClassifier:
    """Singleton getter for the loaded DR model."""
    global _CACHED_MODEL
    if _CACHED_MODEL is None:
        _CACHED_MODEL = load_dr_model(device=DEVICE)
    return _CACHED_MODEL

# Image transform pipeline
INFERENCE_TRANSFORMS = transforms.Compose([
    transforms.Resize(INPUT_IMAGE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

def preprocess_image(image: Image.Image) -> torch.Tensor:
    """Preprocesses a PIL Image into a normalized tensor ready for model inference."""
    rgb_image = image.convert("RGB")
    tensor = INFERENCE_TRANSFORMS(rgb_image)
    # Add batch dimension: [1, 3, H, W]
    return tensor.unsqueeze(0).to(DEVICE)


def run_diagnostic_pipeline(
    image_input: Union[bytes, Image.Image, str, Path],
    generate_evidence: bool = True,
    patient_id: Optional[str] = None,
    scan_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes the complete Core ML Pipeline:
    1. Image loading & validation
    2. Image Quality Check (resolution, blur, brightness)
    3. Preprocessing & Tensor normalization
    4. DR Severity Classification & Confidence score
    5. Grad-CAM Evidence Localization heatmap generation
    
    Returns structured diagnostic output adhering to ProgressIQ specification:
    {
        "severity": "Moderate",
        "severity_index": 2,
        "confidence": 0.87,
        "quality": "acceptable",
        "evidence_url": "/static/evidence/..."
    }
    """
    start_time = time.time()
    
    # 1. Load image
    if isinstance(image_input, bytes):
        try:
            pil_image = Image.open(io.BytesIO(image_input))
        except Exception as e:
            raise ValueError(f"Invalid image file format or corrupt byte stream: {e}")
    elif isinstance(image_input, (str, Path)):
        try:
            pil_image = Image.open(image_input)
        except Exception as e:
            raise ValueError(f"Could not open image file from {image_input}: {e}")
    elif isinstance(image_input, Image.Image):
        pil_image = image_input
    else:
        raise TypeError(f"Unsupported image input type: {type(image_input)}")

    # 2. Image Quality Check
    quality_result = check_image_quality(pil_image)
    quality_status = quality_result["quality"]
    
    # 3. Preprocess Tensor
    input_tensor = preprocess_image(pil_image)
    input_tensor.requires_grad_(True)
    
    # 4. Model Inference
    model = get_model()
    
    # Forward pass
    logits = model(input_tensor)
    probs_tensor = torch.softmax(logits, dim=1)[0]
    
    # Predicted severity
    severity_index = int(torch.argmax(probs_tensor).item())
    severity = SEVERITY_CLASSES[severity_index]
    confidence = float(probs_tensor[severity_index].item())
    
    # Probability map across all 5 classes
    probabilities = {
        SEVERITY_CLASSES[i]: round(float(probs_tensor[i].item()), 4)
        for i in range(len(SEVERITY_CLASSES))
    }
    
    # 5. Evidence Localization (Grad-CAM)
    evidence_url = None
    if generate_evidence:
        try:
            _, evidence_url, _ = generate_gradcam_evidence(
                model=model,
                target_layer=model.get_target_layer(),
                input_tensor=input_tensor,
                original_image=pil_image,
                target_class=severity_index,
            )
        except Exception as e:
            print(f"[ML Pipeline] Grad-CAM generation notice: {e}")
            evidence_url = None

    elapsed_ms = round((time.time() - start_time) * 1000, 1)

    # Core response payload conforming to ProgressIQ specification
    response = {
        "severity": severity,
        "severity_index": severity_index,
        "confidence": round(confidence, 2),
        "quality": quality_status,
        "evidence_url": evidence_url,
        # Extended context for Person 2 (visualization) & Person 5 (integration)
        "details": {
            "probabilities": probabilities,
            "quality_assessment": quality_result,
            "latency_ms": elapsed_ms,
            "device": str(DEVICE),
            "patient_id": patient_id,
            "scan_id": scan_id,
        },
        "disclaimer": "Model-generated analysis for clinical research prototype. Requires clinical review."
    }
    
    return response
