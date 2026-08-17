import React, { useState } from 'react';
import { hasPermission } from '../../services/permissionService';
import { documentService } from '../../services/documentService';
import { proposalExportService } from '../../services/proposalExportService';
import { Badge } from '../common/Badge';
import { BrainCircuit, Copy, Download, FileCheck, FileDown, FileInput, FilePenLine, FileText, Plus, Search, Sparkles, Trash2, Upload, WandSparkles } from 'lucide-react';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';

export const ProposalsView = ({ currentUser, onUploadProposal = () => {}, onCreateProposalMode = () => {}, onEditProposal = () => {}, onOpenAISummary = () => {}, onOpenAICompare = () => {} }) => {
  const canManage = hasPermission(currentUser, 'manage_proposals');
  const canDelete = hasPermission(currentUser, 'delete_proposals');
  const [, setVersion] = useState(0);
  const documents = documentService.getDocuments();
  const builderDocs = documents.filter(d => d.sourceType === 'builder');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [cloneSourceId, setCloneSourceId] = useState('');

  const filteredDocs = documents.filter(doc => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (doc.documentName || '').toLowerCase().includes(q) || (doc.category || '').toLowerCase().includes(q) || (doc.companyName || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (categoryFilter === 'Builder' && doc.sourceType !== 'builder') return false;
    if (categoryFilter !== 'All' && categoryFilter !== 'Builder' && doc.category !== categoryFilter) return false;
    return true;
  });

  const cloneSelected = () => {
    const source = builderDocs.find(d => d.id === cloneSourceId);
    if (!source) return;
    const clone = documentService.cloneProposal(source.id, currentUser.name);
    setVersion(v => v + 1);
    onEditProposal(clone);
  };

  return <div className="space-y-6">
    <div className="rounded-2xl border border-[#d8e7f0] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><h2 className="flex items-center gap-2 text-xl font-bold text-[#071A35]"><FileText className="h-5 w-5 text-[#00AEEF]"/>Proposal Studio</h2><p className="mt-1 max-w-3xl text-xs text-[#667085]">Create from a client RFP/RFQ with AI, reuse vendor proposal content with AI, build manually, or clone an existing Syskode proposal.</p></div>
        <div className="flex flex-wrap gap-2"><ExcelExportButton label="Export Proposals" onClick={() => excelExportService.exportRows(
          `syskode-proposals-${new Date().toISOString().slice(0, 10)}`,
          'Proposals',
          filteredDocs.map(doc => ({ Proposal: doc.documentName, Company: doc.companyName || '', Category: doc.category || '', Source_Type: doc.sourceType || '', Status: doc.proposalStatus || '', Proposal_Number: doc.proposalNumber || '', Proposal_Date: doc.proposalDate || '', Prepared_For: doc.preparedFor || '', Sections: doc.builderSections?.length || 0, AI_Source_Files: doc.sourceFiles?.length || 0, Created_By: doc.createdBy || '', Created_At: doc.createdAt || '' }))
        )}/><button onClick={onOpenAICompare} className="inline-flex items-center gap-2 rounded-xl border border-indigo-700/80 bg-indigo-950/60 px-3.5 py-2 text-xs font-semibold text-indigo-200"><Sparkles className="h-4 w-4"/>AI Compare</button>{canManage && <button onClick={onUploadProposal} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-white"><Upload className="h-4 w-4"/>Upload Existing</button>}</div>
      </div>
    </div>

    {canManage && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <CreationCard icon={BrainCircuit} title="AI from Client RFP / RFQ" text="Upload the client's RFP/RFQ. Gemini reads it and creates an editable Syskode proposal without inventing unsupported scope or pricing." onClick={() => onCreateProposalMode('rfq')} tone="emerald"/>
      <CreationCard icon={WandSparkles} title="AI from Vendor Proposal" text="Upload a vendor/competitor proposal and use AI to convert the full document, or an optional heading range, into editable Syskode content." onClick={() => onCreateProposalMode('vendor')} tone="violet"/>
      <CreationCard icon={FilePenLine} title="Create Manually" text="Use the approved Syskode proposal template and edit sections, tables, images and signatures manually." onClick={() => onCreateProposalMode('manual')} tone="blue"/>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><div className="flex items-center gap-2"><Copy className="h-5 w-5 text-cyan-400"/><h3 className="text-sm font-bold text-zinc-100">Clone Existing Proposal</h3></div><p className="mt-2 min-h-12 text-xs leading-5 text-zinc-400">Start from a real previous proposal, then edit it for the new lead.</p><select value={cloneSourceId} onChange={e => setCloneSourceId(e.target.value)} className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200"><option value="">Select proposal</option>{builderDocs.map(d => <option key={d.id} value={d.id}>{d.documentName}</option>)}</select><button disabled={!cloneSourceId} onClick={cloneSelected} className="mt-2 w-full rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Clone & Edit</button></div>
    </div>}

    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Metric label="Total Proposals" value={documents.length}/><Metric label="Editable Builder" value={builderDocs.length} tone="text-blue-400"/><Metric label="Uploaded Docs" value={documents.filter(d => d.sourceType !== 'builder').length} tone="text-indigo-400"/><Metric label="Ready / Approved" value={documents.filter(d => ['Ready','Approved'].includes(d.proposalStatus)).length} tone="text-emerald-400"/>
    </div>

    <div className="flex flex-col gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500"/><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search proposal, company or category..." className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 py-1.5 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"/></div><div className="flex gap-1.5 overflow-x-auto">{['All','Builder','Combined Proposal','Technical Proposal','Commercial Proposal'].map(cat => <button key={cat} onClick={() => setCategoryFilter(cat)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${categoryFilter === cat ? 'border border-zinc-700 bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'}`}>{cat}</button>)}</div></div>

    {filteredDocs.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center"><FileInput className="mx-auto h-10 w-10 text-zinc-600"/><h3 className="mt-3 text-sm font-bold text-zinc-200">No proposals yet</h3><p className="mt-1 text-xs text-zinc-500">Use one of the four creation methods above. No sample proposals are preloaded.</p></div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{filteredDocs.map(doc => {
      const isBuilder = doc.sourceType === 'builder';
      const currentVer = doc.versions?.find(v => v.isCurrentVersion) || doc.versions?.[doc.versions.length - 1];
      return <div key={doc.id} className="space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5">
        <div><div className="flex flex-wrap gap-2"><span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${isBuilder ? 'border-blue-800/60 bg-blue-950/70 text-blue-300' : 'border-indigo-800/50 bg-indigo-950/80 text-indigo-300'}`}>{isBuilder ? 'Editable Builder' : doc.category}</span>{isBuilder && <Badge variant={doc.proposalStatus === 'Approved' ? 'green' : 'blue'}>{doc.proposalStatus || 'Draft'}</Badge>}{!isBuilder && currentVer && <Badge variant="blue">{currentVer.version} Current</Badge>}</div><h3 className="mt-2 truncate text-base font-bold text-zinc-100">{doc.documentName}</h3><p className="mt-1 text-[11px] text-zinc-500">{doc.companyName || 'Linked lead proposal'} • {doc.category}</p></div>
        {isBuilder ? <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-800/50 bg-zinc-950/60 p-3 text-center"><SmallStat value={doc.builderSections?.length || 0} label="Sections"/><SmallStat value={(doc.builderSections || []).reduce((n,s) => n + (s.blocks?.length || 0),0)} label="Blocks"/><SmallStat value={doc.sourceFiles?.length || 0} label="AI Sources"/></div> : <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/60 p-3 text-xs text-zinc-300"><FileCheck className="mr-1 inline h-4 w-4 text-blue-400"/>{currentVer?.fileName || 'Uploaded document'}</div>}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-3"><div className="flex flex-wrap gap-2">{isBuilder && canManage && <button onClick={() => onEditProposal(doc)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white"><FilePenLine className="h-3.5 w-3.5"/>Edit</button>}{isBuilder && canManage && <button onClick={() => { const clone = documentService.cloneProposal(doc.id, currentUser.name); setVersion(v => v+1); onEditProposal(clone); }} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-200"><Copy className="h-3.5 w-3.5"/>Clone</button>}{!isBuilder && <button onClick={() => onOpenAISummary(doc)} className="text-xs font-semibold text-indigo-400">AI Summary</button>}</div><div className="flex gap-2">{isBuilder && <button onClick={async () => { try { await proposalExportService.exportToPdf(doc); } catch (e) { alert(e?.message || 'Unable to export PDF.'); } }} className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200"><FileDown className="h-3.5 w-3.5"/>PDF</button>}{!isBuilder && currentVer && <button onClick={async () => { const url = await documentService.getDownloadUrl(currentVer); if (url) window.open(url,'_blank','noopener,noreferrer'); }} className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300"><Download className="h-3.5 w-3.5"/>Download</button>}{canDelete && <button onClick={() => { if (window.confirm(`Delete proposal ${doc.documentName}?`)) { documentService.deleteDocument(doc.id); setVersion(v=>v+1); } }} className="rounded-lg border border-rose-900/60 px-3 py-1.5 text-xs text-rose-400"><Trash2 className="h-3.5 w-3.5"/></button>}</div></div>
      </div>;
    })}</div>}
  </div>;
};

const CreationCard = ({ icon: Icon, title, text, onClick, tone }) => { const cls = tone === 'emerald' ? 'text-emerald-400 bg-emerald-950/40' : tone === 'violet' ? 'text-violet-400 bg-violet-950/40' : 'text-blue-400 bg-blue-950/40'; return <button onClick={onClick} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-left transition hover:border-zinc-700"><div className={`inline-flex rounded-lg p-2 ${cls}`}><Icon className="h-5 w-5"/></div><h3 className="mt-3 text-sm font-bold text-zinc-100">{title}</h3><p className="mt-2 text-xs leading-5 text-zinc-400">{text}</p></button>; };
const Metric = ({ label, value, tone='text-zinc-100' }) => <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4"><p className="text-xs font-medium text-zinc-400">{label}</p><p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p></div>;
const SmallStat = ({ value, label }) => <div><p className="text-lg font-black text-white">{value}</p><p className="text-[10px] text-zinc-500">{label}</p></div>;
