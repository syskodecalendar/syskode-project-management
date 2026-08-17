import { activityService } from './activityService';
const STORAGE_KEY = 'syskode_leads_store';
import { databaseService, createDatabaseId } from './databaseService';
function loadLeads() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        }
        catch (e) {
            // fallback
        }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
}
function saveLeads(leads) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    databaseService.queueSync(STORAGE_KEY, leads);
}
export const leadService = {
    getLeads() {
        return loadLeads();
    },
    getLeadById(id) {
        return loadLeads().find(l => l.id === id || l.leadId === id);
    },
    createLead(data) {
        const leads = loadLeads();
        const newId = createDatabaseId();
        const leadId = `SYS-LD-${new Date().getFullYear()}-${newId.slice(0, 6).toUpperCase()}`;
        const createdDate = new Date().toISOString().split('T')[0];
        const newLead = {
            ...data,
            id: newId,
            leadId,
            createdDate,
            lastContactedDate: createdDate,
            ...(data.status === 'Lost' ? { lossStage: data.lossStage || 'Not recorded', lostDate: createdDate } : {}),
            ...(data.status === 'Won' ? { wonDate: createdDate } : {}),
        };
        leads.unshift(newLead);
        saveLeads(leads);
        activityService.logActivity(data.assignedSalesperson || 'Sales User', 'Lead Created', 'lead', newLead.id, `Created lead "${newLead.leadName}" (${newLead.leadId}) for ${newLead.companyName}`);
        return newLead;
    },
    updateLead(id, updates) {
        const leads = loadLeads();
        const index = leads.findIndex(l => l.id === id);
        if (index === -1)
            throw new Error('Lead not found');
        const previous = leads[index];
        const lifecycleUpdates = { ...updates };
        if (updates.status === 'Lost' && previous.status !== 'Lost') {
            lifecycleUpdates.lossStage = updates.lossStage || previous.status || 'Not recorded';
            lifecycleUpdates.lostDate = new Date().toISOString().split('T')[0];
        }
        if (updates.status === 'Won' && previous.status !== 'Won') {
            lifecycleUpdates.wonDate = new Date().toISOString().split('T')[0];
        }
        const updatedLead = { ...previous, ...lifecycleUpdates };
        if (updates.status && updates.status !== previous.status) {
            activityService.logActivity(updatedLead.assignedSalesperson || 'System', 'Status Changed', 'lead', updatedLead.id, `Status changed from "${previous.status}" to "${updates.status}" for lead "${updatedLead.leadName}"`);
        }
        leads[index] = updatedLead;
        saveLeads(leads);
        return updatedLead;
    },
    updateNextAction(id, nextAction) {
        const leads = loadLeads();
        const index = leads.findIndex(l => l.id === id);
        if (index === -1)
            throw new Error('Lead not found');
        leads[index].nextAction = nextAction;
        leads[index].nextFollowUpDate = nextAction.dueDate;
        saveLeads(leads);
        activityService.logActivity(nextAction.responsiblePerson || 'User', 'Next Action Updated', 'lead', id, `Next Action set to "${nextAction.action}" due on ${nextAction.dueDate}`);
        return leads[index];
    },
    deleteLead(id) {
        const leads = loadLeads().filter(l => l.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
        databaseService.queueDelete('leads', id);
    },
    getPipelineCounts() {
        const leads = loadLeads();
        const counts = {
            New: 0,
            Contacted: 0,
            'Follow-up': 0,
            Meeting: 0,
            Proposal: 0,
            Negotiation: 0,
            Won: 0,
            Lost: 0,
        };
        leads.forEach(lead => {
            const status = lead.status;
            if (status === 'New Lead')
                counts.New++;
            else if (status === 'Contacted')
                counts.Contacted++;
            else if (status === 'Follow-up Required')
                counts['Follow-up']++;
            else if (status === 'Push to Meeting' || status === 'Meeting Scheduled' || status === 'Meeting Completed')
                counts.Meeting++;
            else if (status === 'Requirement Gathering' || status === 'Proposal Preparing' || status === 'Proposal Sent' || status === 'Waiting for Client')
                counts.Proposal++;
            else if (status === 'Negotiation')
                counts.Negotiation++;
            else if (status === 'Won')
                counts.Won++;
            else if (status === 'Lost')
                counts.Lost++;
        });
        return counts;
    },
    getLeadStats() {
        const leads = loadLeads();
        const totalLeads = leads.length;
        const activeLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').length;
        const wonLeads = leads.filter(l => l.status === 'Won').length;
        const lostLeads = leads.filter(l => l.status === 'Lost').length;
        const pipelineValue = leads
            .filter(l => l.status !== 'Won' && l.status !== 'Lost')
            .reduce((acc, l) => acc + (l.estimatedProjectValue || 0), 0);
        const wonRevenue = leads
            .filter(l => l.status === 'Won')
            .reduce((acc, l) => acc + (l.estimatedProjectValue || 0), 0);
        const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
        return {
            totalLeads,
            activeLeads,
            wonLeads,
            lostLeads,
            pipelineValue,
            wonRevenue,
            conversionRate,
        };
    }
};
