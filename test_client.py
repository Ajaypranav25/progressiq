"""
Example test client demonstrating how frontend and backend team members
can invoke the ProgressIQ ML Diagnostic API.
"""

import sys
import json
import httpx
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
SAMPLE_DIR = Path(__file__).parent / "backend" / "static" / "samples"

def test_api():
    print(f"Connecting to ProgressIQ ML API at {BASE_URL}...")
    
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Health check
        try:
            r = client.get("/api/health")
            print("\n[GET /api/health]:", r.status_code)
            print(json.dumps(r.json(), indent=2))
        except Exception as e:
            print(f"Error connecting to {BASE_URL}: {e}")
            print("Make sure the backend server is running: uvicorn backend.main:app --reload --port 8000")
            return

        # 2. Get samples list
        r = client.get("/api/samples")
        print("\n[GET /api/samples]:", r.status_code)
        samples = r.json().get("samples", [])
        print(f"Available demo samples: {len(samples)}")

        # 3. Test diagnosis on a sample fundus image (e.g. Moderate DR)
        target_sample = SAMPLE_DIR / "sample_2_moderate_dr.jpg"
        if not target_sample.exists():
            print(f"Sample not found: {target_sample}")
            return
            
        print(f"\n[POST /api/diagnose] Uploading {target_sample.name}...")
        with open(target_sample, "rb") as f:
            files = {"file": (target_sample.name, f, "image/jpeg")}
            data = {
                "patient_id": "DEMO-PATIENT-001",
                "scan_id": "SCAN-2026-05",
                "generate_evidence": "true"
            }
            r = client.post("/api/diagnose", files=files, data=data)
            
        print("Response Code:", r.status_code)
        res_json = r.json()
        print(json.dumps(res_json, indent=2))
        
        print("\n--- Summary ---")
        print(f"Severity:        {res_json.get('severity')} (Index: {res_json.get('severity_index')})")
        print(f"Confidence:      {res_json.get('confidence'):.2%}")
        print(f"Quality:         {res_json.get('quality')}")
        print(f"Evidence URL:    {res_json.get('evidence_url')}")
        print("----------------")

if __name__ == "__main__":
    test_api()
