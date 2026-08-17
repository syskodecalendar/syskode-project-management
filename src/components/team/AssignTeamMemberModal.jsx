import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { teamService } from '../../services/teamService';
import { authService } from '../../services/authService';
const roles = ['Project Manager', 'Technical Lead', 'Business Analyst', 'UI/UX Designer', 'Frontend Developer', 'Backend Developer', 'WordPress Developer', 'Zoho Developer', 'Mobile Developer', 'QA', 'QA Engineer', 'DevOps', 'Digital Marketing', 'Account Manager', 'Other'];
export const AssignTeamMemberModal = ({ isOpen, onClose, projects, onSuccess }) => {
    const employees = authService.getAllProfiles().filter(u => u.status !== 'Inactive');
    const [projectId, setProjectId] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('Frontend Developer');
    const [responsibility, setResponsibility] = useState('');
    useEffect(() => { if (isOpen && !projectId && projects[0])
        setProjectId(projects[0].id); }, [isOpen, projectId, projects]);
    const submit = (e) => { e.preventDefault(); if (!projectId || !name.trim())
        return; teamService.addMember(projectId, name.trim(), role, responsibility || role); onSuccess('Team member assigned to the selected project.'); setName(''); setResponsibility(''); onClose(); };
    const cls = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900';
    return <Modal isOpen={isOpen} onClose={onClose} title="Assign Team Member" subtitle="Add a delivery team member to a live project." maxWidth="lg"><form onSubmit={submit} className="space-y-4">
    <label className="block text-xs font-semibold text-slate-900">Project<select required value={projectId} onChange={e => setProjectId(e.target.value)} className={cls}><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectId} — {p.projectName}</option>)}</select></label>
    <label className="block text-xs font-semibold text-slate-900">Employee *<select required value={name} onChange={e => setName(e.target.value)} className={cls}><option value="">Select employee</option>{employees.map(u => <option key={u.id} value={u.name}>{u.name} — {u.role}</option>)}</select></label>
    <label className="block text-xs font-semibold text-slate-900">Role<select value={role} onChange={e => setRole(e.target.value)} className={cls}>{roles.map(r => <option key={r}>{r}</option>)}</select></label>
    <label className="block text-xs font-semibold text-slate-900">Responsibility<textarea rows={3} value={responsibility} onChange={e => setResponsibility(e.target.value)} className={cls}/></label>
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 sm:w-auto">Cancel</button><button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white sm:w-auto">Assign Member</button></div>
  </form></Modal>;
};
