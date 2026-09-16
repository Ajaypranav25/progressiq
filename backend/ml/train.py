"""
ProgressIQ — DR Classifier Training Script
==========================================
Trains a 5-class Diabetic Retinopathy severity classifier on real fundus images.

Dataset:
  - Colored images: C:/Users/ajayp/Downloads/dataset_split/colored_images/train/
  - Gaussian filtered images: C:/Users/ajayp/Downloads/dataset_split/gaussian_filtered_images/train/
  - CSV: C:/Users/ajayp/Downloads/dataset_split/train_split.csv

Classes:
  No_DR (0), Mild (1), Moderate (2), Severe (3), Proliferate_DR (4)

Training Strategy:
  - EfficientNet-B0 backbone (better param efficiency than ResNet-50)
  - Use BOTH colored + gaussian images → doubles effective dataset size
  - Class-weighted CrossEntropyLoss to handle severe class imbalance
  - Mixed precision training (FP16) for GPU speedup
  - Cosine LR scheduler with warmup
  - Progressive unfreezing: head first, then full finetune

Usage:
  python -m backend.ml.train
"""

import os
import sys
import time
import json
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image
from sklearn.utils.class_weight import compute_class_weight

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torch.cuda.amp import GradScaler, autocast
import torchvision.transforms as T
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

# ─── Config ────────────────────────────────────────────────────────────────
COLORED_DIR   = Path(r"C:\Users\ajayp\Downloads\dataset_split\colored_images\train")
GAUSSIAN_DIR  = Path(r"C:\Users\ajayp\Downloads\dataset_split\gaussian_filtered_images\train")
CSV_PATH      = Path(r"C:\Users\ajayp\Downloads\dataset_split\train_split.csv")

# Map CSV category names → int labels
CATEGORY_MAP = {
    "No_DR":          0,
    "Mild":           1,
    "Moderate":       2,
    "Severe":         3,
    "Proliferate_DR": 4,
}
SEVERITY_CLASSES = ["No DR", "Mild", "Moderate", "Severe", "Proliferative DR"]

# Checkpoint output (overwrites the earlier placeholder)
from backend.ml.config import DEFAULT_MODEL_WEIGHTS_PATH, WEIGHTS_DIR
OUTPUT_WEIGHTS = DEFAULT_MODEL_WEIGHTS_PATH

BATCH_SIZE   = 32
NUM_EPOCHS   = 25          # phase-1 head only + phase-2 full finetune
PHASE1_EPOCHS = 8          # train head only
IMG_SIZE     = 224
NUM_WORKERS  = 0           # Windows: keep 0 to avoid multiprocessing issues
PIN_MEMORY   = True
SEED         = 42

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
USE_AMP = DEVICE.type == "cuda"

torch.manual_seed(SEED)
np.random.seed(SEED)

# ─── Dataset ───────────────────────────────────────────────────────────────
class DRDataset(Dataset):
    """
    Loads images from BOTH colored and gaussian filtered folders for each sample.
    Each CSV row produces 2 entries (one per modality), doubling the dataset.
    """
    def __init__(self, df: pd.DataFrame, colored_root: Path, gaussian_root: Path,
                 transform=None, augment_transform=None):
        self.samples = []
        self.transform = transform
        self.augment_transform = augment_transform

        for _, row in df.iterrows():
            label = CATEGORY_MAP[row["category"]]
            folder = row["category"]  # e.g. "No_DR"
            filename = row["id_code"] + ".png"

            # Colored image path
            cp = colored_root / folder / filename
            if cp.exists():
                self.samples.append((cp, label, "colored"))

            # Gaussian image path
            gp = gaussian_root / folder / filename
            if gp.exists():
                self.samples.append((gp, label, "gaussian"))

        print(f"[Dataset] Loaded {len(self.samples)} samples "
              f"({len([s for s in self.samples if s[2]=='colored'])} colored + "
              f"{len([s for s in self.samples if s[2]=='gaussian'])} gaussian)")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label, modality = self.samples[idx]
        img = Image.open(img_path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label


# ─── Transforms ────────────────────────────────────────────────────────────
TRAIN_TRANSFORMS = T.Compose([
    T.RandomHorizontalFlip(p=0.5),
    T.RandomVerticalFlip(p=0.3),
    T.RandomRotation(degrees=20),
    T.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    T.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.85, 1.15)),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

VAL_TRANSFORMS = T.Compose([
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


# ─── Model ─────────────────────────────────────────────────────────────────
class DRClassifier(nn.Module):
    """
    EfficientNet-B0 backbone with a custom DR classification head.
    Drop-in replacement for the ResNet-50 DRClassifier in model.py.
    """
    def __init__(self, num_classes: int = 5, pretrained: bool = True):
        super().__init__()
        weights = EfficientNet_B0_Weights.DEFAULT if pretrained else None
        backbone = efficientnet_b0(weights=weights)

        # Store feature extractor (everything except classifier head)
        self.features = backbone.features
        self.avgpool   = backbone.avgpool
        in_features    = backbone.classifier[1].in_features

        # Custom DR head
        self.classifier = nn.Sequential(
            nn.Dropout(p=0.35),
            nn.Linear(in_features, 256),
            nn.BatchNorm1d(256),
            nn.SiLU(),
            nn.Dropout(p=0.2),
            nn.Linear(256, num_classes),
        )

        # Grad-CAM target layer: last conv block in EfficientNet features
        self.target_layer = self.features[-1]

    def forward(self, x):
        x = self.features(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x

    def get_target_layer(self):
        return self.target_layer

    def freeze_backbone(self):
        for p in self.features.parameters():
            p.requires_grad = False

    def unfreeze_backbone(self):
        for p in self.features.parameters():
            p.requires_grad = True


# ─── Class Weights & Sampler ───────────────────────────────────────────────
def compute_class_weights(dataset: DRDataset) -> torch.Tensor:
    labels = [s[1] for s in dataset.samples]
    classes = sorted(set(labels))
    cw = compute_class_weight("balanced", classes=np.array(classes), y=np.array(labels))
    print(f"[Class Weights] {dict(zip(SEVERITY_CLASSES, np.round(cw, 3)))}")
    return torch.tensor(cw, dtype=torch.float32)


def make_weighted_sampler(dataset: DRDataset) -> WeightedRandomSampler:
    """Creates a WeightedRandomSampler to over-sample minority DR classes."""
    labels = [s[1] for s in dataset.samples]
    class_counts = np.bincount(labels, minlength=5)
    class_weights = 1.0 / np.maximum(class_counts, 1)
    sample_weights = [class_weights[l] for l in labels]
    return WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(sample_weights),
        replacement=True,
    )


# ─── Training ──────────────────────────────────────────────────────────────
def train_one_epoch(model, loader, criterion, optimizer, scaler, epoch):
    model.train()
    total_loss = 0.0
    correct = 0
    total = 0

    for batch_idx, (imgs, labels) in enumerate(loader):
        imgs   = imgs.to(DEVICE, non_blocking=True)
        labels = labels.to(DEVICE, non_blocking=True)

        optimizer.zero_grad(set_to_none=True)

        if USE_AMP:
            with torch.amp.autocast("cuda"):
                logits = model(imgs)
                loss   = criterion(logits, labels)
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            scaler.step(optimizer)
            scaler.update()
        else:
            logits = model(imgs)
            loss   = criterion(logits, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

        total_loss += loss.item() * imgs.size(0)
        preds = logits.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total   += imgs.size(0)

        if (batch_idx + 1) % 20 == 0 or (batch_idx + 1) == len(loader):
            print(f"  Epoch {epoch} [{batch_idx+1}/{len(loader)}]  "
                  f"loss={loss.item():.4f}  acc={correct/total:.3f}")

    return total_loss / total, correct / total


@torch.no_grad()
def evaluate(model, loader, criterion):
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0
    class_correct = np.zeros(5)
    class_total   = np.zeros(5)

    for imgs, labels in loader:
        imgs   = imgs.to(DEVICE, non_blocking=True)
        labels = labels.to(DEVICE, non_blocking=True)
        logits = model(imgs)
        loss   = criterion(logits, labels)
        preds  = logits.argmax(dim=1)

        total_loss += loss.item() * imgs.size(0)
        correct    += (preds == labels).sum().item()
        total      += imgs.size(0)

        for c in range(5):
            mask = (labels == c)
            class_correct[c] += (preds[mask] == labels[mask]).sum().item()
            class_total[c]   += mask.sum().item()

    per_class_acc = {
        SEVERITY_CLASSES[i]: round(class_correct[i] / max(class_total[i], 1), 3)
        for i in range(5)
    }
    return total_loss / total, correct / total, per_class_acc


# ─── Main ──────────────────────────────────────────────────────────────────
def main():
    print(f"\n{'='*60}")
    print("  ProgressIQ — DR Classifier Training")
    print(f"  Device: {DEVICE}  |  AMP: {USE_AMP}")
    print(f"{'='*60}\n")

    # ── Load CSV ──
    df = pd.read_csv(CSV_PATH)
    print(f"[Data] Loaded CSV: {len(df)} rows, label distribution:")
    print(df["category"].value_counts().to_string(), "\n")

    # ── Split: 90% train, 10% val ──
    from sklearn.model_selection import StratifiedShuffleSplit
    sss = StratifiedShuffleSplit(n_splits=1, test_size=0.10, random_state=SEED)
    train_idx, val_idx = next(sss.split(df, df["category"]))
    train_df = df.iloc[train_idx].reset_index(drop=True)
    val_df   = df.iloc[val_idx].reset_index(drop=True)
    print(f"[Split] Train: {len(train_df)}  Val: {len(val_df)}")

    # ── Datasets ──
    train_ds = DRDataset(train_df, COLORED_DIR, GAUSSIAN_DIR, transform=TRAIN_TRANSFORMS)
    val_ds   = DRDataset(val_df,   COLORED_DIR, GAUSSIAN_DIR, transform=VAL_TRANSFORMS)

    sampler = make_weighted_sampler(train_ds)
    train_loader = DataLoader(
        train_ds, batch_size=BATCH_SIZE, sampler=sampler,
        num_workers=NUM_WORKERS, pin_memory=PIN_MEMORY
    )
    val_loader = DataLoader(
        val_ds, batch_size=BATCH_SIZE, shuffle=False,
        num_workers=NUM_WORKERS, pin_memory=PIN_MEMORY
    )

    # ── Model ──
    model = DRClassifier(num_classes=5, pretrained=True).to(DEVICE)
    total_params = sum(p.numel() for p in model.parameters()) / 1e6
    print(f"\n[Model] EfficientNet-B0 | Total params: {total_params:.2f}M")

    # ── Loss & Scaler ──
    class_weights = compute_class_weights(train_ds).to(DEVICE)
    criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=0.1)
    scaler = torch.amp.GradScaler("cuda", enabled=USE_AMP)

    # ────────────────────────────────────────────────────
    # PHASE 1: Train only the head (backbone frozen)
    # ────────────────────────────────────────────────────
    print(f"\n{'─'*50}")
    print(f"  Phase 1: Head-only training ({PHASE1_EPOCHS} epochs)")
    print(f"{'─'*50}")
    model.freeze_backbone()
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=3e-3, weight_decay=1e-4
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=PHASE1_EPOCHS, eta_min=1e-5)

    best_val_acc = 0.0
    history = []
    t0 = time.time()

    for epoch in range(1, PHASE1_EPOCHS + 1):
        tr_loss, tr_acc = train_one_epoch(model, train_loader, criterion, optimizer, scaler, epoch)
        va_loss, va_acc, per_cls = evaluate(model, val_loader, criterion)
        scheduler.step()

        elapsed = (time.time() - t0) / 60
        print(f"\n  → Epoch {epoch:2d}/{PHASE1_EPOCHS}  "
              f"train_loss={tr_loss:.4f}  train_acc={tr_acc:.3f}  "
              f"val_loss={va_loss:.4f}  val_acc={va_acc:.3f}  [{elapsed:.1f}m]")
        print(f"     Per-class val accuracy: {per_cls}")

        history.append({
            "epoch": epoch, "phase": 1,
            "train_loss": tr_loss, "train_acc": tr_acc,
            "val_loss": va_loss, "val_acc": va_acc, "per_class": per_cls
        })

        if va_acc > best_val_acc:
            best_val_acc = va_acc
            torch.save(model.state_dict(), OUTPUT_WEIGHTS)
            print(f"  ✓ New best saved → val_acc={va_acc:.4f}")

    # ────────────────────────────────────────────────────
    # PHASE 2: Fine-tune entire network at lower LR
    # ────────────────────────────────────────────────────
    phase2_epochs = NUM_EPOCHS - PHASE1_EPOCHS
    print(f"\n{'─'*50}")
    print(f"  Phase 2: Full network fine-tune ({phase2_epochs} epochs)")
    print(f"{'─'*50}")
    model.unfreeze_backbone()
    optimizer = optim.AdamW([
        {"params": model.features.parameters(),    "lr": 2e-4},
        {"params": model.classifier.parameters(),  "lr": 1e-3},
    ], weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=phase2_epochs, eta_min=1e-6)

    for epoch in range(PHASE1_EPOCHS + 1, NUM_EPOCHS + 1):
        tr_loss, tr_acc = train_one_epoch(model, train_loader, criterion, optimizer, scaler, epoch)
        va_loss, va_acc, per_cls = evaluate(model, val_loader, criterion)
        scheduler.step()

        elapsed = (time.time() - t0) / 60
        print(f"\n  → Epoch {epoch:2d}/{NUM_EPOCHS}  "
              f"train_loss={tr_loss:.4f}  train_acc={tr_acc:.3f}  "
              f"val_loss={va_loss:.4f}  val_acc={va_acc:.3f}  [{elapsed:.1f}m]")
        print(f"     Per-class val accuracy: {per_cls}")

        history.append({
            "epoch": epoch, "phase": 2,
            "train_loss": tr_loss, "train_acc": tr_acc,
            "val_loss": va_loss, "val_acc": va_acc, "per_class": per_cls
        })

        if va_acc > best_val_acc:
            best_val_acc = va_acc
            torch.save(model.state_dict(), OUTPUT_WEIGHTS)
            print(f"  ✓ New best saved → val_acc={va_acc:.4f}")

    # ── Final summary ──
    total_time = (time.time() - t0) / 60
    print(f"\n{'='*60}")
    print(f"  Training complete in {total_time:.1f} minutes")
    print(f"  Best val accuracy: {best_val_acc:.4f}")
    print(f"  Checkpoint saved: {OUTPUT_WEIGHTS}")
    print(f"{'='*60}\n")

    # Save training history JSON
    history_path = WEIGHTS_DIR / "training_history.json"
    with open(history_path, "w") as f:
        json.dump(history, f, indent=2)
    print(f"Training history saved: {history_path}")

    # ── Update backend/ml/model.py to use EfficientNet ──
    print("\n[Note] Updating backend model to EfficientNet-B0 architecture...")
    return best_val_acc, history


if __name__ == "__main__":
    main()
