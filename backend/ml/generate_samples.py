import os
from pathlib import Path
import numpy as np
import cv2
from PIL import Image
from .config import SAMPLES_DIR

def create_synthetic_fundus(
    stage: int = 0,
    size: int = 512,
    filename: str = "sample_fundus.jpg"
) -> Path:
    """
    Generates a realistic synthetic retinal fundus photograph for demonstration and testing.
    
    Stages:
    0 — No DR (Clear retina, optic disc, macula, primary vessels)
    1 — Mild DR (+ small microaneurysms)
    2 — Moderate DR (+ microaneurysms, dot-blot hemorrhages, hard exudates)
    3 — Severe DR (+ extensive hemorrhages in quadrants, cotton-wool spots)
    4 — Proliferative DR (+ neovascularization fronds, pre-retinal hemorrhage)
    """
    # 1. Dark circular fundus mask
    img = np.zeros((size, size, 3), dtype=np.uint8)
    center = (size // 2, size // 2)
    radius = int(size * 0.46)
    
    # Base orange-red retinal background with radial illumination gradient
    y, x = np.ogrid[:size, :size]
    dist_from_center = np.sqrt((x - center[0])**2 + (y - center[1])**2)
    
    mask = dist_from_center <= radius
    norm_dist = np.clip(dist_from_center / radius, 0, 1)
    
    # Warm retinal hue (darker at edges, richer orange-red in center)
    red_channel = (195 - 65 * norm_dist**1.5).astype(np.uint8)
    green_channel = (85 - 35 * norm_dist**1.2).astype(np.uint8)
    blue_channel = (25 - 15 * norm_dist).astype(np.uint8)
    
    img[mask, 0] = blue_channel[mask]
    img[mask, 1] = green_channel[mask]
    img[mask, 2] = red_channel[mask]
    
    # 2. Add Optic Disc (Nasal side: bright yellowish-orange circle)
    optic_disc_center = (int(size * 0.32), int(size * 0.50))
    optic_disc_radius = int(size * 0.08)
    cv2.circle(img, optic_disc_center, optic_disc_radius, (90, 200, 245), -1)
    # Optic cup (inner pale region)
    cv2.circle(img, optic_disc_center, int(optic_disc_radius * 0.5), (140, 230, 255), -1)
    
    # 3. Add Macula / Fovea (Temporal side: darker reddish-brown spot)
    macula_center = (int(size * 0.62), int(size * 0.52))
    cv2.circle(img, macula_center, int(size * 0.06), (15, 45, 120), -1)
    cv2.circle(img, macula_center, int(size * 0.02), (10, 30, 85), -1)
    
    # 4. Retinal Blood Vessels radiating from optic disc
    np.random.seed(42 + stage * 7)
    for branch_idx in range(6):
        angle = (branch_idx * 60 + np.random.uniform(-15, 15)) * np.pi / 180.0
        start_pt = optic_disc_center
        
        # Arc points
        pts = [start_pt]
        cur_x, cur_y = float(start_pt[0]), float(start_pt[1])
        steps = 14
        step_len = (radius * 0.8) / steps
        
        for s in range(steps):
            cur_angle = angle + np.sin(s * 0.4) * 0.3
            cur_x += step_len * np.cos(cur_angle)
            cur_y += step_len * np.sin(cur_angle)
            if np.sqrt((cur_x - center[0])**2 + (cur_y - center[1])**2) < radius - 10:
                pts.append((int(cur_x), int(cur_y)))
                
        pts_arr = np.array(pts, dtype=np.int32)
        # Main vessel
        cv2.polylines(img, [pts_arr], isClosed=False, color=(15, 25, 95), thickness=int(size * 0.009), lineType=cv2.LINE_AA)
        
        # Secondary branching capillaries
        if len(pts) > 6:
            sub_pt = pts[len(pts) // 2]
            sub_pts = [sub_pt]
            sub_x, sub_y = float(sub_pt[0]), float(sub_pt[1])
            for _ in range(5):
                sub_x += 12 * np.cos(angle + 0.6)
                sub_y += 12 * np.sin(angle + 0.6)
                sub_pts.append((int(sub_x), int(sub_y)))
            cv2.polylines(img, [np.array(sub_pts, dtype=np.int32)], isClosed=False, color=(20, 35, 110), thickness=int(size * 0.004), lineType=cv2.LINE_AA)

    # 5. Add Diabetic Retinopathy Lesions by Stage
    # Stage 1: Mild DR -> a few microaneurysms (tiny red punctate dots)
    if stage >= 1:
        num_ma = 15 if stage == 1 else 35
        for _ in range(num_ma):
            ma_x = int(np.random.uniform(size * 0.45, size * 0.80))
            ma_y = int(np.random.uniform(size * 0.25, size * 0.75))
            if np.sqrt((ma_x - center[0])**2 + (ma_y - center[1])**2) < radius - 30:
                cv2.circle(img, (ma_x, ma_y), int(np.random.choice([2, 3])), (10, 15, 140), -1)

    # Stage 2: Moderate DR -> microaneurysms + dot/blot hemorrhages + hard exudates (bright yellow flecks)
    if stage >= 2:
        # Hemorrhages
        num_hem = 25 if stage == 2 else 55
        for _ in range(num_hem):
            hx = int(np.random.uniform(size * 0.40, size * 0.85))
            hy = int(np.random.uniform(size * 0.20, size * 0.80))
            if np.sqrt((hx - center[0])**2 + (hy - center[1])**2) < radius - 25:
                cv2.ellipse(img, (hx, hy), (np.random.randint(4, 9), np.random.randint(3, 7)), np.random.randint(0, 180), 0, 360, (5, 10, 120), -1)
        
        # Hard Exudates (bright lipid deposits: bright yellow)
        num_ex = 20 if stage == 2 else 45
        for _ in range(num_ex):
            ex_x = int(np.random.uniform(size * 0.52, size * 0.75))
            ex_y = int(np.random.uniform(size * 0.35, size * 0.65))
            if np.sqrt((ex_x - center[0])**2 + (ex_y - center[1])**2) < radius - 35:
                cv2.circle(img, (ex_x, ex_y), np.random.randint(2, 5), (60, 235, 250), -1)

    # Stage 3: Severe DR -> extensive 4-quadrant blot hemorrhages, cotton-wool spots (fluffy white/pale lesions)
    if stage >= 3:
        for _ in range(60):
            hx = int(np.random.uniform(size * 0.20, size * 0.85))
            hy = int(np.random.uniform(size * 0.15, size * 0.85))
            if np.sqrt((hx - center[0])**2 + (hy - center[1])**2) < radius - 20:
                cv2.ellipse(img, (hx, hy), (np.random.randint(7, 16), np.random.randint(5, 12)), np.random.randint(0, 180), 0, 360, (2, 5, 100), -1)
        # Cotton-wool spots (infarcted nerve fibers: soft whitish-gray patches)
        for _ in range(8):
            cwx = int(np.random.uniform(size * 0.35, size * 0.75))
            cwy = int(np.random.uniform(size * 0.30, size * 0.70))
            if np.sqrt((cwx - center[0])**2 + (cwy - center[1])**2) < radius - 35:
                cv2.circle(img, (cwx, cwy), np.random.randint(8, 15), (170, 210, 220), -1)

    # Stage 4: Proliferative DR -> Neovascularization fronds (dense tangled delicate vessels) + preretinal bleed
    if stage >= 4:
        # Pre-retinal / vitreous hemorrhage (large boat-shaped deep dark red area)
        prh_center = (int(size * 0.55), int(size * 0.38))
        cv2.ellipse(img, prh_center, (int(size * 0.15), int(size * 0.08)), 10, 0, 360, (2, 4, 80), -1)
        # Neovascularization tangle
        for _ in range(25):
            nv_x = int(np.random.uniform(size * 0.30, size * 0.45))
            nv_y = int(np.random.uniform(size * 0.40, size * 0.60))
            pts_nv = [(nv_x + np.random.randint(-15, 15), nv_y + np.random.randint(-15, 15)) for _ in range(5)]
            cv2.polylines(img, [np.array(pts_nv, dtype=np.int32)], isClosed=False, color=(10, 20, 120), thickness=2, lineType=cv2.LINE_AA)

    # Blur background slightly to simulate fundus camera optical spread function
    img = cv2.GaussianBlur(img, (3, 3), 0)
    
    # Smooth edges with the fundus mask
    mask_3c = np.stack([mask]*3, axis=2)
    img = (img * mask_3c).astype(np.uint8)

    # Save image
    out_path = SAMPLES_DIR / filename
    # Convert BGR to RGB for PIL saving
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    pil_out = Image.fromarray(rgb_img)
    pil_out.save(out_path, format="JPEG", quality=95)
    return out_path

def generate_all_samples():
    """Generates synthetic fundus samples for all 5 DR severity categories."""
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    sample_files = [
        ("sample_0_no_dr.jpg", 0),
        ("sample_1_mild_dr.jpg", 1),
        ("sample_2_moderate_dr.jpg", 2),
        ("sample_3_severe_dr.jpg", 3),
        ("sample_4_proliferative_dr.jpg", 4),
    ]
    paths = {}
    for filename, stage in sample_files:
        p = create_synthetic_fundus(stage=stage, filename=filename)
        paths[stage] = p
        print(f"[Sample Generator] Created Stage {stage} sample: {p.name}")
    return paths

if __name__ == "__main__":
    generate_all_samples()
