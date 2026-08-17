import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { meetingService } from '../../services/meetingService';
export const MeetingMinutesModal = ({ isOpen, onClose, meeting, onSuccess }) => {
    const [discussionPoints, setDiscussionPoints] = useState('');
    const [clientRequirements, setClientRequirements] = useState('');
    const [agreedScope, setAgreedScope] = useState('');
    const [estimatedBudget, setEstimatedBudget] = useState('');
    const [agreedTimeline, setAgreedTimeline] = useState('');
    const [nextActionItem, setNextActionItem] = useState('');
    const [nextActionDueDate, setNextActionDueDate] = useState('');
    const [responsiblePerson, setResponsiblePerson] = useState('');
    useEffect(() => {
        if (meeting) setResponsiblePerson(meeting.salesperson || '');
    }, [meeting]);
    if (!meeting)
        return null;
    const handleSubmit = (e) => {
        e.preventDefault();
        const updated = meetingService.recordMinutes(meeting.id, {
            requirementsDiscussed: discussionPoints || clientRequirements || agreedScope,
            clientConcerns: clientRequirements,
            budgetDiscussion: estimatedBudget,
            nextAction: nextActionItem,
            followUpDate: nextActionDueDate,
            internalNotes: `Responsible: ${responsiblePerson}`
        });
        onSuccess(updated);
        onClose();
    };
    return (<Modal isOpen={isOpen} onClose={onClose} title={`Record Minutes: ${meeting.companyName}`} subtitle={`Capture requirements, agreed scope, budget & next action for meeting on ${meeting.date}`} maxWidth="3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Key Discussion Points
          </label>
          <textarea rows={3} required value={discussionPoints} onChange={e => setDiscussionPoints(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Client Functional Requirements *
          </label>
          <textarea rows={3} required value={clientRequirements} onChange={e => setClientRequirements(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Agreed Budget Expectation
            </label>
            <input type="text" value={estimatedBudget} onChange={e => setEstimatedBudget(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Agreed Delivery Timeline
            </label>
            <input type="text" value={agreedTimeline} onChange={e => setAgreedTimeline(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Recorded By
            </label>
            <input type="text" value={responsiblePerson} onChange={e => setResponsiblePerson(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Agreed Deliverables / Scope Summary
          </label>
          <input type="text" value={agreedScope} onChange={e => setAgreedScope(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
        </div>

        {/* Next Action Item */}
        <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-2">
            Immediate Next Action & Follow-up Commitment
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-300 mb-1">
                Action Item *
              </label>
              <input type="text" required value={nextActionItem} onChange={e => setNextActionItem(e.target.value)} className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"/>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-300 mb-1">
                Due Date *
              </label>
              <input type="date" required value={nextActionDueDate} onChange={e => setNextActionDueDate(e.target.value)} className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"/>
            </div>
          </div>
        </div>

        <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700">
            Save Meeting Minutes
          </button>
        </div>
      </form>
    </Modal>);
};
