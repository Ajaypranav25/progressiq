import React from 'react';
import { SAMPLE_FUNDUS_SCANS } from '../../api/mockData';
import { SeverityBadge } from '../common/SeverityBadge';
import { Sparkles } from 'lucide-react';

export function SampleScansSelector({ onSelectSample, selectedSampleId, disabled = false }) {
  return (
    <div className="border border-slate-200 bg-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-teal-50 text-teal-600 flex items-center justify-center">
            <Sparkles size={12} />
          </div>
          <h4 className="text-xs font-semibold text-slate-800">
            Quick Sample Fundus Scans (Judge &amp; Demo Evaluation)
          </h4>
        </div>
        <span className="text-[11px] text-slate-400">Click to load instantly</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {SAMPLE_FUNDUS_SCANS.map((sample) => {
          const isSelected = selectedSampleId === sample.id;
          return (
            <button
              key={sample.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectSample(sample)}
              className={`text-left p-2.5 rounded-md border transition-all flex items-center gap-3 ${
                isSelected
                  ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
              }`}
            >
              <div className="w-12 h-12 rounded bg-slate-950 overflow-hidden shrink-0 border border-slate-300">
                <img src={sample.imageUrl} alt={sample.label} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-slate-900 text-xs truncate">
                    {sample.label.split(':')[0]}
                  </span>
                  <SeverityBadge severity={sample.severityIndex} size="sm" />
                </div>
                <p className="text-[11px] text-slate-500 truncate leading-tight">
                  {sample.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
