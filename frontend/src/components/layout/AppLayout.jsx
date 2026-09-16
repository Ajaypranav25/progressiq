import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ClinicalDisclaimer } from '../common/ClinicalDisclaimer';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="p-4 lg:p-6 flex-1 flex flex-col gap-5 max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
          <footer className="border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">ProgressIQ</span>
              <span>•</span>
              <span>Retinal Fundus Photography Analysis</span>
              <span>•</span>
              <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-medium">
                Prototype — Clinical Review Required
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              5-Person Hackathon Baseline
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
