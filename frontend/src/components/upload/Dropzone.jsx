import React, { useState, useRef } from 'react';
import { UploadCloud, FileImage, AlertCircle } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function Dropzone({ onFileSelected, disabled = false }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const inputRef = useRef(null);

  function validateAndSelect(file) {
    setErrorMessage(null);
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(jpe?g|png|tiff?|webp)$/i)) {
      setErrorMessage('Invalid file type. Please upload a standard retinal image (.jpg, .png, .tif).');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File exceeds 20MB limit (selected: ${formatFileSize(file.size)}).`);
      return;
    }

    onFileSelected(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  }

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-teal-500 bg-teal-50/50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.tif,.tiff,.webp"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndSelect(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center gap-2.5">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
            <UploadCloud size={24} />
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-800">
              Drag &amp; drop retinal fundus photography here
            </div>
            <div className="text-xs text-slate-500 mt-1">
              or <span className="text-teal-600 underline font-medium">browse local files</span> from workstation
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
            <span>Supported: JPG, PNG, TIFF</span>
            <span>•</span>
            <span>Max 20MB</span>
            <span>•</span>
            <span>Color Fundus Modality</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-md">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
