import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
export const ProgressStepBar = ({ currentStage }) => {
    const stages = [
        { id: 'Lead', label: 'Lead' },
        { id: 'Meeting', label: 'Meeting' },
        { id: 'Proposal', label: 'Proposal' },
        { id: 'Negotiation', label: 'Negotiation' },
        { id: 'Won', label: 'Won' },
        { id: 'Project', label: 'Project' },
        { id: 'QA', label: 'QA Testing' },
        { id: 'Completed', label: 'Completed' }
    ];
    const getStageIndex = (stage) => {
        return stages.findIndex(s => s.id === stage);
    };
    const currentIndex = getStageIndex(currentStage);
    return (<div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-center justify-between overflow-x-auto scrollbar-none py-1">
        {stages.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            return (<React.Fragment key={stage.id}>
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${isCompleted
                    ? 'bg-blue-600 text-white'
                    : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {isCompleted ? <Check className="h-4 w-4"/> : idx + 1}
                </div>
                <span className={`text-xs font-semibold ${isCurrent
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : isCompleted
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500'}`}>
                  {stage.label}
                </span>
              </div>
              {idx < stages.length - 1 && (<ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-700 mx-1"/>)}
            </React.Fragment>);
        })}
      </div>
    </div>);
};
