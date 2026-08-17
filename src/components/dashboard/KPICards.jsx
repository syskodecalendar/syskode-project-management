import React from 'react';
import { Users2, Calendar, FileText, Briefcase, AlertTriangle, DollarSign } from 'lucide-react';
import { leadService } from '../../services/leadService';
import { projectService } from '../../services/projectService';
import { infrastructureService } from '../../services/infrastructureService';
export const KPICards = ({ leadCounts: propLeadCounts, activeProjectsCount: propActiveProjectsCount, qaProjectsCount: propQaProjectsCount, renewalAlertsCount: propRenewalAlertsCount, totalPipelineValue: propTotalPipelineValue, onNavigate = (_tab) => { }, leadStats, projectStats }) => {
    const leadCounts = propLeadCounts || leadService.getPipelineCounts();
    const leadStatsData = leadStats || leadService.getLeadStats();
    const projectStatsData = projectStats || projectService.getProjectStats();
    const activeProjectsCount = propActiveProjectsCount ?? projectStatsData.active ?? 0;
    const qaProjectsCount = propQaProjectsCount ?? projectStatsData.inQA ?? 0;
    const renewalAlertsCount = propRenewalAlertsCount ?? infrastructureService.getRenewalWarnings().length;
    const totalPipelineValue = propTotalPipelineValue ?? leadStatsData.pipelineValue ?? 0;
    const cards = [
        {
            title: 'Total Active Leads',
            value: (leadCounts.New || 0) + (leadCounts.Contacted || 0) + (leadCounts['Follow-up'] || 0) + (leadCounts.Meeting || 0) + (leadCounts.Proposal || 0) + (leadCounts.Negotiation || 0),
            subtitle: `${leadCounts['Follow-up'] || 0} leads currently require follow-up`,
            icon: Users2,
            color: 'blue',
            tab: 'leads'
        },
        {
            title: 'Pipeline Value',
            value: `BHD ${(totalPipelineValue || 0).toLocaleString()}`,
            subtitle: 'Weighted active commercial pipeline',
            icon: DollarSign,
            color: 'emerald',
            tab: 'leads'
        },
        {
            title: 'Meetings Scheduled',
            value: leadCounts.Meeting || 0,
            subtitle: 'Client discovery & requirements calls',
            icon: Calendar,
            color: 'purple',
            tab: 'meetings'
        },
        {
            title: 'Proposals Active',
            value: (leadCounts.Proposal || 0) + (leadCounts.Negotiation || 0),
            subtitle: `${leadCounts.Negotiation || 0} in active commercial negotiation`,
            icon: FileText,
            color: 'amber',
            tab: 'proposals'
        },
        {
            title: 'Active Projects',
            value: activeProjectsCount,
            subtitle: `${qaProjectsCount} in QA • ${projectStatsData.averageCompletion ?? 0}% average completion`,
            icon: Briefcase,
            color: 'indigo',
            tab: 'projects'
        },
        {
            title: 'Renewal Warnings',
            value: renewalAlertsCount,
            subtitle: 'Domain, Hosting & SSL expiries <=60d',
            icon: AlertTriangle,
            color: renewalAlertsCount > 0 ? 'rose' : 'slate',
            tab: 'infrastructure'
        }
    ];
    const colorStyles = {
        blue: { bg: 'bg-[#eef9ff] border border-[#b9e3f6]', icon: 'text-[#0788C9]', text: 'text-[#0788C9]' },
        emerald: { bg: 'bg-emerald-50 border border-emerald-200', icon: 'text-emerald-600', text: 'text-emerald-600' },
        purple: { bg: 'bg-purple-50 border border-purple-200', icon: 'text-purple-600', text: 'text-purple-600' },
        amber: { bg: 'bg-amber-50 border border-amber-200', icon: 'text-amber-600', text: 'text-amber-600' },
        indigo: { bg: 'bg-indigo-50 border border-indigo-200', icon: 'text-indigo-600', text: 'text-indigo-600' },
        rose: { bg: 'bg-rose-50 border border-rose-200', icon: 'text-rose-600', text: 'text-rose-600' },
        slate: { bg: 'bg-slate-50 border border-slate-200', icon: 'text-slate-500', text: 'text-slate-500' }
    };
    return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c, idx) => {
            const Icon = c.icon;
            const style = colorStyles[c.color] || colorStyles.blue;
            return (<div key={idx} onClick={() => onNavigate(c.tab)} className="group flex flex-col justify-between rounded-2xl border border-[#d8e7f0] bg-white p-4 hover:border-[#9ed8f3] hover:bg-[#f7fbfe] transition-all cursor-pointer shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#667085]">
                  {c.title}
                </span>
                <div className={`p-2 rounded-xl ${style.bg}`}>
                  <Icon className={`h-4 w-4 ${style.icon}`}/>
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-[#071A35] tracking-tight">
                {c.value}
              </p>
            </div>

            <p className="mt-3 text-[11px] font-medium text-[#98A2B3] truncate">
              {c.subtitle}
            </p>
          </div>);
        })}
    </div>);
};
