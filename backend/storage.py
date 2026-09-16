"""
ProgressIQ - Image and Evidence Storage Layer
Backend Developer 2 (Person 4)

Handles local disk persistence, category-based directory structures,
and URL resolution for raw retinal scans, Grad-CAM evidence maps,
and longitudinal comparison composites.
"""

import os
import uuid
from pathlib import Path
from typing import Optional, Tuple
import cv2
import numpy as np
from PIL import Image

# Default media directories
BASE_DIR = Path(__file__).resolve().parent.parent
MEDIA_ROOT = BASE_DIR / "media"
SCANS_DIR = MEDIA_ROOT / "scans"
EVIDENCE_DIR = MEDIA_ROOT / "evidence"
COMPARISONS_DIR = MEDIA_ROOT / "comparisons"
TEMP_DIR = MEDIA_ROOT / "temp"


class StorageManager:
    """Manages file storage and URL resolution for ProgressIQ media artifacts."""

    def __init__(self, media_root: Optional[Path] = None, base_url: str = "/media"):
        self.media_root = Path(media_root) if media_root else MEDIA_ROOT
        self.scans_dir = self.media_root / "scans"
        self.evidence_dir = self.media_root / "evidence"
        self.comparisons_dir = self.media_root / "comparisons"
        self.temp_dir = self.media_root / "temp"
        self.base_url = base_url.rstrip("/")
        self._ensure_directories()

    def _ensure_directories(self) -> None:
        """Create necessary media directories if they don't exist."""
        for directory in [self.media_root, self.scans_dir, self.evidence_dir, self.comparisons_dir, self.temp_dir]:
            directory.mkdir(parents=True, exist_ok=True)

    def _get_category_dir(self, category: str) -> Path:
        category_map = {
            "scans": self.scans_dir,
            "evidence": self.evidence_dir,
            "comparisons": self.comparisons_dir,
            "temp": self.temp_dir,
        }
        target_dir = category_map.get(category.lower(), self.comparisons_dir)
        target_dir.mkdir(parents=True, exist_ok=True)
        return target_dir

    def get_public_url(self, filename: str, category: str = "scans") -> str:
        """Construct public URL for an asset."""
        return f"{self.base_url}/{category}/{filename}"

    def save_bytes(
        self,
        file_bytes: bytes,
        original_filename: str = "image.jpg",
        category: str = "scans",
        prefix: str = "",
    ) -> Tuple[Path, str]:
        """Save raw bytes to disk and return (absolute_path, public_url)."""
        ext = Path(original_filename).suffix.lower()
        if not ext or ext not in [".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"]:
            ext = ".jpg"

        unique_id = uuid.uuid4().hex[:12]
        clean_prefix = f"{prefix}_" if prefix else ""
        filename = f"{clean_prefix}{unique_id}{ext}"

        dest_dir = self._get_category_dir(category)
        file_path = dest_dir / filename

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        public_url = self.get_public_url(filename, category)
        return file_path, public_url

    def save_cv2_image(
        self,
        image_bgr: np.ndarray,
        filename_or_prefix: str = "composite",
        category: str = "comparisons",
        quality: int = 95,
    ) -> Tuple[Path, str]:
        """Save an OpenCV BGR numpy array to disk and return (absolute_path, public_url)."""
        if not filename_or_prefix.endswith((".jpg", ".jpeg", ".png")):
            unique_id = uuid.uuid4().hex[:12]
            filename = f"{filename_or_prefix}_{unique_id}.jpg"
        else:
            filename = filename_or_prefix

        dest_dir = self._get_category_dir(category)
        file_path = dest_dir / filename

        params = [int(cv2.IMWRITE_JPEG_QUALITY), quality] if filename.endswith((".jpg", ".jpeg")) else []
        cv2.imwrite(str(file_path), image_bgr, params)

        public_url = self.get_public_url(filename, category)
        return file_path, public_url

    def save_pil_image(
        self,
        image_pil: Image.Image,
        filename_or_prefix: str = "composite",
        category: str = "comparisons",
    ) -> Tuple[Path, str]:
        """Save a PIL Image object to disk and return (absolute_path, public_url)."""
        if not filename_or_prefix.endswith((".jpg", ".jpeg", ".png")):
            unique_id = uuid.uuid4().hex[:12]
            filename = f"{filename_or_prefix}_{unique_id}.jpg"
        else:
            filename = filename_or_prefix

        dest_dir = self._get_category_dir(category)
        file_path = dest_dir / filename

        image_pil.save(file_path, quality=95)
        public_url = self.get_public_url(filename, category)
        return file_path, public_url

    def resolve_to_path(self, url_or_path: str) -> Optional[Path]:
        """
        Convert a public URL (e.g. /media/scans/sample.jpg), relative path,
        or absolute path into a verified local Path object.
        """
        if not url_or_path:
            return None

        clean = url_or_path.strip().replace("\\", "/")

        # Check if already an existing absolute path
        direct_path = Path(url_or_path)
        if direct_path.is_file():
            return direct_path

        # Handle /media/... URLs
        if clean.startswith(self.base_url):
            rel_path = clean[len(self.base_url):].lstrip("/")
            resolved = self.media_root / rel_path
            if resolved.is_file():
                return resolved

        # Handle bare relative path inside media_root
        candidate = self.media_root / clean.lstrip("/")
        if candidate.is_file():
            return candidate

        return None


# Global singleton storage instance
default_storage = StorageManager()


def generate_synthetic_fundus(
    width: int = 512,
    height: int = 512,
    severity: str = "Moderate",
    visit_label: str = "Visit 1",
) -> np.ndarray:
    """
    Utility to generate realistic synthetic retinal fundus images for demo/test purposes.
    Includes retinal globe, optic disc, blood vessel branches, and pathology features
    (e.g., microaneurysms, hard exudates) according to severity.
    """
    # Fundus base: dark background with circular retina globe
    img = np.zeros((height, width, 3), dtype=np.uint8)
    center = (width // 2, height // 2)
    radius = int(min(width, height) * 0.44)

    # Gradient retinal orange-red color
    Y, X = np.ogrid[:height, :width]
    dist_from_center = np.sqrt((X - center[0]) ** 2 + (Y - center[1]) ** 2)
    mask = dist_from_center <= radius

    # Retinal hue & saturation
    base_color = np.array([25, 60, 185], dtype=np.float32)  # BGR
    gradient = 1.0 - (dist_from_center / radius) * 0.35
    gradient = np.clip(gradient, 0.4, 1.0)[:, :, np.newaxis]

    fundus_disc = (base_color * gradient).astype(np.uint8)
    img[mask] = fundus_disc[mask]

    # Optic Disc (yellowish oval on nasal side)
    disc_center = (int(width * 0.32), int(height * 0.5))
    disc_axes = (int(width * 0.07), int(height * 0.09))
    cv2.ellipse(img, disc_center, disc_axes, 0, 0, 360, (140, 220, 245), -1, cv2.LINE_AA)
    # Optic cup
    cv2.ellipse(img, disc_center, (int(disc_axes[0] * 0.5), int(disc_axes[1] * 0.5)), 0, 0, 360, (170, 235, 255), -1, cv2.LINE_AA)

    # Macula / Fovea (darker red area temporal to disc)
    fovea_center = (int(width * 0.58), int(height * 0.52))
    cv2.circle(img, fovea_center, int(width * 0.05), (15, 35, 120), -1, cv2.LINE_AA)

    # Blood vessels (arches emanating from optic disc)
    vessel_color = (15, 25, 110)
    for sign in [-1, 1]:
        # Superior and inferior arcades
        pts = np.array([
            disc_center,
            (int(disc_center[0] + width * 0.1), int(disc_center[1] + sign * height * 0.25)),
            (int(disc_center[0] + width * 0.3), int(disc_center[1] + sign * height * 0.3)),
            (int(disc_center[0] + width * 0.5), int(disc_center[1] + sign * height * 0.22)),
        ], np.int32)
        cv2.polylines(img, [pts], False, vessel_color, 4, cv2.LINE_AA)

        # Secondary branches
        pts2 = np.array([
            (int(disc_center[0] + width * 0.2), int(disc_center[1] + sign * height * 0.26)),
            (int(disc_center[0] + width * 0.35), int(disc_center[1] + sign * height * 0.15)),
        ], np.int32)
        cv2.polylines(img, [pts2], False, vessel_color, 2, cv2.LINE_AA)

    # Add pathology manifestations according to severity
    sev_lower = severity.lower()
    np.random.seed(42 if "mild" in sev_lower else (84 if "moderate" in sev_lower else 126))

    if "mild" in sev_lower or "moderate" in sev_lower or "severe" in sev_lower or "proliferative" in sev_lower:
        # Microaneurysms: tiny deep red dots
        num_dots = 8 if "mild" in sev_lower else (25 if "moderate" in sev_lower else 60)
        for _ in range(num_dots):
            dx = int(fovea_center[0] + np.random.randint(-120, 120))
            dy = int(fovea_center[1] + np.random.randint(-120, 120))
            if (dx - center[0]) ** 2 + (dy - center[1]) ** 2 < (radius * 0.85) ** 2:
                cv2.circle(img, (dx, dy), np.random.randint(1, 3), (10, 15, 75), -1, cv2.LINE_AA)

    if "moderate" in sev_lower or "severe" in sev_lower or "proliferative" in sev_lower:
        # Hard Exudates: bright yellow/white lipid deposits
        num_exudates = 6 if "moderate" in sev_lower else 18
        for _ in range(num_exudates):
            ex_x = int(fovea_center[0] + np.random.randint(-90, 90))
            ex_y = int(fovea_center[1] + np.random.randint(-90, 90))
            if (ex_x - center[0]) ** 2 + (ex_y - center[1]) ** 2 < (radius * 0.8) ** 2:
                cv2.circle(img, (ex_x, ex_y), np.random.randint(2, 5), (120, 230, 245), -1, cv2.LINE_AA)

    # Apply subtle Gaussian blur to make structures look organic
    img = cv2.GaussianBlur(img, (3, 3), 0.6)
    return img
