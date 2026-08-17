import React, { useState } from 'react';
import { hasPermission } from '../../services/permissionService';
import { Badge } from '../common/Badge';
import { Search, Plus, Calendar, FileText, Briefcase, Edit, Eye, Clock, Trash2 } from 'lucide-react';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';
export const LeadsTable = ({ leads, onSelectLead, onEditLead, onScheduleMeeting, onUploadProposal, onConvertLead, onCreateLead, onDeleteLead, currentUser }) => {
    const canManageLeads = hasPermission(currentUser, 'manage_leads');
    const canManageMeetings = hasPermission(currentUser, 'manage_meetings');
    const canManageProposals = hasPermission(currentUser, 'manage_proposals');
    const canManageProjects = hasPermission(currentUser, 'manage_projects');
    const canDeleteLeads = hasPermission(currentUser, 'delete_leads');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [salesFilter, setSalesFilter] = useState('All');
    const salespeople = [...new Set(leads.map(l => l.assignedSalesperson).filter(Boolean))].sort();
    const filteredLeads = leads.filter(l => {
        const matchesSearch = l.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.leadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
        const matchesSales = salesFilter === 'All' || l.assignedSalesperson === salesFilter;
        return matchesSearch && matchesStatus && matchesSales;
    });
    const getStatusBadge = (status) => {
        switch (status) {
            case 'New Lead':
                return <Badge variant="blue">New Lead</Badge>;
            case 'Contacted':
                return <Badge variant="cyan">Contacted</Badge>;
            case 'Follow-up Required':
                return <Badge variant="amber">Follow-up Required</Badge>;
            case 'Meeting Scheduled':
            case 'Meeting Completed':
                return <Badge variant="purple">{status}</Badge>;
            case 'Proposal Sent':
            case 'Proposal Preparing':
                return <Badge variant="indigo">{status}</Badge>;
            case 'Negotiation':
                return <Badge variant="amber">Negotiation</Badge>;
            case 'Won':
                return <Badge variant="green">Won (Converted)</Badge>;
            case 'Lost':
                return <Badge variant="red">Lost</Badge>;
            default:
                return <Badge variant="gray">{status}</Badge>;
        }
    };
    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'Critical':
                return <Badge variant="red" size="sm">Critical</Badge>;
            case 'High':
                return <Badge variant="amber" size="sm">High</Badge>;
            case 'Medium':
                return <Badge variant="blue" size="sm">Medium</Badge>;
            default:
                return <Badge variant="gray" size="sm">Low</Badge>;
        }
    };
    return (<div className="space-y-4">
      {/* Search & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-1 flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative min-w-0 basis-full sm:flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/>
            <input type="text" placeholder="Search by Lead ID, Company, Title, or Contact..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>

          {/* Status Filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full sm:w-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <option value="All">All Statuses</option>
            <option value="New Lead">New Lead</option>
            <option value="Contacted">Contacted</option>
            <option value="Follow-up Required">Follow-up Required</option>
            <option value="Meeting Scheduled">Meeting Scheduled</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Salesperson Filter */}
          <select value={salesFilter} onChange={e => setSalesFilter(e.target.value)} className="w-full sm:w-auto rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <option value="All">All Sales Reps</option>
            {salespeople.map(person => <option key={person} value={person}>{person}</option>)}
          </select>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <ExcelExportButton label="Export Leads" onClick={() => excelExportService.exportRows(
            `syskode-leads-${new Date().toISOString().slice(0, 10)}`,
            'Leads',
            filteredLeads.map(lead => ({
              Lead_ID: lead.leadId, Lead: lead.leadName, Company: lead.companyName, Contact: lead.contactPerson,
              Email: lead.email || '', Phone: lead.phone || '', Service: lead.serviceInterested || '',
              Status: lead.status, Priority: lead.priority, Salesperson: lead.assignedSalesperson || '',
              Estimated_Value_BHD: Number(lead.estimatedProjectValue) || 0, Next_Follow_Up: lead.nextFollowUpDate || '',
              Lost_Stage: lead.lossStage || lead.lostStage || '', Lost_Reason: lead.lossReason || lead.lostReason || ''
            }))
          )}/>
          {canManageLeads && (<button onClick={onCreateLead} className="flex w-full sm:w-auto items-center justify-center space-x-1.5 rounded-lg bg-[#0788C9] px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#066fa5] transition-colors shrink-0">
              <Plus className="h-4 w-4"/>
              <span>Add Lead</span>
            </button>)}
        </div>
      </div>

      {/* Mobile lead cards */}
      <div className="space-y-3 md:hidden">
        {filteredLeads.length === 0 ? (<div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No leads match your filter parameters.</div>) : filteredLeads.map(lead => (<div key={lead.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => onSelectLead(lead)} className="min-w-0 text-left">
                <span className="block font-mono text-[10px] font-bold text-blue-600">{lead.leadId}</span>
                <span className="mt-0.5 block break-words text-sm font-bold text-slate-900">{lead.leadName}</span>
                <span className="mt-1 block text-xs font-semibold text-slate-700">{lead.companyName}</span>
              </button>
              <div className="shrink-0">{getStatusBadge(lead.status)}</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
              <div><p className="text-[10px] font-bold uppercase text-slate-400">Contact</p><p className="mt-0.5 break-words">{lead.contactPerson}</p><p className="break-all">{lead.phone}</p></div>
              <div><p className="text-[10px] font-bold uppercase text-slate-400">Value</p><p className="mt-0.5 font-bold text-emerald-600">{lead.currency} {(lead.estimatedProjectValue || 0).toLocaleString()}</p><div className="mt-1">{getPriorityBadge(lead.priority)}</div></div>
              <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-slate-400">Service / Owner</p><p className="mt-0.5">{lead.serviceInterested} • {lead.assignedSalesperson}</p></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <button onClick={() => onSelectLead(lead)} className="rounded-lg border border-slate-200 p-2 text-slate-600" title="Open Lead"><Eye className="h-4 w-4"/></button>
              {canManageMeetings && <button onClick={() => onScheduleMeeting(lead)} className="rounded-lg border border-purple-200 p-2 text-purple-600" title="Schedule Meeting"><Calendar className="h-4 w-4"/></button>}
              {canManageProposals && <button onClick={() => onUploadProposal(lead)} className="rounded-lg border border-blue-200 p-2 text-blue-600" title="Upload Proposal"><FileText className="h-4 w-4"/></button>}
              {canManageProjects && lead.status === 'Won' && !lead.convertedProjectId && <button onClick={() => onConvertLead(lead)} className="rounded-lg border border-emerald-200 p-2 text-emerald-600" title="Convert to Project"><Briefcase className="h-4 w-4"/></button>}
              {canManageLeads && <button onClick={() => onEditLead(lead)} className="rounded-lg border border-slate-200 p-2 text-slate-600" title="Edit Lead"><Edit className="h-4 w-4"/></button>}
              {canDeleteLeads && <button onClick={() => onDeleteLead(lead)} className="ml-auto rounded-lg border border-rose-200 p-2 text-rose-600" title="Delete Lead"><Trash2 className="h-4 w-4"/></button>}
            </div>
          </div>))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs md:block dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-400 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Lead ID & Title</th>
              <th className="py-3.5 px-4">Company & Contact</th>
              <th className="py-3.5 px-4">Service & Value</th>
              <th className="py-3.5 px-4">Status & Priority</th>
              <th className="py-3.5 px-4">Next Action / Follow-up</th>
              <th className="py-3.5 px-4">Sales Rep</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLeads.length === 0 ? (<tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No leads match your filter parameters.
                </td>
              </tr>) : (filteredLeads.map(lead => (<tr key={lead.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4">
                    <div onClick={() => onSelectLead(lead)} className="cursor-pointer group">
                      <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 block">
                        {lead.leadId}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-blue-600 transition-colors">
                        {lead.leadName}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {lead.companyName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {lead.contactPerson} ({lead.phone})
                    </p>
                  </td>

                  <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {lead.serviceInterested}
                    </p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      {lead.currency} {(lead.estimatedProjectValue || 0).toLocaleString()}
                    </p>
                  </td>

                  <td className="py-3.5 px-4 space-y-1">
                    <div>{getStatusBadge(lead.status)}</div>
                    <div>{getPriorityBadge(lead.priority)}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    {lead.nextAction ? (<div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {lead.nextAction.action}
                        </p>
                        <p className="text-[10px] text-amber-600 font-medium flex items-center mt-0.5">
                          <Clock className="h-3 w-3 mr-1"/>
                          Due: {lead.nextAction.dueDate} ({lead.nextAction.responsiblePerson})
                        </p>
                      </div>) : (<span className="text-slate-400 text-[11px]">
                        Follow-up: {lead.nextFollowUpDate || 'None'}
                      </span>)}
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                    {lead.assignedSalesperson}
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button onClick={() => onSelectLead(lead)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200" title="Open Lead Workspace">
                      <Eye className="h-4 w-4"/>
                    </button>
                    {canManageMeetings && <button onClick={() => onScheduleMeeting(lead)} className="rounded p-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950" title="Schedule Meeting">
                      <Calendar className="h-4 w-4"/>
                    </button>}
                    {canManageProposals && <button onClick={() => onUploadProposal(lead)} className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950" title="Upload Proposal">
                      <FileText className="h-4 w-4"/>
                    </button>}
                    {canManageProjects && lead.status === 'Won' && !lead.convertedProjectId && (<button onClick={() => onConvertLead(lead)} className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" title="Convert to Active Project">
                        <Briefcase className="h-4 w-4"/>
                      </button>)}
                    {canManageLeads && <button onClick={() => onEditLead(lead)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" title="Edit Lead">
                      <Edit className="h-4 w-4"/>
                    </button>}
                    {canDeleteLeads && <button onClick={() => onDeleteLead(lead)} className="rounded p-1 text-rose-600 hover:bg-rose-50" title="Delete Lead"><Trash2 className="h-4 w-4"/></button>}
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
};
