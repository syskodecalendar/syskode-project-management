import React from 'react';
import { BarChart3, CircleDollarSign, Target, TrendingDown, Trophy, WalletCards } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { leadService } from '../../services/leadService';
import { projectService } from '../../services/projectService';
import { billingService } from '../../services/billingService';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';

const money = (value) => `BHD ${(Number(value) || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })}`;
const n = value => Number(value) || 0;

export const ReportsView = () => {
  const leads = leadService.getLeads();
  const projects = projectService.getProjects();
  const billing = billingService.getAll();

  const won = leads.filter(l => l.status === 'Won');
  const lost = leads.filter(l => l.status === 'Lost');
  const active = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost');
  const total = leads.length;
  const winRate = total ? Math.round((won.length / total) * 100) : 0;
  const wonValue = won.reduce((sum, l) => sum + n(l.estimatedProjectValue), 0);
  const lostValue = lost.reduce((sum, l) => sum + n(l.estimatedProjectValue), 0);
  const pipelineValue = active.reduce((sum, l) => sum + n(l.estimatedProjectValue), 0);

  const received = billing.reduce((sum, row) => sum + (n(row.amountPaid) || (row.status === 'Paid' ? n(row.amount) : 0)), 0);
  const invoiced = billing.filter(row => row.status !== 'Void' && row.zohoInvoiceId).reduce((sum, row) => sum + n(row.amount), 0);
  const outstanding = Math.max(0, invoiced - received);
  const contractValue = projects.reduce((sum, p) => sum + n(p.contractValue), 0);

  const lossMap = new Map();
  lost.forEach(lead => {
    const stage = lead.lossStage || lead.lostStage || lead.previousStatus || 'Not recorded';
    const current = lossMap.get(stage) || { stage, count: 0, value: 0 };
    current.count += 1;
    current.value += n(lead.estimatedProjectValue);
    lossMap.set(stage, current);
  });
  const lossByStage = [...lossMap.values()].sort((a, b) => b.count - a.count);
  const outcomeData = [
    { name: 'Won', value: won.length },
    { name: 'Lost', value: lost.length },
    { name: 'Active', value: active.length },
  ];
  const PIE_COLORS = ['#16a34a', '#dc2626', '#00AEEF'];
  const financialData = [
    { name: 'Contract Value', amount: contractValue },
    { name: 'Invoiced', amount: invoiced },
    { name: 'Received', amount: received },
    { name: 'Outstanding', amount: outstanding },
    { name: 'Active Pipeline', amount: pipelineValue },
    { name: 'Lost Potential', amount: lostValue },
  ];
  const projectFinance = projects.map(project => ({ project, summary: billingService.summary(project) }));

  const exportReport = () => {
    const summaryRows = [
      { Metric: 'Total Leads', Value: total, Amount_BHD: '' },
      { Metric: 'Won Leads', Value: won.length, Amount_BHD: wonValue },
      { Metric: 'Lost Leads', Value: lost.length, Amount_BHD: lostValue },
      { Metric: 'Active Leads', Value: active.length, Amount_BHD: pipelineValue },
      { Metric: 'Win Rate (%)', Value: winRate, Amount_BHD: '' },
      { Metric: 'Project Contract Value', Value: projects.length, Amount_BHD: contractValue },
      { Metric: 'Invoiced', Value: billing.filter(row => row.zohoInvoiceId).length, Amount_BHD: invoiced },
      { Metric: 'Money Received', Value: '', Amount_BHD: received },
      { Metric: 'Outstanding', Value: '', Amount_BHD: outstanding },
    ];

    excelExportService.exportSheets(`syskode-report-${new Date().toISOString().slice(0, 10)}`, [
      { name: 'Executive Summary', rows: summaryRows },
      { name: 'Lead Outcomes', rows: leads.map(l => ({
        Lead_ID: l.leadId, Lead: l.leadName, Company: l.companyName, Contact: l.contactPerson,
        Status: l.status, Priority: l.priority, Salesperson: l.assignedSalesperson,
        Service: l.serviceInterested, Estimated_Value_BHD: n(l.estimatedProjectValue),
        Lost_Stage: l.lossStage || l.lostStage || '', Lost_Reason: l.lossReason || l.lostReason || '',
        Next_Follow_Up: l.nextFollowUpDate || '', Created: l.createdAt || l.createdDate || ''
      })) },
      { name: 'Lost by Stage', rows: lossByStage.map(r => ({ Stage: r.stage, Lost_Leads: r.count, Lost_Value_BHD: r.value })) },
      { name: 'Lost Leads', rows: lost.map(l => ({
        Lead_ID: l.leadId, Lead: l.leadName, Company: l.companyName,
        Lost_At_Stage: l.lossStage || l.lostStage || 'Not recorded',
        Reason: l.lossReason || l.lostReason || l.customStatus || '',
        Estimated_Value_BHD: n(l.estimatedProjectValue), Salesperson: l.assignedSalesperson || ''
      })) },
      { name: 'Project Billing', rows: projectFinance.map(({ project, summary }) => ({
        Project_ID: project.projectId, Project: project.projectName, Client: project.client,
        Status: project.projectStatus, Contract_Value_BHD: n(summary.total),
        Invoiced_BHD: n(summary.invoicedAmount), Received_BHD: n(summary.paidAmount),
        Outstanding_BHD: n(summary.outstandingAmount)
      })) },
      { name: 'Invoice Records', rows: billing.map(row => ({
        Project_ID: row.projectId || '', Milestone: row.milestoneName || row.name || '', Status: row.status,
        Amount_BHD: n(row.amount), Amount_Paid_BHD: n(row.amountPaid), Zoho_Invoice_ID: row.zohoInvoiceId || '',
        Invoice_Number: row.invoiceNumber || '', Invoice_Date: row.invoiceDate || '', Due_Date: row.dueDate || ''
      })) },
    ]);
  };

  return (<div className="space-y-6">
    <div className="rounded-2xl border border-[#d8e7f0] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#071A35]"><BarChart3 className="h-5 w-5 text-[#00AEEF]"/>Sales, Revenue & Delivery Reports</h2>
          <p className="mt-1 text-xs text-[#667085]">Live reporting from real lead, project and billing records. Lost-stage reporting uses the stage captured when a lead is marked Lost.</p>
        </div>
        <ExcelExportButton onClick={exportReport} label="Export Full Report to Excel"/>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
      <Kpi icon={Trophy} label="Won Leads" value={won.length} sub={money(wonValue)} tone="text-emerald-600"/>
      <Kpi icon={TrendingDown} label="Lost Leads" value={lost.length} sub={money(lostValue)} tone="text-rose-600"/>
      <Kpi icon={Target} label="Win Rate" value={`${winRate}%`} sub={`${total} total leads`} tone="text-[#0788C9]"/>
      <Kpi icon={CircleDollarSign} label="Pipeline" value={money(pipelineValue)} sub={`${active.length} active leads`} tone="text-[#00AEEF]"/>
      <Kpi icon={WalletCards} label="Money Received" value={money(received)} sub={`Invoiced ${money(invoiced)}`} tone="text-emerald-600"/>
      <Kpi icon={CircleDollarSign} label="Outstanding" value={money(outstanding)} sub={`Contracts ${money(contractValue)}`} tone="text-amber-600"/>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <ReportCard title="Lead Outcome" subtitle="Won vs lost vs still active.">
        <div className="h-72">
          {total === 0 ? <Empty text="No lead records yet."/> : <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={outcomeData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={4}>{outcomeData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index]}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/><Legend/></PieChart></ResponsiveContainer>}
        </div>
      </ReportCard>

      <ReportCard title="Where Leads Were Lost" subtitle="Count and potential value lost at each pipeline stage.">
        <div className="h-72">
          {lossByStage.length === 0 ? <Empty text="No lost leads recorded yet."/> : <ResponsiveContainer width="100%" height="100%"><BarChart data={lossByStage} margin={{ top: 5, right: 15, bottom: 40, left: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#dbe8f0"/><XAxis dataKey="stage" stroke="#667085" fontSize={10} angle={-20} textAnchor="end" interval={0}/><YAxis yAxisId="left" stroke="#667085" fontSize={10}/><YAxis yAxisId="right" orientation="right" stroke="#667085" fontSize={10}/><Tooltip contentStyle={tooltipStyle} formatter={(v, name) => name === 'Lost Value (BHD)' ? money(v) : v}/><Legend/><Bar yAxisId="left" dataKey="count" name="Lost Leads" fill="#dc2626" radius={[4,4,0,0]}/><Bar yAxisId="right" dataKey="value" name="Lost Value (BHD)" fill="#f59e0b" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>}
        </div>
      </ReportCard>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <ReportCard title="Financial Position" subtitle="Contract, invoiced, received, outstanding, pipeline and lost potential values.">
        <div className="h-72">{financialData.every(row => row.amount === 0) ? <Empty text="No financial records yet."/> : <ResponsiveContainer width="100%" height="100%"><BarChart data={financialData} margin={{ top: 5, right: 10, bottom: 45, left: 15 }}><CartesianGrid strokeDasharray="3 3" stroke="#dbe8f0"/><XAxis dataKey="name" stroke="#667085" fontSize={10} angle={-20} textAnchor="end" interval={0}/><YAxis stroke="#667085" fontSize={10}/><Tooltip contentStyle={tooltipStyle} formatter={v => money(v)}/><Bar dataKey="amount" name="BHD" fill="#00AEEF" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>}</div>
      </ReportCard>

      <ReportCard title="Project Billing Summary" subtitle="Actual billing status by real project.">
        <div className="max-h-72 overflow-auto"><table className="min-w-full text-left text-xs"><thead className="sticky top-0 bg-[#f4f9fc] text-[#667085]"><tr><th className="px-2 py-2">Project</th><th className="px-2 py-2 text-right">Contract</th><th className="px-2 py-2 text-right">Invoiced</th><th className="px-2 py-2 text-right">Received</th><th className="px-2 py-2 text-right">Outstanding</th></tr></thead><tbody className="divide-y divide-[#e3edf3]">{projectFinance.map(({project, summary}) => <tr key={project.id}><td className="px-2 py-2 font-semibold text-[#071A35]">{project.projectName}</td><td className="px-2 py-2 text-right text-[#344054]">{money(summary.total)}</td><td className="px-2 py-2 text-right text-[#344054]">{money(summary.invoicedAmount)}</td><td className="px-2 py-2 text-right text-emerald-700">{money(summary.paidAmount)}</td><td className="px-2 py-2 text-right text-amber-700">{money(summary.outstandingAmount)}</td></tr>)}{projectFinance.length === 0 && <tr><td colSpan="5" className="px-3 py-8 text-center text-[#98A2B3]">No projects recorded.</td></tr>}</tbody></table></div>
      </ReportCard>
    </div>

    <div className="rounded-2xl border border-[#d8e7f0] bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><h3 className="text-sm font-bold text-[#071A35]">Lost Lead Detail</h3><p className="mt-1 text-xs text-[#667085]">Use this to see the client, lost stage, reason and value.</p></div><div className="text-xs text-[#667085]">Lost potential: <strong className="text-rose-600">{money(lostValue)}</strong></div></div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-xs"><thead className="border-b border-[#d8e7f0] bg-[#f7fbfe] text-[#667085]"><tr><th className="px-3 py-2">Lead</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Lost At Stage</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2 text-right">Value</th></tr></thead><tbody className="divide-y divide-[#e3edf3]">{lost.map(lead => <tr key={lead.id}><td className="px-3 py-3 font-semibold text-[#071A35]">{lead.leadName}</td><td className="px-3 py-3 text-[#344054]">{lead.companyName}</td><td className="px-3 py-3 text-rose-600">{lead.lossStage || lead.lostStage || 'Not recorded'}</td><td className="px-3 py-3 text-[#667085]">{lead.lossReason || lead.lostReason || lead.customStatus || '-'}</td><td className="px-3 py-3 text-right font-semibold text-[#071A35]">{money(lead.estimatedProjectValue)}</td></tr>)}{lost.length === 0 && <tr><td colSpan="5" className="px-3 py-8 text-center text-[#98A2B3]">No lost leads recorded.</td></tr>}</tbody></table>
      </div>
    </div>
  </div>);
};

const tooltipStyle = { background: '#ffffff', border: '1px solid #d8e7f0', color: '#071A35', borderRadius: '10px', fontSize: '12px' };
const ReportCard = ({ title, subtitle, children }) => <div className="rounded-2xl border border-[#d8e7f0] bg-white p-5 shadow-sm"><h3 className="text-sm font-bold text-[#071A35]">{title}</h3><p className="mb-4 mt-1 text-xs text-[#667085]">{subtitle}</p>{children}</div>;
const Kpi = ({ icon: Icon, label, value, sub, tone }) => <div className="rounded-2xl border border-[#d8e7f0] bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${tone}`}/><p className="text-[11px] font-semibold uppercase tracking-wide text-[#667085]">{label}</p></div><p className={`mt-2 text-xl font-black ${tone}`}>{value}</p><p className="mt-1 text-[11px] text-[#98A2B3]">{sub}</p></div>;
const Empty = ({ text }) => <div className="flex h-full items-center justify-center text-xs text-[#98A2B3]">{text}</div>;
