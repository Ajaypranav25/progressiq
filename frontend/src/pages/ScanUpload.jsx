import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPatients, addScanToPatient } from '../api/patientsApi';
import { SAMPLE_FUNDUS_SCANS } from '../api/mockData';

export function ScanUpload() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [selectedSample, setSelectedSample] = useState(SAMPLE_FUNDUS_SCANS[2]); // Default to Severe sample
  const [eye, setEye] = useState('OD (Right Eye)');
  const [modality, setModality] = useState('Optos UWF 200° + Zeiss Cirrus HD-OCT');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Annual diabetic retinal surveillance protocol. Suspected macular microvascular shift.');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const ANALYSIS_STEPS = [
    'Optical clarity verification (Clarity Index: 0.97)...',
    'ETDRS 9-Grid Macular Registration & Foveal Centering...',
    'ResNet-50 Microvascular Lesion & Hemorrhage Extraction...',
    'Synthesizing Grad-CAM Visual Attention Heatmap...',
    'Longitudinal Delta Comparison against Prior Patient Scans...',
  ];

  useEffect(() => {
    async function load() {
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
    load();
  }, [selectedPatientId]);

  const handleRunInference = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    setIsAnalyzing(true);
    setAnalysisStep(0);

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysisStep(i);
      await new Promise((resolve) => setTimeout(resolve, 380));
    }

    try {
      // Ingest into selected patient
      const newScanData = {
        patientId: selectedPatientId,
        visitDate,
        eye,
        severity: selectedSample.severity,
        severityIndex: selectedSample.severityIndex,
        confidence: selectedSample.confidence,
        quality: selectedSample.quality,
        imageUrl: selectedSample.imageUrl,
        evidenceUrl: selectedSample.evidenceUrl,
        notes,
      };

      const { data: savedScan } = await addScanToPatient(selectedPatientId, newScanData);
      navigate(`/results/${savedScan.id}`);
    } catch (err) {
      console.error(err);
      navigate('/results/scan-103');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  return (
    <div className="py-2 md:py-6 space-y-6">
      {/* HEADER */}
      <div className="glass-station rounded-2xl p-6 border border-surface-variant/40 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-80 h-80 aura-backdrop opacity-50 pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">upload_file</span>
              <h1 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">
                Fundus Scan Upload &amp; AI Analysis Pipeline
              </h1>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Co-register current Ultra-Widefield fundus scan with patient history for longitudinal diagnostic evaluation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs px-3 py-1 rounded bg-primary/15 text-primary border border-primary/25 font-mono">
              RetinaDelta v4.1 Ingestion Gate
            </span>
          </div>
        </div>
      </div>

      {/* WORKFLOW FORM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Ingestion & Sample Scans */}
        <div className="lg:col-span-7 space-y-6">
          {/* File Dropzone */}
          <div className="glass-station rounded-2xl p-6 border border-surface-variant/40 space-y-4 shadow-xl">
            <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">add_photo_alternate</span>
              <span>1. Current Retinal Fundus Photography or OCT DICOM</span>
            </h2>

            <div className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center hover:border-primary transition bg-surface-container-lowest/60">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                <span className="material-symbols-outlined text-[32px]">upload_file</span>
              </div>
              <h3 className="text-sm font-bold text-on-surface">Drag &amp; Drop Retinal Scans</h3>
              <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                Accepts DICOM (.dcm), Optos UWF (.tiff, .png, .jpg), and Heidelberg / Zeiss SD-OCT volumes.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-on-surface-variant">
                <span className="px-2.5 py-1 rounded bg-surface-container border border-white/5">Auto-ETDRS Alignment</span>
                <span className="px-2.5 py-1 rounded bg-surface-container border border-white/5">Auto-Quality Check</span>
              </div>
            </div>
          </div>

          {/* Clinical Demo Scans Quick-Select */}
          <div className="glass-station rounded-2xl p-6 border border-surface-variant/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">collections</span>
                <span>2. Or Select Pre-loaded Clinical Demo Fundus Scans</span>
              </h2>
              <span className="text-[11px] text-primary font-medium">Standardized Benchmarks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_FUNDUS_SCANS.map((sample) => {
                const isSelected = selectedSample?.id === sample.id;
                return (
                  <div
                    key={sample.id}
                    onClick={() => setSelectedSample(sample)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                        : 'bg-surface-container-lowest/80 border-surface-variant/40 hover:border-surface-variant'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-black overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                      <img src={sample.imageUrl} alt={sample.label} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-on-surface truncate">{sample.label}</div>
                      <div className="text-[11px] text-on-surface-variant line-clamp-1">{sample.description}</div>
                      <div className="text-[10px] text-primary font-mono mt-0.5">
                        Conf: {(sample.confidence * 100).toFixed(0)}% • {sample.eye}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Patient Metadata & Trigger */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleRunInference} className="glass-station rounded-2xl p-6 border border-surface-variant/40 space-y-5 shadow-2xl">
            <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">clinical_notes</span>
              <span>3. Longitudinal Patient Matching</span>
            </h2>

            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Assign to Monitored Patient
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border border-surface-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id} className="bg-surface-container text-on-surface">
                    {p.name} ({p.patientIdentifier}) — {p.latestSeverity}
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div className="p-3.5 rounded-xl bg-surface-container-lowest/80 border border-white/5 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Active Monitored History:</span>
                  <span className="text-on-surface font-semibold">{selectedPatient.totalScans} Prior Scans</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Baseline Severity:</span>
                  <span className="text-primary font-medium">{selectedPatient.latestSeverity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Trajectory Status:</span>
                  <span className="text-error font-medium">{selectedPatient.trajectoryStatus}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Laterality (Eye)
                </label>
                <select
                  value={eye}
                  onChange={(e) => setEye(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="OD (Right Eye)">OD (Right Eye)</option>
                  <option value="OS (Left Eye)">OS (Left Eye)</option>
                  <option value="OU (Both Eyes)">OU (Both Eyes)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Imaging Hardware Modality
              </label>
              <input
                type="text"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Clinical Indication Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-variant/60 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* PIPELINE PROGRESS FEEDBACK */}
            {isAnalyzing ? (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-3">
                <div className="flex items-center justify-between text-xs text-primary font-semibold">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span>Inference Pipeline Running...</span>
                  </span>
                  <span>{Math.round(((analysisStep + 1) / ANALYSIS_STEPS.length) * 100)}%</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-on-surface font-mono">{ANALYSIS_STEPS[analysisStep]}</div>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-primary-container text-on-primary font-bold text-sm hover:bg-primary transition shadow-[0_0_18px_rgba(56,189,248,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">biotech</span>
                <span>Run AI Diagnostic Inference &amp; Compare</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
