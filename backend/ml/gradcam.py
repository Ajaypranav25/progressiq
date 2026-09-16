import uuid
from pathlib import Path
from typing import Tuple, Optional
import numpy as np
import cv2
from PIL import Image
import torch
import torch.nn as nn
from .config import EVIDENCE_DIR

class GradCAM:
    """
    Grad-CAM (Gradient-weighted Class Activation Mapping) for visual evidence localization.
    Computes visual explanations for predictions made by CNN-based models.
    """
    def __init__(self, model: nn.Module, target_layer: nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output

        def backward_hook(module, grad_in, grad_out):
            # grad_out is a tuple where the first element is the gradient tensor
            self.gradients = grad_out[0]

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate_heatmap(self, input_tensor: torch.Tensor, target_class: Optional[int] = None) -> np.ndarray:
        """
        Generates normalized Grad-CAM heatmap array of shape [H, W] between 0 and 1.
        """
        self.model.eval()
        self.model.zero_grad()
        
        # Ensure tensor requires gradient
        input_tensor = input_tensor.clone()
        
        # Forward pass
        logits = self.model(input_tensor)
        
        if target_class is None:
            target_class = torch.argmax(logits, dim=1).item()
            
        # Target score for backprop
        target_score = logits[0, target_class]
        target_score.backward(retain_graph=True)
        
        # Pool gradients across spatial dimensions
        # self.gradients: [B, C, H, W]
        # self.activations: [B, C, H, W]
        gradients = self.gradients.detach()
        activations = self.activations.detach()
        
        # Global average pooling of gradients: [B, C, 1, 1]
        pooled_gradients = torch.mean(gradients, dim=[2, 3], keepdim=True)
        
        # Weight the activation maps
        weighted_activations = activations * pooled_gradients
        cam = torch.sum(weighted_activations, dim=1).squeeze(0)  # [H, W]
        
        # ReLU to keep only positive evidence features
        cam = torch.relu(cam)
        
        cam_np = cam.cpu().numpy()
        
        # Normalize between 0 and 1
        max_val = np.max(cam_np)
        min_val = np.min(cam_np)
        if max_val - min_val > 1e-8:
            cam_np = (cam_np - min_val) / (max_val - min_val)
        else:
            cam_np = np.zeros_like(cam_np)
            
        return cam_np


def generate_gradcam_evidence(
    model: nn.Module,
    target_layer: nn.Module,
    input_tensor: torch.Tensor,
    original_image: Image.Image,
    target_class: int,
    alpha: float = 0.45,
    colormap: int = cv2.COLORMAP_JET,
    output_filename: Optional[str] = None,
) -> Tuple[str, str, np.ndarray]:
    """
    Generates Grad-CAM heatmap, overlays it on the original fundus image, 
    and saves the resulting evidence visualization image to disk.

    Returns:
        (saved_absolute_path, relative_web_url, raw_heatmap_array)
    """
    grad_cam = GradCAM(model, target_layer)
    heatmap = grad_cam.generate_heatmap(input_tensor, target_class=target_class)
    
    # Original image dimensions
    orig_w, orig_h = original_image.size
    
    # Resize heatmap to match original fundus image dimensions
    resized_heatmap = cv2.resize(heatmap, (orig_w, orig_h), interpolation=cv2.INTER_CUBIC)
    
    # Scale to 0-255 uint8 for colormap application
    heatmap_uint8 = np.uint8(255 * resized_heatmap)
    
    # Apply colormap (JET or TURBO)
    colored_heatmap = cv2.applyColorMap(heatmap_uint8, colormap)
    # Convert BGR from OpenCV to RGB
    colored_heatmap_rgb = cv2.cvtColor(colored_heatmap, cv2.COLOR_BGR2RGB)
    
    # Original image as RGB numpy array
    orig_np = np.array(original_image.convert("RGB"))
    
    # Optional: Circular mask to focus evidence on the retinal fundus disc
    gray_orig = cv2.cvtColor(orig_np, cv2.COLOR_RGB2GRAY)
    mask = (gray_orig > 10).astype(np.float32)
    # Smooth the mask boundary
    mask = cv2.GaussianBlur(mask, (15, 15), 0)[:, :, np.newaxis]
    
    # Apply blend: (1 - alpha) * original + alpha * colored_heatmap
    overlay = (orig_np * (1.0 - alpha) + colored_heatmap_rgb * alpha).astype(np.uint8)
    
    # Inside the fundus disc use overlay, outside keep original dark background
    final_composite = (overlay * mask + orig_np * (1.0 - mask)).astype(np.uint8)
    
    # Save the composite visualization
    if not output_filename:
        output_filename = f"evidence_{uuid.uuid4().hex[:12]}.jpg"
        
    saved_path = EVIDENCE_DIR / output_filename
    result_image = Image.fromarray(final_composite)
    result_image.save(saved_path, format="JPEG", quality=92)
    
    relative_url = f"/static/evidence/{output_filename}"
    return str(saved_path), relative_url, resized_heatmap
