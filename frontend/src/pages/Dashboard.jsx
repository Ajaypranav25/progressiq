import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Eye,
  AlertTriangle,
  TrendingUp,
  Activity,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  Calendar,
  Clock,
} from 'lucide-react';
import { getPatients } from '../api/patientsApi';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { TrajectoryBadge } from '../components/common/TrajectoryBadge';
import { ClinicalDisclaimer } from '../components/common/ClinicalDisclaimer';
import { formatDate, formatConfidence } from '../utils/formatters';

export function Dashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCohort() {
      setLoading(true);
      try {
        const { data } = await getPatients();
        setPatients(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCohort();
  }, []);

  // Compute summary metrics
  const totalPatients = patients.length;
  const totalScans = patients.reduce((acc, p) => acc + (p.totalScans || 0), 0);
  const patientsRequiringReview = patients.filter((p) => p.requiresReview);

  // Flatten recent scans across patients
  const allScans = [];
  patients.forEach((p) => {
    (p.scans || []).forEach((s) => {
      allScans.push({
        ...s,
        patientName: p.name,
        patientIdentifier: p.patientIdentifier,
        patientAge: p.age,
      });
    });
  });
  // Sort descending by visit date
  allScans.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
  const recentScans = allScans.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Clinical Diagnostic Workstation
            </h1>
            <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full font-medium">
              DR Longitudinal Surveillance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring Diabetic Retinopathy severity transitions across patient scan chronologies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/upload"
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-md text-xs font-semibold transition-colors shadow-xs"
          >
            <UploadCloud size={15} />
            <span>Intake Fundus Scan</span>
          </Link>
        </div>
      </div>

      {/* Clinical safety disclaimer */}
      <ClinicalDisclaimer />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Active Monitored Cohort</span>
            <Users size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalPatients}</span>
            <span className="text-[11px] text-slate-400 font-mono">Demo Patients</span>
          </div>
        </div>

        {/* Total Scans Analyzed */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Total Longitudinal Scans</span>
            <Eye size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalScans}</span>
            <span className="text-[11px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 font-medium">
              Retinal Fundus
            </span>
          </div>
        </div>

        {/* Patients Requiring Review */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Requires Clinical Review</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-600 font-mono">
              {patientsRequiringReview.length}
            </span>
            <span className="text-[11px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 font-medium">
              Progression Detected
            </span>
          </div>
        </div>

        {/* Diagnostic Accuracy / Baseline */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Diagnostic Scale</span>
            <Activity size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-slate-900">Grade 0 → 4</span>
            <span className="text-[11px] text-slate-500 font-mono">ICDR Severity</span>
          </div>
        </div>
      </div>

      {/* Main Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Action Queue (Patients Requiring Review Based on Model-Detected Change) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Priority Review Alert Panel */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  Priority Review Queue • Model-Detected Change
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">
                {patientsRequiringReview.length} flagged
              </span>
            </div>

            {patientsRequiringReview.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No patients currently flagged for model-detected progression.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {patientsRequiringReview.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-md bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {patient.patientIdentifier}
                          </span>
                          <span className="text-xs text-slate-600">• {patient.name}</span>
                          <span className="text-[10px] text-slate-400">({patient.age}y, {patient.gender})</span>
                        </div>
                        <p className="text-xs text-rose-700 font-medium mt-0.5">
                          {patient.trajectoryMessage}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <SeverityBadge severity={patient.latestSeverityIndex} size="sm" showIndex />
                          <span className="text-[11px] text-slate-400">
                            Last evaluated: {formatDate(patient.latestScanDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded transition-colors"
                      >
                        <span>Open Longitudinal View</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Diagnostic Activity Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                Recent Diagnostic Activity
              </h2>
              <Link
                to="/patients"
                className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
              >
                <span>View All Patients</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Visit Date</th>
                    <th className="px-4 py-2.5">Patient</th>
                    <th className="px-4 py-2.5">Scan</th>
                    <th className="px-4 py-2.5">Predicted Severity</th>
                    <th className="px-4 py-2.5">Confidence</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 font-mono">
                        {formatDate(scan.visitDate)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{scan.patientName}</div>
                        <div className="font-mono text-[11px] text-slate-400">{scan.patientIdentifier}</div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="w-8 h-8 rounded bg-slate-900 overflow-hidden border border-slate-200">
                          <img src={scan.imageUrl} alt="Scan" className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <SeverityBadge severity={scan.severityIndex} size="sm" />
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap font-mono font-medium text-slate-700">
                        {formatConfidence(scan.confidence)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => navigate(`/patients/${scan.patientId}`)}
                          className="text-xs text-slate-600 hover:text-slate-900 font-medium hover:underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Cohort Overview & Severity Distribution */}
        <div className="flex flex-col gap-6">
          {/* Cohort Quick Access */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono mb-3">
              Fast Patient Switcher
            </h3>
            <div className="flex flex-col gap-2">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="p-2.5 rounded-md border border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {patient.patientIdentifier}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate">{patient.name}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <SeverityBadge severity={patient.latestSeverityIndex} size="sm" />
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* DR Severity Classification Legend & Guidance */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono mb-2">
              Diagnostic Scale (ICDR Standard)
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-snug">
              ProgressIQ maps fundus imaging to the 5 international clinical stages of diabetic retinopathy:
            </p>
            <div className="space-y-2 text-xs">
              {[
                { grade: 'Grade 0', label: 'No DR', desc: 'No microvascular lesions' },
                { grade: 'Grade 1', label: 'Mild DR', desc: 'Microaneurysms only' },
                { grade: 'Grade 2', label: 'Moderate DR', desc: 'Blot hemorrhages, hard exudates' },
                { grade: 'Grade 3', label: 'Severe DR', desc: '4-2-1 rule: venous beading / IRMA' },
                { grade: 'Grade 4', label: 'Proliferative DR', desc: 'Neovascularization / vitreal bleed' },
              ].map((item, idx) => (
                <div key={item.grade} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-slate-600 w-14">
                      {item.grade}
                    </span>
                    <span className="font-semibold text-slate-800">{item.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 text-right">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
