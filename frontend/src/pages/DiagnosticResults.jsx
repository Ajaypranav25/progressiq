import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Activity,
  Layers,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Download,
  Share2,
  FileText,
  Sliders,
  History,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { getPatients } from '../api/patientsApi';
import { compareScans } from '../api/diagnosticApi';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { TrajectoryBadge } from '../components/common/TrajectoryBadge';
import { ConfidenceBar } from '../components/common/ConfidenceBar';
import { ClinicalDisclaimer } from '../components/common/ClinicalDisclaimer';
import { formatDate, formatConfidence } from '../utils/formatters';

export function DiagnosticResults() {
  const { scanId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [currentScan, setCurrentScan] = useState(null);
  const [previousScan, setPreviousScan] = useState(null);
  const [comparison, setComparison] = useState(null);

  // Evidence viewer controls
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(85);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: patients } = await getPatients();

        // Find which patient owns this scan
        let matchedPatient = null;
        let matchedScan = null;

        for (const p of patients) {
          const s = (p.scans || []).find((item) => item.id === scanId);
          if (s) {
            matchedPatient = p;
            matchedScan = s;
            break;
          }
        }

        // Fallback: If not found by scan ID, take the first patient's latest scan
        if (!matchedScan && patients.length > 0) {
          matchedPatient = patients[0];
          matchedScan = matchedPatient.scans?.[matchedPatient.scans.length - 1];
        }

        if (matchedPatient && matchedScan) {
          setPatient(matchedPatient);
          setCurrentScan(matchedScan);

          // Find previous scan
          const explicitPrevId = searchParams.get('compareWith');
          let prev = null;
          if (explicitPrevId) {
            prev = matchedPatient.scans?.find((s) => s.id === explicitPrevId);
          }

          if (!prev) {
            // Find chronological previous scan
            const sorted = [...(matchedPatient.scans || [])].sort(
              (a, b) => new Date(a.visitDate) - new Date(b.visitDate)
            );
            const currIdx = sorted.findIndex((s) => s.id === matchedScan.id);
            if (currIdx > 0) {
              prev = sorted[currIdx - 1];
            }
          }

          setPreviousScan(prev);

          if (prev) {
            const compRes = await compareScans(prev, matchedScan);
            setComparison(compRes.data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [scanId, searchParams]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 text-xs">
        <Activity className="animate-spin mb-2" size={24} />
        <span>Loading diagnostic report and longitudinal evidence...</span>
      </div>
    );
  }

  if (!currentScan || !patient) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-lg text-center">
        <AlertTriangle className="mx-auto text-amber-500 mb-2" size={28} />
        <h3 className="font-semibold text-slate-800 text-sm">Diagnostic Scan Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">The requested scan ID could not be loaded.</p>
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-medium"
        >
          <ArrowLeft size={13} />
          <span>Back to Patients</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Top Clinical Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to={`/patients/${patient.id}`}
              className="text-slate-400 hover:text-slate-700 transition-colors"
              title="Return to patient dossier"
            >
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Diagnostic Results &amp; Longitudinal Context
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 pl-6">
            <span>Patient: <strong className="text-slate-900">{patient.name}</strong> ({patient.patientIdentifier})</span>
            <span>•</span>
            <span>Visit Date: <strong className="text-slate-900">{formatDate(currentScan.visitDate)}</strong></span>
            <span>•</span>
            <span>Eye: <strong className="text-slate-900">{currentScan.eye || 'OD (Right Eye)'}</strong></span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto pl-6 sm:pl-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-2xs"
          >
            <FileText size={13} className="text-slate-500" />
            <span>Print Report</span>
          </button>
          <Link
            to={`/upload?patientId=${patient.id}`}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-xs"
          >
            <span>Analyze Another Scan</span>
          </Link>
        </div>
      </div>

      {/* Primary Diagnosis & Confidence Hero Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Severity Classification */}
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Current Model Prediction
            </span>
            <div className="mt-1">
              <h2 className="text-xl font-bold text-slate-900">
                {currentScan.severity}
              </h2>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <SeverityBadge severity={currentScan.severityIndex} size="md" showIndex />
              <span className="text-[11px] text-slate-500 font-mono">
                ICDR Scale
              </span>
            </div>
          </div>

          {/* Confidence & Quality */}
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
            <ConfidenceBar confidence={currentScan.confidence} size="md" />
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="bg-slate-50 border border-slate-100 rounded p-1.5 text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Image Quality</span>
                <span className="font-semibold text-emerald-700 capitalize">{currentScan.quality || 'Good'}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded p-1.5 text-center">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Model Version</span>
                <span className="font-mono text-slate-700 text-[11px]">{currentScan.modelVersion || 'ResNet50-DR'}</span>
              </div>
            </div>
          </div>

          {/* Longitudinal Status Summary */}
          <div className="md:col-span-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Longitudinal Observation
            </span>
            <div className="mt-1">
              {previousScan && comparison ? (
                <div className="flex flex-col gap-1.5">
                  <TrajectoryBadge status={comparison.status} size="md" />
                  <p className="text-xs text-slate-600 leading-snug mt-0.5">
                    {comparison.message}
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-1">
                  Baseline fundus observation. No previous visit on record for longitudinal comparison.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side: Evidence Viewer & Longitudinal Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Current Fundus Evidence Viewer */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Model Evidence Localization
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">Grad-CAM Saliency</span>
            </div>

            {/* Retinal fundus image with heatmap overlay */}
            <div className="relative w-full aspect-square max-w-md mx-auto rounded-lg bg-slate-950 overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center">
              <img
                src={showHeatmap ? currentScan.evidenceUrl : currentScan.imageUrl}
                alt="Current Fundus Evidence"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                CURRENT VISIT • {formatDate(currentScan.visitDate)}
              </div>
            </div>

            {/* Explainability Controls */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Show Model Attention (Grad-CAM)</span>
                </label>
              </div>

              <div className="text-[11px] text-slate-500">
                {showHeatmap ? 'Attention Heatmap Active' : 'Unprocessed Fundus View'}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700">Visual Explanation Note: </span>
            The highlighted areas indicate retinal regions that contributed most strongly to the model's severity classification. Not intended as exact lesion segmentation.
          </div>
        </div>

        {/* Right: Longitudinal Visual Comparison (Previous vs Current) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <History size={16} className="text-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Longitudinal Comparison (Previous vs. Current)
                </h3>
              </div>
              {previousScan && (
                <span className="text-[11px] text-slate-500 font-mono">
                  Δ {previousScan.visitDate} → {currentScan.visitDate}
                </span>
              )}
            </div>

            {previousScan ? (
              <div>
                {/* Side by side comparison cards */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Previous Scan */}
                  <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 mb-1">
                      Previous: {formatDate(previousScan.visitDate)}
                    </span>
                    <div className="w-full aspect-square rounded bg-slate-950 overflow-hidden border border-slate-300 mb-2">
                      <img src={previousScan.imageUrl} alt="Previous Scan" className="w-full h-full object-contain" />
                    </div>
                    <SeverityBadge severity={previousScan.severityIndex} size="sm" />
                    <span className="text-[11px] font-mono text-slate-500 mt-1">
                      {formatConfidence(previousScan.confidence)} conf.
                    </span>
                  </div>

                  {/* Current Scan */}
                  <div className="border border-teal-300 bg-teal-50/20 rounded-lg p-2.5 flex flex-col items-center text-center ring-1 ring-teal-200">
                    <span className="text-[10px] uppercase font-mono font-bold text-teal-800 mb-1">
                      Current: {formatDate(currentScan.visitDate)}
                    </span>
                    <div className="w-full aspect-square rounded bg-slate-950 overflow-hidden border border-slate-300 mb-2">
                      <img src={currentScan.imageUrl} alt="Current Scan" className="w-full h-full object-contain" />
                    </div>
                    <SeverityBadge severity={currentScan.severityIndex} size="sm" />
                    <span className="text-[11px] font-mono text-slate-500 mt-1">
                      {formatConfidence(currentScan.confidence)} conf.
                    </span>
                  </div>
                </div>

                {/* Longitudinal Metric Callout */}
                <div className="mt-4 p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-800">
                      Severity Transition Analysis
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {previousScan.severity} → {currentScan.severity}
                    </span>
                  </div>

                  {comparison && (
                    <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100 flex items-start gap-2">
                      <TrendingUp size={14} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900">{comparison.message}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Evaluates change in diagnostic evidence between available photographic visits.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg my-auto">
                <History size={28} className="mx-auto text-slate-300 mb-2" />
                <h4 className="text-xs font-semibold text-slate-700">Baseline Examination</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  This is the first fundus scan recorded for this patient. Future examinations will automatically compute longitudinal severity delta.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Progression Language Rule: </span>
            The system documents retrospective severity variation between clinical visits without asserting future prognostic predictions.
          </div>
        </div>
      </div>

      {/* Diagnostic Trajectory Timeline Across All Patient Scans */}
      {patient.scans && patient.scans.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-teal-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                Diagnostic Trajectory Across Cohort Visits
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {patient.scans.length} Recorded Visits
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {patient.scans.map((s, i) => (
              <div
                key={s.id}
                onClick={() => navigate(`/results/${s.id}`)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  s.id === currentScan.id
                    ? 'border-teal-500 bg-teal-50/30 ring-1 ring-teal-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-800">
                    {formatDate(s.visitDate)}
                  </span>
                  {s.id === currentScan.id && (
                    <span className="text-[9px] font-mono bg-teal-600 text-white px-1.5 py-0.5 rounded uppercase font-semibold">
                      Current
                    </span>
                  )}
                </div>
                <div className="w-full aspect-square rounded bg-slate-950 overflow-hidden border border-slate-200 mb-2">
                  <img src={s.imageUrl} alt="Scan thumbnail" className="w-full h-full object-contain" />
                </div>
                <SeverityBadge severity={s.severityIndex} size="sm" />
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  {formatConfidence(s.confidence)} conf.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Safety & Medical Review Disclaimer */}
      <ClinicalDisclaimer />
    </div>
  );
}
