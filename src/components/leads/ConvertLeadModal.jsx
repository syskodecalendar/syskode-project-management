import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { projectService } from '../../services/projectService';
import { authService } from '../../services/authService';
export const ConvertLeadModal = ({ isOpen, onClose, lead, onSuccess }) => {
    const managers = authService.getAllProfiles().filter(u => u.status !== 'Inactive' && ['Admin', 'Management', 'Project Manager'].includes(u.role));
    const [pm, setPm] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [completionDate, setCompletionDate] = useState('');
    const [contractValue, setContractValue] = useState(lead?.estimatedProjectValue ? String(lead.estimatedProjectValue) : '');
    if (!lead)
        return null;
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!pm || !startDate || !completionDate) return;
        const project = projectService.convertLeadToProject(lead.id, pm, startDate, completionDate, Number(contractValue) || 0, lead.notes);
        onSuccess(project);
        onClose();
    };
    return (<Modal isOpen={isOpen} onClose={onClose} title={`Convert Lead to Active Project: ${lead.leadName}`} subtitle={`Lead status is Won. Initialize active project workspace for ${lead.companyName}`} maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-medium">
          🎉 Congratulations! Converting "{lead.leadName}" will generate a new Project ID and open the real project workspace. Team members can then be assigned from your employee list.
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Assigned Project Manager *
          </label>
          <select required value={pm} onChange={e => setPm(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option value="">Select project manager</option>
            {managers.map(u => <option key={u.id} value={u.name}>{u.name} — {u.role}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Kickoff Date *
            </label>
            <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expected Completion Date *
            </label>
            <input type="date" required value={completionDate} onChange={e => setCompletionDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Contract Value (BHD)
          </label>
          <input type="number" value={contractValue} onChange={e => setContractValue(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
        </div>

        <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-700">
            Create Active Project
          </button>
        </div>
      </form>
    </Modal>);
};
