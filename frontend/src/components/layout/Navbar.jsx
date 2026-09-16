import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, PlusCircle, Activity, Stethoscope, Wifi, WifiOff } from 'lucide-react';
import { checkBackendHealth } from '../../api/client';

export function Navbar() {
  const navigate = useNavigate();
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

  return (
    <header className="h-14 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
      {/* Brand & Modality info */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-md bg-slate-900 text-teal-400 flex items-center justify-center font-semibold shadow-xs">
            <Eye size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 text-base leading-none">
                Progress<span className="text-teal-600">IQ</span>
              </span>
              <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                v1.0-MVP
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-none mt-1 hidden sm:block">
              Diabetic Retinopathy • Longitudinal Diagnostic Intelligence
            </p>
          </div>
        </Link>
      </div>

      {/* Center status pill */}
      <div className="hidden md:flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
            isBackendLive
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
          title={isBackendLive ? 'Connected to FastAPI Backend' : 'Running on simulated clinical API layer'}
        >
          {isBackendLive ? <Wifi size={12} className="text-emerald-600" /> : <WifiOff size={12} className="text-slate-400" />}
          <span className="font-medium text-[11px]">
            {isBackendLive ? 'FastAPI Connected' : 'Simulated Client Pipeline'}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors shadow-xs"
        >
          <PlusCircle size={14} />
          <span className="hidden sm:inline">Intake &amp; Analyze Scan</span>
          <span className="sm:hidden">Intake</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Clinician badge */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
            <Stethoscope size={14} />
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-semibold text-slate-800 leading-tight">Dr. S. Sharma, MD</div>
            <div className="text-[10px] text-slate-500 leading-tight">Retinal Diagnostics</div>
          </div>
        </div>
      </div>
    </header>
  );
}
