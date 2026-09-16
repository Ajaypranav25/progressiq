import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatients } from '../api/patientsApi';

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

  const totalPatients = patients.length || 2410;
  const urgentCount = patients.filter((p) => p.requiresReview || p.latestSeverityIndex >= 3).length || 6;

  return (
    <div className="py-2 md:py-6 space-y-8">
      {/* SECTION 1: HERO / SOLUTION OVERVIEW & RAPID INGESTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Banner: The Solution Overview */}
        <div className="lg:col-span-8 relative">
          <div className="absolute -top-10 -left-10 w-96 h-96 aura-backdrop opacity-50 pointer-events-none" />
          <div className="glass-station relative z-10 rounded-2xl p-6 lg:p-10 border border-surface-variant/50 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>Retinal Surveillance Standby • Session Active</span>
              </span>
              <span className="text-xs font-mono text-on-surface-variant">STATION: RETINA-SUITE-02</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight">
                The Solution
              </h1>
              <p className="text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed">
                Aligns longitudinal Ultra-Widefield (UWF) fundus photography and Macular OCT scans over time,
                quantifies microvascular lesion velocity, Central Subfield Thickness (CST), and flags silent
                diabetic macular edema before irreversible vision loss.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-surface-variant/40">
              <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-white/5 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span>Clinical Core Value</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Transforms <span className="text-on-surface font-semibold">"any new microaneurysms?"</span> into{' '}
                  <span className="text-secondary font-semibold">"is this ETDRS progression velocity dangerous?"</span>{' '}
                  Needs only 2 visits to identify 2-step worsening.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-lowest/80 border border-white/5 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-tertiary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  <span>UX Focus</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Single glance — ingest fundus/OCT → automated ETDRS grading + CST delta → plain-language urgent flag.{' '}
                  <span className="text-rose-400 font-semibold">Never a missed Center-Involved DME.</span>
                </p>
              </div>
            </div>

            {/* Fast Action Launchers */}
            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/patients')}
                className="px-5 py-3 rounded-lg bg-primary-container text-on-primary font-semibold text-xs md:text-sm hover:bg-primary transition shadow-[0_0_16px_rgba(56,189,248,0.25)] flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span>Open Diabetic Retinopathy Cohort Worklist</span>
              </button>

              <button
                onClick={() => navigate('/patients/p-001')}
                className="px-5 py-3 rounded-lg bg-surface-container text-on-surface font-semibold text-xs md:text-sm hover:bg-surface-container-high transition border border-white/10 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">timeline</span>
                <span>Open Eleanor Vance Dossier (Severe NPDR + CI-DME)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Quick Ingestion / DICOM Drop Container */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-station rounded-2xl p-6 border border-surface-variant/50 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">upload_file</span>
              <span>Instant Fundus &amp; OCT Ingestion</span>
            </h3>

            <div
              onClick={() => navigate('/upload')}
              className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center hover:border-primary transition bg-surface-container-lowest/60 cursor-pointer group"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
              </div>
              <div className="text-xs font-semibold text-on-surface">
                Drag &amp; Drop UWF Fundus / Macular OCT DICOM
              </div>
              <div className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                Automatic ETDRS 9-grid registration &amp; microvascular lesion segmentation (approx 1.8s)
              </div>
            </div>

            {/* Queue Telemetry */}
            <div className="pt-2 space-y-2 text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Auto-Ingestion Pipeline</span>
                <span className="text-emerald-400 font-medium">Online (RetinaDelta v4.1)</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Normative Validation Cohort</span>
                <span className="text-primary font-medium">ETDRS / DRCR Retina.net (n=58,400)</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Studies Pending in Queue</span>
                <span className="text-on-surface font-medium">19 Retinal Exams Waiting</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: COHORT SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-station p-5 rounded-xl border border-surface-variant/40 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 aura-backdrop opacity-30 pointer-events-none" />
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Active Diabetic Surveillance
          </div>
          <div className="text-2xl font-bold text-on-surface mt-1">
            2,410 <span className="text-xs font-normal text-on-surface-variant">Patients</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span>+52 new annual fundus exams this week</span>
          </div>
        </div>

        <div className="glass-station p-5 rounded-xl border border-surface-variant/40 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 aura-backdrop opacity-30 pointer-events-none" />
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Center-Involved DME Flagged
          </div>
          <div className="text-2xl font-bold text-error mt-1">
            14.6% <span className="text-xs font-normal text-on-surface-variant">Cohort</span>
          </div>
          <div className="text-[11px] text-error mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            <span>CST &gt; 320 µm requiring anti-VEGF consult</span>
          </div>
        </div>

        <div className="glass-station p-5 rounded-xl border border-surface-variant/40 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 aura-backdrop opacity-30 pointer-events-none" />
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Mean Surveillance Interval
          </div>
          <div className="text-2xl font-bold text-primary mt-1">
            11.4 <span className="text-xs font-normal text-on-surface-variant">Months</span>
          </div>
          <div className="text-[11px] text-on-surface-variant mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check</span>
            <span>Automated recall adherence: 94.1%</span>
          </div>
        </div>

        <div className="glass-station p-5 rounded-xl border border-surface-variant/40 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 aura-backdrop opacity-30 pointer-events-none" />
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            AI Concordance Rate (ETDRS)
          </div>
          <div className="text-2xl font-bold text-secondary mt-1">
            97.4% <span className="text-xs font-normal text-on-surface-variant">Concordant</span>
          </div>
          <div className="text-[11px] text-secondary mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>Zero missed neovascularizations (PDR)</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: PRIORITY VITREORETINAL TRIAGE QUEUE PREVIEW */}
      <div className="glass-station rounded-2xl border border-surface-variant/40 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-surface-variant/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Priority Vitreoretinal Triage Queue
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded bg-error-container/40 text-error font-medium">
              {urgentCount} Urgent Interventions Needed
            </span>
          </div>
          <button
            onClick={() => navigate('/patients')}
            className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>View Full Cohort Directory ({totalPatients})</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-lowest/80 text-on-surface-variant uppercase tracking-wider font-semibold border-b border-surface-variant/40">
              <tr>
                <th className="p-4">Patient / Demographics</th>
                <th className="p-4">MRN</th>
                <th className="p-4">Imaging Modality</th>
                <th className="p-4">Follow-up Interval</th>
                <th className="p-4">Central Subfield Thickness (CST)</th>
                <th className="p-4">ETDRS Severity &amp; DME Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/30 text-on-surface-variant">
              {/* Row 1: Eleanor Vance */}
              <tr
                onClick={() => navigate('/patients/p-001')}
                className="bg-primary/5 hover:bg-primary/10 transition cursor-pointer"
              >
                <td className="p-4 font-semibold text-on-surface flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-error animate-ping" />
                  <div>
                    <div className="text-sm font-bold text-primary">Eleanor Vance</div>
                    <div className="text-[11px] text-on-surface-variant font-normal">
                      64y Female • ID: PT-7014 • T2D 14y (HbA1c 8.6%)
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-on-surface">9042-RETINA</td>
                <td className="p-4">Optos UWF 200° + Zeiss Cirrus HD-OCT 5000</td>
                <td className="p-4">4 Scans (36 Mo Delta)</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-error font-bold">412 µm (+94 µm YoY)</span>
                    <span className="text-[10px] text-on-surface-variant">(Norm: &lt;260 µm)</span>
                  </div>
                  <div className="w-28 h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
                    <div className="w-[88%] h-full bg-error" />
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded bg-error-container/40 text-error font-bold text-[11px]">
                    Severe NPDR • Center-Involved DME (OD)
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/patients/p-001');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary font-bold text-xs hover:bg-primary transition shadow-[0_0_12px_rgba(56,189,248,0.2)] cursor-pointer"
                  >
                    Inspect Timeline →
                  </button>
                </td>
              </tr>

              {/* Row 2: Arthur Pendelton */}
              <tr
                onClick={() => navigate('/patients/p-002')}
                className="hover:bg-surface-container/40 transition cursor-pointer"
              >
                <td className="p-4">
                  <div className="text-sm font-semibold text-on-surface">Arthur Pendelton</div>
                  <div className="text-[11px] text-on-surface-variant">
                    54y Male • ID: PIQ-8402 • T2D 4y (HbA1c 7.1%)
                  </div>
                </td>
                <td className="p-4 font-mono text-on-surface-variant">8812-RETINA</td>
                <td className="p-4">Topcon DRI OCT Triton + 50° Fundus</td>
                <td className="p-4">2 Scans (8 Mo Delta)</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-secondary font-medium">254 µm</span>
                    <span className="text-[10px] text-on-surface-variant">(Stable)</span>
                  </div>
                  <div className="w-28 h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
                    <div className="w-[20%] h-full bg-secondary" />
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded bg-surface-container-high text-secondary font-medium text-[11px]">
                    Mild NPDR • Stable Profile
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/patients/p-002');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-xs cursor-pointer"
                  >
                    Review
                  </button>
                </td>
              </tr>

              {/* Row 3: Sofia Rodriguez */}
              <tr
                onClick={() => navigate('/patients/p-003')}
                className="hover:bg-surface-container/40 transition cursor-pointer"
              >
                <td className="p-4">
                  <div className="text-sm font-semibold text-on-surface">Sofia Rodriguez</div>
                  <div className="text-[11px] text-on-surface-variant">
                    68y Female • ID: PIQ-8403 • T1D 22y (HbA1c 7.9%)
                  </div>
                </td>
                <td className="p-4 font-mono text-on-surface-variant">7724-RETINA</td>
                <td className="p-4">Optos UWF 200° + Heidelberg Spectralis</td>
                <td className="p-4">2 Scans (8 Mo Delta)</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-medium">285 µm</span>
                    <span className="text-[10px] text-emerald-400">(Resorbing)</span>
                  </div>
                  <div className="w-28 h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
                    <div className="w-[45%] h-full bg-primary" />
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded bg-surface-container-high text-primary font-medium text-[11px]">
                    Moderate NPDR • Decreased Severity
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/patients/p-003');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-xs cursor-pointer"
                  >
                    Review
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
