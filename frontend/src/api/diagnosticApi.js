import { apiClient } from './client';
import { DR_SEVERITY } from '../utils/constants';
import { SAMPLE_FUNDUS_SCANS } from './mockData';

/**
 * Runs AI diagnostic inference on a fundus image.
 * Calls backend POST /api/diagnose with fallback to client simulation.
 */
export async function diagnoseScan(imagePayload, metadata = {}) {
  // If we have a File object, prepare FormData
  if (imagePayload instanceof File) {
    const formData = new FormData();
    formData.append('file', imagePayload);
    if (metadata.eye) formData.append('eye', metadata.eye);
    if (metadata.patientId) formData.append('patient_id', metadata.patientId);

    try {
      const response = await apiClient.post('/diagnose', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10000,
      });
      return { data: response.data, source: 'backend' };
    } catch {
      console.info('Backend unavailable for /diagnose, falling back to simulated inference.');
    }
  }

  // Fallback simulated inference with realistic pipeline delay
  await new Promise((resolve) => setTimeout(resolve, 1400));

  // Determine severity from matched sample or heuristic
  let matchedSample = null;
  if (metadata.sampleId) {
    matchedSample = SAMPLE_FUNDUS_SCANS.find((s) => s.id === metadata.sampleId);
  }

  if (matchedSample) {
    return {
      data: {
        severity: matchedSample.severity,
        severity_index: matchedSample.severityIndex,
        confidence: matchedSample.confidence,
        quality: matchedSample.quality,
        evidence_url: matchedSample.evidenceUrl,
        image_url: matchedSample.imageUrl,
        model_version: 'ResNet50-DR-v2.1',
        quality_metrics: {
          illumination: 'adequate',
          focus: 'sharp',
          macula_visibility: 'clear',
        },
      },
      source: 'mock',
    };
  }

  // Default simulated prediction (Moderate DR)
  const defaultSeverity = DR_SEVERITY[2];
  return {
    data: {
      severity: defaultSeverity.label,
      severity_index: 2,
      confidence: 0.87,
      quality: 'good',
      evidence_url: SAMPLE_FUNDUS_SCANS[1].evidenceUrl,
      image_url: typeof imagePayload === 'string' ? imagePayload : SAMPLE_FUNDUS_SCANS[1].imageUrl,
      model_version: 'ResNet50-DR-v2.1',
      quality_metrics: {
        illumination: 'adequate',
        focus: 'sharp',
        macula_visibility: 'clear',
      },
    },
    source: 'mock',
  };
}

/**
 * Compares previous and current diagnostic observations.
 * Calls backend POST /api/compare with fallback.
 */
export async function compareScans(previous, current) {
  try {
    const response = await apiClient.post('/compare', {
      previous: {
        severity: previous.severity,
        severity_index: previous.severityIndex,
        confidence: previous.confidence,
      },
      current: {
        severity: current.severity,
        severity_index: current.severityIndex,
        confidence: current.confidence,
      },
    });
    return { data: response.data, source: 'backend' };
  } catch {
    // Client-side comparison logic per Universal Context
    const prevIndex = Number(previous.severityIndex ?? previous.severity_index ?? 0);
    const currIndex = Number(current.severityIndex ?? current.severity_index ?? 0);
    const diff = currIndex - prevIndex;

    let status = 'stable';
    let message = 'Diagnostic evidence indicates stable severity between available visits.';

    if (diff > 0) {
      status = 'progression_detected';
      message = 'Model indicates increased severity between available scans.';
    } else if (diff < 0) {
      status = 'reduction_detected';
      message = 'Model indicates decreased severity between available scans.';
    }

    return {
      data: {
        status,
        previous_severity: previous.severity,
        current_severity: current.severity,
        severity_change: diff,
        message,
      },
      source: 'mock',
    };
  }
}
