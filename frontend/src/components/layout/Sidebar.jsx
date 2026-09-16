import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  FileBarChart,
  ChevronRight,
  UserCheck,
  AlertTriangle,
  History,
} from 'lucide-react';
import { getPatients } from '../../api/patientsApi';

export function Sidebar() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await getPatients();
      setPatients(data || []);
    }
    load();
  }, []);

  const navItems = [
    {
      to: '/',
      label: 'Workstation Dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: '/patients',
      label: 'Patient Directory',
      icon: Users,
      end: false,
    },
    {
      to: '/upload',
      label: 'Scan Intake & Analyze',
      icon: UploadCloud,
      end: false,
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-[calc(100vh-3.5rem)] sticky top-14">
      {/* Top navigation */}
      <div className="p-3 flex flex-col gap-5 overflow-y-auto">
        {/* Main links */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 font-mono">
            Navigation
          </div>
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Demo Patient Fast Selector (for Judges) */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Demo Cohort
            </span>
            <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1 rounded">
              {patients.length} records
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {patients.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/patients/${p.id}`)}
                className="w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-xs group"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-semibold text-slate-900 truncate">
                      {p.patientIdentifier}
                    </span>
                    {p.requiresReview && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="Requires review" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{p.name}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">
                    {p.totalScans} {p.totalScans === 1 ? 'scan' : 'scans'}
                  </span>
                  <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic pipeline summary card */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 text-[11px] text-slate-600">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1 text-xs">
            <History size={13} className="text-teal-600" />
            <span>Longitudinal Paradigm</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Current fundus images are evaluated alongside historical scans to establish verifiable diagnostic trajectories.
          </p>
        </div>
      </div>

      {/* Footer / Medical disclaimer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-start gap-2 text-[10px] text-slate-500 leading-tight">
          <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            Hackathon Research MVP. Non-clinical decision support.
          </span>
        </div>
      </div>
    </aside>
  );
}
