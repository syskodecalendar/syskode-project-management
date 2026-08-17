import React, { useState } from 'react';
import { hasPermission } from '../../services/permissionService';
import { Badge } from '../common/Badge';
import { Search, Plus, Clock, Trash2 } from 'lucide-react';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';
export const ProjectsList = ({ projects, currentUser, onSelectProject, onCreateProject, onDeleteProject }) => {
    const canManage = hasPermission(currentUser, 'manage_projects');
    const canDelete = hasPermission(currentUser, 'delete_projects');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const filtered = projects.filter(p => {
        const matchesSearch = p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.manualStatus || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.projectStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const getHealthBadge = (health) => {
        switch (health) {
            case 'On Track':
                return <Badge variant="green">🟢 On Track</Badge>;
            case 'Attention':
                return <Badge variant="amber">🟡 Attention</Badge>;
            case 'At Risk':
                return <Badge variant="red">🔴 At Risk</Badge>;
            default:
                return <Badge variant="gray">{health}</Badge>;
        }
    };
    return (<div className="space-y-4">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex w-full flex-1 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
            <input type="text" placeholder="Search by Project Name, Client, or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full sm:w-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <option value="All">All Statuses</option>
            {['Planning', 'Requirements', 'UI/UX', 'Development', 'Internal Testing', 'Client UAT', 'Changes', 'Deployment', 'Support', 'Completed', 'On Hold'].map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <ExcelExportButton label="Export Projects" onClick={() => excelExportService.exportRows(
            `syskode-projects-${new Date().toISOString().slice(0, 10)}`,
            'Projects',
            filtered.map(proj => ({
              Project_ID: proj.projectId, Project: proj.projectName, Client: proj.client, Project_Manager: proj.projectManager || '',
              Type: proj.projectType || '', Status: proj.projectStatus, Manual_Status: proj.manualStatus || '',
              Progress_Percentage: Number(proj.progressPercentage) || 0, Health: proj.healthStatus || '',
              Contract_Value_BHD: Number(proj.contractValue) || 0, Expected_Completion: proj.expectedCompletionDate || '',
              Support_Period: proj.supportPeriod || ''
            }))
          )}/>
          {canManage && <button onClick={onCreateProject} className="flex w-full sm:w-auto items-center justify-center space-x-1.5 rounded-lg bg-[#0788C9] px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#066fa5] transition-colors shrink-0">
            <Plus className="h-4 w-4"/>
            <span>New Project</span>
          </button>}
        </div>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(proj => (<div key={proj.id} onClick={() => onSelectProject(proj)} className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md hover:border-blue-300 cursor-pointer transition-all dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  {proj.projectId}
                </span>
                <div className="flex items-center gap-2">{getHealthBadge(proj.healthStatus)}{canDelete && <button onClick={(e) => { e.stopPropagation(); onDeleteProject(proj); }} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50" title="Delete Project"><Trash2 className="h-4 w-4"/></button>}</div>
              </div>

              <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                {proj.projectName}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Client: <strong>{proj.client}</strong> • PM: {proj.projectManager}
              </p>

              {proj.manualStatus && <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-700"><span className="font-bold text-slate-900">Current status:</span> {proj.manualStatus}</div>}

              {/* Progress Bar */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>Progress ({proj.projectStatus})</span>
                  <span>{proj.progressPercentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${proj.progressPercentage === 100
                ? 'bg-emerald-500'
                : proj.healthStatus === 'At Risk'
                    ? 'bg-rose-500'
                    : 'bg-blue-600'}`} style={{ width: `${proj.progressPercentage}%` }}/>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1 text-slate-400"/>
                Target: {proj.expectedCompletionDate}
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                BHD {(proj.contractValue || 0).toLocaleString()}
              </span>
            </div>
          </div>))}
      </div>
    </div>);
};
