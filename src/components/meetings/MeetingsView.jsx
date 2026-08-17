import React, { useState } from 'react';
import { hasPermission } from '../../services/permissionService';
import { meetingService } from '../../services/meetingService';
import { leadService } from '../../services/leadService';
import { Badge } from '../common/Badge';
import { Calendar, Clock, Video, MapPin, Plus, Search, CheckCircle2, Users, FileText, ChevronDown, ChevronUp, Building2, ExternalLink, Trash2 } from 'lucide-react';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';
export const MeetingsView = ({ currentUser, onScheduleMeeting = () => { }, onRecordMinutes = (_meeting) => { } }) => {
    const canManage = hasPermission(currentUser, 'manage_meetings');
    const canDelete = hasPermission(currentUser, 'delete_meetings');
    const [, setVersion] = useState(0);
    const meetings = meetingService.getMeetings();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [expandedMeetingId, setExpandedMeetingId] = useState(null);
    const leads = leadService.getLeads();
    const handleRefresh = () => {
        setVersion(v => v + 1);
    };
    const filteredMeetings = meetings.filter(m => {
        const matchesSearch = m.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.salesperson.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch)
            return false;
        if (filterType === 'Scheduled')
            return m.status === 'Scheduled';
        if (filterType === 'Completed')
            return m.status === 'Completed';
        if (filterType === 'Online')
            return m.meetingType === 'Online';
        if (filterType === 'Offline')
            return m.meetingType === 'Offline';
        return true;
    });
    const scheduledCount = meetings.filter(m => m.status === 'Scheduled').length;
    const completedCount = meetings.filter(m => m.status === 'Completed').length;
    const onlineCount = meetings.filter(m => m.meetingType === 'Online').length;
    const offlineCount = meetings.filter(m => m.meetingType === 'Offline').length;
    return (<div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#d8e7f0] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#071A35] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#00AEEF]"/>
            Client Meetings & Recorded Minutes
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Manage discovery workshops, technical demos, client negotiation calls, and recorded MoM notes.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <ExcelExportButton label="Export Meetings" onClick={() => excelExportService.exportRows(
            `syskode-meetings-${new Date().toISOString().slice(0, 10)}`,
            'Meetings',
            filteredMeetings.map(m => ({ Lead: m.leadName, Company: m.companyName, Purpose: m.purpose, Type: m.meetingType, Platform_or_Location: m.platform || m.location || '', Date: m.date, Time: m.time, Duration: m.duration || '', Status: m.status, Syskode_Owner: m.salesperson || '', Client_Attendees: (m.clientAttendees || []).join(', '), Client_Email: m.clientEmail || '', Meeting_Link: m.meetingLink || '', Minutes: m.minutes || m.meetingMinutes || '' }))
          )}/>
          {canManage && <button onClick={onScheduleMeeting} className="flex w-full items-center justify-center space-x-2 rounded-xl bg-[#0788C9] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#066fa5] shadow-md transition-all cursor-pointer sm:w-auto">
            <Plus className="h-4 w-4"/>
            <span>Schedule New Meeting</span>
          </button>}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">Total Meetings</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{meetings.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">Upcoming Scheduled</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{scheduledCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">Completed & MoM</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium text-zinc-400">Online / In-Person</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">
            {onlineCount} <span className="text-xs text-zinc-500 font-normal">/ {offlineCount}</span>
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500"/>
          <input type="text" placeholder="Search by lead name, company, salesperson or purpose..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"/>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Scheduled', 'Completed', 'Online', 'Offline'].map(tab => (<button key={tab} onClick={() => setFilterType(tab)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filterType === tab
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
              {tab}
            </button>))}
        </div>
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (<div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-zinc-600 mb-3"/>
          <h3 className="text-sm font-bold text-zinc-200">No Meetings Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            No meetings match your current search or filter criteria. Schedule a new meeting to populate client discussions.
          </p>
          {canManage && <button onClick={onScheduleMeeting} className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">
            <Plus className="h-4 w-4"/>
            <span>Schedule Meeting</span>
          </button>}
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeetings.map(m => {
                const isExpanded = expandedMeetingId === m.id;
                return (<div key={m.id} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5 space-y-4 hover:border-zinc-700/80 transition-all shadow-2xs">
                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center rounded-md bg-purple-950/80 border border-purple-800/50 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                        {m.meetingType === 'Online' ? (<Video className="h-3 w-3 mr-1 text-purple-400"/>) : (<MapPin className="h-3 w-3 mr-1 text-purple-400"/>)}
                        {m.meetingType} • {m.platform || m.location}
                      </span>
                      <Badge variant={m.status === 'Completed' ? 'green' : 'amber'}>
                        {m.status}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-zinc-100 mt-1">
                      {m.purpose}
                    </h3>
                    <p className="text-xs text-zinc-400 flex items-center space-x-1.5">
                      <Building2 className="h-3.5 w-3.5 text-zinc-500"/>
                      <span>{m.companyName}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-blue-400 font-medium">{m.leadName}</span>
                    </p>
                  </div>
                </div>

                {/* Time & Attendees */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/50">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-zinc-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-zinc-400"/> Date & Time
                    </p>
                    <p className="font-semibold text-zinc-200">
                      {m.date} at {m.time}
                    </p>
                    <p className="text-[11px] text-zinc-400">Duration: {m.duration}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-zinc-500 flex items-center">
                      <Users className="h-3 w-3 mr-1 text-zinc-400"/> Syskode Lead
                    </p>
                    <p className="font-semibold text-zinc-200">{m.salesperson}</p>
                    <p className="text-[11px] text-zinc-400 break-words">
                      Client: {m.clientAttendees.join(', ')}{m.clientEmail ? ` • ${m.clientEmail}` : ''}
                    </p>
                  </div>
                </div>

                {/* Meeting Link or Address */}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {m.meetingLink && (<a href={m.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center space-x-1 rounded-lg border border-blue-800/60 bg-blue-950/40 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-950/70">
                      <Video className="h-3.5 w-3.5"/>
                      <span>Join Real Meeting</span>
                    </a>)}
                  <a href={meetingService.buildGoogleCalendarUrl(m)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center space-x-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800">
                    <Calendar className="h-3.5 w-3.5"/>
                    <span>Add to Google Calendar</span>
                    <ExternalLink className="h-3 w-3"/>
                  </a>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-stretch justify-between gap-2 border-t border-zinc-800/60 pt-2 sm:flex-row sm:items-center">
                  {m.status === 'Scheduled' && canManage ? (<button onClick={() => onRecordMinutes(m)} className="flex items-center space-x-1 text-xs font-bold text-emerald-400 hover:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4"/>
                      <span>Record Minutes of Meeting (MoM)</span>
                    </button>) : (<span className="text-xs text-zinc-400 font-semibold flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1"/> {m.status === 'Scheduled' ? 'Scheduled' : 'MoM Recorded'}
                    </span>)}

                  <div className="flex items-center gap-2">
                    {m.minutes && (<button onClick={() => setExpandedMeetingId(isExpanded ? null : m.id)} className="flex items-center space-x-1 text-xs font-medium text-zinc-400 hover:text-zinc-200">
                        <span>{isExpanded ? 'Hide MoM Details' : 'View Recorded MoM'}</span>{isExpanded ? <ChevronUp className="h-3.5 w-3.5"/> : <ChevronDown className="h-3.5 w-3.5"/>}
                      </button>)}
                    {canDelete && <button onClick={() => { if (window.confirm(`Delete meeting for ${m.companyName}?`)) {
                    meetingService.deleteMeeting(m.id);
                    handleRefresh();
                } }} className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-950/50" title="Delete Meeting"><Trash2 className="h-4 w-4"/></button>}
                  </div>
                </div>

                {/* Expanded Minutes */}
                {isExpanded && m.minutes && (<div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-xs space-y-3 animate-fadeIn">
                    <h4 className="font-bold text-zinc-200 text-xs flex items-center">
                      <FileText className="h-3.5 w-3.5 mr-1 text-blue-400"/>
                      Recorded Minutes & Client Feedback:
                    </h4>
                    {m.minutes.requirementsDiscussed && (<div>
                        <p className="text-[11px] font-semibold text-zinc-400">Requirements Discussed:</p>
                        <p className="text-zinc-300 mt-0.5">{m.minutes.requirementsDiscussed}</p>
                      </div>)}
                    {m.minutes.clientConcerns && (<div>
                        <p className="text-[11px] font-semibold text-amber-400">Client Concerns & Objections:</p>
                        <p className="text-zinc-300 mt-0.5">{m.minutes.clientConcerns}</p>
                      </div>)}
                    {m.minutes.budgetDiscussion && (<div>
                        <p className="text-[11px] font-semibold text-emerald-400">Budget Discussion:</p>
                        <p className="text-zinc-300 mt-0.5">{m.minutes.budgetDiscussion}</p>
                      </div>)}
                    {m.minutes.nextAction && (<div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/50">
                        <p className="text-[11px] font-bold text-blue-300">Action Item:</p>
                        <p className="text-zinc-200 mt-0.5 font-medium">{m.minutes.nextAction}</p>
                      </div>)}
                  </div>)}
              </div>);
            })}
        </div>)}
    </div>);
};
