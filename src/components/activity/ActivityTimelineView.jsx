import React, { useState } from 'react';
import { activityService } from '../../services/activityService';
import { Badge } from '../common/Badge';
import { History, Trash2 } from 'lucide-react';
import { hasPermission } from '../../services/permissionService';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';
export const ActivityTimelineView = ({ currentUser }) => {
    const [, setVersion] = useState(0);
    const activities = activityService.getActivities();
    const canDelete = hasPermission(currentUser, 'delete_activity');
    return <div className="space-y-4">
    <div className="rounded-xl border border-[#d8e7f0] bg-white p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center text-xl font-bold text-[#071A35]"><History className="mr-2 h-5 w-5 text-[#00AEEF]"/>System Activity & Audit Trail</h2><p className="mt-1 text-xs text-[#667085]">Chronological history of lead updates, meetings, proposal uploads, project actions, infrastructure changes and QA execution.</p></div><ExcelExportButton label="Export Activity" onClick={() => excelExportService.exportRows(`syskode-activity-${new Date().toISOString().slice(0, 10)}`, 'Activity', activities.map(act => ({ Date: act.date || '', Time: act.time || '', User: act.user || '', Action: act.action || '', Record_Type: act.relatedRecordType || '', Record_ID: act.relatedRecordId || '', Description: act.description || '' })))}/></div></div>
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="relative ml-4 space-y-6 border-l-2 border-slate-200">
      {activities.map(act => <div key={act.id} className="relative pl-6"><div className="absolute -left-2.5 top-0.5 h-5 w-5 rounded-full border-2 border-white bg-blue-600"/><div className="space-y-1 text-xs"><div className="flex items-center gap-2"><span className="font-bold text-slate-900">{act.user}</span><Badge variant="blue" size="sm">{act.relatedRecordType}</Badge><span className="font-mono text-[10px] text-slate-400">{act.date} {act.time}</span>{canDelete && <button onClick={() => { if (window.confirm('Delete this audit record?')) {
        activityService.deleteActivity(act.id);
        setVersion(v => v + 1);
    } }} className="ml-auto rounded p-1 text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5"/></button>}</div><p className="font-medium text-slate-700">{act.action}</p>{act.description && <p className="rounded border border-slate-100 bg-slate-50 p-2 text-slate-600">{act.description}</p>}</div></div>)}
    </div></div>
  </div>;
};
