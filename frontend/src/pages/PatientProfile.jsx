import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UploadCloud,
  Calendar,
  Eye,
  Activity,
  ChevronRight,
  TrendingUp,
  History,
  FileText,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { getPatientById } from '../api/patientsApi';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { TrajectoryBadge } from '../components/common/TrajectoryBadge';
import { ConfidenceBar } from '../components/common/ConfidenceBar';
import { ClinicalDisclaimer } from '../components/common/ClinicalDisclaimer';
import { formatDate, formatConfidence } from '../utils/formatters';

export function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getPatientById(id);
        setPatient(data);
      } catch (err) {
        setError(err.message || 'Patient not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 text-xs">
        <Activity className="animate-spin mb-2" size={24} />
        <span>Loading patient longitudinal dossier...</span>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-lg text-center">
        <AlertTriangle className="mx-auto text-amber-500 mb-2" size={28} />
        <h3 className="font-semibold text-slate-800 text-sm">Patient Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-medium"
        >
          <ArrowLeft size={13} />
          <span>Back to Patient Directory</span>
        </Link>
      </div>
    );
  }

  const scans = patient.scans || [];
  // Sort chronological order for trajectory timeline
  const chronologicalScans = [...scans].sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
  // Reverse for table (most recent first)
  const recentFirstScans = [...chronologicalScans].reverse();

  return (
    <div className="flex flex-col gap-6">
      {/* Top back navigation & action */}
      <div className="flex items-center justify-between">
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          <ArrowLeft size={13} />
          <span>Return to Patient Cohort</span>
        </Link>

        <button
          onClick={() => navigate(`/upload?patientId=${patient.id}`)}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-md text-xs font-semibold transition-colors shadow-xs"
        >
          <UploadCloud size={15} />
          <span>Analyze New Scan for this Patient</span>
        </button>
      </div>

      {/* Patient Clinical Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {patient.patientIdentifier}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {patient.name}
              </h1>
              {patient.isDemo && (
                <span className="text-[10px] uppercase font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                  DEMO RECORD
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {patient.age} years old • {patient.gender} • {patient.diabetesType}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {patient.totalScans > 1 && (
              <div className="flex flex-col items-start lg:items-end">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                  Longitudinal Trajectory
                </span>
                <div className="mt-0.5">
                  <TrajectoryBadge status={patient.trajectoryStatus} size="md" />
                </div>
              </div>
            )}

            <div className="flex flex-col items-start lg:items-end border-l border-slate-200 pl-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                Latest Predicted Severity
              </span>
              <div className="mt-0.5">
                {patient.latestSeverityIndex !== null && patient.latestSeverityIndex !== undefined ? (
                  <SeverityBadge severity={patient.latestSeverityIndex} size="md" showIndex />
                ) : (
                  <span className="text-xs text-slate-400 italic">Pending Baseline</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trajectory message alert if progression detected */}
        {patient.trajectoryMessage && (
          <div
            className={`mt-4 p-3 rounded-md border text-xs flex items-start gap-2.5 ${
              patient.trajectoryStatus === 'increased_severity'
                ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <TrendingUp size={15} className={`shrink-0 mt-0.5 ${patient.trajectoryStatus === 'increased_severity' ? 'text-rose-600' : 'text-slate-500'}`} />
            <div>
              <span className="font-semibold">Diagnostic Observation: </span>
              {patient.trajectoryMessage}
              <div className="text-[11px] text-slate-500 mt-0.5">
                Note: Evaluates change between available visits. Does not predict future disease progression.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diagnostic Trajectory Timeline */}
      {chronologicalScans.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History size={16} className="text-teal-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                Longitudinal Diagnostic Timeline
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {chronologicalScans.length} Chronological Visits
            </span>
          </div>

          <div className="relative flex items-center justify-between overflow-x-auto py-4 px-2">
            {/* Horizontal timeline bar */}
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

            {chronologicalScans.map((scan, idx) => (
              <div key={scan.id} className="relative z-10 flex flex-col items-center min-w-[140px] px-2 text-center group">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-300 group-hover:border-teal-500 overflow-hidden shadow-xs flex items-center justify-center transition-colors mb-2">
                  <img src={scan.imageUrl} alt="Visit scan" className="w-full h-full object-cover" />
                </div>
                <span className="font-mono text-xs font-bold text-slate-800">
                  {formatDate(scan.visitDate)}
                </span>
                <div className="mt-1">
                  <SeverityBadge severity={scan.severityIndex} size="sm" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {formatConfidence(scan.confidence)} conf.
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan History Table & Detailed Cards */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
              Retinal Scan History &amp; Evidence Records
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {scans.length} {scans.length === 1 ? 'record' : 'records'} available
          </span>
        </div>

        {scans.length === 0 ? (
          <div className="p-12 text-center">
            <Eye className="mx-auto text-slate-300 mb-2" size={32} />
            <h4 className="text-xs font-semibold text-slate-700">No Retinal Scans Recorded</h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Begin by uploading a baseline retinal fundus photograph for this patient.
            </p>
            <button
              onClick={() => navigate(`/upload?patientId=${patient.id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 text-white rounded-md text-xs font-semibold hover:bg-teal-700 transition-colors"
            >
              <UploadCloud size={14} />
              <span>Intake Baseline Fundus Scan</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentFirstScans.map((scan, idx) => {
              // Find previous scan in chronological order
              const chronIndex = chronologicalScans.findIndex((s) => s.id === scan.id);
              const previousScan = chronIndex > 0 ? chronologicalScans[chronIndex - 1] : null;

              return (
                <div key={scan.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Left: Thumbnail & Clinical Prediction */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-md bg-slate-950 overflow-hidden border border-slate-300 shrink-0 shadow-xs relative">
                        <img src={scan.imageUrl} alt="Fundus" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-slate-900/80 text-white font-mono px-1 rounded">
                          {scan.eye?.split(' ')[0] || 'OD'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            Visit: {formatDate(scan.visitDate)}
                          </span>
                          <span className="text-[11px] text-slate-400">• {scan.eye || 'OD (Right Eye)'}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5">
                          <SeverityBadge severity={scan.severityIndex} size="md" showIndex />
                          <span className="text-xs font-mono font-medium text-slate-700">
                            {formatConfidence(scan.confidence)} model confidence
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1.5 max-w-xl leading-relaxed">
                          {scan.notes || 'Routine longitudinal evaluation scan.'}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Longitudinal Delta vs Previous Scan */}
                    <div className="flex flex-col md:items-center text-xs">
                      {previousScan ? (
                        <div className="bg-slate-50 border border-slate-200 rounded p-2 text-center min-w-[160px]">
                          <span className="text-[10px] uppercase font-mono text-slate-400 block">
                            vs. Visit {formatDate(previousScan.visitDate)}
                          </span>
                          <span className="font-semibold text-slate-800 text-xs">
                            {previousScan.severity.replace(' DR', '')} → {scan.severity.replace(' DR', '')}
                          </span>
                          <div className="mt-0.5">
                            {scan.severityIndex > previousScan.severityIndex && (
                              <span className="text-[10px] text-rose-600 font-bold font-mono">
                                ▲ Severity Increased (+{scan.severityIndex - previousScan.severityIndex})
                              </span>
                            )}
                            {scan.severityIndex === previousScan.severityIndex && (
                              <span className="text-[10px] text-slate-500 font-medium font-mono">
                                ▬ Stable Severity
                              </span>
                            )}
                            {scan.severityIndex < previousScan.severityIndex && (
                              <span className="text-[10px] text-emerald-600 font-bold font-mono">
                                ▼ Severity Decreased ({scan.severityIndex - previousScan.severityIndex})
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">
                          Baseline scan (No prior history)
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        onClick={() => navigate(`/results/${scan.id}`)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded transition-colors shadow-2xs"
                      >
                        <Eye size={13} className="text-teal-600" />
                        <span>View Evidence &amp; Report</span>
                      </button>

                      {previousScan && (
                        <button
                          onClick={() => navigate(`/results/${scan.id}?compareWith=${previousScan.id}`)}
                          className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded transition-colors"
                          title="Side-by-side comparison with previous scan"
                        >
                          <span>Compare</span>
                          <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safety footer */}
      <ClinicalDisclaimer />
    </div>
  );
}
