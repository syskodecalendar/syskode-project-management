import React, { useState } from 'react';
import { ProgressStepBar } from '../common/ProgressStepBar';
import { Tabs } from '../common/Tabs';
import { Badge } from '../common/Badge';
import { Building2, Phone, Mail, User, Calendar, FileText, Sparkles, ArrowLeft, Plus, Clock, Upload, Check, Trash2 } from 'lucide-react';
import { meetingService } from '../../services/meetingService';
import { documentService } from '../../services/documentService';
import { pricingService } from '../../services/pricingService';
import { commentService } from '../../services/commentService';
import { activityService } from '../../services/activityService';
import { AISummaryModal } from '../proposals/AISummaryModal';
import { AICompareModal } from '../proposals/AICompareModal';
import { hasPermission } from '../../services/permissionService';
import { projectService } from '../../services/projectService';
export const LeadWorkspace = ({ lead, onBack, onScheduleMeeting, onRecordMinutes, onUploadProposal, onCreateProposal, onEditProposal, onConvertLead, onRefreshLead, currentUser }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const canManageLeads = hasPermission(currentUser, 'manage_leads');
    const canManageMeetings = hasPermission(currentUser, 'manage_meetings');
    const canManageProposals = hasPermission(currentUser, 'manage_proposals');
    const canDeleteProposals = hasPermission(currentUser, 'delete_proposals');
    const canManageProjects = hasPermission(currentUser, 'manage_projects');
    // AI Modal States
    const [isAISummaryOpen, setIsAISummaryOpen] = useState(false);
    const [isAICompareOpen, setIsAICompareOpen] = useState(false);
    // New Pricing State
    const [devPrice, setDevPrice] = useState('');
    const [hostingPrice, setHostingPrice] = useState('');
    const [supportPrice, setSupportPrice] = useState('');
    const [amcPrice, setAmcPrice] = useState('');
    const [vendorName, setVendorName] = useState('');
    const [vendorPrice, setVendorPrice] = useState('');
    // New Comment
    const [commentText, setCommentText] = useState('');
    // Data fetching
    const meetings = meetingService.getMeetingsByLead(lead.id);
    const proposals = documentService.getDocumentsByLead(lead.id);
    const syskodePricing = pricingService.getSyskodePricingByLead(lead.id);
    const vendors = pricingService.getVendorsByLead(lead.id);
    const comments = commentService.getComments('lead', lead.id);
    const activities = activityService.getActivities().filter(a => a.relatedRecordId === lead.id);
    const convertedProject = lead.convertedProjectId ? projectService.getProjectById(lead.convertedProjectId) : undefined;
    const tabs = [
        { id: 'overview', label: 'Overview & Requirements' },
        { id: 'meetings', label: 'Meetings & Minutes', badge: meetings.length },
        { id: 'proposals', label: 'Proposal Documents', badge: proposals.length },
        { id: 'pricing', label: 'Syskode Commercials' },
        { id: 'competitors', label: 'Competitor Comparison', badge: vendors.length },
        { id: 'activity', label: 'Comments & Audit Trail', badge: comments.length }
    ];
    const calculateStage = () => {
        if (convertedProject) {
            if (convertedProject.projectStatus === 'Completed' || convertedProject.progressPercentage >= 100)
                return 'Completed';
            if (convertedProject.projectStatus === 'Internal Testing' || convertedProject.projectStatus === 'Client UAT')
                return 'QA';
            return 'Project';
        }
        if (lead.status === 'Won')
            return 'Won';
        if (lead.status === 'Negotiation')
            return 'Negotiation';
        if (proposals.length > 0 || lead.status.includes('Proposal'))
            return 'Proposal';
        if (meetings.length > 0 || lead.status.includes('Meeting'))
            return 'Meeting';
        return 'Lead';
    };
    const handleAddPricing = (e) => {
        e.preventDefault();
        pricingService.createSyskodePricing({
            leadId: lead.id,
            version: `V${pricingService.getAllSyskodePricingsByLead(lead.id).length + 1}.0`,
            currency: 'BHD',
            developmentPrice: Number(devPrice) || 0,
            hostingPrice: Number(hostingPrice) || 0,
            supportPrice: Number(supportPrice) || 0,
            amcPrice: Number(amcPrice) || 0,
            otherCharges: 0,
            discount: 0,
            vatPercentage: 10,
            uploadedBy: currentUser?.name || 'User',
            notes: ''
        });
        onRefreshLead();
    };
    const handleAddVendor = (e) => {
        e.preventDefault();
        if (!vendorName || !vendorPrice)
            return;
        const vendor = pricingService.addVendor(lead.id, vendorName);
        pricingService.addVendorPricing(vendor.id, Number(vendorPrice), Number(vendorPrice));
        setVendorName('');
        onRefreshLead();
    };
    const handleAddComment = (e) => {
        e.preventDefault();
        if (!commentText.trim())
            return;
        commentService.addComment('lead', lead.id, currentUser?.name || 'User', currentUser?.role || 'User', commentText);
        setCommentText('');
        onRefreshLead();
    };
    return (<div className="space-y-5">
      {/* Back & Action Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors dark:hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5"/>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {lead.leadId}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {lead.leadName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lead.companyName} • {lead.serviceInterested} • Est. Value: BHD {(lead.estimatedProjectValue || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageMeetings && <button onClick={onScheduleMeeting} className="flex items-center space-x-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300">
            <Calendar className="h-4 w-4"/>
            <span>Schedule Meeting</span>
          </button>}

          {canManageProposals && <button onClick={onCreateProposal} className="flex items-center space-x-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4"/>
            <span>Create Proposal</span>
          </button>}

          {canManageProposals && <button onClick={onUploadProposal} className="flex items-center space-x-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300">
            <Upload className="h-4 w-4"/>
            <span>Upload Existing</span>
          </button>}

          {proposals.some(d => d.sourceType !== 'builder') && (<button onClick={() => setIsAISummaryOpen(true)} className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700">
              <Sparkles className="h-4 w-4"/>
              <span>Summarize with Gemini</span>
            </button>)}

          {canManageProjects && canManageLeads && lead.status === 'Won' && !lead.convertedProjectId && (<button onClick={onConvertLead} className="flex items-center space-x-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700">
              <Check className="h-4 w-4"/>
              <span>Convert to Project</span>
            </button>)}
        </div>
      </div>

      {/* Progress Step Bar */}
      <ProgressStepBar currentStage={calculateStage()}/>

      {/* Tab Nav */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}/>

      {/* Tab Contents */}
      {activeTab === 'overview' && (<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Lead Overview & Requirements
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {lead.notes || 'No custom client notes added.'}
              </p>

              {lead.customStatus && (<div className="mt-4 rounded-lg bg-blue-50 p-3 border border-blue-100 dark:bg-blue-950/40 dark:border-blue-900">
                  <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block mb-1">
                    Custom Sub-Status Remark:
                  </span>
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    {lead.customStatus}
                  </p>
                </div>)}
            </div>

            {/* Next Action Box */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-800/80 dark:bg-amber-950/20">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-1 flex items-center">
                <Clock className="h-4 w-4 mr-1.5"/> Next Scheduled Action
              </h3>
              {lead.nextAction ? (<div className="mt-2 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-semibold text-sm">{lead.nextAction.action}</p>
                  <p>Due Date: <strong>{lead.nextAction.dueDate}</strong> • Responsible: <strong>{lead.nextAction.responsiblePerson}</strong></p>
                </div>) : (<p className="mt-2 text-xs text-amber-800 dark:text-amber-300">
                  Next follow-up date: <strong>{lead.nextFollowUpDate || 'Not specified'}</strong>
                </p>)}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Client Contact Info
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300">
                  <Building2 className="h-4 w-4 text-slate-400"/>
                  <span>{lead.companyName}</span>
                </div>
                <div className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300">
                  <User className="h-4 w-4 text-slate-400"/>
                  <span>{lead.contactPerson}</span>
                </div>
                <div className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300">
                  <Mail className="h-4 w-4 text-slate-400"/>
                  <span>{lead.email}</span>
                </div>
                <div className="flex items-center space-x-2.5 text-slate-700 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-slate-400"/>
                  <span>{lead.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>)}

      {activeTab === 'meetings' && (<div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Scheduled Meetings & Recorded Minutes
            </h3>
            {canManageMeetings && <button onClick={onScheduleMeeting} className="flex items-center space-x-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
              <Plus className="h-4 w-4"/>
              <span>Schedule New Meeting</span>
            </button>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map(m => (<div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      {m.meetingType} ({m.platform || m.location})
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                      {m.purpose}
                    </h4>
                  </div>
                  <Badge variant={m.status === 'Completed' ? 'green' : 'amber'}>
                    {m.status}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Date: <strong>{m.date}</strong> at <strong>{m.time}</strong> • Host: <strong>{m.salesperson}</strong>
                </p>

                {m.agenda && (<div className="rounded bg-slate-50 p-2.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <strong>Agenda:</strong> {m.agenda}
                  </div>)}

                {m.minutes ? (<div className="rounded bg-emerald-50/70 p-3 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
                    <p className="font-bold mb-1">Minutes Recorded:</p>
                    <p>Requirements: {m.minutes.requirementsDiscussed}</p>
                    {m.minutes.nextAction && <p>Next Action: {m.minutes.nextAction}</p>}
                  </div>) : canManageMeetings ? (<button onClick={() => onRecordMinutes(m)} className="w-full rounded-lg border border-purple-300 bg-purple-50 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300">
                    + Record Meeting Minutes
                  </button>) : null}
              </div>))}
          </div>
        </div>)}

      {activeTab === 'proposals' && (<div className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Proposal Documents & Builder
            </h3>
            {canManageProposals && <div className="flex flex-wrap gap-2">
              <button onClick={onCreateProposal} className="flex items-center space-x-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"><Plus className="h-4 w-4"/><span>Create Proposal</span></button>
              <button onClick={onUploadProposal} className="flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"><Upload className="h-4 w-4"/><span>Upload Existing</span></button>
            </div>}
          </div>

          <div className="space-y-3">
            {proposals.map(doc => (<div key={doc.id} className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    <FileText className="h-5 w-5"/>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {doc.documentName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {doc.sourceType === 'builder' ? `Editable Builder • ${doc.builderSections?.length || 0} Sections • ${doc.proposalStatus || 'Draft'}` : `Category: ${doc.category} • Total Versions: ${doc.versions.length}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {doc.sourceType === 'builder' && canManageProposals && <button onClick={() => onEditProposal(doc)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">Edit Builder</button>}
                  {doc.sourceType !== 'builder' && <button onClick={() => setIsAISummaryOpen(true)} className="flex items-center space-x-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs"><Sparkles className="h-3.5 w-3.5"/><span>Summarize Document</span></button>}
                  {canDeleteProposals && <button onClick={() => { if (window.confirm(`Delete proposal ${doc.documentName}?`)) {
                documentService.deleteDocument(doc.id);
                onRefreshLead();
            } }} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Delete proposal"><Trash2 className="h-4 w-4"/></button>}
                </div>
              </div>))}
          </div>
        </div>)}

      {activeTab === 'pricing' && (<div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Active Syskode Commercial Pricing
            </h3>
            {syskodePricing ? (<div className="relative grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                {canDeleteProposals && <button onClick={() => { if (window.confirm('Delete the active Syskode pricing record?')) {
                pricingService.deleteSyskodePricing(syskodePricing.id);
                onRefreshLead();
            } }} className="absolute right-2 top-2 rounded-lg p-1.5 text-rose-600 hover:bg-rose-50" title="Delete pricing"><Trash2 className="h-4 w-4"/></button>}
                <div>
                  <span className="text-slate-500">Development:</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">BHD {syskodePricing.developmentPrice.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-500">Hosting & Domain:</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">BHD {syskodePricing.hostingPrice.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-500">12M Support & AMC:</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">BHD {(syskodePricing.supportPrice + syskodePricing.amcPrice).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-500">Final Total (Inc 10% VAT):</span>
                  <p className="font-black text-emerald-600 dark:text-emerald-400 text-base">BHD {syskodePricing.finalAmount.toLocaleString()}</p>
                </div>
              </div>) : canManageProposals ? (<form onSubmit={handleAddPricing} className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Dev Price (BHD)</label>
                    <input type="number" value={devPrice} onChange={e => setDevPrice(e.target.value)} className="w-full rounded-lg border p-2 text-xs dark:bg-slate-800 dark:text-white"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Hosting (BHD)</label>
                    <input type="number" value={hostingPrice} onChange={e => setHostingPrice(e.target.value)} className="w-full rounded-lg border p-2 text-xs dark:bg-slate-800 dark:text-white"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Support (BHD)</label>
                    <input type="number" value={supportPrice} onChange={e => setSupportPrice(e.target.value)} className="w-full rounded-lg border p-2 text-xs dark:bg-slate-800 dark:text-white"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">AMC (BHD)</label>
                    <input type="number" value={amcPrice} onChange={e => setAmcPrice(e.target.value)} className="w-full rounded-lg border p-2 text-xs dark:bg-slate-800 dark:text-white"/>
                  </div>
                </div>
                <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white sm:w-auto">Save Pricing Draft</button>
              </form>) : <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">No pricing has been added yet.</p>}
          </div>
        </div>)}

      {activeTab === 'competitors' && (<div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Competitor & Vendor Proposal Matrix
            </h3>
            {vendors.length > 0 && (<button onClick={() => setIsAICompareOpen(true)} className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md">
                <Sparkles className="h-4 w-4"/>
                <span>Compare Competitors with Gemini</span>
              </button>)}
          </div>

          {canManageProposals && <form onSubmit={handleAddVendor} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:bg-slate-900 dark:border-slate-800 sm:flex-row">
            <input type="text" placeholder="Competitor / Vendor Name" value={vendorName} onChange={e => setVendorName(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white"/>
            <input type="number" placeholder="Quoted Price (BHD)" value={vendorPrice} onChange={e => setVendorPrice(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:bg-slate-800 dark:text-white sm:w-36"/>
            <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white sm:w-auto">Add Vendor</button>
          </form>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendors.map(v => (<div key={v.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-2">
                <div className="flex items-start justify-between"><h4 className="font-bold text-slate-900 dark:text-white text-sm">{v.vendorName}</h4>{canDeleteProposals && <button onClick={() => { if (window.confirm(`Delete vendor ${v.vendorName}?`)) {
                pricingService.deleteVendor(v.id);
                onRefreshLead();
            } }} className="rounded p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4"/></button>}</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Quoted Final Price: <strong>BHD {(v.pricings[0]?.finalPrice || 0).toLocaleString()}</strong>
                </p>
              </div>))}
          </div>
        </div>)}

      {activeTab === 'activity' && (<div className="space-y-4">
          {canManageLeads && <form onSubmit={handleAddComment} className="flex flex-col gap-2 sm:flex-row">
            <input type="text" placeholder="Add internal comment or mention a team member..." value={commentText} onChange={e => setCommentText(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs dark:bg-slate-800 dark:text-white"/>
            <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white sm:w-auto">Post Comment</button>
          </form>}

          <div className="space-y-3">
            {comments.map(c => (<div key={c.id} className="p-3 rounded-lg border border-slate-200 bg-white text-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex justify-between text-slate-500 font-bold mb-1">
                  <span>{c.userName} ({c.userRole})</span>
                  <span className="flex items-center gap-2">{c.createdAt}{canManageLeads && <button onClick={() => { if (window.confirm('Delete this comment?')) {
                commentService.deleteComment(c.id);
                onRefreshLead();
            } }} className="rounded p-1 text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5"/></button>}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200">{c.content}</p>
              </div>))}
          </div>
        </div>)}

      {/* AI Summary Modal */}
      <AISummaryModal isOpen={isAISummaryOpen} onClose={() => setIsAISummaryOpen(false)} leadName={lead.leadName} documentName="Commercial Technical Proposal.pdf"/>

      {/* AI Compare Modal */}
      <AICompareModal isOpen={isAICompareOpen} onClose={() => setIsAICompareOpen(false)} syskodePricing={syskodePricing} competitors={vendors}/>
    </div>);
};
