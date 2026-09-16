import React from 'react';
import { Eye, RefreshCw, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';

export function ImagePreview({ file, previewUrl, onRemove, onReplace, eye, setEye, disabled = false }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white flex flex-col md:flex-row gap-5 items-start">
      {/* Retinal fundus image thumbnail / circular preview */}
      <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-lg bg-slate-950 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0 relative group shadow-inner">
        <img
          src={previewUrl}
          alt="Retinal Fundus Preview"
          className="w-full h-full object-contain"
        />
        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700">
          PREVIEW
        </div>
      </div>

      {/* Metadata & Controls */}
      <div className="flex-1 flex flex-col justify-between self-stretch min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Valid Fundus Image Loaded</span>
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mt-0.5 truncate max-w-sm" title={file?.name || 'fundus_scan.png'}>
                {file?.name || 'Selected Fundus Scan'}
              </h4>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onReplace}
                disabled={disabled}
                className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded border border-slate-200 transition-colors flex items-center gap-1"
                title="Replace image"
              >
                <RefreshCw size={12} />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded border border-rose-200 transition-colors flex items-center gap-1"
                title="Remove image"
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 text-xs">
            <div className="bg-slate-50 border border-slate-100 rounded p-2">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">File Size</span>
              <span className="font-medium text-slate-700">{file ? formatFileSize(file.size) : 'Simulated SVG'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded p-2">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Format</span>
              <span className="font-medium text-slate-700">{file?.type || 'image/png'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded p-2">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Modality</span>
              <span className="font-medium text-slate-700">Digital Fundus</span>
            </div>
          </div>

          {/* Laterality selector */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Laterality (Eye)
            </label>
            <div className="flex gap-2">
              {[
                { value: 'OD (Right Eye)', label: 'OD — Right Eye' },
                { value: 'OS (Left Eye)', label: 'OS — Left Eye' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEye(opt.value)}
                  disabled={disabled}
                  className={`px-3 py-1.5 text-xs rounded border font-medium transition-all ${
                    eye === opt.value
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-teal-600 shrink-0" />
          <span>Image ready for AI quality verification and DR severity classification.</span>
        </div>
      </div>
    </div>
  );
}
