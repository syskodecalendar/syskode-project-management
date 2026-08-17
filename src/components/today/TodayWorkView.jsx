import React from 'react';
import { CalendarDays, CheckSquare, Clock3, Globe2, ListTodo, RefreshCw, Server, ShieldCheck, Users2 } from 'lucide-react';
import { meetingService } from '../../services/meetingService';
import { taskService } from '../../services/taskService';
import { infrastructureService } from '../../services/infrastructureService';
import { leadService } from '../../services/leadService';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';

const todayIso = () => { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${day}`; };

export const TodayWorkView = ({ currentUser, onNavigate = () => {} }) => {
  const today = todayIso();
  const meetings = meetingService.getMeetings().filter(m => m.date === today && !['Cancelled', 'Completed'].includes(m.status));
  const allTasks = taskService.getTasks().filter(t => t.status !== 'Completed');
  const dueToday = allTasks.filter(t => t.dueDate === today);
  const overdue = allTasks.filter(t => t.dueDate && t.dueDate < today);
  const renewals = infrastructureService.getRenewalWarnings().filter(r => r.daysRemaining <= 30);
  const followUps = leadService.getLeads().filter(l => l.nextFollowUpDate === today && !['Won','Lost'].includes(l.status));

  const renewalIcon = type => type === 'Domain' ? Globe2 : type === 'Hosting' ? Server : ShieldCheck;

  return <div className="space-y-6">
    <div className="rounded-2xl border border-[#d8e7f0] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 text-xl font-bold text-[#071A35]"><CalendarDays className="h-5 w-5 text-[#00AEEF]"/>Today's Work</h2>
      <p className="mt-1 text-xs text-[#667085]">One place for today's meetings, due tasks, overdue work, renewals and lead follow-ups.</p>
      <p className="mt-2 text-[11px] font-semibold text-[#0788C9]">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
      <ExcelExportButton label="Export Today's Work" onClick={() => excelExportService.exportSheets(`syskode-todays-work-${today}`, [
        { name: 'Meetings', rows: meetings }, { name: 'Tasks Due Today', rows: dueToday }, { name: 'Overdue Tasks', rows: overdue }, { name: 'Renewals', rows: renewals }, { name: 'Lead Follow Ups', rows: followUps }
      ])}/></div>
    </div>

    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Count label="Meetings" value={meetings.length}/><Count label="Tasks Due" value={dueToday.length}/><Count label="Overdue" value={overdue.length} danger/><Count label="Renewals ≤30d" value={renewals.length}/><Count label="Follow-ups" value={followUps.length}/>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <Section icon={CalendarDays} title="Today's Meetings" action="Open Meetings" onAction={() => onNavigate('meetings')}>
        {meetings.length === 0 ? <Empty text="No meetings scheduled for today."/> : meetings.map(m => <Item key={m.id} title={`${m.time} — ${m.companyName}`} meta={`${m.meetingType} • ${m.purpose}`} icon={Clock3}/>) }
      </Section>

      <Section icon={CheckSquare} title="Tasks Due Today" action="Open Tasks" onAction={() => onNavigate('tasks')}>
        {dueToday.length === 0 ? <Empty text="No tasks due today."/> : dueToday.map(t => <Item key={t.id} title={t.taskName} meta={`${t.projectName} • ${t.assignedMember} • ${t.status}`} icon={ListTodo}/>) }
      </Section>

      <Section icon={RefreshCw} title="Renewals & Expiries" action="Infrastructure" onAction={() => onNavigate('infrastructure')}>
        {renewals.length === 0 ? <Empty text="No domain, hosting or SSL renewal due within 30 days."/> : renewals.map(r => <Item key={r.id} title={r.title} meta={`${r.expiryDate} • ${r.daysRemaining} day(s) remaining`} icon={renewalIcon(r.type)} danger={r.daysRemaining <= 7}/>) }
      </Section>

      <Section icon={Users2} title="Lead Follow-ups Today" action="Open Leads" onAction={() => onNavigate('leads')}>
        {followUps.length === 0 ? <Empty text="No lead follow-ups scheduled for today."/> : followUps.map(l => <Item key={l.id} title={`${l.companyName} — ${l.leadName}`} meta={`${l.status} • ${l.assignedSalesperson || 'Unassigned'}`} icon={Users2}/>) }
      </Section>
    </div>

    {overdue.length > 0 && <Section icon={Clock3} title="Overdue Tasks" action="Open Tasks" onAction={() => onNavigate('tasks')}><div className="grid gap-2 md:grid-cols-2">{overdue.map(t => <Item key={t.id} title={t.taskName} meta={`${t.projectName} • Due ${t.dueDate}`} icon={Clock3} danger/>)}</div></Section>}
  </div>;
};

const Count = ({ label, value, danger }) => <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4"><p className="text-[11px] font-semibold text-zinc-500">{label}</p><p className={`mt-1 text-2xl font-black ${danger && value ? 'text-rose-400' : 'text-zinc-100'}`}>{value}</p></div>;
const Section = ({ icon: Icon, title, action, onAction, children }) => <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-bold text-zinc-100"><Icon className="h-4 w-4 text-blue-400"/>{title}</h3>{action && <button onClick={onAction} className="text-[11px] font-semibold text-blue-400 hover:text-blue-300">{action} →</button>}</div><div className="space-y-2">{children}</div></div>;
const Item = ({ title, meta, icon: Icon, danger }) => <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"><div className={`rounded-lg p-2 ${danger ? 'bg-rose-950/50 text-rose-400' : 'bg-blue-950/50 text-blue-400'}`}><Icon className="h-4 w-4"/></div><div className="min-w-0"><p className="truncate text-xs font-bold text-zinc-100">{title}</p><p className="mt-1 text-[11px] text-zinc-500">{meta}</p></div></div>;
const Empty = ({ text }) => <div className="rounded-xl border border-dashed border-zinc-800 p-7 text-center text-xs text-zinc-500">{text}</div>;
