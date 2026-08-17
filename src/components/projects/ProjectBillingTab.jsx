import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, BookOpenCheck, Loader2, Plus, ReceiptText, RefreshCw, Trash2, WalletCards } from 'lucide-react';
import { billingService } from '../../services/billingService';
import { databaseService } from '../../services/databaseService';
import { leadService } from '../../services/leadService';
import { hasPermission } from '../../services/permissionService';
import { zohoBooksService } from '../../services/zohoBooksService';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';
const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-black placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';
const label = 'mb-1 block text-[11px] font-bold text-black';
function money(value, currency) {
    return `${currency || 'BHD'} ${(Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: currency === 'BHD' ? 3 : 2, maximumFractionDigits: currency === 'BHD' ? 3 : 2 })}`;
}
const statusClass = {
    Planned: 'bg-slate-100 text-slate-700', Ready: 'bg-blue-50 text-blue-700', Invoiced: 'bg-amber-50 text-amber-800',
    'Partially Paid': 'bg-violet-50 text-violet-700', Paid: 'bg-emerald-50 text-emerald-700', Void: 'bg-rose-50 text-rose-700'
};
export const ProjectBillingTab = ({ project, currentUser, onRefresh }) => {
    const canManage = hasPermission(currentUser, 'manage_projects');
    const [version, setVersion] = useState(0);
    const rows = useMemo(() => billingService.getByProject(project.id), [project.id, version]);
    const summary = useMemo(() => billingService.summary(project), [project.id, project.contractValue, version]);
    const [title, setTitle] = useState('');
    const [triggerLabel, setTriggerLabel] = useState('');
    const [percentage, setPercentage] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [message, setMessage] = useState('');
    const [busyId, setBusyId] = useState('');
    const [zohoConnected, setZohoConnected] = useState(null);
    const linkedLead = project.leadId ? leadService.getLeadById(project.leadId) : undefined;
    const reload = () => { setVersion(v => v + 1); onRefresh(); };
    useEffect(() => {
        zohoBooksService.getStatus().then(s => setZohoConnected(s.connected)).catch(() => setZohoConnected(false));
    }, [project.id]);
    const addMilestone = async (e) => {
        e.preventDefault();
        if (!canManage)
            return;
        const pct = Number(percentage);
        if (!title.trim() || !triggerLabel.trim() || !Number.isFinite(pct) || pct <= 0) {
            setMessage('Enter a title, trigger and percentage greater than 0.');
            return;
        }
        if (summary.plannedPercentage + pct > 100.0001) {
            setMessage(`This would make the payment schedule ${summary.plannedPercentage + pct}%. Keep the total at or below 100%.`);
            return;
        }
        billingService.create(project, { title, triggerLabel, percentage: pct, dueDate: dueDate || undefined }, currentUser.name);
        await databaseService.flush();
        setTitle('');
        setTriggerLabel('');
        setPercentage('');
        setDueDate('');
        setMessage('Billing milestone added.');
        reload();
    };
    const addDefault = async () => {
        try {
            billingService.createDefaultSchedule(project, currentUser.name);
            await databaseService.flush();
            setMessage('Default 50/20/20/10 billing schedule created. You can edit the percentages below.');
            reload();
        }
        catch (error) {
            setMessage(error?.message || 'Unable to create default schedule.');
        }
    };
    const updateRow = async (row, updates) => {
        if (!canManage || row.zohoInvoiceId)
            return;
        if (updates.percentage !== undefined) {
            const other = rows.filter(r => r.id !== row.id).reduce((sum, r) => sum + Number(r.percentage || 0), 0);
            if (other + Number(updates.percentage || 0) > 100.0001) {
                setMessage('Payment schedule cannot exceed 100%.');
                return;
            }
        }
        billingService.update(project, row.id, updates);
        await databaseService.flush();
        reload();
    };
    const createInvoice = async (row) => {
        if (!canManage)
            return;
        setBusyId(row.id);
        setMessage('');
        try {
            await databaseService.flush();
            const result = await billingService.createZohoInvoice(project, row, {
                name: linkedLead?.contactPerson || linkedLead?.leadName || project.client,
                company: linkedLead?.companyName || project.client,
                email: linkedLead?.email,
                phone: linkedLead?.phone || linkedLead?.whatsApp,
            });
            setMessage(`Zoho Books invoice ${result.invoice?.number || result.invoice?.id} created successfully.`);
            reload();
        }
        catch (error) {
            setMessage(error?.message || 'Unable to create Zoho Books invoice.');
        }
        finally {
            setBusyId('');
        }
    };
    const refreshInvoice = async (row) => {
        setBusyId(row.id);
        setMessage('');
        try {
            const result = await billingService.refreshZohoInvoice(project.id, row.id);
            setMessage(`Invoice ${result.invoice?.number || ''} status refreshed: ${result.invoice?.status || 'updated'}.`);
            reload();
        }
        catch (error) {
            setMessage(error?.message || 'Unable to refresh invoice status.');
        }
        finally {
            setBusyId('');
        }
    };
    const deleteRow = async (row) => {
        if (row.zohoInvoiceId) {
            setMessage('This milestone already has a Zoho Books invoice. Void/manage the invoice in Zoho Books instead of deleting its local billing record.');
            return;
        }
        if (!window.confirm(`Delete billing milestone "${row.title}"?`))
            return;
        billingService.delete(row.id);
        await databaseService.flush();
        reload();
    };
    const statCards = [
        ['Contract Value', money(project.contractValue, project.currency), '100%'],
        ['Invoiced', money(summary.invoicedAmount, project.currency), `${summary.invoicedPercentage.toFixed(1)}%`],
        ['Paid', money(summary.paidAmount, project.currency), `${summary.paidPercentage.toFixed(1)}%`],
        ['Pending to Invoice', money(summary.pendingAmount, project.currency), `${summary.pendingToInvoicePercentage.toFixed(1)}%`],
        ['Outstanding Payment', money(summary.outstandingAmount, project.currency), `${summary.outstandingPaymentPercentage.toFixed(1)}%`],
    ];
    return <div className="space-y-5">
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-[#0a2038] px-5 py-5 text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-blue-300"/><h3 className="text-base font-black">Project Billing & Zoho Books</h3></div><p className="mt-1 text-xs text-slate-300">Split the contract into flexible percentage milestones and track invoiced, paid and pending amounts.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><ExcelExportButton label="Export Billing" onClick={() => excelExportService.exportSheets(`syskode-${project.projectId || project.id}-billing`, [
            { name: 'Billing Summary', rows: [{ Project_ID: project.projectId, Project: project.projectName, Client: project.client, Contract_Value_BHD: Number(project.contractValue) || 0, Planned_Percentage: summary.plannedPercentage, Invoiced_BHD: summary.invoicedAmount, Paid_BHD: summary.paidAmount, Pending_to_Invoice_BHD: summary.pendingAmount, Outstanding_BHD: summary.outstandingAmount }] },
            { name: 'Milestones', rows: rows.map(row => ({ Title: row.title, Trigger: row.triggerLabel, Percentage: row.percentage, Amount_BHD: row.amount, Amount_Paid_BHD: row.amountPaid || 0, Status: row.status, Due_Date: row.dueDate || '', Zoho_Invoice_Number: row.zohoInvoiceNumber || '', Zoho_Invoice_Status: row.zohoInvoiceStatus || '', Last_Synced: row.lastSyncedAt || '' })) }
          ])} className="border-white/25 bg-white/10 text-white hover:bg-white/15"/><div className={`rounded-full px-3 py-1.5 text-[10px] font-black ${zohoConnected ? 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/30' : 'bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/30'}`}>{zohoConnected === null ? 'Checking Zoho…' : zohoConnected ? 'Zoho Books Connected' : 'Zoho Books Not Connected'}</div></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-3 xl:grid-cols-5">{statCards.map(([name, value, pct]) => <div key={name} className="bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wide text-slate-500">{name}</p><p className="mt-1 text-sm font-black text-slate-950">{value}</p><p className="mt-1 text-[10px] font-bold text-blue-600">{pct}</p></div>)}</div>
    </div>

    {summary.plannedPercentage > 0 && Math.abs(summary.plannedPercentage - 100) > 0.001 && <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/><span>Your billing plan currently totals <strong>{summary.plannedPercentage.toFixed(1)}%</strong>. Add or edit milestones until it reaches 100% if the full contract will be invoiced through this schedule.</span></div>}

    {message && <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold text-blue-950">{message}</div>}

    {canManage && <form onSubmit={addMilestone} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="text-sm font-black text-slate-950">Add Billing Milestone</h4><p className="mt-1 text-[11px] text-slate-600">Example: 50% before project start, 20% after design approval, 20% on UAT, 10% before go-live.</p></div>{rows.length === 0 && <button type="button" onClick={addDefault} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">Use 50/20/20/10 Template</button>}</div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div><label className={label}>Milestone Title</label><input value={title} onChange={e => setTitle(e.target.value)} className={field} placeholder="Initial Payment"/></div>
        <div><label className={label}>When is it due?</label><input value={triggerLabel} onChange={e => setTriggerLabel(e.target.value)} className={field} placeholder="Before project starts"/></div>
        <div><label className={label}>Percentage</label><input type="number" min="0.001" max="100" step="0.001" value={percentage} onChange={e => setPercentage(e.target.value)} className={field} placeholder="50"/></div>
        <div><label className={label}>Due Date (optional)</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={field}/></div>
      </div>
      <button className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-black text-white"><Plus className="h-4 w-4"/>Add Milestone</button>
    </form>}

    <div className="space-y-3">
      {rows.length === 0 ? <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center"><ReceiptText className="mx-auto h-8 w-8 text-slate-400"/><p className="mt-2 text-sm font-black text-slate-900">No billing milestones yet</p><p className="mt-1 text-xs text-slate-500">Add a custom schedule or use the 50/20/20/10 template.</p></div> : rows.map((row, index) => <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#0a2038] px-2.5 py-1 text-[10px] font-black text-white">{index + 1}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass[row.status] || statusClass.Planned}`}>{row.status}</span>{row.zohoInvoiceNumber && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">Zoho #{row.zohoInvoiceNumber}</span>}</div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><label className={label}>Title</label><input defaultValue={row.title} disabled={!canManage || !!row.zohoInvoiceId} onBlur={e => updateRow(row, { title: e.target.value })} className={field}/></div>
              <div><label className={label}>Trigger</label><input defaultValue={row.triggerLabel} disabled={!canManage || !!row.zohoInvoiceId} onBlur={e => updateRow(row, { triggerLabel: e.target.value })} className={field}/></div>
              <div><label className={label}>Percentage</label><input type="number" min="0.001" max="100" step="0.001" defaultValue={row.percentage} disabled={!canManage || !!row.zohoInvoiceId} onBlur={e => updateRow(row, { percentage: Number(e.target.value) })} className={field}/></div>
              <div><label className={label}>Due Date</label><input type="date" defaultValue={row.dueDate || ''} disabled={!canManage || !!row.zohoInvoiceId} onBlur={e => updateRow(row, { dueDate: e.target.value || undefined })} className={field}/></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600"><span>Invoice Amount: <strong className="text-slate-950">{money(row.amount, row.currency)}</strong></span><span>Paid: <strong className="text-emerald-700">{money(row.amountPaid || 0, row.currency)}</strong></span>{row.zohoInvoiceStatus && <span>Zoho Status: <strong className="text-slate-950">{row.zohoInvoiceStatus}</strong></span>}{row.lastSyncedAt && <span>Last Synced: <strong>{new Date(row.lastSyncedAt).toLocaleString()}</strong></span>}</div>
          </div>
          {canManage && <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-56 lg:justify-end">{!row.zohoInvoiceId ? <button disabled={!zohoConnected || busyId === row.id} onClick={() => createInvoice(row)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-black text-white disabled:opacity-40">{busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <BookOpenCheck className="h-3.5 w-3.5"/>}Create Zoho Invoice</button> : <button disabled={busyId === row.id} onClick={() => refreshInvoice(row)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-black text-white disabled:opacity-40">{busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <RefreshCw className="h-3.5 w-3.5"/>}Refresh Status</button>}<button onClick={() => deleteRow(row)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] font-bold text-rose-700"><Trash2 className="h-3.5 w-3.5"/>Delete</button></div>}
        </div>
      </div>)}
    </div>

    {summary.plannedPercentage >= 99.999 && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800"><BadgeCheck className="h-4 w-4"/>Billing schedule covers 100% of the project contract value.</div>}
  </div>;
};
