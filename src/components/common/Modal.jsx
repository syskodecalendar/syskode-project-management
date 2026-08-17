import React, { useEffect } from 'react';
import { X } from 'lucide-react';
export const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = '2xl' }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl'
    };
    return (<div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose}/>
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div className={`relative flex max-h-dvh w-full flex-col ${maxWidthClasses[maxWidth]} rounded-t-2xl bg-white shadow-2xl border border-slate-200 transition-all dark:bg-slate-900 dark:border-slate-800 sm:my-8 sm:max-h-[calc(100vh-2rem)] sm:rounded-xl`} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-5 dark:border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-900 sm:text-lg dark:text-white">
                {title}
              </h3>
              {subtitle && (<p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>)}
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300">
              <X className="h-5 w-5"/>
            </button>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>);
};
