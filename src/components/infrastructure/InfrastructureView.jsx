import React from 'react';
import { AlertTriangle, Server } from 'lucide-react';
import { infrastructureService } from '../../services/infrastructureService';
import { InfrastructureManager } from './InfrastructureManager';
import { Badge } from '../common/Badge';
import { excelExportService } from '../../services/excelExportService';
import { ExcelExportButton } from '../common/ExcelExportButton';
export const InfrastructureView = ({ currentUser, onRefresh }) => {
    const warnings = infrastructureService.getRenewalWarnings();
    const domains = infrastructureService.getDomains();
    const hosting = infrastructureService.getHosting();
    const ssl = infrastructureService.getSSL();
    const repositories = infrastructureService.getRepositories();
    const deployments = infrastructureService.getDeployments();
    return <div className="space-y-5">
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Server className="h-5 w-5 text-blue-600"/>Infrastructure & Domain Governance</h2>
        <p className="mt-1 text-xs text-slate-600">Add and manage domains, hosting, SSL, repositories and deployments. Every record is linked to a live project.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><ExcelExportButton label="Export Infrastructure" onClick={() => excelExportService.exportSheets(`syskode-infrastructure-${new Date().toISOString().slice(0, 10)}`, [
        { name: 'Domains', rows: domains }, { name: 'Hosting', rows: hosting }, { name: 'SSL', rows: ssl }, { name: 'Repositories', rows: repositories }, { name: 'Deployments', rows: deployments }, { name: 'Renewal Alerts', rows: warnings }
      ])}/><Badge variant={warnings.length ? 'amber' : 'green'}>{warnings.length} renewal alert{warnings.length === 1 ? '' : 's'}</Badge></div>
    </div>

    {warnings.length > 0 && <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {warnings.slice(0, 6).map(w => <div key={w.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-slate-800">
        <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600"/><div><p className="font-bold">{w.title}</p><p>Expiry: {w.expiryDate} • {w.daysRemaining} days</p></div></div>
        <Badge variant={w.daysRemaining <= 7 ? 'red' : 'amber'}>{w.severity}</Badge>
      </div>)}
    </div>}

    <InfrastructureManager currentUser={currentUser} onRefresh={onRefresh}/>
  </div>;
};
