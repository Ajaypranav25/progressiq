import { apiClient } from './client';
import { INITIAL_PATIENTS } from './mockData';
import { computeTrajectory } from '../utils/formatters';

const STORAGE_KEY = 'progressiq_patients_v1';

function getStoredPatients() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read from localStorage', e);
  }
  return INITIAL_PATIENTS;
}

function saveStoredPatients(patients) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  } catch (e) {
    console.warn('Could not save to localStorage', e);
  }
}

/**
 * Fetch all patients
 */
export async function getPatients() {
  try {
    const response = await apiClient.get('/patients');
    return { data: response.data, source: 'backend' };
  } catch {
    // Graceful fallback to mock data
    const patients = getStoredPatients();
    return { data: patients, source: 'mock' };
  }
}

/**
 * Fetch a single patient by ID
 */
export async function getPatientById(patientId) {
  try {
    const response = await apiClient.get(`/patients/${patientId}`);
    return { data: response.data, source: 'backend' };
  } catch {
    const patients = getStoredPatients();
    const patient = patients.find((p) => p.id === patientId || p.patientIdentifier === patientId);
    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }
    return { data: patient, source: 'mock' };
  }
}

/**
 * Fetch scan history for a patient
 */
export async function getPatientScans(patientId) {
  try {
    const response = await apiClient.get(`/patients/${patientId}/scans`);
    return { data: response.data, source: 'backend' };
  } catch {
    const patients = getStoredPatients();
    const patient = patients.find((p) => p.id === patientId || p.patientIdentifier === patientId);
    return { data: patient ? patient.scans || [] : [], source: 'mock' };
  }
}

/**
 * Create a new demo patient
 */
export async function createPatient(patientData) {
  try {
    const response = await apiClient.post('/patients', patientData);
    return { data: response.data, source: 'backend' };
  } catch {
    const patients = getStoredPatients();
    const newId = `p-${String(patients.length + 1).padStart(3, '0')}`;
    const newIdentifier = `PIQ-${8400 + patients.length + 1}`;
    const newPatient = {
      id: newId,
      patientIdentifier: newIdentifier,
      name: patientData.name || `Demo Patient ${patients.length + 1}`,
      isDemo: true,
      age: Number(patientData.age) || 50,
      gender: patientData.gender || 'Not specified',
      diabetesType: patientData.diabetesType || 'Type 2 Diabetes',
      createdAt: new Date().toISOString(),
      latestSeverity: 'No Scans Yet',
      latestSeverityIndex: null,
      latestConfidence: null,
      latestScanDate: null,
      totalScans: 0,
      trajectoryStatus: 'stable',
      trajectoryMessage: 'Awaiting baseline retinal scan.',
      requiresReview: false,
      scans: [],
    };
    const updated = [newPatient, ...patients];
    saveStoredPatients(updated);
    return { data: newPatient, source: 'mock' };
  }
}

/**
 * Add an analyzed scan to a patient's longitudinal record
 */
export async function addScanToPatient(patientId, scanRecord) {
  try {
    const response = await apiClient.post('/scans', {
      patient_id: patientId,
      ...scanRecord,
    });
    return { data: response.data, source: 'backend' };
  } catch {
    const patients = getStoredPatients();
    const index = patients.findIndex((p) => p.id === patientId || p.patientIdentifier === patientId);
    if (index === -1) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    const patient = { ...patients[index] };
    const prevScan = patient.scans && patient.scans.length > 0 ? patient.scans[patient.scans.length - 1] : null;

    const newScan = {
      id: scanRecord.id || `scan-${Date.now()}`,
      patientId: patient.id,
      visitDate: scanRecord.visitDate || new Date().toISOString().split('T')[0],
      severity: scanRecord.severity,
      severityIndex: scanRecord.severityIndex,
      confidence: scanRecord.confidence,
      quality: scanRecord.quality || 'good',
      eye: scanRecord.eye || 'OD (Right Eye)',
      imageUrl: scanRecord.imageUrl,
      evidenceUrl: scanRecord.evidenceUrl,
      modelVersion: scanRecord.modelVersion || 'ResNet50-DR-v2.1',
      notes: scanRecord.notes || 'Routine longitudinal evaluation.',
    };

    const updatedScans = [...(patient.scans || []), newScan];
    const prevIndex = prevScan ? prevScan.severityIndex : null;
    const trajectory = computeTrajectory(prevIndex, newScan.severityIndex);

    let trajMessage = 'Stable diagnostic profile.';
    if (prevScan) {
      if (newScan.severityIndex > prevScan.severityIndex) {
        trajMessage = `Increased severity detected between available scans (${prevScan.severity} → ${newScan.severity}).`;
      } else if (newScan.severityIndex < prevScan.severityIndex) {
        trajMessage = `Decreased severity detected between available scans (${prevScan.severity} → ${newScan.severity}).`;
      } else {
        trajMessage = `Stable diagnostic observations across visits (${newScan.severity}).`;
      }
    }

    patient.scans = updatedScans;
    patient.totalScans = updatedScans.length;
    patient.latestSeverity = newScan.severity;
    patient.latestSeverityIndex = newScan.severityIndex;
    patient.latestConfidence = newScan.confidence;
    patient.latestScanDate = newScan.visitDate;
    patient.trajectoryStatus = trajectory.status;
    patient.trajectoryMessage = trajMessage;
    patient.requiresReview = trajectory.status === 'increased_severity';

    patients[index] = patient;
    saveStoredPatients(patients);
    return { data: newScan, patient, source: 'mock' };
  }
}

/**
 * Reset mock data to default
 */
export function resetMockData() {
  saveStoredPatients(INITIAL_PATIENTS);
  return INITIAL_PATIENTS;
}
