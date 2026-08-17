import React, { useState } from 'react';
import { hasPermission } from '../../services/permissionService';
import { teamService } from '../../services/teamService';
import { projectService } from '../../services/projectService';
import { Badge } from '../common/Badge';
import { Users2, Plus, Search, Briefcase, FileSpreadsheet, Trash2 } from 'lucide-react';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';
export const TeamMatrixView = ({ currentUser, onAssignMember = () => { } }) => {
    const canManage = hasPermission(currentUser, 'manage_team');
    const canDelete = hasPermission(currentUser, 'delete_team');
    const [activeSubTab, setActiveSubTab] = useState('members');
    const [, setVersion] = useState(0);
    const members = teamService.getAllMembers();
    const matrixItems = teamService.getAllMatrix();
    const [selectedProjectId, setSelectedProjectId] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const projects = projectService.getProjects();
    const filteredMembers = members.filter(m => {
        const matchesSearch = m.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.responsibility.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch)
            return false;
        if (selectedProjectId !== 'All' && m.projectId !== selectedProjectId)
            return false;
        return true;
    });
    const filteredMatrix = matrixItems.filter(mx => {
        const matchesSearch = mx.responsibility.toLowerCase().includes(searchQuery.toLowerCase()) ||
            mx.primaryOwner.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (mx.backupOwner && mx.backupOwner.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!matchesSearch)
            return false;
        if (selectedProjectId !== 'All' && mx.projectId !== selectedProjectId)
            return false;
        return true;
    });
    return (<div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#d8e7f0] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#071A35] flex items-center gap-2">
            <Users2 className="h-5 w-5 text-[#00AEEF]"/>
            Team Allocation & RACI Responsibility Matrix
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Manage project delivery team roster, roles, assigned responsibilities, primary & backup owners.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <ExcelExportButton label="Export Team" onClick={() => excelExportService.exportSheets(`syskode-team-${new Date().toISOString().slice(0, 10)}`, [
            { name: 'Project Team', rows: filteredMembers.map(m => ({ Project_ID: m.projectId, Employee: m.employeeName, Role: m.role, Responsibility: m.responsibility, Status: m.status || '', Start_Date: m.startDate || '', Notes: m.notes || '' })) },
            { name: 'RACI Matrix', rows: filteredMatrix.map(m => ({ Project_ID: m.projectId, Responsibility: m.responsibility, Primary_Owner: m.primaryOwner, Backup_Owner: m.backupOwner || '', Status: m.status || '' })) }
          ])}/>
          {canManage && <button onClick={onAssignMember} className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#0788C9] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#066fa5] shadow-md transition-all cursor-pointer sm:w-auto">
            <Plus className="h-4 w-4"/>
            <span>Assign Team Member</span>
          </button>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">Total Team Members</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{members.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">Active Projects</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{projects.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">RACI Matrix Items</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{matrixItems.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">Verified Deliverables</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            {matrixItems.filter(m => m.status === 'Verified').length}
          </p>
        </div>
      </div>

      {/* Filters & SubTabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
          <button onClick={() => setActiveSubTab('members')} className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${activeSubTab === 'members'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-zinc-800/60 text-zinc-400 hover:text-white'}`}>
            Project Roster ({filteredMembers.length})
          </button>
          <button onClick={() => setActiveSubTab('matrix')} className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${activeSubTab === 'matrix'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-zinc-800/60 text-zinc-400 hover:text-white'}`}>
            RACI Responsibility Matrix ({filteredMatrix.length})
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500"/>
            <input type="text" placeholder="Search member, role, owner..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"/>
          </div>

          <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-200 focus:border-blue-500 focus:outline-none">
            <option value="All">All Projects</option>
            {projects.map(p => (<option key={p.id} value={p.id}>
                {p.projectName}
              </option>))}
          </select>
        </div>
      </div>

      {/* Roster View */}
      {activeSubTab === 'members' && (filteredMembers.length === 0 ? (<div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
            <Users2 className="mx-auto h-10 w-10 text-zinc-600 mb-3"/>
            <h3 className="text-sm font-bold text-zinc-200">No Team Members Assigned</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Assign developers, designers, project managers and QA engineers to project delivery teams.
            </p>
            {canManage && <button onClick={onAssignMember} className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">
              <Plus className="h-4 w-4"/>
              <span>Assign Member</span>
            </button>}
          </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map(m => {
                const proj = projects.find(p => p.id === m.projectId);
                return (<div key={m.id} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5 space-y-3 hover:border-zinc-700/80 transition-all shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-zinc-100">{m.employeeName}</h3>
                      <span className="inline-block rounded-md bg-blue-950/80 border border-blue-800/50 px-2 py-0.5 text-[10px] font-bold text-blue-300 mt-1">
                        {m.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1"><Badge variant={m.status === 'Working' ? 'green' : 'blue'}>{m.status || 'Assigned'}</Badge>{canDelete && <button onClick={() => { if (window.confirm(`Remove ${m.employeeName} from this project?`)) {
                    teamService.deleteMember(m.id);
                    setVersion(v => v + 1);
                } }} className="rounded p-1.5 text-rose-400 hover:bg-rose-950/50" title="Remove Team Member"><Trash2 className="h-4 w-4"/></button>}</div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/50">
                    <strong className="text-zinc-200">Scope:</strong> {m.responsibility}
                  </p>

                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                    <span className="flex items-center">
                      <Briefcase className="h-3.5 w-3.5 mr-1 text-zinc-500"/>
                      {proj?.projectName || m.projectId}
                    </span>
                    <span>Started: {m.startDate}</span>
                  </div>
                </div>);
            })}
          </div>))}

      {/* RACI Matrix View */}
      {activeSubTab === 'matrix' && (filteredMatrix.length === 0 ? (<div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
            <FileSpreadsheet className="mx-auto h-10 w-10 text-zinc-600 mb-3"/>
            <h3 className="text-sm font-bold text-zinc-200">No RACI Items Defined</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Define responsibility boundaries and assign primary vs backup project owners.
            </p>
          </div>) : (<div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-200">
                <thead className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Responsibility / Deliverable</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Primary Owner (Accountable)</th>
                    <th className="px-4 py-3">Backup Owner (Responsible)</th>
                    <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredMatrix.map(mx => {
                const proj = projects.find(p => p.id === mx.projectId);
                return (<tr key={mx.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-zinc-100">
                          {mx.responsibility}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-300">
                          {proj?.projectName || mx.projectId}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-blue-400">
                          {mx.primaryOwner}
                        </td>
                        <td className="px-4 py-3.5 text-zinc-300">
                          {mx.backupOwner || 'None'}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={mx.status === 'Verified' ? 'green' : mx.status === 'In Progress' ? 'blue' : 'amber'}>
                            {mx.status}
                          </Badge>
                        </td><td className="px-4 py-3.5 text-right">{canDelete && <button onClick={() => { if (window.confirm(`Delete responsibility ${mx.responsibility}?`)) {
                    teamService.deleteMatrixItem(mx.id);
                    setVersion(v => v + 1);
                } }} className="rounded p-1.5 text-rose-400 hover:bg-rose-950/50"><Trash2 className="h-4 w-4"/></button>}</td>
                      </tr>);
            })}
                </tbody>
              </table>
            </div>
          </div>))}
    </div>);
};
