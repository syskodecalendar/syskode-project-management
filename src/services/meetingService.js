import { leadService } from './leadService';
import { activityService } from './activityService';
const STORAGE_KEY = 'syskode_meetings_store';
import { databaseService, createDatabaseId } from './databaseService';
function loadMeetings() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
        catch (e) {
            // fallback
        }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
}
function saveMeetings(meetings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
    databaseService.queueSync(STORAGE_KEY, meetings);
}
function parseMeetingDateTime(date, time) {
    if (!date)
        return null;
    const match = String(time || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match)
        return null;
    let hours = Number(match[1]);
    const minutes = Number(match[2] || 0);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12)
        hours += 12;
    if (meridiem === 'AM' && hours === 12)
        hours = 0;
    const dt = new Date(`${date}T00:00:00`);
    if (Number.isNaN(dt.getTime()))
        return null;
    dt.setHours(hours, minutes, 0, 0);
    return dt;
}
function calendarStamp(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}
export const meetingService = {
    buildGoogleCalendarUrl(meeting) {
        const start = parseMeetingDateTime(meeting.date, meeting.time);
        if (!start)
            return 'https://calendar.google.com/calendar/u/0/r/eventedit';
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const details = [meeting.agenda, meeting.notes, meeting.meetingLink ? `Join meeting: ${meeting.meetingLink}` : ''].filter(Boolean).join('\n\n');
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: `${meeting.purpose} — ${meeting.companyName}`,
            dates: `${calendarStamp(start)}/${calendarStamp(end)}`,
            details,
            location: meeting.meetingType === 'Online' ? (meeting.meetingLink || meeting.platform || 'Online') : (meeting.address || meeting.location || ''),
        });
        if (meeting.clientEmail)
            params.set('add', meeting.clientEmail);
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    },
    getMeetings() {
        return loadMeetings();
    },
    getMeetingsByLead(leadId) {
        return loadMeetings().filter(m => m.leadId === leadId);
    },
    createMeeting(data) {
        const meetings = loadMeetings();
        const newMeeting = {
            ...data,
            id: createDatabaseId()
        };
        meetings.unshift(newMeeting);
        saveMeetings(meetings);
        // Update Lead status to Meeting Scheduled
        if (data.leadId) {
            leadService.updateLead(data.leadId, {
                status: 'Meeting Scheduled',
                nextFollowUpDate: data.date,
                customStatus: `Meeting scheduled for ${data.date} at ${data.time} (${data.meetingType})`
            });
        }
        activityService.logActivity(data.salesperson || 'Sales Rep', 'Meeting Scheduled', 'meeting', newMeeting.id, `Scheduled ${data.meetingType} meeting for lead "${data.leadName}" on ${data.date} at ${data.time}`);
        return newMeeting;
    },
    updateMeeting(id, updates) {
        const meetings = loadMeetings();
        const idx = meetings.findIndex(m => m.id === id);
        if (idx === -1)
            throw new Error('Meeting not found');
        const previous = meetings[idx];
        const updated = { ...previous, ...updates };
        if (updates.status === 'Completed' && previous.status !== 'Completed') {
            if (updated.leadId) {
                leadService.updateLead(updated.leadId, {
                    status: 'Meeting Completed',
                    customStatus: `Meeting completed on ${updated.date}. Minutes recorded.`
                });
            }
        }
        meetings[idx] = updated;
        saveMeetings(meetings);
        return updated;
    },
    deleteMeeting(id) {
        const meetings = loadMeetings().filter(m => m.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
        databaseService.queueDelete('meetings', id);
    },
    recordMinutes(id, minutes) {
        const meetings = loadMeetings();
        const idx = meetings.findIndex(m => m.id === id);
        if (idx === -1)
            throw new Error('Meeting not found');
        meetings[idx].minutes = minutes;
        meetings[idx].status = 'Completed';
        saveMeetings(meetings);
        if (meetings[idx].leadId) {
            leadService.updateLead(meetings[idx].leadId, {
                status: 'Meeting Completed',
                customStatus: 'Meeting minutes recorded with client requirements.'
            });
        }
        activityService.logActivity(meetings[idx].salesperson || 'Sales Rep', 'Meeting Minutes Recorded', 'meeting', id, `Recorded meeting minutes for "${meetings[idx].leadName}"`);
        return meetings[idx];
    }
};
