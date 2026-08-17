import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
export const Toast = ({ id, type, message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(id), 4000);
        return () => clearTimeout(timer);
    }, [id, onClose]);
    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500"/>,
        error: <AlertCircle className="h-5 w-5 text-rose-500"/>,
        info: <Info className="h-5 w-5 text-blue-500"/>
    };
    const bgStyles = {
        success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100',
        error: 'border-rose-200 bg-rose-50 text-rose-900 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-100',
        info: 'border-blue-200 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100'
    };
    return (<div className={`flex items-center space-x-3 rounded-lg border p-4 shadow-lg backdrop-blur-xs transition-all ${bgStyles[type]}`}>
      <div>{icons[type]}</div>
      <p className="text-sm font-medium">{message}</p>
      <button onClick={() => onClose(id)} className="ml-auto rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10">
        <X className="h-4 w-4"/>
      </button>
    </div>);
};
