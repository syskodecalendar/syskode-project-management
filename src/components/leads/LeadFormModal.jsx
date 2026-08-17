import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { authService } from '../../services/authService';
export const LeadFormModal = ({ isOpen, onClose, lead, onSave }) => {
    const salesUsers = authService.getAllProfiles().filter(u => u.status !== 'Inactive' && ['Admin', 'Management', 'Sales'].includes(u.role));
    const [formData, setFormData] = useState({
        leadName: '',
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        whatsApp: '',
        country: '',
        leadSource: '',
        industry: '',
        serviceInterested: '',
        estimatedProjectValue: 0,
        currency: 'BHD',
        assignedSalesperson: '',
        priority: 'High',
        status: 'New Lead',
        customStatus: '',
        lossStage: '',
        lossReason: '',
        notes: ''
    });
    useEffect(() => {
        if (lead) {
            setFormData({
                leadName: lead.leadName || '',
                companyName: lead.companyName || '',
                contactPerson: lead.contactPerson || '',
                email: lead.email || '',
                phone: lead.phone || '',
                whatsApp: lead.whatsApp || '',
                country: lead.country || '',
                leadSource: lead.leadSource || '',
                industry: lead.industry || '',
                serviceInterested: lead.serviceInterested || '',
                estimatedProjectValue: lead.estimatedProjectValue || 0,
                currency: lead.currency || 'BHD',
                assignedSalesperson: lead.assignedSalesperson || '',
                priority: lead.priority || 'High',
                status: lead.status || 'New Lead',
                customStatus: lead.customStatus || '',
                lossStage: lead.lossStage || lead.lostStage || '',
                lossReason: lead.lossReason || lead.lostReason || '',
                notes: lead.notes || ''
            });
        }
        else {
            setFormData({
                leadName: '',
                companyName: '',
                contactPerson: '',
                email: '',
                phone: '',
                whatsApp: '',
                country: '',
                leadSource: '',
                industry: '',
                serviceInterested: '',
                estimatedProjectValue: 0,
                currency: 'BHD',
                assignedSalesperson: '',
                priority: 'High',
                status: 'New Lead',
                customStatus: '',
                lossStage: '',
                lossReason: '',
                notes: ''
            });
        }
    }, [lead, isOpen]);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };
    return (<Modal isOpen={isOpen} onClose={onClose} title={lead ? `Edit Lead: ${lead.leadId}` : 'Create New Lead'} subtitle="Fill in client details, estimated value, priority, and sales status." maxWidth="3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lead Title / Project Name *
            </label>
            <input type="text" required placeholder="Lead or project title" value={formData.leadName} onChange={e => setFormData({ ...formData, leadName: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Name *
            </label>
            <input type="text" required placeholder="Client company name" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contact Person *
            </label>
            <input type="text" required placeholder="Contact person name" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email *
            </label>
            <input type="email" required placeholder="Client email address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone / Mobile *
            </label>
            <input type="text" required placeholder="Phone / mobile number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Service Interested *
            </label>
            <select required value={formData.serviceInterested} onChange={e => setFormData({ ...formData, serviceInterested: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="">Select service</option>
              <option>Website Development</option>
              <option>E-commerce Development</option>
              <option>Mobile Applications</option>
              <option>Custom Software</option>
              <option>Zoho Implementation</option>
              <option>ERP Systems</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Est. Project Value (BHD)
            </label>
            <input type="number" value={formData.estimatedProjectValue} onChange={e => setFormData({ ...formData, estimatedProjectValue: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Sales Rep
            </label>
            <select value={formData.assignedSalesperson} onChange={e => setFormData({ ...formData, assignedSalesperson: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="">Unassigned</option>
              {salesUsers.map(u => <option key={u.id} value={u.name}>{u.name} — {u.role}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="New Lead">New Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Follow-up Required">Follow-up Required</option>
              <option value="Push to Meeting">Push to Meeting</option>
              <option value="Meeting Scheduled">Meeting Scheduled</option>
              <option value="Meeting Completed">Meeting Completed</option>
              <option value="Requirement Gathering">Requirement Gathering</option>
              <option value="Proposal Preparing">Proposal Preparing</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Waiting for Client">Waiting for Client</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Sub-status / Remark
            </label>
            <input type="text" placeholder="Current sub-status or remark" value={formData.customStatus} onChange={e => setFormData({ ...formData, customStatus: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>


        {formData.status === 'Lost' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/50 dark:bg-rose-950/20">
          <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Stage Where Lead Was Lost *</label><select required value={formData.lossStage} onChange={e => setFormData({ ...formData, lossStage: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="">Select stage</option>{['New Lead','Contacted','Follow-up Required','Meeting Scheduled','Meeting Completed','Requirement Gathering','Proposal Preparing','Proposal Sent','Waiting for Client','Negotiation'].map(st => <option key={st}>{st}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Loss Reason</label><input value={formData.lossReason} onChange={e => setFormData({ ...formData, lossReason: e.target.value })} placeholder="Budget, competitor, no response, timing..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/></div>
        </div>}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notes & Key Client Background
          </label>
          <textarea rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Key requirement details, budget constraints, decision maker info..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
        </div>

        <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700">
            Save Lead
          </button>
        </div>
      </form>
    </Modal>);
};
