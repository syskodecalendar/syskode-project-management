import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { meetingService } from '../../services/meetingService';
export const PushToMeetingModal = ({ isOpen, onClose, lead, onSuccess }) => {
    const [meetingType, setMeetingType] = useState('Online');
    const [platform, setPlatform] = useState('Google Meet');
    const [meetingLink, setMeetingLink] = useState('');
    const [location, setLocation] = useState('');
    const [address, setAddress] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('11:00');
    const [salesperson, setSalesperson] = useState('');
    const [purpose, setPurpose] = useState('');
    const [agenda, setAgenda] = useState('');
    useEffect(() => {
        if (lead) {
            setSalesperson(lead.assignedSalesperson || '');
        }
    }, [lead]);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!lead)
            return;
        const newMeeting = meetingService.createMeeting({
            leadId: lead.id,
            leadName: lead.leadName,
            companyName: lead.companyName,
            meetingType,
            platform: meetingType === 'Online' ? platform : undefined,
            meetingLink: meetingType === 'Online' ? meetingLink : undefined,
            location: meetingType === 'Offline' ? location : undefined,
            address: meetingType === 'Offline' ? address : undefined,
            date,
            time,
            duration: '1 Hour',
            salesperson,
            clientAttendees: [lead.contactPerson],
            syskodeAttendees: [salesperson],
            clientEmail: lead.email || undefined,
            purpose,
            agenda,
            reminder: true,
            status: 'Scheduled'
        });
        onSuccess(newMeeting);
        onClose();
    };
    if (!lead)
        return null;
    return (<Modal isOpen={isOpen} onClose={onClose} title={`Schedule Discovery Meeting: ${lead.companyName}`} subtitle={`Schedule online call or in-person meeting with ${lead.contactPerson}`} maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Meeting Type */}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setMeetingType('Online')} className={`p-3 rounded-lg border text-xs font-bold transition-all text-center ${meetingType === 'Online'
            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:border-blue-500 dark:text-blue-300'
            : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900'}`}>
            Online Call (Google Meet / Teams)
          </button>
          <button type="button" onClick={() => setMeetingType('Offline')} className={`p-3 rounded-lg border text-xs font-bold transition-all text-center ${meetingType === 'Offline'
            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:border-blue-500 dark:text-blue-300'
            : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900'}`}>
            Offline Meeting (Client / Syskode Office)
          </button>
        </div>

        {meetingType === 'Online' ? (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Platform
              </label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option>Google Meet</option>
                <option>Microsoft Teams</option>
                <option>Zoom</option>
                <option>Phone Call</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Real Meeting Link
              </label>
              <input type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="Paste Google Meet / Teams / Zoom join URL" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
              {platform === 'Google Meet' && <a href="https://meet.google.com/new" target="_blank" rel="noreferrer" className="mt-1.5 inline-flex text-[11px] font-bold text-blue-600 hover:text-blue-700">Create a real Google Meet ↗</a>}
              <p className="mt-1 text-[10px] text-slate-500">Create the meeting in your provider, then paste its real join link here. The link is stored with this meeting.</p>
            </div>
          </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location Name
              </label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Address
              </label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
            </div>
          </div>)}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date *
            </label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Time *
            </label>
            <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Salesperson / Lead Host
            </label>
            <input type="text" value={salesperson} onChange={e => setSalesperson(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Meeting Purpose *
          </label>
          <input type="text" required value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Agenda Items
          </label>
          <textarea rows={3} value={agenda} onChange={e => setAgenda(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"/>
        </div>

        {meetingType === 'Online' && <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-900">
          <strong>Real meeting workflow:</strong> create the actual Meet/Teams/Zoom room, paste its join URL above, then save this record. After saving, the Meetings screen can open the join link and create a prefilled Google Calendar event for the client.
        </div>}

        <div className="pt-3 flex flex-col-reverse gap-2 border-t border-slate-100 sm:flex-row sm:justify-end dark:border-slate-800">
          <button type="button" onClick={onClose} className="w-full rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-700 sm:w-auto">
            Schedule Meeting
          </button>
        </div>
      </form>
    </Modal>);
};
