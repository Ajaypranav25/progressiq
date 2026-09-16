"""
ProgressIQ - FastAPI Application Entrypoint
Backend Developer 2 (Person 4) Image Layer + Person 5 Integration Host

Runs the image processing and longitudinal comparison server,
serves static media artifacts, and provides CORS for the React workstation UI.
"""

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.storage import MEDIA_ROOT, default_storage
from backend.routers.image_compare import router as image_compare_router

app = FastAPI(
    title="ProgressIQ - Diagnostic Intelligence API",
    description="Longitudinal diabetic retinopathy image processing, Grad-CAM evidence localization, and comparison service.",
    version="1.0.0",
)

# Enable CORS for frontend development servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure media directory exists and mount static media files
default_storage._ensure_directories()
app.mount("/media", StaticFiles(directory=str(MEDIA_ROOT)), name="media")

# Include Image Processing & Comparison Router
app.include_router(image_compare_router)


@app.get("/api/health", tags=["System"])
def health_check():
    """Health check verifying API status and media storage access."""
    return {
        "status": "healthy",
        "service": "ProgressIQ Diagnostic Intelligence",
        "layer": "Image & Evidence Processing Layer (Person 4)",
        "media_root": str(MEDIA_ROOT),
        "disclaimer": "Research and hackathon prototype. Not for primary clinical diagnosis.",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
