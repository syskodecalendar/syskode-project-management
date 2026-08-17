import React, { useEffect, useState } from 'react';
import { Tabs } from '../common/Tabs';
import { Badge } from '../common/Badge';
import { ArrowLeft, Sparkles, History, Eye, EyeOff, Trash2, Save, Plus } from 'lucide-react';
import { teamService } from '../../services/teamService';
import { taskService } from '../../services/taskService';
import { credentialService } from '../../services/credentialService';
import { qaService } from '../../services/qaService';
import { aiService } from '../../services/aiService';
import { authService } from '../../services/authService';
import { InfrastructureManager } from '../infrastructure/InfrastructureManager';
import { projectService } from '../../services/projectService';
import { hasPermission } from '../../services/permissionService';
import { projectStatusService } from '../../services/projectStatusService';
import { ProjectBillingTab } from './ProjectBillingTab';
export const ProjectWorkspace = ({ project, currentUser, onBack, onRefresh, onGenerateAITasks = () => {}, onGenerateAITestCases = () => {} }) => {
    const effectiveUser = currentUser || authService.getCurrentUser();
    const userName = effectiveUser.name || 'User';
    const [activeTab, setActiveTab] = useState('overview');
    const [manualProgress, setManualProgress] = useState(String(project.progressPercentage ?? 0));
    const [progressSaved, setProgressSaved] = useState(false);
    const [selectedProjectStatus, setSelectedProjectStatus] = useState(project.projectStatus);
    const [manualStatus, setManualStatus] = useState(project.manualStatus || '');
    const [statusSaved, setStatusSaved] = useState(false);
    const canManageProject = hasPermission(effectiveUser, 'manage_projects');
    const canManageTeam = hasPermission(effectiveUser, 'manage_team');
    const canDeleteTeam = hasPermission(effectiveUser, 'delete_team');
    const canManageTasks = hasPermission(effectiveUser, 'manage_tasks');
    const canDeleteTasks = hasPermission(effectiveUser, 'delete_tasks');
    const canViewCredentials = hasPermission(effectiveUser, 'view_credentials');
    const canManageCredentials = hasPermission(effectiveUser, 'manage_credentials');
    const canDeleteCredentials = hasPermission(effectiveUser, 'delete_credentials');
    const canViewInfrastructure = hasPermission(effectiveUser, 'view_infrastructure');
    const canViewQA = hasPermission(effectiveUser, 'view_qa');
    const canManageQA = hasPermission(effectiveUser, 'manage_qa');
    const canDeleteQA = hasPermission(effectiveUser, 'delete_qa');
    useEffect(() => {
        setManualProgress(String(project.progressPercentage ?? 0));
        setSelectedProjectStatus(project.projectStatus);
        setManualStatus(project.manualStatus || '');
    }, [project.id, project.progressPercentage, project.projectStatus, project.manualStatus]);
    // New Item States
    const [newMemberName, setNewMemberName] = useState('');
    const employeeProfiles = authService.getAllProfiles().filter(u => u.status !== 'Inactive');
    const [newMemberRole, setNewMemberRole] = useState('');
    const [newMemberResponsibility, setNewMemberResponsibility] = useState('');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskAssignee, setNewTaskAssignee] = useState('');
    const [newTaskModule, setNewTaskModule] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [credService, setCredService] = useState('');
    const [credUsername, setCredUsername] = useState('');
    const [credPassword, setCredPassword] = useState('');
    const [revealedCreds, setRevealedCreds] = useState({});
    const [showTestCaseForm, setShowTestCaseForm] = useState(false);
    const [newTestScenario, setNewTestScenario] = useState('');
    const [newTestModule, setNewTestModule] = useState('');
    const [newTestFeature, setNewTestFeature] = useState('');
    const [newTestExpected, setNewTestExpected] = useState('');
    const [newTestPriority, setNewTestPriority] = useState('Medium');
    const [newTestSeverity, setNewTestSeverity] = useState('Major');
    const [newTestAssignee, setNewTestAssignee] = useState('');
    // AI Assistant Drawer
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    // Data
    const teamMembers = teamService.getMembersByProject(project.id);
    const matrix = teamService.getMatrixByProject(project.id);
    const tasks = taskService.getTasksByProject(project.id);
    const credentials = credentialService.getCredentialsByProject(project.id, effectiveUser);
    const statusLogs = projectStatusService.getByProject(project.id);
    const testCases = qaService.getTestCasesByProject(project.id);
    const qaStats = qaService.getQAStats(project.id);
    const tabs = [
        { id: 'overview', label: 'Overview & Status' },
        { id: 'team', label: 'Team & Matrix', badge: teamMembers.length },
        { id: 'tasks', label: 'Tasks', badge: tasks.length },
        { id: 'billing', label: 'Billing & Invoices' },
        ...(canViewCredentials ? [{ id: 'credentials', label: 'Credentials Vault', badge: credentials.length }] : []),
        ...(canViewInfrastructure ? [{ id: 'infrastructure', label: 'Infrastructure & Repos' }] : []),
        ...(canViewQA ? [{ id: 'qa', label: 'QA / Test Cases', badge: testCases.length }] : []),
        { id: 'ai', label: '✨ AI Project Assistant' }
    ];
    const handleAddMember = (e) => {
        e.preventDefault();
        if (!canManageTeam || !newMemberName || !newMemberRole)
            return;
        teamService.addMember(project.id, newMemberName, newMemberRole, newMemberResponsibility.trim());
        setNewMemberName('');
        setNewMemberRole('');
        setNewMemberResponsibility('');
        onRefresh();
    };
    const handleAddTask = (e) => {
        e.preventDefault();
        if (!canManageTasks || !newTaskTitle)
            return;
        taskService.createTask({
            projectId: project.id,
            projectName: project.projectName,
            taskName: newTaskTitle,
            module: newTaskModule.trim(),
            description: newTaskTitle,
            assignedMember: newTaskAssignee,
            priority: project.priority || 'Medium',
            status: 'To Do',
            dueDate: newTaskDueDate,
            estimatedHours: 0
        });
        setNewTaskTitle('');
        setNewTaskModule('');
        setNewTaskAssignee('');
        setNewTaskDueDate('');
        onRefresh();
    };
    const handleAddTestCase = (e) => {
        e.preventDefault();
        if (!canManageQA || !newTestScenario.trim()) return;
        qaService.createTestCase({
            projectId: project.id,
            module: newTestModule.trim(),
            feature: newTestFeature.trim(),
            scenario: newTestScenario.trim(),
            steps: [],
            expectedResult: newTestExpected.trim(),
            status: 'Not Tested',
            priority: newTestPriority,
            severity: newTestSeverity,
            assignedQA: newTestAssignee,
            createdBy: userName
        });
        setNewTestScenario('');
        setNewTestModule('');
        setNewTestFeature('');
        setNewTestExpected('');
        setNewTestPriority('Medium');
        setNewTestSeverity('Major');
        setNewTestAssignee('');
        setShowTestCaseForm(false);
        onRefresh();
    };
    const handleSaveProgress = (e) => {
        e.preventDefault();
        if (!canManageProject)
            return;
        const raw = Number(manualProgress);
        const next = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : 0;
        setManualProgress(String(next));
        projectService.updateProject(project.id, { progressPercentage: next }, userName);
        setProgressSaved(true);
        window.setTimeout(() => setProgressSaved(false), 1800);
        onRefresh();
    };
    const handleSaveStatus = (e) => {
        e.preventDefault();
        if (!canManageProject)
            return;
        projectService.updateProject(project.id, {
            projectStatus: selectedProjectStatus,
            manualStatus: manualStatus.trim(),
            lastStatusUpdatedAt: new Date().toISOString()
        }, userName);
        setStatusSaved(true);
        window.setTimeout(() => setStatusSaved(false), 1800);
        onRefresh();
    };
    const handleAddCredential = (e) => {
        e.preventDefault();
        if (!canManageCredentials || !credService || !credPassword)
            return;
        credentialService.addCredential({
            projectId: project.id,
            category: 'Server',
            service: credService,
            username: credUsername,
            passwordSecret: credPassword,
            responsiblePerson: userName,
            updatedBy: userName,
            notes: 'Added from project vault'
        }, userName);
        setCredService('');
        setCredUsername('');
        setCredPassword('');
        onRefresh();
    };
    const runAIAssistant = (action) => {
        setAiLoading(true);
        aiService.getProjectAssistantAnalysis(action, project).then(res => {
            setAiAnalysis(res.analysis);
            setAiLoading(false);
        });
    };
    return (<div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <button onClick={onBack} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5"/>
          </button>
          <div>
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {project.projectId}
              </span>
              <h2 className="break-words text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                {project.projectName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Client: <strong>{project.client}</strong> • Manager: <strong>{project.projectManager}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={project.healthStatus === 'On Track' ? 'green' : 'amber'}>
            Health: {project.healthStatus}
          </Badge>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {project.progressPercentage}% Completed
          </span>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}/>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Project Description</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{project.description}</p>
            </div>

            <form onSubmit={handleSaveStatus} className="rounded-xl border border-slate-200 bg-white p-5 text-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Project Status</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">Choose the workflow stage and enter a free-text current status/update. Every save is added to the project status log.</p>
                </div>
                {statusSaved && <span className="text-[11px] font-bold text-emerald-600">Status saved</span>}
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-slate-900">
                  <span className="mb-1 block text-xs font-semibold text-slate-900">Project Stage</span>
                  <select value={selectedProjectStatus} onChange={e => setSelectedProjectStatus(e.target.value)} disabled={!canManageProject} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none">
                    {['Planning', 'Requirements', 'UI/UX', 'Development', 'Internal Testing', 'Client UAT', 'Changes', 'Deployment', 'Support', 'Completed', 'On Hold'].map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Current Saved Stage</p>
                  <p className="mt-1 font-bold text-slate-900">{project.projectStatus}</p>
                  <p className="mt-1 break-words text-slate-600">{project.manualStatus || 'No manual status entered yet.'}</p>
                </div>
                <label className="block text-slate-900 sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-900">Manual Project Status / Current Update</span>
                  <textarea rows={4} value={manualStatus} onChange={e => setManualStatus(e.target.value)} disabled={!canManageProject} placeholder="Enter the current real project update, blocker, dependency or next step." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"/>
                </label>
              </div>
              {canManageProject && <div className="mt-3 flex justify-end"><button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 sm:w-auto"><Save className="h-4 w-4"/> Save Project Status</button></div>}
            </form>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><History className="h-4 w-4 text-blue-600"/> Project Status Log</h3><p className="mt-0.5 text-[11px] text-slate-500">Permanent history of stage, manual status and completion changes.</p></div><Badge variant="blue">{statusLogs.length} updates</Badge></div>
              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {statusLogs.length === 0 ? <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">No status history yet. Save a status or completion update to create the first log entry.</p> : statusLogs.map(log => <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="font-bold text-slate-900">{log.projectStatus} • {log.progressPercentage}%</p><p className="text-[10px] text-slate-500">{new Date(log.changedAt).toLocaleString()}</p></div>
                  {log.manualStatus && <p className="mt-1 break-words text-slate-700">{log.manualStatus}</p>}
                  <p className="mt-1 text-[10px] text-slate-500">Changed by {log.changedBy}{log.previousProjectStatus && log.previousProjectStatus !== log.projectStatus ? ` • From ${log.previousProjectStatus}` : ''}</p>
                </div>)}
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900 dark:bg-blue-950/30">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">Health Explanation</h3>
              <p className="text-xs text-blue-950 dark:text-blue-200 font-medium">{project.healthExplanation}</p>
            </div>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleSaveProgress} className="rounded-xl border border-slate-200 bg-white p-5 text-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Manual Project Completion</h3>
                  <p className="mt-0.5 text-[11px] text-slate-500">Set the project completion manually from 0% to 100%.</p>
                </div>
                {progressSaved && <span className="text-[11px] font-bold text-emerald-600">Saved</span>}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-slate-900">
                  <span className="mb-1 block text-xs font-semibold text-slate-900">Completion Percentage</span>
                  <div className="relative">
                    <input type="number" inputMode="numeric" min="0" max="100" step="1" value={manualProgress} onChange={e => setManualProgress(e.target.value)} disabled={!canManageProject} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm font-bold text-slate-900 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"/>
                    <span className="pointer-events-none absolute right-3 top-2.5 font-bold text-slate-500">%</span>
                  </div>
                </label>
                {canManageProject && (<button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 sm:w-auto">
                    <Save className="h-4 w-4"/> Save Completion
                  </button>)}
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, Number(manualProgress) || 0))}%` }}/>
              </div>
              {!canManageProject && <p className="mt-2 text-[10px] text-slate-500">Your role can view progress but does not have permission to edit projects.</p>}
            </form>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 text-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Key Dates & Financials</h3>
              <p>Start Date: <strong>{project.startDate}</strong></p>
              <p>Target Date: <strong>{project.expectedCompletionDate}</strong></p>
              <p>Contract Value: <strong>BHD {(project.contractValue || 0).toLocaleString()}</strong></p>
              <p>Support Period: <strong>{project.supportPeriod}</strong></p>
            </div>
          </div>
        </div>)}

      {/* Tab: Team & Matrix */}
      {activeTab === 'team' && (<div className="space-y-5">
          {canManageTeam && <form onSubmit={handleAddMember} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_1.3fr_auto] dark:bg-slate-900 dark:border-slate-800">
            <select value={newMemberName} onChange={e => setNewMemberName(e.target.value)} className="flex-1 rounded-lg border p-2 text-xs"><option value="">Select Employee</option>{employeeProfiles.map(u => <option key={u.id} value={u.name}>{u.name} — {u.role}</option>)}</select>
            <select required value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} className="rounded-lg border p-2 text-xs">
              <option value="">Select project role</option>
              {['Project Manager', 'Technical Lead', 'Business Analyst', 'UI/UX Designer', 'Frontend Developer', 'Backend Developer', 'WordPress Developer', 'Zoho Developer', 'Mobile Developer', 'QA', 'QA Engineer', 'DevOps', 'Digital Marketing', 'Account Manager', 'Other'].map(role => <option key={role}>{role}</option>)}
            </select>
            <input value={newMemberResponsibility} onChange={e => setNewMemberResponsibility(e.target.value)} placeholder="Responsibility / work area" className="rounded-lg border p-2 text-xs"/>
            <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white sm:w-auto">Assign Member</button>
          </form>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teamMembers.map(member => <div key={member.id} className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
              <div><p className="font-bold text-slate-900">{member.employeeName}</p><p>{member.role} • {member.responsibility}</p><p className="mt-1 text-slate-500">Status: {member.status}</p></div>
              {canDeleteTeam && <button onClick={() => { if (window.confirm(`Remove ${member.employeeName} from this project?`)) {
                teamService.deleteMember(member.id);
                onRefresh();
            } }} className="rounded p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4"/></button>}
            </div>)}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Responsibility Ownership Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-500 uppercase dark:bg-slate-800 font-bold">
                  <tr>
                    <th className="p-3">Responsibility Area</th>
                    <th className="p-3">Primary Owner</th>
                    <th className="p-3">Backup Owner</th>
                    <th className="p-3">Status</th><th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {matrix.map(m => (<tr key={m.id}>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{m.responsibility}</td>
                      <td className="p-3 text-blue-600 font-semibold">{m.primaryOwner}</td>
                      <td className="p-3 text-slate-500">{m.backupOwner || 'None'}</td>
                      <td className="p-3"><Badge variant="green">{m.status}</Badge></td><td className="p-3 text-right">{canDeleteTeam && <button onClick={() => { if (window.confirm(`Delete responsibility ${m.responsibility}?`)) {
                teamService.deleteMatrixItem(m.id);
                onRefresh();
            } }} className="rounded p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4"/></button>}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>)}

      {/* Tab: Tasks */}
      {activeTab === 'tasks' && (<div className="space-y-4">
          {canManageTasks && <div className="flex justify-end"><button onClick={() => onGenerateAITasks(project.id)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white"><Sparkles className="h-4 w-4"/>Generate Tasks with AI</button></div>}
          {canManageTasks && <form onSubmit={handleAddTask} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[1.2fr_0.8fr_220px_160px_auto] dark:bg-slate-900 dark:border-slate-800">
            <input type="text" required placeholder="Task Name..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="w-full rounded-lg border p-2 text-xs"/>
            <input type="text" placeholder="Module / work area" value={newTaskModule} onChange={e => setNewTaskModule(e.target.value)} className="w-full rounded-lg border p-2 text-xs"/>
            <select value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} className="w-full rounded-lg border p-2 text-xs">
              <option value="">Select assignee</option>
              {teamMembers.map(m => <option key={m.id} value={m.employeeName}>{m.employeeName} — {m.role}</option>)}
            </select>
            <input type="date" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} className="w-full rounded-lg border p-2 text-xs"/>
            <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white sm:w-auto">Add Task</button>
          </form>}

          <div className="space-y-2">
            {tasks.map(t => (<div key={t.id} className="flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-2xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{t.taskName}</p>
                  <p className="text-slate-500">Assigned: {t.assignedMember} • Due: {t.dueDate}</p>
                </div>
                <div className="flex items-center gap-2"><Badge variant={t.status === 'Completed' ? 'green' : 'amber'}>{t.status}</Badge>{canDeleteTasks && <button onClick={() => { if (window.confirm(`Delete task ${t.taskName}?`)) {
                taskService.deleteTask(t.id);
                onRefresh();
            } }} className="rounded p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4"/></button>}</div>
              </div>))}
          </div>
        </div>)}

      {/* Tab: Credentials Vault */}
      {activeTab === 'billing' && (<ProjectBillingTab project={project} currentUser={effectiveUser} onRefresh={onRefresh}/>)}

      {activeTab === 'credentials' && (<div className="space-y-4">
          {canManageCredentials && <form onSubmit={handleAddCredential} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px_auto] dark:bg-slate-900 dark:border-slate-800">
            <input type="text" placeholder="Service (e.g. AWS cPanel)" value={credService} onChange={e => setCredService(e.target.value)} className="w-full rounded-lg border p-2 text-xs"/>
            <input type="text" placeholder="Username" value={credUsername} onChange={e => setCredUsername(e.target.value)} className="w-full rounded-lg border p-2 text-xs"/>
            <input type="password" placeholder="Password" value={credPassword} onChange={e => setCredPassword(e.target.value)} className="w-full rounded-lg border p-2 text-xs"/>
            <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white sm:col-span-2 lg:col-span-1 lg:w-auto">Save Credential</button>
          </form>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {credentials.map(c => {
                const isRevealed = revealedCreds[c.id];
                return (<div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900 text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                    <span>{c.service} ({c.category})</span>
                    <button onClick={() => setRevealedCreds({ ...revealedCreds, [c.id]: !isRevealed })} className="p-1 text-slate-400 hover:text-slate-600">
                      {isRevealed ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                    </button>{canDeleteCredentials && <button onClick={() => { if (window.confirm(`Delete credential ${c.service}?`)) {
                    credentialService.deleteCredential(c.id, userName);
                    onRefresh();
                } }} className="p-1 text-rose-600 hover:text-rose-700"><Trash2 className="h-4 w-4"/></button>}
                  </div>
                  <p className="text-slate-500">Username: <strong>{c.username}</strong></p>
                  <p className="font-mono text-blue-600 font-bold">
                    Password: {isRevealed ? c.passwordSecret : '••••••••••••'}
                  </p>
                </div>);
            })}
          </div>
        </div>)}

      {/* Tab: QA / Test Cases */}
      {activeTab === 'qa' && (<div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-[#d8e7f0] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="text-sm font-bold text-[#071A35]">Project Test Cases</h3><p className="mt-1 text-xs text-[#667085]">Create manual QA cases directly inside this project or let Gemini generate a project-specific test suite.</p></div>
            {canManageQA && <div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => onGenerateAITestCases(project.id)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#9ed8f3] bg-[#eef9ff] px-3.5 py-2 text-xs font-bold text-[#075f91] hover:bg-[#e1f5ff]"><Sparkles className="h-4 w-4"/>Generate with AI</button><button type="button" onClick={() => setShowTestCaseForm(v => !v)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0788C9] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#066fa5]"><Plus className="h-4 w-4"/>{showTestCaseForm ? 'Close' : 'Add Test Case'}</button></div>}
          </div>

          {canManageQA && showTestCaseForm && <form onSubmit={handleAddTestCase} className="grid grid-cols-1 gap-3 rounded-xl border border-[#cfe6f3] bg-[#f7fbfe] p-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-[#071A35]">Scenario *</span><input required value={newTestScenario} onChange={e => setNewTestScenario(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" placeholder="Example: User can submit the contact form with valid data"/></label>
            <label><span className="mb-1 block text-xs font-semibold text-[#071A35]">Module</span><input value={newTestModule} onChange={e => setNewTestModule(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" placeholder="Contact Form"/></label>
            <label><span className="mb-1 block text-xs font-semibold text-[#071A35]">Feature</span><input value={newTestFeature} onChange={e => setNewTestFeature(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs" placeholder="Form Validation"/></label>
            <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-[#071A35]">Expected Result</span><textarea rows={2} value={newTestExpected} onChange={e => setNewTestExpected(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"/></label>
            <label><span className="mb-1 block text-xs font-semibold text-[#071A35]">Priority</span><select value={newTestPriority} onChange={e => setNewTestPriority(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
            <label><span className="mb-1 block text-xs font-semibold text-[#071A35]">Severity</span><select value={newTestSeverity} onChange={e => setNewTestSeverity(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"><option>Minor</option><option>Major</option><option>Critical</option><option>Blocker</option></select></label>
            <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-[#071A35]">Assigned QA / Team Member</span><select value={newTestAssignee} onChange={e => setNewTestAssignee(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"><option value="">Unassigned</option>{teamMembers.map(member => <option key={member.id} value={member.employeeName}>{member.employeeName} — {member.role}</option>)}</select></label>
            <div className="sm:col-span-2 flex justify-end"><button type="submit" className="rounded-lg bg-[#0788C9] px-4 py-2 text-xs font-bold text-white hover:bg-[#066fa5]">Save Test Case</button></div>
          </form>}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-semibold text-slate-500">Total</p><p className="mt-1 text-xl font-bold text-slate-900">{testCases.length}</p></div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-[11px] font-semibold text-emerald-700">Passed</p><p className="mt-1 text-xl font-bold text-emerald-800">{qaStats.passed}</p></div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-[11px] font-semibold text-rose-700">Failed</p><p className="mt-1 text-xl font-bold text-rose-800">{qaStats.failed}</p></div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-[11px] font-semibold text-amber-700">Not Tested</p><p className="mt-1 text-xl font-bold text-amber-800">{qaStats.notTested}</p></div>
          </div>
          {testCases.length === 0 ? (<div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-600">No QA test cases are linked to this project yet. Use Add Test Case or Generate with AI above.</div>) : (<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {testCases.map(tc => (<div key={tc.id} className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="font-mono text-[10px] font-bold text-blue-600">{tc.testCaseId}</p><p className="mt-1 break-words font-bold text-slate-900">{tc.scenario}</p></div>
                    {canDeleteQA && <button onClick={() => { if (window.confirm(`Delete test case ${tc.testCaseId}?`)) {
                    qaService.deleteTestCase(tc.id);
                    onRefresh();
                } }} className="shrink-0 rounded p-1.5 text-rose-600 hover:bg-rose-50" title="Delete Test Case"><Trash2 className="h-4 w-4"/></button>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2"><Badge variant={tc.status === 'Passed' ? 'green' : tc.status === 'Failed' ? 'red' : 'amber'}>{tc.status}</Badge><Badge variant="blue">{tc.priority}</Badge></div>
                  <p className="mt-2 text-slate-500">Module: {tc.module} • QA: {tc.assignedQA || 'Unassigned'}</p>
                </div>))}
            </div>)}
        </div>)}

      {/* Tab: Infrastructure */}
      {activeTab === 'infrastructure' && (<InfrastructureManager projectId={project.id} currentUser={effectiveUser} onRefresh={onRefresh} compact/>)}

      {/* Tab: AI Project Assistant */}
      {activeTab === 'ai' && (<div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => runAIAssistant('Summarize Project Status')} className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white flex items-center space-x-1">
              <Sparkles className="h-4 w-4"/> <span>Summarize Status</span>
            </button>
            <button onClick={() => runAIAssistant('Identify Risks')} className="rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-bold text-white flex items-center space-x-1">
              <Sparkles className="h-4 w-4"/> <span>Identify Risks</span>
            </button>
            <button onClick={() => runAIAssistant('Generate Handover Checklist')} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white flex items-center space-x-1">
              <Sparkles className="h-4 w-4"/> <span>Handover Checklist</span>
            </button>
          </div>

          {aiLoading ? (<div className="py-12 text-center text-xs font-semibold text-slate-500">Running Gemini AI analysis...</div>) : aiAnalysis ? (<div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/30 text-xs space-y-3">
              <h4 className="font-bold text-sm text-blue-900 dark:text-blue-300">{aiAnalysis.title}</h4>
              <p className="text-slate-800 dark:text-slate-200">{aiAnalysis.summary}</p>
              <div className="font-semibold text-rose-800 dark:text-rose-300">
                Key Risks:
                <ul className="list-disc list-inside mt-1 font-normal">
                  {aiAnalysis.keyRisks?.map((r, idx) => <li key={idx}>{r}</li>)}
                </ul>
              </div>
            </div>) : null}
        </div>)}
    </div>);
};
