import { createDatabaseId, databaseService } from './databaseService';
import { authService } from './authService';
const STORAGE_KEY = 'syskode_project_billing_store';
function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
function save(rows) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    databaseService.queueSync(STORAGE_KEY, rows);
}
function milestoneAmount(project, percentage) {
    return Math.round(((Number(project.contractValue) || 0) * percentage / 100) * 1000) / 1000;
}
export const billingService = {
    getAll() { return load(); },
    getByProject(projectId) {
        return load().filter(row => row.projectId === projectId);
    },
    create(project, data, createdBy) {
        const rows = load();
        const percentage = Math.max(0, Math.min(100, Number(data.percentage) || 0));
        const item = {
            id: createDatabaseId(),
            projectId: project.id,
            title: data.title.trim() || `Payment ${rows.filter(r => r.projectId === project.id).length + 1}`,
            triggerLabel: data.triggerLabel.trim() || 'Project milestone',
            percentage,
            amount: milestoneAmount(project, percentage),
            currency: project.currency || 'BHD',
            dueDate: data.dueDate || undefined,
            notes: data.notes || undefined,
            status: data.status || 'Planned',
            amountPaid: 0,
            createdBy,
        };
        rows.push(item);
        save(rows);
        return item;
    },
    update(project, id, updates) {
        const rows = load();
        const index = rows.findIndex(row => row.id === id);
        if (index < 0)
            throw new Error('Billing milestone not found.');
        const next = { ...rows[index], ...updates };
        if (updates.percentage !== undefined) {
            next.percentage = Math.max(0, Math.min(100, Number(updates.percentage) || 0));
            next.amount = milestoneAmount(project, next.percentage);
        }
        rows[index] = next;
        save(rows);
        return next;
    },
    delete(id) {
        const rows = load();
        save(rows.filter(row => row.id !== id));
        databaseService.queueDelete('project_billing_milestones', id);
    },
    createDefaultSchedule(project, createdBy) {
        const existing = this.getByProject(project.id);
        if (existing.length)
            throw new Error('This project already has billing milestones.');
        const template = [
            ['Initial Payment', 'Before project starts', 50],
            ['Design / Development Milestone', 'On agreed development milestone', 20],
            ['UAT Milestone', 'On client UAT / approval', 20],
            ['Final Payment', 'Before final handover / go-live', 10],
        ];
        return template.map(([title, triggerLabel, percentage]) => this.create(project, { title, triggerLabel, percentage }, createdBy));
    },
    summary(project) {
        const rows = this.getByProject(project.id);
        const plannedPercentage = rows.reduce((sum, row) => sum + (Number(row.percentage) || 0), 0);
        const invoicedRows = rows.filter(row => Boolean(row.zohoInvoiceId) && row.status !== 'Void');
        const invoicedPercentage = invoicedRows.reduce((sum, row) => sum + (Number(row.percentage) || 0), 0);
        const paidPercentage = invoicedRows.reduce((sum, row) => {
            if (row.status === 'Paid')
                return sum + (Number(row.percentage) || 0);
            const amount = Number(row.amount) || 0;
            const paid = Math.min(amount, Number(row.amountPaid) || 0);
            return sum + (amount > 0 ? (Number(row.percentage) || 0) * paid / amount : 0);
        }, 0);
        const total = Number(project.contractValue) || 0;
        const invoicedAmount = invoicedRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
        const paidAmount = invoicedRows.reduce((sum, row) => sum + Math.min(Number(row.amount) || 0, Number(row.amountPaid) || (row.status === 'Paid' ? Number(row.amount) || 0 : 0)), 0);
        return {
            plannedPercentage,
            invoicedPercentage,
            paidPercentage,
            pendingToInvoicePercentage: Math.max(0, 100 - invoicedPercentage),
            outstandingPaymentPercentage: Math.max(0, invoicedPercentage - paidPercentage),
            total,
            invoicedAmount,
            paidAmount,
            pendingAmount: Math.max(0, total - invoicedAmount),
            outstandingAmount: Math.max(0, invoicedAmount - paidAmount),
        };
    },
    async createZohoInvoice(project, milestone, customer) {
        const token = await authService.getAccessToken();
        if (!token)
            throw new Error('You must be signed in to create a Zoho Books invoice.');
        const response = await fetch('/api/zoho-books/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ project, milestone, customer }),
        });
        const result = await response.json();
        if (!response.ok || !result.success)
            throw new Error(result.error || 'Unable to create Zoho Books invoice.');
        await databaseService.refresh();
        return result;
    },
    async refreshZohoInvoice(projectId, milestoneId) {
        const token = await authService.getAccessToken();
        if (!token)
            throw new Error('You must be signed in to refresh invoice status.');
        const response = await fetch(`/api/zoho-books/invoices/${encodeURIComponent(milestoneId)}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ projectId }),
        });
        const result = await response.json();
        if (!response.ok || !result.success)
            throw new Error(result.error || 'Unable to refresh invoice status.');
        await databaseService.refresh();
        return result;
    },
};
