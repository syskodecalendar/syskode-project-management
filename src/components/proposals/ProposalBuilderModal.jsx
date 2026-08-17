import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Bold, Copy, FileDown, FilePlus2, FileText, Heading1, Heading2, Image as ImageIcon, List, Loader2, PenLine, Plus, Save, Sparkles, Table2, WandSparkles, Trash2, } from 'lucide-react';
import { Modal } from '../common/Modal';
import { documentService } from '../../services/documentService';
import { proposalExportService } from '../../services/proposalExportService';
import { aiService } from '../../services/aiService';
const CATEGORIES = [
    'Combined Proposal',
    'Technical Proposal',
    'Commercial Proposal',
    'Revised Proposal',
    'Scope Document',
    'Requirement Document',
    'Other',
];
const uid = () => crypto.randomUUID();
function emptyBlock(type) {
    if (type === 'points')
        return { id: uid(), type, points: [''] };
    if (type === 'table')
        return { id: uid(), type, tableHeaders: ['Item', 'Description', 'Amount'], tableRows: [['', '', ''], ['', '', '']], tableCaption: '' };
    if (type === 'signature')
        return { id: uid(), type, signatoryName: '', signatoryTitle: '' };
    return { id: uid(), type, text: '' };
}
function cloneSections(sections) {
    return sections.map(section => ({
        ...section,
        blocks: (section.blocks || []).map(block => ({
            ...block,
            points: block.points ? [...block.points] : undefined,
            tableHeaders: block.tableHeaders ? [...block.tableHeaders] : undefined,
            tableRows: block.tableRows ? block.tableRows.map(row => [...row]) : undefined,
        })),
    }));
}
function standardProposalSections(lead) {
    const client = lead?.companyName || lead?.leadName || 'Client';
    const contact = lead?.contactPerson || lead?.leadName || 'Sir/Madam';
    return [
        { id: uid(), name: 'Cover Letter', blocks: [
                { id: uid(), type: 'heading', text: 'Cover Letter' },
                { id: uid(), type: 'paragraph', text: `Dear ${contact},\n\nThank you for the opportunity to submit our proposal for your consideration. Syskode Technologies W.L.L. combines technical excellence, clear communication and practical delivery planning to create solutions aligned with each client's business needs.\n\nWe appreciate the time ${client} will spend reviewing this proposal and look forward to discussing the scope in detail.` },
                { id: uid(), type: 'signature', signatoryName: 'Sajin Hentry', signatoryTitle: 'Managing Director, Syskode Technologies W.L.L.' },
            ] },
        { id: uid(), name: 'About Us', blocks: [
                { id: uid(), type: 'heading', text: 'About Us' },
                { id: uid(), type: 'paragraph', text: 'Syskode Technologies W.L.L. is a Bahrain-based technology company delivering software, cloud, automation, ERP/CRM and digital solutions. Our delivery approach combines business analysis, product design, engineering, integration, quality assurance, deployment and ongoing support.' },
            ] },
        { id: uid(), name: 'Your Partner for Software Innovation', blocks: [
                { id: uid(), type: 'heading', text: 'Your Partner for Software Innovation' },
                { id: uid(), type: 'paragraph', text: 'We work with organizations across different industries to transform business requirements into secure, maintainable and scalable digital products. The final technology stack and architecture are selected based on the project scope, integration requirements and operational constraints.' },
            ] },
        { id: uid(), name: 'Introduction', blocks: [
                { id: uid(), type: 'heading', text: 'Introduction' },
                { id: uid(), type: 'paragraph', text: `This proposal outlines Syskode Technologies W.L.L.'s recommended approach for ${client}. The project will be delivered through structured discovery, design, development, integration, testing, user acceptance and deployment stages, with regular client communication throughout the engagement.` },
                { id: uid(), type: 'points', points: ['Prioritize business outcomes and customer experience', 'Maintain transparent communication and milestone visibility', 'Support controlled changes through an agreed change-request process', 'Validate quality through internal QA and client UAT before go-live'] },
            ] },
        { id: uid(), name: 'Project Deliverables', blocks: [
                { id: uid(), type: 'heading', text: 'Project Deliverables' },
                { id: uid(), type: 'subheading', text: 'Executive Summary' },
                { id: uid(), type: 'paragraph', text: 'Describe the proposed solution, the business problem it solves and the expected outcome.' },
                { id: uid(), type: 'subheading', text: 'Project Objectives' },
                { id: uid(), type: 'points', points: ['Objective 1', 'Objective 2', 'Objective 3'] },
                { id: uid(), type: 'subheading', text: 'Scope of Work' },
                { id: uid(), type: 'table', tableCaption: 'Functional Scope', tableHeaders: ['Function / Module', 'Scope'], tableRows: [['Module 1', 'Describe included functionality'], ['Module 2', 'Describe included functionality']] },
            ] },
        { id: uid(), name: 'Timeline', blocks: [
                { id: uid(), type: 'heading', text: 'Timeline' },
                { id: uid(), type: 'table', tableCaption: 'Implementation Plan', tableHeaders: ['Phase', 'Duration', 'Deliverables'], tableRows: [['1 · Discovery & Setup', 'Week 1', 'Requirements confirmation, project setup and access'], ['2 · Design & Build', 'To be confirmed', 'UI/UX, development and iterative demos'], ['3 · Integration & QA', 'To be confirmed', 'Integrations, testing and fixes'], ['4 · UAT & Launch', 'To be confirmed', 'Client UAT, deployment and handover']] },
            ] },
        { id: uid(), name: 'Pricing', blocks: [
                { id: uid(), type: 'heading', text: 'Pricing' },
                { id: uid(), type: 'table', tableCaption: 'Commercial Breakdown', tableHeaders: ['Description', 'Cost'], tableRows: [['Implementation / Development', 'To be confirmed'], ['Hosting / Subscription / Third-party services', 'To be confirmed']] },
                { id: uid(), type: 'subheading', text: 'Payment Terms' },
                { id: uid(), type: 'points', points: ['Define milestone-based payment percentages before issuing the final proposal.'] },
            ] },
        { id: uid(), name: 'Contract Terms', blocks: [
                { id: uid(), type: 'heading', text: 'Contract Terms' },
                { id: uid(), type: 'paragraph', text: 'The final scope, commercial value, timeline and responsibilities will be governed by the approved proposal and any mutually agreed amendments.' },
                { id: uid(), type: 'subheading', text: 'Client Requirements' },
                { id: uid(), type: 'points', points: ['Provide required approvals, content, access and third-party credentials on time', 'Nominate authorized stakeholders for feedback and UAT', 'Provide third-party API or vendor coordination where the scope depends on external systems'] },
            ] },
        { id: uid(), name: 'Our Process', blocks: [
                { id: uid(), type: 'heading', text: 'Our Process' },
                { id: uid(), type: 'subheading', text: 'Project Kick-off Meeting' },
                { id: uid(), type: 'paragraph', text: 'After award, Syskode will conduct a project kick-off meeting to confirm the delivery plan, stakeholders, communication channels, responsibilities, environments and immediate next actions.' },
                { id: uid(), type: 'points', points: ['Discovery and backlog preparation', 'Sprint planning and development', 'Regular progress reviews and demos', 'Internal QA and client UAT', 'Production deployment and handover'] },
            ] },
        { id: uid(), name: 'Quality Assurance', blocks: [
                { id: uid(), type: 'heading', text: 'Quality Assurance' },
                { id: uid(), type: 'paragraph', text: 'Quality assurance is incorporated throughout the delivery lifecycle. Functional, usability, reliability, performance and regression checks are applied as appropriate to the solution.' },
                { id: uid(), type: 'subheading', text: 'Change Request' },
                { id: uid(), type: 'paragraph', text: 'Any requirement outside the approved scope will be reviewed for effort, timeline and commercial impact. Work on material scope changes will proceed after mutual approval.' },
            ] },
        { id: uid(), name: 'Acceptance Period & Terms', blocks: [
                { id: uid(), type: 'heading', text: 'Acceptance Period' },
                { id: uid(), type: 'paragraph', text: 'The implementation plan will include client review and user-acceptance testing before go-live. Issues raised after the agreed acceptance/support period may be handled under support or AMC services.' },
                { id: uid(), type: 'subheading', text: 'Terms and Conditions' },
                { id: uid(), type: 'points', points: ['The project will be developed based on the features and scope approved in this proposal.', 'Delays in client-provided information, approvals or third-party access may affect the project timeline.', 'Additional functionality outside the agreed scope may be estimated and charged separately.', 'Proposal validity can be defined before final submission.'] },
            ] },
        { id: uid(), name: 'Cancellation, Copyright & Delivery', blocks: [
                { id: uid(), type: 'heading', text: 'Cancellation of the Project' },
                { id: uid(), type: 'paragraph', text: 'Any cancellation terms, applicable charges and refund conditions should be confirmed in the final commercial agreement based on the stage of work completed.' },
                { id: uid(), type: 'subheading', text: 'Copyright' },
                { id: uid(), type: 'paragraph', text: 'Intellectual-property ownership and source-code handover will follow the terms stated in the final approved proposal and commercial agreement.' },
                { id: uid(), type: 'subheading', text: 'Reporting & Delivery' },
                { id: uid(), type: 'paragraph', text: `Syskode Technologies W.L.L. will provide agreed project updates and, upon completion, hand over the documentation and credentials included in the approved scope to ${client}.` },
            ] },
        { id: uid(), name: 'Acceptance', blocks: [
                { id: uid(), type: 'heading', text: 'Acceptance' },
                { id: uid(), type: 'paragraph', text: 'By signing below, both parties acknowledge the approved scope and indicate their intention to proceed in accordance with the agreed commercial and contractual terms.' },
                { id: uid(), type: 'signature', signatoryName: 'Sajin Hentry', signatoryTitle: 'Managing Director, Syskode Technologies W.L.L.' },
                { id: uid(), type: 'signature', signatoryName: client, signatoryTitle: 'Authorized Client Representative' },
            ] },
    ];
}
const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-black placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
const labelClass = 'mb-1 block text-xs font-bold text-black';
const SignedAsset = ({ path, alt, className }) => {
    const [url, setUrl] = useState(null);
    useEffect(() => {
        let alive = true;
        if (!path) {
            setUrl(null);
            return;
        }
        documentService.getAssetUrl(path).then(value => { if (alive)
            setUrl(value); }).catch(() => setUrl(null));
        return () => { alive = false; };
    }, [path]);
    if (!path)
        return null;
    if (!url)
        return <div className="flex h-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">Loading image…</div>;
    return <img src={url} alt={alt || ''} className={className || 'max-h-72 w-full rounded-lg object-contain'}/>;
};
const TableBlockEditor = ({ block, onChange }) => {
    const headers = block.tableHeaders?.length ? block.tableHeaders : ['Item', 'Description', 'Amount'];
    const rows = block.tableRows || [['', '', '']];
    const normalizedRows = rows.map(row => headers.map((_, i) => row?.[i] ?? ''));
    const updateHeaders = (nextHeaders) => onChange({
        tableHeaders: nextHeaders,
        tableRows: normalizedRows.map(row => nextHeaders.map((_, i) => row[i] ?? '')),
    });
    const updateRows = (nextRows) => onChange({ tableRows: nextRows });
    return <div className="space-y-3">
    <div><label className={labelClass}>Table Caption (optional)</label><input value={block.tableCaption || ''} onChange={e => onChange({ tableCaption: e.target.value })} className={fieldClass} placeholder="e.g. Commercial Breakdown"/></div>
    <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white">
      <table className="min-w-[620px] w-full border-collapse text-xs text-black">
        <thead className="bg-[#0a2038] text-white"><tr>{headers.map((header, c) => <th key={c} className="min-w-36 border-r border-white/15 p-2 last:border-0"><input value={header} onChange={e => { const next = [...headers]; next[c] = e.target.value; updateHeaders(next); }} className="w-full rounded border border-white/20 bg-white px-2 py-1.5 text-xs font-bold text-black" placeholder={`Column ${c + 1}`}/></th>)}</tr></thead>
        <tbody>{normalizedRows.map((row, r) => <tr key={r} className="border-t border-slate-200">{headers.map((_, c) => <td key={c} className="border-r border-slate-200 p-2 last:border-0"><textarea value={row[c] || ''} onChange={e => { const next = normalizedRows.map(x => [...x]); next[r][c] = e.target.value; updateRows(next); }} className="min-h-16 w-full resize-y rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-black"/></td>)}</tr>)}</tbody>
      </table>
    </div>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => updateRows([...normalizedRows, headers.map(() => '')])} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700">+ Row</button>
      <button type="button" onClick={() => { if (headers.length >= 8)
        return; updateHeaders([...headers, `Column ${headers.length + 1}`]); }} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700">+ Column</button>
      <button type="button" disabled={normalizedRows.length <= 1} onClick={() => updateRows(normalizedRows.slice(0, -1))} className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 disabled:opacity-40">Remove Last Row</button>
      <button type="button" disabled={headers.length <= 1} onClick={() => updateHeaders(headers.slice(0, -1))} className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 disabled:opacity-40">Remove Last Column</button>
    </div>
  </div>;
};
const ProposalPreview = ({ proposal }) => (<div className="space-y-4">
    {/* Cover - Syskode split layout */}
    <div className="relative aspect-[210/297] overflow-hidden rounded-xl bg-[#f7fbfe] shadow-xl">
      <div className="absolute inset-y-0 left-0 w-[34.3%] bg-[#0c2038]"/>
      <div className="absolute left-[34.3%] right-[1.9%] top-[1.35%] border-t border-[#b8ddf2]"/>
      <div className="absolute bottom-[1.35%] left-[34.3%] right-[1.9%] border-b border-[#b8ddf2]"/>
      <div className="absolute bottom-[1.35%] right-[1.9%] top-[1.35%] rounded-r-lg border-r border-[#b8ddf2]"/>

      <img src="/images/syskode-logo-dark.png" alt="" className="pointer-events-none absolute left-[52%] top-1/2 w-[42%] -translate-y-1/2 opacity-[0.055]"/>
      <img src="/images/syskode-logo-light.png" alt="Syskode" className="absolute left-[5.8%] top-[7.5%] w-[23%] object-contain"/>
      <div className="absolute left-[7.6%] top-[14.2%] h-[2px] w-[16%] bg-[#00aeef]"/>
      <div className="absolute left-[7.6%] top-[16.2%] text-[8px] font-bold tracking-wide text-white/90">{proposal.proposalNumber || 'SYS/PROP/-'}</div>

      <div className="absolute left-[42%] right-[7%] top-[23%]">
        <h1 className="text-[25px] font-black leading-[1.05] tracking-[-0.04em] text-[#071a35] sm:text-[30px]">{proposal.documentName || 'Business Proposal'}</h1>
        <p className="mt-4 text-[10px] font-medium leading-5 text-[#667085]">Project proposal for {proposal.companyName || proposal.clientName || 'Client'}</p>
      </div>

      <div className="absolute left-[42%] right-[7%] top-[63%] text-[9px]">
        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#0788c9]">Prepared for</p>
        <p className="mt-2 text-[11px] font-black text-[#071a35]">{proposal.companyName || proposal.clientName || 'Client'}</p>
        {proposal.clientName && proposal.clientName !== proposal.companyName && <p className="mt-1 text-[#667085]">{proposal.clientName}</p>}
        <p className="mt-1 text-[#667085]">{proposal.preparedForLocation || 'Kingdom of Bahrain'}</p>
      </div>

      <div className="absolute bottom-[10.5%] left-[42%] right-[7%] text-[9px]">
        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#0788c9]">Prepared by</p>
        <p className="mt-2 text-[11px] font-black text-[#071a35]">Syskode Technologies W.L.L.</p>
        <p className="mt-1 text-[#667085]">Kingdom of Bahrain</p>
        {proposal.proposalDate && <p className="mt-1 text-[#667085]">{proposal.proposalDate}</p>}
      </div>
    </div>

    {(proposal.builderSections || []).map((section, sectionIndex) => (<section key={section.id} className="relative min-h-[520px] overflow-hidden rounded-xl bg-[#f7fbfe] p-7 pl-9 shadow-lg sm:p-9 sm:pl-11">
        <div className="absolute inset-y-0 left-0 w-[3.8%] bg-[#0c2038]"/>
        <div className="absolute left-[3.8%] right-[1.9%] top-[1.35%] border-t border-[#b8ddf2]"/>
        <div className="absolute bottom-[1.35%] left-[3.8%] right-[1.9%] border-b border-[#b8ddf2]"/>
        <div className="absolute bottom-[1.35%] right-[1.9%] top-[1.35%] rounded-r-lg border-r border-[#b8ddf2]"/>

        <img src="/images/syskode-logo-dark.png" alt="" className="pointer-events-none absolute left-[29%] top-1/2 w-[45%] -translate-y-1/2 opacity-[0.055]"/>
        <img src="/images/syskode-logo-dark.png" alt="Syskode" className="absolute left-[9%] top-[4.4%] w-[15%] object-contain"/>
        <div className="absolute left-[27%] right-[8.5%] top-[6.9%] border-t border-[#dce7ef]"/>

        <div className="relative z-10 pt-10">
          <div className="mb-1 text-[9px] font-black tracking-[0.14em] text-[#0788c9]">{String(sectionIndex + 1).padStart(2, '0')}</div>
          <h2 className="max-w-[90%] text-2xl font-black leading-tight tracking-[-0.035em] text-[#071a35]">{section.name}</h2>
          <div className="mt-4 flex items-center gap-2"><div className="h-[2px] w-12 bg-[#00aeef]"/><div className="h-px flex-1 bg-[#dce7ef]"/></div>
          <div className="mt-7 space-y-5">
            {(section.blocks || []).map(block => {
            if (block.type === 'heading') {
                if ((block.text || '').trim().toLowerCase() === (section.name || '').trim().toLowerCase())
                    return null;
                return <h3 key={block.id} className="text-xl font-black tracking-[-0.025em] text-[#071a35]">{block.text || 'Heading'}</h3>;
            }
            if (block.type === 'subheading')
                return <h4 key={block.id} className="pt-1 text-sm font-black text-[#071a35]">{block.text || 'Subheading'}</h4>;
            if (block.type === 'paragraph')
                return <p key={block.id} className="whitespace-pre-wrap text-xs leading-6 text-slate-700">{block.text || 'Paragraph text'}</p>;
            if (block.type === 'points')
                return <ul key={block.id} className="space-y-2 pl-2 text-xs leading-5 text-slate-700">{(block.points || []).filter(Boolean).map((point, i) => <li key={i} className="flex gap-3"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#00aeef]"/><span>{point}</span></li>)}</ul>;
            if (block.type === 'table')
                return <div key={block.id}>{block.tableCaption && <div className="mb-2 text-[11px] font-black text-[#071a35]">{block.tableCaption}</div>}<div className="overflow-x-auto border border-[#c4d5e0]"><table className="min-w-full border-collapse text-[10px]"><thead className="bg-[#0c2038] text-white"><tr>{(block.tableHeaders || []).map((h, i) => <th key={i} className="border-r border-white/15 px-3 py-2 text-left font-black last:border-0">{h || `Column ${i + 1}`}</th>)}</tr></thead><tbody>{(block.tableRows || []).map((row, r) => <tr key={r} className={r % 2 ? 'bg-[#fbfdff]' : 'bg-white/40'}>{(block.tableHeaders || []).map((_, c) => <td key={c} className="border-r border-t border-[#dce7ef] px-3 py-2 align-top text-slate-700 last:border-r-0">{row?.[c] || '-'}</td>)}</tr>)}</tbody></table></div></div>;
            if (block.type === 'image')
                return <div key={block.id} className="overflow-hidden rounded-lg bg-white/65 p-2"><SignedAsset path={block.imagePath} alt={block.imageAlt}/>{block.imageAlt && <p className="mt-2 text-center text-[9px] italic text-slate-500">{block.imageAlt}</p>}</div>;
            if (block.type === 'signature')
                return <div key={block.id} className="mt-8 inline-block min-w-52 pr-8 align-top"><SignedAsset path={block.signatureImagePath} alt="Signature" className="mb-2 max-h-16 max-w-40 object-contain object-left"/><div className="mb-2 h-8 border-b border-slate-400"/><p className="text-xs font-black text-[#071a35]">{block.signatoryName || 'Authorized Signatory'}</p><p className="mt-1 text-[10px] text-slate-500">{block.signatoryTitle || 'Title'}</p></div>;
            return null;
        })}
          </div>
        </div>
        <div className="absolute bottom-[3.2%] left-[10.8%] right-[8.5%] z-10 flex items-center justify-between border-t border-[#dce7ef] pt-2 text-[8px] text-[#667085]"><span>www.syskode.com</span><span>Page {sectionIndex + 2}</span></div>
      </section>))}
  </div>);
export const ProposalBuilderModal = ({ isOpen, onClose, proposal, leads, currentUser, initialLeadId, initialMode = 'manual', onSaved, }) => {
    const [working, setWorking] = useState(null);
    const [setupName, setSetupName] = useState('');
    const [setupLeadId, setSetupLeadId] = useState('');
    const [setupCategory, setSetupCategory] = useState('Combined Proposal');
    const [templateMode, setTemplateMode] = useState('standard');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [copySourceId, setCopySourceId] = useState('');
    const [copySectionIds, setCopySectionIds] = useState([]);
    const [showCopy, setShowCopy] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [vendorName, setVendorName] = useState('');
    const [vendorFile, setVendorFile] = useState(null);
    const [fromHeading, setFromHeading] = useState('');
    const [toHeading, setToHeading] = useState('');
    const [showRFQ, setShowRFQ] = useState(false);
    const [rfqFile, setRfqFile] = useState(null);
    const [rfqInstructions, setRfqInstructions] = useState('');
    const [replaceWithRfq, setReplaceWithRfq] = useState(true);
    useEffect(() => {
        if (!isOpen)
            return;
        if (proposal) {
            setWorking({ ...proposal, builderSections: cloneSections(proposal.builderSections || []), sourceFiles: [...(proposal.sourceFiles || [])] });
            setSetupName(proposal.documentName);
            setSetupLeadId(proposal.leadId);
            setSetupCategory(proposal.category);
        }
        else {
            setWorking(null);
            setSetupName('');
            setSetupLeadId(initialLeadId || leads[0]?.id || '');
            setSetupCategory('Combined Proposal');
            setTemplateMode(initialMode === 'manual' ? 'standard' : 'blank');
        }
        setMessage('');
        setShowAI(!proposal && initialMode === 'vendor');
        setShowCopy(false);
        setShowRFQ(!proposal && initialMode === 'rfq');
        setVendorFile(null);
        setRfqFile(null);
        setRfqInstructions('');
        setReplaceWithRfq(true);
    }, [isOpen, proposal, initialLeadId, leads, initialMode]);
    const allBuilderProposals = useMemo(() => documentService.getBuilderDocuments().filter(doc => doc.id !== working?.id), [working?.id, isOpen, message]);
    const copySource = allBuilderProposals.find(doc => doc.id === copySourceId);
    const linkedLead = working ? leads.find(l => l.id === working.leadId) : leads.find(l => l.id === setupLeadId);
    const createProposal = () => {
        if (!setupLeadId) {
            setMessage('Select a lead before creating the proposal.');
            return;
        }
        if (!setupName.trim()) {
            setMessage('Enter a proposal name.');
            return;
        }
        const lead = leads.find(l => l.id === setupLeadId);
        const created = documentService.createBuilderProposal({
            leadId: setupLeadId,
            documentName: setupName,
            category: setupCategory,
            clientName: lead?.contactPerson || lead?.leadName,
            companyName: lead?.companyName,
            createdBy: currentUser.name,
            sections: templateMode === 'standard' ? standardProposalSections(lead) : [],
        });
        setWorking(created);
        setMessage('Proposal created. Add sections and blocks below.');
        onSaved?.(created);
    };
    const save = () => {
        if (!working)
            return;
        const saved = documentService.updateBuilderProposal(working.id, {
            leadId: working.leadId,
            documentName: working.documentName,
            category: working.category,
            proposalStatus: working.proposalStatus,
            clientName: working.clientName,
            companyName: working.companyName,
            proposalNumber: working.proposalNumber,
            proposalDate: working.proposalDate,
            preparedForLocation: working.preparedForLocation,
            builderSections: working.builderSections || [],
        }, currentUser.name);
        setWorking(saved);
        setMessage('Proposal saved to the database.');
        onSaved?.(saved);
    };
    const mutateSections = (fn) => {
        if (!working)
            return;
        setWorking({ ...working, builderSections: fn([...(working.builderSections || [])]) });
    };
    const addSection = () => mutateSections(sections => [...sections, { id: uid(), name: `Section ${sections.length + 1}`, blocks: [] }]);
    const updateSection = (sectionId, updater) => {
        mutateSections(sections => sections.map(section => section.id === sectionId ? updater(section) : section));
    };
    const moveSection = (index, direction) => mutateSections(sections => {
        const target = index + direction;
        if (target < 0 || target >= sections.length)
            return sections;
        const next = [...sections];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
    });
    const addBlock = (sectionId, type) => updateSection(sectionId, section => ({ ...section, blocks: [...(section.blocks || []), emptyBlock(type)] }));
    const updateBlock = (sectionId, blockId, updates) => updateSection(sectionId, section => ({
        ...section,
        blocks: section.blocks.map(block => block.id === blockId ? { ...block, ...updates } : block),
    }));
    const moveBlock = (sectionId, index, direction) => updateSection(sectionId, section => {
        const blocks = [...section.blocks];
        const target = index + direction;
        if (target < 0 || target >= blocks.length)
            return section;
        [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
        return { ...section, blocks };
    });
    const removeBlock = (sectionId, blockId) => updateSection(sectionId, section => ({ ...section, blocks: section.blocks.filter(block => block.id !== blockId) }));
    const uploadAsset = async (sectionId, blockId, file, signature = false) => {
        if (!working)
            return;
        setBusy(true);
        setMessage('Uploading image…');
        try {
            const path = await documentService.uploadBuilderAsset(working.id, file);
            updateBlock(sectionId, blockId, signature ? { signatureImagePath: path } : { imagePath: path });
            setMessage('Image uploaded. Save the proposal to persist the block change.');
        }
        catch (error) {
            setMessage(error?.message || 'Unable to upload image.');
        }
        finally {
            setBusy(false);
        }
    };
    const copySelectedSections = () => {
        if (!working || !copySourceId || copySectionIds.length === 0)
            return;
        const updated = documentService.copySections(copySourceId, working.id, copySectionIds, currentUser.name);
        setWorking(updated);
        setCopySectionIds([]);
        setShowCopy(false);
        setMessage('Selected sections copied into this proposal.');
        onSaved?.(updated);
    };
    const generateFromRfq = async () => {
        if (!working)
            return;
        if (!rfqFile) {
            setMessage('Choose the client RFP / RFQ PDF first.');
            return;
        }
        if (rfqFile.size > 30 * 1024 * 1024) {
            setMessage('Please use an RFP / RFQ smaller than 30 MB for inline AI generation.');
            return;
        }
        setBusy(true);
        setMessage('Gemini is reading the RFP / RFQ and building a complete Syskode proposal section by section…');
        try {
            const result = await aiService.createProposalFromRfq({
                file: rfqFile,
                targetProposalName: working.documentName,
                clientName: working.clientName,
                companyName: working.companyName,
                proposalCategory: working.category,
                instructions: rfqInstructions,
            });
            if (!result.sections.length)
                throw new Error('AI did not return proposal sections from this RFP / RFQ.');
            await documentService.addRfqSourceFile(working.id, rfqFile, currentUser.name);
            const refreshed = documentService.getDocumentById(working.id) || working;
            const nextSections = replaceWithRfq ? result.sections : [...(refreshed.builderSections || []), ...result.sections];
            const updated = documentService.updateBuilderProposal(working.id, { builderSections: nextSections }, currentUser.name);
            setWorking(updated);
            const assumptionText = result.assumptions?.length ? ` Assumptions: ${result.assumptions.join('; ')}` : '';
            setMessage(`RFP / RFQ proposal generated with ${result.sections.length} section(s). ${result.notes || ''}${assumptionText}`.trim());
            setRfqFile(null);
            onSaved?.(updated);
        }
        catch (error) {
            setMessage(error?.message || 'Unable to generate proposal from RFP / RFQ.');
        }
        finally {
            setBusy(false);
        }
    };
    const importVendorRange = async () => {
        if (!working)
            return;
        if (!vendorFile || !vendorName.trim()) {
            setMessage('Vendor name and vendor proposal PDF are required.');
            return;
        }
        if (vendorFile.size > 30 * 1024 * 1024) {
            setMessage('Please use a vendor proposal smaller than 30 MB for inline AI extraction.');
            return;
        }
        setBusy(true);
        setMessage(fromHeading.trim() && toHeading.trim() ? 'Gemini is converting the selected vendor proposal range into Syskode sections…' : 'Gemini is reading the full vendor proposal and creating editable Syskode sections…');
        try {
            const result = await aiService.extractVendorProposalSections({
                file: vendorFile,
                vendorName,
                fromHeading,
                toHeading,
                targetProposalName: working.documentName,
                clientName: working.clientName,
                companyName: working.companyName,
            });
            if (!result.sections.length)
                throw new Error('AI did not return proposal sections. If you used heading filters, check the exact heading names and try again.');
            await documentService.addVendorSourceFile(working.id, vendorName, vendorFile, currentUser.name);
            const refreshed = documentService.getDocumentById(working.id) || working;
            const updated = documentService.updateBuilderProposal(working.id, {
                builderSections: [...(refreshed.builderSections || []), ...result.sections],
            }, currentUser.name);
            setWorking(updated);
            setMessage(`${result.sections.length} AI-generated Syskode section(s) imported. ${result.notes || ''}`.trim());
            setVendorFile(null);
            setFromHeading('');
            setToHeading('');
            onSaved?.(updated);
        }
        catch (error) {
            setMessage(error?.message || 'Unable to import vendor proposal section.');
        }
        finally {
            setBusy(false);
        }
    };
    const exportPdf = async () => {
        if (!working)
            return;
        try {
            save();
            await proposalExportService.exportToPdf({ ...working });
            setMessage('Proposal PDF generated successfully.');
        }
        catch (error) {
            setMessage(error?.message || 'Unable to export PDF.');
        }
    };
    return (<Modal isOpen={isOpen} onClose={onClose} title={working ? `Proposal Builder — ${working.documentName}` : 'Create Proposal'} subtitle="Build proposals section by section, reuse content, and export a client-ready PDF." maxWidth="6xl">
      {!working ? (<div className="mx-auto max-w-2xl space-y-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            Create a proposal linked to a lead. After creation you can add sections, headings, paragraphs, bullet points, tables, images and signatures.
          </div>
          <div>
            <label className={labelClass}>Lead *</label>
            <select value={setupLeadId} onChange={e => setSetupLeadId(e.target.value)} className={fieldClass}>
              <option value="">Select lead</option>
              {leads.map(lead => <option key={lead.id} value={lead.id}>{lead.leadId} — {lead.companyName} / {lead.leadName}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Proposal Name *</label>
            <input value={setupName} onChange={e => setSetupName(e.target.value)} className={fieldClass} placeholder="Enter proposal name"/>
          </div>
          <div>
            <label className={labelClass}>Proposal Type</label>
            <select value={setupCategory} onChange={e => setSetupCategory(e.target.value)} className={fieldClass}>
              {CATEGORIES.map(category => <option key={category}>{category}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Starting Template</label>
            <select value={templateMode} onChange={e => setTemplateMode(e.target.value)} className={fieldClass}>
              <option value="standard">Syskode Standard Proposal — recommended</option>
              <option value="blank">Blank Proposal</option>
            </select>
            <p className="mt-1 text-[11px] text-slate-500">The standard template follows the supplied Syskode proposal structure: cover letter, company profile, introduction, deliverables, timeline, pricing, terms, process, QA and acceptance.</p>
          </div>
          {message && <p className="rounded-lg bg-slate-100 p-3 text-sm font-medium text-slate-800">{message}</p>}
          <div className="flex justify-end">
            <button onClick={createProposal} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><FilePlus2 className="h-4 w-4"/>Create & Start Building</button>
          </div>
        </div>) : (<div className="space-y-5">
          <div className="sticky top-0 z-20 -mx-4 -mt-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-500">Linked lead: {linkedLead ? `${linkedLead.leadId} — ${linkedLead.companyName}` : 'Unknown lead'}</p>
                {message && <p className="mt-1 text-xs font-semibold text-blue-700">{message}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowCopy(v => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800"><Copy className="h-4 w-4"/>Copy Sections</button>
                <button onClick={() => setShowRFQ(v => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"><WandSparkles className="h-4 w-4"/>AI from RFP / RFQ</button>
                <button onClick={() => setShowAI(v => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-800"><Sparkles className="h-4 w-4"/>AI Vendor Import</button>
                <button onClick={save} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"><Save className="h-4 w-4"/>Save</button>
                <button onClick={exportPdf} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"><FileDown className="h-4 w-4"/>Export PDF</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2"><label className={labelClass}>Proposal Name</label><input value={working.documentName} onChange={e => setWorking({ ...working, documentName: e.target.value })} className={fieldClass}/></div>
            <div><label className={labelClass}>Linked Lead</label><select value={working.leadId} onChange={e => { const lead = leads.find(l => l.id === e.target.value); setWorking({ ...working, leadId: e.target.value, clientName: lead?.contactPerson || lead?.leadName, companyName: lead?.companyName }); }} className={fieldClass}>{leads.map(lead => <option key={lead.id} value={lead.id}>{lead.companyName}</option>)}</select></div>
            <div><label className={labelClass}>Type</label><select value={working.category} onChange={e => setWorking({ ...working, category: e.target.value })} className={fieldClass}>{CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></div>
            <div><label className={labelClass}>Proposal No.</label><input value={working.proposalNumber || ''} onChange={e => setWorking({ ...working, proposalNumber: e.target.value })} className={fieldClass} placeholder="SYS/PROP/26/0001"/></div>
            <div><label className={labelClass}>Proposal Date</label><input type="date" value={working.proposalDate || ''} onChange={e => setWorking({ ...working, proposalDate: e.target.value })} className={fieldClass}/></div>
            <div><label className={labelClass}>Prepared For Location</label><input value={working.preparedForLocation || ''} onChange={e => setWorking({ ...working, preparedForLocation: e.target.value })} className={fieldClass} placeholder="Kingdom of Bahrain"/></div>
            <div><label className={labelClass}>Status</label><select value={working.proposalStatus || 'Draft'} onChange={e => setWorking({ ...working, proposalStatus: e.target.value })} className={fieldClass}>{['Draft', 'Ready', 'Sent', 'Approved', 'Rejected'].map(status => <option key={status}>{status}</option>)}</select></div>
          </div>

          {showCopy && (<div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
              <div className="flex items-center justify-between"><div><h3 className="text-sm font-black text-cyan-950">Copy sections from another proposal</h3><p className="text-xs text-cyan-800">Select a source proposal, then choose exactly which sections to append.</p></div><button onClick={() => setShowCopy(false)} className="text-xs font-bold text-cyan-800">Close</button></div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[280px_1fr_auto] lg:items-end">
                <div><label className={labelClass}>Source Proposal</label><select value={copySourceId} onChange={e => { setCopySourceId(e.target.value); setCopySectionIds([]); }} className={fieldClass}><option value="">Select proposal</option>{allBuilderProposals.map(doc => <option key={doc.id} value={doc.id}>{doc.documentName}</option>)}</select></div>
                <div className="flex flex-wrap gap-2">{(copySource?.builderSections || []).map(section => <label key={section.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-bold text-slate-800"><input type="checkbox" checked={copySectionIds.includes(section.id)} onChange={e => setCopySectionIds(ids => e.target.checked ? [...ids, section.id] : ids.filter(id => id !== section.id))}/>{section.name}</label>)}</div>
                <button disabled={!copySectionIds.length} onClick={copySelectedSections} className="rounded-lg bg-cyan-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Copy Selected</button>
              </div>
            </div>)}

          {showRFQ && (<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-black text-emerald-950">AI — Create the proposal from an RFP / RFQ</h3><p className="text-xs leading-5 text-emerald-800">Upload the client's RFP / RFQ PDF. Gemini will read the requirements and generate a full editable Syskode proposal using the same section structure as your established proposal format. It will not invent prices when the RFP / RFQ does not contain them.</p></div><button onClick={() => setShowRFQ(false)} className="text-xs font-bold text-emerald-800">Close</button></div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div><label className={labelClass}>RFP / RFQ PDF *</label><input type="file" accept="application/pdf" onChange={e => setRfqFile(e.target.files?.[0] || null)} className={`${fieldClass} file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-bold`}/></div>
                <div><label className={labelClass}>Generation Mode</label><select value={replaceWithRfq ? 'replace' : 'append'} onChange={e => setReplaceWithRfq(e.target.value === 'replace')} className={fieldClass}><option value="replace">Replace current sections with RFP / RFQ proposal</option><option value="append">Append RFP / RFQ sections to current proposal</option></select></div>
                <div className="lg:col-span-2"><label className={labelClass}>Additional Instructions (optional)</label><textarea value={rfqInstructions} onChange={e => setRfqInstructions(e.target.value)} className={`${fieldClass} min-h-24 resize-y`} placeholder="Example: Keep the proposal technical only; include a compliance matrix; do not include AMC pricing."/></div>
              </div>
              <button disabled={busy || !rfqFile} onClick={generateFromRfq} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <WandSparkles className="h-4 w-4"/>}Generate Full Proposal from RFP / RFQ</button>
              {!!working.sourceFiles?.filter(source => source.sourceKind === 'rfq').length && <div className="mt-3 flex flex-wrap gap-2">{working.sourceFiles?.filter(source => source.sourceKind === 'rfq').map(source => <span key={source.id} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-bold text-emerald-900 ring-1 ring-emerald-200"><FileText className="h-3 w-3"/>RFP / RFQ: {source.fileName}</span>)}</div>}
            </div>)}

          {showAI && (<div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-black text-violet-950">AI — Create from a vendor / competitor proposal</h3><p className="text-xs leading-5 text-violet-800">Upload a vendor proposal and Gemini can convert the full document into editable Syskode sections. Optionally enter a first and last heading to use only a specific range. Competitor identity is rewritten as Syskode while client and third-party names are preserved.</p></div><button onClick={() => setShowAI(false)} className="text-xs font-bold text-violet-800">Close</button></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div><label className={labelClass}>Vendor / Competitor Name *</label><input value={vendorName} onChange={e => setVendorName(e.target.value)} className={fieldClass} placeholder="Vendor name"/></div>
                <div><label className={labelClass}>Vendor Proposal PDF *</label><input type="file" accept="application/pdf,text/plain,text/markdown" onChange={e => setVendorFile(e.target.files?.[0] || null)} className={`${fieldClass} file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-bold`}/></div>
                <div><label className={labelClass}>Copy From Heading (optional)</label><input value={fromHeading} onChange={e => setFromHeading(e.target.value)} className={fieldClass} placeholder="e.g. Scope of Work"/></div>
                <div><label className={labelClass}>Copy Until Heading (optional)</label><input value={toHeading} onChange={e => setToHeading(e.target.value)} className={fieldClass} placeholder="e.g. Commercial Terms"/></div>
              </div>
              <button disabled={busy} onClick={importVendorRange} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}Analyze & Create Syskode Sections</button>
              {!!working.sourceFiles?.filter(source => source.sourceKind !== 'rfq').length && <div className="mt-3 flex flex-wrap gap-2">{working.sourceFiles?.filter(source => source.sourceKind !== 'rfq').map(source => <span key={source.id} className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-violet-900 ring-1 ring-violet-200">{source.vendorName || 'Vendor'}: {source.fileName}</span>)}</div>}
            </div>)}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,.75fr)]">
            <div className="min-w-0 space-y-4">
              {(working.builderSections || []).length === 0 && (<div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <FilePlus2 className="mx-auto h-9 w-9 text-slate-400"/>
                  <h3 className="mt-3 text-sm font-black text-slate-900">Start your proposal</h3>
                  <p className="mt-1 text-xs text-slate-500">Add a section, then insert headings, subheadings, paragraphs, bullet points, tables, images or signatures.</p>
                  <button onClick={addSection} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white">+ Add First Section</button>
                </div>)}

              {(working.builderSections || []).map((section, sectionIndex) => (<div key={section.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                    <div className="flex-1"><label className="sr-only">Section Name</label><input value={section.name} onChange={e => updateSection(section.id, current => ({ ...current, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-black"/></div>
                    <div className="flex gap-1"><button onClick={() => moveSection(sectionIndex, -1)} className="rounded-lg border bg-white p-2 text-slate-700"><ArrowUp className="h-4 w-4"/></button><button onClick={() => moveSection(sectionIndex, 1)} className="rounded-lg border bg-white p-2 text-slate-700"><ArrowDown className="h-4 w-4"/></button><button onClick={() => mutateSections(sections => sections.filter(s => s.id !== section.id))} className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700"><Trash2 className="h-4 w-4"/></button></div>
                  </div>

                  <div className="space-y-3 p-3 sm:p-4">
                    {section.blocks.map((block, blockIndex) => (<div key={block.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="rounded-md bg-slate-200 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">{block.type}</span>
                          <div className="flex gap-1"><button onClick={() => moveBlock(section.id, blockIndex, -1)} className="rounded border bg-white p-1.5 text-slate-600"><ArrowUp className="h-3.5 w-3.5"/></button><button onClick={() => moveBlock(section.id, blockIndex, 1)} className="rounded border bg-white p-1.5 text-slate-600"><ArrowDown className="h-3.5 w-3.5"/></button><button onClick={() => removeBlock(section.id, block.id)} className="rounded border border-rose-200 bg-white p-1.5 text-rose-600"><Trash2 className="h-3.5 w-3.5"/></button></div>
                        </div>

                        {(block.type === 'heading' || block.type === 'subheading') && <input value={block.text || ''} onChange={e => updateBlock(section.id, block.id, { text: e.target.value })} className={fieldClass} placeholder={block.type === 'heading' ? 'Heading' : 'Subheading'}/>}
                        {block.type === 'paragraph' && <textarea value={block.text || ''} onChange={e => updateBlock(section.id, block.id, { text: e.target.value })} className={`${fieldClass} min-h-28 resize-y`} placeholder="Write proposal paragraph…"/>}
                        {block.type === 'points' && <div><label className={labelClass}>Bullet Points — one per line</label><textarea value={(block.points || []).join('\n')} onChange={e => updateBlock(section.id, block.id, { points: e.target.value.split('\n') })} className={`${fieldClass} min-h-28 resize-y`} placeholder={'Point one\nPoint two\nPoint three'}/></div>}
                        {block.type === 'table' && <TableBlockEditor block={block} onChange={updates => updateBlock(section.id, block.id, updates)}/>}
                        {block.type === 'image' && <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass}>Image</label><input type="file" accept="image/*" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file)
                    uploadAsset(section.id, block.id, file); }} className={fieldClass}/></div><div><label className={labelClass}>Caption / Alt Text</label><input value={block.imageAlt || ''} onChange={e => updateBlock(section.id, block.id, { imageAlt: e.target.value })} className={fieldClass} placeholder="Image caption"/></div>{block.imagePath && <div className="sm:col-span-2"><SignedAsset path={block.imagePath} alt={block.imageAlt} className="max-h-48 rounded-lg object-contain"/></div>}</div>}
                        {block.type === 'signature' && <div className="grid gap-3 sm:grid-cols-2"><div><label className={labelClass}>Signatory Name</label><input value={block.signatoryName || ''} onChange={e => updateBlock(section.id, block.id, { signatoryName: e.target.value })} className={fieldClass} placeholder="Name"/></div><div><label className={labelClass}>Title</label><input value={block.signatoryTitle || ''} onChange={e => updateBlock(section.id, block.id, { signatoryTitle: e.target.value })} className={fieldClass} placeholder="Managing Director"/></div><div className="sm:col-span-2"><label className={labelClass}>Signature Image (optional)</label><input type="file" accept="image/*" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file)
                    uploadAsset(section.id, block.id, file, true); }} className={fieldClass}/></div>{block.signatureImagePath && <SignedAsset path={block.signatureImagePath} alt="Signature" className="max-h-20 max-w-48 object-contain"/>}</div>}
                      </div>))}

                    <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2">
                      <span className="w-full text-[10px] font-black uppercase tracking-wide text-slate-500 sm:w-auto sm:self-center">Insert:</span>
                      <button onClick={() => addBlock(section.id, 'heading')} className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 ring-1 ring-slate-200"><Heading1 className="h-3.5 w-3.5"/>Heading</button>
                      <button onClick={() => addBlock(section.id, 'subheading')} className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 ring-1 ring-slate-200"><Heading2 className="h-3.5 w-3.5"/>Subheading</button>
                      <button onClick={() => addBlock(section.id, 'paragraph')} className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 ring-1 ring-slate-200"><Bold className="h-3.5 w-3.5"/>Paragraph</button>
                      <button onClick={() => addBlock(section.id, 'points')} className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 ring-1 ring-slate-200"><List className="h-3.5 w-3.5"/>Points</button>
                      <button onClick={() => addBlock(section.id, 'table')} className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 ring-1 ring-slate-200"><Table2 className="h-3.5 w-3.5"/>Table</button>
                      <button onClick={() => addBlock(section.id, 'image')} className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 ring-1 ring-slate-200"><ImageIcon className="h-3.5 w-3.5"/>Image</button>
                      <button onClick={() => addBlock(section.id, 'signature')} className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 ring-1 ring-slate-200"><PenLine className="h-3.5 w-3.5"/>Signature</button>
                    </div>
                  </div>
                </div>))}

              {!!working.builderSections?.length && <button onClick={addSection} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 py-3 text-xs font-black text-blue-700 hover:bg-blue-100"><Plus className="h-4 w-4"/>Add New Section</button>}
            </div>

            <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
              <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Live Preview</h3><span className="text-[10px] text-slate-400">A4-style preview</span></div>
              <ProposalPreview proposal={working}/>
            </div>
          </div>
        </div>)}
    </Modal>);
};
