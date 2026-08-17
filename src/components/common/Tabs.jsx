import React from 'react';
export const Tabs = ({ tabs, activeTab, onChange, className = '' }) => {
    return (<div className={`border-b border-slate-200 dark:border-slate-800 ${className}`}>
      <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-none">
        {tabs.map(tab => {
            const isActive = tab.id === activeTab;
            return (<button key={tab.id} onClick={() => onChange(tab.id)} className={`flex items-center space-x-2 border-b-2 py-3 px-1 text-sm font-medium whitespace-nowrap transition-colors ${isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}>
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (<span className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {tab.badge}
                </span>)}
            </button>);
        })}
      </nav>
    </div>);
};
