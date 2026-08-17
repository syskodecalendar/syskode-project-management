import React, { useState } from 'react';
import { hasPermission } from '../../services/permissionService';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { Badge } from '../common/Badge';
import { CheckSquare, Plus, Search, Clock, UserCheck, Briefcase, Trash2, Sparkles } from 'lucide-react';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';
export const TasksView = ({ currentUser, onCreateTask = () => { }, onGenerateAITasks = () => { } }) => {
    const canManage = hasPermission(currentUser, 'manage_tasks');
    const canDelete = hasPermission(currentUser, 'delete_tasks');
    const [, setVersion] = useState(0);
    const tasks = taskService.getTasks();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const projects = projectService.getProjects();
    const handleStatusChange = (taskId, newStatus) => {
        if (!canManage)
            return;
        taskService.updateTaskStatus(taskId, newStatus);
        setVersion(v => v + 1);
    };
    const filteredTasks = tasks.filter(t => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = String(t.taskName || '').toLowerCase().includes(q) ||
            String(t.module || '').toLowerCase().includes(q) ||
            String(t.assignedMember || '').toLowerCase().includes(q) ||
            String(t.projectName || '').toLowerCase().includes(q);
        if (!matchesSearch)
            return false;
        if (selectedProjectId !== 'All' && t.projectId !== selectedProjectId)
            return false;
        if (statusFilter !== 'All' && t.status !== statusFilter)
            return false;
        return true;
    });
    const todoCount = tasks.filter(t => t.status === 'To Do' || t.status === 'In Progress').length;
    const reviewCount = tasks.filter(t => t.status === 'Review').length;
    const blockedCount = tasks.filter(t => t.status === 'Blocked').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;
    return (<div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#d8e7f0] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#071A35] flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-[#00AEEF]"/>
            Project Execution Tasks
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Track development sprints, assigned modules, priority levels, estimated vs actual hours, and blocker flags.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <ExcelExportButton label="Export Tasks" onClick={() => excelExportService.exportRows(
            `syskode-tasks-${new Date().toISOString().slice(0, 10)}`,
            'Tasks',
            filteredTasks.map(t => ({ Project: t.projectName, Task: t.taskName, Module: t.module || '', Description: t.description || '', Assignee: t.assignedMember || '', Priority: t.priority, Status: t.status, Due_Date: t.dueDate || '', Estimated_Hours: Number(t.estimatedHours) || 0, Actual_Hours: Number(t.actualHours) || 0 }))
          )}/>
          {canManage && <><button onClick={onGenerateAITasks} className="flex items-center justify-center gap-2 rounded-xl border border-[#9ed8f3] bg-[#eef9ff] px-4 py-2.5 text-xs font-semibold text-[#075f91] hover:bg-[#e1f5ff]"><Sparkles className="h-4 w-4"/><span>Generate with AI</span></button><button onClick={onCreateTask} className="flex items-center justify-center space-x-2 rounded-xl bg-[#0788C9] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#066fa5] shadow-md transition-all cursor-pointer"><Plus className="h-4 w-4"/><span>Create New Task</span></button></>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">Total Tasks</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{tasks.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">In Progress / Active</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{todoCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">In Review / QA</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{reviewCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">Blocked / Completed</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {completedCount} <span className="text-xs text-rose-400 font-normal">({blockedCount} Blocked)</span>
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full min-w-0 flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500"/>
            <input type="text" placeholder="Search task title, module, assignee, or project..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"/>
          </div>

          <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-200 focus:border-blue-500 focus:outline-none sm:w-auto">
            <option value="All">All Projects ({projects.length})</option>
            {projects.map(p => (<option key={p.id} value={p.id}>
                {p.projectName}
              </option>))}
          </select>
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          {['All', 'To Do', 'In Progress', 'Review', 'Blocked', 'Completed'].map(st => (<button key={st} onClick={() => setStatusFilter(st)} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${statusFilter === st
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
              {st}
            </button>))}
        </div>
      </div>

      {/* Task List / Grid */}
      {filteredTasks.length === 0 ? (<div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <CheckSquare className="mx-auto h-10 w-10 text-zinc-600 mb-3"/>
          <h3 className="text-sm font-bold text-zinc-200">No Tasks Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            No active project tasks match your criteria. Create a new task to assign sprint items to developers.
          </p>
          {canManage && <button onClick={onCreateTask} className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">
            <Plus className="h-4 w-4"/>
            <span>Create Task</span>
          </button>}
        </div>) : (<div className="space-y-3">
          {filteredTasks.map(t => (<div key={t.id} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-4 hover:border-zinc-700/80 transition-all space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                    {t.module}
                  </span>
                  <Badge variant={t.priority === 'Critical' ? 'red' : t.priority === 'High' ? 'amber' : 'gray'}>
                    {t.priority}
                  </Badge>
                  <span className="text-xs text-zinc-400 font-medium flex items-center">
                    <Briefcase className="h-3 w-3 mr-1 text-zinc-500"/>
                    {t.projectName}
                  </span>
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <span className="text-xs text-zinc-400">Status:</span>
                  <select value={t.status} disabled={!canManage} onChange={e => handleStatusChange(t.id, e.target.value)} className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-zinc-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Completed">Completed</option>
                  </select>
                  {canDelete && <button onClick={() => { if (window.confirm(`Delete task ${t.taskName}?`)) {
                taskService.deleteTask(t.id);
                setVersion(v => v + 1);
            } }} className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-950/50" title="Delete Task"><Trash2 className="h-4 w-4"/></button>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-zinc-100">{t.taskName}</h3>
                {t.description && (<p className="text-xs text-zinc-400 mt-1 leading-relaxed">{t.description}</p>)}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/50">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span className="text-zinc-300 font-medium flex items-center">
                    <UserCheck className="h-3.5 w-3.5 mr-1 text-blue-400"/>
                    Assignee: <strong className="ml-1 text-zinc-100">{t.assignedMember}</strong>
                  </span>
                  <span className="text-zinc-400 flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1 text-zinc-500"/>
                    Due: {t.dueDate}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-zinc-400">
                  <span>
                    Est: <strong className="text-zinc-200">{t.estimatedHours}h</strong>
                  </span>
                  <span>
                    Actual: <strong className="text-zinc-200">{t.actualHours}h</strong>
                  </span>
                </div>
              </div>
            </div>))}
        </div>)}
    </div>);
};
