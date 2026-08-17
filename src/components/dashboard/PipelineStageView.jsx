import React from 'react';
import { ArrowRight } from 'lucide-react';
import { leadService } from '../../services/leadService';
export const PipelineStageView = ({ leads: propLeads, onSelectLead = (_lead) => { } }) => {
    const leads = propLeads || leadService.getLeads() || [];
    const stages = [
        { key: 'New', label: 'New Leads', statusMatch: ['New Lead'] },
        { key: 'Contacted', label: 'Contacted', statusMatch: ['Contacted'] },
        { key: 'Followup', label: 'Follow-up', statusMatch: ['Follow-up Required'] },
        { key: 'Meeting', label: 'Meeting', statusMatch: ['Push to Meeting', 'Meeting Scheduled', 'Meeting Completed'] },
        { key: 'Proposal', label: 'Proposal', statusMatch: ['Requirement Gathering', 'Proposal Preparing', 'Proposal Sent', 'Waiting for Client'] },
        { key: 'Negotiation', label: 'Negotiation', statusMatch: ['Negotiation'] },
        { key: 'Won', label: 'Won Projects', statusMatch: ['Won'] }
    ];
    return (<div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-zinc-100">
            Lead Pipeline Visualizer
          </h3>
          <p className="text-xs text-zinc-400">
            Current distribution across sales qualification & negotiation stages
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stages.map(stg => {
            const matchedLeads = leads.filter(l => stg.statusMatch.includes(l.status));
            const totalVal = matchedLeads.reduce((acc, l) => acc + (l.estimatedProjectValue || 0), 0);
            return (<div key={stg.key} className="flex flex-col rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-semibold text-zinc-200">
                  {stg.label}
                </span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                  {matchedLeads.length}
                </span>
              </div>

              <p className="mt-2 text-[11px] font-bold text-emerald-400">
                BHD {totalVal.toLocaleString()}
              </p>

              <div className="mt-3 space-y-2 flex-1 max-h-56 overflow-y-auto pr-1">
                {matchedLeads.length === 0 ? (<p className="py-4 text-center text-[10px] text-zinc-500">No leads</p>) : (matchedLeads.map(l => (<div key={l.id} onClick={() => onSelectLead(l)} className="group rounded-lg border border-zinc-800/80 bg-zinc-900/90 p-2.5 hover:border-blue-500/60 hover:bg-zinc-800/80 cursor-pointer transition-all">
                      <p className="text-xs font-bold text-zinc-100 truncate group-hover:text-blue-400">
                        {l.leadName}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {l.companyName}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-zinc-300">
                          BHD {(l.estimatedProjectValue || 0).toLocaleString()}
                        </span>
                        <ArrowRight className="h-3 w-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                      </div>
                    </div>)))}
              </div>
            </div>);
        })}
      </div>
    </div>);
};
