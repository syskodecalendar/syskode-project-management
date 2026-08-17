import React, { useState, useEffect } from 'react';
import { Search, Users2, Briefcase, ShieldCheck, ArrowRight } from 'lucide-react';
import { leadService } from '../../services/leadService';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { qaService } from '../../services/qaService';
import { infrastructureService } from '../../services/infrastructureService';
export const GlobalSearchModal = ({ isOpen, onClose, onNavigate }) => {
    const [query, setQuery] = useState('');
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                // toggle search
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    if (!isOpen)
        return null;
    const leads = query.trim() ? leadService.getLeads().filter(l => l.leadName.toLowerCase().includes(query.toLowerCase()) ||
        l.companyName.toLowerCase().includes(query.toLowerCase()) ||
        l.leadId.toLowerCase().includes(query.toLowerCase())).slice(0, 4) : [];
    const projects = query.trim() ? projectService.getProjects().filter(p => p.projectName.toLowerCase().includes(query.toLowerCase()) ||
        p.client.toLowerCase().includes(query.toLowerCase()) ||
        p.projectId.toLowerCase().includes(query.toLowerCase())).slice(0, 4) : [];
    const tasks = query.trim() ? taskService.getTasks().filter(t => t.taskName.toLowerCase().includes(query.toLowerCase()) ||
        t.assignedMember.toLowerCase().includes(query.toLowerCase())).slice(0, 4) : [];
    const testCases = query.trim() ? qaService.getTestCases().filter(tc => tc.scenario.toLowerCase().includes(query.toLowerCase()) ||
        tc.module.toLowerCase().includes(query.toLowerCase()) ||
        tc.testCaseId.toLowerCase().includes(query.toLowerCase())).slice(0, 4) : [];
    const domains = query.trim() ? infrastructureService.getDomains().filter(d => d.domainName.toLowerCase().includes(query.toLowerCase())).slice(0, 3) : [];
    const hasResults = leads.length > 0 || projects.length > 0 || tasks.length > 0 || testCases.length > 0 || domains.length > 0;
    return (<div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose}/>
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <Search className="h-5 w-5 text-slate-400 mr-3 shrink-0"/>
            <input type="text" autoFocus placeholder="Search leads, projects, tasks, QA test cases, domains..." value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"/>
            <kbd className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-400 dark:bg-slate-800">ESC</kbd>
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-3 space-y-4">
            {!query.trim() && (<div className="p-8 text-center text-xs text-slate-400">
                Search by a real client, lead, project, task, technology, or infrastructure record
              </div>)}

            {query.trim() && !hasResults && (<div className="p-8 text-center text-xs text-slate-400">
                No matching records found for "{query}".
              </div>)}

            {leads.length > 0 && (<div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center">
                  <Users2 className="h-3.5 w-3.5 mr-1.5 text-blue-500"/> Leads ({leads.length})
                </p>
                <div className="space-y-1">
                  {leads.map(lead => (<div key={lead.id} onClick={() => {
                    onNavigate('leads', lead.id);
                    onClose();
                }} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-800">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{lead.leadName}</p>
                        <p className="text-[11px] text-slate-500">{lead.companyName} • {lead.leadId}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400"/>
                    </div>))}
                </div>
              </div>)}

            {projects.length > 0 && (<div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center">
                  <Briefcase className="h-3.5 w-3.5 mr-1.5 text-emerald-500"/> Projects ({projects.length})
                </p>
                <div className="space-y-1">
                  {projects.map(proj => (<div key={proj.id} onClick={() => {
                    onNavigate('projects', proj.id);
                    onClose();
                }} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-800">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{proj.projectName}</p>
                        <p className="text-[11px] text-slate-500">{proj.client} • {proj.projectId}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400"/>
                    </div>))}
                </div>
              </div>)}

            {testCases.length > 0 && (<div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-rose-500"/> QA Test Cases ({testCases.length})
                </p>
                <div className="space-y-1">
                  {testCases.map(tc => (<div key={tc.id} onClick={() => {
                    onNavigate('qa', tc.id);
                    onClose();
                }} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-800">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{tc.testCaseId}: {tc.scenario}</p>
                        <p className="text-[11px] text-slate-500">Module: {tc.module} • QA: {tc.assignedQA}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400"/>
                    </div>))}
                </div>
              </div>)}
          </div>

        </div>
      </div>
    </div>);
};
