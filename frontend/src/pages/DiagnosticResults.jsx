import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatients } from '../api/patientsApi';
import { formatConfidence } from '../utils/formatters';

export function DiagnosticResults() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [currentScan, setCurrentScan] = useState(null);
  const [viewMode, setViewMode] = useState('side-by-side');
  const [gradCamIntensity, setGradCamIntensity] = useState(80);
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: patients } = await getPatients();
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

        // Fallback default to Eleanor Vance scan-103 if not found
        if (!matchedPatient && patients.length > 0) {
          matchedPatient = patients[0];
          matchedScan = matchedPatient.scans?.[matchedPatient.scans.length - 1];
        }

        setPatient(matchedPatient);
        setCurrentScan(matchedScan);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [scanId]);

  const pName = patient?.name || 'Eleanor Vance';
  const pAge = patient?.age || 64;
  const pGender = patient?.gender?.[0] || 'F';
  const confidence = currentScan?.confidence ? (currentScan.confidence * 100).toFixed(1) : '94.2';
  const severityText = currentScan?.severity || 'Severe NPDR';

  const heatmapOpacityValue = gradCamIntensity / 100;

  return (
    <div className="py-2 md:py-6 space-y-6">
      {/* 1. EXECUTIVE DIAGNOSTIC BANNER */}
      <div className="glass-station rounded-2xl p-6 border border-surface-variant/40 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-16 -right-16 w-80 h-80 aura-glow-subtle opacity-50 pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>Retinal Longitudinal AI Diagnostic Finding</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error-container/40 text-error border border-error/30">
                Severe NPDR with Center-Involved Diabetic Macular Edema (CST 412 µm vs &lt;260 µm norm)
              </span>
              <span className="text-xs text-on-surface-variant">Interval: 36 Months (Sep 2021 → Oct 2024)</span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
                {severityText} + Center-Involved DME (OD) — High Neovascularization Risk
              </h2>
              <span className="text-xl font-bold text-primary font-mono">{confidence}% AI confidence</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant pt-1">
              <span>
                <strong>Patient:</strong> {pName} ({pAge}{pGender})
              </span>
              <span>•</span>
              <span>
                <strong>MRN:</strong> 9042-RETINA
              </span>
              <span>•</span>
              <span>
                <strong>Modality:</strong> Optos UWF 200° + Zeiss Cirrus HD-OCT 5000
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">RetinaDelta v4.1 Pipeline Complete (1.8s)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => alert('Diagnostic Dossier PDF export queued.')}
              className="px-4 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-white/5 transition flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              <span>Export Retinal PDF</span>
            </button>
            <button
              onClick={() => alert('Verified & transmitted to PACS / DICOM SR.')}
              className="px-5 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-xs font-bold shadow-[0_0_15px_rgba(56,189,248,0.25)] transition flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Confirm &amp; Export PACS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DUAL RETINAL SLICES COMPARISON & VOLUMETRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: Side-by-Side Synchronized Fundus / OCT Viewer */}
        <div className="lg:col-span-8 glass-station rounded-2xl p-6 border border-surface-variant/40 space-y-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-variant/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Ultra-Widefield Fundus &amp; Macular OCT Evidence • Grad-CAM Lesion Attention Map
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="flex items-center bg-surface-container-lowest rounded-lg p-1 border border-white/5">
                <button
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${
                    viewMode === 'side-by-side'
                      ? 'bg-primary/20 text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setViewMode('difference')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${
                    viewMode === 'difference'
                      ? 'bg-primary/20 text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Difference Map
                </button>
              </div>

              <div className="flex items-center gap-2 pl-2 border-l border-surface-variant/40">
                <span className="text-on-surface-variant text-[11px]">Grad-CAM Intensity:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gradCamIntensity}
                  onChange={(e) => setGradCamIntensity(Number(e.target.value))}
                  className="w-16 accent-primary h-1 bg-surface-container rounded-lg cursor-pointer"
                />
                <span className="text-primary font-mono font-bold text-[11px]">{gradCamIntensity}%</span>
              </div>
            </div>
          </div>

          {/* Dual Retinal Canvas Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slice 1: Baseline Visit */}
            <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-variant/30 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">
                    BASELINE RETINA
                  </span>
                  <span className="text-on-surface-variant">Sep 20, 2021</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono font-semibold">
                  CST: 248 µm (Mild NPDR)
                </span>
              </div>

              {/* Retinal Fundus Simulation SVG (Baseline) */}
              <div className="relative w-full aspect-square bg-[#0c0806] rounded-lg overflow-hidden flex items-center justify-center border border-white/5">
                <svg className="w-full h-full object-contain" viewBox="0 0 320 320">
                  <defs>
                    <radialGradient cx="50%" cy="50%" id="fundusBase" r="50%">
                      <stop offset="0%" stopColor="#b45309" stopOpacity="0.8" />
                      <stop offset="60%" stopColor="#78350f" stopOpacity="0.9" />
                      <stop offset="85%" stopColor="#451a03" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#1c0a02" stopOpacity="1" />
                    </radialGradient>
                  </defs>

                  {/* Retinal Disc Background */}
                  <circle cx="160" cy="160" fill="url(#fundusBase)" r="140" stroke="#78350f" strokeWidth="2" />
                  {/* Optic Disc */}
                  <ellipse cx="230" cy="160" fill="#fef08a" opacity="0.9" rx="16" ry="22" />
                  <ellipse cx="230" cy="160" fill="#fde047" opacity="0.6" rx="9" ry="12" />
                  {/* Major Vascular Arcades */}
                  <path d="M 230 160 C 215 110, 160 85, 110 95 C 75 102, 50 120, 35 140" fill="none" stroke="#7f1d1d" strokeLinecap="round" strokeWidth="3" />
                  <path d="M 230 160 C 215 210, 160 235, 110 225 C 75 218, 50 200, 35 180" fill="none" stroke="#7f1d1d" strokeLinecap="round" strokeWidth="3" />
                  <path d="M 230 160 C 190 150, 170 145, 130 148" fill="none" stroke="#991b1b" strokeLinecap="round" strokeWidth="1.8" />
                  {/* Macula / Fovea Center */}
                  <circle cx="140" cy="160" fill="#451a03" opacity="0.75" r="24" />
                  <circle cx="140" cy="160" fill="#1c0a02" r="6" />
                  {/* Few Baseline Microaneurysms */}
                  <circle cx="115" cy="135" fill="#ef4444" r="2" />
                  <circle cx="95" cy="155" fill="#ef4444" r="1.5" />
                  <circle cx="165" cy="190" fill="#ef4444" r="2" />
                  {/* Faint grid overlay */}
                  <circle cx="140" cy="160" fill="none" r="32" stroke="#38bdf8" strokeDasharray="2 3" strokeWidth="0.8" />
                </svg>
                <div className="absolute bottom-2 left-2 text-[10px] font-mono text-on-surface-variant bg-surface-container-lowest/80 px-2 py-0.5 rounded border border-white/5">
                  Field: 50° Macula-Centered • TRC-50DX
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>Baseline Central Subfield Thickness</span>
                <span className="text-on-surface font-medium">248 µm • Fovea Intact</span>
              </div>
            </div>

            {/* Slice 2: Current Visit with Heatmap & Macular Edema */}
            <div className="bg-surface-container-lowest rounded-xl p-4 border border-primary/30 relative overflow-hidden shadow-[0_0_20px_rgba(56,189,248,0.1)]">
              <div className="flex items-center justify-between text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-semibold">
                    CURRENT RETINA (M36)
                  </span>
                  <span className="text-on-surface font-bold">Oct 18, 2024</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-error-container/40 text-error font-mono font-bold">
                  CST: 412 µm (Severe NPDR)
                </span>
              </div>

              {/* Retinal Fundus Current + Grad-CAM Heatmap */}
              <div className="relative w-full aspect-square bg-[#0c0806] rounded-lg overflow-hidden flex items-center justify-center border border-white/5">
                <svg className="w-full h-full object-contain" viewBox="0 0 320 320">
                  <defs>
                    <radialGradient cx="50%" cy="50%" id="maculaHeat" r="50%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.88" />
                      <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.65" />
                      <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient cx="50%" cy="50%" id="arcadeHeat" r="50%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Retinal Disc Background */}
                  <circle cx="160" cy="160" fill="url(#fundusBase)" r="140" stroke="#78350f" strokeWidth="2" />
                  {/* Optic Disc */}
                  <ellipse cx="230" cy="160" fill="#fef08a" opacity="0.9" rx="16" ry="22" />
                  <ellipse cx="230" cy="160" fill="#fde047" opacity="0.6" rx="9" ry="12" />
                  {/* Vascular Arcades with Tortuosity */}
                  <path d="M 230 160 C 215 110, 160 85, 110 95 C 75 102, 50 120, 35 140" fill="none" stroke="#7f1d1d" strokeLinecap="round" strokeWidth="3.5" />
                  <path d="M 230 160 C 215 210, 160 235, 110 225 C 75 218, 50 200, 35 180" fill="none" stroke="#7f1d1d" strokeLinecap="round" strokeWidth="3.5" />
                  <path d="M 230 160 C 190 150, 170 145, 130 148" fill="none" stroke="#991b1b" strokeLinecap="round" strokeWidth="2" />

                  {/* Grad-CAM Attention Heatmap over Macula & Edema (Controlled by Slider) */}
                  <g opacity={heatmapOpacityValue}>
                    <circle cx="140" cy="160" fill="url(#maculaHeat)" r="44" />
                    <circle cx="110" cy="100" fill="url(#arcadeHeat)" r="24" />
                  </g>

                  {/* Retinal Hard Exudates */}
                  <circle cx="132" cy="142" fill="#fef08a" r="3.5" />
                  <circle cx="148" cy="140" fill="#fef08a" r="3" />
                  <circle cx="155" cy="155" fill="#fde047" r="4" />
                  <circle cx="125" cy="168" fill="#fef08a" r="3" />
                  <circle cx="145" cy="178" fill="#fef08a" r="3.5" />

                  {/* Intraretinal Hemorrhages */}
                  <ellipse cx="120" cy="120" fill="#991b1b" rx="6" ry="3" />
                  <circle cx="105" cy="150" fill="#dc2626" r="3" />
                  <circle cx="160" cy="120" fill="#b91c1c" r="3.5" />
                  <ellipse cx="110" cy="200" fill="#991b1b" rx="8" ry="4" />
                  <circle cx="85" cy="175" fill="#dc2626" r="4" />

                  {/* AI Lesion Target Bounding Box */}
                  <rect fill="none" height="60" stroke="#f43f5e" strokeDasharray="3 2" strokeWidth="1.5" width="60" x="110" y="130" />
                  <text fill="#f43f5e" fontFamily="'Inter', sans-serif" fontSize="9" fontWeight="bold" x="80" y="210">
                    Center-Involved DME (CST: 412µm)
                  </text>
                </svg>

                <div className="absolute bottom-2 left-2 text-[10px] font-mono text-on-surface-variant bg-surface-container-lowest/80 px-2 py-0.5 rounded border border-white/5">
                  Zeiss Cirrus OCT Co-Registered • Residual 0.2mm
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-error font-medium">Macular Subfield Expansion: +164 µm</span>
                <span className="text-emerald-400 font-medium">Model Quality Index: 0.97</span>
              </div>
            </div>
          </div>

          {/* Heatmap Legend */}
          <div className="p-3.5 rounded-xl bg-surface-container-lowest/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-on-surface-variant">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-on-surface">Grad-CAM Lesion Activation:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Mild MA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Hard Exudates</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-error" />
                <span className="text-error font-semibold">Center-Involved Edema &amp; IRMA</span>
              </div>
            </div>
            <div className="text-[10px] text-on-surface-variant italic">
              *Attention highlights active fluid accumulation and microvascular leakage validated against ETDRS criteria.
            </div>
          </div>
        </div>

        {/* Right 4 Columns: ETDRS 9-Grid & Subfield Thickness */}
        <div className="lg:col-span-4 space-y-5">
          <div className="glass-station rounded-2xl p-6 border border-surface-variant/40 space-y-4 shadow-2xl">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center justify-between">
              <span>ETDRS 9-Grid Macular Thickness</span>
              <span className="text-primary font-mono text-xs">ICD-10: E11.3311</span>
            </h3>

            {/* Metrics */}
            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-lowest/90 border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-on-surface">Central Subfield Thickness (CST)</span>
                  <span className="text-error font-bold text-sm font-mono">412 µm</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-secondary to-error h-full w-[88%]" />
                </div>
                <div className="flex justify-between text-[11px] text-on-surface-variant pt-0.5">
                  <span>Baseline: 248 µm</span>
                  <span className="text-error font-medium font-mono">Δ +164 µm Thickening</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-lowest/90 border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-on-surface">Inner Temporal Subfield</span>
                  <span className="text-error font-bold text-sm font-mono">386 µm</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-error h-full w-[78%]" />
                </div>
                <div className="flex justify-between text-[11px] text-on-surface-variant pt-0.5">
                  <span>Intraretinal fluid cysts</span>
                  <span className="text-error font-medium font-mono">+98 µm YoY</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-lowest/90 border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-on-surface">Inner Inferior Subfield</span>
                  <span className="text-secondary font-bold text-sm font-mono">342 µm</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full w-[65%]" />
                </div>
                <div className="flex justify-between text-[11px] text-on-surface-variant pt-0.5">
                  <span>Circinate lipid rings</span>
                  <span className="text-secondary font-medium">Mild sponge-like edema</span>
                </div>
              </div>
            </div>

            {/* Cohort Progression Benchmark */}
            <div className="pt-3 border-t border-surface-variant/40 space-y-2 text-xs">
              <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Cohort Progression Benchmark
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Expected Progression Rate (HbA1c &lt;7)</span>
                <span className="font-mono text-on-surface-variant">&lt;5% / 2 years</span>
              </div>
              <div className="flex items-center justify-between text-on-surface">
                <span>{pName} Progression Velocity</span>
                <span className="font-mono font-bold text-error">2-Step Worsening (High Risk)</span>
              </div>
              <div className="flex items-center justify-between text-on-surface">
                <span>1-Year PDR Transition Probability</span>
                <span className="font-mono font-bold text-secondary">52.8% without anti-VEGF</span>
              </div>
            </div>
          </div>

          {/* Quality Pipeline Card */}
          <div className="glass-station rounded-2xl p-5 border border-surface-variant/40 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-on-surface uppercase tracking-wider">Retinal Ingestion Pipeline</span>
              <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-semibold">Passed All Filters</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2 rounded-lg bg-surface-container-lowest/80 border border-white/5">
                <div className="text-[10px] text-on-surface-variant">Media Clarity</div>
                <div className="text-sm font-bold text-emerald-400">97.8%</div>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-lowest/80 border border-white/5">
                <div className="text-[10px] text-on-surface-variant">OCT Signal</div>
                <div className="text-sm font-bold text-primary">9/10</div>
              </div>
              <div className="p-2 rounded-lg bg-surface-container-lowest/80 border border-white/5">
                <div className="text-[10px] text-on-surface-variant">ETDRS Grid</div>
                <div className="text-sm font-bold text-secondary">Co-Aligned</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. EXPLAINABLE DIAGNOSTIC SUMMARY & CLINICAL AUDIT NOTE */}
      <div className="glass-station rounded-2xl p-6 border border-surface-variant/40 space-y-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-variant/40 pb-4">
          <div>
            <span className="text-[11px] font-mono text-primary uppercase tracking-wider">
              MODULE: RETINA_DIAGNOSTIC_REPORT • ID: REP-20241018-RET4
            </span>
            <h3 className="text-base font-bold text-on-surface">
              Explainable Vitreoretinal Diagnostic Summary &amp; Clinical Audit Note
            </h3>
          </div>
          <div className="text-xs text-on-surface-variant">
            Generated automatically by <span className="text-primary font-medium">RetinaDelta Engine v4.1</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-surface-container-lowest/90 border border-white/5 space-y-2">
            <div className="font-semibold text-on-surface-variant uppercase tracking-wider text-[10px]">
              CURRENT RETINAL FINDING
            </div>
            <div className="font-bold text-on-surface text-sm">Severe NPDR + CI-DME</div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              Classified with <strong className="text-primary">{confidence}% AI confidence</strong>. High-resolution
              SD-OCT reveals center-involved edema measuring 412 µm with cystic spaces.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest/90 border border-white/5 space-y-2">
            <div className="font-semibold text-on-surface-variant uppercase tracking-wider text-[10px]">
              LONGITUDINAL STEP DELTA
            </div>
            <div className="font-bold text-error text-sm">2-Step ETDRS Worsening</div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              Prior classification: Moderate NPDR (Month 14). Progression delta:{' '}
              <strong className="text-error">+2 ETDRS steps</strong> driven by quadrupled microaneurysms and IRMA in 2
              quadrants.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest/90 border border-white/5 space-y-2">
            <div className="font-semibold text-on-surface-variant uppercase tracking-wider text-[10px]">
              GRAD-CAM INTERPRETATION
            </div>
            <div className="font-bold text-secondary text-sm">Foveal &amp; Arcade Hotspots</div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              Activation weights localize sharply around the foveal avascular zone and inferior temporal arcade where
              capillary non-perfusion is most severe.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 space-y-2">
            <div className="font-semibold text-error uppercase tracking-wider text-[10px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">clinical_notes</span>
              <span>CLINICAL SAFETY NOTICE</span>
            </div>
            <div className="font-bold text-on-surface text-sm">Urgent Anti-VEGF Protocol</div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed">
              Center involvement with visual acuity decrease mandates prompt clinical evaluation. Decision on anti-VEGF
              injection rests with vitreoretinal physician.
            </p>
          </div>
        </div>

        {/* Attestation Sign-off Bar */}
        <div className="pt-4 border-t border-surface-variant/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-full bg-surface-container border border-primary/30 flex items-center justify-center font-bold text-primary">
              MV
            </div>
            <div>
              <div className="text-on-surface font-semibold">Assigned Vitreoretinal Specialist</div>
              <div className="text-on-surface-variant text-[11px]">
                Dr. Marcus Vance, MD • Medical Retina • License: #OP-88219 • NPI: 1948201994
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('Order generated for Ultra-Widefield Fluorescein Angiography (UWF-FA).')}
              className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-white/5 transition cursor-pointer"
            >
              Request Fluorescein Angiography (UWF-FA)
            </button>
            <button
              onClick={() => setIsSigned(true)}
              disabled={isSigned}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                isSigned
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-primary-container hover:bg-primary text-on-primary shadow-[0_0_15px_rgba(56,189,248,0.25)]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isSigned ? 'check_circle' : 'vaccines'}
              </span>
              <span>{isSigned ? 'Signed & Attested to PACS' : 'Schedule Anti-VEGF Injection & Sign'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
