import React from 'react';
import { AlertTriangle, Server, Shield, Globe } from 'lucide-react';
import { infrastructureService } from '../../services/infrastructureService';
export const RenewalAlertsCard = ({ warnings: propWarnings, onNavigate = (_tab, _recordId) => { } }) => {
    const warnings = propWarnings || infrastructureService.getRenewalWarnings() || [];
    const getIcon = (type) => {
        if (type === 'Domain')
            return <Globe className="h-4 w-4 text-blue-500"/>;
        if (type === 'Hosting')
            return <Server className="h-4 w-4 text-emerald-500"/>;
        return <Shield className="h-4 w-4 text-purple-500"/>;
    };
    const severityBadge = (severity) => {
        switch (severity) {
            case 'Expired':
                return 'bg-rose-950 text-rose-300 border border-rose-800/50';
            case 'Critical (<=7d)':
                return 'bg-rose-950/80 text-rose-300 border border-rose-800/50';
            case 'High (<=15d)':
                return 'bg-amber-950/80 text-amber-300 border border-amber-800/50';
            case 'Medium (<=30d)':
                return 'bg-blue-950/80 text-blue-300 border border-blue-800/50';
            default:
                return 'bg-zinc-800 text-zinc-300 border border-zinc-700/50';
        }
    };
    return (<div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-amber-400"/>
          <h3 className="text-base font-bold text-zinc-100">
            Infrastructure & Contract Renewals
          </h3>
        </div>
        <button onClick={() => onNavigate('infrastructure')} className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
          View Infrastructure Tab →
        </button>
      </div>

      <div className="space-y-2.5 max-h-64 overflow-y-auto">
        {warnings.length === 0 ? (<p className="py-6 text-center text-xs text-zinc-500">
            No renewal warnings are currently recorded.
          </p>) : (warnings.map(w => (<div key={w.id} onClick={() => onNavigate('infrastructure', w.relatedProject)} className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/60 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  {getIcon(w.type)}
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-100">
                    {w.title}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Expiry Date: {w.expiryDate} ({w.daysRemaining} days remaining)
                  </p>
                </div>
              </div>

              <span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${severityBadge(w.severity)}`}>
                {w.severity}
              </span>
            </div>)))}
      </div>
    </div>);
};
