"""
DRClassifier — EfficientNet-B0 backbone for 5-class Diabetic Retinopathy severity classification.

Classes:
  0 — No DR
  1 — Mild
  2 — Moderate
  3 — Severe
  4 — Proliferative DR

Architecture: EfficientNet-B0 + custom DR head with BatchNorm + SiLU + Dropout.
Trained checkpoint: backend/ml/weights/dr_resnet50_weights.pt
"""
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

from .config import DEVICE, DEFAULT_MODEL_WEIGHTS_PATH, SEVERITY_CLASSES


class DRClassifier(nn.Module):
    """
    Diabetic Retinopathy 5-Class Severity Classifier.
    Backbone: EfficientNet-B0 (pretrained on ImageNet).
    Head: Dropout → Linear → BN → SiLU → Dropout → Linear(5 classes).
    Grad-CAM target layer: last conv block (features[-1]).
    """
    def __init__(self, num_classes: int = 5, pretrained_backbone: bool = True):
        super().__init__()
        weights = EfficientNet_B0_Weights.DEFAULT if pretrained_backbone else None
        backbone = efficientnet_b0(weights=weights)

        self.features  = backbone.features
        self.avgpool   = backbone.avgpool
        in_features    = backbone.classifier[1].in_features

        self.classifier = nn.Sequential(
            nn.Dropout(p=0.35),
            nn.Linear(in_features, 256),
            nn.BatchNorm1d(256),
            nn.SiLU(),
            nn.Dropout(p=0.2),
            nn.Linear(256, num_classes),
        )

        # Grad-CAM hooks the last conv block
        self.target_layer = self.features[-1]

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x

    def get_target_layer(self) -> nn.Module:
        """Returns the last conv block used for Grad-CAM evidence localization."""
        return self.target_layer

    def freeze_backbone(self):
        for p in self.features.parameters():
            p.requires_grad = False

    def unfreeze_backbone(self):
        for p in self.features.parameters():
            p.requires_grad = True


def load_dr_model(
    weights_path: Optional[Path] = None,
    device: torch.device = DEVICE,
) -> DRClassifier:
    """
    Loads DRClassifier with trained weights if available.
    Falls back to pretrained ImageNet backbone if no checkpoint is found.
    Always returns model in eval() mode on the target device.
    """
    weights_path = weights_path or DEFAULT_MODEL_WEIGHTS_PATH
    model = DRClassifier(num_classes=5, pretrained_backbone=True)

    if weights_path and Path(weights_path).exists():
        try:
            state_dict = torch.load(weights_path, map_location=device)
            model.load_state_dict(state_dict)
            size_mb = Path(weights_path).stat().st_size / (1024 * 1024)
            print(f"[ML Engine] Loaded DR checkpoint from: {weights_path} ({size_mb:.1f} MB)")
        except Exception as e:
            print(f"[ML Engine] Warning: Could not load checkpoint ({e}). Using pretrained backbone.")
    else:
        print(f"[ML Engine] No checkpoint found at {weights_path}. Using pretrained ImageNet backbone.")

    model.to(device)
    model.eval()
    return model
