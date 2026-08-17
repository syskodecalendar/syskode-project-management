import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

export const ExcelExportButton = ({ onClick, label = 'Export Excel', disabled = false, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[#9ed8f3] bg-white px-3.5 py-2 text-xs font-bold text-[#075f91] shadow-sm transition-colors hover:border-[#00AEEF] hover:bg-[#eef9ff] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
  >
    <FileSpreadsheet className="h-4 w-4"/>
    <span>{label}</span>
  </button>
);
