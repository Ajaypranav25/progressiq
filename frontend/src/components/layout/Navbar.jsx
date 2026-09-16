import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { checkBackendHealth } from '../../api/client';

export function Navbar({ onOpenLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isBackendLive, setIsBackendLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function ping() {
      const healthy = await checkBackendHealth();
      if (mounted) setIsBackendLive(healthy);
    }
    ping();
    const interval = setInterval(ping, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/welcome';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0b0e13]/92 backdrop-blur-xl border-b border-surface-variant/40 px-4 md:px-6 py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-[0_1px_12px_rgba(0,0,0,0.4)]">
      {/* Left Logo Branding */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-primary/30 p-1 bg-surface-container-lowest flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <span className="material-symbols-outlined text-primary text-[20px]">visibility</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-tight text-on-surface">
                Progress<span className="text-primary">IQ</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/25">
                FDA 510(k)
              </span>
            </div>
            <span className="text-[10px] text-on-surface-variant font-medium tracking-wider uppercase">
              Longitudinal Retinal AI Intelligence
            </span>
          </div>
        </Link>

        {/* Telemetry Status Badges */}
        <div className="hidden xl:flex items-center gap-3 pl-4 border-l border-surface-variant/40 text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low border border-white/5">
            <span className="material-symbols-outlined text-[15px] text-primary">sensors</span>
            <span className="text-on-surface font-mono">Station: Retina-Suite 2</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low border border-white/5">
            <span className={`material-symbols-outlined text-[15px] ${isBackendLive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isBackendLive ? 'cloud_done' : 'cloud_sync'}
            </span>
            <span>
              PACS/EHR:{' '}
              <strong className={isBackendLive ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'}>
                {isBackendLive ? 'FastAPI Connected' : 'Simulated PACS (Zeiss Forum)'}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-low border border-white/5">
            <span className="material-symbols-outlined text-[15px] text-tertiary">biotech</span>
            <span className="font-mono">Model: RetinaDelta v4.1</span>
          </div>
        </div>
      </div>

      {/* Center/Right: Multi-Screen Tab Switcher */}
      <div className="flex items-center justify-between md:justify-end gap-2.5 flex-wrap">
        <nav className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-xl border border-surface-variant/40 text-xs">
          <button
            onClick={() => onOpenLogin && onOpenLogin()}
            className="px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface transition font-medium flex items-center gap-1.5 border border-transparent hover:bg-surface-container/50 cursor-pointer"
            title="Authenticate Station"
          >
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span className="hidden sm:inline">1. Doctor Login</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className={`px-2.5 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 border ${
              isActive('/') && !location.pathname.startsWith('/patients') && !location.pathname.startsWith('/results') && !location.pathname.startsWith('/upload')
                ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_rgba(56,189,248,0.18)] font-semibold'
                : 'text-on-surface-variant hover:text-on-surface border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">pause_circle</span>
            <span className="hidden sm:inline">2. Standby</span>
          </button>

          <button
            onClick={() => navigate('/patients')}
            className={`px-2.5 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 border ${
              location.pathname === '/patients'
                ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_rgba(56,189,248,0.18)] font-semibold'
                : 'text-on-surface-variant hover:text-on-surface border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span className="hidden sm:inline">3. Retinal Cohort</span>
          </button>

          <button
            onClick={() => navigate('/patients/p-001')}
            className={`px-2.5 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 border ${
              location.pathname.startsWith('/patients/')
                ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_rgba(56,189,248,0.18)] font-semibold'
                : 'text-on-surface-variant hover:text-on-surface border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">timeline</span>
            <span className="hidden md:inline">4. Longitudinal Timeline</span>
            <span className="md:hidden">4. Timeline</span>
          </button>

          <button
            onClick={() => navigate('/results/scan-103')}
            className={`px-2.5 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 border ${
              location.pathname.startsWith('/results')
                ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_rgba(56,189,248,0.18)] font-semibold'
                : 'text-on-surface-variant hover:text-on-surface border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">remove_red_eye</span>
            <span className="hidden md:inline">5. Diagnostic Results</span>
            <span className="md:hidden">5. Results</span>
          </button>
        </nav>

        {/* Upload Scan CTA */}
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center gap-1.5 bg-primary-container text-on-primary hover:bg-primary px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-[0_0_12px_rgba(56,189,248,0.25)]"
        >
          <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
          <span className="hidden lg:inline">+ Upload Fundus / OCT</span>
          <span className="lg:hidden">Upload</span>
        </button>

        {/* Clinician Profile */}
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-surface-variant/40">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-surface-container-low border border-primary/20 text-[11px] text-on-surface">
            <span className="material-symbols-outlined text-[14px] text-primary">ophthalmology</span>
            <span className="font-medium">Vitreoretinal Mode</span>
          </div>
          <div className="w-7 h-7 rounded-full overflow-hidden border border-primary/30 bg-surface-container flex items-center justify-center text-primary font-bold text-xs">
            MV
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-semibold text-on-surface">Dr. M. Vance, MD</div>
            <div className="text-[10px] text-on-surface-variant">Medical Retina</div>
          </div>
        </div>
      </div>
    </header>
  );
}
