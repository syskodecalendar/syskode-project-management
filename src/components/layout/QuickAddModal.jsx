import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { Users2, Calendar, Briefcase, CheckSquare, ShieldCheck } from 'lucide-react';
import { leadService } from '../../services/leadService';
import { meetingService } from '../../services/meetingService';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { qaService } from '../../services/qaService';
import { authService } from '../../services/authService';
import { teamService } from '../../services/teamService';
const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white';
export const QuickAddModal = ({ isOpen, onClose, onSuccess, initialType = 'lead', currentUser }) => {
    const [activeType, setActiveType] = useState(initialType);
    const leads = useMemo(() => leadService.getLeads(), [isOpen]);
    const projects = useMemo(() => projectService.getProjects(), [isOpen]);
    const employees = useMemo(() => authService.getAllProfiles().filter(u => u.status !== 'Inactive'), [isOpen]);
    const managers = employees.filter(u => ['Admin', 'Management', 'Project Manager'].includes(u.role));
    useEffect(() => {
        if (isOpen)
            setActiveType(initialType);
    }, [isOpen, initialType]);
    // Shared/basic fields
    const [leadName, setLeadName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [service, setService] = useState('');
    const [value, setValue] = useState('');
    const [priority, setPriority] = useState('High');
    // Meeting
    const [selectedLeadId, setSelectedLeadId] = useState('');
    const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
    const [meetingTime, setMeetingTime] = useState('');
    const [meetingType, setMeetingType] = useState('Online');
    const [meetingPurpose, setMeetingPurpose] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    // Project
    const [projectName, setProjectName] = useState('');
    const [clientName, setClientName] = useState('');
    const [projectManager, setProjectManager] = useState('');
    const [projectType, setProjectType] = useState('');
    const [completionDate, setCompletionDate] = useState('');
    const [projectProgress, setProjectProgress] = useState('0');
    const [projectStage, setProjectStage] = useState('Planning');
    const [projectManualStatus, setProjectManualStatus] = useState('');
    // Task / QA
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [taskName, setTaskName] = useState('');
    const [assignedMember, setAssignedMember] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [scenario, setScenario] = useState('');
    const [module, setModule] = useState('');
    const projectMembers = useMemo(() => selectedProjectId ? teamService.getMembersByProject(selectedProjectId) : [], [selectedProjectId, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (activeType === 'lead') {
            if (!leadName.trim() || !companyName.trim() || !contactPerson.trim()) return onSuccess('Enter the required lead details.');
            leadService.createLead({
                leadName: leadName.trim(), companyName: companyName.trim(), contactPerson: contactPerson.trim(), email: email.trim(), phone: phone.trim(),
                country: '', leadSource: 'Quick Add', industry: '', serviceInterested: service.trim(), estimatedProjectValue: Number(value) || 0,
                currency: 'BHD', assignedSalesperson: currentUser?.name || '', lastContactedDate: new Date().toISOString().split('T')[0],
                priority, status: 'New Lead', customStatus: ''
            });
            onSuccess('Lead created and saved to the database.');
        }
        if (activeType === 'meeting') {
            const lead = leads.find(l => l.id === selectedLeadId);
            if (!lead)
                return onSuccess('Create a lead before scheduling a meeting.');
            meetingService.createMeeting({
                leadId: lead.id, leadName: lead.leadName, companyName: lead.companyName,
                meetingType, platform: meetingType === 'Online' ? 'Google Meet' : undefined,
                meetingLink: meetingType === 'Online' ? meetingLink || undefined : undefined,
                clientEmail: lead.email || undefined,
                date: meetingDate, time: meetingTime, duration: '', salesperson: lead.assignedSalesperson || currentUser?.name || '',
                clientAttendees: [lead.contactPerson], syskodeAttendees: [lead.assignedSalesperson || currentUser?.name].filter(Boolean),
                purpose: meetingPurpose, reminder: true, status: 'Scheduled'
            });
            onSuccess('Meeting scheduled and linked to the selected lead.');
        }
        if (activeType === 'project') {
            projectService.createProject({
                projectName: projectName.trim(), client: clientName.trim(), projectType: projectType.trim(),
                projectManager, startDate: new Date().toISOString().split('T')[0], expectedCompletionDate: completionDate,
                contractValue: Number(value) || 0, currency: 'BHD', projectStatus: projectStage, priority,
                progressPercentage: Math.min(100, Math.max(0, Number(projectProgress) || 0)), manualStatus: projectManualStatus.trim() || undefined,
                lastStatusUpdatedAt: new Date().toISOString(), description: projectManualStatus.trim(), supportPeriod: ''
            });
            onSuccess('Project created and saved to the database.');
        }
        if (activeType === 'task') {
            const project = projects.find(p => p.id === selectedProjectId);
            if (!project)
                return onSuccess('Create a project before adding tasks.');
            taskService.createTask({
                projectId: project.id, projectName: project.projectName, taskName: taskName.trim(), module: module.trim(), description: taskName.trim(), assignedMember, priority, status: 'To Do', dueDate: dueDate || project.expectedCompletionDate || '', estimatedHours: 0
            });
            onSuccess('Task created and linked to the selected project.');
        }
        if (activeType === 'testCase') {
            const project = projects.find(p => p.id === selectedProjectId);
            if (!project)
                return onSuccess('Create a project before adding test cases.');
            qaService.createTestCase({
                projectId: project.id, module: module.trim(), feature: '', scenario: scenario.trim(), steps: [], expectedResult: '', status: 'Not Tested', priority, severity: 'Major', assignedQA: currentUser?.role === 'QA' ? currentUser.name : ''
            });
            onSuccess('Test case created and linked to the selected project.');
        }
        onClose();
    };
    return (<Modal isOpen={isOpen} onClose={onClose} title="Quick Add" subtitle="Create live records directly in Syskode Project Hub." maxWidth="xl">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b border-slate-200 pb-4 mb-4 dark:border-slate-800">
        {[
            { id: 'lead', label: 'Lead', icon: Users2 }, { id: 'meeting', label: 'Meeting', icon: Calendar },
            { id: 'project', label: 'Project', icon: Briefcase }, { id: 'task', label: 'Task', icon: CheckSquare },
            { id: 'testCase', label: 'Test Case', icon: ShieldCheck }
        ].map(item => {
            const Icon = item.icon;
            const selected = activeType === item.id;
            return <button key={item.id} type="button" onClick={() => setActiveType(item.id)} className={`flex flex-col items-center rounded-lg border p-2.5 text-xs font-semibold ${selected ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400'}`}><Icon className="h-4 w-4 mb-1"/>{item.label}</button>;
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeType === 'lead' && <>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Lead Title *"><input required value={leadName} onChange={e => setLeadName(e.target.value)} className={inputClass}/></Field>
            <Field label="Company Name *"><input required value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass}/></Field>
            <Field label="Contact Person *"><input required value={contactPerson} onChange={e => setContactPerson(e.target.value)} className={inputClass}/></Field>
            <Field label="Email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass}/></Field>
            <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass}/></Field>
            <Field label="Service"><input value={service} onChange={e => setService(e.target.value)} className={inputClass}/></Field>
          </div>
        </>}

        {activeType === 'meeting' && <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Lead *"><select required value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)} className={inputClass}><option value="">Select lead</option>{leads.map(l => <option key={l.id} value={l.id}>{l.companyName} — {l.leadName}</option>)}</select></Field>
          <Field label="Type"><select value={meetingType} onChange={e => setMeetingType(e.target.value)} className={inputClass}><option>Online</option><option>Offline</option></select></Field>
          <Field label="Date"><input required type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className={inputClass}/></Field>
          <Field label="Time"><input required type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} className={inputClass}/></Field>
          <div className="sm:col-span-2"><Field label="Purpose *"><input required value={meetingPurpose} onChange={e => setMeetingPurpose(e.target.value)} className={inputClass}/></Field></div>
          {meetingType === 'Online' && <div className="sm:col-span-2"><Field label="Real Meeting Join URL"><input type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="Paste Google Meet / Teams / Zoom URL" className={inputClass}/><a href="https://meet.google.com/new" target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] font-bold text-blue-600">Create real Google Meet ↗</a></Field></div>}
        </div>}

        {activeType === 'project' && <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Project Name *"><input required value={projectName} onChange={e => setProjectName(e.target.value)} className={inputClass}/></Field>
          <Field label="Client *"><input required value={clientName} onChange={e => setClientName(e.target.value)} className={inputClass}/></Field>
          <Field label="Project Type"><input value={projectType} onChange={e => setProjectType(e.target.value)} className={inputClass}/></Field>
          <Field label="Project Manager *"><select required value={projectManager} onChange={e => setProjectManager(e.target.value)} className={inputClass}><option value="">Select manager</option>{managers.map(u => <option key={u.id} value={u.name}>{u.name} — {u.role}</option>)}</select></Field>
          <Field label="Expected Completion *"><input required type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} className={inputClass}/></Field>
          <Field label="Contract Value (BHD)"><input type="number" min="0" value={value} onChange={e => setValue(e.target.value)} className={inputClass}/></Field>
          <Field label="Project Stage"><select value={projectStage} onChange={e => setProjectStage(e.target.value)} className={inputClass}>{['Planning', 'Requirements', 'UI/UX', 'Development', 'Internal Testing', 'Client UAT', 'Changes', 'Deployment', 'Support', 'Completed', 'On Hold'].map(status => <option key={status}>{status}</option>)}</select></Field>
          <Field label="Initial Completion (%)"><input type="number" min="0" max="100" step="1" value={projectProgress} onChange={e => setProjectProgress(e.target.value)} className={inputClass}/><span className="mt-1 block text-[10px] text-slate-500">Enter any value from 0 to 100. You can change it later inside the project.</span></Field>
          <div className="sm:col-span-2"><Field label="Manual Project Status / Current Update"><textarea rows={3} value={projectManualStatus} onChange={e => setProjectManualStatus(e.target.value)} placeholder="Enter the current real project status or update." className={inputClass}/></Field></div>
        </div>}

        {(activeType === 'task' || activeType === 'testCase') && <Field label="Project *"><select required value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className={inputClass}><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectId} — {p.projectName}</option>)}</select></Field>}

        {activeType === 'task' && <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Field label="Task Name *"><input required value={taskName} onChange={e => setTaskName(e.target.value)} className={inputClass}/></Field></div>
          <Field label="Module"><input value={module} onChange={e => setModule(e.target.value)} className={inputClass}/></Field>
          <Field label="Assigned Member"><select value={assignedMember} onChange={e => setAssignedMember(e.target.value)} className={inputClass}><option value="">Select employee</option>{projectMembers.map(m => <option key={m.id} value={m.employeeName}>{m.employeeName} — {m.role}</option>)}</select></Field>
          <Field label="Due Date"><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass}/></Field>
        </div>}

        {activeType === 'testCase' && <div className="space-y-3">
          <Field label="Scenario *"><input required value={scenario} onChange={e => setScenario(e.target.value)} className={inputClass}/></Field>
          <Field label="Module"><input value={module} onChange={e => setModule(e.target.value)} className={inputClass}/></Field>
        </div>}

        <Field label="Priority"><select value={priority} onChange={e => setPriority(e.target.value)} className={inputClass}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></Field>

        <div className="pt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="w-full sm:w-auto rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700">Cancel</button>
          <button type="submit" className="w-full sm:w-auto rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Save {activeType === 'testCase' ? 'TEST CASE' : activeType.toUpperCase()}</button>
        </div>
      </form>
    </Modal>);
};
const Field = ({ label, children }) => <label className="block text-slate-900"><span className="mb-1 block text-xs font-semibold text-slate-900">{label}</span>{children}</label>;
