import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ClinicalDisclaimer } from '../common/ClinicalDisclaimer';

export function AppLayout() {
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [clinicianNpi, setClinicianNpi] = useState('marcus.vance@retina.progressiq.health');
  const [pacsKey, setPacsKey] = useState('••••••••••••••••');
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAuthSuccess(true);
    setTimeout(() => {
      setAuthSuccess(false);
      setIsLoginModalOpen(false);
    }, 900);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col selection:bg-primary selection:text-on-primary bg-[#0b0e13] text-[#e1e2ea]">
      {/* Ambient Global Aura Illumination */}
      <div className="fixed top-[-80px] left-1/2 -translate-x-1/2 w-[1100px] h-[360px] aura-backdrop z-0 opacity-70 pointer-events-none" />
      <div className="fixed top-[35%] -right-40 w-[600px] h-[550px] aura-glow-subtle z-0 opacity-40 pointer-events-none" />
      <div className="fixed bottom-0 -left-40 w-[600px] h-[500px] aura-glow-subtle z-0 opacity-30 pointer-events-none" />

      {/* Top Navbar */}
      <Navbar onOpenLogin={() => setIsLoginModalOpen(true)} />

      {/* Main Canvas */}
      <main className="relative z-10 flex-1 w-full max-w-[1720px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
        <ClinicalDisclaimer />
        <div className="flex-1 flex flex-col mt-3">
          <Outlet />
        </div>
      </main>

      {/* Global Footer */}
      <footer className="mt-auto border-t border-surface-variant/40 bg-surface-container-lowest/90 backdrop-blur-md px-6 py-3.5 relative z-10">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface">ProgressIQ</span>
            <span>—</span>
            <span>Longitudinal Diabetic Retinopathy &amp; DME Intelligence Suite</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>UWF Fundus &amp; Macular OCT Protocols</span>
            <span>•</span>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="text-primary hover:underline cursor-pointer"
            >
              1. Doctor Login
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-primary hover:underline cursor-pointer"
            >
              2. Standby
            </button>
            <button
              onClick={() => navigate('/patients')}
              className="text-primary hover:underline cursor-pointer"
            >
              3. Retinal Cohort
            </button>
            <button
              onClick={() => navigate('/patients/p-001')}
              className="text-primary hover:underline cursor-pointer"
            >
              4. Fundus Timeline
            </button>
            <button
              onClick={() => navigate('/results/scan-103')}
              className="text-primary hover:underline cursor-pointer"
            >
              5. Retinal Diagnostic Results
            </button>
          </div>
        </div>
      </footer>

      {/* SCREEN 1: DOCTOR LOGIN & PACS MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full relative">
            <div className="absolute -top-16 -left-16 w-64 h-64 aura-backdrop opacity-70" />
            <div className="glass-station relative z-10 p-8 rounded-2xl shadow-2xl border border-surface-variant/50 text-center">
              <div className="flex justify-end mb-1">
                <button
                  onClick={() => setIsLoginModalOpen(false)}
                  className="text-on-surface-variant hover:text-on-surface text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="w-16 h-16 mx-auto mb-4 p-1.5 rounded-full bg-surface-container-lowest border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.25)]">
                <span className="material-symbols-outlined text-primary text-3xl">visibility</span>
              </div>
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">
                Progress<span className="text-primary">IQ</span>
              </h2>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-1 mb-6">
                Longitudinal Retinal &amp; Macular AI Workstation
              </p>

              {authSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">verified</span>
                  <span>Station Authenticated. Loading credentials...</span>
                </div>
              ) : (
                <form className="space-y-4 text-left" onSubmit={handleLoginSubmit}>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Clinician EHR / NPI Account
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border border-surface-variant/60 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition font-mono text-xs"
                      type="text"
                      value={clinicianNpi}
                      onChange={(e) => setClinicianNpi(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Biometrics / DICOM Gateway Key
                    </label>
                    <input
                      className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border border-surface-variant/60 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      type="password"
                      value={pacsKey}
                      onChange={(e) => setPacsKey(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        defaultChecked
                        className="rounded bg-surface-container border-surface-variant text-primary focus:ring-0"
                        type="checkbox"
                      />
                      <span>Zeiss Forum / Topcon Link Sync</span>
                    </label>
                    <span className="text-primary text-[11px] hover:underline cursor-pointer">
                      Reset Key
                    </span>
                  </div>
                  <button
                    className="w-full mt-4 py-3 px-4 rounded-xl bg-primary-container text-on-primary font-semibold text-sm hover:bg-primary transition shadow-[0_0_18px_rgba(56,189,248,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[18px]">lock_open</span>
                    <span>Authenticate Retinal Station</span>
                  </button>
                </form>
              )}

              <div className="mt-6 pt-5 border-t border-surface-variant/30 flex items-center justify-center gap-3 text-[11px] text-on-surface-variant">
                <span>HIPAA Compliant</span>
                <span>•</span>
                <span>UWF &amp; SD-OCT Engine</span>
                <span>•</span>
                <span>v4.1 Stable</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
