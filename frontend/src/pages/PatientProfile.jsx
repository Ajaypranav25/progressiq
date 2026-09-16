import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatientById } from '../api/patientsApi';


export function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await getPatientById(id || 'p-001');
        setPatient(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const p = patient || {
    name: 'Eleanor Vance',
    age: 64,
    gender: 'Female',
    patientIdentifier: 'PT-7014',
    diabetesType: 'T2D 14y (HbA1c 8.6%)',
    latestSeverity: 'Severe DR',
    scans: [],
  };

  const isSevere = p.latestSeverityIndex >= 3 || p.latestSeverity?.includes('Severe');
  const cstValue = isSevere ? 412 : 254;

  return (
    <div className="py-2 md:py-6 space-y-8">
      {/* 1. PATIENT CLINICAL HEADER */}
      <section className="glass-station rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden border border-surface-variant/40">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          {/* Demographics */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl lg:text-3xl text-on-surface font-semibold tracking-tight">
                {p.name}
              </span>
              <span className="text-xs px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-mono">
                {p.age}{p.gender?.[0] || 'F'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-mono">
                ID: {p.patientIdentifier}
              </span>
              <span className="text-xs px-2.5 py-1 rounded bg-surface-container text-primary font-mono font-bold">
                MRN: 9042-RETINA
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-on-surface-variant text-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-tertiary">ophthalmology</span>
                <span className="text-on-surface font-medium">
                  {isSevere
                    ? 'Severe NPDR with Center-Involved Diabetic Macular Edema (OD)'
                    : 'Mild/Moderate Non-Proliferative Retinopathy Surveillance'}
                </span>
              </div>
              <span className="text-surface-variant">/</span>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">history_toggle_off</span>
                <span>Monitored: 3.0 Years (4 Multi-Modal Retinal Scans)</span>
              </div>
            </div>
          </div>

          {/* Primary Staging Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:bg-primary transition shadow-[0_0_15px_rgba(56,189,248,0.25)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
              <span>+ Upload Current Fundus / OCT</span>
            </button>
            <button
              onClick={() => navigate('/results/scan-103')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-container text-on-surface text-xs font-medium hover:bg-surface-container-high transition border border-white/5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">visibility</span>
              <span>View Latest Results</span>
            </button>
          </div>
        </div>

        {/* Biomarker Strip */}
        <div className="mt-6 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-container-lowest/70 rounded-xl p-5 backdrop-blur-sm border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[26px]">bloodtype</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                Glycemic Control (HbA1c)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl text-on-surface font-bold">8.6%</span>
                <span className="text-xs text-error flex items-center gap-0.5 font-medium">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +1.4% from baseline
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant mt-0.5">
                Baseline: 7.2% (Sep 2021) • T2D Duration: 14 yrs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[26px]">straighten</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                Macular Central Subfield (CST)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl text-on-surface font-bold">
                  {cstValue} <span className="text-xs font-normal text-on-surface-variant">µm</span>
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${isSevere ? 'bg-error-container/40 text-error' : 'bg-secondary/20 text-secondary'}`}>
                  {isSevere ? 'CI-DME' : 'Normal Range'}
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant mt-0.5">
                Threshold: &gt;320 µm • Baseline: 248 µm
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[26px]">grading</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                ETDRS Severity Step Level
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl text-on-surface font-bold">
                  {isSevere ? 'Level 53' : 'Level 35'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${isSevere ? 'bg-error-container/40 text-error' : 'bg-secondary/20 text-secondary'}`}>
                  {isSevere ? '2-Step Worsening' : 'Stable Level'}
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant mt-0.5">
                Progression: {isSevere ? 'Severe NPDR • High Neovascular Risk' : 'Mild/Moderate NPDR'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LONGITUDINAL TRAJECTORY & RETINAL BREAKDOWN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Longitudinal Retinal Series (4 scans over 36 months) */}
        <section className="xl:col-span-7 flex flex-col gap-6">
          <div className="flex items-center justify-between pb-1">
            <div className="flex flex-col">
              <span className="text-base text-on-surface font-bold">Longitudinal Retinal Imaging Series</span>
              <span className="text-xs text-on-surface-variant">
                Multi-modal co-registered Ultra-Widefield Color Fundus &amp; Macular SD-OCT (ETDRS Grid)
              </span>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-surface-container text-primary font-medium tracking-wide border border-primary/20">
              4 Timepoints • 36 Months
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Scan 4 (Latest) */}
            <article
              onClick={() => navigate('/results/scan-103')}
              className="bg-surface-container-low hover:bg-surface-container transition-colors rounded-xl p-6 flex flex-col gap-5 relative overflow-hidden shadow-sm border border-surface-variant/40 cursor-pointer"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-error-container/40 text-error font-bold tracking-wider uppercase">
                    Scan 4 • Current
                  </span>
                  <span className="text-base text-on-surface font-bold">2024-10-18</span>
                  <span className="text-xs text-on-surface-variant">(Month 36)</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded bg-error/15 text-error font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                  Rapid Progression • Center-Involved DME
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="flex flex-col gap-1 p-3.5 rounded-lg bg-surface-container-lowest/80 border border-white/5">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
                    Central Subfield Thickness
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl text-on-surface font-bold">412</span>
                    <span className="text-xs text-on-surface-variant">µm</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-error mt-1 font-medium">
                    <span className="material-symbols-outlined text-[15px]">trending_up</span>
                    <span>+29.5% YoY • Severe Edema</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 p-3.5 rounded-lg bg-surface-container-lowest/80 border border-white/5">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
                    Microaneurysms / Hemorrhages
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl text-on-surface font-bold">78</span>
                    <span className="text-xs text-on-surface-variant">lesions</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-error mt-1 font-medium">
                    <span className="material-symbols-outlined text-[15px]">priority_high</span>
                    <span>4-Quadrant Involvement</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 p-3.5 rounded-lg bg-surface-container-lowest/80 border border-white/5">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
                    Hard Exudates &amp; IRMA
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl text-on-surface font-bold">2.4</span>
                    <span className="text-xs text-on-surface-variant">mm²</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-error mt-1 font-medium">
                    <span className="material-symbols-outlined text-[15px]">warning</span>
                    <span>IRMA in 2 Quadrants</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-on-surface-variant text-[11px] pt-1">
                <span>Optos California UWF 200° • Zeiss Cirrus 5000 Macular Cube 512x128</span>
                <span className="font-mono text-primary">Image Quality Index: 0.97 (Verified)</span>
              </div>
            </article>

            {/* Scan 3 */}
            <article className="bg-surface-container-low hover:bg-surface-container transition-colors rounded-xl p-6 flex flex-col gap-5 relative overflow-hidden shadow-sm border border-surface-variant/40">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-surface-container-high text-on-surface font-bold tracking-wider uppercase">
                    Scan 3
                  </span>
                  <span className="text-base text-on-surface font-bold">2023-11-04</span>
                  <span className="text-xs text-on-surface-variant">(Month 26)</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded bg-surface-container-high text-amber-300 font-medium">
                  Moderate NPDR • Foveal Non-Center Fluid
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="flex flex-col gap-1 p-3.5 rounded-lg bg-surface-container-lowest/80 border border-white/5">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
                    Central Subfield Thickness
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl text-on-surface font-bold">318</span>
                    <span className="text-xs text-on-surface-variant">µm</span>
                  </div>
                  <span className="text-xs text-amber-300 mt-1">Sub-threshold CI-DME</span>
                </div>

                <div className="flex flex-col gap-1 p-3.5 rounded-lg bg-surface-container-lowest/80 border border-white/5">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
                    Microaneurysms / Hemorrhages
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl text-on-surface font-bold">34</span>
                    <span className="text-xs text-on-surface-variant">lesions</span>
                  </div>
                  <span className="text-xs text-on-surface-variant mt-1">2 Quadrants Involved</span>
                </div>

                <div className="flex flex-col gap-1 p-3.5 rounded-lg bg-surface-container-lowest/80 border border-white/5">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
                    Hard Exudates &amp; IRMA
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl text-on-surface font-bold">0.8</span>
                    <span className="text-xs text-on-surface-variant">mm²</span>
                  </div>
                  <span className="text-xs text-on-surface-variant mt-1">Temporal Parafovea</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-on-surface-variant text-[11px] pt-1">
                <span>Topcon DRI OCT Triton + 50° Fundus</span>
                <span className="font-mono text-on-surface-variant">Image Quality Index: 0.95</span>
              </div>
            </article>

            {/* Scan 1 (Baseline Reference) */}
            <article className="bg-surface-container-low hover:bg-surface-container transition-colors rounded-xl p-6 flex flex-col gap-5 relative overflow-hidden shadow-sm border border-surface-variant/40">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-primary/20 text-primary font-bold tracking-wider uppercase">
                    Scan 1 • Baseline
                  </span>
                  <span className="text-base text-on-surface font-bold">2021-09-20</span>
                  <span className="text-xs text-on-surface-variant">(Month 0 • Baseline)</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded bg-surface-container-high text-on-surface font-medium">
                  Baseline Reference • Mild NPDR
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="flex flex-col gap-1 p-3.5 rounded-lg bg-surface-container-lowest/80 border border-white/5">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
                    Central Subfield Thickness
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl text-on-surface font-bold">248</span>
                    <span className="text-xs text-on-surface-variant">µm</span>
                  </div>
                  <span className="text-xs text-primary mt-1">Normal Healthy Range (&lt;260 µm)</span>
                </div>

                <div className="flex flex-col gap-1 p-3.5 rounded-lg bg-surface-container-lowest/80 border border-white/5">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
                    Microaneurysms / Hemorrhages
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl text-on-surface font-bold">8</span>
                    <span className="text-xs text-on-surface-variant">lesions</span>
                  </div>
                  <span className="text-xs text-on-surface-variant mt-1">Mild Non-Proliferative Stage</span>
                </div>

                <div className="flex flex-col gap-1 p-3.5 rounded-lg bg-surface-container-lowest/80 border border-white/5">
                  <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
                    Hard Exudates &amp; IRMA
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl text-on-surface font-bold">0.0</span>
                    <span className="text-xs text-on-surface-variant">mm²</span>
                  </div>
                  <span className="text-xs text-on-surface-variant mt-1">Zero Macular Exudation</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-on-surface-variant text-[11px] pt-1">
                <span>Zeiss Clarus 500 UWF • Zeiss Cirrus 5000</span>
                <span className="font-mono text-on-surface-variant">Reference Baseline Standard</span>
              </div>
            </article>
          </div>
        </section>

        {/* Right Column: Trajectory Curve vs Normative Controls & Clinical Correlates */}
        <section className="xl:col-span-5 flex flex-col gap-6">
          <div className="flex items-center justify-between pb-1">
            <div className="flex flex-col">
              <span className="text-base text-on-surface font-bold">Macular Edema Velocity Model</span>
              <span className="text-xs text-on-surface-variant">
                Longitudinal Central Subfield Thickness (CST) Trajectory
              </span>
            </div>
            <span className="material-symbols-outlined text-[20px] text-secondary">insights</span>
          </div>

          {/* Precision Trajectory SVG Visualization Card */}
          <div className="glass-station rounded-xl p-6 flex flex-col gap-5 shadow-2xl border border-surface-variant/40 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 aura-glow-subtle opacity-40 pointer-events-none" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface">Central Subfield Thickness (CST) Delta</span>
                <span className="text-xs text-on-surface-variant font-mono">DRCR.net Cohort N=2,180</span>
              </div>
              <p className="text-xs text-error/90 font-medium mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
                Acute inflection into Center-Involved DME (&gt;320 µm) between M26 and M36
              </p>
            </div>

            {/* SVG Trajectory Chart */}
            <div className="relative w-full bg-surface-container-lowest/90 rounded-lg p-4 border border-white/5">
              <svg
                className="w-full h-auto overflow-visible"
                fill="none"
                viewBox="0 0 420 220"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Coordinate Gridlines */}
                <line stroke="#32353b" strokeDasharray="3 3" strokeWidth="0.75" x1="40" x2="390" y1="30" y2="30" />
                <line stroke="#32353b" strokeDasharray="3 3" strokeWidth="0.75" x1="40" x2="390" y1="75" y2="75" />
                <line stroke="#32353b" strokeDasharray="3 3" strokeWidth="0.75" x1="40" x2="390" y1="120" y2="120" />
                <line stroke="#32353b" strokeDasharray="3 3" strokeWidth="0.75" x1="40" x2="390" y1="165" y2="165" />

                {/* DME Pathological Cutoff Line (320 µm) */}
                <line stroke="#ffb4ab" strokeDasharray="4 4" strokeWidth="1.2" x1="40" x2="390" y1="85" y2="85" />
                <text fill="#ffb4ab" fontFamily="'JetBrains Mono', monospace" fontSize="8" textAnchor="end" x="385" y="80">
                  CI-DME Threshold (320 µm)
                </text>

                {/* Normal Range Envelope (220-260 µm) */}
                <rect fill="#44e2cd" fillOpacity="0.06" height="35" width="350" x="40" y="145" />

                {/* Stable Baseline Control Line */}
                <path d="M 40 160 Q 150 158 260 156 T 380 154" stroke="#87929a" strokeDasharray="4 4" strokeWidth="1.5" />

                {/* Patient Actual Longitudinal Trajectory Curve */}
                <path
                  d="M 40 160 C 120 155, 180 145, 260 115 C 310 95, 340 50, 380 35"
                  stroke="#38bdf8"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />

                {/* Critical Divergence Inflection Point Marker */}
                <circle cx="260" cy="115" fill="#ffb4ab" fillOpacity="0.2" r="14" />
                <circle cx="260" cy="115" fill="#44e2cd" r="4" />
                <circle cx="260" cy="115" fill="#0b0e13" r="2" />

                {/* Trajectory Nodes */}
                <circle cx="40" cy="160" fill="#38bdf8" r="4" />
                <circle cx="40" cy="160" fill="#0b0e13" r="2" />
                <circle cx="160" cy="148" fill="#38bdf8" r="4" />
                <circle cx="160" cy="148" fill="#0b0e13" r="2" />
                <circle cx="380" cy="35" fill="#ffb4ab" r="5" />
                <circle cx="380" cy="35" fill="#93000a" r="2.5" />

                {/* X-Axis Labels */}
                <text fill="#87929a" fontFamily="'Inter', sans-serif" fontSize="10" textAnchor="middle" x="40" y="198">M0 (2021)</text>
                <text fill="#87929a" fontFamily="'Inter', sans-serif" fontSize="10" textAnchor="middle" x="160" y="198">M14</text>
                <text fill="#87929a" fontFamily="'Inter', sans-serif" fontSize="10" textAnchor="middle" x="260" y="198">M26</text>
                <text fill="#ffb4ab" fontFamily="'Inter', sans-serif" fontSize="10" textAnchor="middle" x="380" y="198">M36 (Now)</text>

                {/* Y-Axis Ticks */}
                <text fill="#87929a" fontFamily="'JetBrains Mono', monospace" fontSize="9" textAnchor="end" x="35" y="34">420µm</text>
                <text fill="#87929a" fontFamily="'JetBrains Mono', monospace" fontSize="9" textAnchor="end" x="35" y="79">360µm</text>
                <text fill="#87929a" fontFamily="'JetBrains Mono', monospace" fontSize="9" textAnchor="end" x="35" y="124">300µm</text>
                <text fill="#87929a" fontFamily="'JetBrains Mono', monospace" fontSize="9" textAnchor="end" x="35" y="169">240µm</text>
              </svg>
            </div>

            {/* Chart Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-primary rounded-full" />
                <span className="text-on-surface">{p.name} (OD)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 border-b border-dashed border-outline" />
                <span>Glycemic Stable Norm</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-error/70 rounded-full" />
                <span>CI-DME Action Line (320 µm)</span>
              </div>
            </div>
          </div>

          {/* Clinical Observations & Retinal Correlation Card */}
          <div className="glass-station rounded-xl p-6 flex flex-col gap-5 shadow-sm flex-1 border border-surface-variant/40">
            <div className="flex items-center justify-between">
              <span className="text-base text-on-surface font-bold">Vitreoretinal Multi-Modal Consensus</span>
              <span className="text-xs text-primary uppercase font-mono font-semibold">RetinaDelta v4.1 Audit</span>
            </div>

            <div className="flex flex-col gap-4 text-xs text-on-surface-variant leading-relaxed">
              <div className="p-3.5 rounded-lg bg-surface-container-lowest/80 border border-white/5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-secondary tracking-wider">
                    Macular Subfield Expansion
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Reviewer: Dr. M. Vance, MD</span>
                </div>
                <p className="text-on-surface text-[11px]">
                  Central subfield thickness (CST) surged from 270 µm to{' '}
                  <span className="text-error font-semibold">412 µm (+142 µm overall)</span> with prominent intraretinal
                  cystoid spaces spanning outer nuclear and outer plexiform layers, threatening foveal integrity.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-lowest/80 border border-white/5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-tertiary tracking-wider">
                    ETDRS Scale 2-Step Progression
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Validated: Oct 2024</span>
                </div>
                <p className="text-on-surface text-[11px]">
                  Progression from Mild NPDR (Step 35) to Severe NPDR (Step 53) triggered by 4-quadrant microaneurysms
                  &gt;20 and IRMA in 2 inferior/temporal quadrants. 1-year progression to proliferative diabetic
                  retinopathy (PDR) is modeled at 52.8% without intervention.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-container-lowest/80 border border-white/5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase text-primary tracking-wider">
                    Treatment Recommendation &amp; Staging Action
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-error/20 text-error font-mono font-bold">
                    URGENT ANTI-VEGF
                  </span>
                </div>
                <p className="text-on-surface text-[11px]">
                  Initiate intravitreal anti-VEGF therapy (Aflibercept 2mg or Faricimab 6mg) for center-involved DME
                  with visual acuity loss (20/40 OD). Schedule follow-up OCT at 4 weeks. Order Ultra-Widefield
                  Fluorescein Angiography (UWF-FA) to rule out early NVE.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 mt-auto text-xs">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                <span className="text-[11px]">OCT Segmentation: Zeiss Cirrus Cube / RetinaDelta v4.1</span>
              </div>
              <button
                onClick={() => navigate('/results/scan-103')}
                className="text-primary hover:text-primary-fixed-dim text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                <span>View Detailed Retinal Diagnostic Report</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 3. REGIONAL SUBFIELD MICROVASCULAR BIOMARKERS PROFILE */}
      <section className="glass-station rounded-xl p-6 lg:p-8 shadow-sm border border-surface-variant/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
          <div>
            <span className="text-base text-on-surface font-bold">
              Retinal Microvascular &amp; Perfusion Biomarker Profile
            </span>
            <p className="text-xs text-on-surface-variant">
              Delta across 36-month surveillance interval measured by UWF and Macular OCTA
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-on-surface-variant">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-error" /> Accelerated Worsening
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" /> Moderate Activity
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Preserved/Controlled
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* FAZ Area */}
          <div className="bg-surface-container-lowest/90 rounded-lg p-4 flex flex-col gap-3 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant uppercase font-semibold">
                FAZ Area (Deep Capillary)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-error-container/40 text-error font-medium">
                Enlarged
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl text-on-surface font-bold">
                0.44 <span className="text-xs font-normal text-on-surface-variant">mm²</span>
              </span>
              <span className="text-xs text-error font-medium">+46.6% 36m</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-error h-full rounded-full" style={{ width: '78%' }} />
            </div>
            <span className="text-[10px] text-on-surface-variant">Foveal non-perfusion sign</span>
          </div>

          {/* Vessel Density */}
          <div className="bg-surface-container-lowest/90 rounded-lg p-4 flex flex-col gap-3 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant uppercase font-semibold">
                Vessel Density (Superficial)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-secondary-container/40 text-secondary font-medium">
                Moderate Drop
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl text-on-surface font-bold">
                39.2 <span className="text-xs font-normal text-on-surface-variant">%</span>
              </span>
              <span className="text-xs text-secondary font-medium">-14.2% 36m</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: '58%' }} />
            </div>
            <span className="text-[10px] text-on-surface-variant">Capillary dropout in temporal parafovea</span>
          </div>

          {/* IRMA Quadrants */}
          <div className="bg-surface-container-lowest/90 rounded-lg p-4 flex flex-col gap-3 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant uppercase font-semibold">
                IRMA Quadrants Count
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-error-container/40 text-error font-medium">
                2 Quadrants
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl text-on-surface font-bold">
                Level 53 <span className="text-xs font-normal text-on-surface-variant">Severe</span>
              </span>
              <span className="text-xs text-error font-medium">4-2-1 Rule Met</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-error h-full rounded-full" style={{ width: '85%' }} />
            </div>
            <span className="text-[10px] text-on-surface-variant">High-risk pre-proliferative state</span>
          </div>

          {/* Peripheral Non-Perfusion */}
          <div className="bg-surface-container-lowest/90 rounded-lg p-4 flex flex-col gap-3 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant uppercase font-semibold">
                Peripheral Non-Perfusion
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-primary font-medium">
                Sub-threshold
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl text-on-surface font-bold">
                18.4 <span className="text-xs font-normal text-on-surface-variant">%</span>
              </span>
              <span className="text-xs text-primary font-medium">+6.1% 36m</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '32%' }} />
            </div>
            <span className="text-[10px] text-on-surface-variant">Mid-to-far periphery on UWF</span>
          </div>
        </div>
      </section>
    </div>
  );
}
