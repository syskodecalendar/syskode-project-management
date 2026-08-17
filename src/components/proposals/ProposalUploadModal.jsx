import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { documentService } from '../../services/documentService';
const categories = ['Technical Proposal', 'Commercial Proposal', 'Combined Proposal', 'Revised Proposal', 'Scope Document', 'Requirement Document', 'Other'];
export const ProposalUploadModal = ({ isOpen, onClose, leads, currentUser, targetLeadId, onSuccess }) => {
    const [leadId, setLeadId] = useState(targetLeadId || '');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Combined Proposal');
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!isOpen)
            return;
        setLeadId(targetLeadId || leads[0]?.id || '');
        setError('');
    }, [isOpen, targetLeadId, leads]);
    const submit = async (e) => {
        e.preventDefault();
        if (!leadId || !file)
            return;
        setLoading(true);
        setError('');
        try {
            await documentService.uploadProposal(leadId, name || file.name.replace(/\.[^.]+$/, ''), category, file, currentUser.name, notes || undefined);
            onSuccess('Proposal uploaded to Supabase Storage and saved to the database.');
            setFile(null);
            setName('');
            setNotes('');
            onClose();
        }
        catch (err) {
            setError(err?.message || 'Unable to upload proposal.');
        }
        finally {
            setLoading(false);
        }
    };
    return <Modal isOpen={isOpen} onClose={onClose} title="Upload Proposal" subtitle="Store proposal files securely and maintain version history." maxWidth="lg">
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-xs font-semibold">Lead
        <select required value={leadId} onChange={e => setLeadId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs dark:bg-slate-800 dark:border-slate-700">
          <option value="">Select lead</option>{leads.map(l => <option key={l.id} value={l.id}>{l.leadId} — {l.companyName} / {l.leadName}</option>)}
        </select>
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-xs font-semibold">Document Name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wael Pharmacy Proposal" className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs dark:bg-slate-800 dark:border-slate-700"/></label>
        <label className="block text-xs font-semibold">Category<select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs dark:bg-slate-800 dark:border-slate-700">{categories.map(c => <option key={c}>{c}</option>)}</select></label>
      </div>
      <label className="block text-xs font-semibold">Proposal File *<input required type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full rounded-lg border border-dashed border-slate-300 p-3 text-xs dark:border-slate-700"/></label>
      <label className="block text-xs font-semibold">Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs dark:bg-slate-800 dark:border-slate-700"/></label>
      {error && <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-xs font-semibold">Cancel</button><button disabled={loading || !file || !leadId} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{loading ? 'Uploading…' : 'Upload & Save'}</button></div>
    </form>
  </Modal>;
};
