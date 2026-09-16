import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  ArrowLeft,
  Calendar,
  Activity,
  User,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { getPatients, addScanToPatient } from '../api/patientsApi';
import { diagnoseScan } from '../api/diagnosticApi';
import { Dropzone } from '../components/upload/Dropzone';
import { ImagePreview } from '../components/upload/ImagePreview';
import { SampleScansSelector } from '../components/upload/SampleScansSelector';
import { ClinicalDisclaimer } from '../components/common/ClinicalDisclaimer';
import { Toast } from '../components/common/Toast';

export function ScanUpload() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [eye, setEye] = useState('OD (Right Eye)');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Processing / loading state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  const ANALYSIS_STEPS = [
    'Validating fundus optical clarity & foveal illumination...',
    'Extracting deep retinal microvascular features...',
    'Classifying DR Severity index (Grade 0 - 4)...',
    'Synthesizing Grad-CAM model attention localization...',
    'Performing longitudinal delta comparison against patient baseline...',
  ];

  useEffect(() => {
    async function loadPatients() {
      try {
        const { data } = await getPatients();
        setPatients(data || []);
        if (!selectedPatientId && data && data.length > 0) {
          setSelectedPatientId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadPatients();
  }, []);

  function handleFileSelected(selectedFile) {
    setFile(selectedFile);
    setSelectedSampleId(null);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  }

  function handleSampleSelected(sample) {
    setFile(null);
    setSelectedSampleId(sample.id);
    setPreviewUrl(sample.imageUrl);
    if (sample.eye) setEye(sample.eye);
  }

  function handleRemoveImage() {
    setFile(null);
    setPreviewUrl(null);
    setSelectedSampleId(null);
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!previewUrl) {
      setToastMessage({ message: 'Please upload or select a retinal fundus scan first.', type: 'warning' });
      return;
    }
    if (!selectedPatientId) {
      setToastMessage({ message: 'Please select a patient for this scan record.', type: 'warning' });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);

    // Realistic step progression
    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      // Call diagnostic service layer
      const payload = file || previewUrl;
      const { data: diagnosticResult } = await diagnoseScan(payload, {
        sampleId: selectedSampleId,
        patientId: selectedPatientId,
        eye,
      });

      clearInterval(stepInterval);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);

      // Save scan to patient history
      const scanRecord = {
        id: `scan-${Date.now()}`,
        visitDate,
        eye,
        severity: diagnosticResult.severity,
        severityIndex: diagnosticResult.severity_index,
        confidence: diagnosticResult.confidence,
        quality: diagnosticResult.quality,
        imageUrl: diagnosticResult.image_url || previewUrl,
        evidenceUrl: diagnosticResult.evidence_url,
        notes: notes.trim() || 'Clinical fundus evaluation.',
      };

      const { data: savedScan } = await addScanToPatient(selectedPatientId, scanRecord);

      // Brief delay so user sees completion, then navigate to Results
      setTimeout(() => {
        setIsAnalyzing(false);
        navigate(`/results/${savedScan.id}`);
      }, 500);
    } catch (err) {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      console.error(err);
      setToastMessage({ message: 'Error during diagnostic inference. Please retry.', type: 'warning' });
    }
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Retinal Fundus Intake &amp; AI Analysis
            </h1>
            <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full font-medium">
              Diagnostic Intake
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Submit a color fundus photography scan for automated DR severity grading and longitudinal trajectory integration.
          </p>
        </div>

        <Link
          to={selectedPatientId ? `/patients/${selectedPatientId}` : '/patients'}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </Link>
      </div>

      {/* Main intake form */}
      <form onSubmit={handleAnalyze} className="flex flex-col gap-6">
        {/* Step 1: Patient Context Selection */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-xs font-bold">
              1
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
              Patient Attribution
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assign Scan to Patient
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                disabled={isAnalyzing}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-teal-500 font-medium text-slate-900"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.patientIdentifier} — {p.name} ({p.age}y, {p.latestSeverity} • {p.totalScans} prior scans)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Visit Examination Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  disabled={isAnalyzing}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-teal-500 text-slate-900"
                />
              </div>
            </div>
          </div>

          {selectedPatient && selectedPatient.scans && selectedPatient.scans.length > 0 && (
            <div className="mt-3.5 p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Prior Diagnostic Record Available: <strong className="text-slate-800">{selectedPatient.latestSeverity}</strong> ({selectedPatient.latestScanDate})
              </span>
              <span className="text-[10px] uppercase font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-semibold">
                Longitudinal Engine Active
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Retinal Fundus Upload or Sample Selection */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-xs font-bold">
                2
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                Fundus Photography Image
              </h3>
            </div>
            {previewUrl && (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Scan Staged</span>
              </span>
            )}
          </div>

          {/* Quick preset selector for judges */}
          <SampleScansSelector
            onSelectSample={handleSampleSelected}
            selectedSampleId={selectedSampleId}
            disabled={isAnalyzing}
          />

          {/* Dropzone or Preview */}
          {!previewUrl ? (
            <Dropzone onFileSelected={handleFileSelected} disabled={isAnalyzing} />
          ) : (
            <ImagePreview
              file={file}
              previewUrl={previewUrl}
              onRemove={handleRemoveImage}
              onReplace={handleRemoveImage}
              eye={eye}
              setEye={setEye}
              disabled={isAnalyzing}
            />
          )}

          {/* Clinical indication / notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Clinical Indication / Examination Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Annual diabetic retinopathy surveillance, macula-centered, dilation completed."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isAnalyzing}
              className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-md focus:outline-none focus:border-teal-500 focus:bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Step 3: Analysis Execution Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col gap-4">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-3 border-teal-100 border-t-teal-600 animate-spin" />
                <Eye size={20} className="absolute inset-0 m-auto text-teal-700" />
              </div>

              <div className="text-center">
                <div className="font-semibold text-slate-900 text-sm">
                  ProgressIQ Diagnostic Inference Running...
                </div>
                <div className="text-xs text-teal-700 font-mono mt-1 animate-pulse">
                  {ANALYSIS_STEPS[analysisStep]}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-teal-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={16} className="text-teal-600 shrink-0" />
                <span>
                  Classification will automatically link to previous scans to calculate longitudinal progression.
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!previewUrl}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-md text-xs font-bold text-white transition-all shadow-sm ${
                    previewUrl
                      ? 'bg-teal-600 hover:bg-teal-700 cursor-pointer'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Sparkles size={14} />
                  <span>Run AI Diagnostic Analysis</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Safety notice */}
      <ClinicalDisclaimer />

      {/* Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
