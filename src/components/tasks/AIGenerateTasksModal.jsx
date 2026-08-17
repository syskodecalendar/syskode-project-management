import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { Sparkles } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { teamService } from '../../services/teamService';

const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-black focus:border-blue-500 focus:outline-none';

export const AIGenerateTasksModal = ({ isOpen, onClose, onSuccess, initialProjectId = '' }) => {
  const projects = projectService.getProjects();
  const [projectId, setProjectId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [count, setCount] = useState(8);
  const [dueDate, setDueDate] = useState('');
  const [generated, setGenerated] = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (isOpen) { const validInitial = projects.some(p => p.id === initialProjectId) ? initialProjectId : ''; setProjectId(validInitial); setGenerated([]); setSelected([]); setError(''); setInstructions(''); } }, [isOpen, initialProjectId]);
  const project = projects.find(p => p.id === projectId);
  const members = useMemo(() => projectId ? teamService.getMembersByProject(projectId) : [], [projectId, isOpen, generated.length]);

  const generate = async () => {
    if (!project) return setError('Select a project first.');
    setBusy(true); setError('');
    try {
      const result = await aiService.generateProjectTasks({
        project: { id: project.id, projectName: project.projectName, projectType: project.projectType, description: project.description, projectStatus: project.projectStatus, expectedCompletionDate: project.expectedCompletionDate },
        members: members.map(m => ({ employeeName: m.employeeName, role: m.role, responsibility: m.responsibility })),
        instructions,
        count: Number(count) || 8,
        dueDate,
      });
      setGenerated(result.tasks || []);
      setSelected((result.tasks || []).map((_, i) => i));
    } catch (e) { setError(e?.message || 'Unable to generate tasks.'); }
    finally { setBusy(false); }
  };

  const save = () => {
    if (!project) return;
    const rows = generated.filter((_, i) => selected.includes(i));
    rows.forEach(t => taskService.createTask({
      projectId: project.id,
      projectName: project.projectName,
      taskName: t.taskName,
      module: t.module || '',
      description: t.description || '',
      assignedMember: members.some(m => m.employeeName === t.assignedMember) ? t.assignedMember : 'Unassigned',
      priority: t.priority || 'Medium',
      status: 'To Do',
      dueDate: t.dueDate || dueDate || project.expectedCompletionDate || '',
      estimatedHours: Number(t.estimatedHours) || 0,
      generatedByAI: true,
    }));
    onSuccess?.(`${rows.length} AI-generated task(s) saved to ${project.projectName}.`);
    onClose();
  };

  return <Modal isOpen={isOpen} onClose={onClose} title="Generate Project Tasks with AI" subtitle="Gemini uses the real project description and assigned project members. No sample tasks are inserted." maxWidth="4xl">
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-800">Project *<select value={projectId} onChange={e => { setProjectId(e.target.value); setGenerated([]); }} className={`mt-1 ${field}`}><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectName} — {p.client}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-800">Number of tasks<input type="number" min="1" max="30" value={count} onChange={e => setCount(e.target.value)} className={`mt-1 ${field}`}/></label>
        <label className="text-xs font-semibold text-slate-800">Target due date (optional)<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={`mt-1 ${field}`}/></label>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600"><strong className="text-slate-900">Assigned members:</strong> {members.length ? members.map(m => `${m.employeeName} (${m.role})`).join(', ') : 'No members assigned yet. Assign project members first for AI auto-assignment.'}</div>
      </div>
      <label className="block text-xs font-semibold text-slate-800">Extra instructions<textarea rows={3} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Add real project-specific instructions if needed." className={`mt-1 ${field}`}/></label>
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div>}
      {!generated.length ? <div className="flex justify-end"><button disabled={busy || !projectId} onClick={generate} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Sparkles className="h-4 w-4"/>{busy ? 'Generating…' : 'Generate Tasks'}</button></div> : <>
        <div className="max-h-96 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">{generated.map((t,i) => <label key={i} className={`block cursor-pointer rounded-lg border p-3 text-xs ${selected.includes(i) ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white opacity-60'}`}><div className="flex gap-3"><input type="checkbox" checked={selected.includes(i)} onChange={() => setSelected(v => v.includes(i) ? v.filter(x => x !== i) : [...v, i])}/><div><p className="font-bold text-slate-900">{t.taskName}</p><p className="mt-1 text-slate-600">{t.module} • {t.assignedMember || 'Unassigned'} • {t.priority} • {t.estimatedHours || 0}h</p><p className="mt-1 text-slate-500">{t.description}</p></div></div></label>)}</div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><button onClick={() => setGenerated([])} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">Regenerate</button><button disabled={!selected.length} onClick={save} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Save {selected.length} Task(s)</button></div>
      </>}
    </div>
  </Modal>;
};
