import React, { useState } from 'react';
import { Globe, Server, ShieldCheck, GitBranch, Rocket, Plus, Trash2, Pencil, X } from 'lucide-react';
import { infrastructureService } from '../../services/infrastructureService';
import { projectService } from '../../services/projectService';
import { authService } from '../../services/authService';
import { hasPermission } from '../../services/permissionService';
const inputCls = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 outline-none focus:border-blue-500';
const labelCls = 'block text-[11px] font-bold text-slate-900';
export const InfrastructureManager = ({ projectId, currentUser, onRefresh, compact = false }) => {
    const user = currentUser || authService.getCurrentUser();
    const canManage = hasPermission(user, 'manage_infrastructure');
    const canDelete = hasPermission(user, 'delete_infrastructure');
    const projects = projectService.getProjects();
    const employees = authService.getAllProfiles().filter(e => e.status !== 'Inactive');
    const [kind, setKind] = useState('domain');
    const [form, setForm] = useState({
        projectId: projectId || projects[0]?.id || '',
        responsiblePerson: employees[0]?.name || '',
        currency: 'BHD',
        status: 'Active',
        autoRenewal: true,
        autoRenew: true,
        billingCycle: 'Annually',
        mainBranch: 'main'
    });
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(null);
    const effectiveProjectId = projectId || form.projectId;
    const filter = (items) => projectId ? items.filter(x => x.projectId === projectId) : items;
    const domains = filter(infrastructureService.getDomains());
    const hosting = filter(infrastructureService.getHosting());
    const ssl = filter(infrastructureService.getSSL());
    const repos = filter(infrastructureService.getRepositories());
    const deployments = filter(infrastructureService.getDeployments());
    const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
    const projectName = (id) => projects.find(p => p.id === id)?.projectName || id;
    const resetForKind = (nextKind) => {
        setKind(nextKind);
        setEditing(null);
        setError('');
        setForm(prev => ({
            projectId: projectId || prev.projectId || projects[0]?.id || '',
            responsiblePerson: prev.responsiblePerson || employees[0]?.name || '',
            currency: 'BHD', status: 'Active', autoRenewal: true, autoRenew: true,
            billingCycle: 'Annually', mainBranch: 'main'
        }));
    };
    const submit = (e) => {
        e.preventDefault();
        if (!canManage) {
            setError('You do not have permission to add or edit infrastructure.');
            return;
        }
        setError('');
        if (!effectiveProjectId) {
            setError('Select a project first.');
            return;
        }
        try {
            if (kind === 'domain') {
                if (!form.domainName || !form.registrar || !form.accountEmail || !form.renewalDate)
                    throw new Error('Domain name, registrar, account email and renewal date are required.');
                const data = {
                    projectId: effectiveProjectId, domainName: form.domainName, registrar: form.registrar,
                    accountEmail: form.accountEmail, purchasedBy: form.purchasedBy || 'Syskode',
                    responsiblePerson: form.responsiblePerson || 'Unassigned', purchaseDate: form.purchaseDate || new Date().toISOString().slice(0, 10),
                    renewalDate: form.renewalDate, autoRenewal: form.autoRenewal !== false, cost: Number(form.cost || 0), currency: form.currency || 'BHD', status: form.status || 'Active'
                };
                editing?.kind === 'domain' ? infrastructureService.updateDomain(editing.id, data) : infrastructureService.addDomain(data);
            }
            else if (kind === 'hosting') {
                if (!form.hostingProvider || !form.accountEmail || !form.renewalDate)
                    throw new Error('Hosting provider, account email and renewal date are required.');
                const data = {
                    projectId: effectiveProjectId, hostingProvider: form.hostingProvider, hostingPlan: form.hostingPlan || '', serverIp: form.serverIp || undefined,
                    controlPanel: form.controlPanel || undefined, accountEmail: form.accountEmail, responsiblePerson: form.responsiblePerson || 'Unassigned',
                    startDate: form.startDate || new Date().toISOString().slice(0, 10), renewalDate: form.renewalDate, cost: Number(form.cost || 0), currency: form.currency || 'BHD',
                    billingCycle: form.billingCycle || 'Annually', status: form.status || 'Active'
                };
                editing?.kind === 'hosting' ? infrastructureService.updateHosting(editing.id, data) : infrastructureService.addHosting(data);
            }
            else if (kind === 'ssl') {
                if (!form.provider || !form.expiryDate)
                    throw new Error('SSL provider and expiry date are required.');
                const data = {
                    projectId: effectiveProjectId, provider: form.provider, issuedDate: form.issuedDate || new Date().toISOString().slice(0, 10), expiryDate: form.expiryDate,
                    autoRenew: form.autoRenew !== false, responsiblePerson: form.responsiblePerson || 'Unassigned', status: form.status || 'Active'
                };
                editing?.kind === 'ssl' ? infrastructureService.updateSSL(editing.id, data) : infrastructureService.addSSL(data);
            }
            else if (kind === 'repository') {
                if (!form.githubUrl || !form.repositoryOwner)
                    throw new Error('Repository URL and owner are required.');
                const data = {
                    projectId: effectiveProjectId, githubUrl: form.githubUrl, repositoryOwner: form.repositoryOwner, mainBranch: form.mainBranch || 'main',
                    developmentBranch: form.developmentBranch || 'develop', deploymentBranch: form.deploymentBranch || 'production',
                    responsibleDeveloper: form.responsiblePerson || 'Unassigned'
                };
                editing?.kind === 'repository' ? infrastructureService.updateRepository(editing.id, data) : infrastructureService.addRepository(data);
            }
            else {
                if (!form.deploymentProvider)
                    throw new Error('Deployment provider is required.');
                const data = {
                    projectId: effectiveProjectId, productionUrl: form.productionUrl || undefined, stagingUrl: form.stagingUrl || undefined,
                    developmentUrl: form.developmentUrl || undefined, deploymentProvider: form.deploymentProvider,
                    responsiblePerson: form.responsiblePerson || 'Unassigned', lastDeployment: form.lastDeployment || new Date().toISOString(),
                    deploymentNotes: form.deploymentNotes || undefined
                };
                editing?.kind === 'deployment' ? infrastructureService.updateDeployment(editing.id, data) : infrastructureService.addDeployment(data);
            }
            resetForKind(kind);
            onRefresh();
        }
        catch (err) {
            setError(err?.message || 'Unable to save infrastructure record.');
        }
    };
    const startEdit = (nextKind, item) => {
        setKind(nextKind);
        setEditing({ kind: nextKind, id: item.id });
        setError('');
        const nextForm = { ...item };
        if (nextKind === 'repository')
            nextForm.responsiblePerson = item.responsibleDeveloper || '';
        setForm(nextForm);
        requestAnimationFrame(() => document.getElementById('infrastructure-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };
    const remove = (type, id, name) => {
        if (!canDelete) {
            setError('You do not have permission to delete infrastructure.');
            return;
        }
        if (!window.confirm(`Delete ${name}? This cannot be undone.`))
            return;
        if (type === 'domain')
            infrastructureService.deleteDomain(id);
        if (type === 'hosting')
            infrastructureService.deleteHosting(id);
        if (type === 'ssl')
            infrastructureService.deleteSSL(id);
        if (type === 'repository')
            infrastructureService.deleteRepository(id);
        if (type === 'deployment')
            infrastructureService.deleteDeployment(id);
        onRefresh();
    };
    const commonProject = !projectId && (<label className={labelCls}>Project
      <select value={form.projectId || ''} onChange={e => set('projectId', e.target.value)} className={inputCls} required>
        <option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.projectId} — {p.projectName}</option>)}
      </select>
    </label>);
    const responsible = (<label className={labelCls}>Responsible Person
      <select value={form.responsiblePerson || ''} onChange={e => set('responsiblePerson', e.target.value)} className={inputCls}>
        <option value="">Select employee</option>{employees.map(u => <option key={u.id} value={u.name}>{u.name} — {u.role}</option>)}
      </select>
    </label>);
    return <div className="space-y-5">
    {canManage ? <div id="infrastructure-editor" className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        {[
                ['domain', 'Domain', Globe], ['hosting', 'Hosting', Server], ['ssl', 'SSL', ShieldCheck], ['repository', 'Repository', GitBranch], ['deployment', 'Deployment', Rocket]
            ].map(([id, label, Icon]) => <button key={id} type="button" onClick={() => resetForKind(id)} className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold sm:w-auto ${kind === id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><Icon className="h-4 w-4"/>{label}</button>)}
      </div>
      <form onSubmit={submit} className="space-y-3 text-slate-900">
        <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3`}>
          {commonProject}
          {kind === 'domain' && <>
            <label className={labelCls}>Domain Name *<input className={inputCls} value={form.domainName || ''} onChange={e => set('domainName', e.target.value)} placeholder="client-domain.com"/></label>
            <label className={labelCls}>Registrar *<input className={inputCls} value={form.registrar || ''} onChange={e => set('registrar', e.target.value)} placeholder="Hostinger / GoDaddy"/></label>
            <label className={labelCls}>Account Email *<input type="email" className={inputCls} value={form.accountEmail || ''} onChange={e => set('accountEmail', e.target.value)}/></label>
            <label className={labelCls}>Purchased By<input className={inputCls} value={form.purchasedBy || ''} onChange={e => set('purchasedBy', e.target.value)}/></label>
            <label className={labelCls}>Purchase Date<input type="date" className={inputCls} value={form.purchaseDate || ''} onChange={e => set('purchaseDate', e.target.value)}/></label>
            <label className={labelCls}>Renewal Date *<input type="date" className={inputCls} value={form.renewalDate || ''} onChange={e => set('renewalDate', e.target.value)}/></label>
            <label className={labelCls}>Cost (BHD)<input type="number" step="0.001" className={inputCls} value={form.cost || ''} onChange={e => set('cost', e.target.value)}/></label>
            {responsible}
            <label className="flex items-center gap-2 pt-5 text-xs font-bold text-slate-900"><input type="checkbox" checked={form.autoRenewal !== false} onChange={e => set('autoRenewal', e.target.checked)}/> Auto renewal enabled</label>
          </>}
          {kind === 'hosting' && <>
            <label className={labelCls}>Hosting Provider *<input className={inputCls} value={form.hostingProvider || ''} onChange={e => set('hostingProvider', e.target.value)}/></label>
            <label className={labelCls}>Hosting Plan<input className={inputCls} value={form.hostingPlan || ''} onChange={e => set('hostingPlan', e.target.value)}/></label>
            <label className={labelCls}>Server IP<input className={inputCls} value={form.serverIp || ''} onChange={e => set('serverIp', e.target.value)}/></label>
            <label className={labelCls}>Control Panel<input className={inputCls} value={form.controlPanel || ''} onChange={e => set('controlPanel', e.target.value)} placeholder="hPanel / cPanel / CloudPanel"/></label>
            <label className={labelCls}>Account Email *<input type="email" className={inputCls} value={form.accountEmail || ''} onChange={e => set('accountEmail', e.target.value)}/></label>
            <label className={labelCls}>Start Date<input type="date" className={inputCls} value={form.startDate || ''} onChange={e => set('startDate', e.target.value)}/></label>
            <label className={labelCls}>Renewal Date *<input type="date" className={inputCls} value={form.renewalDate || ''} onChange={e => set('renewalDate', e.target.value)}/></label>
            <label className={labelCls}>Billing Cycle<select className={inputCls} value={form.billingCycle || 'Annually'} onChange={e => set('billingCycle', e.target.value)}><option>Monthly</option><option>Quarterly</option><option>Bi-Annually</option><option>Annually</option></select></label>
            <label className={labelCls}>Cost (BHD)<input type="number" step="0.001" className={inputCls} value={form.cost || ''} onChange={e => set('cost', e.target.value)}/></label>
            {responsible}
          </>}
          {kind === 'ssl' && <>
            <label className={labelCls}>SSL Provider *<input className={inputCls} value={form.provider || ''} onChange={e => set('provider', e.target.value)} placeholder="Let's Encrypt / Sectigo"/></label>
            <label className={labelCls}>Issued Date<input type="date" className={inputCls} value={form.issuedDate || ''} onChange={e => set('issuedDate', e.target.value)}/></label>
            <label className={labelCls}>Expiry Date *<input type="date" className={inputCls} value={form.expiryDate || ''} onChange={e => set('expiryDate', e.target.value)}/></label>
            {responsible}
            <label className="flex items-center gap-2 pt-5 text-xs font-bold text-slate-900"><input type="checkbox" checked={form.autoRenew !== false} onChange={e => set('autoRenew', e.target.checked)}/> Auto renewal enabled</label>
          </>}
          {kind === 'repository' && <>
            <label className={labelCls}>GitHub / Git URL *<input className={inputCls} value={form.githubUrl || ''} onChange={e => set('githubUrl', e.target.value)}/></label>
            <label className={labelCls}>Repository Owner *<input className={inputCls} value={form.repositoryOwner || ''} onChange={e => set('repositoryOwner', e.target.value)}/></label>
            <label className={labelCls}>Main Branch<input className={inputCls} value={form.mainBranch || 'main'} onChange={e => set('mainBranch', e.target.value)}/></label>
            <label className={labelCls}>Development Branch<input className={inputCls} value={form.developmentBranch || ''} onChange={e => set('developmentBranch', e.target.value)}/></label>
            <label className={labelCls}>Deployment Branch<input className={inputCls} value={form.deploymentBranch || ''} onChange={e => set('deploymentBranch', e.target.value)}/></label>
            {responsible}
          </>}
          {kind === 'deployment' && <>
            <label className={labelCls}>Deployment Provider *<input className={inputCls} value={form.deploymentProvider || ''} onChange={e => set('deploymentProvider', e.target.value)} placeholder="Vercel / Render / Hostinger VPS"/></label>
            <label className={labelCls}>Production URL<input className={inputCls} value={form.productionUrl || ''} onChange={e => set('productionUrl', e.target.value)}/></label>
            <label className={labelCls}>Staging URL<input className={inputCls} value={form.stagingUrl || ''} onChange={e => set('stagingUrl', e.target.value)}/></label>
            <label className={labelCls}>Development URL<input className={inputCls} value={form.developmentUrl || ''} onChange={e => set('developmentUrl', e.target.value)}/></label>
            <label className={labelCls}>Last Deployment<input type="datetime-local" className={inputCls} value={form.lastDeployment || ''} onChange={e => set('lastDeployment', e.target.value)}/></label>
            {responsible}
            <label className={`${labelCls} md:col-span-2`}>Deployment Notes<textarea className={inputCls} rows={2} value={form.deploymentNotes || ''} onChange={e => set('deploymentNotes', e.target.value)}/></label>
          </>}
        </div>
        {error && <p className="rounded-lg bg-rose-50 p-2 text-xs font-semibold text-rose-700">{error}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 sm:w-auto">{editing ? <Pencil className="h-4 w-4"/> : <Plus className="h-4 w-4"/>} {editing ? 'Update' : 'Add'} {kind[0].toUpperCase() + kind.slice(1)}</button>
          {editing && <button type="button" onClick={() => resetForKind(kind)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 sm:w-auto"><X className="h-4 w-4"/>Cancel Edit</button>}
        </div>
      </form>
    </div> : <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">You have view-only access to infrastructure. Ask an administrator for <strong>Manage Infrastructure</strong> permission to add or edit records.</div>}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {domains.map(d => <RecordCard key={d.id} icon={<Globe className="h-4 w-4 text-blue-600"/>} title={d.domainName} lines={[`Project: ${projectName(d.projectId)}`, `Registrar: ${d.registrar}`, `Renewal: ${d.renewalDate}`, `Responsible: ${d.responsiblePerson}`]} onEdit={() => startEdit('domain', d)} onDelete={() => remove('domain', d.id, d.domainName)} canEdit={canManage} canDelete={canDelete}/>)}
      {hosting.map(h => <RecordCard key={h.id} icon={<Server className="h-4 w-4 text-emerald-600"/>} title={`${h.hostingProvider}${h.hostingPlan ? ` — ${h.hostingPlan}` : ''}`} lines={[`Project: ${projectName(h.projectId)}`, `IP: ${h.serverIp || '—'}`, `Renewal: ${h.renewalDate}`, `Responsible: ${h.responsiblePerson}`]} onEdit={() => startEdit('hosting', h)} onDelete={() => remove('hosting', h.id, h.hostingProvider)} canEdit={canManage} canDelete={canDelete}/>)}
      {ssl.map(s => <RecordCard key={s.id} icon={<ShieldCheck className="h-4 w-4 text-amber-600"/>} title={`SSL — ${s.provider}`} lines={[`Project: ${projectName(s.projectId)}`, `Expiry: ${s.expiryDate}`, `Auto renew: ${s.autoRenew ? 'Yes' : 'No'}`, `Responsible: ${s.responsiblePerson}`]} onEdit={() => startEdit('ssl', s)} onDelete={() => remove('ssl', s.id, s.provider)} canEdit={canManage} canDelete={canDelete}/>)}
      {repos.map(r => <RecordCard key={r.id} icon={<GitBranch className="h-4 w-4 text-purple-600"/>} title={r.repositoryOwner} lines={[`Project: ${projectName(r.projectId)}`, r.githubUrl, `Main: ${r.mainBranch} • Dev: ${r.developmentBranch}`, `Developer: ${r.responsibleDeveloper}`]} onEdit={() => startEdit('repository', r)} onDelete={() => remove('repository', r.id, r.repositoryOwner)} canEdit={canManage} canDelete={canDelete}/>)}
      {deployments.map(d => <RecordCard key={d.id} icon={<Rocket className="h-4 w-4 text-indigo-600"/>} title={d.deploymentProvider} lines={[`Project: ${projectName(d.projectId)}`, `Production: ${d.productionUrl || '—'}`, `Staging: ${d.stagingUrl || '—'}`, `Responsible: ${d.responsiblePerson}`]} onEdit={() => startEdit('deployment', d)} onDelete={() => remove('deployment', d.id, d.deploymentProvider)} canEdit={canManage} canDelete={canDelete}/>)}
    </div>
  </div>;
};
const RecordCard = ({ icon, title, lines, onEdit, onDelete, canEdit, canDelete }) => (<div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm">
    <div className="flex items-start justify-between gap-3"><h4 className="flex min-w-0 items-start gap-2 break-words text-sm font-bold text-slate-900">{icon}{title}</h4><div className="flex shrink-0 gap-1">{canEdit && <button onClick={onEdit} className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50" title="Edit"><Pencil className="h-4 w-4"/></button>}{canDelete && <button onClick={onDelete} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 className="h-4 w-4"/></button>}</div></div>
    <div className="mt-2 space-y-1">{lines.map((x, i) => <p key={i} className="break-all">{x}</p>)}</div>
  </div>);
